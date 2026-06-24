import prisma from '../src/utils/prismaClient';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Membersihkan database lama... 🧹');
  // Menghapus data dari bawah ke atas untuk menghindari error Foreign Key
  await prisma.warrantyClaim.deleteMany();
  await prisma.transactionDetail.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.member.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  console.log('Memulai proses seeding mock data... 🌱');

  const hashedPassword = await bcrypt.hash('password_rahasia', 10);

  // --- 1. SEED USERS & EMPLOYEES ---
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

  const manager = await prisma.user.create({
    data: {
      name: 'Bapak Manager',
      email: 'manager@toko-rukunjaya.com',
      password_hash: hashedPassword,
      role: 'MANAGER',
    },
  });

  const warehouseAdmin = await prisma.user.create({
    data: {
      name: 'Pak Gudang',
      email: 'gudang@toko-rukunjaya.com',
      password_hash: hashedPassword,
      role: 'WAREHOUSE_ADMIN',
    },
  });
  console.log('✅ Users berhasil dibuat');

  const employeeCashier = await prisma.employee.create({
    data: {
      name: 'Farhan Kasir (Employee)',
      email: 'employee-kasir@toko-rukunjaya.com',
      password_hash: hashedPassword,
      role: 'CASHIER',
    },
  });
  console.log('✅ Employees berhasil dibuat');

  // --- 2. SEED CATEGORIES ---
  const catSemen = await prisma.category.create({ data: { name: 'Semen & Pasir' } });
  const catPipa = await prisma.category.create({ data: { name: 'Pipa & Aksesoris' } });
  const catCat = await prisma.category.create({ data: { name: 'Cat & Kuas' } });
  console.log('✅ Categories berhasil dibuat');

  // --- 3. SEED SUPPLIERS ---
  const supSemen = await prisma.supplier.create({
    data: { name: 'PT Semen Indonesia', contact_info: '081100001111' },
  });
  const supWavin = await prisma.supplier.create({
    data: { name: 'PT Wavin Indo', contact_info: '082200002222' },
  });
  const supDulux = await prisma.supplier.create({
    data: { name: 'PT Dulux Indonesia', contact_info: '083300003333' },
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
      sku_code: 'CAT-DLX-05',
      name: 'Cat Tembok Dulux Putih 5kg',
      category_id: catCat.id,
      supplier_id: supDulux.id,
      buy_price: 110000,
      sell_price: 125000,
      current_stock: 50,
      defective_stock: 0,
      min_stock: 10,
      rack_location: 'R-B2-05',
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
  console.log(`Cat Cat & Kuas ID : ${catCat.id}`);
  console.log(`Sup Dulux ID: ${supDulux.id}`);
  console.log(`Product Cat ID : ${product2.id}`);
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