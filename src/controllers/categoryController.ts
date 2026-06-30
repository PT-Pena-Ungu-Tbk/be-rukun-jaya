import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        
        return res.status(200).json({
            status: 'success',
            data: categories
        });
    } catch (error) {
        console.error("Get Categories Error:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengambil daftar kategori.'
        });
    }
};
