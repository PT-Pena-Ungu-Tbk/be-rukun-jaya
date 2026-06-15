// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// Secret key untuk membaca token
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_toko_rukun_jaya_123';

// 1. Middleware untuk mengekstrak dan memverifikasi Token JWT
const verifyToken = (req, res, next) => {
    // Klien (Frontend) biasanya mengirim token di header dengan format: "Bearer <token_acak>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Jika Kasir/Pemilik belum login sama sekali (tidak bawa token)
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Akses Ditolak: Anda belum login'
        });
    }

    try {
        // Membaca isi token menggunakan kunci rahasia
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Menyisipkan data pengguna dari dalam token ke request, agar bisa dipakai oleh controller
        req.user = decoded; 
        
        // Jika token valid, izinkan request lewat
        next(); 
    } catch (error) {
        // Jika token sudah expired atau hasil manipulasi orang iseng
        return res.status(403).json({
            status: 'error',
            message: 'Akses Ditolak: Sesi Anda tidak valid atau sudah kedaluwarsa'
        });
    }
};

// 2. Middleware khusus untuk memblokir Kasir (Mewujudkan Acceptance Criteria AC-05)
const isOwner = (req, res, next) => {
    // Mengecek 'role' dari payload token yang sudah diekstrak oleh verifyToken di atas
    const userRole = req.user?.role;

    // Jika yang mencoba mengakses bukan Owner, langsung lempar status 403 Forbidden
    if (userRole !== 'OWNER') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses Ditolak / 403 Forbidden: Halaman ini khusus Pemilik Toko'
        });
    }
    
    // Jika benar Owner, izinkan lewat
    next();
};

module.exports = {
    verifyToken,
    isOwner
};