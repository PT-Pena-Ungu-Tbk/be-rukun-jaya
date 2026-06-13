const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createProduct = async (req, res) => {
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

    const product = await prisma.products.create({
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

const getProducts = async (req, res) => {
  try {
    const { stock, search, categoryId, supplierId, page = 1, limit = 50 } = req.query;
    const filters = {};

    if (stock === 'low') {
      filters.current_stock = { lte: prisma.Decimal ? undefined : undefined };
    }

    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku_code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      filters.category_id = categoryId;
    }

    if (supplierId) {
      filters.supplier_id = supplierId;
    }

    const where = {
      ...filters,
      ...(stock === 'low' ? { current_stock: { lte: prisma.products._meta ? undefined : undefined } } : {}),
    };

    const manualWhere = {};
    if (search) {
      manualWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku_code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) manualWhere.category_id = categoryId;
    if (supplierId) manualWhere.supplier_id = supplierId;
    if (stock === 'low') manualWhere.current_stock = { lte: prisma.products ? undefined : undefined };

    // Build final where with only valid parts
    const finalWhere = {};
    if (manualWhere.OR) finalWhere.OR = manualWhere.OR;
    if (manualWhere.category_id) finalWhere.category_id = manualWhere.category_id;
    if (manualWhere.supplier_id) finalWhere.supplier_id = manualWhere.supplier_id;
    if (stock === 'low') finalWhere.current_stock = { lte: 0 }; // fallback if min_stock unknown

    // If low stock filter requested, compare against min_stock
    const products = await prisma.products.findMany({
      where: stock === 'low'
        ? {
            ...(manualWhere.OR ? { OR: manualWhere.OR } : {}),
            ...(manualWhere.category_id ? { category_id: manualWhere.category_id } : {}),
            ...(manualWhere.supplier_id ? { supplier_id: manualWhere.supplier_id } : {}),
            current_stock: { lte: { _ref: 'min_stock' } },
          }
        : finalWhere,
      orderBy: { name: 'asc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    if (stock === 'low') {
      const lowStockProducts = await prisma.$queryRaw`
        SELECT *
        FROM products
        WHERE current_stock <= min_stock
        ${categoryId ? prisma.raw`AND category_id = ${categoryId}` : prisma.raw``}
        ${supplierId ? prisma.raw`AND supplier_id = ${supplierId}` : prisma.raw``}
        ${search ? prisma.raw`AND (name ILIKE ${`%${search}%`} OR sku_code ILIKE ${`%${search}%`})` : prisma.raw``}
        ORDER BY name ASC
        LIMIT ${Number(limit)}
        OFFSET ${(Number(page) - 1) * Number(limit)}
      `;
      return res.status(200).json({ status: 'success', data: lowStockProducts });
    }

    return res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat mengambil daftar produk.',
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.products.findUnique({
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

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await prisma.products.update({
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

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.products.delete({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Gagal menghapus produk. Periksa kembali ID produk.',
    });
  }
};

const bulkUpdateProducts = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Request body harus berisi array items.',
      });
    }

    const result = await prisma.$transaction(
      items.map((item) => {
        const { id, ...data } = item;
        return prisma.products.update({
          where: { id },
          data: {
            ...data,
            buy_price: data.buy_price ? String(data.buy_price) : undefined,
            sell_price: data.sell_price ? String(data.sell_price) : undefined,
          },
        });
      })
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Bulk Update Products Error:', error);
    return res.status(400).json({
      status: 'error',
      message: 'Gagal melakukan bulk update produk. Pastikan semua item valid.',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
};
