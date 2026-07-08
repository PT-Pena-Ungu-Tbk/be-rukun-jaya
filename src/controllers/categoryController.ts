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

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Nama kategori wajib diisi.' });

        const category = await prisma.category.create({ data: { name } });
        return res.status(201).json({ status: 'success', data: category });
    } catch (error) {
        console.error("Create Category Error:", error);
        return res.status(500).json({ status: 'error', message: 'Gagal membuat kategori.' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name } = req.body;
        if (!name) return res.status(400).json({ status: 'error', message: 'Nama kategori wajib diisi.' });

        const category = await prisma.category.update({
            where: { id },
            data: { name }
        });
        return res.status(200).json({ status: 'success', data: category });
    } catch (error) {
        console.error("Update Category Error:", error);
        return res.status(500).json({ status: 'error', message: 'Gagal mengubah kategori.' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // Check if category is used by products
        const productsCount = await prisma.product.count({ where: { category_id: id } });
        if (productsCount > 0) {
            return res.status(400).json({ status: 'error', message: 'Gagal menghapus: Kategori sedang digunakan oleh produk.' });
        }

        await prisma.category.delete({ where: { id } });
        return res.status(200).json({ status: 'success', message: 'Kategori berhasil dihapus.' });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return res.status(500).json({ status: 'error', message: 'Gagal menghapus kategori.' });
    }
};
