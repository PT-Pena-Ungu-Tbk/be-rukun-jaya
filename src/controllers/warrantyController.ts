import { Request, Response } from 'express';
import prisma from '../utils/prismaClient';
import { AppError } from '../utils/AppError';
import { ReturnReason } from '@prisma/client';
import { isValidUUID } from '../utils/validator';

// 1. CARI NOTA TRANSAKSI UNTUK RETUR (GET /warranty/lookup)
export const lookupWarranty = async (req: Request, res: Response) => {
    const { invoice_no, invoice_id } = req.query;
    const finalInvoiceNo = invoice_no || invoice_id;

    try {
        if (!finalInvoiceNo || typeof finalInvoiceNo !== 'string') {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Parameter invoice_no wajib diisi.'
            });
        }

        // Cari transaksi berdasarkan invoice_no
        const transaction = await prisma.transaction.findUnique({
            where: { invoice_no: finalInvoiceNo as string },
            include: {
                details: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                status: 'error',
                error_code: 'INVOICE_NOT_FOUND',
                message: 'Nota transaksi tidak ditemukan.'
            });
        }

        // Cek masa garansi (maksimal 30 hari sejak transaksi dibuat)
        const transactionDate = new Date(transaction.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            return res.status(410).json({
                success: false,
                status: 'error',
                error_code: 'INVOICE_EXPIRED',
                message: 'Nota transaksi ini telah melebihi batas waktu garansi 30 hari.'
            });
        }

        // Ambil data klaim garansi yang sudah pernah dibuat untuk invoice ini
        const existingClaims = await prisma.warrantyClaim.findMany({
            where: { invoice_id: finalInvoiceNo as string }
        });

        // Map items untuk detail barang
        const mappedItems = transaction.details.map((detail) => {
            const product = detail.product;
            
            // Hitung qty yang sudah pernah diretur untuk produk ini
            const qty_sudah_diretur = existingClaims
                .filter(claim => claim.product_id === product.id)
                .reduce((sum, claim) => sum + claim.qty_diretur, 0);

            const qty_beli = detail.quantity;
            const can_return = (qty_beli - qty_sudah_diretur) > 0;

            return {
                kode_item: product.sku_code,
                nama_barang: product.name,
                qty_beli: qty_beli,
                qty_sudah_diretur: qty_sudah_diretur,
                harga_satuan: Math.round(parseFloat(detail.unit_price.toString())),
                can_return: can_return
            };
        });

        return res.status(200).json({
            success: true,
            status: 'success',
            data: {
                nota_id: transaction.invoice_no,
                tanggal: transaction.created_at,
                items: mappedItems
            }
        });

    } catch (error: any) {
        console.error('Lookup Warranty Error:', error);
        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Terjadi kesalahan internal saat mencari data garansi.'
        });
    }
};

