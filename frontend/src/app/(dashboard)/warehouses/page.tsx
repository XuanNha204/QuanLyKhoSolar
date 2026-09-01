"use client";
import { Warehouse } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const schema = z.object({
  code: z.string().min(2, "Mã là bắt buộc."),
  name: z.string().min(2, "Tên là bắt buộc."),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});
export default function WarehousesPage() {
  return (
    <ResourcePage
      config={{
        title: "Kho hàng",
        description:
          "Quản lý các địa điểm lưu trữ thiết bị trên toàn hệ thống.",
        singular: "kho",
        endpoint: "/warehouses",
        icon: Warehouse,
        schema,
        allowDelete: true,
        fields: [
          { name: "code", label: "Mã kho", required: true },
          { name: "name", label: "Tên kho", required: true },
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
          { name: "description", label: "Mô tả", type: "textarea" },
        ],
        columns: [
          { key: "code", label: "Mã kho" },
          { key: "name", label: "Tên kho" },
          { key: "address", label: "Địa chỉ" },
          { key: "status", label: "Trạng thái", format: "status" },
        ],
      }}
    />
  );
}
