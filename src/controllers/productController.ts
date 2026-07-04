import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient';
import { isValidUUID } from '../utils/validator';
import * as xlsx from 'xlsx';

const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      sku_code,
      name,
      category_id,
      supplier_id,
      buy_price,
      sell_price,
      current_stock = 0,
      defective_stock = 0,
      min_stock = 0,
      rack_location = null,
    } = req.body;

    if (!sku_code || !name || !category_id || !supplier_id || !buy_price || !sell_price) {
      return res.status(400).json({
        status: 'error',
        message: 'Field sku_code, name, category_id, supplier_id, buy_price, dan sell_price wajib diisi.',
      });
    }

    if (!isValidUUID(category_id) || !isValidUUID(supplier_id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format category_id atau supplier_id tidak valid (harus UUID).',
      });
    }

    const product = await prisma.product.create({
      data: {
        sku_code,
        name,
        category_id,
        supplier_id,
        buy_price: String(buy_price),
        sell_price: String(sell_price),
        current_stock,
        defective_stock,
        min_stock,
        rack_location,
      },
    });

    return res.status(201).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat menambahkan produk.',
    });
  }
};

const getProducts = async (req: Request, res: Response) => {
  try {
    const { low_stock, search, categoryId, supplierId, page = 1, limit = 50 } = req.query;

    if (categoryId && !isValidUUID(categoryId as string)) {
      return res.status(400).json({ status: 'error', message: 'Format categoryId tidak valid (harus UUID).' });
    }
    
    if (supplierId && !isValidUUID(supplierId as string)) {
      return res.status(400).json({ status: 'error', message: 'Format supplierId tidak valid (harus UUID).' });
    }

    if (low_stock === 'true') {
      const products = await prisma.$queryRaw`
        SELECT *
        FROM products
        WHERE current_stock <= min_stock
        ${categoryId ? Prisma.sql`AND category_id = ${categoryId}::uuid` : Prisma.empty}
        ${supplierId ? Prisma.sql`AND supplier_id = ${supplierId}::uuid` : Prisma.empty}
        ${search ? Prisma.sql`AND (name ILIKE ${'%' + search + '%'} OR sku_code ILIKE ${'%' + search + '%'})` : Prisma.empty}
        ORDER BY name ASC
        LIMIT ${Number(limit)}
        OFFSET ${(Number(page) - 1) * Number(limit)}
      `;
      return res.status(200).json({ status: 'success', data: products });
    }

    const filters: any = {};
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku_code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) filters.category_id = categoryId;
    if (supplierId) filters.supplier_id = supplierId;

    const products = await prisma.product.findMany({
      where: filters,
      orderBy: { name: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil daftar produk.',
    });
  }
};

const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 'error', message: 'Format ID produk tidak valid.' });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Produk tidak ditemukan.',
      });
    }

    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Get Product Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil data produk.',
    });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const updates = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 'error', message: 'Format ID produk tidak valid.' });
    }

    if (updates.category_id && !isValidUUID(updates.category_id)) {
      return res.status(400).json({ status: 'error', message: 'Format category_id tidak valid.' });
    }

    if (updates.supplier_id && !isValidUUID(updates.supplier_id)) {
      return res.status(400).json({ status: 'error', message: 'Format supplier_id tidak valid.' });
    }

    // Whitelist field yang diizinkan untuk diperbarui
    const ALLOWED_FIELDS = ['name', 'sku_code', 'sell_price', 'buy_price', 'current_stock', 'min_stock', 'rack_location', 'category_id', 'supplier_id', 'condition', 'expiry_date', 'description'] as const;
    const safeUpdates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ status: 'error', message: 'Tidak ada field valid yang dikirimkan untuk diperbarui.' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...safeUpdates,
        buy_price:  safeUpdates.buy_price  ? String(safeUpdates.buy_price)  : undefined,
        sell_price: safeUpdates.sell_price ? String(safeUpdates.sell_price) : undefined,
      },
    });

    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Gagal memperbarui produk. Periksa kembali data dan ID produk.',
    });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 'error', message: 'Format ID produk tidak valid.' });
    }

    await prisma.product.delete({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Gagal menghapus produk. Periksa kembali ID produk.',
    });
  }
};

