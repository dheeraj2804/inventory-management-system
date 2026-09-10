"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";

type SaleItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  unitCostAtSale: number;
  subtotal: number;
  profit: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: string;
  } | null;
};

type Sale = {
  id: number;
  customerName?: string | null;
  totalAmount: number;
  saleDate?: string;
  createdAt?: string;
  createdBy?: number | null;
  items?: SaleItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales");
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const customerOptions = useMemo(() => {
    const names = new Set<string>();

    sales.forEach((sale) => {
      const customer = sale.customerName?.trim();
      if (customer) names.add(customer);
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [sales]);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return sales.filter((sale) => {
      const saleId = String(sale.id);
      const customerName = (sale.customerName || "Walk-in Customer").toLowerCase();
      const itemNames =
        sale.items?.map((item) => item.product?.name || "").join(" ").toLowerCase() || "";
      const itemSkus =
        sale.items?.map((item) => item.product?.sku || "").join(" ").toLowerCase() || "";

      const matchesSearch =
        !term ||
        saleId.includes(term) ||
        customerName.includes(term) ||
        itemNames.includes(term) ||
        itemSkus.includes(term);

      const matchesCustomer = customerFilter
        ? (sale.customerName || "Walk-in Customer") === customerFilter
        : true;

      return matchesSearch && matchesCustomer;
    });
  }, [sales, searchTerm, customerFilter]);

  const summary = useMemo(() => {
    const totalRecords = filteredSales.length;

    const totalAmount = filteredSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount || 0),
      0
    );

    const totalUnits = filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.items?.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0) || 0),
      0
    );

    const totalProfit = filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.items?.reduce((itemSum, item) => itemSum + Number(item.profit || 0), 0) || 0),
      0
    );

    return {
      totalRecords,
      totalAmount,
      totalUnits,
      totalProfit,
    };
  }, [filteredSales]);

  const exportCSV = () => {
    const headers = [
      "Sale ID",
      "Customer",
      "Date",
      "Total Amount",
      "Total Profit",
      "Created By",
      "Item Count",
      "Products",
    ];

    const rows = filteredSales.map((sale) => [
      sale.id,
      sale.customerName || "Walk-in Customer",
      formatDateTime(sale.saleDate || sale.createdAt),
      sale.totalAmount ?? 0,
      sale.items?.reduce((sum, item) => sum + Number(item.profit || 0), 0) ?? 0,
      sale.createdBy ?? "-",
      sale.items?.length ?? 0,
      sale.items?.map((item) => `${item.product?.name || "-"} (${item.quantity})`).join(" | ") ??
        "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sales_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading sales history...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Sales History</h1>
          <p className="mt-2 text-zinc-400">
            Review all sales transactions and drill into sold items and profit.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard label="Total Sales" value={String(summary.totalRecords)} />
          <SummaryCard label="Total Units Sold" value={String(summary.totalUnits)} />
          <SummaryCard label="Total Revenue" value={formatCurrency(summary.totalAmount)} />
          <SummaryCard label="Total Profit" value={formatCurrency(summary.totalProfit)} />
        </div>

        <div className="mb-6 rounded-3xl bg-white p-6 text-black shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Search & Filters</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-medium">Search</label>
              <input
                type="text"
                placeholder="Search by sale ID, customer, product, SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Customer</label>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              >
                <option value="">All Customers</option>
                {customerOptions.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportCSV}
                className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Export CSV
              </button>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setCustomerFilter("");
                }}
                className="rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white text-black shadow-lg">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 text-left">
                <th className="w-20 p-4">ID</th>
                <th className="w-48 p-4">Customer</th>
                <th className="w-56 p-4">Date</th>
                <th className="w-20 p-4 text-center">Items</th>
                <th className="w-32 p-4">Revenue</th>
                <th className="w-32 p-4">Profit</th>
                <th className="w-28 p-4">Created By</th>
                <th className="w-32 p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No sales found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const saleProfit =
                    sale.items?.reduce((sum, item) => sum + Number(item.profit || 0), 0) || 0;

                  return (
                    <tr key={sale.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-semibold">#{sale.id}</td>
                      <td className="p-4 break-words">
                        {sale.customerName || "Walk-in Customer"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDateTime(sale.saleDate || sale.createdAt)}
                      </td>
                      <td className="p-4 text-center">{sale.items?.length || 0}</td>
                      <td className="p-4 font-semibold">{formatCurrency(sale.totalAmount)}</td>
                      <td className="p-4 font-semibold text-green-700">
                        {formatCurrency(saleProfit)}
                      </td>
                      <td className="p-4">{sale.createdBy ?? "-"}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                        >
                          View Items
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedSale ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-6 text-black shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold">Sale #{selectedSale.id} Details</h2>
                  <p className="mt-1 text-slate-600">
                    Customer: {selectedSale.customerName || "Walk-in Customer"} • Date:{" "}
                    {formatDateTime(selectedSale.saleDate || selectedSale.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedSale(null)}
                  className="rounded-lg bg-zinc-200 px-4 py-2 font-semibold hover:bg-zinc-300"
                >
                  Close
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <MiniCard label="Items" value={String(selectedSale.items?.length || 0)} />
                <MiniCard
                  label="Revenue"
                  value={formatCurrency(selectedSale.totalAmount || 0)}
                />
                <MiniCard
                  label="Profit"
                  value={formatCurrency(
                    selectedSale.items?.reduce(
                      (sum, item) => sum + Number(item.profit || 0),
                      0
                    ) || 0
                  )}
                />
                <MiniCard label="Created By" value={String(selectedSale.createdBy ?? "-")} />
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-100 text-left">
                      <th className="p-3">Product</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Unit Cost</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items?.length ? (
                      selectedSale.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3 font-medium">{item.product?.name || "-"}</td>
                          <td className="p-3">{item.product?.sku || "-"}</td>
                          <td className="p-3">
                            {item.quantity} {item.product?.unit || "pcs"}
                          </td>
                          <td className="p-3">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-3">{formatCurrency(item.unitCostAtSale)}</td>
                          <td className="p-3 font-semibold">{formatCurrency(item.subtotal)}</td>
                          <td className="p-3 font-semibold text-green-700">
                            {formatCurrency(item.profit)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No sale items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 text-black shadow-lg">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}