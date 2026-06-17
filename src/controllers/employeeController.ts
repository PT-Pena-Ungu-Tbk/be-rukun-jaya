import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import bcrypt from 'bcrypt';
import { AppError } from '../utils/AppError';
import { isValidUUID } from '../utils/validator';

export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const employees = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
            }
        });
        res.status(200).json({ status: 'success', data: employees });
    } catch (error: any) {
        console.error("Get All Employees Error:", error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat mengambil data.' });
    }
};

export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        if (!isValidUUID(id)) {
            throw new AppError('Format ID karyawan tidak valid.');
        }

        const employee = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        if (!employee) {
            throw new AppError('Karyawan tidak ditemukan', 404);
        }
        
        res.status(200).json({ status: 'success', data: employee });
    } catch (error: any) {
        console.error("Get Employee By ID Error:", error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat mengambil data karyawan.' });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
             throw new AppError('Name, email, password, dan role harus diisi', 400);
        }
        
        if (!['OWNER', 'CASHIER'].includes(role)) {
             throw new AppError('Role tidak valid. Gunakan OWNER atau CASHIER.', 400);
        }
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new AppError('Email sudah terdaftar', 409);
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        const newEmployee = await prisma.user.create({
            data: { name, email, password_hash, role },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        res.status(201).json({ status: 'success', data: newEmployee });
    } catch (error: any) {
        console.error("Create Employee Error:", error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat menambahkan karyawan.' });
    }
};

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (!isValidUUID(id)) {
            throw new AppError('Format ID karyawan tidak valid.');
        }

        const { name, email, password, role } = req.body;
        
        if (role && !['OWNER', 'CASHIER'].includes(role)) {
             throw new AppError('Role tidak valid. Gunakan OWNER atau CASHIER.', 400);
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            throw new AppError('Karyawan tidak ditemukan', 404);
        }

        if (email && email !== existingUser.email) {
             const emailExists = await prisma.user.findUnique({ where: { email } });
             if (emailExists) {
                 throw new AppError('Email sudah digunakan oleh pengguna lain', 409);
             }
        }
        
        const updateData: any = { name, email, role };
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }
        
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedEmployee = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        res.status(200).json({ status: 'success', data: updatedEmployee });
    } catch (error: any) {
        console.error("Update Employee Error:", error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat memperbarui data karyawan.' });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        if (!isValidUUID(id)) {
            throw new AppError('Format ID karyawan tidak valid.');
        }

        if (req.user && req.user.id === id) {
            throw new AppError('Tindakan Ditolak: Anda tidak dapat menghapus akun yang sedang Anda gunakan sendiri.', 400);
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            throw new AppError('Karyawan tidak ditemukan', 404);
        }

        await prisma.user.delete({ where: { id } });
        res.status(200).json({ status: 'success', message: 'Karyawan berhasil dihapus' });
    } catch (error: any) {
        console.error("Delete Employee Error:", error);
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ status: 'error', message: error.message });
        }
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat menghapus data karyawan.' });
    }
};
