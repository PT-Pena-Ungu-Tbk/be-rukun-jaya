import { Request, Response, NextFunction } from 'express';
// src/controllers/memberController.js
import prisma from '../utils/prismaClient';
import * as xlsx from 'xlsx';

const verifyMember = async (req: Request, res: Response) => {
    try {
        // Mengambil nomor HP dari body JSON (POST) atau query parameter (GET) sebagai fallback
        // Gunakan optional chaining (?.) karena pada request GET murni, req.body bisa bernilai undefined
        const phone = (req.body?.phone || req.query?.phone) as string;

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

export const getVipMembers = async (req: Request, res: Response) => {
    try {
        const { level, q, sort_by = 'poin', sort_order = 'desc', page = '1', limit = '10' } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const whereClause: any = {};
        if (level && level !== 'all') {
            whereClause.level = level as string;
        }
        if (q) {
            whereClause.OR = [
                { name: { contains: q as string, mode: 'insensitive' } },
                { phone_number: { contains: q as string } }
            ];
        }

        const orderByClause: any = {};
        if (sort_by === 'poin') orderByClause.poin = sort_order;
        else if (sort_by === 'join_date') orderByClause.created_at = sort_order;
        else if (sort_by === 'last_transaction') orderByClause.transactions = { _count: sort_order }; // Simplified

        const [total_members, members, all_members_aggr] = await Promise.all([
            prisma.member.count({ where: whereClause }),
            prisma.member.findMany({
                where: whereClause,
                orderBy: Object.keys(orderByClause).length ? orderByClause : { poin: 'desc' },
                skip,
                take,
                include: {
                    transactions: {
                        orderBy: { created_at: 'desc' },
                        take: 1
                    }
                }
            }),
            prisma.member.aggregate({
                _sum: { poin: true },
                _count: { id: true }
            })
        ]);

        const items = members.map(m => ({
            member_id: m.id,
            nama: m.name,
            phone_number: m.phone_number,
            level: m.level,
            poin: m.poin,
            join_date: m.created_at,
            last_transaction: m.transactions.length > 0 ? m.transactions[0].created_at : null
        }));

        return res.status(200).json({
            stats: {
                total_members: all_members_aggr._count.id,
                active_members: items.filter(i => i.last_transaction).length, // simplified estimation
                total_poin_issued: all_members_aggr._sum.poin || 0
            },
            items
        });
    } catch (error) {
        console.error("Get VIP Members Error:", error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal' });
    }
};

export const createVipMember = async (req: Request, res: Response) => {
    try {
        const { name, nama, phone_number, level = 'Bronze', poin_awal = 0 } = req.body;
        const memberName = name || nama;

        if (!memberName || !phone_number) {
            return res.status(400).json({ status: 'error', message: 'Nama dan nomor HP wajib diisi' });
        }

        if (String(memberName).length < 3) {
            return res.status(400).json({ status: 'error', message: 'Nama member minimal 3 karakter.' });
        }

        const phoneRegex = /^08[0-9]{8,13}$/;
        if (!phoneRegex.test(String(phone_number))) {
            return res.status(400).json({ status: 'error', message: 'Format nomor HP tidak valid. Wajib diawali 08 dan terdiri dari 10-15 digit angka.' });
        }

        if (Number(poin_awal) < 0) {
            return res.status(400).json({ status: 'error', message: 'Poin awal tidak boleh negatif.' });
        }

        const existingMember = await prisma.member.findUnique({ where: { phone_number } });
        if (existingMember) {
            return res.status(409).json({ status: 'error', message: 'Nomor HP sudah terdaftar', error_code: 'PHONE_ALREADY_REGISTERED' });
        }

        const newMember = await prisma.member.create({
            data: {
                name: memberName,
                phone_number,
                level,
                poin: Number(poin_awal)
            }
        });

        return res.status(201).json({
            member_id: newMember.id,
            nama: newMember.name,
            level: newMember.level,
            poin: newMember.poin,
            join_date: newMember.created_at
        });
    } catch (error) {
        console.error("Create VIP Member Error:", error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal' });
    }
};

export const redeemPoints = async (req: Request, res: Response) => {
    try {
        const member_id = req.params.member_id as string;
        const { poin_ditukar, jenis_penukaran, transaction_id } = req.body;

        if (!poin_ditukar || !jenis_penukaran) {
            return res.status(400).json({ status: 'error', message: 'Poin ditukar dan jenis penukaran wajib diisi' });
        }

        const member = await prisma.member.findUnique({ where: { id: member_id } });
        if (!member) {
            return res.status(404).json({ status: 'error', message: 'Member tidak ditemukan', error_code: 'MEMBER_NOT_FOUND' });
        }

        if (member.poin < Number(poin_ditukar)) {
            return res.status(400).json({ status: 'error', message: 'Poin tidak mencukupi', error_code: 'INSUFFICIENT_POINTS' });
        }

        const updatedMember = await prisma.member.update({
            where: { id: member_id },
            data: { poin: { decrement: Number(poin_ditukar) } }
        });

        return res.status(200).json({
            status: 'success',
            message: 'Poin berhasil ditukarkan',
            sisa_poin: updatedMember.poin
        });
    } catch (error) {
        console.error("Redeem Points Error:", error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal' });
    }
};

export const exportVipMembers = async (req: Request, res: Response) => {
    try {
        const members = await prisma.member.findMany({
            orderBy: { poin: 'desc' }
        });

        const data = members.map(m => ({
            'ID Member': m.id,
            'Nama Lengkap': m.name,
            'Nomor HP': m.phone_number,
            'Status': m.status,
            'Level VIP': m.level,
            'Poin': m.poin,
            'Tanggal Daftar': m.created_at.toISOString().split('T')[0]
        }));

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data VIP Member');

        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename="data-vip-member.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (error) {
        console.error("Export VIP Members Error:", error);
        return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat mengekspor data' });
    }
};

export { 
    verifyMember
 };