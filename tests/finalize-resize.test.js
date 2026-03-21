import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let selectChain;
let selectMock = vi.fn();
let insertValuesMock = vi.fn();
let insertMock = vi.fn();
let updateMock = vi.fn();
let headObjectMock = vi.fn();
let invokeMock = vi.fn();
let finalizeRecipeUploadAction;
let ResizeTimeoutError;
let updateSetCalls = [];
let consoleWarnMock;
const originalDisableUploadsEnv = process.env.NEXT_PUBLIC_DISABLE_UPLOADS;

vi.mock('../lib/auth.js', () => ({
    requireUser: () =>
        Promise.resolve({
            user: {
                id: 3,
                email: 'owner@example.com'
            }
        })
}));

vi.mock('../lib/oci/functionsInvoke.js', () => ({
    invokeImageResizeFunction: (...args) => invokeMock(...args)
}));

vi.mock('../lib/oci/objectStorage.js', () => ({
    getObjectStorageClientFromEnv: () => ({}),
    getObjectStorageNamespaceFromEnv: () => 'namespace',
    headObject: (...args) => headObjectMock(...args)
}));

vi.mock('../db/index.ts', () => ({
    db: {
        select: (...args) => selectMock(...args),
        insert: (...args) => insertMock(...args),
        update: (...args) => updateMock(...args)
    }
}));

