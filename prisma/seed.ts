import prisma from '../src/utils/prismaClient';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Membersihkan database lama... 🧹');
  // Menghapus data dari bawah ke atas untuk menghindari error Foreign Key
  await prisma.transactionDetail.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  console.log('Memulai proses seeding mock data... 🌱');

  const hashedPassword = await bcrypt.hash('password_rahasia', 10);

  // --- 1. SEED USERS ---
  const owner = await prisma.user.create({
    data: {
      name: 'Ci Ailing',
      email: 'owner@toko-rukunjaya.com', // Sesuai Kontrak API
      password_hash: hashedPassword,
      role: 'OWNER',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: 'Farhan Kasir',
      email: 'kasir@toko-rukunjaya.com',
      password_hash: hashedPassword,
      role: 'CASHIER',
    },
  });
  console.log('✅ Users berhasil dibuat');

  // --- 2. SEED CATEGORIES ---
  const catSemen = await prisma.category.create({ data: { name: 'Semen & Pasir' } });
  const catPipa = await prisma.category.create({ data: { name: 'Pipa & Aksesoris' } });
  const catMakanan = await prisma.category.create({ data: { name: 'Makanan Instan' } });
  console.log('✅ Categories berhasil dibuat');

  // --- 3. SEED SUPPLIERS ---
  const supSemen = await prisma.supplier.create({
    data: { name: 'PT Semen Indonesia', contact_info: '081100001111' },
  });
  const supWavin = await prisma.supplier.create({
    data: { name: 'PT Wavin Indo', contact_info: '082200002222' },
  });
  const supIndofood = await prisma.supplier.create({
    data: { name: 'PT Indofood CBP', contact_info: '083300003333' },
  });
  console.log('✅ Suppliers berhasil dibuat');

  // --- 4. SEED PRODUCTS ---
  const product1 = await prisma.product.create({
    data: {
      sku_code: 'SMN-TR-50', // Sesuai Kontrak API
      name: 'Semen Tiga Roda 50kg',
      category_id: catSemen.id,
      supplier_id: supSemen.id,
      buy_price: 60000,
      sell_price: 65000,
      current_stock: 450,
      defective_stock: 0,
      min_stock: 100,
      rack_location: 'R-A1-01',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      sku_code: 'MIE-GRG-001',
      name: 'Mie Goreng',
      category_id: catMakanan.id,
      supplier_id: supIndofood.id,
      buy_price: 2500,
      sell_price: 3000,
      current_stock: 100,
      defective_stock: 0,
      min_stock: 20,
      rack_location: 'R-Z9-99',
    },
  });
  console.log('✅ Products berhasil dibuat');

  // --- 5. SEED VIP MEMBERS ---
  const memberVIP = await prisma.member.create({
    data: {
      name: 'Budi Santoso',
      phone_number: '08123456789', // Sesuai Kontrak API
      status: 'ACTIVE',
    },
  });

  console.log('SEEDING SELESAI!');
  console.log(`Cat Makanan ID : ${catMakanan.id}`);
  console.log(`Sup Indofood ID: ${supIndofood.id}`);
  console.log(`Product Mie ID : ${product2.id}`);
  console.log(`VIP Member ID  : ${memberVIP.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });