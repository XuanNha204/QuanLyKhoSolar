# PHASE 15 — Dashboard API

## Mục tiêu

Thiết kế API tổng hợp dashboard chính xác, hiệu quả và role-aware từ Inventory, Product, confirmed documents và transaction ledger.

## API Contract

GET `/api/v1/dashboard` trả:

```text
summary: totalProducts, totalQuantity, totalInventoryValue,
         lowStockProducts, receiptsThisMonth, issuesThisMonth
movementChart: [{ month, importQuantity, exportQuantity }]
categoryDistribution: [{ categoryId, categoryName, quantity }]
lowStock: [...top items]
recentTransactions: [...]
```

Optional query `warehouseId`; mặc định toàn bộ active warehouses. `months` fixed/validated 1..12, UI dùng 6.

## Metric Rules

- totalProducts: Product ACTIVE count.
- totalQuantity: sum Inventory quantities ở Warehouse ACTIVE.
- totalInventoryValue: sum quantity * Product.costPrice.
- lowStockProducts: active products có totalStock <= minStock, bao gồm zero inventory.
- Receipt/Issue month count: CONFIRMED và date trong calendar month Asia/Bangkok.
- Movement chart: InventoryTransaction createdAt theo sáu calendar months, IMPORT dương, EXPORT hiển thị absolute quantity; ADJUSTMENT không trộn vào import/export bars.
- Category distribution: sum current inventory quantity theo Product.categoryId.
- Recent: newest transactions với product/warehouse/user/reference summary.

## Aggregation Strategy

- Dùng MongoDB aggregation `$match/$lookup/$group/$facet/$dateToString` với timezone `Asia/Bangkok`.
- Không load toàn collection về Node để tính.
- Fill missing chart months bằng 0 ở service để Recharts nhận đủ sáu điểm.
- Parallelize independent read aggregates bằng Promise.all; dashboard không cần transaction snapshot strict.
- Index date/status/reference theo các phase trước.

## RBAC and Projection

- ADMIN/WAREHOUSE_MANAGER nhận full dashboard.
- STAFF nếu được phép chỉ nhận operational summary, bỏ totalInventoryValue/cost fields và report-sensitive sections.

## Response/Empty State

- Empty database trả numeric zero và arrays đủ shape, không 404.
- Money là safe integer JSON number; frontend format VND.
- Month key stable `YYYY-MM` kèm label localized do frontend format.

## Error/Edge Cases

- Invalid warehouseId/months: 400; warehouse missing: 404.
- Inactive warehouse filter vẫn có thể bị từ chối cho dashboard current-state.
- Legacy missing category/reference được nhóm `Không xác định` thay vì crash.

## Test Cases

- Seed dashboard counts/values match independent calculation.
- Current-month boundary/timezone.
- Six months include zero months and chronological order.
- Low stock equality/zero/multi-warehouse.
- Role projection và warehouse filter.

## Files to Implement

- `backend/src/dashboard/dashboard.module.ts`
- `backend/src/dashboard/dashboard.controller.ts`
- `backend/src/dashboard/dashboard.service.ts`
- `backend/src/dashboard/dto/dashboard-query.dto.ts`
- `backend/src/dashboard/interfaces/dashboard-response.interface.ts`
- `backend/src/dashboard/dashboard.service.spec.ts`

## Definition of Done

- Metric definitions, aggregation pipeline boundaries và role projections được chốt.
- Response trực tiếp dùng được bởi Dashboard UI/Recharts.

