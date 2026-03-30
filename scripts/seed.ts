import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { Role } from '../src/models/User';
import Tenant from '../src/models/Tenant';
import Plan from '../src/models/Plan';
import Project from '../src/models/Project';
import Budget from '../src/models/Budget';
import KPI from '../src/models/KPI';
import Department from '../src/models/Department';
import Employee, { EmployeeStatus } from '../src/models/Employee';
import PerformanceKPI from '../src/models/PerformanceKPI';
import EvaluationPeriod, { EvaluationPeriodStatus } from '../src/models/EvaluationPeriod';
import Evaluation, { EvaluationStatus } from '../src/models/Evaluation';
import EvaluationItem from '../src/models/EvaluationItem';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sananbsd2018:qx82VaIZRxOz5TOV@cluster0.k5svuig.mongodb.net/plans-systems';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Tenant.deleteMany({}),
    Plan.deleteMany({}),
    Project.deleteMany({}),
    Budget.deleteMany({}),
    KPI.deleteMany({}),
    Department.deleteMany({}),
    Employee.deleteMany({}),
    PerformanceKPI.deleteMany({}),
    EvaluationPeriod.deleteMany({}),
    Evaluation.deleteMany({}),
    EvaluationItem.deleteMany({}),
  ]);

  // Create Tenant
  const tenant = await Tenant.create({
    name: 'สํานักงาน อบต. ตัวอย่าง',
    domain: 'example.obt.go.th',
  });

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await User.create({
    tenantId: tenant._id,
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: hashedPassword,
    role: Role.ADMIN,
  });

  const executive = await User.create({
    tenantId: tenant._id,
    name: 'Executive User',
    email: 'exec@example.com',
    passwordHash: hashedPassword,
    role: Role.EXECUTIVE,
  });

  // Create Departments & Employees for Evaluation Test
  const itDept = await Department.create({
    tenantId: tenant._id,
    name: 'กองช่าง (ฝ่ายไอที)',
    managerId: executive._id,
  });

  const adminEmployee = await Employee.create({
    tenantId: tenant._id,
    userId: admin._id,
    employeeId: 'EMP001',
    firstName: 'สมชาย',
    lastName: 'ผู้ดูแลระบบ',
    email: 'admin@example.com',
    departmentId: itDept._id,
    position: 'นักวิชาการคอมพิวเตอร์',
    status: EmployeeStatus.ACTIVE,
  });

  // Create Performance KPIs
  const perfKpi1 = await PerformanceKPI.create({
    tenantId: tenant._id,
    name: 'ความสำเร็จในการพัฒนาระบบซอฟต์แวร์',
    description: 'ส่งมอบระบบงานตรงเวลาและลดจำนวน Bug ให้มีน้อยกว่าอัตราร้อยละ 5',
    weight: 60,
    targetScore: 100,
    departmentId: itDept._id,
  });

  const perfKpi2 = await PerformanceKPI.create({
    tenantId: tenant._id,
    name: 'การให้บริการและแก้ไขปัญหา',
    description: 'แก้ไข Ticket การขอความช่วยเหลือจากผู้ใช้งานภายในระยะเวลา SLA',
    weight: 40,
    targetScore: 100,
    departmentId: itDept._id,
  });

  // Create Evaluation Period
  const period = await EvaluationPeriod.create({
    tenantId: tenant._id,
    name: 'รอบการประเมินประจำครึ่งปีแรก 2567',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    status: EvaluationPeriodStatus.OPEN,
  });

  // Create Initial Evaluation for Admin
  const evalRecord = await Evaluation.create({
    tenantId: tenant._id,
    periodId: period._id,
    employeeId: adminEmployee._id,
    evaluatorId: executive._id, // Executive evaluates Admin
    status: EvaluationStatus.PENDING,
  });

  // Create Evaluation Items Linked to KPIs
  await EvaluationItem.create([
    {
      evaluationId: evalRecord._id,
      kpiId: perfKpi1._id,
    },
    {
      evaluationId: evalRecord._id,
      kpiId: perfKpi2._id,
    },
  ]);

  // Create Plan
  const plan = await Plan.create({
    tenantId: tenant._id,
    title: 'แผนพัฒนาท้องถิ่นถาวร 2567-2570',
    description: 'แผนยุทธศาสตร์เพื่อการพัฒนาอย่างยั่งยืน',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2027-12-31'),
    status: 'APPROVED',
    createdBy: admin._id,
  });

  // Create Projects
  const project1 = await Project.create({
    tenantId: tenant._id,
    planId: plan._id,
    name: 'โครงการก่อสร้างถนนคอนกรีตเสริมเหล็ก หมู่ 5',
    description: 'ก่อสร้างถนนเพื่อการสัญจรที่สะดวกขึ้น',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-06-30'),
    status: 'IN_PROGRESS',
    budgetAllocated: 1500000,
    location: { type: 'Point', coordinates: [100.5018, 13.7563] },
    createdBy: admin._id,
  });

  const project2 = await Project.create({
    tenantId: tenant._id,
    planId: plan._id,
    name: 'โครงการติดตั้งโคมไฟถนนพลังงานแสงอาทิตย์',
    description: 'เพื่อเพิ่มความปลอดภัยในเวลากลางคืน',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-08-31'),
    status: 'PLANNED',
    budgetAllocated: 800000,
    location: { type: 'Point', coordinates: [100.5218, 13.7363] },
    createdBy: admin._id,
  });

  // Create KPIs
  await KPI.create({
    tenantId: tenant._id,
    projectId: project1._id,
    name: 'ความคืบหน้าการก่อสร้าง',
    metric: 'เปอร์เซ็นต์งาน',
    targetValue: 100,
    currentValue: 45,
    unit: '%',
  });

  await KPI.create({
    tenantId: tenant._id,
    projectId: project1._id,
    name: 'คุณภาพพื้นผิวถนน',
    metric: 'คะแนนการทดสอบ',
    targetValue: 10,
    currentValue: 8,
    unit: 'คะแนน',
  });

  // Create Budget tracking
  await Budget.create({
    tenantId: tenant._id,
    projectId: project1._id,
    year: 2024,
    allocatedAmount: 1500000,
    spentAmount: 650000,
    department: 'กองช่าง',
  });

  console.log('Seeding completed successfully');
  console.log('Admin Login: admin@example.com / password123');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
