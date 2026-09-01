# Solar Inventory Management System

Hệ thống quản lý kho thiết bị điện năng lượng mặt trời, phục vụ demo local và báo cáo thực tập phần mềm. Ứng dụng hỗ trợ quản lý danh mục, thiết bị, nhà cung cấp, nhiều kho, công trình, nhập kho, xuất kho, kiểm kê, lịch sử biến động, cảnh báo tồn thấp, dashboard và báo cáo.

Đây không phải ứng dụng CRUD thuần túy: mọi nghiệp vụ làm thay đổi tồn kho đều chạy bằng MongoDB transaction và sinh `InventoryTransaction` để truy vết. Tồn kho chỉ được lưu trong collection `inventories`; `products` không có field `quantity`.

## Tech stack

- Frontend: Next.js 16, TypeScript, App Router, Tailwind CSS 4, shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts, Lucide.
- Backend: NestJS 12, TypeScript, REST API, Swagger/OpenAPI, `class-validator`, `class-transformer`.
- Database: MongoDB 8, Mongoose 9, `@nestjs/mongoose`.
- Authentication: JWT, bcrypt, Role-Based Access Control.
- Package manager: npm.

> Stack chính thức là MongoDB + Mongoose. Dự án không dùng PostgreSQL, Prisma, Docker, Nginx hoặc cloud deployment.

## Kiến trúc

```text
Next.js :3000
    │ REST + JWT
    ▼
NestJS :3001 ─── Swagger /api/docs
    │ Mongoose
    ▼
MongoDB replica set rs0 :27018
```

MongoDB transaction yêu cầu replica set. Script `backend/scripts/ensure-mongodb.mjs` tự khởi động một instance `rs0` riêng tại cổng `27018`, bind `127.0.0.1`, và lưu dữ liệu trong `.mongodb/`. Instance này không can thiệp MongoDB standalone đang chạy ở cổng mặc định `27017`.

Sơ đồ dữ liệu: [MongoDB ERD](solar-inventory-mongodb-erd.png) và file nguồn [draw.io](solar-inventory-mongodb-erd.drawio).

## Yêu cầu môi trường

- Windows 10/11 (script đã được kiểm thử trên Windows) hoặc hệ điều hành có `mongod` trong `PATH`.
- Node.js `22.22.3+` được khuyến nghị.
- npm `10+`.
- MongoDB Community Server `8.0+`.
- Git.

Script tự tìm `mongod` ở MongoDB 8.2, 8.0 hoặc biến môi trường `MONGOD_PATH`. Không cần cài `mongosh`.

## Cấu trúc thư mục

```text
QuanLyKhoSolar/
├─ backend/
│  ├─ scripts/                 # Khởi tạo MongoDB, kiểm thử workflow REST
│  ├─ src/
│  │  ├─ auth, users           # JWT, RBAC, tài khoản
│  │  ├─ categories, products
│  │  ├─ suppliers, warehouses, projects
│  │  ├─ inventory
│  │  ├─ stock-receipts, stock-issues, stock-checks
│  │  ├─ inventory-transactions
│  │  ├─ dashboard, reports
│  │  └─ database/seed.ts
│  └─ test/
├─ frontend/
│  ├─ scripts/verify-ui.mjs
│  └─ src/
│     ├─ app/                   # App Router screens
│     ├─ components/            # Shell, form nghiệp vụ, reusable UI
│     └─ lib/                   # API client, auth, shared types
├─ docs/phases/                 # Tài liệu PHASE 01–24
├─ design-system/               # Design system giao diện
└─ docs/screenshots/            # Ảnh kiểm thử UI
```

## Cài đặt

Tại thư mục gốc:

```powershell
npm install
npm run install:all
```

Tạo file môi trường nếu chưa có:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Backend `.env` mặc định:

```dotenv
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27018/solar_inventory?replicaSet=rs0
JWT_SECRET=solar-inventory-local-jwt-secret-change-before-sharing
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=10
SEED_ALLOW_RESET=true
```

