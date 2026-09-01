# PHASE 14 — Stock Check

## Mục tiêu

Thiết kế kiểm kê theo warehouse, snapshot số hệ thống, nhập số thực tế, phát hiện stale data và điều chỉnh Inventory atomically với ADJUSTMENT logs.

## API Contract

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/stock-checks`: page/limit/search/status/warehouseId/date range.
- POST `/stock-checks`: tạo snapshot DRAFT.
- GET `/stock-checks/:id`.
- PATCH `/stock-checks/:id`: cập nhật actual quantities/note khi DRAFT.
- POST `/stock-checks/:id/confirm`.
- POST `/stock-checks/:id/cancel`: DRAFT only.

## Create DTO/Workflow

Request: warehouseId, checkDate, note?, optional productIds.

- Warehouse phải ACTIVE.
- Nếu productIds bỏ trống: snapshot tất cả Inventory records trong warehouse; có thể include active products có minStock để UI thấy zero stock bằng aggregate.
- Nếu cung cấp: validate unique active Products.
- Mỗi item lưu systemQuantity và Inventory.version tại thời điểm snapshot; absent Inventory dùng system=0/version=0.
- Code `KK-YYYYMMDD-XXXX` server-generated.

## Update Actual DTO

`items: [{ productId, actualQuantity }]`, actual integer >=0. Backend tìm item snapshot, tính difference để preview; không nhận systemQuantity/version từ client.

## Confirm Workflow

Trong session transaction:

1. Conditional DRAFT -> CONFIRMED/set confirmedAt để claim document.
2. Require actualQuantity cho mọi item.
3. Với Inventory tồn tại, conditional update theo product/warehouse/systemQuantity/version.
4. Với snapshot zero/absent, xác minh vẫn chưa có Inventory; nếu actual >0 thì create/upsert an toàn trong session.
5. difference = actual - system; nếu !=0 tạo ADJUSTMENT transaction với previous/new/reference.
6. Nếu bất kỳ item stale/duplicate conflict, throw 409 và abort toàn bộ.
7. Commit và return confirmed document.

## Stale Rule

Nếu receipt/issue/check khác thay đổi Inventory sau snapshot, version không khớp dù net quantity quay lại giống cũ. Confirm phải trả:

```text
code=STOCK_CHECK_STALE
message=Dữ liệu tồn kho đã thay đổi. Vui lòng tạo hoặc làm mới phiếu kiểm kê.
```

Không tự overwrite giao dịch mới.

## Transaction Record

```text
type=ADJUSTMENT
quantity=difference
previousQuantity=system/current verified
newQuantity=actual
referenceType=STOCK_CHECK
```

Không tạo transaction cho difference 0.

## RBAC

- ADMIN/WAREHOUSE_MANAGER create/update/confirm/cancel/read.
- STAFF read-only hoặc không access theo route policy.

## Edge Cases

- All differences zero: confirm thành công, không log adjustment.
- Absent Inventory actual zero: không cần tạo empty Inventory.
- Duplicate product, partial actual list, inactive warehouse/product: 400.
- Stale một item rollback adjustments của item trước.
- Concurrent confirms: một request thắng, request còn lại 409.

## Test Cases

- Demo 15 -> 14 tạo ADJUSTMENT -1.
- Increase adjustment, no-change check, absent inventory cases.
- Stale after receipt/issue; multi-item rollback.
- Draft edit/cancel/double-confirm lifecycle.

## Files to Implement

- `backend/src/stock-checks/stock-checks.module.ts`
- `backend/src/stock-checks/stock-checks.controller.ts`
- `backend/src/stock-checks/stock-checks.service.ts`
- `backend/src/stock-checks/schemas/stock-check.schema.ts`
- `backend/src/stock-checks/dto/create-stock-check.dto.ts`
- `backend/src/stock-checks/dto/update-stock-check.dto.ts`
- `backend/src/stock-checks/dto/query-stock-check.dto.ts`
- `backend/src/stock-checks/stock-checks.service.spec.ts`

## Definition of Done

- Snapshot/version/stale logic và session transaction đầy đủ.
- Adjustment history đúng signed quantity và không overwrite biến động mới.
