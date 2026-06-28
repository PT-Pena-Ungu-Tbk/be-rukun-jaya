import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import PDFDocument from 'pdfkit';

const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        const period = req.query.period as string || 'this_month';
        let start: Date;
        let end: Date;
        let prevStart: Date;
        let prevEnd: Date;

        const now = new Date();
        
        if (period === 'this_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (period === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
        } else if (period === 'custom') {
            if (!req.query.date_from || !req.query.date_to) {
                return res.status(400).json({ success: false, message: "date_from dan date_to wajib diisi untuk period custom." });
            }
            start = new Date(req.query.date_from as string);
            start.setHours(0, 0, 0, 0);
            end = new Date(req.query.date_to as string);
            end.setHours(23, 59, 59, 999);
            
            const diffTime = Math.abs(end.getTime() - start.getTime());
            prevEnd = new Date(start.getTime() - 1);
            prevStart = new Date(prevEnd.getTime() - diffTime);
            prevStart.setHours(0,0,0,0);
        } else {
            return res.status(400).json({ success: false, message: "Period tidak valid." });
        }

        const getStats = async (dStart: Date, dEnd: Date) => {
            const txs = await prisma.transaction.findMany({
                where: { created_at: { gte: dStart, lte: dEnd }, status: 'SUCCESS' },
                include: { details: { include: { product: true } } }
            });
            let omzet = 0;
            let profit = 0;
            for (const t of txs) {
                omzet += Number(t.grand_total);
                for (const d of t.details) {
                    if (d.product) {
                        profit += (Number(d.unit_price) - Number(d.product.buy_price)) * d.quantity;
                    }
                }
            }
            return { omzet, profit };
        };

        const current = await getStats(start, end);
        const previous = await getStats(prevStart, prevEnd);

        const calcPercent = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Number((((curr - prev) / prev) * 100).toFixed(1));
        };

        return res.status(200).json({
            success: true,
            data: {
                total_omzet: current.omzet,
                keuntungan_bersih: current.profit,
                persentase_omzet_vs_sebelumnya: calcPercent(current.omzet, previous.omzet),
                persentase_profit_vs_sebelumnya: calcPercent(current.profit, previous.profit),
                periode: {
                    date_from: start.toISOString().split('T')[0],
                    date_to: end.toISOString().split('T')[0]
                }
            }
        });
    } catch (error) {
        console.error("Finance Summary Error:", error);
        return res.status(500).json({ success: false, message: "Terjadi kesalahan internal." });
    }
};

const exportFinancialPDF = async (req: Request, res: Response) => {
    try {
        const { date_from, date_to } = req.query;
        let start = date_from ? new Date(date_from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        let end = date_to ? new Date(date_to as string) : new Date();
        end.setHours(23, 59, 59, 999);

        const txs = await prisma.transaction.findMany({
            where: { created_at: { gte: start, lte: end }, status: 'SUCCESS' },
            include: { details: { include: { product: true } } },
            orderBy: { created_at: 'asc' }
        });

        let totalOmzet = 0;
        let totalProfit = 0;
        
        txs.forEach(t => {
            totalOmzet += Number(t.grand_total);
            t.details.forEach(d => {
                if(d.product) {
                    totalProfit += (Number(d.unit_price) - Number(d.product.buy_price)) * d.quantity;
                }
            });
        });

        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Keuangan_${start.toISOString().split('T')[0]}_sd_${end.toISOString().split('T')[0]}.pdf"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Laporan Keuangan Toko Rukun Jaya', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Periode: ${start.toISOString().split('T')[0]} s/d ${end.toISOString().split('T')[0]}`);
        doc.text(`Dicetak pada: ${new Date().toLocaleString()}`);
        doc.moveDown(2);

        // Ringkasan
        doc.fontSize(14).text('Ringkasan Keuangan', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Transaksi Berhasil: ${txs.length} transaksi`);
        doc.text(`Total Omzet (Kotor): Rp ${totalOmzet.toLocaleString('id-ID')}`);
        doc.text(`Keuntungan Bersih (Profit): Rp ${totalProfit.toLocaleString('id-ID')}`);
        doc.moveDown(2);

        // Rincian (List of transactions)
        doc.fontSize(14).text('Rincian Transaksi', { underline: true });
        doc.moveDown(0.5);
        
        let y = doc.y;
        doc.fontSize(10);
        doc.text('Tanggal', 50, y);
        doc.text('Invoice', 150, y);
        doc.text('Metode', 280, y);
        doc.text('Omzet', 380, y);
        doc.text('Profit', 480, y);
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        
        y += 20;
        
        for (const t of txs) {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            
            let tProfit = 0;
            t.details.forEach(d => {
                if(d.product) tProfit += (Number(d.unit_price) - Number(d.product.buy_price)) * d.quantity;
            });

            doc.text(t.created_at.toISOString().split('T')[0], 50, y);
            doc.text(t.invoice_no, 150, y);
            doc.text((t as any).payment_method || 'CASH', 280, y);
            doc.text(`Rp ${Number(t.grand_total).toLocaleString('id-ID')}`, 380, y);
            doc.text(`Rp ${tProfit.toLocaleString('id-ID')}`, 480, y);
            
            y += 20;
        }

        doc.end();

    } catch (error) {
        console.error("PDF Export Error:", error);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Gagal membuat PDF." });
        }
    }
};

export {
    getFinancialSummary,
    exportFinancialPDF
};
