export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;
        
        // Mempertahankan stack trace (untuk Node.js / V8)
        Error.captureStackTrace(this, this.constructor);
    }
}
