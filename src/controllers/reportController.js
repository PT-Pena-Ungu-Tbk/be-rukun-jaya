const prisma = require('../utils/prismaClient');

const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.',
      });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const transactionWhere = {
      created_at: {
        gte: start,
        lte: end,
      },
    };

    const revenueResult = await prisma.transaction.aggregate({
      where: transactionWhere,
      _sum: {
        grand_total: true,
      },
    });

    const successfulTransactionCount = await prisma.transaction.count({
      where: transactionWhere,
    });

    const topProductsAggregation = await prisma.transactionDetail.groupBy({
      by: ['product_id'],
      where: {
        transaction: transactionWhere,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = topProductsAggregation.map((item) => item.product_id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));

    const topProducts = topProductsAggregation.map((item) => {
      const product = productMap.get(item.product_id);
      return {
        product_id: item.product_id,
        sku_code: product?.sku_code || null,
        name: product?.name || null,
        quantity_sold: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.subtotal || 0),
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        period: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
        total_revenue: Number(revenueResult._sum.grand_total || 0),
        successful_transactions: successfulTransactionCount,
        top_products: topProducts,
      },
    });
  } catch (error) {
    console.error('Financial Report Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat menghitung laporan keuangan.',
    });
  }
};

module.exports = {
  getFinancialReport,
};
