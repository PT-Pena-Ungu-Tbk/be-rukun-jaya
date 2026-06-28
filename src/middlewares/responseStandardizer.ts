import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const responseStandardizer = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] || `req_${crypto.randomUUID().replace(/-/g, '')}`;
    req.headers['x-request-id'] = requestId as string;

    const originalJson = res.json;

    res.json = function (body: any) {
        // Hanya memodifikasi body jika berupa object dan belum tersandarisasi (belum ada timestamp)
        if (body && typeof body === 'object' && !body.timestamp) {
            
            // Mendeteksi apakah ini adalah respons sukses
            const isSuccess = body.success !== undefined ? body.success : 
                             (body.status === 'success' || (res.statusCode >= 200 && res.statusCode < 300));
                             
            const transformedBody: any = {
                success: isSuccess,
                status_code: body.status_code || res.statusCode,
                message: body.message || (isSuccess ? 'Permintaan berhasil diproses' : 'Terjadi kesalahan pada sistem'),
            };

            // Memasukkan field opsional jika ada di body asli
            if (!isSuccess && body.error_code) transformedBody.error_code = body.error_code;
            if (!isSuccess && body.errors) transformedBody.errors = body.errors;
            if (body.data !== undefined) transformedBody.data = body.data;
            if (body.meta !== undefined) transformedBody.meta = body.meta;

            // Jika respons asli hanya berupa data mentah tanpa bungkus 'data' atau 'status'
            if (body.status === undefined && body.success === undefined && body.data === undefined && body.message === undefined) {
                transformedBody.data = body;
            }

            // Tambahkan parameter wajib dari API Contract
            transformedBody.timestamp = new Date().toISOString();
            transformedBody.request_id = requestId;

            // Kembalikan ke fungsi asli untuk dikirim ke client
            res.json = originalJson;
            return originalJson.call(this, transformedBody);
        }

        res.json = originalJson;
        return originalJson.call(this, body);
    };

    next();
};