describe('finalizeRecipeUploadAction resize orchestration', () => {
    beforeEach(async () => {
        vi.resetModules();
        if (originalDisableUploadsEnv == null) {
            delete process.env.NEXT_PUBLIC_DISABLE_UPLOADS;
        } else {
            process.env.NEXT_PUBLIC_DISABLE_UPLOADS = originalDisableUploadsEnv;
        }
        updateSetCalls = [];
        headObjectMock = vi.fn();
        invokeMock = vi.fn();
        selectChain = {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn(() => Promise.resolve([{ authorId: 3, smallUrl: null }]))
        };
        selectMock = vi.fn(() => selectChain);
        insertValuesMock = vi.fn(() => ({ onConflictDoNothing: () => Promise.resolve([]) }));
        insertMock = vi.fn(() => ({ values: insertValuesMock }));
        updateMock = vi.fn(() => ({
            set: (values) => {
                updateSetCalls.push(values);
                return { where: () => Promise.resolve([]) };
            }
        }));
        const actions = await import('../app/upload/actions.js');
        const errors = await import('../app/upload/errors.js');
        finalizeRecipeUploadAction = actions.finalizeRecipeUploadAction;
        ResizeTimeoutError = errors.ResizeTimeoutError;
        headObjectMock.mockReset();
        invokeMock.mockReset();
        selectChain.from.mockClear();
        selectChain.where.mockClear();
        selectChain.limit.mockClear();
        insertMock.mockClear();
        insertValuesMock.mockClear();
        consoleWarnMock?.mockRestore?.();
        consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleWarnMock?.mockRestore?.();
    });

    it('sets smallUrl after resize + verify', async () => {
        const objectKey = 'authors/foo/recipes/img.jpg';
        headObjectMock
            .mockResolvedValueOnce({ contentLength: 100 })
            .mockResolvedValueOnce({ contentLength: 10 });
        invokeMock.mockResolvedValue({ ok: true });

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 1,
                imageId: 2,
                authorId: 3,
                shouldCreateRecipe: true,
                objectKey,
                originalFileSize: 100
            }
        });

        expect(updateSetCalls.length).toBe(2);
        expect(updateSetCalls[1]).toEqual({ smallUrl: `/assets/images/600/${objectKey}` });
        expect(result.resizeAttempted).toBe(true);
        expect(result.resizeSucceeded).toBe(true);
        expect(result.resizeSkipped).toBe(false);
    });

    it('rejects finalize when uploads are disabled', async () => {
        process.env.NEXT_PUBLIC_DISABLE_UPLOADS = 'true';

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 1,
                imageId: 2,
                authorId: 3,
                shouldCreateRecipe: true,
                objectKey: 'authors/foo/recipes/img.jpg',
                originalFileSize: 100
            }
        });

        expect(result).toEqual({
            ok: false,
            error: 'Uploads are disabled right now.'
        });
        expect(selectMock).not.toHaveBeenCalled();
        expect(insertMock).not.toHaveBeenCalled();
        expect(updateMock).not.toHaveBeenCalled();
        expect(headObjectMock).not.toHaveBeenCalled();
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it('continues when invoke fails', async () => {
        const objectKey = 'authors/bar/recipes/img2.jpg';
        headObjectMock.mockResolvedValueOnce({ contentLength: 50 });
        invokeMock.mockRejectedValue(new Error('invoke-failed'));

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 1,
                imageId: 2,
                authorId: 3,
                shouldCreateRecipe: false,
                objectKey,
                originalFileSize: 50
            }
        });

        expect(result.resizeAttempted).toBe(true);
        expect(result.resizeSucceeded).toBe(false);
        expect(result.resizeSkipped).toBe(false);
        expect(updateSetCalls.length).toBe(1);
        expect(consoleWarnMock).toHaveBeenCalledTimes(1);
        const warnPayload = consoleWarnMock.mock.calls[0][1];
        expect(warnPayload).toEqual(expect.objectContaining({ imageId: 2 }));
    });

    it('logs structured warning for non-Error invoke rejects and continues gracefully', async () => {
        const objectKey = 'authors/object/recipes/img5.jpg';
        headObjectMock.mockResolvedValueOnce({ contentLength: 70 });
        const rejectReason = { message: 'boom object', metadata: { code: 422, stage: 'resize' } };
        invokeMock.mockRejectedValue(rejectReason);

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 4,
                imageId: 5,
                authorId: 3,
                shouldCreateRecipe: true,
                objectKey,
                originalFileSize: 70
            }
        });

        expect(result.ok).toBe(true);
        expect(result.resizeAttempted).toBe(true);
        expect(result.resizeSucceeded).toBe(false);
        expect(result.resizeSkipped).toBe(false);
        expect(consoleWarnMock).toHaveBeenCalledTimes(1);
        const payload = consoleWarnMock.mock.calls[0][1];
        expect(payload).toEqual(
            expect.objectContaining({
                message: rejectReason.message,
                errorType: 'invoke_error'
            })
        );
        expect(payload.details).toEqual(
            expect.objectContaining({
                metadata: expect.objectContaining({ code: 422 })
            })
        );
    });

    it('logs structured warning for Error rejects with cause metadata and continues gracefully', async () => {
        const objectKey = 'authors/cause/recipes/img6.jpg';
        headObjectMock.mockResolvedValueOnce({ contentLength: 80 });
        const causeDetails = { metadata: { code: 409, source: 'cause' } };
        const error = new Error('boom error');
        error.cause = causeDetails;
        invokeMock.mockRejectedValue(error);

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 6,
                imageId: 7,
                authorId: 3,
                shouldCreateRecipe: false,
                objectKey,
                originalFileSize: 80
            }
        });

        expect(result.ok).toBe(true);
        expect(result.resizeAttempted).toBe(true);
        expect(result.resizeSucceeded).toBe(false);
        expect(result.resizeSkipped).toBe(false);
        expect(consoleWarnMock).toHaveBeenCalledTimes(1);
        const payload = consoleWarnMock.mock.calls[0][1];
        expect(payload).toEqual(
            expect.objectContaining({
                message: error.message,
                errorType: 'invoke_error'
            })
        );
        expect(payload.details).toEqual(
            expect.objectContaining({
                cause: expect.objectContaining({
                    metadata: expect.objectContaining({ code: 409 })
                })
            })
        );
    });

    it('skips resize when smallUrl already exists', async () => {
        const objectKey = 'authors/skip/recipes/img3.jpg';
        selectChain.limit.mockResolvedValueOnce([{ authorId: 3, smallUrl: '/assets/images/1200/exists.jpg' }]);
        headObjectMock.mockResolvedValueOnce({ contentLength: 20 });

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 1,
                imageId: 2,
                authorId: 3,
                shouldCreateRecipe: true,
                objectKey,
                originalFileSize: 20
            }
        });

        expect(invokeMock).not.toHaveBeenCalled();
        expect(result.resizeAttempted).toBe(false);
        expect(result.resizeSucceeded).toBe(true);
        expect(result.resizeSkipped).toBe(true);
    });

    it('treats timeouts as graceful failures', async () => {
        const objectKey = 'authors/timeout/recipes/img4.jpg';
        headObjectMock.mockResolvedValueOnce({ contentLength: 60 });
        invokeMock.mockRejectedValue(new ResizeTimeoutError(1));

        const result = await finalizeRecipeUploadAction({
            parameters: {
                recipeId: 1,
                imageId: 2,
                authorId: 3,
                shouldCreateRecipe: false,
                objectKey,
                originalFileSize: 60
            }
        });

        expect(result.resizeAttempted).toBe(true);
        expect(result.resizeSucceeded).toBe(false);
        expect(result.resizeSkipped).toBe(false);
        expect(updateSetCalls.length).toBe(1);
    });
});
