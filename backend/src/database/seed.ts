import { NestFactory } from '@nestjs/core';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import type { Connection, Model } from 'mongoose';
import { AppModule } from '../app.module.js';
import { Category } from '../categories/schemas/category.schema.js';
import {
  EntityStatus,
  ProjectStatus,
  Role,
  UserStatus,
} from '../common/enums/domain.enum.js';
import { normalizeName } from '../common/utils/query.util.js';
import { Product } from '../products/schemas/product.schema.js';
import { Project } from '../projects/schemas/project.schema.js';
import { StockChecksService } from '../stock-checks/stock-checks.service.js';
import { StockIssuesService } from '../stock-issues/stock-issues.service.js';
import { StockReceiptsService } from '../stock-receipts/stock-receipts.service.js';
import { Supplier } from '../suppliers/schemas/supplier.schema.js';
import { User } from '../users/schemas/user.schema.js';
import { Warehouse } from '../warehouses/schemas/warehouse.schema.js';

const categories = [
  ['PIN', 'Tấm pin năng lượng mặt trời'],
  ['INV', 'Biến tần'],
  ['BAT', 'Pin lưu trữ'],
  ['CAB', 'Dây cáp điện mặt trời'],
  ['CON', 'Đầu nối và phụ kiện'],
  ['PRO', 'Thiết bị bảo vệ DC/AC'],
  ['MOU', 'Hệ khung giá đỡ'],
  ['MON', 'Thiết bị giám sát'],
  ['BOX', 'Tủ điện và hộp kỹ thuật'],
  ['TOO', 'Dụng cụ thi công'],
] as const;

