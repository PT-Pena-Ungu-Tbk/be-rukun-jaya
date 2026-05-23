// src/middlewares/authMiddleware.js

// Middleware untuk mengecek apakah user sudah login (punya token)
const verifyToken = (req, res, next) => {
    // TODO: Implementasi ekstraksi dan verifikasi JWT akan ditambahkan di sini
    console.log("Mengecek token JWT...");
    next(); 
};

// Middleware untuk memblokir Kasir dari endpoint khusus Pemilik
const isOwner = (req, res, next) => {
    // TODO: Implementasi pengecekan role dari token
    const userRole = req.user?.role; // Asumsi data user disisipkan ke req dari verifikasi token

    if (userRole !== 'Owner') {
        return res.status(403).json({
            status: 'error',
            message: 'Akses Ditolak / 403 Forbidden'
        });
    }
    
    next();
};

module.exports = {
    verifyToken,
    isOwner
};