import { Badge } from "@/components/ui/badge";
const labels: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  DRAFT: "Bản nháp",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  PLANNED: "Kế hoạch",
  IN_PROGRESS: "Đang thi công",
  COMPLETED: "Hoàn thành",
  ADMIN: "Quản trị",
  WAREHOUSE_MANAGER: "Quản lý kho",
  STAFF: "Nhân viên",
  IMPORT: "Nhập kho",
  EXPORT: "Xuất kho",
  ADJUSTMENT: "Điều chỉnh",
};
export function StatusBadge({ value }: { value: string }) {
  const positive = ["ACTIVE", "CONFIRMED", "COMPLETED", "IMPORT"].includes(
    value,
  );
  const warning = ["DRAFT", "PLANNED", "IN_PROGRESS", "ADJUSTMENT"].includes(
    value,
  );
  return (
    <Badge
      variant="outline"
      className={
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : warning
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-600"
      }
    >
      {labels[value] ?? value}
    </Badge>
  );
}
