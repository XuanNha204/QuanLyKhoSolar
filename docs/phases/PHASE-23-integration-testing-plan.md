# PHASE 23 — Integration Testing Plan

## Mục tiêu

Xác định test pyramid, local test environment, automated/manual cases, concurrency verification và honest result reporting cho toàn hệ thống.

## Result Policy

- Chỉ ghi PASS sau khi command/test thực chạy thành công.
- Chưa chạy: NOT TESTED; chạy lỗi: FAIL và lưu evidence ngắn.
- Không suy diễn MongoDB connected nếu chưa ping/execute transaction thật.

## Test Environment

- Backend test env cổng riêng và database `solar_inventory_test`.
- MongoDB replica set bắt buộc; có thể dùng local rs0 hoặc `MongoMemoryReplSet` nếu dependency hoạt động ổn định.
- Test reset chỉ target database có suffix `_test`.
- Frontend API base trỏ backend test/local thật, không fake core workflow.

## Backend Unit Tests

- DTO/normalization/errors.
- Auth password/JWT/RBAC.
- Master data lifecycle/dependencies.
- Inventory increase/decrease/adjust invariants.
- Receipt/Issue/Check state transitions và service orchestration.
- Dashboard/report aggregation helpers.

## Backend E2E Tests

- Login/auth/me/unauthorized/forbidden.
- CRUD primary modules, duplicate conflicts, validation envelopes.
- Receipt confirm creates Inventory + IMPORT and rollback injected failure.
- Issue exact/insufficient/multi-item rollback.
- StockCheck adjustment/stale rollback.
- Transaction list/reference filters.
- Dashboard/report counts and low-stock.

## Concurrency Tests

- Seed Inventory 10, fire two issue confirms each requesting 7 concurrently.
- Expected: one success, one conflict; final quantity 3; exactly one EXPORT -7; never negative.
- Concurrent double-confirm same document: one success/one conflict; no duplicate transaction.
- Concurrent first receipt upserts handle unique collision/retry correctly.

## Frontend Tests/Checks

- TypeScript/build/lint mandatory.
- Component tests ưu tiên auth form, API error mapping, receipt/issue item validation, role nav và dashboard transforms nếu test tooling được thêm.
- Manual responsive/accessibility checks 375/768/1024/1440, keyboard/focus, reduced-motion.
- Network check xác nhận UI gọi Nest API thật.

## Demo Workflow Automated/Manual

1. Login admin.
2. Load dashboard.
3. Create Category/Product/Supplier/Warehouse/Project.
4. Create/confirm receipt Jinko x20; assert 0 -> 20 and IMPORT +20.
5. Create/confirm issue x5; assert 20 -> 15 and EXPORT -5.
6. Confirm issue x30; assert 409 and inventory unchanged.
7. Create/update/confirm check 15 -> 14; assert ADJUSTMENT -1.
8. Assert dashboard refresh values.

## Build/Test Commands

```bash
cd backend && npm run build
cd backend && npm test
cd backend && npm run test:e2e
cd frontend && npm run lint
cd frontend && npm run build
```

Additional integration script may start backend/frontend processes, wait health URLs, execute workflow, then terminate only processes it started.

## Test Evidence

- `docs/test-results.md`: timestamp, environment, commands, PASS/FAIL/NOT TESTED, concise error/evidence.
- No secrets/tokens/password hashes in evidence.

## Files to Implement

- `backend/test/app.e2e-spec.ts`
- `backend/test/inventory-workflow.e2e-spec.ts`
- `backend/test/concurrency.e2e-spec.ts`
- Backend unit specs per core service.
- `scripts/demo-workflow.mjs` hoặc equivalent.
- `docs/test-results.md`.

## Definition of Done

- Test coverage matrix bao gồm happy/error/race/rollback/RBAC/frontend integration.
- Result policy chống fake PASS và demo workflow có assertions định lượng.

