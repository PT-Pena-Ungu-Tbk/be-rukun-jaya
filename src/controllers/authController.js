// src/controllers/authController.js
const prisma = require('../utils/prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_toko_rukun_jaya_123';

const login = async (req, res) => {
    try {
        // 1. Ekstraksi email dan password dari request body Frontend
        const { email, password } = req.body;

        // 2. Cari user di database berdasarkan email
        const user = await prisma.user.findFirst({
            where: { email: email }
        });

        // 3. Jika user tidak ditemukan, kembalikan error 401 sesuai API Contract
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Kredensial yang Anda masukkan salah atau tidak cocok."
            });
        }

        // 4. Bandingkan password input dengan password_hash di database
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        // Jika password salah, kembalikan pesan error yang persis sama
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "error",
                message: "Kredensial yang Anda masukkan salah atau tidak cocok."
            });
        }

        // 5. Jika valid, buatkan Token JWT yang berisi ID dan Role
        const tokenPayload = {
            id: user.id,
            role: user.role
        };
        // Token diset kedaluwarsa dalam 8 jam (1 shift kerja)
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        // 6. Kembalikan Response Sukses sesuai API Contract
        return res.status(200).json({
            status: "success",
            data: {
                token: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        // Error handling wajib sesuai pedoman pengembangan (Development Guidelines)
        console.error("Error pada proses login:", error);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan internal pada server saat memproses autentikasi."
        });
    }
};

module.exports = {
    login
};