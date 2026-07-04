import { Request, Response, NextFunction } from 'express';
// src/controllers/transactionController.js
import prisma from '../utils/prismaClient';
import { AppError } from '../utils/AppError';
import { isValidUUID } from '../utils/validator';
import * as xlsx from 'xlsx';
import PDFDocument from 'pdfkit';

// 1. LOGIKA CHECKOUT TRANSAKSI
const checkout = async (req: Request, res: Response) => {
    const { items, payment_method, jumlah_bayar, vip_phone, diskon_persen, diskon_nominal, payment_reference, nama_pelanggan } = req.body;
    const userId = req.user.id;

    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new AppError("Daftar barang (items) tidak boleh kosong.", 400);
        }

        let member = null;
        if (vip_phone) {
            member = await prisma.member.findUnique({ where: { phone_number: vip_phone } });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            let subtotal = 0;
            const orderDetails = [];

            for (const item of items) {
                if (!isValidUUID(item.product_id)) {
                    throw new AppError(`ID Produk tidak valid pada salah satu item.`, 400);
                }
                const product = await tx.product.findUnique({
                    where: { id: item.product_id }
                });

                if (!product) {
                    throw new AppError(`Produk dengan ID ${item.product_id} tidak ditemukan.`, 404);
                }

                if (product.current_stock < item.qty) {
                    throw new AppError(`Stok produk '${product.name}' tidak mencukupi. Sisa stok: ${product.current_stock}`, 409);
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: { current_stock: product.current_stock - item.qty }
                });

                const itemSubtotal = parseFloat(product.sell_price) * item.qty;
                subtotal += itemSubtotal;

                orderDetails.push({
                    product_id: product.id,
                    quantity: item.qty,
                    unit_price: product.sell_price,
                    subtotal: itemSubtotal
                });
            }

            let discountAmount = 0;
            if (diskon_persen) {
                discountAmount = subtotal * (diskon_persen / 100);
            } else if (diskon_nominal) {
                discountAmount = diskon_nominal;
            }

            const subtotalAfterDiscount = subtotal - discountAmount;
            const taxAmount = subtotalAfterDiscount * 0.11;
            const grandTotal = subtotalAfterDiscount + taxAmount;

            if (payment_method === 'CASH' && jumlah_bayar < grandTotal) {
                throw new AppError(`Pembayaran kurang. Total tagihan: ${grandTotal}`, 402);
            }

            const cashPaid = payment_method === 'CASH' ? jumlah_bayar : grandTotal;
            const changeAmount = cashPaid - grandTotal;
            const invoiceNo = `INV-${Date.now()}`;

            const transaction = await tx.transaction.create({
                data: {
                    invoice_no: invoiceNo,
                    cashier_id: userId,
                    member_id: member?.id || null,
                    payment_method: payment_method || 'CASH',
                    customer_name: nama_pelanggan || null,
                    subtotal: subtotal,
                    discount_type: diskon_persen ? 'PERCENTAGE' : 'NOMINAL',
                    discount_value: diskon_persen || diskon_nominal || 0,
                    tax_amount: taxAmount,
                    grand_total: grandTotal,
                    cash_paid: cashPaid,
                    change_amount: changeAmount
                }
            });

            const detailsData = orderDetails.map(detail => ({
                transaction_id: transaction.id,
                product_id: detail.product_id,
                quantity: detail.quantity,
                unit_price: detail.unit_price,
                subtotal: detail.subtotal
            }));

            await tx.transactionDetail.createMany({
                data: detailsData
            });

            const fetchedDetails = await tx.transactionDetail.findMany({
                where: { transaction_id: transaction.id },
                include: { product: true }
            });

            return { transaction, fetchedDetails, member };
        });

        return res.status(201).json({
            success: true,
            data: {
                transaction_id: result.transaction.invoice_no,
                status: "SUCCESS",
                subtotal: result.transaction.subtotal,
                diskon: result.transaction.discount_value,
                ppn_11_persen: result.transaction.tax_amount,
                grand_total: result.transaction.grand_total,
                jumlah_bayar: result.transaction.cash_paid,
                kembalian: result.transaction.change_amount,
                vip_member: result.member ? { id: result.member.id, name: result.member.name } : null,
                kasir_id: result.transaction.cashier_id,
                created_at: result.transaction.created_at,
                struk_url: `${req.protocol}://${req.get('host')}/api/v1/pos/transactions/${result.transaction.invoice_no}/receipt`,
                items: result.fetchedDetails.map((d: any) => ({
                    product_id: d.product_id,
                    nama: d.product.name,
                    qty: d.quantity,
                    harga_satuan: d.unit_price,
                    subtotal: d.subtotal
                }))
            }
        });

    } catch (error: any) {
        console.error("Checkout Error:", error);
        if (error instanceof AppError) {
            return res.status(error.statusCode || 400).json({
                success: false,
                status_code: error.statusCode || 400,
                error_code: error.statusCode === 404 ? "PRODUCT_NOT_FOUND" : error.statusCode === 409 ? "INSUFFICIENT_STOCK" : error.statusCode === 402 ? "INSUFFICIENT_PAYMENT" : "INVALID_REQUEST",
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            status_code: 500,
            error_code: "TRANSACTION_FAILED",
            message: "Transaksi gagal diproses di server."
        });
    }
};

