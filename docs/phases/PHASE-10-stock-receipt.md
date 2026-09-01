# PHASE 10 — Stock Receipt

## Mục tiêu

Thiết kế vòng đời phiếu nhập embedded items và confirm transaction cập nhật Inventory + IMPORT history atomically.

## API Contract

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/stock-receipts`: page/limit/search/status/supplierId/warehouseId/dateFrom/dateTo/sort.
- POST `/stock-receipts`: tạo DRAFT.
- GET `/stock-receipts/:id`.
- PATCH `/stock-receipts/:id`: chỉ DRAFT.
- POST `/stock-receipts/:id/confirm`.
- POST `/stock-receipts/:id/cancel`: chỉ DRAFT.

## DTO

Create/Update: supplierId, warehouseId, receiptDate, note?, items[].productId/quantity/unitPrice.

- supplier/warehouse/product MongoId.
- receiptDate ISO date hợp lệ.
- items 1..100, không duplicate product.
- quantity integer 1..1,000,000; unitPrice integer 0..MAX_SAFE_INTEGER.
- Client không gửi code, status, confirmedAt hoặc createdBy.

## Code Generation

Backend sinh `PN-YYYYMMDD-XXXX` với random uppercase suffix; unique index là authority. Collision hiếm được retry giới hạn. Code không dựa vào `countDocuments` vì race condition.

## Create/Update Rules

- Supplier/Warehouse/Product phải tồn tại và ACTIVE.
- createdBy lấy từ JWT.
- DRAFT không cập nhật Inventory/Transaction.
- Update thay thế payload business của DRAFT sau validation; confirmed/cancelled trả 409.

## Confirm Workflow

Trong `runInTransaction`:

1. Conditional update Receipt `_id + status=DRAFT` thành CONFIRMED, set confirmedAt; không match => 409.
2. Load/validate embedded items và references trong session.
3. Với từng item, gọi InventoryMutationService.increase.
4. Insert một IMPORT InventoryTransaction/item với previous/new/reference receipt/creator.
5. Commit; lỗi bất kỳ abort toàn bộ.
6. Return populated confirmed receipt sau commit.

Đặt conditional state update đầu transaction để hai request confirm cùng phiếu gây write conflict/một request thắng; rollback sẽ hoàn nguyên status nếu item fail.

## Transaction Record

```text
type=IMPORT
quantity=+item.quantity
previousQuantity=<before>
newQuantity=<after>
referenceType=STOCK_RECEIPT
referenceId=receipt._id
createdBy=currentUser._id
```

## Cancel Rules

- Conditional DRAFT -> CANCELLED; không tạo InventoryTransaction.
- CONFIRMED không cancel trong MVP; dùng reversal receipt riêng nếu mở rộng.

## RBAC

- ADMIN/WAREHOUSE_MANAGER: create/update/confirm/cancel/read.
- STAFF: không mutation; read theo policy nếu được cấp.

## Error/Edge Cases

- Empty/duplicate/invalid items, inactive reference: 400.
- Missing receipt/reference: 404.
- Double-confirm/state conflict: 409.
- E11000 code: retry generation; exhausted => 409/500 controlled.
- Failure item N rollback previous items/status/logs.
- Concurrent receipt upsert first Inventory handled bằng transaction retry.

## Test Cases

- Draft has no stock effect; update/cancel lifecycle.
- Confirm single/multi-warehouse item set within one selected warehouse.
- New Inventory from zero và existing Inventory increment.
- Correct previous/new logs; double confirm không cộng đôi.
- Injected failure rollback entire receipt.

## Files to Implement

- `backend/src/stock-receipts/stock-receipts.module.ts`
- `backend/src/stock-receipts/stock-receipts.controller.ts`
- `backend/src/stock-receipts/stock-receipts.service.ts`
- `backend/src/stock-receipts/schemas/stock-receipt.schema.ts`
- `backend/src/stock-receipts/dto/create-stock-receipt.dto.ts`
- `backend/src/stock-receipts/dto/update-stock-receipt.dto.ts`
- `backend/src/stock-receipts/dto/query-stock-receipt.dto.ts`
- `backend/src/stock-receipts/stock-receipts.service.spec.ts`

## Definition of Done

- Receipt state/API/DTO/transaction steps và rollback tests đủ chi tiết.
- Confirm luôn cập nhật Inventory và IMPORT logs atomically.
