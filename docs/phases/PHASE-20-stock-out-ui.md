# PHASE 20 — Stock Out UI

## Mục tiêu

Thiết kế UI StockIssue hướng dẫn người dùng chọn đúng warehouse/project/product, hiển thị tồn tham khảo và xử lý authoritative insufficient-stock error.

## Routes

- `/stock-issues`, `/stock-issues/new`, `/stock-issues/[id]`, `/stock-issues/[id]/edit`.

## List Screen

Columns code/date/warehouse/project/item count/total quantity/status/creator/actions. Filters status/warehouse/project/date range.

## Issue Form

- Chọn warehouse trước; project optional chỉ PLANNED/IN_PROGRESS.
- Items useFieldArray product/available quantity/requested quantity/unit/remove.
- Product search lọc active và hiển thị tồn tại selected warehouse.
- Khi đổi warehouse, yêu cầu xác nhận rồi clear items để tránh stale quantities.
- Client cảnh báo/request validation `requested <= displayedAvailable`, nhưng copy ghi rõ tồn được kiểm tra lại khi xác nhận.
- Summary total items/quantity; save DRAFT.

## Confirm UX

- Detail hiển thị current available snapshot bên cạnh requested.
- AlertDialog liệt kê total quantities/project và hậu quả trừ kho.
- Backend 409 `INSUFFICIENT_INVENTORY` map vào item/product row, hiển thị requested/available và action `Làm mới tồn kho`.
- Không optimistic decrement; chỉ update cache sau confirm success.
- Invalidate issue/inventory/transactions/dashboard/project history.

## Safety/Accessibility

- Confirm button disabled khi form invalid, không chỉ vì client available data stale.
- Error summary focusable và liên kết row lỗi.
- Numeric inputs có label/unit; no color-only stock warning.
- Mobile item rows dùng stacked card/overflow strategy không mất actions.

## Test Cases

- Warehouse change clears items; duplicate products prevented.
- Exact stock, insufficient stock, missing inventory and server race error.
- Demo 20 -> 15 và attempt 30 retains 15.
- Role/state/confirm double click/cache refresh.

## Files to Implement

- `frontend/src/app/(dashboard)/stock-issues/**`
- `frontend/src/features/stock-issues/api.ts`
- `frontend/src/features/stock-issues/types.ts`
- `frontend/src/features/stock-issues/schemas.ts`
- `frontend/src/features/stock-issues/components/issue-form.tsx`
- `frontend/src/features/stock-issues/components/issue-items-editor.tsx`
- `frontend/src/features/stock-issues/components/issue-detail.tsx`
- `frontend/src/features/stock-issues/components/issue-table.tsx`

## Definition of Done

- Stock-aware UX hỗ trợ người dùng nhưng không thay backend authority.
- Insufficient error mapping và cache behavior đủ cho demo/race cases.

