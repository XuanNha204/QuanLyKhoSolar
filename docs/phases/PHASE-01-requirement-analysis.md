# PHASE 01 — Requirement Analysis

## Mục tiêu

Xác định phạm vi, actors, functional requirements, non-functional requirements, use cases, business rules và tiêu chí nghiệm thu cho Solar Inventory Management System. Tài liệu này là baseline xuyên suốt 23 phase còn lại.

## Phạm vi

Ứng dụng web chạy local phục vụ quản lý kho thiết bị điện năng lượng mặt trời, gồm frontend Next.js, backend NestJS REST API và MongoDB qua Mongoose. Sản phẩm ưu tiên nghiệp vụ tồn kho đúng, demo ổn định và mã nguồn dễ bảo trì; không triển khai cloud, Nginx, Docker hoặc CI/CD.

## Tech Stack Chính Thức

- Frontend: Next.js, TypeScript, App Router, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, Recharts, Lucide React.
- Backend: Node.js, NestJS, TypeScript, REST API, Swagger, class-validator, class-transformer.
- Database: MongoDB, Mongoose, `@nestjs/mongoose`.
- Authentication: JWT, RBAC, bcrypt hoặc argon2.
- Development: npm, Git, local-only.
- Không sử dụng PostgreSQL hoặc Prisma.

## Actors

### ADMIN

- Toàn quyền trên dữ liệu và nghiệp vụ.
- Quản lý user, role, master data, nhập/xuất/kiểm kê, dashboard và báo cáo.
- Có quyền xem thông tin giá vốn và giá trị tồn kho.

### WAREHOUSE_MANAGER

- Quản lý category, product, supplier, warehouse và project.
- Lập/xác nhận phiếu nhập, phiếu xuất và kiểm kê.
- Xem dashboard, lịch sử giao dịch và báo cáo.
- Không quản lý tài khoản ADMIN.

### STAFF

- Chỉ đọc category, product, warehouse, project và inventory theo phạm vi cho phép.
- Không tạo hoặc xác nhận chứng từ.
- Không quản lý user và không xem giá trị tài chính nhạy cảm.

### SYSTEM

- Sinh mã chứng từ, cập nhật tồn, tạo lịch sử kho, tính tồn thấp và tổng hợp dashboard.

## Functional Requirements

### FR-01 Authentication

- Đăng nhập bằng email và mật khẩu.
- Mật khẩu phải được hash; user INACTIVE không đăng nhập được.
- API bảo vệ bằng Bearer JWT; backend lấy `createdBy` từ JWT.

### FR-02 RBAC

- Backend kiểm tra role bằng guard/decorator cho mọi endpoint bảo vệ.
- Frontend chỉ ẩn/disable action để cải thiện UX; không thay thế backend authorization.
- Trả 401 khi chưa xác thực và 403 khi không đủ quyền.

### FR-03 Users

- ADMIN được tìm kiếm, phân trang, tạo, sửa role/status và reset mật khẩu.
- Email unique sau khi trim/lowercase.
- Không trả `passwordHash` qua API; không xóa cứng user đã có lịch sử.

### FR-04 Master Data

- CRUD Category, Product, Supplier, Warehouse và Project theo quyền.
- Danh sách hỗ trợ search, pagination, filter, sorting, loading/empty/error state.
- Entity đã được tham chiếu được chuyển INACTIVE thay vì xóa cứng.

### FR-05 Product

- SKU unique, hỗ trợ category, brand, model, unit, cost price, min stock, warranty, description, image URL và status.
- Product tuyệt đối không chứa `quantity`; tồn kho chỉ nằm trong Inventory.

### FR-06 Inventory

- Xem tồn theo product/warehouse và tổng tồn toàn hệ thống.
- Compound unique `(productId, warehouseId)`.
- Inventory chỉ thay đổi qua xác nhận nhập, xuất hoặc kiểm kê.
- Quy tắc tuyệt đối: `quantity >= 0`.

### FR-07 Stock Receipt

- Phiếu nhập chứa supplier, warehouse, ngày, note, creator và embedded items.
- DRAFT không ảnh hưởng tồn; CONFIRMED cập nhật Inventory và tạo IMPORT transactions.
- Tất cả thay đổi chạy trong MongoDB session transaction.

### FR-08 Stock Issue

- Phiếu xuất chứa warehouse, project tùy chọn, ngày, note, creator và embedded items.
- Xác nhận dùng atomic conditional update `quantity >= requestedQuantity` kết hợp `$inc`.
- Thiếu tồn trả lỗi `Số lượng tồn kho không đủ.`; không được tồn âm.

### FR-09 Inventory Transaction

- Lưu IMPORT, EXPORT, ADJUSTMENT với previousQuantity, newQuantity, signed quantity, reference và creator.
- Dữ liệu là audit log bất biến, hỗ trợ filter và truy vết chứng từ.

### FR-10 Stock Check

- Ghi systemQuantity, actualQuantity và difference.
- Khi xác nhận, cập nhật tồn về actualQuantity và tạo ADJUSTMENT transaction trong session transaction.
- Phát hiện phiếu kiểm kê stale nếu inventory thay đổi sau lúc chụp số liệu.

### FR-11 Low Stock

- Product active tồn thấp khi tổng tồn ở các warehouse active `<= minStock`.
- Bao gồm product chưa có Inventory, coi tổng tồn bằng 0.

### FR-12 Dashboard