const productRows = [
  [
    'PIN-JK-575',
    'Jinko Tiger Neo 575W',
    0,
    'Jinko Solar',
    'JKM575N-72HL4',
    'tấm',
    3150000,
    10,
    144,
  ],
  [
    'PIN-AIKO-600',
    'AIKO Neostar 600W',
    0,
    'AIKO',
    'AIKO-A600-MAH72Mw',
    'tấm',
    3650000,
    8,
    144,
  ],
  [
    'PIN-LN-580',
    'LONGi Hi-MO 7 580W',
    0,
    'LONGi',
    'LR7-72HGD-580M',
    'tấm',
    3300000,
    10,
    144,
  ],
  [
    'PIN-CS-550',
    'Canadian Solar TOPHiKu6 550W',
    0,
    'Canadian Solar',
    'CS6.1-54TM-550',
    'tấm',
    2980000,
    8,
    144,
  ],
  [
    'INV-DEYE-5K',
    'Deye SUN-5K-SG Hybrid',
    1,
    'Deye',
    'SUN-5K-SG03LP1-EU',
    'bộ',
    28500000,
    3,
    60,
  ],
  [
    'INV-DEYE-8K',
    'Deye SUN-8K-SG Hybrid',
    1,
    'Deye',
    'SUN-8K-SG01LP1-EU',
    'bộ',
    39800000,
    3,
    60,
  ],
  [
    'INV-SOLIS-10K',
    'Solis 10K Three Phase',
    1,
    'Solis',
    'S5-GR3P10K',
    'bộ',
    26500000,
    2,
    60,
  ],
  [
    'INV-GW-5K',
    'GoodWe GW5000-ES-20',
    1,
    'GoodWe',
    'GW5000-ES-20',
    'bộ',
    31000000,
    2,
    60,
  ],
  [
    'BAT-DY-512',
    'Dyness 5.12kWh',
    2,
    'Dyness',
    'DL5.0C',
    'module',
    24800000,
    3,
    120,
  ],
  [
    'BAT-PY-US5000',
    'Pylontech US5000 4.8kWh',
    2,
    'Pylontech',
    'US5000',
    'module',
    29200000,
    3,
    84,
  ],
  [
    'BAT-DEYE-61',
    'Deye SE-G6.1 Pro-B',
    2,
    'Deye',
    'SE-G6.1-Pro-B',
    'module',
    31500000,
    2,
    120,
  ],
  [
    'CAB-DC4-R',
    'DC Cable 4mm2 Red',
    3,
    'Leader',
    'H1Z2Z2-K-4-R',
    'mét',
    18500,
    200,
    24,
  ],
  [
    'CAB-DC4-B',
    'DC Cable 4mm2 Black',
    3,
    'Leader',
    'H1Z2Z2-K-4-B',
    'mét',
    18500,
    200,
    24,
  ],
  [
    'CAB-DC6-R',
    'DC Cable 6mm2 Red',
    3,
    'Leader',
    'H1Z2Z2-K-6-R',
    'mét',
    26500,
    150,
    24,
  ],
  [
    'CAB-AC4-4',
    'AC Cable 4x4mm2',
    3,
    'Cadivi',
    'CVV-4x4',
    'mét',
    72000,
    100,
    12,
  ],
  [
    'CON-MC4-01',
    'MC4 Connector Pair',
    4,
    'Stäubli',
    'MC4-EVO2',
    'cặp',
    95000,
    50,
    24,
  ],
  [
    'CON-BR-21',
    'MC4 Branch Connector 2-to-1',
    4,
    'Stäubli',
    'PV-AZS4',
    'cặp',
    310000,
    15,
    24,
  ],
  [
    'CON-TERM-06',
    'Đầu cos đồng 6mm2',
    4,
    'Longyi',
    'SC6-6',
    'cái',
    8500,
    100,
    0,
  ],
  [
    'PRO-SPD-DC',
    'DC SPD 1000V Type 2',
    5,
    'CHINT',
    'NXU-II-G-DC',
    'cái',
    680000,
    10,
    18,
  ],
  [
    'PRO-MCCB-DC',
    'DC MCCB 2P 125A 500V',
    5,
    'Noark',
    'Ex9MD2S-125',
    'cái',
    1450000,
    8,
    18,
  ],
  [
    'PRO-MCB-AC',
    'AC MCB 4P 40A 10kA',
    5,
    'Schneider',
    'A9F74440',
    'cái',
    920000,
    8,
    18,
  ],
  [
    'PRO-RCD-AC',
    'AC RCCB 4P 40A 30mA',
    5,
    'Schneider',
    'A9R54440',
    'cái',
    1850000,
    5,
    18,
  ],
  [
    'MOU-RAIL-42',
    'Solar Mounting Rail 4.2m',
    6,
    'SolarBK',
    'SR-4200',
    'thanh',
    385000,
    30,
    24,
  ],
  [
    'MOU-END-35',
    'Kẹp biên pin 35mm',
    6,
    'SolarBK',
    'EC-35',
    'cái',
    29000,
    60,
    24,
  ],
  [
    'MOU-MID-35',
    'Kẹp giữa pin 35mm',
    6,
    'SolarBK',
    'MC-35',
    'cái',
    32000,
    100,
    24,
  ],
  [
    'MON-DONGLE',
    'Solis WiFi Data Logging Stick',
    7,
    'Solis',
    'S2-WL-ST',
    'cái',
    1250000,
    5,
    12,
  ],
  [
    'MON-METER',
    'Deye Smart Meter 3 Phase',
    7,
    'Deye',
    'CHNT-DTSU666',
    'bộ',
    2950000,
    3,
    24,
  ],
  [
    'BOX-CB12',
    'Tủ điện Solar 12 module IP65',
    8,
    'MPE',
    'WP-12M',
    'cái',
    780000,
    8,
    12,
  ],
  [
    'TOO-CRIMP',
    'Kìm bấm cos MC4 chuyên dụng',
    9,
    'Proskit',
    'CP-371',
    'cái',
    1150000,
    2,
    12,
  ],
  [
    'TOO-METER',
    'Đồng hồ đo điện mặt trời',
    9,
    'Hioki',
    'IR4056-21',
    'cái',
    4850000,
    2,
    36,
  ],
] as const;

