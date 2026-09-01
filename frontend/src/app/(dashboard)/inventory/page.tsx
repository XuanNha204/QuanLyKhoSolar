"use client";
import { useQuery } from "@tanstack/react-query";
import { Archive, Search } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { api, errorMessage } from "@/lib/api";

interface InventoryRow {
  id: string;
  quantity: number;
  updatedAt: string;
  product: {
    sku: string;
    name: string;
    unit: string;
    minStock: number;
    costPrice: number;
  };
  warehouse: { code: string; name: string };
}
export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const query = useQuery({
    queryKey: ["inventory", queryText],
    queryFn: () =>
      api.get<InventoryRow[]>(
        `/inventory?page=1&limit=100&search=${encodeURIComponent(queryText)}`,
      ),
  });
  return (
    <>
      <PageHeader
        title="Tồn kho"
        description="Số lượng theo từng cặp sản phẩm – kho; Product không chứa quantity."
        icon={Archive}
      />
      <Card className="shadow-none">
        <CardContent className="p-0">
          <form
            className="relative max-w-sm border-b p-4"
            onSubmit={(e) => {
              e.preventDefault();
              setQueryText(search);
            }}
          >
            <Search className="absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm SKU, sản phẩm hoặc kho..."
            />
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Tồn tối thiểu</TableHead>
                  <TableHead className="text-right">Giá trị</TableHead>
                  <TableHead>Cập nhật</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  Array.from({ length: 8 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : query.isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-14 text-center text-destructive"
                    >
                      {errorMessage(query.error)}
                    </TableCell>
                  </TableRow>
                ) : query.data?.data.length ? (
                  query.data.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.product.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.product.name}
                      </TableCell>
                      <TableCell>
                        <p>{row.warehouse.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.warehouse.code}
                        </p>
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${row.quantity <= row.product.minStock ? "text-amber-600" : "text-emerald-700"}`}
                      >
                        {new Intl.NumberFormat("vi-VN").format(row.quantity)}{" "}
                        {row.product.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.product.minStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                          maximumFractionDigits: 0,
                        }).format(row.quantity * row.product.costPrice)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat("vi-VN").format(
                          new Date(row.updatedAt),
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-14 text-center text-muted-foreground"
                    >
                      Chưa có tồn kho. Hãy xác nhận phiếu nhập đầu tiên.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
