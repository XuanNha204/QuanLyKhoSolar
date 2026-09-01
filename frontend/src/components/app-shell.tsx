"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  History,
  LogOut,
  Menu,
  PackageOpen,
  ReceiptText,
  Search,
  ShieldCheck,
  Tags,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const navigation = [
  ["/dashboard", "Dashboard", Gauge],
  ["/products", "Sản phẩm", Boxes],
  ["/categories", "Danh mục", Tags],
  ["/suppliers", "Nhà cung cấp", Truck],
  ["/warehouses", "Kho", Warehouse],
  ["/inventory", "Tồn kho", Archive],
  ["/stock-receipts", "Nhập kho", PackageOpen],
  ["/stock-issues", "Xuất kho", ReceiptText],
  ["/stock-checks", "Kiểm kê", ClipboardCheck],
  ["/projects", "Công trình", FolderKanban],
  ["/inventory-transactions", "Lịch sử giao dịch", History],
  ["/reports", "Báo cáo", ChartNoAxesCombined, "manager"],
  ["/users", "Người dùng", Users, "admin"],
] as const;
const roleLabels: Record<AuthUser["role"], string> = {
  ADMIN: "Quản trị viên",
  WAREHOUSE_MANAGER: "Quản lý kho",
  STAFF: "Nhân viên",
};

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b px-5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <Zap className="size-5" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight">SOLAR INVENTORY</p>
        <p className="text-[11px] text-muted-foreground">
          Quản lý kho thiết bị
        </p>
      </div>
    </div>
  );
}
function Navigation({
  user,
  onNavigate,
}: {
  user?: AuthUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="flex-1 space-y-1 overflow-y-auto p-3"
      aria-label="Điều hướng chính"
    >
      {navigation
        .filter(
          (item) =>
            !item[3] ||
            user?.role === "ADMIN" ||
            (item[3] === "manager" && user?.role === "WAREHOUSE_MANAGER"),
        )
        .map(([href, label, Icon]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                active && "bg-emerald-50 text-emerald-700",
              )}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
function Sidebar({ user }: { user?: AuthUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex">
      <Brand />
      <Navigation user={user} />
      <div className="border-t p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-600" />
          JWT & RBAC đang hoạt động
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ready = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const token = ready ? getToken() : null;
  useEffect(() => {
    if (ready && !token) router.replace("/login");
  }, [ready, router, token]);
  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
    enabled: ready && Boolean(token),
  });
  useEffect(() => {
    if (userQuery.error) router.replace("/login");
  }, [router, userQuery.error]);
  if (!ready || userQuery.isLoading)
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="hidden w-64 border-r bg-white lg:block" />
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-72" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  if (!userQuery.data) return null;
  const user = userQuery.data;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur lg:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Mở menu"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Điều hướng</SheetTitle>
              </SheetHeader>
              <Brand />
              <Navigation user={user} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 bg-slate-50 pl-9"
              placeholder="Tìm nhanh chức năng..."
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">
                {user.fullName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {roleLabels[user.role]}
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden border-emerald-200 bg-emerald-50 text-emerald-700 xl:flex"
            >
              {user.role}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đăng xuất"
              onClick={() => {
                clearToken();
                router.replace("/login");
              }}
            >
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
