import mongoose from 'mongoose';
import Asset from '../src/models/Asset';
import AssetCategory from '../src/models/AssetCategory';
import AssetMaintenance from '../src/models/AssetMaintenance';
import AssetTransfer from '../src/models/AssetTransfer';
import Tenant from '../src/models/Tenant';
import User from '../src/models/User';
import Department from '../src/models/Department';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sananbsd2018:qx82VaIZRxOz5TOV@cluster0.k5svuig.mongodb.net/plans-systems';

async function seedAssets() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const tenant = await Tenant.findOne();
  const admin = await User.findOne({ role: 'ADMIN' });
  
  if (!tenant || !admin) {
    console.error('Tenant or Admin user not found. Please run seed.ts first.');
    process.exit(1);
  }

  // Clear existing asset data
  await Promise.all([
    Asset.deleteMany({ tenantId: tenant._id }),
    AssetCategory.deleteMany({ tenantId: tenant._id }),
    AssetMaintenance.deleteMany({ tenantId: tenant._id }),
    AssetTransfer.deleteMany({ tenantId: tenant._id }),
    Department.deleteMany({ tenantId: tenant._id }),
  ]);

  // Create Departments
  const deptOffice = await Department.create({
    tenantId: tenant._id,
    name: 'สํานักงานปลัด',
    code: 'OFFICE',
  });

  const deptEngineering = await Department.create({
    tenantId: tenant._id,
    name: 'กองช่าง',
    code: 'ENG',
  });

  // Create Categories
  const catComputer = await AssetCategory.create({
    tenantId: tenant._id,
    name: 'คอมพิวเตอร์และอุปกรณ์',
    code: 'COM',
  });

  const catVehicle = await AssetCategory.create({
    tenantId: tenant._id,
    name: 'ยานพาหนะและขนส่ง',
    code: 'VEH',
  });

  // Create Assets
  const asset1 = await Asset.create({
    tenantId: tenant._id,
    assetCode: 'COM-001',
    name: 'Laptop Dell Latitude 5420',
    categoryId: catComputer._id,
    departmentId: deptOffice._id,
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 35000,
    status: 'ACTIVE',
    serialNumber: 'SN123456',
  });

  const asset2 = await Asset.create({
    tenantId: tenant._id,
    assetCode: 'VEH-001',
    name: 'รถกระบะ Isuzu D-Max',
    categoryId: catVehicle._id,
    departmentId: deptEngineering._id,
    purchaseDate: new Date('2023-05-10'),
    purchasePrice: 850000,
    status: 'ACTIVE',
    serialNumber: 'ENG-8888',
  });

  // Create Maintenance Record
  await AssetMaintenance.create({
    tenantId: tenant._id,
    assetId: asset2._id,
    maintenanceDate: new Date('2024-02-20'),
    cost: 2500,
    description: 'เปลี่ยนถ่ายน้ำมันเครื่องและตรวจเช็คระยะ',
    provider: 'ศูนย์บริการ Isuzu',
    performedBy: admin._id,
  });

  // Create Transfer Record
  await AssetTransfer.create({
    tenantId: tenant._id,
    assetId: asset1._id,
    fromDepartmentId: deptOffice._id,
    toDepartmentId: deptEngineering._id,
    transferDate: new Date('2024-03-01'),
    reason: 'ยืมใช้งานชั่วคราวสำหรับงานนอกสถานที่',
    authorizedBy: admin._id,
  });

  console.log('Asset seeding completed successfully');
  process.exit(0);
}

seedAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
