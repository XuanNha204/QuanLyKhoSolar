"use client";
import { Boxes } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const requiredNumber = (label: string) =>
  z
    .string()
    .min(1, `${label} là bắt buộc.`)
    .refine(
      (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
      `${label} phải là số không âm.`,
    );
const schema = z.object({
  sku: z.string().min(2, "SKU tối thiểu 2 ký tự."),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự."),
  categoryId: z.string().min(1, "Hãy chọn danh mục."),
  brand: z.string().optional(),
  model: z.string().optional(),
  unit: z.string().min(1, "Đơn vị là bắt buộc."),
  costPrice: requiredNumber("Giá vốn"),
  minStock: requiredNumber("Tồn tối thiểu"),
  warrantyMonths: requiredNumber("Bảo hành"),
  description: z.string().optional(),
  imageUrl: z
    .union([z.literal(""), z.string().url("URL hình ảnh không hợp lệ.")])
    .optional(),
  status: z.string().optional(),
});
export default function ProductsPage() {
  return (
    <ResourcePage
      config={{
        title: "Sản phẩm",
        description:
          "Quản lý thông tin kỹ thuật và ngưỡng tồn của thiết bị Solar; tồn kho không lưu tại đây.",
        singular: "sản phẩm",
        endpoint: "/products",
        icon: Boxes,
        schema,
        allowDelete: true,
        fields: [
          { name: "sku", label: "SKU", required: true },
          { name: "name", label: "Tên sản phẩm", required: true },
          {
            name: "categoryId",
            label: "Danh mục",
            type: "select",
            optionsPath: "/categories?status=ACTIVE",
            required: true,
          },
          { name: "brand", label: "Thương hiệu" },
          { name: "model", label: "Model" },
          {
            name: "unit",
            label: "Đơn vị tính",
            required: true,
            placeholder: "tấm, bộ, mét...",
          },
          {
            name: "costPrice",
            label: "Giá vốn (VND)",
            type: "number",
            required: true,
          },
          {
            name: "minStock",
            label: "Tồn tối thiểu",
            type: "number",
            required: true,
          },
          {
            name: "warrantyMonths",
            label: "Bảo hành (tháng)",
            type: "number",
            required: true,
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
          { name: "imageUrl", label: "URL hình ảnh" },
          { name: "description", label: "Mô tả", type: "textarea" },
        ],
        columns: [
          { key: "sku", label: "SKU" },
          { key: "name", label: "Sản phẩm" },
          { key: "categoryId.name", label: "Danh mục" },
          { key: "brand", label: "Thương hiệu" },
          { key: "unit", label: "ĐVT" },
          { key: "costPrice", label: "Giá vốn", format: "currency" },
          { key: "minStock", label: "Tồn tối thiểu", format: "number" },
          { key: "status", label: "Trạng thái", format: "status" },
        ],
      }}
    />
  );
}
