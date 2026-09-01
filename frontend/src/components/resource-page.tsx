"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
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
import { api, errorMessage } from "@/lib/api";
import type { ApiMeta, AuthUser, EntityRecord } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { LucideIcon } from "lucide-react";

type Values = Record<string, string>;
export interface SelectOption {
  value: string;
  label: string;
}
export interface ResourceField {
  name: string;
  label: string;
  type?:
    "text" | "email" | "password" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  optionsPath?: string;
  optionLabel?: string;
  createOnly?: boolean;
}
export interface ResourceColumn {
  key: string;
  label: string;
  format?: "status" | "currency" | "date" | "number";
}
export interface ResourceConfig {
  title: string;
  description: string;
  singular: string;
  endpoint: string;
  icon: LucideIcon;
  schema: z.ZodType<unknown>;
  fields: ResourceField[];
  columns: ResourceColumn[];
  allowDelete?: boolean;
  allowEdit?: boolean;
}

function nestedValue(row: EntityRecord, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      row,
    );
}
function displayValue(value: unknown, format?: ResourceColumn["format"]) {
  if (value === undefined || value === null || value === "")
    return <span className="text-muted-foreground">—</span>;
  if (format === "status") return <StatusBadge value={String(value)} />;
  if (format === "currency")
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value));
  if (format === "number")
    return new Intl.NumberFormat("vi-VN").format(Number(value));
  if (format === "date")
    return new Intl.DateTimeFormat("vi-VN").format(new Date(String(value)));
  return String(value);
}

