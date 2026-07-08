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

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const { name, contact_info } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi.' });

        const supplier = await prisma.supplier.create({
            data: { name, contact_info }
        });
        
        return res.status(201).json({ success: true, message: 'Supplier berhasil dibuat.', data: supplier });
    } catch (error) {
        console.error("Create Supplier Error:", error);
        return res.status(500).json({ success: false, message: 'Gagal membuat supplier.' });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, contact_info } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi.' });

        const supplier = await prisma.supplier.update({
            where: { id },
            data: { name, contact_info }
        });
        
        return res.status(200).json({ success: true, message: 'Supplier berhasil diubah.', data: supplier });
    } catch (error) {
        console.error("Update Supplier Error:", error);
        return res.status(500).json({ success: false, message: 'Gagal mengubah supplier.' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // Check if supplier is used by products
        const productsCount = await prisma.product.count({ where: { supplier_id: id } });
        if (productsCount > 0) {
            return res.status(400).json({ success: false, message: 'Gagal menghapus: Supplier sedang digunakan oleh produk.' });
        }

        await prisma.supplier.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Supplier berhasil dihapus.' });
    } catch (error) {
        console.error("Delete Supplier Error:", error);
        return res.status(500).json({ success: false, message: 'Gagal menghapus supplier.' });
    }
};
