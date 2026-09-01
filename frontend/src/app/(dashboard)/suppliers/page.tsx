"use client";
import { Truck } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const schema = z.object({
  code: z.string().min(2, "Mã là bắt buộc."),
  name: z.string().min(2, "Tên là bắt buộc."),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([z.literal(""), z.string().email("Email không hợp lệ.")])
    .optional(),
  address: z.string().optional(),
  taxCode: z.string().optional(),
  status: z.string().optional(),
});
export default function SuppliersPage() {
  return (
    <ResourcePage
      config={{
        title: "Nhà cung cấp",
        description:
          "Quản lý đối tác cung ứng thiết bị và vật tư điện mặt trời.",
        singular: "nhà cung cấp",
        endpoint: "/suppliers",
        icon: Truck,
        schema,
        allowDelete: true,
        fields: [
          { name: "code", label: "Mã nhà cung cấp", required: true },
          { name: "name", label: "Tên nhà cung cấp", required: true },
          { name: "contactName", label: "Người liên hệ" },
          { name: "phone", label: "Số điện thoại" },
          { name: "email", label: "Email", type: "email" },
          { name: "taxCode", label: "Mã số thuế" },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Đang hoạt động" },
              { value: "INACTIVE", label: "Ngừng hoạt động" },
            ],
          },
          { name: "address", label: "Địa chỉ", type: "textarea" },
        ],
        columns: [
          { key: "code", label: "Mã" },
          { key: "name", label: "Nhà cung cấp" },
          { key: "contactName", label: "Liên hệ" },
          { key: "phone", label: "Điện thoại" },
          { key: "email", label: "Email" },
          { key: "status", label: "Trạng thái", format: "status" },
        ],
      }}
    />
  );
}