function ReferenceSelect({
  field,
  register,
}: {
  field: ResourceField;
  register: ReturnType<typeof useForm<Values>>["register"];
}) {
  const query = useQuery({
    queryKey: ["options", field.optionsPath],
    queryFn: () => {
      const separator = field.optionsPath?.includes("?") ? "&" : "?";
      return api
        .get<EntityRecord[]>(`${field.optionsPath}${separator}page=1&limit=100`)
        .then((r) => r.data);
    },
    enabled: Boolean(field.optionsPath),
  });
  const options =
    field.options ??
    query.data?.map((item) => ({
      value: item.id,
      label: String(nestedValue(item, field.optionLabel ?? "name") ?? item.id),
    })) ??
    [];
  return (
    <select
      id={field.name}
      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      {...register(field.name)}
    >
      <option value="">Chọn {field.label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ResourcePage({ config }: { config: ResourceConfig }) {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<AuthUser>(["auth", "me"]);
  const canWrite = currentUser?.role !== "STAFF";
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EntityRecord | null>(null);
  const resolverSchema = config.schema as z.ZodType<
    Values,
    z.ZodTypeDef,
    Values
  >;
  const form = useForm<Values>({
    resolver: zodResolver(resolverSchema) as Resolver<Values>,
  });
  const list = useQuery({
    queryKey: [config.endpoint, page, search],
    queryFn: () =>
      api.get<EntityRecord[]>(
        `${config.endpoint}?page=${page}&limit=10&search=${encodeURIComponent(search)}`,
      ),
  });
  const save = useMutation({
    mutationFn: (values: Values) => {
      const payload: Record<string, unknown> = {};
      for (const field of config.fields) {
        const value = values[field.name];
        if (
          value === "" ||
          value === undefined ||
          (editing && field.createOnly)
        )
          continue;
        payload[field.name] =
          field.type === "number"
            ? Number(value)
            : field.type === "date"
              ? new Date(value).toISOString()
              : value;
      }
      return editing
        ? api.patch(`${config.endpoint}/${editing.id}`, payload)
        : api.post(config.endpoint, payload);
    },
    onSuccess: () => {
      toast.success(
        editing
          ? `Đã cập nhật ${config.singular}.`
          : `Đã tạo ${config.singular}.`,
      );
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: [config.endpoint] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${config.endpoint}/${id}`),
    onSuccess: () => {
      toast.success(`Đã ngừng hoạt động ${config.singular}.`);
      void queryClient.invalidateQueries({ queryKey: [config.endpoint] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const beginCreate = () => {
    setEditing(null);
    form.reset(
      Object.fromEntries(config.fields.map((field) => [field.name, ""])),
    );
    setOpen(true);
  };
  const beginEdit = (row: EntityRecord) => {
    setEditing(row);
    const values: Values = {};
    for (const field of config.fields) {
      const raw = nestedValue(row, field.name);
      const optionValue =
        raw && typeof raw === "object" && "id" in raw
          ? String((raw as { id: unknown }).id)
          : raw;
      values[field.name] =
        field.type === "date" && optionValue
          ? new Date(String(optionValue)).toISOString().slice(0, 10)
          : optionValue === undefined || optionValue === null
            ? ""
            : String(optionValue);
    }
    form.reset(values);
    setOpen(true);
  };
  const meta = list.data?.meta as ApiMeta | undefined;
  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        actions={
          canWrite ? (
            <Button onClick={beginCreate}>
              <Plus />
              Thêm {config.singular}
            </Button>
          ) : undefined
        }
      />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <form
              className="relative max-w-sm flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setSearch(draftSearch);
              }}
            >
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                className="pl-9"
                placeholder={`Tìm kiếm ${config.singular}...`}
              />
            </form>
            <div className="text-sm text-muted-foreground sm:self-center">
              {meta ? `${meta.total} bản ghi` : "Đang tải dữ liệu"}
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isLoading ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={index}>
                      {config.columns.map((column) => (
                        <TableCell key={column.key}>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                      ))}
                      <TableCell />
                    </TableRow>
                  ))
                ) : list.isError ? (
                  <TableRow>
                    <TableCell colSpan={config.columns.length + 1}>
                      <div className="flex items-center justify-center gap-2 py-12 text-sm text-destructive">
                        <AlertCircle className="size-4" />
                        {errorMessage(list.error)}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : list.data?.data.length ? (
                  list.data.data.map((row) => (
                    <TableRow key={row.id}>
                      {config.columns.map((column) => (
                        <TableCell key={column.key} className="max-w-72">
                          {displayValue(
                            nestedValue(row, column.key),
                            column.format,
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {canWrite && config.allowEdit !== false && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Sửa"
                              onClick={() => beginEdit(row)}
                            >
                              <Pencil />
                            </Button>
                          )}
                          {canWrite && config.allowDelete && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Ngừng hoạt động"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Ngừng hoạt động ${config.singular} này?`,
                                  )
                                )
                                  remove.mutate(row.id);
                              }}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={config.columns.length + 1}>
                      <div className="py-14 text-center">
                        <p className="font-medium">Chưa có dữ liệu</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tạo {config.singular} đầu tiên để bắt đầu.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-xs text-muted-foreground">
              Trang {meta?.page ?? page} / {meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta || page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật" : "Thêm"} {config.singular}
            </DialogTitle>
            <DialogDescription>
              Dữ liệu được kiểm tra ở cả giao diện và máy chủ.
            </DialogDescription>
          </DialogHeader>
          <form
            id="resource-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
          >
            {config.fields
              .filter((field) => !(editing && field.createOnly))
              .map((field) => (
                <div
                  key={field.name}
                  className={
                    field.type === "textarea"
                      ? "space-y-2 sm:col-span-2"
                      : "space-y-2"
                  }
                >
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  {field.type === "select" ? (
                    <ReferenceSelect field={field} register={form.register} />
                  ) : field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      {...form.register(field.name)}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type ?? "text"}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.placeholder}
                      {...form.register(field.name)}
                    />
                  )}
                  {form.formState.errors[field.name] && (
                    <p className="text-xs text-destructive">
                      {String(form.formState.errors[field.name]?.message)}
                    </p>
                  )}
                </div>
              ))}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="resource-form"
              disabled={save.isPending}
            >
              {save.isPending && <Loader2 className="animate-spin" />}Lưu dữ
              liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
