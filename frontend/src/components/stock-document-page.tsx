"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageOpen, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
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
  code?: string;
  sku?: string;
  name: string;
  unit?: string;
}
interface DocumentRow {
  id: string;
  code: string;
  status: string;
  receiptDate?: string;
  issueDate?: string;
  totalAmount?: number;
  items: unknown[];
  supplierId?: Option;
  warehouseId: Option;
  projectId?: Option;
  createdBy?: { fullName: string };
}
interface FormValues {
  warehouseId: string;
  partnerId: string;
  date: string;
  note: string;
  items: { productId: string; quantity: string; unitPrice: string }[];
}
const schema = z.object({
  warehouseId: z.string().min(1, "Hãy chọn kho."),
  partnerId: z.string().optional(),
  date: z.string().min(1, "Ngày chứng từ là bắt buộc."),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Hãy chọn sản phẩm."),
        quantity: z
          .string()
          .refine(
            (v) => Number.isInteger(Number(v)) && Number(v) > 0,
            "Số lượng phải lớn hơn 0.",
          ),
        unitPrice: z.string(),
      }),
    )
    .min(1, "Phiếu phải có ít nhất một dòng."),
});

function SelectBox({
  valueProps,
  children,
}: {
  valueProps: React.SelectHTMLAttributes<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <select
      className="flex h-9 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      {...valueProps}
    >
      {children}
    </select>
  );
}