const bulkUpdateProducts = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body harus berisi array updates.',
      });
    }

    // Validasi semua ID produk dalam array
    for (const item of updates) {
      if (!isValidUUID(item.id)) {
        return res.status(400).json({
          status: 'error',
          message: `Format ID produk tidak valid pada salah satu item: ${item.id}`,
        });
      }
    }

    const result = await prisma.$transaction(
      updates.map((item) => {
        return prisma.product.update({
          where: { id: item.id },
          data: {
            current_stock: item.new_stock
          },
        });
      })
    );

    return res.status(200).json({ status: 'success', message: 'Pembaruan kuantitas stok massal berhasil diproses serentak di database.' });
  } catch (error) {
    console.error('Bulk Update Products Error:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Gagal melakukan bulk update produk. Pastikan semua item valid.',
    });
  }
};

const uploadExcelBulkUpdate = async (req: Request, res: Response) => {
  try {
    const { gudang_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        error_code: 'INVALID_FILE_FORMAT',
        message: 'File Excel tidak ditemukan.'
      });
    }

    if (!gudang_id) {
      return res.status(400).json({
        status: 'error',
        error_code: 'INVALID_REQUEST',
        message: 'Parameter gudang_id wajib diisi.'
      });
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(422).json({
        status: 'error',
        error_code: 'TEMPLATE_MISMATCH',
        message: 'File Excel kosong atau format tidak sesuai.'
      });
    }

    const itemIds = data.map(d => d.item_id).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } }
    });

    const productMap = new Map();
    for (const p of existingProducts) {
      productMap.set(p.id, p);
    }
    
    const prismaUpdates = [];
    const results = [];
    let updated_count = 0;
    let failed_count = 0;
    let selisih_signifikan = 0;

    for (const row of data) {
       const itemId = row.item_id;
       const stokFisikBaru = Number(row.stok_fisik_baru);
       const kodeRak = row.kode_rak;

       if (!itemId || isNaN(stokFisikBaru)) {
          failed_count++;
          results.push({ item_id: itemId || 'UNKNOWN', status: 'FAILED', message: 'Format data tidak valid' });
          continue;
       }

       const product = productMap.get(itemId);
       if (!product) {
          failed_count++;
          results.push({ item_id: itemId, status: 'FAILED', message: 'Item tidak ditemukan' });
          continue;
       }

       const stokLama = product.current_stock;
       const selisih = Math.abs(stokFisikBaru - stokLama);
       
       if (stokLama > 0 && (selisih / stokLama) > 0.1) {
          selisih_signifikan++;
       } else if (stokLama === 0 && stokFisikBaru > 0) {
          selisih_signifikan++;
       }

       prismaUpdates.push(prisma.product.update({
          where: { id: itemId },
          data: {
             current_stock: stokFisikBaru,
             rack_location: kodeRak || product.rack_location
          }
       }));
       
       updated_count++;
       results.push({
          item_id: itemId,
          status: 'SUCCESS',
          stok_lama: stokLama,
          stok_baru: stokFisikBaru,
          selisih: stokFisikBaru - stokLama
       });
    }

    let auditLogId = null;
    if (prismaUpdates.length > 0) {
       await prisma.$transaction(prismaUpdates);
       
       const user_id = (req as any).user?.id || 'SYSTEM';
       
       // Log audit ONLY if User model has this ID, but wait, AuditLog user_id might refer to a strict UUID in DB.
       // It's safe to just create the AuditLog if we have a valid UUID.
       if (isValidUUID(user_id)) {
           const auditLog = await prisma.auditLog.create({
              data: {
                 user_id,
                 action: 'BULK_UPDATE_EXCEL',
                 table_name: 'products',
                 record_id: isValidUUID(gudang_id) ? gudang_id : null,
                 changes_payload: { updated_count, failed_count, selisih_signifikan }
              }
           });
           auditLogId = auditLog.id;
       }
    }

    const statusCode = failed_count > 0 && updated_count > 0 ? 207 : (updated_count > 0 ? 200 : 400);

    return res.status(statusCode).json({
       success: updated_count > 0,
       updated_count,
       failed_count,
       selisih_signifikan,
       results,
       audit_log_id: auditLogId
    });

  } catch (error) {
    console.error('Upload Excel Bulk Update Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memproses file Excel.',
    });
  }
};

export { 
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  uploadExcelBulkUpdate,
 };
