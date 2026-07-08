import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prismaClient';

const getDashboardOverview = async (req: Request, res: Response) => {
    try {
        const queryDate = req.query.date ? new Date(req.query.date as string) : new Date();
        if (isNaN(queryDate.getTime())) {
            return res.status(400).json({ success: false, status_code: 400, message: "Format tanggal tidak valid." });
        }

        // Tanggal Hari Ini & Kemarin
        const startOfToday = new Date(queryDate);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(queryDate);
        endOfToday.setHours(23, 59, 59, 999);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(endOfToday);
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);

        // 1. SUMMARY METRICS
        const [todayTransactions, yesterdayTransactions] = await Promise.all([
            prisma.transaction.findMany({
                where: { created_at: { gte: startOfToday, lte: endOfToday } },
                include: { details: { include: { product: true } } }
            }),
            prisma.transaction.findMany({
                where: { created_at: { gte: startOfYesterday, lte: endOfYesterday } },
                include: { details: { include: { product: true } } }
            })
        ]);

        const pendapatan_hari_ini = todayTransactions.reduce((sum, t) => sum + Number(t.grand_total), 0);
        const pendapatan_kemarin = yesterdayTransactions.reduce((sum, t) => sum + Number(t.grand_total), 0);
        
        // Kalkulasi profit: harga jual (unit_price) - harga beli (buy_price)
        const calculateProfit = (transactions: any[]) => {
             let profit = 0;
             for (const t of transactions) {
                 for (const d of t.details) {
                     if (d.product) {
                         profit += (Number(d.unit_price) - Number(d.product.buy_price)) * d.quantity;
                     }
                 }
             }
             return profit;
        };

        const profit_kotor = calculateProfit(todayTransactions);
        const profit_kemarin = calculateProfit(yesterdayTransactions);

        const calcPercent = (today: number, yesterday: number) => {
             if (yesterday === 0) return today > 0 ? 100 : 0;
             return Number((((today - yesterday) / yesterday) * 100).toFixed(1));
        };

        const uniqueCustomersToday = new Set(todayTransactions.map(t => t.member_id).filter(id => id)).size;
        const uniqueCustomersYesterday = new Set(yesterdayTransactions.map(t => t.member_id).filter(id => id)).size;

        const summary = {
            pendapatan_hari_ini,
            pendapatan_kemarin,
            persentase_perubahan_pendapatan: calcPercent(pendapatan_hari_ini, pendapatan_kemarin),
            profit_kotor,
            profit_kemarin,
            persentase_perubahan_profit: calcPercent(profit_kotor, profit_kemarin),
            volume_transaksi: todayTransactions.length,
            volume_transaksi_kemarin: yesterdayTransactions.length,
            persentase_perubahan_volume: calcPercent(todayTransactions.length, yesterdayTransactions.length),
            jumlah_pelanggan: uniqueCustomersToday,
            jumlah_pelanggan_kemarin: uniqueCustomersYesterday,
            persentase_perubahan_pelanggan: calcPercent(uniqueCustomersToday, uniqueCustomersYesterday)
        };

        // 2. PERINGATAN STOK (Stok <= Minimum Stok)
        // Gunakan $queryRaw agar filter dilakukan di sisi DB, bukan di memory JS
        const lowStockProducts: any[] = await prisma.$queryRaw`
            SELECT id, sku_code, name, current_stock, min_stock
            FROM products
            WHERE current_stock <= min_stock
            ORDER BY current_stock ASC
            LIMIT 10
        `;

        const peringatan_stok = lowStockProducts.map((p: any) => ({
            sku: p.sku_code,
            nama: p.name,
            stok: Number(p.current_stock),
            satuan: "Unit",
            status: p.current_stock === 0 ? "EMPTY" : (p.current_stock <= (p.min_stock / 2) ? "CRITICAL" : "LOW")
        }));

        // 3. PRODUK TERLARIS (30 Hari Terakhir)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const topProductsGroups = await prisma.transactionDetail.groupBy({
            by: ['product_id'],
            _sum: { quantity: true, subtotal: true },
            where: { transaction: { created_at: { gte: thirtyDaysAgo } } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const produk_terlaris = await Promise.all(topProductsGroups.map(async (g) => {
            const product = await prisma.product.findUnique({ where: { id: g.product_id } });
            return {
                nama: product?.name || 'Unknown Product',
                unit_terjual: g._sum.quantity || 0,
                total_nilai: g._sum.subtotal || 0
            };
        }));

        // 4. AKTIVITAS TERBARU
        const recentAudits = await prisma.auditLog.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });
        const aktivitas_terbaru = recentAudits.map(a => {
            const payload = a.changes_payload as any;
            let deskripsi = `Aktivitas di sistem (${a.action})`;

            if (payload && payload.message) {
                deskripsi = payload.message;
            } else {
                if (a.action === 'CREATE_TRANSACTION') deskripsi = `Penjualan baru oleh kasir`;
                else if (a.action === 'RETURN_GARANSI') deskripsi = `Pengambilan/klaim garansi barang`;
                else if (a.action === 'CREATE_PRODUCT') deskripsi = `Penambahan produk baru dari supplier`;
                else if (a.action === 'UPDATE_PRODUCT') deskripsi = `Perubahan data stok/produk`;
                else if (a.action === 'BULK_UPDATE_EXCEL') deskripsi = `Penambahan stok produk massal`;
                else deskripsi = `Perubahan data pada ${a.table_name || 'sistem'}`;
            }

            return {
                tipe: a.action,
                deskripsi,
                waktu: a.created_at
            };
        });

        // 5. METODE PEMBAYARAN
        let total_terproses = 0;
        const methods = { TUNAI: 0, TRANSFER_BANK: 0, QRIS: 0 };
        todayTransactions.forEach(t => {
            const amount = Number(t.grand_total);
            total_terproses += amount;
            const paymentMethod = (t as any).payment_method || 'CASH';
            if (paymentMethod === 'CASH') methods.TUNAI += amount;
            else if (paymentMethod === 'TRANSFER') methods.TRANSFER_BANK += amount;
            else if (paymentMethod === 'QRIS') methods.QRIS += amount;
        });

        const metode_pembayaran = {
            tunai: { persentase: total_terproses ? Number(((methods.TUNAI/total_terproses)*100).toFixed(1)) : 0, total: methods.TUNAI },
            transfer_bank: { persentase: total_terproses ? Number(((methods.TRANSFER_BANK/total_terproses)*100).toFixed(1)) : 0, total: methods.TRANSFER_BANK },
            qris: { persentase: total_terproses ? Number(((methods.QRIS/total_terproses)*100).toFixed(1)) : 0, total: methods.QRIS },
            total_terproses
        };

        // 6. DAILY SALES CHART (7 Hari Terakhir)
        const dailySalesChart = [];
        for (let i = 6; i >= 0; i--) {
            const dStart = new Date(startOfToday);
            dStart.setDate(dStart.getDate() - i);
            const dEnd = new Date(dStart);
            dEnd.setHours(23, 59, 59, 999);
            
            const dayTrans = await prisma.transaction.aggregate({
                where: { created_at: { gte: dStart, lte: dEnd } },
                _sum: { grand_total: true }
            });
            const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
            dailySalesChart.push({
                hari: days[dStart.getDay()],
                nilai: Number(dayTrans._sum.grand_total || 0)
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                summary,
                peringatan_stok,
                produk_terlaris,
                aktivitas_terbaru,
                metode_pembayaran,
                daily_sales_chart: dailySalesChart
            }
        });
    } catch (error: any) {
        console.error("Dashboard Overview Error:", error);
        return res.status(500).json({ success: false, status_code: 500, message: "Terjadi kesalahan internal server." });
    }
}


export {
    getDashboardOverview
}