- Tổng product, tổng quantity, tổng giá trị tồn, số product tồn thấp.
- Số phiếu nhập/xuất đã xác nhận trong tháng.
- Biểu đồ nhập/xuất sáu tháng, phân bố tồn theo category.
- Danh sách tồn thấp và giao dịch gần đây.

### FR-13 Reports

- Báo cáo tồn theo kho/category, giá trị tồn, nhập/xuất theo thời gian, lịch sử giao dịch, tồn thấp và xuất theo công trình.
- Report dùng filter/pagination và chỉ tính chứng từ CONFIRMED.

### FR-14 API, Forms và Feedback

- REST API, Swagger đầy đủ, HTTP status đúng và response envelope nhất quán.
- Frontend dùng React Hook Form + Zod; backend dùng DTO + class-validator.
- Có toast, confirm delete/cancel, error message tiếng Việt và state đầy đủ.

## Use Cases

| ID | Use case | Actor |
|---|---|---|
| UC-01 | Login/logout và xem profile | Tất cả user |
| UC-02 | Quản lý user/role/status | ADMIN |
| UC-03 | Quản lý category/product | ADMIN, WAREHOUSE_MANAGER |
| UC-04 | Quản lý supplier/warehouse | ADMIN, WAREHOUSE_MANAGER |
| UC-05 | Xem tồn kho | Tất cả theo quyền |
| UC-06 | Tạo và xác nhận phiếu nhập | ADMIN, WAREHOUSE_MANAGER |
| UC-07 | Tạo và xác nhận phiếu xuất | ADMIN, WAREHOUSE_MANAGER |
| UC-08 | Quản lý project | ADMIN, WAREHOUSE_MANAGER |
| UC-09 | Tạo và xác nhận kiểm kê | ADMIN, WAREHOUSE_MANAGER |
| UC-10 | Xem transaction history | Tất cả theo quyền |
| UC-11 | Xem low-stock/dashboard/report | ADMIN, WAREHOUSE_MANAGER |
| UC-12 | Thử xuất vượt tồn và nhận 409 | ADMIN, WAREHOUSE_MANAGER |

## Business Rules

- Email lưu lowercase; SKU và document code lưu uppercase; tất cả được trim.
- Quantity trên item là số nguyên dương; giá không âm; danh sách items không rỗng.
- Một product chỉ xuất hiện một lần trong cùng chứng từ.
- Document transition: `DRAFT -> CONFIRMED` hoặc `DRAFT -> CANCELLED`; CONFIRMED/CANCELLED là trạng thái kết thúc.
- Chỉ CONFIRMED ảnh hưởng inventory, dashboard và reports.
- IMPORT quantity dương; EXPORT quantity âm; ADJUSTMENT có dấu theo difference.
- Transaction history không được update/delete bằng API.
- Tổng giá trị tồn MVP = `Inventory.quantity * Product.costPrice`.
- Không thực hiện network I/O bên trong MongoDB transaction.
- Mọi nghiệp vụ transaction phải commit/abort/endSession rõ ràng và yêu cầu replica set.
- Lỗi nghiệp vụ trả exception phù hợp, không làm application crash.

## Non-Functional Requirements

- Correctness: atomicity cho nhập/xuất/kiểm kê; không tồn âm; không double-confirm.
- Security: password hash, JWT secret trong `.env`, validation, RBAC backend, CORS giới hạn frontend local.
- Performance: pagination; index cho unique/reference/date/status; aggregate tại MongoDB khi phù hợp.
- Maintainability: module hóa rõ, strict TypeScript, không `any` tùy tiện, reusable frontend components.
- Reliability: seed có thể chạy lặp lại an toàn; lỗi thông thường được xử lý nhất quán.
- Usability: responsive, accessible, clean professional admin UI, ít màu, trạng thái rõ ràng.
- Documentation: README, Swagger, phase docs, demo accounts và workflow local đầy đủ.

## Error Cases Bắt Buộc

- Duplicate email/SKU/code: 409.
- Entity/reference không tồn tại: 404.
- Validation/document state không hợp lệ: 400.
- Thiếu tồn: 409 với thông báo chuẩn.
- Unauthorized/forbidden: 401/403.
- Race condition/write conflict: abort, retry giới hạn hoặc trả lỗi an toàn.

## Demo Acceptance Workflow

1. Login ADMIN và load dashboard.
2. Tạo Category, Product, Supplier, Warehouse.
3. Nhập Jinko 575W x20; Inventory 0 -> 20; transaction IMPORT +20.
4. Tạo Project; xuất x5; Inventory 20 -> 15; transaction EXPORT -5.
5. Thử xuất x30 bị từ chối, Inventory vẫn 15.
6. Kiểm kê system 15, actual 14; Inventory 15 -> 14; ADJUSTMENT -1.
7. Dashboard và lịch sử phản ánh dữ liệu mới.

## Files to Implement

- `backend/src/**`: modules, schemas, DTOs, controllers, services, guards, decorators, exception filter.
- `frontend/app/**`: routes và layouts theo App Router.
- `frontend/components/**`: tables, forms, dialogs, charts và shared UI.
- `frontend/lib/**`: API client, auth, validators, query utilities.
- `README.md`, `.env.example`, seed và test scripts.

## Definition of Done

- Actors, scope, FR/NFR, use cases, rules và acceptance workflow được chốt.
- Stack thống nhất MongoDB + Mongoose; không còn Prisma/PostgreSQL trong thiết kế chính thức.
- Các phase sau có baseline rõ để thiết kế chi tiết mà không đổi kiến trúc lớn.

