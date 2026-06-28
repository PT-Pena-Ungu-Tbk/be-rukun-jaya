import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prismaClient';
import * as xlsx from 'xlsx';

const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {  userId, action, tableName, startDate, endDate, limit = 100  } = req.query as any;
    const where: any = {};

    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (tableName) where.table_name = tableName;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            status: 'error',
            message: 'Format startDate tidak valid. Gunakan YYYY-MM-DD.',
          });
        }
        start.setHours(0, 0, 0, 0);
        where.created_at.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            status: 'error',
            message: 'Format endDate tidak valid. Gunakan YYYY-MM-DD.',
          });
        }
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Number(limit),
    });

    return res.status(200).json({ status: 'success', data: auditLogs });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil audit log.',
    });
  }
};

const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const auditLog = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!auditLog) {
      return res.status(404).json({
        status: 'error',
        message: 'Audit log tidak ditemukan.',
      });
    }

    return res.status(200).json({ status: 'success', data: auditLog });
  } catch (error) {
    console.error('Get Audit Log By ID Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil detail audit log.',
    });
  }
};

const exportAuditLogsExcel = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, action } = req.query as any;

        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter startDate dan endDate wajib diisi untuk ekspor.'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({
                status: 'error',
                message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.'
            });
        }

        // Validasi maksimal 90 hari
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 90) {
            return res.status(400).json({
                status: 'error',
                message: 'Rentang tanggal melebihi 90 hari per request.'
            });
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const where: any = {
            created_at: {
                gte: start,
                lte: end
            }
        };

        if (action && action !== 'all') {
            where.action = action;
        }

        // Ambil data tanpa limit karena ini proses ekspor
        const auditLogs = await prisma.auditLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
        });

        // Format data untuk Excel
        const excelData = auditLogs.map((log: any) => ({
            "ID Log": log.id,
            "Tanggal": log.created_at.toISOString().split('T')[0],
            "Waktu": log.created_at.toISOString().split('T')[1].substring(0, 8),
            "ID User": log.user_id,
            "Aktivitas": log.action,
            "Tabel Target": log.table_name || '-',
            "ID Record": log.record_id || '-',
            // Mengubah objek JSON menjadi string agar bisa dibaca di Excel
            "Detail Perubahan": log.changes_payload ? JSON.stringify(log.changes_payload) : '-',
        }));

        // Generate Excel Buffer
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

        // Set Headers dan Kirim File
        const fileName = `Audit_Log_${startDate}_to_${endDate}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        return res.send(excelBuffer);

    } catch (error) {
        console.error('Export Audit Logs Error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengekspor audit log.',
        });
    }
};

export { 
  getAuditLogs,
  getAuditLogById,
  exportAuditLogsExcel
 };
