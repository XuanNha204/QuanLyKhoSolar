"use client";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
interface Tx {
  id: string;
  type: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: string;
  referenceId: string;
  note?: string;
  createdAt: string;
  product: { sku: string; name: string; unit: string };
  warehouse: { code: string; name: string };
  creator?: { fullName: string };
}
export default function TransactionsPage() {
  const query = useQuery({
    queryKey: ["inventory-transactions"],
    queryFn: () => api.get<Tx[]>("/inventory-transactions?page=1&limit=100"),
  });
  return (
    <>
      <PageHeader
        title="Lịch sử giao dịch kho"
        description="Sổ cái bất biến giúp truy vết thiết bị, người thao tác và phiếu nguồn."
        icon={History}
      />
      <Card className="shadow-none">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Kho</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Biến động</TableHead>
                <TableHead className="text-right">Trước → Sau</TableHead>
                <TableHead>Người thực hiện</TableHead>
                <TableHead>Tham chiếu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : query.isError ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-14 text-center text-destructive"
                  >
                    {errorMessage(query.error)}
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.data.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(tx.createdAt))}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{tx.product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {tx.product.sku}
                      </p>
                    </TableCell>
                    <TableCell>{tx.warehouse.name}</TableCell>
                    <TableCell>
                      <StatusBadge value={tx.type} />
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${tx.quantity > 0 ? "text-emerald-600" : "text-slate-700"}`}
                    >
                      {tx.quantity > 0 ? "+" : ""}
                      {tx.quantity} {tx.product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.previousQuantity} → {tx.newQuantity}
                    </TableCell>
                    <TableCell>{tx.creator?.fullName ?? "—"}</TableCell>
                    <TableCell>
                      <p className="text-xs font-medium">{tx.referenceType}</p>
                      <p className="max-w-24 truncate font-mono text-[10px] text-muted-foreground">
                        {tx.referenceId}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
