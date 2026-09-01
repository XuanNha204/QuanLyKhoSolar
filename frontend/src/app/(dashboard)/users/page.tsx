"use client";
import { Users } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const schema = z.object({
  email: z.string().email("Email không hợp lệ."),
  fullName: z.string().min(2, "Họ tên là bắt buộc."),
  role: z.string().min(1, "Vai trò là bắt buộc."),
  password: z.union([
    z.literal(""),
    z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự.")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Cần chữ hoa, chữ thường và chữ số.",
      ),
  ]),
  status: z.string().optional(),
});
export default function UsersPage() {
  return (
    <ResourcePage
      config={{
        title: "Người dùng",
        description:
          "Quản lý tài khoản và vai trò truy cập; quyền luôn được kiểm tra tại backend.",
        singular: "người dùng",
        endpoint: "/users",
        icon: Users,
        schema,
        allowDelete: false,
        fields: [
          { name: "email", label: "Email", type: "email", required: true },
          { name: "fullName", label: "Họ và tên", required: true },
          {
            name: "role",
            label: "Vai trò",
            type: "select",
            required: true,
            options: [
              { value: "ADMIN", label: "Quản trị viên" },
              { value: "WAREHOUSE_MANAGER", label: "Quản lý kho" },
              { value: "STAFF", label: "Nhân viên" },
            ],
          },
          {
            name: "password",
            label: "Mật khẩu ban đầu",
            type: "password",
            required: true,
            createOnly: true,
          },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Đang hoạt động" },
              { value: "INACTIVE", label: "Ngừng hoạt động" },
            ],
          },
        ],
        columns: [
          { key: "fullName", label: "Họ tên" },
          { key: "email", label: "Email" },
          { key: "role", label: "Vai trò", format: "status" },
          { key: "status", label: "Trạng thái", format: "status" },
          { key: "lastLoginAt", label: "Đăng nhập gần nhất", format: "date" },
        ],
      }}
    />
  );
}
