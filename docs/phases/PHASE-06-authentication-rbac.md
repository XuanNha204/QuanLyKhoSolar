# PHASE 06 — Authentication + RBAC

## Mục tiêu

Thiết kế login, JWT lifecycle, current-user context, password handling và backend-enforced role permissions.

## API Contract

### POST `/api/v1/auth/login`

Request: `{ email, password }`.

Response: `{ accessToken, tokenType: "Bearer", expiresIn, user: { id, email, fullName, role } }`.

Errors: 401 cho credential sai; 403 cho account INACTIVE. Không tiết lộ email có tồn tại hay không qua message.

### GET `/api/v1/auth/me`

Bearer required; trả current user public profile. Token có user không còn tồn tại/inactive bị từ chối.

### PATCH `/api/v1/auth/change-password`

Request currentPassword/newPassword; verify current, enforce password policy, hash và update.

### Users APIs

- GET/POST `/users`, GET/PATCH `/users/:id`, PATCH `/users/:id/status`, PATCH `/users/:id/reset-password`.
- Chỉ ADMIN; không cho admin tự vô hiệu hóa chính mình hoặc xóa admin cuối cùng.

## JWT Design

Payload tối thiểu: `sub`, `email`, `role`; không đưa password/status hay dữ liệu lớn vào token.

- Access token expiry mặc định 8 giờ cho local demo.
- JWT secret từ env, không commit.
- Không triển khai refresh token trong MVP.
- Frontend lưu access token trong sessionStorage để giảm lifetime giữa browser sessions; API client gửi Authorization header.

## Password Rules

- Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.
- Hash bằng bcrypt rounds từ config; không log request password.
- Reset password do ADMIN tạo temporary password; user có thể đổi sau login.

## Guards và Decorators

- `JwtAuthGuard` xác thực token và load user active.
- `@Roles(...roles)` metadata decorator.
- `RolesGuard` so sánh current role.
- `@CurrentUser()` lấy typed authenticated principal.
- Guard áp dụng global hoặc controller-level với `@Public()` cho login/health/docs phù hợp.

## Permission Matrix

| Resource | ADMIN | WAREHOUSE_MANAGER | STAFF |
|---|---|---|---|
| Users | CRUD | No access | No access |
| Master data | CRUD | CRUD | Read |
| Inventory | Read | Read | Read |
| Receipt/Issue/Check | CRUD/confirm | CRUD/confirm | No mutation |
| Transactions | Read | Read | Restricted read |
| Dashboard/Reports | Full | Full | Operational subset |

Backend role checks áp dụng cả list/detail để ngăn truy cập URL trực tiếp.

## DTO Validation

- Login email normalized, password non-empty/max length.
- Create user email/fullName/role/password/status.
- Update user không cho client set passwordHash.
- ObjectId params validate qua reusable pipe/DTO.

## Edge Cases

- Token valid nhưng user đã inactive/deleted: 401/403.
- Role user đổi sau khi token cấp: guard đọc user database và dùng role mới, không chỉ tin payload.
- Duplicate email: 409.
- Reset/admin-last/self-disable rules: 409.
- Timing/message login không phân biệt unknown email và wrong password.

## Test Cases

- Login đúng/sai/inactive; expired/invalid/missing token.
- Mỗi role truy cập endpoint cho phép/cấm đúng 200/403.
- Password không xuất hiện trong responses/logs.
- ADMIN create/update/reset user; duplicate email 409.
- Role thay đổi có hiệu lực ở request kế tiếp.

## Files to Implement

- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/change-password.dto.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/guards/roles.guard.ts`
- `backend/src/auth/decorators/public.decorator.ts`
- `backend/src/auth/decorators/roles.decorator.ts`
- `backend/src/auth/decorators/current-user.decorator.ts`
- `backend/src/users/**`

## Dependencies

- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, bcrypt package và typings.

## Definition of Done

- Authentication/RBAC contract đủ chi tiết, backend enforced và có test matrix.
- Password/JWT secrets được xử lý an toàn, không có plain password persistence.

