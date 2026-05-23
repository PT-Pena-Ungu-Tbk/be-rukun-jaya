// src/controllers/transactionController.js

const calculateVipDiscount = async (req, res) => {
    try {
        // Menerima data dari request Frontend
        const { memberId, phoneNumber, subtotal, discountType, discountValue } = req.body;

        // TODO: Query ke database menggunakan Prisma untuk memverifikasi member VIP
        // Contoh implementasi nanti:
        // const member = await prisma.members.findFirst({ 
        //     where: { OR: [{ id: memberId }, { phone_number: phoneNumber }] }
        // });
        // if (!member) return res.status(404).json({ message: "Member VIP tidak ditemukan" });

        console.log("Memverifikasi data member VIP...");

        let discountAmount = 0;

        // Logika perhitungan diskon sesuai Acceptance Criteria (AC-08)
        if (discountType === 'percentage') {
            discountAmount = subtotal * (discountValue / 100);
        } else if (discountType === 'nominal') {
            discountAmount = discountValue;
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Jenis diskon tidak valid. Pilih percentage atau nominal.'
            });
        }

        const grandTotal = subtotal - discountAmount;

        return res.status(200).json({
            status: 'success',
            data: {
                subtotal: subtotal,
                discountType: discountType,
                discountAmount: discountAmount,
                grandTotal: grandTotal
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server saat menghitung diskon'
        });
    }
};

module.exports = {
    calculateVipDiscount
};