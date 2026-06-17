import { Request, Response, NextFunction } from 'express';
// src/controllers/memberController.js
import prisma from '../utils/prismaClient';

const verifyMember = async (req: Request, res: Response) => {
    try {
        // Mengambil nomor HP dari query parameter (contoh: /verify?phone=08123456789)
        const phone = req.query.phone as string;

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
                // Note: The members table does not have a created_at field in the schema,
                // so we cast to any here to retain compatibility with the expected response format.
                join_date: (member as any).created_at
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

export { 
    verifyMember
 };