export function StockDocumentPage({ kind }: { kind: "receipt" | "issue" }) {
  const isReceipt = kind === "receipt";
  const endpoint = isReceipt ? "/stock-receipts" : "/stock-issues";
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AuthUser>(["auth", "me"]);
  const canWrite = currentUser?.role !== "STAFF";
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      warehouseId: "",
      partnerId: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      items: [{ productId: "", quantity: "1", unitPrice: "0" }],
    },
  });
  const itemFields = useFieldArray({ control: form.control, name: "items" });
  const documents = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get<DocumentRow[]>(`${endpoint}?page=1&limit=50`),
  });
  const products = useQuery({
    queryKey: ["options", "products"],
    queryFn: () =>
      api
        .get<Option[]>("/products?page=1&limit=100&status=ACTIVE")
        .then((r) => r.data),
  });
  const warehouses = useQuery({
    queryKey: ["options", "warehouses"],
    queryFn: () =>
      api
        .get<Option[]>("/warehouses?page=1&limit=100&status=ACTIVE")
        .then((r) => r.data),
  });
  const partnerPath = isReceipt
    ? "/suppliers?status=ACTIVE&page=1&limit=100"
    : "/projects?page=1&limit=100";
  const partners = useQuery({
    queryKey: ["options", isReceipt ? "suppliers" : "projects"],
    queryFn: () => api.get<Option[]>(partnerPath).then((r) => r.data),
  });
  const create = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Record<string, unknown> = {
        warehouseId: values.warehouseId,
        [isReceipt ? "supplierId" : "projectId"]: values.partnerId || undefined,
        [isReceipt ? "receiptDate" : "issueDate"]: new Date(
          values.date,
        ).toISOString(),
        note: values.note || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          ...(isReceipt ? { unitPrice: Number(item.unitPrice) } : {}),
        })),
      };
      return api.post<DocumentRow>(endpoint, payload);
    },
    onSuccess: () => {
      toast.success(`Đã lập phiếu ${isReceipt ? "nhập" : "xuất"} nháp.`);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
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
    }) => api.patch(`${endpoint}/${id}/${action}`),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "confirm"
          ? "Đã xác nhận và cập nhật tồn kho."
          : "Đã hủy phiếu nháp.",
      );
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const resetForm = () => {
    form.reset({
      warehouseId: "",
      partnerId: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      items: [{ productId: "", quantity: "1", unitPrice: "0" }],
    });
    setOpen(true);
  };
  const submit = form.handleSubmit((values) => {
    if (isReceipt && !values.partnerId) {
      form.setError("partnerId", { message: "Hãy chọn nhà cung cấp." });
      return;
    }
    if (
      isReceipt &&
      values.items.some(
        (item) => Number(item.unitPrice) < 0 || item.unitPrice === "",
      )
    ) {
      toast.error("Đơn giá phải là số không âm.");
      return;
    }
    if (
      new Set(values.items.map((item) => item.productId)).size !==
      values.items.length
    ) {
      toast.error("Một sản phẩm không được lặp lại trong phiếu.");
      return;
    }
    create.mutate(values);
  });
  const title = isReceipt ? "Phiếu nhập kho" : "Phiếu xuất kho";
  const Icon = isReceipt ? PackageOpen : ReceiptText;
  return (
    <>
      <PageHeader
        title={title}
        description={
          isReceipt
            ? "Lập và xác nhận phiếu nhập từ nhà cung cấp; tồn kho và lịch sử được cập nhật trong một transaction."
            : "Xuất thiết bị cho công trình; backend kiểm tra tồn và chặn số dư âm."
        }
        icon={Icon}
        actions={
          canWrite ? (
            <Button onClick={resetForm}>
              <Plus />
              Lập phiếu {isReceipt ? "nhập" : "xuất"}
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
                <TableHead>Ngày</TableHead>
                <TableHead>
                  {isReceipt ? "Nhà cung cấp" : "Công trình"}
                </TableHead>
                <TableHead>Kho</TableHead>
                <TableHead className="text-right">Số dòng</TableHead>
                {isReceipt && (
                  <TableHead className="text-right">Tổng tiền</TableHead>
                )}
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người lập</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.isLoading ? (
                Array.from({ length: 7 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : documents.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-14 text-center text-destructive"
                  >
                    {errorMessage(documents.error)}
                  </TableCell>
                </TableRow>
              ) : documents.data?.data.length ? (
                documents.data.data.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {doc.code}
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("vi-VN").format(
                        new Date(doc.receiptDate ?? doc.issueDate ?? ""),
                      )}
                    </TableCell>
                    <TableCell>
                      {isReceipt
                        ? doc.supplierId?.name
                        : (doc.projectId?.name ?? "Xuất nội bộ")}
                    </TableCell>
                    <TableCell>{doc.warehouseId?.name}</TableCell>
                    <TableCell className="text-right">
                      {doc.items.length}
                    </TableCell>
                    {isReceipt && (
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(doc.totalAmount ?? 0)}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge value={doc.status} />
                    </TableCell>
                    <TableCell>{doc.createdBy?.fullName}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canWrite && doc.status === "DRAFT" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                action.mutate({ id: doc.id, action: "confirm" })
                              }
                              disabled={action.isPending}
                            >
                              Xác nhận
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                action.mutate({ id: doc.id, action: "cancel" })
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
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-14 text-center text-muted-foreground"
                  >
                    Chưa có phiếu {isReceipt ? "nhập" : "xuất"}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Lập {title.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Phiếu được lưu nháp trước khi xác nhận thay đổi tồn kho.
            </DialogDescription>
          </DialogHeader>
          <form
            id="stock-document-form"
            onSubmit={submit}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kho *</Label>
                <SelectBox valueProps={form.register("warehouseId")}>
                  <option value="">Chọn kho</option>
                  {warehouses.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </SelectBox>
                {form.formState.errors.warehouseId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.warehouseId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{isReceipt ? "Nhà cung cấp *" : "Công trình"}</Label>
                <SelectBox valueProps={form.register("partnerId")}>
                  <option value="">
                    {isReceipt
                      ? "Chọn nhà cung cấp"
                      : "Xuất không gắn công trình"}
                  </option>
                  {partners.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </SelectBox>
                {form.formState.errors.partnerId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.partnerId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Ngày chứng từ *</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>
            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold">Dòng sản phẩm</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    itemFields.append({
                      productId: "",
                      quantity: "1",
                      unitPrice: "0",
                    })
                  }
                >
                  <Plus />
                  Thêm dòng
                </Button>
              </div>
              <div className="space-y-3 p-4">
                {itemFields.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`grid items-end gap-3 ${isReceipt ? "md:grid-cols-[1fr_130px_170px_36px]" : "md:grid-cols-[1fr_150px_36px]"}`}
                  >
                    <div className="space-y-2">
                      <Label>Sản phẩm *</Label>
                      <SelectBox
                        valueProps={form.register(`items.${index}.productId`)}
                      >
                        <option value="">Chọn sản phẩm</option>
                        {products.data?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku} · {item.name}
                          </option>
                        ))}
                      </SelectBox>
                    </div>
                    <div className="space-y-2">
                      <Label>Số lượng *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...form.register(`items.${index}.quantity`)}
                      />
                    </div>
                    {isReceipt && (
                      <div className="space-y-2">
                        <Label>Đơn giá (VND) *</Label>
                        <Input
                          type="number"
                          min="0"
                          {...form.register(`items.${index}.unitPrice`)}
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Xóa dòng"
                      disabled={itemFields.fields.length === 1}
                      onClick={() => itemFields.remove(index)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                {...form.register("note")}
                placeholder="Số hóa đơn, phương tiện giao nhận hoặc nội dung liên quan..."
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="stock-document-form"
              disabled={create.isPending}
            >
              {create.isPending && <Loader2 className="animate-spin" />}Lưu
              phiếu nháp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
