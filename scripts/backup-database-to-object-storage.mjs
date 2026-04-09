import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import dotenv from 'dotenv';

import {
    getMissingObjectStorageEnvVars,
    getObjectStorageClientFromEnv,
    getObjectStorageNamespaceFromEnv,
    putObjectFromFile
} from '../lib/oci/objectStorage.js';

const execFileAsync = promisify(execFile);

export const DEFAULT_BACKUP_PREFIX = 'db-backups';

export function loadLocalEnv({ cwd = process.cwd(), dotenvConfig = dotenv.config } = {}) {
    return dotenvConfig({ path: path.join(cwd, '.env.local') });
}

export function sanitizePathSegment(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function normalizeBackupPrefix(prefix) {
    const trimmed = String(prefix ?? DEFAULT_BACKUP_PREFIX).trim();
    const rawSegments = trimmed.split('/').map((segment) => sanitizePathSegment(segment));
    const segments = rawSegments.filter(Boolean);
    return segments.length > 0 ? segments.join('/') : DEFAULT_BACKUP_PREFIX;
}

export function deriveDatabaseNameFromUrl(databaseUrl) {
    const url = new URL(databaseUrl);
    const pathname = decodeURIComponent(url.pathname || '').replace(/^\/+/, '');
    const dbName = pathname.split('/').filter(Boolean).at(-1) || 'database';
    return sanitizePathSegment(dbName) || 'database';
}

export function formatBackupTimestamp(now = new Date()) {
    return now.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

export function buildBackupObjectKey({ databaseUrl, prefix = DEFAULT_BACKUP_PREFIX, now = new Date() }) {
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const timestamp = formatBackupTimestamp(now);
    const databaseName = deriveDatabaseNameFromUrl(databaseUrl);
    return `${normalizeBackupPrefix(prefix)}/${year}/${month}/${day}/${timestamp}-${databaseName}.dump`;
}

export function getBackupConfig(env = process.env) {
    const missing = [
        ...new Set(
            ['NETLIFY_DATABASE_URL', 'OCI_DB_BACKUP_BUCKET']
                .filter((name) => !env[name])
                .concat(getMissingObjectStorageEnvVars(env))
        )
    ];

    if (missing.length > 0) {
        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    return {
        databaseUrl: env.NETLIFY_DATABASE_URL,
        bucketName: env.OCI_DB_BACKUP_BUCKET,
        prefix: normalizeBackupPrefix(env.OCI_DB_BACKUP_PREFIX)
    };
}

export async function ensurePgDumpAvailable({ execFileFn = execFileAsync } = {}) {
    try {
        await execFileFn('pg_dump', ['--version']);
    } catch (error) {
        throw new Error(`pg_dump is required but unavailable: ${error?.message || String(error)}`);
    }
}

export async function runPgDump({ databaseUrl, outputPath, execFileFn = execFileAsync, env = process.env }) {
    try {
        await execFileFn(
            'pg_dump',
            ['--format=custom', '--file', outputPath, '--dbname', databaseUrl],
            { env }
        );
    } catch (error) {
        const detail = error?.stderr?.trim() || error?.message || String(error);
        throw new Error(`pg_dump failed: ${detail}`);
    }
}

export async function createDatabaseBackup({
    env = process.env,
    now = new Date(),
    tmpDir = os.tmpdir(),
    ensurePgDumpAvailableFn = ensurePgDumpAvailable,
    runPgDumpFn = runPgDump,
    mkdtempFn = fs.mkdtemp,
    statFn = fs.stat,
    rmFn = fs.rm,
    getObjectStorageClientFromEnvFn = getObjectStorageClientFromEnv,
    getObjectStorageNamespaceFromEnvFn = getObjectStorageNamespaceFromEnv,
    putObjectFromFileFn = putObjectFromFile
} = {}) {
    const config = getBackupConfig(env);
    const objectKey = buildBackupObjectKey({
        databaseUrl: config.databaseUrl,
        prefix: config.prefix,
        now
    });

    await ensurePgDumpAvailableFn();

    const tempDir = await mkdtempFn(path.join(tmpDir, 'om-recipes-db-backup-'));
    const dumpFilePath = path.join(tempDir, path.basename(objectKey));

    try {
        await runPgDumpFn({
            databaseUrl: config.databaseUrl,
            outputPath: dumpFilePath,
            env
        });

        const stats = await statFn(dumpFilePath);
        const client = getObjectStorageClientFromEnvFn(env);
        const namespaceName = getObjectStorageNamespaceFromEnvFn(env);

        await putObjectFromFileFn({
            client,
            namespaceName,
            bucketName: config.bucketName,
            objectName: objectKey,
            filePath: dumpFilePath
        });

        return {
            bucketName: config.bucketName,
            objectKey,
            sizeBytes: stats.size,
            createdAt: now.toISOString(),
            databaseName: deriveDatabaseNameFromUrl(config.databaseUrl)
        };
    } finally {
        await rmFn(tempDir, { recursive: true, force: true });
    }
}

export async function main({
    env = process.env,
    log = console.log,
    errorLog = console.error
} = {}) {
    loadLocalEnv();

    try {
        const backup = await createDatabaseBackup({ env });
        log(`Backup uploaded successfully.`);
        log(`Bucket: ${backup.bucketName}`);
        log(`Object key: ${backup.objectKey}`);
        log(`Database: ${backup.databaseName}`);
        log(`Size bytes: ${backup.sizeBytes}`);
        log(`Created at: ${backup.createdAt}`);
        return backup;
    } catch (error) {
        errorLog(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
        return null;
    }
}

const modulePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath === modulePath) {
    await main();
}
