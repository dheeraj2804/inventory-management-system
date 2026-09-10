"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";
import PageSkeleton from "@/components/PageSkeleton";

type PurchaseItem = {
  id: number;
  quantity: number;
  unitCost: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: string;
  } | null;
};

type Purchase = {
  id: number;
  totalAmount: number;
  purchaseDate?: string;
  createdAt?: string;
  createdBy?: number | null;
  supplier?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  } | null;
  items?: PurchaseItem[];
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

export default function PurchasesHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(
    null,
  );

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/purchases");
      setPurchases(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const supplierOptions = useMemo(() => {
    const map = new Map<number, string>();

    purchases.forEach((purchase) => {
      if (purchase.supplier?.id && purchase.supplier?.name) {
        map.set(purchase.supplier.id, purchase.supplier.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return purchases.filter((purchase) => {
      const supplierName = purchase.supplier?.name?.toLowerCase() || "";
      const purchaseId = String(purchase.id);
      const itemNames =
        purchase.items
          ?.map((item) => item.product?.name || "")
          .join(" ")
          .toLowerCase() || "";
      const itemSkus =
        purchase.items
          ?.map((item) => item.product?.sku || "")
          .join(" ")
          .toLowerCase() || "";

      const matchesSearch =
        !term ||
        purchaseId.includes(term) ||
        supplierName.includes(term) ||
        itemNames.includes(term) ||
        itemSkus.includes(term);

      const matchesSupplier = selectedSupplier
        ? String(purchase.supplier?.id || "") === selectedSupplier
        : true;

      return matchesSearch && matchesSupplier;
    });
  }, [purchases, searchTerm, selectedSupplier]);

  const summary = useMemo(() => {
    const totalRecords = filteredPurchases.length;
    const totalAmount = filteredPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount || 0),
      0,
    );
    const totalItems = filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        (purchase.items?.reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0,
        ) || 0),
      0,
    );

    return {
      totalRecords,
      totalAmount,
      totalItems,
    };
  }, [filteredPurchases]);

  const exportCSV = () => {
    const headers = [
      "Purchase ID",
      "Supplier",
      "Date",
      "Total Amount",
      "Created By",
      "Item Count",
      "Products",
    ];

    const rows = filteredPurchases.map((purchase) => [
      purchase.id,
      purchase.supplier?.name ?? "-",
      formatDateTime(purchase.purchaseDate || purchase.createdAt),
      purchase.totalAmount ?? 0,
      purchase.createdBy ?? "-",
      purchase.items?.length ?? 0,
      purchase.items
        ?.map((item) => `${item.product?.name || "-"} (${item.quantity})`)
        .join(" | ") ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "purchases_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="legacy-page min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Purchases History</h1>
          <p className="mt-2 text-zinc-400">
            Review all purchase transactions and drill into purchased items.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            label="Total Purchases"
            value={String(summary.totalRecords)}
          />
          <SummaryCard
            label="Total Units Purchased"
            value={String(summary.totalItems)}
          />
          <SummaryCard
            label="Total Purchase Value"
            value={formatCurrency(summary.totalAmount)}
          />
        </div>

        <div className="mb-6 rounded-3xl bg-white p-6 text-black shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Search & Filters</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                className="mb-2 block font-medium"
                htmlFor="history-field-1"
              >
                Search
              </label>
              <input
                id="history-field-1"
                type="text"
                placeholder="Search by purchase ID, supplier, product, SKU"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label
                className="mb-2 block font-medium"
                htmlFor="history-field-2"
              >
                Supplier
              </label>
              <select
                id="history-field-2"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              >
                <option value="">All Suppliers</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
                  setSelectedSupplier("");
                }}
                className="rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white text-black shadow-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 text-left">
                <th className="p-4">ID</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Created By</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const isExpanded = expandedPurchaseId === purchase.id;

                  return (
                    <>
                      <tr
                        key={purchase.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="p-4 font-semibold">#{purchase.id}</td>
                        <td className="p-4">
                          {purchase.supplier?.name || "-"}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {formatDateTime(
                            purchase.purchaseDate || purchase.createdAt,
                          )}
                        </td>
                        <td className="p-4">{purchase.items?.length || 0}</td>
                        <td className="p-4 font-semibold">
                          {formatCurrency(purchase.totalAmount)}
                        </td>
                        <td className="p-4">{purchase.createdBy ?? "-"}</td>
                        <td className="p-4">
                          <button
                            onClick={() =>
                              setExpandedPurchaseId(
                                isExpanded ? null : purchase.id,
                              )
                            }
                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                          >
                            {isExpanded ? "Hide Items" : "View Items"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr className="border-b bg-slate-50">
                          <td colSpan={7} className="p-4">
                            <div className="rounded-2xl border bg-white p-4">
                              <h3 className="mb-4 text-xl font-bold">
                                Purchase #{purchase.id} Items
                              </h3>

                              {purchase.items?.length ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border-collapse">
                                    <thead>
                                      <tr className="border-b bg-slate-100 text-left">
                                        <th className="p-3">Product</th>
                                        <th className="p-3">SKU</th>
                                        <th className="p-3">Quantity</th>
                                        <th className="p-3">Unit Cost</th>
                                        <th className="p-3">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {purchase.items.map((item) => (
                                        <tr key={item.id} className="border-b">
                                          <td className="p-3 font-medium">
                                            {item.product?.name || "-"}
                                          </td>
                                          <td className="p-3">
                                            {item.product?.sku || "-"}
                                          </td>
                                          <td className="p-3">
                                            {item.quantity}{" "}
                                            {item.product?.unit || "pcs"}
                                          </td>
                                          <td className="p-3">
                                            {formatCurrency(item.unitCost)}
                                          </td>
                                          <td className="p-3 font-semibold">
                                            {formatCurrency(item.subtotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-slate-500">
                                  No purchase items found.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-black shadow-lg">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
