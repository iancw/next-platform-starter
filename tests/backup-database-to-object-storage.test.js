import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    buildBackupObjectKey,
    createDatabaseBackup,
    getBackupConfig
} from '../scripts/backup-database-to-object-storage.mjs';

const baseEnv = {
    NETLIFY_DATABASE_URL: 'postgres://backup_user:secret@example.com:5432/OM Recipes Prod',
    OCI_DB_BACKUP_BUCKET: 'db-backups-bucket',
    OCI_DB_BACKUP_PREFIX: 'nightly/manual',
    OCI_TENANCY_OCID: 'tenancy',
    OCI_USER_OCID: 'user',
    OCI_FINGERPRINT: 'fingerprint',
    OCI_PRIVATE_KEY_B64: Buffer.from('private-key').toString('base64'),
    OCI_REGION: 'us-ashburn-1',
    OCI_OBJECT_STORAGE_NAMESPACE: 'namespace'
};

let tempDirs = [];

afterEach(async () => {
    await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
    tempDirs = [];
});

describe('backup-database-to-object-storage', () => {
    it('builds unique timestamped backup keys and applies the configured prefix', () => {
        const earlier = buildBackupObjectKey({
            databaseUrl: baseEnv.NETLIFY_DATABASE_URL,
            prefix: baseEnv.OCI_DB_BACKUP_PREFIX,
            now: new Date('2026-04-09T02:03:04Z')
        });
        const later = buildBackupObjectKey({
            databaseUrl: baseEnv.NETLIFY_DATABASE_URL,
            prefix: baseEnv.OCI_DB_BACKUP_PREFIX,
            now: new Date('2026-04-09T02:03:05Z')
        });

        expect(earlier).toBe('nightly/manual/2026/04/09/2026-04-09T02-03-04Z-om-recipes-prod.dump');
        expect(later).toBe('nightly/manual/2026/04/09/2026-04-09T02-03-05Z-om-recipes-prod.dump');
        expect(later).not.toBe(earlier);
    });

    it('rejects missing backup configuration before running', () => {
        expect(() =>
            getBackupConfig({
                NETLIFY_DATABASE_URL: '',
                OCI_DB_BACKUP_BUCKET: '',
                OCI_TENANCY_OCID: '',
                OCI_USER_OCID: '',
                OCI_FINGERPRINT: '',
                OCI_PRIVATE_KEY_B64: '',
                OCI_REGION: '',
                OCI_OBJECT_STORAGE_NAMESPACE: ''
            })
        ).toThrow(/Missing required env vars:/);
    });

    it('fails when pg_dump preflight fails', async () => {
        await expect(
            createDatabaseBackup({
                env: baseEnv,
                ensurePgDumpAvailableFn: vi.fn(async () => {
                    throw new Error('pg_dump missing');
                })
            })
        ).rejects.toThrow('pg_dump missing');
    });

    it('cleans up the temporary dump directory when upload fails', async () => {
        const rootTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'om-recipes-backup-test-'));
        tempDirs.push(rootTempDir);
        let createdTempDir = null;
        const rmFn = vi.fn(async (target, options) => fs.rm(target, options));

        await expect(
            createDatabaseBackup({
                env: baseEnv,
                now: new Date('2026-04-09T02:03:04Z'),
                tmpDir: rootTempDir,
                ensurePgDumpAvailableFn: vi.fn(async () => {}),
                mkdtempFn: async (prefix) => {
                    createdTempDir = await fs.mkdtemp(prefix);
                    return createdTempDir;
                },
                runPgDumpFn: async ({ outputPath }) => {
                    await fs.writeFile(outputPath, 'fake backup bytes');
                },
                getObjectStorageClientFromEnvFn: vi.fn(() => ({ kind: 'client' })),
                getObjectStorageNamespaceFromEnvFn: vi.fn(() => 'namespace'),
                putObjectFromFileFn: vi.fn(async () => {
                    throw new Error('upload failed');
                }),
                rmFn
            })
        ).rejects.toThrow('upload failed');

        expect(rmFn).toHaveBeenCalledTimes(1);
        expect(createdTempDir).not.toBeNull();
        await expect(fs.access(createdTempDir)).rejects.toThrow();
    });
});
