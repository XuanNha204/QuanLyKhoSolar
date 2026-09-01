"use client";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  PackageOpen,
  ReceiptText,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

interface DashboardData {
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalInventoryValue: number;
    lowStockProducts: number;
    receiptsThisMonth: number;
    issuesThisMonth: number;
  };
  monthlyMovement: { month: string; imports: number; exports: number }[];
  categoryDistribution: { id: string; name: string; quantity: number }[];
  lowStock: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    minStock: number;
    totalStock: number;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    quantity: number;
    createdAt: string;
    productId: { sku: string; name: string };
    warehouseId: { name: string };
    createdBy?: { fullName: string };
  }[];
}
const compactMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const count = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const colors = [
  "#059669",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#334155",
  "#14b8a6",
  "#f97316",
];

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard").then((r) => r.data),
    refetchInterval: 60_000,
  });
  if (query.isLoading)
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Tổng quan hoạt động kho Solar theo thời gian thực."
        />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-4 h-80" />
      </>
    );
  if (!query.data)
    return (
      <Card>
        <CardContent className="py-14 text-center text-destructive">
          {errorMessage(query.error)}
        </CardContent>
      </Card>
    );
  const { summary } = query.data;
  const cards = [
    [
      "Tổng sản phẩm",
      count(summary.totalProducts),
      Boxes,
      "SKU đang hoạt động",
    ],
    ["Thiết bị tồn kho", count(summary.totalQuantity), Warehouse, "Tất cả kho"],
    [
      "Giá trị tồn kho",
      compactMoney(summary.totalInventoryValue),
      CircleDollarSign,
      "Theo giá vốn",
    ],
    [
      "Tồn kho thấp",
      count(summary.lowStockProducts),
      AlertTriangle,
      "Cần bổ sung",
    ],
    [
      "Phiếu nhập tháng",
      count(summary.receiptsThisMonth),
      PackageOpen,
      "Đã xác nhận",
    ],
    [
      "Phiếu xuất tháng",
      count(summary.issuesThisMonth),
      ReceiptText,
      "Đã xác nhận",
    ],
  ] as const;
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Tổng quan tồn kho, dòng hàng và các cảnh báo cần xử lý."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value, Icon, note], index) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${index === 3 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>
              <p
                className="mt-4 truncate text-xl font-bold tracking-tight"
                title={value}
              >
                {value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">
              Nhập / xuất trong 6 tháng
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={query.data.monthlyMovement}
                margin={{ left: -20, right: 8 }}
              >
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar
                  isAnimationActive={false}
                  dataKey="imports"
                  name="Nhập"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="exports"
                  name="Xuất"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo danh mục</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={query.data.categoryDistribution}
                  dataKey="quantity"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {query.data.categoryDistribution.map((entry, index) => (
                    <Cell
                      key={entry.id ?? entry.name}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" />
              Sản phẩm tồn thấp
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU / Sản phẩm</TableHead>
                  <TableHead className="text-right">Tồn</TableHead>
                  <TableHead className="text-right">Tối thiểu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.lowStock.length ? (
                  query.data.lowStock.slice(0, 7).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">
                        {item.totalStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.minStock}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-12 text-center text-muted-foreground"
                    >
                      Không có cảnh báo tồn thấp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Giao dịch gần đây</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Biến động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.recentTransactions.slice(0, 7).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.productId?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.warehouseId?.name}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.type} />
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${item.quantity > 0 ? "text-emerald-600" : "text-slate-700"}`}
                    >
                      {item.quantity > 0 ? "+" : ""}
                      {item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
