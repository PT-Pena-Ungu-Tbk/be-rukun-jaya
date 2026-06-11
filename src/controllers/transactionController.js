// src/controllers/transactionController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. LOGIKA CHECKOUT TRANSAKSI
const checkout = async (req, res) => {
    // Menerima data dari request Frontend
    const { items, memberId, discountType, discountValue } = req.body;
    const userId = req.user.id; // Diambil dari token JWT

    try {
        // Menggunakan Interactive Transaction agar jika ada 1 proses gagal, semuanya otomatis dibatalkan (rollback)
        const result = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const orderDetails = [];

            // Looping untuk memvalidasi dan memotong stok setiap barang yang dibeli
            for (const item of items) {
                const product = await tx.products.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
                }

                // Validasi ketat: Stok tidak boleh sampai minus
                if (product.current_stock < item.quantity) {
                    throw new Error(`Stok produk '${product.name}' tidak mencukupi. Sisa stok: ${product.current_stock}`);
                }

                // Kurangi stok aktif (current_stock)
                await tx.products.update({
                    where: { id: product.id },
                    data: { current_stock: product.current_stock - item.quantity }
                });

                // Kalkulasi harga (menggunakan parseFloat untuk presisi tipe Decimal di database)
                const itemSubtotal = parseFloat(product.price_sell) * item.quantity;
                subtotal += itemSubtotal;

                orderDetails.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    price: product.price_sell,
                    subtotal: itemSubtotal
                });
            }

            // Hitung Diskon VIP (jika ada)
            let discountAmount = 0;
            if (memberId) {
                if (discountType === 'percentage') {
                    discountAmount = subtotal * (discountValue / 100);
                } else if (discountType === 'nominal') {
                    discountAmount = discountValue;
                }
            }

            const grandTotal = subtotal - discountAmount;
            const invoiceNo = `INV-${Date.now()}`;

            // Catat Header Transaksi
            const transaction = await tx.transactions.create({
                data: {
                    invoice_no: invoiceNo,
                    user_id: userId,
                    member_id: memberId || null,
                    subtotal: subtotal,
                    discount_amount: discountAmount,
                    grand_total: grandTotal
                }
            });

            // Catat Detail Item Transaksi
            const detailsData = orderDetails.map(detail => ({
                transaction_id: transaction.id,
                product_id: detail.product_id,
                quantity: detail.quantity,
                price: detail.price,
                subtotal: detail.subtotal
            }));

            await tx.transaction_details.createMany({
                data: detailsData
            });

            return { transaction, detailsData };
        });

        return res.status(200).json({
            status: "success",
            data: result
        });

    } catch (error) {
        // Error response sesuai standar API Contract
        console.error("Checkout Error:", error.message);
        return res.status(400).json({
            status: "error",
            message: error.message || "Gagal memproses transaksi checkout."
        });
    }
};

// 2. LOGIKA RETUR BARANG CACAT
const returnItem = async (req, res) => {
    const { transactionId, productId, quantity, replacementProductId } = req.body;
    const userId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const defectiveProduct = await tx.products.findUnique({ where: { id: productId } });
            const replacementProduct = await tx.products.findUnique({ where: { id: replacementProductId } });

            if (!defectiveProduct || !replacementProduct) {
                throw new Error("Produk retur atau produk pengganti tidak valid.");
            }

            // Validasi ketersediaan stok barang pengganti
            if (replacementProduct.current_stock < quantity) {
                throw new Error(`Stok barang pengganti '${replacementProduct.name}' tidak mencukupi.`);
            }

            // Tambahkan kuantitas ke defective_stock (barang cacat masuk gudang khusus)
            await tx.products.update({
                where: { id: productId },
                data: { defective_stock: defectiveProduct.defective_stock + quantity }
            });

            // Kurangi current_stock barang pengganti yang diberikan ke pelanggan
            await tx.products.update({
                where: { id: replacementProductId },
                data: { current_stock: replacementProduct.current_stock - quantity }
            });

            // Wajib mencatat ke Audit Log karena memodifikasi data sensitif
            const auditLog = await tx.audit_logs.create({
                data: {
                    user_id: userId,
                    action: "RETURN_GARANSI",
                    table_name: "products",
                    record_id: productId,
                    changes_payload: {
                        message: `Retur barang cacat ${defectiveProduct.name}, diganti dengan ${replacementProduct.name}`,
                        quantity_returned: quantity,
                        transaction_id: transactionId
                    }
                }
            });

            return { message: "Proses klaim garansi berhasil diproses.", auditLog };
        });

        return res.status(200).json({
            status: "success",
            data: result
        });

    } catch (error) {
        console.error("Return Error:", error.message);
        return res.status(400).json({
            status: "error",
            message: error.message || "Gagal memproses retur garansi barang."
        });
    }
};

module.exports = {
    checkout,
    returnItem
};