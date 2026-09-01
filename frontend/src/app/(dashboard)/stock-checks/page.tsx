"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { api, errorMessage } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface Option {
  id: string;
  code: string;
  name: string;
}
interface InventoryOption {
  id: string;
  quantity: number;
  product: { id: string; sku: string; name: string; unit: string };
}
interface CheckRow {
  id: string;
  code: string;
  checkDate: string;
  status: string;
  items: { difference: number }[];
  warehouseId: Option;
  createdBy?: { fullName: string };
}
interface Values {
  warehouseId: string;
  date: string;
  note: string;
  items: { productId: string; actualQuantity: string }[];
}
const schema = z.object({
  warehouseId: z.string().min(1, "Hãy chọn kho."),
  date: z.string().min(1, "Ngày kiểm kê là bắt buộc."),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Hãy chọn sản phẩm."),
        actualQuantity: z
          .string()
          .refine(
            (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
            "Số thực tế phải là số không âm.",
          ),
      }),
    )
    .min(1),
});
const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";

export default function StockChecksPage() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AuthUser>(["auth", "me"]);
  const canWrite = currentUser?.role !== "STAFF";
  const [open, setOpen] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: {
      warehouseId: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      items: [{ productId: "", actualQuantity: "0" }],
    },
  });
  const rows = useFieldArray({ control: form.control, name: "items" });
  const warehouseId = useWatch({ control: form.control, name: "warehouseId" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const checks = useQuery({
    queryKey: ["stock-checks"],
    queryFn: () => api.get<CheckRow[]>("/stock-checks?page=1&limit=50"),
  });
  const warehouses = useQuery({
    queryKey: ["options", "warehouses"],
    queryFn: () =>
      api
        .get<Option[]>("/warehouses?page=1&limit=100&status=ACTIVE")
        .then((r) => r.data),
  });
  const inventory = useQuery({
    queryKey: ["check-inventory", warehouseId],
    queryFn: () =>
      api
        .get<InventoryOption[]>(
          `/inventory?warehouseId=${warehouseId}&page=1&limit=100`,
        )
        .then((r) => r.data),
    enabled: Boolean(warehouseId),
  });
  const create = useMutation({
    mutationFn: (values: Values) =>
      api.post<CheckRow>("/stock-checks", {
        warehouseId: values.warehouseId,
        checkDate: new Date(values.date).toISOString(),
        note: values.note || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          actualQuantity: Number(item.actualQuantity),
        })),
      }),
    onSuccess: () => {
      toast.success("Đã lập phiếu kiểm kê nháp.");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["stock-checks"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const action = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "confirm" | "cancel";
    }) => api.patch(`/stock-checks/${id}/${action}`),
    onSuccess: (_, value) => {
      toast.success(
        value.action === "confirm"
          ? "Đã điều chỉnh tồn kho theo kiểm kê."
          : "Đã hủy phiếu kiểm kê.",
      );
      void queryClient.invalidateQueries({ queryKey: ["stock-checks"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const openForm = () => {
    form.reset({
      warehouseId: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      items: [{ productId: "", actualQuantity: "0" }],
    });
    setOpen(true);
  };
  const submit = form.handleSubmit((values) => {
    if (
      new Set(values.items.map((i) => i.productId)).size !== values.items.length
    ) {
      toast.error("Một sản phẩm không được lặp lại.");
      return;
    }
    create.mutate(values);
  });
  return (
    <>
      <PageHeader
        title="Kiểm kê kho"
        description="Ghi nhận số lượng hệ thống, số thực tế và điều chỉnh bằng giao dịch ADJUSTMENT có khóa phiên bản."
        icon={ClipboardCheck}
        actions={
          canWrite ? (
            <Button onClick={openForm}>
              <Plus />
              Lập phiếu kiểm kê
            </Button>
          ) : undefined
        }
      />
      <Card className="shadow-none">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phiếu</TableHead>
                <TableHead>Ngày kiểm kê</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead className="text-right">Số dòng</TableHead>
                <TableHead className="text-right">Có chênh lệch</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người lập</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.isLoading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : checks.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-14 text-center text-destructive"
                  >
                    {errorMessage(checks.error)}
                  </TableCell>
                </TableRow>
              ) : (
                checks.data?.data.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {check.code}
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(check.checkDate),
                      )}
                    </TableCell>
                    <TableCell>{check.warehouseId?.name}</TableCell>
                    <TableCell className="text-right">
                      {check.items.length}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">
                      {
                        check.items.filter((item) => item.difference !== 0)
                          .length
                      }
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={check.status} />
                    </TableCell>
                    <TableCell>{check.createdBy?.fullName}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canWrite && check.status === "DRAFT" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                action.mutate({
                                  id: check.id,
                                  action: "confirm",
                                })
                              }
                            >
                              Xác nhận
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                action.mutate({
                                  id: check.id,
                                  action: "cancel",
                                })
                              }
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lập phiếu kiểm kê</DialogTitle>
            <DialogDescription>
              Danh sách sản phẩm được lấy từ tồn kho hiện tại của kho đã chọn.
            </DialogDescription>
          </DialogHeader>
          <form id="check-form" onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kho *</Label>
                <select
                  className={selectClass}
                  {...form.register("warehouseId")}
                >
                  <option value="">Chọn kho</option>
                  {warehouses.data?.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} · {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ngày kiểm kê *</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>
            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold">Kết quả kiểm đếm</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!warehouseId}
                  onClick={() =>
                    rows.append({ productId: "", actualQuantity: "0" })
                  }
                >
                  <Plus />
                  Thêm dòng
                </Button>
              </div>
              <div className="space-y-3 p-4">
                {rows.fields.map((field, index) => {
                  const selected = inventory.data?.find(
                    (item) =>
                      item.product.id === watchedItems?.[index]?.productId,
                  );
                  return (
                    <div
                      key={field.id}
                      className="grid items-end gap-3 md:grid-cols-[1fr_150px_150px_36px]"
                    >
                      <div className="space-y-2">
                        <Label>Sản phẩm *</Label>
                        <select
                          className={selectClass}
                          {...form.register(`items.${index}.productId`)}
                        >
                          <option value="">Chọn sản phẩm trong kho</option>
                          {inventory.data?.map((item) => (
                            <option
                              key={item.product.id}
                              value={item.product.id}
                            >
                              {item.product.sku} · {item.product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Số hệ thống</Label>
                        <Input
                          disabled
                          value={
                            selected
                              ? `${selected.quantity} ${selected.product.unit}`
                              : "—"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số thực tế *</Label>
                        <Input
                          type="number"
                          min="0"
                          {...form.register(`items.${index}.actualQuantity`)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={rows.fields.length === 1}
                        onClick={() => rows.remove(index)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                {...form.register("note")}
                placeholder="Lý do hoặc biên bản kiểm kê liên quan..."
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="check-form" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />}Lưu
              phiếu nháp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
