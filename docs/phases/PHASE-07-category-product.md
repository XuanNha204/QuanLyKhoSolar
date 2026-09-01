# PHASE 07 — Category + Product

## Mục tiêu

Thiết kế backend/API/DTO/business rules cho Category và Product, hai master-data module nền cho mọi nghiệp vụ kho.

## Category API

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/categories`: page/limit/search/status/sort.
- POST `/categories`: ADMIN, WAREHOUSE_MANAGER.
- GET `/categories/:id`.
- PATCH `/categories/:id`.
- DELETE `/categories/:id`: soft-delete bằng status INACTIVE; idempotent policy trả current entity.

Category create/update fields: code, name, description?, status?. Code uppercase immutable sau khi có Product; normalizedName backend-generated.

## Product API

- GET `/products`: page/limit/search/categoryId/status/sortBy/sortOrder.
- POST `/products`.
- GET `/products/:id`.
- PATCH `/products/:id`.
- DELETE `/products/:id`: chuyển INACTIVE.
- GET `/products/:id/stock-summary`: tồn theo kho và tổng tồn.

Search trên sku/name/brand/model; sort allowlist tránh query injection.

## DTO Design

CreateProduct: sku, name, categoryId, brand?, model?, unit, costPrice, minStock, warrantyMonths?, description?, imageUrl?, status?.

Validation:

- sku/name/unit required; categoryId MongoId.
- costPrice integer >= 0 <= MAX_SAFE_INTEGER.
- minStock integer >= 0; warrantyMonths 0..240.
- URL hợp lệ nếu imageUrl có giá trị.
- Whitelist fields; không nhận quantity.

Update DTO dùng PartialType nhưng loại bỏ immutable/audit fields; SKU cho phép đổi nếu chưa conflict, không ảnh hưởng transaction references vì dùng ObjectId.

## Business Rules

- Category phải tồn tại và ACTIVE khi tạo/đổi category của Product active.
- SKU/code/email normalization diễn ra backend trước query/write.
- Product INACTIVE không được đưa vào receipt/issue/check mới nhưng lịch sử vẫn hiển thị.
- Deactivate Category đang có Product active: 409 hoặc yêu cầu deactivate products trước; chọn 409 để tránh cascade bất ngờ.
- Product response không bao giờ chứa quantity field.

## RBAC

- ADMIN/WAREHOUSE_MANAGER: create/update/deactivate.
- STAFF: list/detail/stock summary nhưng field costPrice có thể bị loại khỏi response.

## Errors

- Duplicate category code/name or SKU: 409 với error code cụ thể.
- Category/Product missing: 404.
- Invalid ObjectId/input/sort field: 400.
- Inactive/missing Category khi create Product: 400/404.

## Test Cases

- CRUD, search/filter/sort/pagination và empty state contract.
- Duplicate normalization cases (`jinko-575`/`JINKO-575`).
- Không tạo Product với category inactive.
- DTO từ chối Product.quantity và unknown fields.
- STAFF mutation 403 và không thấy costPrice nếu policy áp dụng.

## Files to Implement

Backend:

- `backend/src/categories/categories.module.ts`
- `backend/src/categories/categories.controller.ts`
- `backend/src/categories/categories.service.ts`
- `backend/src/categories/dto/*.dto.ts`
- `backend/src/categories/schemas/category.schema.ts`
- `backend/src/products/products.module.ts`
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/dto/*.dto.ts`
- `backend/src/products/schemas/product.schema.ts`

Frontend planned in PHASE 18:

- `frontend/app/(dashboard)/categories/page.tsx`
- `frontend/app/(dashboard)/products/page.tsx`
- `frontend/components/categories/**`
- `frontend/components/products/**`

## Definition of Done

- API/DTO/RBAC/errors/tests cho Category và Product được chốt.
- Product không chứa quantity và tích hợp Inventory qua stock-summary read model.
