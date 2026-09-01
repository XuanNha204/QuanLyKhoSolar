"use client";
import { Tags } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const schema = z.object({
  code: z
    .string()
    .min(2, "Mã tối thiểu 2 ký tự.")
    .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ gồm chữ, số, gạch nối."),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự."),
  description: z.string().optional(),
  status: z.string().optional(),
});
export default function CategoriesPage() {
  return (
    <ResourcePage
      config={{
        title: "Danh mục thiết bị",
        description:
          "Phân nhóm tấm pin, biến tần, pin lưu trữ và vật tư Solar.",
        singular: "danh mục",
        endpoint: "/categories",
        icon: Tags,
        schema,
        allowDelete: true,
        fields: [
          { name: "code", label: "Mã danh mục", required: true },
          { name: "name", label: "Tên danh mục", required: true },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "ACTIVE", label: "Đang hoạt động" },
              { value: "INACTIVE", label: "Ngừng hoạt động" },
            ],
          },
          { name: "description", label: "Mô tả", type: "textarea" },
        ],
        columns: [
          { key: "code", label: "Mã" },
          { key: "name", label: "Tên danh mục" },
          { key: "description", label: "Mô tả" },
          { key: "status", label: "Trạng thái", format: "status" },
        ],
      }}
    />
  );
}
