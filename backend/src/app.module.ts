import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { UsersModule } from './users/users.module.js';
import { WarehousesModule } from './warehouses/warehouses.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { InventoryTransactionsModule } from './inventory-transactions/inventory-transactions.module.js';
import { StockReceiptsModule } from './stock-receipts/stock-receipts.module.js';
import { StockIssuesModule } from './stock-issues/stock-issues.module.js';
import { StockChecksModule } from './stock-checks/stock-checks.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { validateEnvironment } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        autoIndex: false,
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    SuppliersModule,
    WarehousesModule,
    ProjectsModule,
    InventoryModule,
    InventoryTransactionsModule,
    StockReceiptsModule,
    StockIssuesModule,
    StockChecksModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
