# PHASES COMPLETED

## Project Summary

Solar Inventory Management System là ứng dụng local quản lý thiết bị điện năng lượng mặt trời, bao gồm user/RBAC, master data, tồn kho đa kho, nhập/xuất, công trình, kiểm kê, transaction history, low-stock, dashboard và reports. Correctness của Inventory và audit history là ưu tiên cao nhất.

## Architecture

```text
Next.js App Router + TypeScript
        |
        | REST / Bearer JWT
        v
NestJS modular REST API
        |
        | Mongoose / MongoDB Session
        v
MongoDB local replica set (rs0)
```

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query/Table, React Hook Form, Zod, Recharts, Lucide React.
- Backend: NestJS, TypeScript, Swagger, class-validator, class-transformer, JWT/Passport, bcrypt.
- Database: MongoDB, Mongoose, `@nestjs/mongoose`.
- Explicitly excluded: PostgreSQL, Prisma, Docker, deployment/cloud infrastructure.

## MongoDB Collections

- `users`, `categories`, `products`, `suppliers`, `warehouses`, `inventories`.
- `stock_receipts` với embedded receipt items.
- `stock_issues` với embedded issue items.
- `stock_checks` với embedded check items.
- `inventory_transactions` append-only.
- `projects`.

Inventory có unique `(productId, warehouseId)`; Product không có quantity.

## Backend Modules

Auth, Users, Categories, Products, Suppliers, Warehouses, Projects, Inventory, InventoryTransactions, StockReceipts, StockIssues, StockChecks, Dashboard, Reports, Database và Common infrastructure.

## Frontend Modules

Auth/Login, Admin Layout, Dashboard, Users, Categories, Products, Suppliers, Warehouses, Projects, Inventory, Transaction History, Stock Receipt, Stock Issue, Stock Check và Reports.

## Core Business Rules

- Inventory.quantity luôn >=0 và không có public direct mutation API.
- Receipt/Issue/Check chỉ ảnh hưởng tồn khi CONFIRMED.
- Core confirms chạy trong MongoDB session transaction trên replica set.
- Issue dùng atomic conditional decrement `quantity >= requested` + `$inc`; không dùng find-check-save.
- Mỗi biến động tạo transaction với signed quantity, previousQuantity, newQuantity, reference và creator.
- Multi-item operations all-or-nothing; double-confirm bị từ chối.
- StockCheck dùng quantity/version snapshot để phát hiện stale data.
- Confirmed documents và transaction ledger bất biến trong MVP.

## API Summary

- Prefix: `/api/v1`; Swagger: `/api/docs`.
- Auth/Users và CRUD master-data APIs.
- Inventory/low-stock/summary read APIs.
- Receipt/Issue/Check draft, update, confirm, cancel APIs.
- Transaction history/reference APIs.
- Dashboard aggregate API.
- Inventory/movement/documents/project/low-stock report APIs.
- Success/error envelopes, pagination, validation và HTTP status thống nhất.

## Frontend Design Summary

- Flat, clean, dense professional dashboard.
- Slate primary + stock green accent, Inter, minimal motion, no gradients/3D/excessive shadows.
- shadcn semantic tables/dialogs/forms, Lucide icons, responsive sidebar/mobile Sheet.
- Recharts grouped bars cho six-month movement và horizontal bars cho category distribution, kèm accessible data fallback.

## Implementation Order

1. Project/config/Mongoose foundation.
2. Schemas/seed/auth/RBAC/users/master data.
3. Inventory/ledger/receipt/issue/check.
4. Dashboard/reports/Swagger and backend gates.
5. Frontend foundation/auth/layout/CRUD/core workflow/dashboard/reports.
6. Seed, integration workflow, concurrency tests, bug fixes và README.

## Known Risks

- Local MongoDB chưa chạy replica set sẽ không hỗ trợ required transactions.
- Omitted session trong một nested write có thể phá atomicity; giảm thiểu bằng central helper và rollback e2e tests.
- Concurrent inventory upsert/code generation có unique conflict; dùng indexes và bounded transient retry.
- Package major-version compatibility Next/shadcn/Tailwind cần được build-check ngay sau scaffold.
- MongoDB availability có thể khiến integration NOT TESTED dù builds PASS; kết quả phải báo trung thực.

## Testing Strategy

- Backend unit + Supertest e2e trên test replica set.
- Race tests cho over-issue/double-confirm/upsert.
- Reconciliation giữa sum transactions và Inventory.
- Frontend lint/build, form/error/cache/RBAC checks và responsive/accessibility QA.
- End-to-end demo workflow định lượng 0 -> 20 -> 15 -> rejected 30 -> 14.

## Cross-Phase Consistency Review

- Naming collections/fields/enums đã thống nhất Mongoose embedded-items.
- Tất cả API modules được chuẩn hóa dưới `/api/v1`.
- `createdBy`, `previousQuantity`, `newQuantity`, `referenceType/referenceId` thống nhất.
- Frontend contracts khớp response/error/pagination/RBAC backend.
- Receipt/Issue/Check đều dùng session transaction và central Inventory mutation.
- Dashboard/reports chỉ tính đúng current inventory/confirmed documents/ledger theo metric.
- ERD cũ đã được ghi đè bằng mô hình embedded-items Mongoose.

## Total Phases

**24 / 24 DONE**

Cross-Phase Review: **DONE**
