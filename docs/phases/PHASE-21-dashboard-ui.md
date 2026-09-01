# PHASE 21 — Dashboard UI

## Mục tiêu

Thiết kế dashboard chuyên nghiệp dùng Recharts, ưu tiên đọc nhanh KPI, xu hướng nhập/xuất, phân bố category, tồn thấp và giao dịch gần đây.

## Page Structure

1. Page header + warehouse filter + last refreshed indicator.
2. Six KPI cards responsive grid.
3. Movement chart sáu tháng và category distribution.
4. Low-stock table và recent transactions.

## KPI Cards

- Tổng sản phẩm: Package.
- Tổng thiết bị: Boxes.
- Giá trị tồn: CircleDollarSign, ADMIN/MANAGER only.
- Tồn thấp: TriangleAlert.
- Phiếu nhập tháng: ClipboardPlus.
- Phiếu xuất tháng: ClipboardMinus.

Cards dùng flat border, không excessive shadow/gradient. Số chính tabular numerals; subtitle giải thích scope. Loading dùng skeleton cùng kích thước để tránh layout shift.

## Movement Chart

- Recharts grouped BarChart theo tháng: nhập green accent, xuất slate/amber accessible contrast; export value hiển thị absolute.
- X/Y labels, legend text, tooltip keyboard-equivalent summary và responsive container có min height.
- Empty state riêng, không render trục vô nghĩa.
- Bảng dữ liệu ẩn/expandable accessible fallback.

## Category Distribution

- Horizontal BarChart, sort descending, tối đa 10 category; phù hợp so sánh magnitude hơn pie nhiều lát.
- Direct category/value labels; không dùng màu làm thông tin duy nhất.
- Overflow categories grouped/scroll strategy nếu tăng sau này.

## Low Stock

Semantic table SKU/name/current/min/deficit/status/action xem inventory. Rows zero stock có text `Hết hàng`; equality có `Chạm mức tối thiểu`; không chỉ badge color.

## Recent Transactions

Timeline/table compact: type badge, product, warehouse, signed quantity, previous -> new, reference link, user/time. IMPORT `+`, EXPORT/negative adjustment `-` rõ.

## Interaction and Query

- `useDashboardQuery({warehouseId})`; refresh button explicit, staleTime ngắn hợp lý.
- Sau confirmed receipt/issue/check, related mutations invalidate dashboard.
- Filter warehouse trong URL; skeleton/error retry/empty states từng section.
- Không auto-refresh quá nhanh gây load; optional manual refresh.

## Responsive/Accessibility

- KPI 1/2/3/6 columns theo breakpoint.
- Charts stack trên <1280; tables overflow-x-auto.
- Charts có text summary/fallback table; tooltip không hover-only.
- Contrast >=4.5:1 text, visible focus, reduced motion.

## Test Cases

- Full/empty/error/loading/role projection.
- Warehouse filter và cache key.
- Chart six-month order/zero fills/category sort.
- Mobile widths và accessible names/fallback values.

## Files to Implement

- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/features/dashboard/api.ts`
- `frontend/src/features/dashboard/types.ts`
- `frontend/src/features/dashboard/components/kpi-card.tsx`
- `frontend/src/features/dashboard/components/movement-chart.tsx`
- `frontend/src/features/dashboard/components/category-chart.tsx`
- `frontend/src/features/dashboard/components/low-stock-table.tsx`
- `frontend/src/features/dashboard/components/recent-transactions.tsx`

## Definition of Done

- Dashboard layout/metrics/chart types/states/accessibility được chốt và bám design system đã persist.

