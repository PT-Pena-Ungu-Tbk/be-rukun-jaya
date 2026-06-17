import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import bcrypt from 'bcrypt';

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
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const employee = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        if (!employee) {
            return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan' });
        }
        
        res.status(200).json({ status: 'success', data: employee });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        
        if (!name || !email || !password || !role) {
             return res.status(400).json({ status: 'error', message: 'Name, email, password, dan role harus diisi' });
        }
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
        }
        
        const password_hash = await bcrypt.hash(password, 10);
        const newEmployee = await prisma.user.create({
            data: { name, email, password_hash, role },
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        res.status(201).json({ status: 'success', data: newEmployee });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, email, password, role } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan' });
        }

        if (email && email !== existingUser.email) {
             const emailExists = await prisma.user.findUnique({ where: { email } });
             if (emailExists) {
                 return res.status(400).json({ status: 'error', message: 'Email sudah digunakan oleh pengguna lain' });
             }
        }
        
        const updateData: any = { name, email, role };
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }
        
        // Clean up undefined properties
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedEmployee = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, created_at: true }
        });
        
        res.status(200).json({ status: 'success', data: updatedEmployee });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ status: 'success', message: 'Karyawan berhasil dihapus' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ status: 'error', message: 'Karyawan tidak ditemukan' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};
