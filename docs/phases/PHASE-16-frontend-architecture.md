# PHASE 16 — Next.js Frontend Architecture

## Mục tiêu

Thiết kế frontend Next.js App Router type-safe, feature-oriented, tích hợp REST API thật bằng TanStack Query và có design system chuyên nghiệp, responsive, accessible.

## Architectural Decisions

- Next.js App Router, TypeScript strict, Tailwind CSS và shadcn/ui.
- REST backend vẫn là mutation authority; không dùng Server Actions thay thế vì requirement bắt buộc TanStack Query + NestJS API.
- Interactive screens là Client Components ở boundary cần query/form/table; layout/static metadata giữ Server Component khi phù hợp.
- API types/interfaces đặt trong feature hoặc shared types; không duplicate enum strings tùy ý.
- Dùng native fetch wrapper có typed error thay vì thêm Axios nếu không cần.

## Folder Structure

```text
frontend/src/
  app/
    (auth)/login/page.tsx
    (dashboard)/layout.tsx
    (dashboard)/dashboard/page.tsx
    (dashboard)/products/page.tsx
    ...
  components/
    ui/                 shadcn source
    layout/
    shared/
  features/
    auth, products, categories, suppliers, warehouses,
    inventory, receipts, issues, transactions, projects,
    stock-checks, dashboard, reports, users
  lib/
    api-client.ts, auth-storage.ts, query-client.ts, utils.ts
  providers/
    app-providers.tsx, query-provider.tsx, auth-provider.tsx
  hooks/
  types/
```

Route page files compose feature components; domain query/form logic nằm trong `features/*`.

## Design System

Nguồn chi tiết: `design-system/solar-inventory-management/MASTER.md`.

- Visual: flat, clean, dense enterprise dashboard; không gradient/3D/excessive shadow.
- Primary slate `#334155`, accent stock green `#059669`, background `#F8FAFC`, foreground `#0F172A`, border `#E6E8EA`, destructive `#DC2626`.
- Typography: Inter qua `next/font`, weights 400/500/600/700.
- Radius vừa phải 6–10px; borders rõ; shadow chỉ dùng rất nhẹ cho overlay nếu cần.
- Spacing 4/8px rhythm; dense table row 44–48px nhưng control target tối thiểu 40–44px trên web.
- Motion 150–200ms color/opacity, respect `prefers-reduced-motion`.
- Lucide React là icon family duy nhất; decorative icons `aria-hidden`.

## shadcn Components

Button, Input, Label/Form, Select, Textarea, Checkbox, Badge, Card, Table, Dialog/AlertDialog, Sheet, DropdownMenu, Popover, Command, Calendar, Tabs, Tooltip, Skeleton, Separator, ScrollArea, Breadcrumb, Sidebar và Sonner/toast.

- Giữ primitives trong `components/ui`.
- Composed business components ngoài `ui`.
- Không sửa mất keyboard/focus/ARIA behavior của Radix primitives.

## State Management

- Server state: TanStack Query, query keys factory theo feature.
- Form state: React Hook Form + Zod resolver.
- Auth state: context + sessionStorage access token/user snapshot; `/auth/me` xác minh khi app load.
- Local UI state: component state; không thêm global store nếu chưa cần.
- Search/filter/page state đồng bộ URLSearchParams khi có lợi cho back/refresh/share.

## API Client

- Base URL từ `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`.
- Gắn Bearer token; parse success envelope; throw typed `ApiError` từ error envelope.
- 401: clear session và redirect login; 403 giữ session, hiển thị forbidden.
- Không mock API khi backend tồn tại.

## Query Conventions

- Stable key: `['products', query]`, `['products', id]`, `['inventory', query]`.
- Keep previous page data/placeholder để pagination mượt; debounce search 300ms.
- Mutation success invalidate list/detail/dashboard/inventory keys liên quan.
- Không retry 4xx; retry giới hạn network/5xx reads; mutation không auto retry nếu không idempotent.

## Responsive Layout

- Desktop >=1024: fixed/collapsible sidebar + header.
- Tablet: compact sidebar.
- Mobile: sidebar trong Sheet, tables nằm trong horizontal scroll hoặc chuyển card summary khi cần.
- Test widths 375, 768, 1024, 1440; sticky elements không che focus/content.

## Accessibility

- Semantic table structure với caption/sr-only context; aria-sort cho sortable headers.
- Label/error association, focus first invalid field/error summary khi nhiều lỗi.
- Dialog focus trap/restore; icon-only buttons có accessible name.
- Status không dùng màu đơn độc; luôn có text/icon.
- Chart có heading, text summary và accessible fallback table.

## Files to Implement

- `frontend/src/app/layout.tsx`, `globals.css`, route groups.
- `frontend/src/providers/**`
- `frontend/src/lib/api-client.ts`, `auth-storage.ts`, `query-keys.ts`, `utils.ts`
- `frontend/src/components/ui/**`, `layout/**`, `shared/**`
- `frontend/components.json`, `frontend/.env.example`, configs.

## Dependencies

- Next/React, Tailwind, shadcn/Radix dependencies, TanStack Query/Table, RHF, Zod/resolvers, Recharts, Lucide, date-fns, Sonner.

## Definition of Done

- Folder/state/query/theme/responsive/a11y conventions đủ để implement thống nhất.
- Design system và shadcn composition rules được chốt, không tạo generic student UI.

