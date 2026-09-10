"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";

type StockMovement = {
  id: number;
  movementType: "IN" | "OUT" | string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;
  createdAt: string;
  createdBy?: number | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: string;
  } | null;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [movementFilter, setMovementFilter] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock-movements");
      setMovements(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const productName = movement.product?.name?.toLowerCase() || "";
      const sku = movement.product?.sku?.toLowerCase() || "";
      const note = movement.note?.toLowerCase() || "";
      const refType = movement.referenceType?.toLowerCase() || "";
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        !term ||
        productName.includes(term) ||
        sku.includes(term) ||
        note.includes(term) ||
        refType.includes(term) ||
        String(movement.id).includes(term) ||
        String(movement.referenceId ?? "").includes(term);

      const matchesMovement = movementFilter
        ? movement.movementType === movementFilter
        : true;

      const matchesReference = referenceFilter
        ? (movement.referenceType || "") === referenceFilter
        : true;

      return matchesSearch && matchesMovement && matchesReference;
    });
  }, [movements, searchTerm, movementFilter, referenceFilter]);

  const summary = useMemo(() => {
    let stockInCount = 0;
    let stockOutCount = 0;
    let totalInQty = 0;
    let totalOutQty = 0;

    for (const movement of filteredMovements) {
      if (movement.movementType === "IN") {
        stockInCount += 1;
        totalInQty += Number(movement.quantity || 0);
      } else if (movement.movementType === "OUT") {
        stockOutCount += 1;
        totalOutQty += Number(movement.quantity || 0);
      }
    }

    return {
      totalRecords: filteredMovements.length,
      stockInCount,
      stockOutCount,
      totalInQty,
      totalOutQty,
    };
  }, [filteredMovements]);

  const exportCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Product",
      "SKU",
      "Movement Type",
      "Quantity",
      "Unit",
      "Reference Type",
      "Reference ID",
      "Note",
      "Created By",
    ];

    const rows = filteredMovements.map((movement) => [
      movement.id,
      formatDateTime(movement.createdAt),
      movement.product?.name ?? "",
      movement.product?.sku ?? "",
      movement.movementType,
      movement.quantity,
      movement.product?.unit ?? "",
      movement.referenceType ?? "",
      movement.referenceId ?? "",
      movement.note ?? "",
      movement.createdBy ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stock_movements_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMovementFilter("");
    setReferenceFilter("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading stock movements...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Stock Movements</h1>
          <p className="mt-2 text-zinc-400">
            Track all inventory inflow and outflow across purchases and sales.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <SummaryCard label="Total Records" value={String(summary.totalRecords)} />
          <SummaryCard label="IN Records" value={String(summary.stockInCount)} />
          <SummaryCard label="OUT Records" value={String(summary.stockOutCount)} />
          <SummaryCard label="Total Qty In" value={String(summary.totalInQty)} />
          <SummaryCard label="Total Qty Out" value={String(summary.totalOutQty)} />
        </div>

        <div className="mb-6 rounded-3xl bg-white p-6 text-black shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Search & Filters</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block font-medium">Search</label>
              <input
                type="text"
                placeholder="Search by product, SKU, note, ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Movement Type</label>
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              >
                <option value="">All</option>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">Reference Type</label>
              <select
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              >
                <option value="">All</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="SALE">SALE</option>
                <option value="MANUAL">MANUAL</option>
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
                onClick={clearFilters}
                className="rounded-xl bg-black px-4 py-3 font-semibold text-white transition hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl bg-white text-black shadow-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b bg-slate-100 text-left">
                <th className="p-4">ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Type</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Note</th>
                <th className="p-4">Created By</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const isIn = movement.movementType === "IN";
                  const unit = movement.product?.unit || "pcs";

                  return (
                    <tr key={movement.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">{movement.id}</td>
                      <td className="p-4 whitespace-nowrap">
                        {formatDateTime(movement.createdAt)}
                      </td>
                      <td className="p-4 font-medium">
                        {movement.product?.name || "-"}
                      </td>
                      <td className="p-4">{movement.product?.sku || "-"}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            isIn
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {movement.movementType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            isIn ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {isIn ? "+" : "-"}
                          {movement.quantity} {unit}
                        </span>
                      </td>
                      <td className="p-4">
                        {movement.referenceType || "MANUAL"}
                        {movement.referenceId ? ` #${movement.referenceId}` : ""}
                      </td>
                      <td className="p-4">{movement.note || "-"}</td>
                      <td className="p-4">{movement.createdBy ?? "-"}</td>
                    </tr>
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