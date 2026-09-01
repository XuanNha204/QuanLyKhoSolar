# PHASE 09 — Inventory

## Mục tiêu

Thiết kế read model tồn kho và mutation boundary dùng chung, đảm bảo Inventory là nguồn tồn hiện tại, không âm, không bị race condition và luôn đồng bộ với InventoryTransaction.

## Phạm vi

- Xem tồn theo product/warehouse và tổng hợp toàn hệ thống.
- Low-stock query.
- Internal mutation methods cho receipt/issue/check; không có public CRUD quantity.
- Concurrency, transaction session, reconciliation và RBAC.

## Data Model

```text
Inventory {
  _id, productId, warehouseId,
  quantity: integer >= 0,
  version: integer >= 0,
  createdAt, updatedAt
}
```

Unique index `{ productId: 1, warehouseId: 1 }`; Product tuyệt đối không chứa quantity.

## API Contract

- GET `/api/v1/inventory`: page/limit/search/productId/warehouseId/categoryId/status/sort.
- GET `/api/v1/inventory/summary`: totalProducts, totalQuantity, totalValue, warehouse breakdown.
- GET `/api/v1/inventory/low-stock`: page/limit/search/categoryId/warehouseId?.
- GET `/api/v1/inventory/products/:productId`: per-warehouse quantities và totalStock.

Không có POST/PATCH/DELETE Inventory public endpoints.

## Read Query Rules

- List lookup Product/Category/Warehouse để trả SKU/name/unit/location.
- Tổng tồn product = sum inventories ở warehouse ACTIVE.
- Product không có Inventory được xem quantity 0 trong low-stock aggregate.
- STAFF không nhận costPrice/stockValue; manager/admin nhận đầy đủ.
- Sort fields dùng allowlist; pagination aggregate dùng `$facet`.

## Internal Mutation Contract

`InventoryMutationService` chỉ được gọi bên trong MongoDB session transaction:

- `increase(productId, warehouseId, amount, session)` -> previous/new/version.
- `decrease(productId, warehouseId, amount, session)` -> previous/new hoặc insufficient error.
- `adjustTo(productId, warehouseId, expectedQuantity, expectedVersion, actual, session)` -> previous/new/difference.

Caller chịu trách nhiệm tạo InventoryTransaction trong cùng session; helper có thể trả payload chuẩn để tránh tính sai.

## Increase Algorithm

```text
findOneAndUpdate(
  productId + warehouseId,
  $inc quantity +amount, version +1,
  upsert=true, return before, session
)
previous = returned?.quantity ?? 0
new = previous + amount
```

Catch duplicate-key do concurrent first upsert và retry transaction giới hạn.

## Safe Decrease Algorithm

```text
findOneAndUpdate(
  productId + warehouseId + quantity >= amount,
  $inc quantity -amount, version +1,
  return before, session
)
```

- Không match => `INSUFFICIENT_INVENTORY`, 409.
- previous lấy từ document trước update; new = previous - amount.
- Không dùng `find -> compare -> save`.

## Adjustment Algorithm

- Filter productId/warehouseId/quantity=expectedQuantity/version=expectedVersion.
- `$set quantity=actualQuantity`, `$inc version=1`.
- Không match => `STOCK_CHECK_STALE`, abort toàn phiếu.
- difference = actual - previous; chỉ tạo ADJUSTMENT log nếu difference != 0.

## Session and Retry

- Mọi mutation nhận explicit ClientSession; service từ chối nếu session thiếu trong core flows.
- Transaction wrapper startSession/startTransaction/commit/abort/endSession.
- Retry tối đa 3 lần chỉ cho transient transaction/write conflict; không retry validation/insufficient errors.
- Không sleep dài, không network request trong transaction.

## Reconciliation

Internal/admin diagnostic tính:

```text
SUM(transaction.quantity by product+warehouse) == Inventory.quantity
```

Mismatch được report, không tự sửa âm thầm. Adjustment chỉ qua StockCheck.

## RBAC

- ADMIN/WAREHOUSE_MANAGER xem đầy đủ.
- STAFF read-only operational fields.
- Không role nào chỉnh trực tiếp quantity qua HTTP.

## Error Cases

- Invalid/missing Product/Warehouse: 400/404.
- Inactive entities cho mutation mới: 400.
- Insufficient: 409; transaction rollback.
- Duplicate inventory/upsert conflict: retry hoặc 409/500 mapped an toàn.
- Aggregation trên empty database trả zero/empty arrays, không lỗi.

## Test Cases

- Unique product/warehouse; increase from missing inventory; multiple increases.
- Decrease exact-to-zero; over-decrease; missing inventory.
- Hai decreases đồng thời không làm âm.
- Multi-item caller rollback item trước khi item sau fail.
- Low stock gồm product total zero và bằng minStock.
- Reconciliation pass/fail detection.

## Files to Implement

- `backend/src/inventory/inventory.module.ts`
- `backend/src/inventory/inventory.controller.ts`
- `backend/src/inventory/inventory.service.ts`
- `backend/src/inventory/inventory-mutation.service.ts`
- `backend/src/inventory/schemas/inventory.schema.ts`
- `backend/src/inventory/dto/query-inventory.dto.ts`
- `backend/src/inventory/dto/query-low-stock.dto.ts`
- `backend/src/inventory/inventory.service.spec.ts`

## Definition of Done

- Read APIs, atomic mutations, no-negative invariant, retry và reconciliation được chốt.
- Không có public direct quantity mutation; mọi core flow dùng cùng service.