Frontend `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Không commit `.env` hoặc `.env.local`. Hãy thay `JWT_SECRET` nếu chia sẻ dự án.

## Khởi tạo database và seed

```powershell
npm run seed
```

Lệnh trên sẽ:

1. bảo đảm replica set `rs0` đang hoạt động;
2. build backend;
3. reset database `solar_inventory` khi `SEED_ALLOW_RESET=true`;
4. tạo index;
5. seed dữ liệu Solar thông qua cùng service nghiệp vụ với API.

> `npm run seed` xóa và tạo lại database demo `solar_inventory`. Không trỏ `MONGODB_URI` vào database có dữ liệu cần giữ.

Dữ liệu tối thiểu gồm 3 users, 10 categories, 30 products, 5 suppliers, 2 warehouses, 10 projects, 15 stock receipts, 15 stock issues và một phiếu kiểm kê mẫu. Tồn kho và lịch sử được phát sinh khi xác nhận phiếu, không chèn giả vào Product.

## Chạy ứng dụng

```powershell
npm run dev
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3001/api/v1>
- Swagger: <http://localhost:3001/api/docs>

Script `predev` tự kiểm tra MongoDB replica set trước khi chạy đồng thời frontend/backend.

## Tài khoản demo

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@solar.local` | `Admin@123` |
| WAREHOUSE_MANAGER | `warehouse@solar.local` | `Admin@123` |
| STAFF | `staff@solar.local` | `Admin@123` |

`ADMIN` có toàn quyền. `WAREHOUSE_MANAGER` quản lý thiết bị và nghiệp vụ kho. `STAFF` chỉ xem; backend vẫn trả `403 Forbidden` nếu cố gọi API ghi dữ liệu.

## Business rules chính

- SKU, email, mã danh mục/nhà cung cấp/kho/công trình là duy nhất.
- Một inventory record duy nhất cho cặp `productId + warehouseId`.
- Phiếu nháp không làm thay đổi tồn kho.
- Xác nhận phiếu nhập: tăng Inventory và ghi transaction `IMPORT` trong cùng transaction.
- Xác nhận phiếu xuất: cập nhật atomic với điều kiện `quantity >= requested`; nếu thiếu trả `Số lượng tồn kho không đủ.` và rollback toàn bộ.
- Inventory không bao giờ âm.
- Xác nhận kiểm kê dùng `inventoryVersion`; phiếu snapshot cũ bị từ chối thay vì ghi đè thay đổi mới.
- Chênh lệch kiểm kê tạo transaction `ADJUSTMENT` có số lượng signed.
- Sản phẩm tồn thấp khi tổng tồn trên các kho `<= Product.minStock`.
- Transaction lưu số lượng trước/sau, loại tham chiếu, ID phiếu, người thao tác và thời gian.

## Demo workflow

1. Đăng nhập `admin@solar.local`.
2. Xem Dashboard.
3. Tạo Category, Product, Supplier, Warehouse và Project.
4. Lập phiếu nhập Jinko 575W × 20, sau đó xác nhận.
5. Kiểm tra Inventory `0 → 20` và transaction `IMPORT +20`.
6. Lập phiếu xuất Jinko 575W × 5 cho công trình, xác nhận.
7. Kiểm tra Inventory `20 → 15` và transaction `EXPORT -5`.
8. Thử xuất 30: backend từ chối và tồn vẫn là 15.
9. Lập kiểm kê system 15, actual 14; xác nhận.
10. Kiểm tra Inventory `15 → 14` và transaction `ADJUSTMENT -1`.
11. Quay lại Dashboard để xem số liệu mới.

## Build và kiểm thử

```powershell
npm run lint
npm run build
npm test
```

Khi backend/frontend đang chạy:

```powershell
npm --prefix backend run verify:workflow
npm --prefix frontend run verify:ui
```

Các lệnh kiểm thử đã thực hiện và kết quả chi tiết nằm tại [docs/TEST-REPORT.md](docs/TEST-REPORT.md).

## API chính

Prefix: `/api/v1`.

- `/auth`, `/users`
- `/categories`, `/products`
- `/suppliers`, `/warehouses`, `/projects`
- `/inventory`, `/inventory-transactions`
- `/stock-receipts`, `/stock-issues`, `/stock-checks`
- `/dashboard`, `/dashboard/low-stock`
- `/reports/inventory-valuation`, `/reports/stock-movements`

Response thành công:

```json
{ "success": true, "data": {}, "meta": {} }
```

Response lỗi:

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

## Ghi chú phạm vi

- Tối ưu cho demo local, chưa cấu hình production/cloud.
- JWT hiện lưu trong localStorage; production nên chuyển sang secure HttpOnly cookie và có chiến lược refresh token.
- MongoDB local bind `127.0.0.1`, chưa bật authentication vì chỉ phục vụ demo.
- Hình ảnh sản phẩm dùng URL, chưa có upload file.
- Báo cáo hiển thị trên web, chưa xuất Excel/PDF.

