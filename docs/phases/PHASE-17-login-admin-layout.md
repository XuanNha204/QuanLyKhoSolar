# PHASE 17 — Login + Admin Layout

## Mục tiêu

Thiết kế login flow, protected dashboard shell, sidebar navigation, header/profile actions và role-aware UX.

## Login Screen

- Route `/login`, centered two-column/compact card tùy viewport; brand mark bằng Lucide Sun + text, không cần logo bitmap.
- Email/password fields có autocomplete `username/current-password`, cho paste/password manager.
- Show/hide password accessible button; submit loading không đổi layout.
- Inline validation + server error summary; không tiết lộ credential detail.
- Demo credential hint trong development UI/README, không prefill password production.
- Authenticated user vào `/login` được redirect `/dashboard`.

## Auth Flow

1. Validate Zod/RHF.
2. POST `/auth/login` qua TanStack mutation.
3. Store token/user in sessionStorage.
4. Invalidate/set current-user query, redirect dashboard.
5. App bootstrap GET `/auth/me`; failure clear session.
6. Logout clear queries/storage và replace `/login`.

## Protected Layout

- `AuthProvider/AuthGate` hiển thị full-page skeleton trong lúc restore/verify.
- Chưa auth redirect login với preserved safe return path.
- Không flash protected content.
- 403 page riêng có navigation quay lại dashboard.

## Sidebar

Nhóm navigation:

- Tổng quan: Dashboard.
- Danh mục: Sản phẩm, Danh mục, Nhà cung cấp, Kho, Công trình.
- Nghiệp vụ: Tồn kho, Nhập kho, Xuất kho, Kiểm kê, Lịch sử giao dịch.
- Phân tích: Báo cáo.
- Hệ thống: Người dùng (ADMIN only).

Active state có background/border/icon+text; không chỉ đổi màu. Desktop collapse giữ tooltip; mobile dùng Sheet và đóng sau navigation.

## Header

- Mobile menu, breadcrumb/page title, optional global search placeholder, current user dropdown.
- Dropdown: name/role, profile/change password, logout.
- Không đặt quá nhiều actions; page primary action nằm trong page header.

## shadcn/Lucide Mapping

- Sidebar/Sheet/Breadcrumb/DropdownMenu/Avatar/Button/Tooltip/Skeleton/Separator.
- Icons: LayoutDashboard, Package, Tags, Truck, Warehouse, Boxes, ClipboardPlus, ClipboardMinus, ClipboardCheck, Building2, History, BarChart3, Users, LogOut, Menu.

## Responsive and Accessibility

- Sidebar keyboard navigable; focus visible; `aria-current=page`.
- Mobile Sheet có label/title, focus trap và 44px targets.
- Login error announced bằng aria-live; submit focus retained.
- Reduced motion disables nonessential sidebar transitions.

## Test Cases

- Login success/failure/inactive/validation/loading.
- Restore token valid/expired; logout; direct protected URL.
- Role nav visibility và backend 403 fallback.
- Keyboard/mobile/sidebar collapse behavior.

## Files to Implement

- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/app/forbidden/page.tsx`
- `frontend/src/features/auth/**`
- `frontend/src/components/layout/app-sidebar.tsx`
- `frontend/src/components/layout/app-header.tsx`
- `frontend/src/components/layout/mobile-sidebar.tsx`
- `frontend/src/components/layout/page-header.tsx`
- `frontend/src/providers/auth-provider.tsx`

## Definition of Done

- Login/session/protection/sidebar/header states được đặc tả cho desktop/mobile và role/a11y.

