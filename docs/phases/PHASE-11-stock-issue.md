# PHASE 11 — Stock Issue

## Mục tiêu

Thiết kế phiếu xuất đảm bảo kiểm tra tồn tại backend bằng atomic conditional decrement, không tồn âm và rollback toàn phiếu nếu bất kỳ item thiếu.

## API Contract

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/stock-issues`: page/limit/search/status/warehouseId/projectId/date range/sort.
- POST `/stock-issues`: tạo DRAFT.
- GET/PATCH `/stock-issues/:id`: patch chỉ DRAFT.
- POST `/stock-issues/:id/confirm`.
- POST `/stock-issues/:id/cancel`: chỉ DRAFT.

## DTO

warehouseId, projectId?, issueDate, note?, items[].productId/quantity.

- items 1..100; unique productId; quantity integer >0.
- code/status/createdBy/confirmedAt server-owned.
- Code format `PX-YYYYMMDD-XXXX` với unique collision retry.

## Create/Update Rules

- Warehouse/Product ACTIVE; Project nếu có phải tồn tại và PLANNED/IN_PROGRESS.
- DRAFT có thể được lập dù tồn thay đổi sau đó; nguồn sự thật kiểm tra lại khi confirm.
- UI có thể hiển thị availableQuantity nhưng backend không tin giá trị đó.

## Confirm Workflow

Trong một MongoDB session transaction:

1. Conditional DRAFT -> CONFIRMED để claim document.
2. Revalidate warehouse/project/products/state.
3. Mỗi item gọi safe decrease với filter `quantity: { $gte: requested }` và `$inc` âm.
4. Nếu bất kỳ item không match, throw `INSUFFICIENT_INVENTORY` với productId/available nếu có thể đọc an toàn; abort toàn transaction.
5. Tạo EXPORT transaction/item bằng signed negative quantity và previous/new.
6. Commit; populate response sau commit; always end session.

## Race Condition Guarantee

- Không dùng find-check-save.
- Condition và decrement là một atomic MongoDB operation.
- Session đảm bảo multi-item all-or-nothing.
- Concurrent issues: chỉ operations còn đủ quantity match; operation còn lại abort/retry rồi nhận 409.

## Error Response

```json
{
  "code": "INSUFFICIENT_INVENTORY",
  "message": "Số lượng tồn kho không đủ.",
  "details": { "productId": "...", "requestedQuantity": 30, "availableQuantity": 15 }
}
```

Không trả success một phần và không để Inventory bị trừ cho các item trước.

## Transaction Record

```text
type=EXPORT
quantity=-requested
previousQuantity=before
newQuantity=before-requested
referenceType=STOCK_ISSUE
referenceId=issueId
```

## RBAC

- ADMIN/WAREHOUSE_MANAGER mutation/read.
- STAFF không mutation; optional restricted read.

## Edge Cases

- Inventory document missing tương đương available 0.
- Exact quantity xuất thành 0 là hợp lệ.
- Duplicate confirm/cancel invalid state: 409.
- Project completed/cancelled hoặc warehouse inactive: 400.
- Failure khi insert transaction phải rollback decrement.

## Test Cases

- Issue đủ/exact/thiếu/missing inventory.
- Multi-item trong đó item cuối thiếu rollback item đầu.
- Concurrent requests không âm và tổng export không vượt initial stock.
- Correct signed transaction and project reference.
- Demo 20 -> 15; attempt 30 leaves 15.

## Files to Implement

- `backend/src/stock-issues/stock-issues.module.ts`
- `backend/src/stock-issues/stock-issues.controller.ts`
- `backend/src/stock-issues/stock-issues.service.ts`
- `backend/src/stock-issues/schemas/stock-issue.schema.ts`
- `backend/src/stock-issues/dto/create-stock-issue.dto.ts`
- `backend/src/stock-issues/dto/update-stock-issue.dto.ts`
- `backend/src/stock-issues/dto/query-stock-issue.dto.ts`
- `backend/src/stock-issues/stock-issues.service.spec.ts`

## Definition of Done

- No-negative/concurrency/all-or-nothing design đầy đủ.
- API lỗi thiếu tồn và demo acceptance được chốt.