function monthsAgo(months: number, day: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, day, 9, 0, 0);
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const connection = app.get<Connection>(getConnectionToken());
  if (process.env.SEED_ALLOW_RESET !== 'true')
    throw new Error(
      'SEED_ALLOW_RESET phải là true để seed có thể đặt lại database demo.',
    );
  await connection.dropDatabase();

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));
  const supplierModel = app.get<Model<Supplier>>(getModelToken(Supplier.name));
  const warehouseModel = app.get<Model<Warehouse>>(
    getModelToken(Warehouse.name),
  );
  const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
  for (const model of Object.values(connection.models))
    await model.syncIndexes();

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const users = await userModel.insertMany([
    {
      email: 'admin@solar.local',
      passwordHash,
      fullName: 'Nguyễn Minh Quản trị',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'warehouse@solar.local',
      passwordHash,
      fullName: 'Trần Thị Thủ kho',
      role: Role.WAREHOUSE_MANAGER,
      status: UserStatus.ACTIVE,
    },
    {
      email: 'staff@solar.local',
      passwordHash,
      fullName: 'Lê Hoàng Nhân viên',
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
    },
  ]);
  const categoryDocs = await categoryModel.insertMany(
    categories.map(([code, name]) => ({
      code,
      name,
      normalizedName: normalizeName(name),
      status: EntityStatus.ACTIVE,
    })),
  );
  const products = await productModel.insertMany(
    productRows.map(
      ([
        sku,
        name,
        categoryIndex,
        brand,
        model,
        unit,
        costPrice,
        minStock,
        warrantyMonths,
      ]) => ({
        sku,
        name,
        categoryId: categoryDocs[categoryIndex]._id,
        brand,
        model,
        unit,
        costPrice,
        minStock,
        warrantyMonths,
        status: EntityStatus.ACTIVE,
        description: `${name} dùng cho hệ thống điện năng lượng mặt trời dân dụng và công nghiệp.`,
      }),
    ),
  );
  const suppliers = await supplierModel.insertMany([
    {
      code: 'NCC-JINKO',
      name: 'Jinko Solar Việt Nam',
      contactName: 'Phạm Quốc Huy',
      phone: '0901000001',
      email: 'sales@jinkosolar.vn',
      address: 'TP. Hồ Chí Minh',
      status: EntityStatus.ACTIVE,
    },
    {
      code: 'NCC-DEYE',
      name: 'Deye Energy Việt Nam',
      contactName: 'Đỗ Minh Anh',
      phone: '0901000002',
      email: 'sales@deye.vn',
      address: 'Hà Nội',
      status: EntityStatus.ACTIVE,
    },
    {
      code: 'NCC-SBK',
      name: 'Công ty CP Năng lượng SolarBK',
      contactName: 'Võ Thanh Nam',
      phone: '0901000003',
      email: 'kho@solarbk.vn',
      address: 'TP. Hồ Chí Minh',
      status: EntityStatus.ACTIVE,
    },
    {
      code: 'NCC-GREEN',
      name: 'Công ty Thiết bị Green Power',
      contactName: 'Nguyễn Ngọc Mai',
      phone: '0901000004',
      email: 'contact@greenpower.vn',
      address: 'Đà Nẵng',
      status: EntityStatus.ACTIVE,
    },
    {
      code: 'NCC-CADIVI',
      name: 'Công ty Dây cáp điện Việt Nam',
      contactName: 'Trần Quốc Bảo',
      phone: '0901000005',
      email: 'sales@cadivi.vn',
      address: 'TP. Hồ Chí Minh',
      status: EntityStatus.ACTIVE,
    },
  ]);
  const warehouses = await warehouseModel.insertMany([
    {
      code: 'KHO-HCM',
      name: 'Kho trung tâm TP.HCM',
      address: '12 Đường số 5, TP. Thủ Đức, TP.HCM',
      description: 'Kho thiết bị và vật tư chính.',
      status: EntityStatus.ACTIVE,
    },
    {
      code: 'KHO-DN',
      name: 'Kho chi nhánh Đà Nẵng',
      address: '86 Nguyễn Sinh Sắc, Đà Nẵng',
      description: 'Kho phục vụ công trình miền Trung.',
      status: EntityStatus.ACTIVE,
    },
  ]);
  const projects = await projectModel.insertMany(
    Array.from({ length: 10 }, (_, i) => ({
      code: `CT-2026-${String(i + 1).padStart(3, '0')}`,
      name: [
        'Nhà máy May Hòa Phát',
        'Biệt thự An Phú',
        'Trang trại Bình Minh',
        'Kho lạnh Mekong',
        'Khách sạn Biển Xanh',
        'Nhà xưởng Đại Thành',
        'Trường THPT Nguyễn Du',
        'Farmstay Mộc Nhiên',
        'Siêu thị Minh Long',
        'Văn phòng GreenHub',
      ][i],
      customerName: [
        'Hòa Phát Textile',
        'Nguyễn Văn An',
        'HTX Bình Minh',
        'Mekong Cold',
        'Biển Xanh Group',
        'Đại Thành JSC',
        'Sở Giáo dục',
        'Mộc Nhiên Farm',
        'Minh Long Mart',
        'GreenHub',
      ][i],
      address: [
        'Bình Dương',
        'TP. Thủ Đức',
        'Đồng Nai',
        'Cần Thơ',
        'Đà Nẵng',
        'Long An',
        'Quảng Nam',
        'Lâm Đồng',
        'Huế',
        'TP. Hồ Chí Minh',
      ][i],
      capacity: [500, 12, 100, 250, 80, 320, 50, 30, 120, 45][i],
      status: i < 7 ? ProjectStatus.IN_PROGRESS : ProjectStatus.PLANNED,
      startDate: monthsAgo(5 - (i % 5), 5 + i),
      note: 'Công trình demo ngành điện năng lượng mặt trời.',
    })),
  );

  const receiptsService = app.get(StockReceiptsService);
  const issuesService = app.get(StockIssuesService);
  const checksService = app.get(StockChecksService);
  console.log('Đã tạo dữ liệu danh mục; bắt đầu xác nhận 15 phiếu nhập.');
  for (let i = 0; i < 15; i += 1) {
    const first = products[(i * 2) % products.length];
    const second = products[(i * 2 + 1) % products.length];
    const receiptDate = monthsAgo(5 - (i % 6), 3 + (i % 20));
    const receipt = await receiptsService.create(
      {
        supplierId: String(suppliers[i % suppliers.length]._id),
        warehouseId: String(warehouses[i % 2]._id),
        receiptDate,
        note: `Nhập hàng Solar đợt ${i + 1}`,
        items: [
          {
            productId: String(first._id),
            quantity: 35 + (i % 8),
            unitPrice: first.costPrice,
          },
          {
            productId: String(second._id),
            quantity: 30 + (i % 7),
            unitPrice: second.costPrice,
          },
        ],
      },
      String(users[1]._id),
    );
    await receiptsService.confirm(String(receipt._id), String(users[1]._id));
    await connection
      .collection('inventory_transactions')
      .updateMany(
        { referenceId: receipt._id },
        { $set: { createdAt: receiptDate } },
      );
  }
  console.log('Đã xác nhận 15 phiếu nhập; bắt đầu xác nhận 15 phiếu xuất.');
  for (let i = 0; i < 15; i += 1) {
    const first = products[(i * 2) % products.length];
    const second = products[(i * 2 + 1) % products.length];
    const issueDate = monthsAgo(4 - (i % 5), 10 + (i % 15));
    const issue = await issuesService.create(
      {
        warehouseId: String(warehouses[i % 2]._id),
        projectId: String(projects[i % 7]._id),
        issueDate,
        note: `Xuất thiết bị cho công trình ${projects[i % 7].code}`,
        items: [
          { productId: String(first._id), quantity: 3 + (i % 3) },
          { productId: String(second._id), quantity: 2 + (i % 2) },
        ],
      },
      String(users[1]._id),
    );
    await issuesService.confirm(String(issue._id), String(users[1]._id));
    await connection
      .collection('inventory_transactions')
      .updateMany(
        { referenceId: issue._id },
        { $set: { createdAt: issueDate } },
      );
  }
  console.log('Đã xác nhận 15 phiếu xuất; bắt đầu phiếu kiểm kê mẫu.');
  const check = await Promise.race([
    checksService.create(
      {
        warehouseId: String(warehouses[0]._id),
        checkDate: new Date(),
        note: 'Kiểm kê demo điều chỉnh chênh lệch thực tế.',
        items: [{ productId: String(products[0]._id), actualQuantity: 31 }],
      },
      String(users[1]._id),
    ),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout khi lập phiếu kiểm kê seed.')),
        5_000,
      ),
    ),
  ]);
  console.log('Đã lập phiếu kiểm kê; đang xác nhận điều chỉnh.');
  await checksService.confirm(String(check._id), String(users[1]._id));

  console.log(
    'Seed hoàn tất: 3 users, 10 categories, 30 products, 5 suppliers, 2 warehouses, 10 projects, 15 receipts, 15 issues và 1 stock check.',
  );
  console.log('Demo login: admin@solar.local / Admin@123');
  await app.close();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