const getTransactionDetails = async (req: Request, res: Response) => {
    const transaction_id = req.params.transaction_id as string;

    try {
        const transaction: any = await prisma.transaction.findFirst({
            where: isValidUUID(transaction_id) ? {
                OR: [
                    { id: transaction_id },
                    { invoice_no: transaction_id }
                ]
            } : {
                invoice_no: transaction_id
            },
            include: {
                details: {
                    include: { product: true }
                },
                member: true,
                cashier: true
            }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                status_code: 404,
                error_code: "TRANSACTION_NOT_FOUND",
                message: "Transaksi dengan ID tersebut tidak ditemukan"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                transaction_id: transaction.invoice_no,
                status: "LUNAS",
                created_at: transaction.created_at,
                informasi_pelanggan: {
                    nama: transaction.customer_name || transaction.member?.name || "-",
                    nomor_hp: transaction.member?.phone_number || "-"
                },
                metode_pembayaran: {
                    tipe: transaction.payment_method || "CASH"
                },
                items: transaction.details.map((d: any) => ({
                    nama: d.product.name,
                    sku: d.product.sku_code,
                    qty: d.quantity,
                    harga_satuan: d.unit_price,
                    total_harga: d.subtotal
                })),
                subtotal: transaction.subtotal,
                diskon_member: transaction.discount_value,
                ppn_11_persen: transaction.tax_amount,
                grand_total: transaction.grand_total,
                pdf_url: `https://cdn.tokorukunjaya.id/faktur/${transaction.invoice_no}.pdf`,
                struk_url: `https://cdn.tokorukunjaya.id/struk/${transaction.invoice_no}.pdf`
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status_code: 500,
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Kesalahan internal"
        });
    }
};

// 2. LOGIKA RETUR BARANG CACAT
const returnItem = async (req: Request, res: Response) => {
    const { transaction_id, product_id, quantity_returned } = req.body;
    const userId = req.user.id;

    try {
        if (!isValidUUID(transaction_id) || !isValidUUID(product_id)) {
            throw new AppError("ID Transaksi atau ID Produk tidak valid.");
        }

        if (!quantity_returned || quantity_returned <= 0) {
            throw new AppError("Kuantitas retur harus lebih besar dari 0.");
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const defectiveProduct = await tx.product.findUnique({ where: { id: product_id } });

            if (!defectiveProduct) {
                throw new AppError("Produk retur tidak valid.");
            }

            // Validasi ketersediaan stok barang pengganti (sama dengan barang yang diretur)
            if (defectiveProduct.current_stock < quantity_returned) {
                throw new AppError(`Stok barang pengganti '${defectiveProduct.name}' tidak mencukupi.`);
            }

            // Tambahkan kuantitas ke defective_stock dan kurangi current_stock 
            await tx.product.update({
                where: { id: product_id },
                data: {
                    defective_stock: defectiveProduct.defective_stock + quantity_returned,
                    current_stock: defectiveProduct.current_stock - quantity_returned
                }
            });


            // Wajib mencatat ke Audit Log karena memodifikasi data sensitif
            const auditLog = await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: "RETURN_GARANSI",
                    table_name: "products",
                    record_id: product_id,
                    changes_payload: {
                        message: `Retur barang cacat ${defectiveProduct.name}, diganti dengan barang baru`,
                        quantity_returned: quantity_returned,
                        transaction_id: transaction_id
                    }
                }
            });

            return { message: "Proses klaim garansi berhasil diproses.", auditLog };
        });

        return res.status(200).json({
            status: "success",
            message: "Proses retur garansi barang berhasil dicatat. Stok pengganti telah dikeluarkan.",
            data: result
        });

    } catch (error: any) {
        console.error("Return Error:", error);

        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: "error",
                message: error.message
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan internal saat memproses retur garansi barang."
        });
    }
};

