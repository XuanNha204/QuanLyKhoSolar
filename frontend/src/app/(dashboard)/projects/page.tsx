"use client";
import { FolderKanban } from "lucide-react";
import { z } from "zod";
import { ResourcePage } from "@/components/resource-page";
const schema = z.object({
  code: z.string().min(2, "Mã là bắt buộc."),
  name: z.string().min(2, "Tên là bắt buộc."),
  customerName: z.string().min(2, "Khách hàng là bắt buộc."),
  address: z.string().optional(),
  capacity: z
    .union([
      z.literal(""),
      z.string().refine((v) => Number(v) >= 0, "Công suất phải không âm."),
    ])
    .optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  note: z.string().optional(),
});
export default function ProjectsPage() {
  return (
    <ResourcePage
      config={{
        title: "Công trình",
        description:
          "Theo dõi nơi tiếp nhận thiết bị xuất kho và tiến độ triển khai Solar.",
        singular: "công trình",
        endpoint: "/projects",
        icon: FolderKanban,
        schema,
        allowDelete: true,
        fields: [
          { name: "code", label: "Mã công trình", required: true },
          { name: "name", label: "Tên công trình", required: true },
          { name: "customerName", label: "Khách hàng", required: true },
          { name: "capacity", label: "Công suất (kWp)", type: "number" },
          { name: "startDate", label: "Ngày bắt đầu", type: "date" },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "PLANNED", label: "Kế hoạch" },
              { value: "IN_PROGRESS", label: "Đang thi công" },
              { value: "COMPLETED", label: "Hoàn thành" },
              { value: "CANCELLED", label: "Đã hủy" },
            ],
          },
          { name: "address", label: "Địa chỉ", type: "textarea" },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ],
        columns: [
          { key: "code", label: "Mã" },
          { key: "name", label: "Công trình" },
          { key: "customerName", label: "Khách hàng" },
          { key: "capacity", label: "Công suất", format: "number" },
          { key: "status", label: "Trạng thái", format: "status" },
          { key: "startDate", label: "Khởi công", format: "date" },
        ],
      }}
    />
  );
}
