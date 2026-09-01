"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LockKeyhole, Mail, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự."),
});
type LoginInput = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@solar.local", password: "Admin@123" },
  });
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);
  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await api.post<{ accessToken: string; user: AuthUser }>(
        "/auth/login",
        values,
      );
      setToken(result.data.accessToken);
      toast.success(`Xin chào ${result.data.user.fullName}`);
      router.replace("/dashboard");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.18),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,.1),transparent_35%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500">
            <Zap />
          </div>
          <div>
            <p className="font-bold tracking-wide">SOLAR INVENTORY</p>
            <p className="text-xs text-slate-400">
              Hệ thống quản lý kho năng lượng mặt trời
            </p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Vận hành minh bạch
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Kiểm soát thiết bị từ kho đến từng công trình.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Theo dõi nhập, xuất, kiểm kê và lịch sử biến động trong một quy
            trình nghiệp vụ nhất quán.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">
          Local demonstration · MongoDB transaction · NestJS + Next.js
        </p>
      </section>
      <section className="flex items-center justify-center bg-slate-50 p-5 sm:p-10">
        <Card className="w-full max-w-md border-slate-200 shadow-none">
          <CardHeader className="space-y-2 pb-5">
            <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white lg:hidden">
              <Zap />
            </div>
            <CardTitle className="text-2xl">Đăng nhập hệ thống</CardTitle>
            <CardDescription>
              Sử dụng tài khoản được cấp để truy cập khu vực quản lý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    autoComplete="email"
                    className="h-10 pl-9"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="h-10 pl-9"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="h-10 w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="animate-spin" />
                )}
                Đăng nhập
              </Button>
              <div className="rounded-lg border bg-slate-50 p-3 text-xs leading-5 text-muted-foreground">
                <p>
                  <strong className="text-slate-700">Tài khoản demo:</strong>{" "}
                  admin@solar.local
                </p>
                <p>
                  <strong className="text-slate-700">Mật khẩu:</strong>{" "}
                  Admin@123
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