//3. LOGIKA EKSPOR TRANSAKSI (EXCEL)
const exportTransactionsExcel = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, status } = req.query as any;
        const where: any = {};

        //Filter Status
        if (status && status !== 'all') {
            where.status = status;
        }

        //Filter Rentang Tanggal
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.created_at.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.created_at.lte = end;
            }
        }

        const transaction = await prisma.transaction.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                details: {
                    include: {
                        product: true
                    }
                },
                member: true
            }
        })

        // Format data untuk sheet Excel
        const excelData = transaction.map((t: any) => ({
            "ID Transaksi": t.invoice_no,
            "Tanggal": t.created_at.toISOString().split('T')[0],
            "Waktu": t.created_at.toISOString().split('T')[1].substring(0, 8),
            "ID Member": t.member_id || '-',
            "Kasir ID": t.cashier_id,
            "Subtotal (IDR)": t.subtotal,
            "Diskon (IDR)": t.discount_value,
            "Pajak (IDR)": t.tax_amount,
            "Grand Total (IDR)": t.grand_total,
            "Metode Pembayaran": t.payment_method || 'CASH',
            "Status": t.status || 'SUCCESS'
        }));

        // Generate Excel Buffer
        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");
        const excelBuffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

        // Set Headers dan Kirim File
        const fileName = `Export_Transaksi_${Date.now()}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        return res.send(excelBuffer);
    }
    catch (error: any) {
        console.error("Checkout Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan internal saat memproses transaksi checkout."
        });
    }
};

// 4. DAFTAR RIWAYAT TRANSAKSI (PAGINATION, FILTER, SEARCH)
const getTransactionHistory = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { startDate, endDate, search } = req.query;

        const where: any = {};

        // Filter Rentang Tanggal
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) {
                const start = new Date(startDate as string);
                start.setHours(0, 0, 0, 0);
                where.created_at.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                where.created_at.lte = end;
            }
        }

        // Pencarian berdasarkan invoice atau nama pelanggan
        if (search) {
            where.OR = [
                { invoice_no: { contains: search as string, mode: 'insensitive' } },
                { customer_name: { contains: search as string, mode: 'insensitive' } },
                {
                    member: {
                        name: { contains: search as string, mode: 'insensitive' }
                    }
                }
            ];
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    cashier: { select: { id: true, name: true } },
                    member: { select: { id: true, name: true, phone_number: true } },
                    details: true
                }
            }),
            prisma.transaction.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);

        const formattedTransactions = transactions.map((t: any) => {
            const totalItem = t.details ? t.details.reduce((sum: number, d: any) => sum + d.quantity, 0) : 0;
            return {
                id: t.id,
                invoice_no: t.invoice_no,
                tanggal: t.created_at,
                pelanggan: t.customer_name || t.member?.name || "-",
                kasir: t.cashier?.name || "-",
                metode_pembayaran: t.payment_method || 'CASH',
                total_item: totalItem,
                grand_total: t.grand_total,
                status: 'SUCCESS'
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedTransactions,
            pagination: {
                total_data: total,
                total_pages: totalPages,
                current_page: page,
                limit
            }
        });

    } catch (error: any) {
        console.error("Get Transaction History Error:", error);
        return res.status(500).json({
            success: false,
            status_code: 500,
            message: "Terjadi kesalahan internal saat mengambil daftar transaksi."
        });
    }
};

// 5. GET ALL TRANSACTIONS (RAW, WITH RELATIONS) — WITH PAGINATION
const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const page  = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10) || 1);
        const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '100'), 10) || 100));
        const skip  = (page - 1) * limit;

        const [transactions, total] = await prisma.$transaction([
            prisma.transaction.findMany({
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    cashier: { select: { name: true } },
                    member:  { select: { name: true } },
                    details: {
                        include: {
                            product: { select: { name: true } }
                        }
                    }
                }
            }),
            prisma.transaction.count()
        ]);

        const formattedData = transactions.map((t: any) => ({
            id: t.id,
            invoice_no: t.invoice_no,
            cashier_name: t.cashier?.name || null,
            member_name: t.member?.name || null,
            subtotal: t.subtotal,
            discount_type: t.discount_type === 'NOMINAL' ? 'nominal' : 'percentage',
            discount_value: t.discount_value,
            tax_amount: t.tax_amount,
            grand_total: t.grand_total,
            cash_paid: t.cash_paid,
            change_amount: t.change_amount,
            created_at: t.created_at,
            items: t.details.map((d: any) => ({
                product_name: d.product?.name || "Unknown Product",
                quantity: d.quantity,
                unit_price: d.unit_price
            }))
        }));

        return res.status(200).json({
            success: true,
            message: "Transactions history retrieved successfully",
            data: formattedData,
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get All Transactions Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server gagal mengambil data transaksi."
        });

    }
};

// 6. CETAK STRUK PDF
const printReceipt = async (req: Request, res: Response) => {
    try {
        const transaction_id = req.params.transaction_id as string;
        const tx = await prisma.transaction.findFirst({
            where: isValidUUID(transaction_id) ? {
                OR: [
                    { id: transaction_id },
                    { invoice_no: transaction_id }
                ]
            } : {
                invoice_no: transaction_id
            },
            include: { details: { include: { product: true } }, cashier: true, member: true }
        });

        if (!tx) {
            return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
        }

        const doc = new PDFDocument({ margin: 20, size: [226, 400] }); // Struk kasir thermal ukuran kecil
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="struk_${tx.invoice_no}.pdf"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(12).text('TOKO BANGUNAN RUKUN JAYA', { align: 'center' });
        doc.fontSize(8).text('Jl. KH. Ahmad Dahlan No.123, Krapyak Kulon, Kec. Kaliwates, Kab. Jember, Jawa Timur', { align: 'center' });
        doc.moveDown();
        
        doc.text(`Invoice: ${tx.invoice_no}`);
        doc.text(`Tanggal: ${tx.created_at.toLocaleString('id-ID')}`);
        doc.text(`Kasir  : ${tx.cashier?.name || 'Kasir / Admin'}`);
        if (tx.member) {
            doc.text(`Member : ${tx.member.name}`);
        }
        doc.moveDown();
        
        // Garis putus-putus
        doc.moveTo(20, doc.y).lineTo(206, doc.y).stroke();
        doc.moveDown();

        // Items
        for (const item of tx.details) {
            const productName = item.product ? item.product.name : 'Item Umum';
            doc.text(`${productName}`, { align: 'left' });
            doc.text(`${item.quantity} x ${Number(item.unit_price).toLocaleString('id-ID')} = ${Number(item.subtotal).toLocaleString('id-ID')}`, { align: 'right' });
        }

        doc.moveDown();
        doc.moveTo(20, doc.y).lineTo(206, doc.y).stroke();
        doc.moveDown();

        // Totals
        doc.text(`Subtotal : Rp ${Number(tx.subtotal).toLocaleString('id-ID')}`, { align: 'right' });
        if (Number(tx.discount_value) > 0) {
            doc.text(`Diskon   : Rp ${Number(tx.discount_value).toLocaleString('id-ID')}`, { align: 'right' });
        }
        if (Number(tx.tax_amount) > 0) {
            doc.text(`Pajak    : Rp ${Number(tx.tax_amount).toLocaleString('id-ID')}`, { align: 'right' });
        }
        
        doc.fontSize(10).text(`Total    : Rp ${Number(tx.grand_total).toLocaleString('id-ID')}`, { align: 'right' });
        doc.fontSize(8).text(`Tunai    : Rp ${Number(tx.cash_paid).toLocaleString('id-ID')}`, { align: 'right' });
        doc.text(`Kembali  : Rp ${Number(tx.change_amount).toLocaleString('id-ID')}`, { align: 'right' });
        
        doc.moveDown(2);
        doc.text('Terima Kasih!', { align: 'center' });
        doc.text('Barang yang sudah dibeli tidak dapat ditukar.', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error("Print Receipt Error:", error);
        return res.status(500).json({ success: false, message: "Terjadi kesalahan saat mencetak struk." });
    }
};


export {
    checkout,
    returnItem,
    printReceipt,
    exportTransactionsExcel,
    getTransactionDetails,
    getTransactionHistory,
    getAllTransactions
};
