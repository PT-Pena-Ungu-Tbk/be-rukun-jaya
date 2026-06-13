const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, tableName, startDate, endDate, limit = 100 } = req.query;
    const where = {};

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

    const auditLogs = await prisma.auditLogs.findMany({
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

const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const auditLog = await prisma.auditLogs.findUnique({
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

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
