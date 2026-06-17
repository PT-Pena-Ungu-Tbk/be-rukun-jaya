import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient';

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...updates,
        buy_price: updates.buy_price ? String(updates.buy_price) : undefined,
        sell_price: updates.sell_price ? String(updates.sell_price) : undefined,
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

export { 
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
 };
