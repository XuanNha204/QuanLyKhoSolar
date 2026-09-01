# PHASE 08 — Supplier + Warehouse

## Mục tiêu

Thiết kế Supplier/Warehouse master data, validation, lifecycle và API contracts phục vụ Receipt/Issue/Inventory.

## Supplier API

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/suppliers`: page/limit/search/status/sort.
- POST `/suppliers`.
- GET/PATCH `/suppliers/:id`.
- DELETE `/suppliers/:id`: chuyển INACTIVE.

Fields: code, name, contactName?, phone?, email?, address?, taxCode?, status?. Search code/name/contact/phone/taxCode.

## Warehouse API

- GET `/warehouses`: page/limit/search/status/sort.
- POST `/warehouses`.
- GET/PATCH `/warehouses/:id`.
- DELETE `/warehouses/:id`: chuyển INACTIVE.
- GET `/warehouses/:id/summary`: product count, total quantity, low-stock count trong kho.

Fields: code, name, address?, description?, status?. Code immutable sau khi có transaction để báo cáo ổn định.

## DTO Validation

- Code/name required, trimmed, maxlength; code uppercase pattern.
- Supplier email hợp lệ nếu có; phone/taxCode strings có maxlength và trim.
- Status chỉ thuộc EntityStatus.
- Query DTO pagination/search/status/sort allowlist.

## Business Rules

- Receipt mới chỉ dùng Supplier ACTIVE và Warehouse ACTIVE.
- Issue/StockCheck mới chỉ dùng Warehouse ACTIVE.
- Deactivate không xóa Inventory/history.
- Không cho reactivate entity nếu code đã conflict do dữ liệu legacy.
- Warehouse status đổi INACTIVE khi còn DRAFT documents: trả 409 cho đến khi cancel/resolve drafts.
- Supplier deactivate khi có DRAFT receipt: trả 409; confirmed history không cản soft deactivate.

## RBAC

- ADMIN/WAREHOUSE_MANAGER mutation.
- STAFF read-only; supplier contact fields có thể cho xem theo policy, không có credential/sensitive secrets.

## Errors

- Duplicate code: 409.
- Missing entity: 404; invalid ObjectId/input: 400.
- Deactivate với DRAFT dependency: 409.
- Inactive supplier/warehouse trong document creation: 400.

## Test Cases

- CRUD/search/pagination/filter/sort.
- Duplicate code normalization.
- Deactivation dependency rules.
- Inactive entities vẫn đọc được trong confirmed history nhưng không dùng cho document mới.
- Warehouse summary aggregate chính xác.

## Files to Implement

Backend:

- `backend/src/suppliers/suppliers.module.ts`
- `backend/src/suppliers/suppliers.controller.ts`
- `backend/src/suppliers/suppliers.service.ts`
- `backend/src/suppliers/dto/*.dto.ts`
- `backend/src/suppliers/schemas/supplier.schema.ts`
- `backend/src/warehouses/warehouses.module.ts`
- `backend/src/warehouses/warehouses.controller.ts`
- `backend/src/warehouses/warehouses.service.ts`
- `backend/src/warehouses/dto/*.dto.ts`
- `backend/src/warehouses/schemas/warehouse.schema.ts`

Frontend planned:

- `frontend/app/(dashboard)/suppliers/page.tsx`
- `frontend/app/(dashboard)/warehouses/page.tsx`
- `frontend/components/suppliers/**`
- `frontend/components/warehouses/**`

## Definition of Done

- Supplier/Warehouse contracts và lifecycle đủ chi tiết.
- Các rule ACTIVE/DRAFT dependency bảo vệ nghiệp vụ nhập/xuất/kiểm kê.
