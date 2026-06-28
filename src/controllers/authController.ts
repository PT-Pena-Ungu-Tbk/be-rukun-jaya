import { Request, Response, NextFunction } from 'express';
// src/controllers/authController.ts
import prisma from '../utils/prismaClient';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET environment variable is not defined");
}

const login = async (req: Request, res: Response) => {
    try {
        const { email_or_username, password, remember_me } = req.body;

        if (!email_or_username || !password) {
            return res.status(400).json({
                success: false,
                status_code: 400,
                error_code: "INVALID_REQUEST",
                message: "Email atau Username dan Password wajib diisi."
            });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email_or_username },
                    { username: email_or_username }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                status_code: 401,
                error_code: "INVALID_CREDENTIALS",
                message: "Kredensial yang Anda masukkan salah atau tidak cocok."
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                status_code: 401,
                error_code: "INVALID_CREDENTIALS",
                message: "Kredensial yang Anda masukkan salah atau tidak cocok."
            });
        }

        const tokenPayload = {
            id: user.id,
            role: user.role
        };
        
        const expiresInSecs = remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: expiresInSecs });
        
        const refreshTokenPayload = { id: user.id, type: 'refresh' };
        const refreshToken = jwt.sign(refreshTokenPayload, JWT_SECRET, { expiresIn: '30d' });

        await prisma.user.update({
            where: { id: user.id },
            data: { refresh_token: refreshToken }
        });

        return res.status(200).json({
            success: true,
            status_code: 200,
            data: {
                access_token: accessToken,
                token_type: "Bearer",
                expires_in: expiresInSecs,
                refresh_token: refreshToken,
                user: {
                    id: user.id,
                    nama_lengkap: user.name,
                    email: user.email,
                    role: user.role,
                    permissions: ["pos.read", "pos.write", "inventory.read", "inventory.write", "reports.read", "accounts.manage", "audit.read"],
                    last_login: new Date().toISOString(),
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                }
            }
        });

    } catch (error) {
        console.error("Error pada proses login:", error);
        return res.status(500).json({
            success: false,
            status_code: 500,
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan internal pada server saat memproses autentikasi."
        });
    }
};

const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                status_code: 400,
                error_code: "INVALID_REQUEST",
                message: "refresh_token wajib disertakan."
            });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(refresh_token, JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                success: false,
                status_code: 401,
                error_code: "TOKEN_EXPIRED",
                message: "Refresh token sudah kadaluarsa atau tidak valid."
            });
        }

        const user = await prisma.user.findFirst({
            where: {
                id: decoded.id,
                refresh_token: refresh_token
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                status_code: 401,
                error_code: "TOKEN_INVALID",
                message: "Refresh token tidak valid atau sudah digunakan."
            });
        }

        const tokenPayload = {
            id: user.id,
            role: user.role
        };
        const expiresInSecs = 24 * 60 * 60;
        const newAccessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: expiresInSecs });

        return res.status(200).json({
            success: true,
            status_code: 200,
            data: {
                access_token: newAccessToken,
                expires_in: expiresInSecs
            }
        });
    } catch (error) {
        console.error("Error pada proses refresh token:", error);
        return res.status(500).json({
            success: false,
            status_code: 500,
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan internal pada server."
        });
    }
};

const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                status_code: 401,
                error_code: "UNAUTHORIZED",
                message: "Token tidak valid atau tidak disertakan."
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { refresh_token: null }
        });

        return res.status(200).json({
            success: true,
            status_code: 200,
            message: "Logout berhasil. Sesi telah diakhiri."
        });
    } catch (error) {
        console.error("Error pada proses logout:", error);
        return res.status(500).json({
            success: false,
            status_code: 500,
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Terjadi kesalahan internal pada server saat logout."
        });
    }
};

export {
    login,
    refreshToken,
    logout
};