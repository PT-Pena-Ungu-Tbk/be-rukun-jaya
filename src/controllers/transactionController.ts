import { Request, Response, NextFunction } from 'express';
// src/controllers/transactionController.js
import prisma from '../utils/prismaClient';
import { AppError } from '../utils/AppError';
import { isValidUUID } from '../utils/validator';
import * as xlsx from 'xlsx';

// 1. LOGIKA CHECKOUT TRANSAKSI
const checkout = async (req: Request, res: Response) => {
    // Menerima data dari request Frontend
    const { items, member_id, discount_type, discount_value, cash_paid } = req.body;
    const userId = req.user.id; // Diambil dari token JWT

    try {
        if (member_id && !isValidUUID(member_id)) {
            throw new AppError("ID Member tidak valid.");
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new AppError("Daftar barang (items) tidak boleh kosong.");
        }

        // Menggunakan Interactive Transaction agar jika ada 1 proses gagal, semuanya otomatis dibatalkan (rollback)
        const result = await prisma.$transaction(async (tx: any) => {
            let subtotal = 0;
            const orderDetails = [];

            // Looping untuk memvalidasi dan memotong stok setiap barang yang dibeli
            for (const item of items) {
                if (!isValidUUID(item.product_id)) {
                    throw new AppError(`ID Produk tidak valid pada salah satu item.`);
                }
                const product = await tx.product.findUnique({
                    where: { id: item.product_id }
                });

                if (!product) {
                    throw new AppError(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
                }

                // Validasi ketat: Stok tidak boleh sampai minus
                if (product.current_stock < item.quantity) {
                    throw new AppError(`Stok produk '${product.name}' tidak mencukupi. Sisa stok: ${product.current_stock}`);
                }

                // Kurangi stok aktif (current_stock)
                await tx.product.update({
                    where: { id: product.id },
                    data: { current_stock: product.current_stock - item.quantity }
                });

                // Kalkulasi harga (menggunakan parseFloat untuk presisi tipe Decimal di database)
                const itemSubtotal = parseFloat(product.sell_price) * item.quantity;
                subtotal += itemSubtotal;

                orderDetails.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    unit_price: product.sell_price,
                    subtotal: itemSubtotal
                });
            }

            // Hitung Diskon VIP (jika ada)
            let discountAmount = 0;
            if (member_id) {
                if (discount_type === 'PERCENTAGE') {
                    discountAmount = subtotal * (discount_value / 100);
                } else if (discount_type === 'NOMINAL') {
                    discountAmount = discount_value;
                }
            }

            const subtotalAfterDiscount = subtotal - discountAmount;
            const taxAmount = subtotalAfterDiscount * 0.11; // PPN 11% Jika terdaftar dalam usaha yang dikenai pajak
            const grandTotal = subtotalAfterDiscount + taxAmount;
            
            if (cash_paid < grandTotal) {
                throw new AppError(`Pembayaran kurang. Total tagihan: ${grandTotal}`);
            }
            const changeAmount = cash_paid - grandTotal;
            const invoiceNo = `INV-${Date.now()}`;

            // Catat Header Transaksi
            const transaction = await tx.transaction.create({
                data: {
                    invoice_no: invoiceNo,
                    cashier_id: userId,
                    member_id: member_id || null,
                    subtotal: subtotal,
                    discount_type: discount_type || 'NOMINAL',
                    discount_value: discount_value || 0,
                    tax_amount: taxAmount,
                    grand_total: grandTotal,
                    cash_paid: cash_paid,
                    change_amount: changeAmount
                }
            });

            // Catat Detail Item Transaksi
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

            return { transaction, detailsData };
        });

        // Mengembalikan sesuai dengan dokumentasi API
        return res.status(201).json({
            status: "success",
            message: "Transaksi berhasil disimpan",
            data: {
                id: result.transaction.id,
                invoice_no: result.transaction.invoice_no,
                subtotal: result.transaction.subtotal,
                discount_amount: (result.transaction.discount_type === 'PERCENTAGE' 
                                    ? (parseFloat(result.transaction.subtotal) * (parseFloat(result.transaction.discount_value) / 100)) 
                                    : parseFloat(result.transaction.discount_value)).toString(),
                tax_amount: result.transaction.tax_amount,
                grand_total: result.transaction.grand_total,
                cash_paid: result.transaction.cash_paid,
                change_amount: result.transaction.change_amount,
                created_at: result.transaction.created_at
            }
        });

    } catch (error: any) {
        console.error("Checkout Error:", error);
        
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                status: "error",
                message: error.message
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan internal saat memproses transaksi checkout."
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
        const where: any= {};

        //Filter Status
        if (status && status !== 'all'){
            where.status = status;
        }

        //Filter Rentang Tanggal
        if (startDate || endDate){
            where.created_at = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
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
            orderBy: { created_at: 'desc'},
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

export { 
    checkout,
    returnItem,
    exportTransactionsExcel
 };