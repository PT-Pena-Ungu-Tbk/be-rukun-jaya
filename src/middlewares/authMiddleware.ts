import { Request, Response, NextFunction } from 'express';
// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

// Secret key untuk membaca token
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET environment variable is not defined");
}

export interface AuthRequest extends Request {
    user?: any;
}

// 1. Middleware untuk mengekstrak dan memverifikasi Token JWT
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: "error",
            message: "Akses Ditolak. Token tidak disediakan atau format salah."
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Akses Ditolak. Token tidak valid atau sudah kedaluwarsa."
        });
    }
};

export const hasRoles = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                status_code: 403,
                error_code: "FORBIDDEN",
                message: "Akses Ditolak. Hak akses tidak ditemukan."
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                status_code: 403,
                error_code: "FORBIDDEN",
                message: "Akses Ditolak. Anda tidak memiliki izin untuk tindakan ini."
            });
        }

        next();
    };
};

export const isOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({
            status: "error",
            message: "Akses Ditolak. Hanya Owner yang dapat mengakses resource ini."
        });
    }
    next();
};