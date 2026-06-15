// src/controllers/memberController.js
const prisma = require('../utils/prismaClient');

const verifyMember = async (req, res) => {
    try {
        // Mengambil nomor HP dari query parameter (contoh: /verify?phone=08123456789)
        const { phone } = req.query;

        // Validasi input
        if (!phone) {
            return res.status(400).json({
                status: "error",
                message: "Parameter 'phone' (nomor handphone) wajib disertakan."
            });
        }

        // Mencari data pelanggan di database berdasarkan nomor HP
        const member = await prisma.member.findFirst({
            where: { phone_number: phone }
        });

        // Sesuai API Contract, kembalikan 404 jika tidak ditemukan
        if (!member) {
            return res.status(404).json({
                status: "error",
                message: "Pelanggan VIP dengan nomor tersebut tidak ditemukan."
            });
        }

        // Jika ditemukan, kembalikan profil pelanggan
        return res.status(200).json({
            status: "success",
            data: {
                id: member.id,
                name: member.name,
                phone_number: member.phone_number,
                join_date: member.created_at
            }
        });

    } catch (error) {
        console.error("Verify Member Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan internal pada server saat memverifikasi member."
        });
    }
};

module.exports = {
    verifyMember
};