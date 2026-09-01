"use client";
import { useQuery } from "@tanstack/react-query";
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  MoveDownLeft,
  MoveUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { api, errorMessage } from "@/lib/api";
interface Valuation {
  id: string;
  quantity: number;
  value: number;
  product: { sku: string; name: string; unit: string; costPrice: number };
  warehouse: { code: string; name: string };
}
interface Movement {
  id: string;
  transactionCount: number;
  quantity: number;
  absoluteQuantity: number;
}
const money = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
export default function ReportsPage() {
  const valuation = useQuery({
    queryKey: ["reports", "valuation"],
    queryFn: () =>
      api.get<Valuation[]>("/reports/inventory-valuation").then((r) => r.data),
  });
  const movement = useQuery({
    queryKey: ["reports", "movements"],
    queryFn: () =>
      api.get<Movement[]>("/reports/stock-movements").then((r) => r.data),
  });
  const totalValue =
    valuation.data?.reduce((sum, row) => sum + row.value, 0) ?? 0;
  const totalQuantity =
    valuation.data?.reduce((sum, row) => sum + row.quantity, 0) ?? 0;
  return (
    <>
      <PageHeader
        title="Báo cáo thống kê"
        description="Giá trị tồn kho và tổng hợp biến động dựa trên dữ liệu giao dịch thực tế."
        icon={ChartNoAxesCombined}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="p-5">
            <CircleDollarSign className="size-5 text-emerald-600" />
            <p className="mt-4 text-2xl font-bold">{money(totalValue)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng giá trị tồn kho
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-5">
            <MoveUpRight className="size-5 text-emerald-600" />
            <p className="mt-4 text-2xl font-bold">
              {new Intl.NumberFormat("vi-VN").format(totalQuantity)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng số lượng thiết bị
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-5">
            <MoveDownLeft className="size-5 text-slate-600" />
            <p className="mt-4 text-2xl font-bold">
              {valuation.data?.length ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dòng tồn theo kho
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_0.8fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Chi tiết định giá tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kho</TableHead>
                  <TableHead>SKU / Sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Giá vốn</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuation.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-48 w-full" />
                    </TableCell>
                  </TableRow>
                ) : valuation.isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-destructive"
                    >
                      {errorMessage(valuation.error)}
                    </TableCell>
                  </TableRow>
                ) : (
                  valuation.data?.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.warehouse.name}</TableCell>
                      <TableCell>
                        <p className="font-medium">{row.product.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {row.product.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.quantity} {row.product.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {money(row.product.costPrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {money(row.value)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Tổng hợp biến động</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movement.data?.map((row) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <StatusBadge value={row.id} />
                  <span className="text-sm text-muted-foreground">
                    {row.transactionCount} giao dịch
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold">
                  {new Intl.NumberFormat("vi-VN").format(row.absoluteQuantity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tổng lượng biến động tuyệt đối
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
