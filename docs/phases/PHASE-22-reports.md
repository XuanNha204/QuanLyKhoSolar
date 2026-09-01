# PHASE 22 — Reports

## Mục tiêu

Thiết kế Reports backend + frontend cho tồn kho, biến động, chứng từ, tồn thấp và xuất theo công trình với filter/pagination chính xác.

## Backend API

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/reports/inventory`: warehouseId/categoryId/product status/search; current quantity/value.
- GET `/reports/movements`: productId/warehouseId/type/dateFrom/dateTo; transaction ledger.
- GET `/reports/stock-documents`: documentType/status/warehouseId/date range; receipt/issue summaries.
- GET `/reports/project-issues`: projectId/date range; issued product totals/details.
- GET `/reports/low-stock`: categoryId/warehouseId?; total/min/deficit.
- GET `/reports/summary`: selected date range totals imported/exported/adjusted and document counts.

MVP trả JSON/page meta; CSV/Excel/PDF export là enhancement sau correctness, không bắt buộc.

## Report Rules

- Current inventory report đọc Inventory; movement report đọc immutable ledger.
- Document reports chỉ tính CONFIRMED trừ khi filter status explicitly cho audit list.
- Date validation: from <= to, maximum range hợp lý hoặc pagination bắt buộc.
- Totals được tính trên toàn filter set, không chỉ current page.
- Value = current quantity * Product.costPrice; không FIFO/weighted-average.
- Time grouping `Asia/Bangkok`; database timestamps UTC.

## Frontend UX

- Route `/reports` với Tabs: Tồn kho, Biến động, Nhập/Xuất, Công trình, Tồn thấp.
- Filter bar rõ; date picker popover; Apply/Reset thay vì query mỗi keystroke cho report nặng.
- Summary cards + semantic DataTable; report state nằm URL để back/refresh.
- Print-friendly CSS optional; không làm deployment/export pipeline ngoài scope.
- Role không có financial access sẽ ẩn value/cost or whole reports tab.

## DTO/Validation

- Shared DateRangeQuery DTO; `@IsDateString`, ObjectId, enums, pagination/sort allowlist.
- Không nhận Mongo operators từ query; search escaped.
- Backend projection theo role, không chỉ frontend hidden columns.

## Error/Empty Cases

- Invalid range/filter/ObjectId: 400.
- Entity missing khi explicit ID filter: 404 hoặc empty theo documented policy; chọn 404 để báo filter stale.
- Empty report có zero summary và clear empty message.
- Missing legacy reference không crash aggregate.

## Test Cases

- Each report totals match seeded reconciliation.
- Date boundary/timezone/status filters.
- Pagination totals independent of page.
- Role financial projection.
- Frontend apply/reset/url/loading/empty/error/table responsive.

## Files to Implement

Backend:

- `backend/src/reports/reports.module.ts`
- `backend/src/reports/reports.controller.ts`
- `backend/src/reports/reports.service.ts`
- `backend/src/reports/dto/*.dto.ts`
- `backend/src/reports/reports.service.spec.ts`

Frontend:

- `frontend/src/app/(dashboard)/reports/page.tsx`
- `frontend/src/features/reports/api.ts`
- `frontend/src/features/reports/types.ts`
- `frontend/src/features/reports/components/report-filters.tsx`
- `frontend/src/features/reports/components/*-report.tsx`

## Definition of Done

- Report datasets, metric/filter semantics, RBAC và UI states đủ chi tiết.
