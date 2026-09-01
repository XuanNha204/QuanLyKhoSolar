# PHASE 12 — Inventory Transaction

## Mục tiêu

Thiết kế append-only audit ledger cho mọi biến động tồn và read APIs truy vết theo product, warehouse, chứng từ, user và thời gian.

## Data Invariants

- `quantity != 0` và có dấu theo type.
- `previousQuantity >= 0`, `newQuantity >= 0`.
- `previousQuantity + quantity = newQuantity`.
- IMPORT >0; EXPORT <0; ADJUSTMENT dương hoặc âm.
- referenceType/referenceId trỏ đúng confirmed document.
- createdBy lấy từ authenticated operation/seed principal.

## Write Boundary

- Không public POST/PATCH/DELETE.
- `createWithinSession(payload, session)` chỉ export nội bộ cho Receipt/Issue/StockCheck/Seed.
- Bắt buộc ClientSession; insert dùng array form hoặc document.save({session}).
- Không sửa/xóa ledger khi cancel draft hoặc entity inactive.

## API Contract

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/inventory-transactions`: page/limit/search/productId/warehouseId/type/referenceType/referenceId/createdBy/dateFrom/dateTo/sort.
- GET `/inventory-transactions/:id`.
- GET `/inventory-transactions/reference/:referenceType/:referenceId`.

Response gồm product/warehouse/user summaries và reference code được resolve theo type bằng batch query, tránh N+1.

## Query/Index Strategy

- Default newest first.
- Compound indexes Phase 02; date range luôn kết hợp createdAt.
- Search SKU/name/code thực hiện aggregate lookups hoặc resolve IDs trước query.
- Populate select field tối thiểu; list dùng lean/pagination.

## RBAC

- ADMIN/WAREHOUSE_MANAGER: đầy đủ read.
- STAFF: chỉ operational fields, ẩn giá; có thể giới hạn warehouse nếu scope được bổ sung sau.
- Không ai có HTTP mutation quyền.

## Reference Resolution

- STOCK_RECEIPT -> stock_receipts.
- STOCK_ISSUE -> stock_issues.
- STOCK_CHECK -> stock_checks.
- Invalid legacy reference hiển thị `reference: null` nhưng transaction vẫn được giữ và diagnostic flag được trả cho admin.

## Reconciliation Service

- Group transactions theo productId/warehouseId, sum quantity và so Inventory.
- Kiểm tra chain previous/new theo createdAt + `_id` deterministic tie-break.
- Admin diagnostic/report, không public sửa tự động.

## Errors/Edge Cases

- Invalid ObjectId/reference type/date range: 400.
- Transaction missing: 404.
- Empty ledger trả page meta đúng.
- Same timestamp dùng `_id` sort để ổn định.

## Test Cases

- Append invariants; absence of write routes.
- Filters/combinations/pagination/sort.
- Reference resolution đủ ba types.
- Reconciliation detect mismatch/broken chain.
- RBAC and sensitive field projection.

## Files to Implement

- `backend/src/inventory-transactions/inventory-transactions.module.ts`
- `backend/src/inventory-transactions/inventory-transactions.controller.ts`
- `backend/src/inventory-transactions/inventory-transactions.service.ts`
- `backend/src/inventory-transactions/reconciliation.service.ts`
- `backend/src/inventory-transactions/schemas/inventory-transaction.schema.ts`
- `backend/src/inventory-transactions/dto/query-inventory-transaction.dto.ts`
- `backend/src/inventory-transactions/inventory-transactions.service.spec.ts`

## Definition of Done

- Ledger immutable, invariant rõ và chỉ write trong session.
- Read/reference/reconciliation APIs đủ cho workflow và reports.
