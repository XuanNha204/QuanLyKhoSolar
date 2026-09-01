# PHASE 19 — Stock In UI

## Mục tiêu

Thiết kế UI danh sách, tạo/sửa DRAFT, chi tiết, xác nhận và cancel StockReceipt embedded items.

## Routes

- `/stock-receipts`: list/filter.
- `/stock-receipts/new`: create form.
- `/stock-receipts/[id]`: detail/actions.
- `/stock-receipts/[id]/edit`: DRAFT edit.

## List Screen

Columns code/date/supplier/warehouse/item count/total amount/status/creator/actions. Filters status/supplier/warehouse/date range; newest first.

## Receipt Form

- Header fields supplier, warehouse, receiptDate, note.
- `useFieldArray` item editor: product combobox, SKU/name context, quantity, unitPrice, line total, remove.
- Add item button; prevent duplicate product selection; at least one line.
- Currency inputs display VND but keep integer form value.
- Summary item count/total quantity/total receipt value.
- Sticky action footer trên long form nhưng không che last row; save DRAFT only.

## Product Selection

- Async/debounced active product search; keyboard accessible Command/Popover.
- Selected products excluded/disabled in other rows.
- Show unit/category/brand to avoid wrong product.

## Detail/Confirm

- Header/status/audit summary + semantic items table.
- CONFIRMED hiển thị link transaction history và resulting inventory.
- Confirm AlertDialog nêu rằng tồn sẽ tăng và phiếu không sửa được.
- Confirm mutation loading; success invalidate receipt/inventory/transactions/dashboard.
- Error rollback message giữ nguyên data, không giả success.

## RBAC/States

- ADMIN/MANAGER create/edit/confirm/cancel.
- STAFF read policy only.
- DRAFT actions; CONFIRMED immutable; CANCELLED no mutation.

## Test Cases

- Add/remove/duplicate/validation/currency calculation.
- Create draft no inventory change; confirm updates UI caches.
- Double click confirm chỉ một request; backend conflict handled.
- Responsive item editor/card fallback and keyboard selection.

## Files to Implement

- `frontend/src/app/(dashboard)/stock-receipts/**`
- `frontend/src/features/stock-receipts/api.ts`
- `frontend/src/features/stock-receipts/types.ts`
- `frontend/src/features/stock-receipts/schemas.ts`
- `frontend/src/features/stock-receipts/components/receipt-form.tsx`
- `frontend/src/features/stock-receipts/components/receipt-items-editor.tsx`
- `frontend/src/features/stock-receipts/components/receipt-detail.tsx`
- `frontend/src/features/stock-receipts/components/receipt-table.tsx`

## Definition of Done

- DRAFT/confirm workflow, dynamic embedded items, cache invalidation và error UX được chốt.

