export class ResizeTimeoutError extends Error {
    constructor(timeoutMs) {
        super(`Image resize invoke exceeded ${timeoutMs}ms`);
        this.name = 'ResizeTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
