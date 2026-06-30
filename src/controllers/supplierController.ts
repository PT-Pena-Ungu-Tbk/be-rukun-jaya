import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            select: {
                id: true,
                name: true,
                contact_info: true
            }
        });

        return res.status(200).json({
            success: true,
            message: "Data supplier berhasil diambil.",
            data: suppliers
        });
    } catch (error) {
        console.error("Get Suppliers Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server gagal mengambil data supplier."
        });
    }
};
