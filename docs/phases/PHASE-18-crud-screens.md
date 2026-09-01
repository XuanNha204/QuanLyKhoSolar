# PHASE 18 — CRUD Screens

## Mục tiêu

Thiết kế reusable list/form/detail patterns cho Users, Categories, Products, Suppliers, Warehouses và Projects.

## Shared DataTable Pattern

- TanStack Table + semantic shadcn Table.
- Server pagination/sorting/filtering; URL query state.
- Toolbar: debounced search, filters, clear filters, primary create button theo role.
- Columns responsive; mobile horizontal scroll, sticky action column chỉ desktop nếu không che content.
- Skeleton rows, empty illustration bằng Lucide, error state với Retry.
- Pagination có page/total/result count và page-size 10/20/50.
- Column sort button có `aria-sort`; no div-grid fake table.

## Shared Form Pattern

- Dialog/Sheet cho form ngắn; dedicated page/large Dialog cho Product/Project.
- RHF + Zod, field descriptions, inline errors, server field error mapping.
- Dirty form close/navigation confirmation.
- LoadingButton ổn định width; disable duplicate submits.
- Create success toast + close/invalidate; update refresh detail/list.

## Delete/Deactivate Pattern

- AlertDialog nêu rõ entity/action và hậu quả.
- Với soft delete, label `Ngừng hoạt động`; không dùng wording xóa vĩnh viễn.
- Backend 409 dependency được hiển thị rõ, không optimistic-remove sai.

## Screen Specifications

### Categories

Columns code/name/status/product count/updated/actions. Form code/name/description/status.

### Products

Columns SKU/name/category/brand-model/unit/costPrice/minStock/status/actions. Filters category/status; form đầy đủ Product nhưng không có quantity. Detail/stock summary link.

### Suppliers

Columns code/name/contact/phone/status/actions. Contact fields grouped trong form.

### Warehouses

Columns code/name/address/status/total quantity/actions; detail summary cards và inventory link.

### Projects

Columns code/name/customer/capacity/status/startDate/actions; detail có issued-items/stock issues tab.

### Users

ADMIN-only; columns name/email/role/status/last login/actions. Create/edit/status/reset-password flows; không hiển thị hash.

## Query/Mutation Invalidation

- Invalidate relevant list/detail.
- Category/product/supplier/warehouse/project changes invalidate dependent selects.
- Product/warehouse changes có thể invalidate dashboard/low-stock.
- Không invalidate toàn query cache không cần thiết.

## RBAC UX

- STAFF không thấy mutation buttons nhưng direct requests vẫn dựa backend.
- Cost columns hidden theo current role.
- Disabled state có tooltip giải thích nếu action visible nhưng unavailable do status.

## Test Cases

- Search/filter/sort/page URL restore.
- Loading/empty/error/retry.
- Client/server validation và duplicate conflicts.
- Create/update/deactivate/invalidation/toasts.
- Responsive/keyboard/dialog focus/RBAC.

## Files to Implement

- `frontend/src/components/shared/data-table/**`
- `frontend/src/components/shared/entity-status-badge.tsx`
- `frontend/src/components/shared/confirm-action-dialog.tsx`
- `frontend/src/components/shared/loading-button.tsx`
- Feature folders/routes cho users/categories/products/suppliers/warehouses/projects.

## Definition of Done

- Shared CRUD UX và từng screen/column/form/action được chốt.
- Table/form patterns accessible, responsive và dùng REST API thật.