// 2. KONFIRMASI RETUR BARANG (POST /warranty/claims)
export const createWarrantyClaim = async (req: Request, res: Response) => {
    const { invoice_no, product_id, qty, reason, description } = req.body;
    const userId = req.user.id; // Dari token JWT

    try {
        // Validasi field input
        if (!invoice_no || !product_id || !reason || qty === undefined) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Field invoice_no, product_id, reason, dan qty wajib diisi.'
            });
        }

        // Validasi alasan retur
        const validReasons = Object.values(ReturnReason) as string[];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: `Alasan retur tidak valid. Harus salah satu dari: ${validReasons.join(', ')}`
            });
        }

        // Validasi qty
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                status: 'error',
                message: 'Jumlah yang diretur (qty) harus berupa angka positif.'
            });
        }

        // Jalankan transaksi database (interactive transaction)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Cari nota transaksi asal
            const transaction = await tx.transaction.findUnique({
                where: { invoice_no: invoice_no }
            });

            if (!transaction) {
                throw new AppError('Nota transaksi tidak ditemukan.', 404);
            }

            // 2. Cek masa garansi (maksimal 30 hari)
            const transactionDate = new Date(transaction.created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                throw new AppError('Masa garansi nota transaksi ini telah kedaluwarsa.', 410);
            }

            // 3. Cari produk berdasarkan product_id (bisa berupa UUID atau Kode SKU)
            const product = await tx.product.findFirst({
                where: isValidUUID(product_id)
                    ? { id: product_id }
                    : { sku_code: product_id }
            });

            if (!product) {
                throw new AppError(`Produk dengan ${isValidUUID(product_id) ? 'ID' : 'SKU'} '${product_id}' tidak ditemukan.`, 404);
            }

            // 4. Cari detail transaksi produk tersebut
            const detail = await tx.transactionDetail.findFirst({
                where: {
                    transaction_id: transaction.id,
                    product_id: product.id
                }
            });

            if (!detail) {
                throw new AppError('Produk tersebut tidak terdaftar dalam nota transaksi ini.', 400);
            }

            // 5. Hitung kuantitas yang sudah diretur sebelumnya untuk produk ini
            const existingClaims = await tx.warrantyClaim.findMany({
                where: {
                    invoice_id: invoice_no,
                    product_id: product.id
                }
            });
            const qtyAlreadyReturned = existingClaims.reduce((sum, c) => sum + c.qty_diretur, 0);

            // Validasi qty
            const qty_beli = detail.quantity;
            if (qty > (qty_beli - qtyAlreadyReturned)) {
                throw new AppError('Jumlah yang diretur melebihi jumlah pembelian yang tersisa.', 400);
            }

            // 6. Cek stok barang pengganti di gudang
            if (product.current_stock < qty) {
                throw new AppError('Stok barang pengganti tidak mencukupi di gudang.', 422);
            }

            // 7. Update stok produk: kurangi stok aktif dan tambahkan ke stok rusak
            await tx.product.update({
                where: { id: product.id },
                data: {
                    current_stock: product.current_stock - qty,
                    defective_stock: product.defective_stock + qty
                }
            });

            // 8. Hitung estimasi nilai retur
            const estimasi_nilai_retur = qty * Math.round(parseFloat(detail.unit_price.toString()));

            // 9. Buat data klaim garansi
            const claim = await tx.warrantyClaim.create({
                data: {
                    invoice_id: invoice_no,
                    product_id: product.id,
                    alasan_retur: reason as ReturnReason,
                    qty_diretur: qty,
                    deskripsi_kondisi: description || null,
                    status: 'APPROVED',
                    estimasi_nilai_retur: estimasi_nilai_retur,
                    stok_berkurang: true
                }
            });

            // 10. Catat ke Audit Log
            await tx.auditLog.create({
                data: {
                    user_id: userId,
                    action: 'RETURN_GARANSI',
                    table_name: 'warranty_claims',
                    record_id: claim.id,
                    changes_payload: {
                        message: `Retur garansi barang ${product.name} (SKU: ${product.sku_code}) sejumlah ${qty}`,
                        claim_id: claim.id,
                        invoice_id: invoice_no,
                        qty_diretur: qty
                    }
                }
            });

            return claim;
        });

        return res.status(200).json({
            success: true,
            status: 'success',
            data: {
                claim_id: result.id,
                status: result.status,
                estimasi_nilai_retur: result.estimasi_nilai_retur,
                stok_berkurang: result.stok_berkurang,
                catatan: 'Klaim garansi berhasil diproses. Stok pengganti telah dikeluarkan.'
            }
        });

    } catch (error: any) {
        console.error('Create Warranty Claim Error:', error);
        
        if (error instanceof AppError) {
            // Map status codes for contract specifications
            let errCode = 'VALIDATION_ERROR';
            if (error.statusCode === 404) errCode = 'INVOICE_NOT_FOUND';
            if (error.statusCode === 410) errCode = 'INVOICE_EXPIRED';
            if (error.statusCode === 422) errCode = 'INSUFFICIENT_STOCK';
            if (error.statusCode === 400 && error.message.includes('melebihi')) errCode = 'INVALID_QTY';

            return res.status(error.statusCode).json({
                success: false,
                status: 'error',
                error_code: errCode,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            status: 'error',
            message: 'Terjadi kesalahan internal saat memproses klaim garansi.'
        });
    }
};
