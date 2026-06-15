import { Request, Response, NextFunction } from 'express';
// src/controllers/transactionController.js
import prisma from '../utils/prismaClient';

// 1. LOGIKA CHECKOUT TRANSAKSI
const checkout = async (req: Request, res: Response) => {
    // Menerima data dari request Frontend
    const { items, member_id, discount_type, discount_value, cash_paid } = req.body;
    const userId = req.user.id; // Diambil dari token JWT

    try {
        // Menggunakan Interactive Transaction agar jika ada 1 proses gagal, semuanya otomatis dibatalkan (rollback)
        const result = await prisma.$transaction(async (tx: any) => {
            let subtotal = 0;
            const orderDetails = [];

            // Looping untuk memvalidasi dan memotong stok setiap barang yang dibeli
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.product_id }
                });

                if (!product) {
                    throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
                }

                // Validasi ketat: Stok tidak boleh sampai minus
                if (product.current_stock < item.quantity) {
                    throw new Error(`Stok produk '${product.name}' tidak mencukupi. Sisa stok: ${product.current_stock}`);
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
            const taxAmount = subtotalAfterDiscount * 0.11; // PPN 11%
            const grandTotal = subtotalAfterDiscount + taxAmount;
            
            if (cash_paid < grandTotal) {
                throw new Error(`Pembayaran kurang. Total tagihan: ${grandTotal}`);
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
        console.error("Checkout Error:", error.message);
        return res.status(400).json({
            status: "error",
            message: error.message || "Gagal memproses transaksi checkout."
        });
    }
};

// 2. LOGIKA RETUR BARANG CACAT
const returnItem = async (req: Request, res: Response) => {
    const { transaction_id, product_id, quantity_returned } = req.body;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const defectiveProduct = await tx.product.findUnique({ where: { id: product_id } });

            if (!defectiveProduct) {
                throw new Error("Produk retur tidak valid.");
            }

            // Validasi ketersediaan stok barang pengganti (sama dengan barang yang diretur)
            if (defectiveProduct.current_stock < quantity_returned) {
                throw new Error(`Stok barang pengganti '${defectiveProduct.name}' tidak mencukupi.`);
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
        console.error("Return Error:", error.message);
        return res.status(400).json({
            status: "error",
            message: error.message || "Gagal memproses retur garansi barang."
        });
    }
};

export { 
    checkout,
    returnItem
 };