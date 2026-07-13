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

    const skuRegex = /^[A-Z0-9]+-[A-Z0-9]+-\d+$/;
    if (!skuRegex.test(sku_code)) {
      return res.status(400).json({
        status: 'error',
        message: 'Format sku_code tidak valid. Wajib berformat seperti CAT-VGL-01 (huruf kapital/angka dipisahkan strip, diakhiri nomor).',
      });
    }

    if (name.length < 3) {
      return res.status(400).json({ status: 'error', message: 'Nama produk minimal 3 karakter.' });
    }

    if (Number(buy_price) < 0 || Number(sell_price) < 0) {
      return res.status(400).json({ status: 'error', message: 'Harga beli dan harga jual tidak boleh negatif.' });
    }

    if (Number(sell_price) < Number(buy_price)) {
      return res.status(400).json({ status: 'error', message: 'Harga jual tidak boleh lebih kecil dari harga beli.' });
    }

    if (!Number.isInteger(Number(current_stock)) || Number(current_stock) < 0) {
      return res.status(400).json({ status: 'error', message: 'Stok saat ini harus berupa angka bulat (integer) dan tidak boleh negatif.' });
    }

    if (!Number.isInteger(Number(min_stock)) || Number(min_stock) < 0) {
      return res.status(400).json({ status: 'error', message: 'Stok minimum harus berupa angka bulat (integer) dan tidak boleh negatif.' });
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
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'Kode SKU sudah terdaftar, silakan gunakan kode lain.' });
      }
      if (error.code === 'P2003') {
        return res.status(400).json({ status: 'error', message: 'Kategori ID atau Supplier ID tidak ditemukan di database.' });
      }
    }

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan internal saat menambahkan produk.',
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
        SELECT p.*, c.name as category, s.name as supplier
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.current_stock <= p.min_stock
        ${categoryId ? Prisma.sql`AND p.category_id = ${categoryId}::uuid` : Prisma.empty}
        ${supplierId ? Prisma.sql`AND p.supplier_id = ${supplierId}::uuid` : Prisma.empty}
        ${search ? Prisma.sql`AND (p.name ILIKE ${'%' + search + '%'} OR p.sku_code ILIKE ${'%' + search + '%'})` : Prisma.empty}
        ORDER BY p.name ASC
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

    const rawProducts = await prisma.product.findMany({
      where: filters,
      orderBy: { name: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        category: true,
        supplier: true
      }
    });

    const products = rawProducts.map((p: any) => ({
      ...p,
      category: p.category?.name || 'Tidak Ada',
      supplier: p.supplier?.name || 'Tidak Ada'
    }));

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

    const product: any = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true
      }
    });

    if (product) {
       product.category = product.category?.name || 'Tidak Ada';
       product.supplier = product.supplier?.name || 'Tidak Ada';
    }

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

    if (safeUpdates.sku_code) {
      const skuRegex = /^[A-Z0-9]+-[A-Z0-9]+-\d+$/;
      if (!skuRegex.test(safeUpdates.sku_code as string)) {
        return res.status(400).json({
          status: 'error',
          message: 'Format sku_code tidak valid. Wajib berformat seperti CAT-VGL-01 (huruf kapital/angka dipisahkan strip, diakhiri nomor).',
        });
      }
    }

    if (safeUpdates.name !== undefined && String(safeUpdates.name).length < 3) {
      return res.status(400).json({ status: 'error', message: 'Nama produk minimal 3 karakter.' });
    }

    if (safeUpdates.buy_price !== undefined && Number(safeUpdates.buy_price) < 0) {
      return res.status(400).json({ status: 'error', message: 'Harga beli tidak boleh negatif.' });
    }

    if (safeUpdates.sell_price !== undefined && Number(safeUpdates.sell_price) < 0) {
      return res.status(400).json({ status: 'error', message: 'Harga jual tidak boleh negatif.' });
    }

    if (safeUpdates.current_stock !== undefined && (!Number.isInteger(Number(safeUpdates.current_stock)) || Number(safeUpdates.current_stock) < 0)) {
      return res.status(400).json({ status: 'error', message: 'Stok saat ini harus berupa angka bulat dan tidak boleh negatif.' });
    }

    if (safeUpdates.min_stock !== undefined && (!Number.isInteger(Number(safeUpdates.min_stock)) || Number(safeUpdates.min_stock) < 0)) {
      return res.status(400).json({ status: 'error', message: 'Stok minimum harus berupa angka bulat dan tidak boleh negatif.' });
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'Kode SKU sudah digunakan oleh produk lain.' });
      }
      if (error.code === 'P2003') {
        return res.status(400).json({ status: 'error', message: 'Kategori ID atau Supplier ID tidak ditemukan di database.' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
      }
    }

    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui produk. Terjadi kesalahan internal pada sistem.',
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
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan.' });
      }
    }

    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus produk. Terjadi kesalahan internal sistem.',
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
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Satu atau lebih ID produk dalam daftar tidak ditemukan di database.' });
      }
    }

    return res.status(500).json({
      status: 'error',
      message: 'Gagal melakukan bulk update produk. Terjadi kesalahan internal sistem.',
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
    
    // Validasi semua ID produk dalam array
    for (const id of itemIds) {
      if (!isValidUUID(id)) {
        return res.status(400).json({
          status: 'error',
          message: `Format ID produk tidak valid pada salah satu item: ${id}`,
        });
      }
    }

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

const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku_code: true,
        current_stock: true,
        rack_location: true
      }
    });

    const excelData = products.map((p) => ({
      item_id: p.id,
      nama_produk: p.name,
      sku: p.sku_code || "",
      stok_sistem_saat_ini: p.current_stock,
      stok_fisik_baru: p.current_stock,
      kode_rak: p.rack_location || ""
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Stok');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `Template_Bulk_Update_${Date.now()}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
  } catch (error: any) {
    console.error("Download Template Error:", error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh template.' });
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
  downloadTemplate
 };
