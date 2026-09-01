# PHASE 24 — Final Implementation Plan

## Mục tiêu

Chốt thứ tự implementation, file/folder, dependencies, build gates, risk controls và definition of done để bắt đầu code ngay sau cross-phase review.

## Pre-Implementation Audit

1. Read repository/package/config/existing code/docs.
2. Classify reuse/modify/create/remove; preserve user code.
3. Remove unused Prisma/PostgreSQL artifacts only khi xác định chính xác.
4. Verify Node/npm/MongoDB/drawio không phải runtime dependency.
5. Create `docs/implementation-progress.md` trước code.

Current audit baseline: repository chưa có application code/package manifests; implementation sẽ scaffold `backend` và `frontend`, không overwrite code người dùng.

## Implementation Order

1. Root Git/env/docs conventions.
2. NestJS project/config/Mongoose connection/global infrastructure.
3. Enums/schemas/database transaction helper.
4. Seed infrastructure.
5. Auth/RBAC/Users.
6. Categories/Products/Suppliers/Warehouses/Projects.
7. Inventory + InventoryTransactions.
8. StockReceipt -> StockIssue -> StockCheck.
9. Dashboard/Reports/Swagger.
10. Backend build/unit/e2e gate.
11. Next.js/Tailwind/shadcn/providers/design tokens.
12. Auth UI/admin layout.
13. CRUD/master data screens.
14. Inventory/transaction UI.
15. Receipt/Issue/Check UIs.
16. Dashboard/Reports UIs.
17. Seed/demo integration workflow.
18. Build/lint/test/fix/README/final report.

## Planned Root Structure

```text
backend/
frontend/
docs/
  phases/
  phase-progress.md
  implementation-progress.md
  PHASES-COMPLETED.md
  test-results.md
design-system/
scripts/
.gitignore
README.md
```

## Backend Build Gates

- Foundation/schema/auth/master data build.
- Core inventory/receipt/issue/check build + focused tests.
- Dashboard/reports/seed build + e2e.
- Không tiếp tục qua gate khi TypeScript error chưa được sửa.

## Frontend Build Gates

- Foundation/auth/layout lint+build.
- CRUD/stock workflows lint+build.
- Dashboard/reports final lint+build và responsive manual check.

## Dependency Plan

Backend: Nest packages, Mongoose/@nestjs/mongoose, config, Swagger, class-validator/transformer, JWT/Passport, bcrypt, testing/Supertest.

Frontend: Next/React, Tailwind/shadcn dependencies, TanStack Query/Table, RHF/Zod/resolvers, Recharts, Lucide, date-fns, Sonner.

Pin compatible versions discovered at scaffold time; do not mix unsupported major versions. Commit lockfiles.

## Environment/Run Contract

- MongoDB local rs0, database `solar_inventory`.
- Backend `http://localhost:3001`, API prefix `/api/v1`, Swagger `/api/docs`.
- Frontend `http://localhost:3000`.
- Root `npm run dev` may use concurrently to start both apps; individual scripts vẫn có.

## Core Implementation Rules

- Product never contains quantity.
- No direct Inventory HTTP mutation.
- Receipt/Issue/Check session transaction + conditional state claim.
- Issue atomic conditional decrement; no negative stock.
- Every mutation creates append-only transaction with previous/new.
- Backend DTO/RBAC is authority; frontend validates for UX.
- Confirmed documents immutable.

## Known Risks and Mitigation

- MongoDB standalone prevents transactions: startup docs/health and rs0 instructions.
- Mongoose session omitted on one query: central helper/service and integration rollback tests.
- Race on upsert/code generation: unique indexes + bounded transient retry.
- Dashboard aggregate complexity: focused pipelines/tests and small seed verification.
- Next/shadcn/Tailwind version mismatch: scaffold current compatible defaults and build early.
- Local environment MongoDB unavailable: distinguish build PASS from integration NOT TESTED; never fake.

## Documentation Deliverables

- Root README with setup, replica set, env, install, seed, run, Swagger, accounts/workflow/limitations.
- `.env.example` backend/frontend.
- Implementation progress and honest test results.
- Swagger for all main modules.

## Final Definition of Done

- 24 phase docs DONE and cross-review fixed.
- Backend/frontend compile, lint where configured, and core tests executed.
- Seed meets minimum and reconciliation.
- Demo workflow passes against real backend/MongoDB or explicitly reports blocker/NOT TESTED.
- No Prisma/PostgreSQL runtime/config remains.
- README enables clean local setup and run.

