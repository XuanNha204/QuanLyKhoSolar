# PHASE 05 — Backend Architecture

## Mục tiêu

Thiết kế kiến trúc NestJS module hóa, API conventions, configuration, error handling, validation, Swagger và dependency boundaries.

## Runtime Architecture

```text
HTTP Request
  -> Global Validation Pipe
  -> JWT Guard
  -> Roles Guard
  -> Controller
  -> Domain Service
  -> Mongoose Model / MongoDB Session
  -> Response Interceptor
```

## Modules

- App, Config/Database.
- Auth, Users.
- Categories, Products, Suppliers, Warehouses, Projects.
- Inventory, InventoryTransactions.
- StockReceipts, StockIssues, StockChecks.
- Dashboard, Reports.
- Common: decorators, guards, filters, interceptors, pagination, errors, enums.

## Dependency Rules

- Controller chỉ parse request/gọi service; không chứa query/business logic.
- Service sở hữu business rules và orchestration.
- Core inventory mutation được tập trung trong InventoryService/InventoryMutationService để receipt/issue/check không duplicate logic.
- InventoryTransactionsService cung cấp append-only create nội bộ và read APIs.
- Module export service/model tối thiểu cần thiết; tránh circular dependency, dùng orchestration direction rõ.
- Không tạo generic repository abstraction nếu chỉ che Mongoose mà không thêm domain value.

## API Conventions

- API prefix `/api/v1`; Swagger `/api/docs`.
- List query: `page`, `limit`, `search`, filters, `sortBy`, `sortOrder`.
- Default page 1, limit 10; max limit 100.
- Success envelope: `{ success: true, data, meta? }`.
- Error envelope: `{ success: false, error: { code, message, details? }, timestamp, path }`.
- Dates ISO-8601; ObjectIds trả string; field naming camelCase.

## Global Infrastructure

- ValidationPipe: whitelist, forbidNonWhitelisted, transform, implicit conversion có kiểm soát.
- HttpExceptionFilter map validation, Mongoose cast, E11000 và unexpected errors.
- TransformInterceptor chuẩn hóa success response.
- Request logging ngắn, không log token/password.
- CORS origin `http://localhost:3000`, methods/headers cần thiết.
- Swagger Bearer auth, tags, DTO schemas và response descriptions.

## Configuration

Validate startup env:

```text
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/solar_inventory?replicaSet=rs0&directConnection=true
JWT_SECRET=<required>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=10
```

Không có secret mặc định trong production-like config; `.env.example` chỉ chứa placeholder.

## Error Catalog

- `VALIDATION_ERROR` 400.
- `INVALID_OBJECT_ID` 400.
- `INVALID_DOCUMENT_STATE` 409.
- `DUPLICATE_EMAIL/SKU/CODE` 409.
- `INSUFFICIENT_INVENTORY` 409.
- `STOCK_CHECK_STALE` 409.
- `ENTITY_NOT_FOUND` 404.
- `UNAUTHORIZED` 401; `FORBIDDEN` 403.
- `INTERNAL_ERROR` 500, log stack server-side nhưng không leak cho client.

## Transaction Infrastructure

- Database module expose Mongoose Connection để startSession.
- Helper `runInTransaction` đảm bảo start/commit/abort/end và optional transient retry.
- Callback luôn nhận ClientSession; mọi write/query trong transaction phải truyền session.
- Không fallback sang non-transactional execution.

## Testing Architecture

- Unit tests cho service business rules bằng model mocks có kiểm soát.
- Integration/e2e ưu tiên MongoDB replica set test database thật/local.
- Supertest cho auth, status codes, response envelopes và workflows.

## Files to Implement

- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/config/configuration.ts`
- `backend/src/config/env.validation.ts`
- `backend/src/database/database.module.ts`
- `backend/src/database/transaction.helper.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/dto/pagination-query.dto.ts`
- `backend/src/common/interfaces/api-response.interface.ts`
- Các module folders tương ứng domain.

## Dependencies

- Nest core/platform/config/swagger/mongoose, Mongoose, validator/transformer, JWT/passport, password hash, Joi hoặc validation tương đương, Helmet nếu tương thích local.

## Definition of Done

- Module/dependency boundaries và global pipeline rõ ràng.
- API/error/transaction conventions đủ để mọi module implement nhất quán.
- Swagger và local runtime ports đúng requirement.

