# PHASE 13 — Project

## Mục tiêu

Thiết kế quản lý công trình Solar và liên kết StockIssue để truy vết thiết bị đã cấp cho khách hàng/công trình.

## API Contract

Tất cả endpoint dưới đây nằm dưới prefix `/api/v1`.

- GET `/projects`: page/limit/search/status/date range/sort.
- POST `/projects`.
- GET/PATCH `/projects/:id`.
- DELETE `/projects/:id`: soft cancel/inactive policy, không hard delete.
- GET `/projects/:id/stock-issues`: confirmed issue history và tổng quantity theo product.

## DTO

code, name, customerName, address?, capacity?, status?, startDate?, note?.

- code uppercase unique; strings trimmed/maxlength.
- capacity finite >=0 (kWp); startDate ISO date.
- Backend-owned timestamps.

## Status Transitions

```text
PLANNED -> IN_PROGRESS | CANCELLED
IN_PROGRESS -> COMPLETED | CANCELLED
COMPLETED/CANCELLED -> terminal
```

Cho phép ADMIN override terminal status chỉ khi có endpoint/action riêng trong tương lai; MVP không cho reverse.

## Business Rules

- StockIssue mới chỉ liên kết PLANNED hoặc IN_PROGRESS Project.
- Project có confirmed issues không hard-delete.
- Project code immutable sau confirmed issue đầu tiên.
- Project detail aggregate issued products chỉ tính confirmed issues.

## RBAC

- ADMIN/WAREHOUSE_MANAGER CRUD/status/read issue history.
- STAFF read-only project summary, ẩn dữ liệu không cần thiết nếu policy yêu cầu.

## Errors/Edge Cases

- Duplicate code 409; invalid transition 409; missing 404.
- Completed/cancelled project dùng cho draft/confirm issue: 400/409.
- Cancel project đang có DRAFT issue: 409, phải cancel draft issues trước.

## Test Cases

- CRUD/search/filter/status transitions.
- Project issue history/totals.
- Invalid reverse transition và issue dependency.
- Code normalization/immutability.

## Files to Implement

- `backend/src/projects/projects.module.ts`
- `backend/src/projects/projects.controller.ts`
- `backend/src/projects/projects.service.ts`
- `backend/src/projects/schemas/project.schema.ts`
- `backend/src/projects/dto/create-project.dto.ts`
- `backend/src/projects/dto/update-project.dto.ts`
- `backend/src/projects/dto/query-project.dto.ts`
- `backend/src/projects/projects.service.spec.ts`

## Definition of Done

- Project CRUD/lifecycle và issue traceability được chốt.
