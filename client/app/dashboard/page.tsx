"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

type SummaryData = {
  totalProducts?: number;
  totalCategories?: number;
  totalSuppliers?: number;
  stockUnits?: number;
  inventoryValue?: number;
  totalPurchases?: number;
  totalSales?: number;
  profit?: number;
  lowStockItems?: number;
};

type PurchaseItem = {
  id: number;
  supplier?: {
    name?: string;
  };
  totalAmount?: number;
  purchaseDate?: string;
};

type SaleItem = {
  id: number;
  customerName?: string | null;
  totalAmount?: number;
  saleDate?: string;
};

type StockMovementItem = {
  id: number;
  movementType: string;
  quantity?: number;
  createdAt: string;
  referenceType?: string | null;
  referenceId?: number | null;
  product?: {
    id: number;
    name?: string;
    sku?: string;
  };
};

type Product = {
  id: number;
  name?: string;
  sku?: string;
  currentStock?: number;
  minStockLevel?: number;
  costPrice?: number;
  sellingPrice?: number;
};

type AnalyticsChartData = {
  label?: string;
  sales?: number;
  purchases?: number;
  profit?: number;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: unknown): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-white p-5 text-black shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"overview" | "analytics">(
    "overview",
  );

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseItem[]>([]);
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovementItem[]>(
    [],
  );
  const [products, setProducts] = useState<Product[]>([]);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsChartData[]>([]);
  const [analyticsProducts, setAnalyticsProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const [summaryRes, purchasesRes, salesRes, movementsRes, productsRes] =
        await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/purchases"),
          api.get("/sales"),
          api.get("/stock-movements"),
          api.get("/products"),
        ]);

      setSummary(summaryRes.data ?? {});
      setRecentPurchases(
        Array.isArray(purchasesRes.data) ? purchasesRes.data.slice(0, 5) : [],
      );
      setRecentSales(
        Array.isArray(salesRes.data) ? salesRes.data.slice(0, 5) : [],
      );
      setRecentMovements(
        Array.isArray(movementsRes.data) ? movementsRes.data.slice(0, 5) : [],
      );
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setAnalyticsProducts(
        Array.isArray(productsRes.data) ? productsRes.data : [],
      );
    } catch (error) {
      console.error("Error fetching overview dashboard data:", error);
      setSummary({});
      setRecentPurchases([]);
      setRecentSales([]);
      setRecentMovements([]);
      setProducts([]);
      setAnalyticsProducts([]);
    }
  };

  const fetchAnalyticsData = async (productId?: string) => {
    try {
      const url = productId
        ? `/dashboard/analytics?productId=${productId}`
        : "/dashboard/analytics";

      const res = await api.get(url);
      const rawChartData = Array.isArray(res.data?.chartData)
        ? res.data.chartData
        : [];
      setAnalyticsData(rawChartData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsData([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchOverviewData();
      await fetchAnalyticsData();
      setLoading(false);
    };

    loadAll();
  }, []);

  useEffect(() => {
    if (viewMode === "analytics") {
      fetchAnalyticsData(selectedProductId);
    }
  }, [viewMode, selectedProductId]);

  const normalizedProducts = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name || "Unnamed Product",
      sku: product.sku || "-",
      currentStock: toNumber(product.currentStock),
      minStockLevel: toNumber(product.minStockLevel),
      costPrice: toNumber(product.costPrice),
      sellingPrice: toNumber(product.sellingPrice),
    }));
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return normalizedProducts
      .filter((product) => product.currentStock <= product.minStockLevel)
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [normalizedProducts]);

  const safeSummary = useMemo(() => {
    const s = summary ?? {};

    return {
      totalProducts: toNumber(s.totalProducts),
      totalCategories: toNumber(s.totalCategories),
      totalSuppliers: toNumber(s.totalSuppliers),
      stockUnits: toNumber(s.stockUnits),
      inventoryValue: toNumber(s.inventoryValue),
      totalPurchases: toNumber(s.totalPurchases),
      totalSales: toNumber(s.totalSales),
      profit: toNumber(s.profit),
      lowStockItems:
        toNumber(s.lowStockItems) ||
        normalizedProducts.filter(
          (product) => product.currentStock <= product.minStockLevel,
        ).length,
    };
  }, [summary, normalizedProducts]);

  const metricCards = useMemo(() => {
    return [
      {
        label: "Total Products",
        value: safeSummary.totalProducts,
        href: "/products",
      },
      {
        label: "Total Categories",
        value: safeSummary.totalCategories,
        href: "/categories",
      },
      {
        label: "Total Suppliers",
        value: safeSummary.totalSuppliers,
        href: "/suppliers",
      },
      {
        label: "Stock Units",
        value: safeSummary.stockUnits,
        href: "/stock-movements",
      },
      {
        label: "Inventory Value",
        value: formatCurrency(safeSummary.inventoryValue),
        href: "/products",
      },
      {
        label: "Total Purchases",
        value: formatCurrency(safeSummary.totalPurchases),
        href: "/purchases/history",
      },
      {
        label: "Total Sales",
        value: formatCurrency(safeSummary.totalSales),
        href: "/sales/history",
      },
      {
        label: "Profit",
        value: formatCurrency(safeSummary.profit),
        href: "/sales/history",
      },
      {
        label: "Low Stock Items",
        value: safeSummary.lowStockItems,
        href: "/products",
      },
    ];
  }, [safeSummary]);

  const normalizedAnalyticsData = useMemo(() => {
    return analyticsData.map((item, index) => ({
      label: item.label || `Item ${index + 1}`,
      sales: toNumber(item.sales),
      purchases: toNumber(item.purchases),
      profit: toNumber(item.profit),
    }));
  }, [analyticsData]);

  const lowStockChartData = useMemo(() => {
    return lowStockProducts.slice(0, 6).map((product) => ({
      name: product.name,
      currentStock: product.currentStock,
      minStockLevel: product.minStockLevel,
    }));
  }, [lowStockProducts]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold">Inventory Dashboard</h1>
          <p className="mt-2 text-zinc-400">
            Monitor inventory health, purchases, sales, and stock movement
            trends.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/products/add"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Add Product
          </Link>
          <Link
            href="/purchases"
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Create Purchase
          </Link>
          <Link
            href="/sales"
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Create Sale
          </Link>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setViewMode("overview")}
          className={`rounded-xl px-5 py-3 font-semibold transition ${
            viewMode === "overview"
              ? "bg-white text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          Overview Dashboard
        </button>

        <button
          onClick={() => setViewMode("analytics")}
          className={`rounded-xl px-5 py-3 font-semibold transition ${
            viewMode === "analytics"
              ? "bg-white text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          Analytics Dashboard
        </button>
      </div>

      {viewMode === "overview" ? (
        <>
          <div className="mb-8 rounded-3xl border border-red-900 bg-red-950/60 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-red-200">
                  Low Stock Alert
                </h2>
                <p className="mt-1 text-sm text-red-300">
                  Products at or below their minimum stock level need attention.
                </p>
              </div>

              <div className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white">
                {lowStockProducts.length} Item
                {lowStockProducts.length === 1 ? "" : "s"}
              </div>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="rounded-2xl border border-green-800 bg-green-950/40 p-5 text-green-200">
                No low stock items right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {lowStockProducts.slice(0, 6).map((product) => {
                  const shortage = Math.max(
                    product.minStockLevel - product.currentStock,
                    0,
                  );

                  return (
                    <Link
                      key={product.id}
                      href="/products"
                      className="rounded-xl border border-red-800 bg-black/30 p-4 transition hover:bg-black/40"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {product.name}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            SKU: {product.sku}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                          Urgent
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl bg-zinc-900 p-3">
                          <p className="text-zinc-400">Current</p>
                          <p className="mt-1 text-lg font-bold text-red-300">
                            {product.currentStock}
                          </p>
                        </div>

                        <div className="rounded-xl bg-zinc-900 p-3">
                          <p className="text-zinc-400">Minimum</p>
                          <p className="mt-1 text-lg font-bold text-white">
                            {product.minStockLevel}
                          </p>
                        </div>

                        <div className="rounded-xl bg-zinc-900 p-3">
                          <p className="text-zinc-400">Short by</p>
                          <p className="mt-1 text-lg font-bold text-yellow-300">
                            {shortage}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricCards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                href={card.href}
              />
            ))}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-3xl font-bold">Recent Purchases</h2>
                <Link
                  href="/purchases/history"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  View All
                </Link>
              </div>

              {recentPurchases.length === 0 ? (
                <p className="text-slate-500">No purchases found.</p>
              ) : (
                <div className="space-y-4">
                  {recentPurchases.map((purchase) => (
                    <Link
                      key={purchase.id}
                      href="/purchases/history"
                      className="block rounded-2xl border p-5 transition hover:bg-slate-50"
                    >
                      <p className="text-2xl font-semibold">
                        Purchase #{purchase.id} —{" "}
                        {purchase.supplier?.name || "Unknown Supplier"}
                      </p>
                      <p className="mt-1 text-lg text-slate-600">
                        {formatCurrency(purchase.totalAmount)} •{" "}
                        {formatDateTime(purchase.purchaseDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-3xl font-bold">Recent Sales</h2>
                <Link
                  href="/sales/history"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  View All
                </Link>
              </div>

              {recentSales.length === 0 ? (
                <p className="text-slate-500">No sales found.</p>
              ) : (
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <Link
                      key={sale.id}
                      href="/sales/history"
                      className="block rounded-2xl border p-5 transition hover:bg-slate-50"
                    >
                      <p className="text-2xl font-semibold">
                        Sale #{sale.id} —{" "}
                        {sale.customerName || "Walk-in Customer"}
                      </p>
                      <p className="mt-1 text-lg text-slate-600">
                        {formatCurrency(sale.totalAmount)} •{" "}
                        {formatDateTime(sale.saleDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-3xl font-bold">Low Stock Items</h2>
                <Link
                  href="/products"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Open Products
                </Link>
              </div>

              {lowStockProducts.length === 0 ? (
                <p className="text-slate-500">No low stock items.</p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <Link
                      key={product.id}
                      href="/products"
                      className="block rounded-2xl border p-5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-1 text-slate-600">
                            SKU: {product.sku}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                          Low
                        </span>
                      </div>

                      <p className="mt-3 text-lg text-slate-600">
                        Current Stock:{" "}
                        <span className="font-semibold">
                          {product.currentStock}
                        </span>{" "}
                        • Minimum Required:{" "}
                        <span className="font-semibold">
                          {product.minStockLevel}
                        </span>
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-3xl font-bold">Recent Stock Movements</h2>
                <Link
                  href="/stock-movements"
                  className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  View All
                </Link>
              </div>

              {recentMovements.length === 0 ? (
                <p className="text-slate-500">No stock movements found.</p>
              ) : (
                <div className="space-y-4">
                  {recentMovements.map((movement) => (
                    <Link
                      key={movement.id}
                      href="/stock-movements"
                      className="block rounded-2xl border p-5 transition hover:bg-slate-50"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold">
                            {movement.product?.name || "Unknown Product"}
                          </p>
                          <p className="text-slate-600">
                            {movement.referenceType || "MANUAL"}
                            {movement.referenceId
                              ? ` #${movement.referenceId}`
                              : ""}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            movement.movementType === "IN"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {movement.movementType} {toNumber(movement.quantity)}
                        </span>
                      </div>

                      <p className="text-lg text-slate-600">
                        {formatDateTime(movement.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 rounded-3xl bg-white p-6 text-black shadow-lg">
            <h2 className="mb-4 text-3xl font-bold">Analytics Filters</h2>

            <div className="max-w-md">
              <label className="mb-2 block font-medium">
                Filter by Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">All Products</option>
                {analyticsProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name || "Unnamed Product"} ({product.sku || "-"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-red-900 bg-red-950/60 p-6 shadow-lg">
              <h2 className="mb-5 text-3xl font-bold text-red-100">
                Sales vs Purchases
              </h2>

              <div className="h-96 rounded-2xl bg-white p-4 text-black">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={normalizedAnalyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: unknown) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="purchases" fill="#22c55e" name="Purchases" />
                    <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-5 text-3xl font-bold">Profit Trend</h2>

              <div className="h-96 rounded-2xl border p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={normalizedAnalyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: unknown) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#16a34a"
                      strokeWidth={3}
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-5 text-3xl font-bold">Low Stock Analysis</h2>

              <div className="h-96 rounded-2xl border p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lowStockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="currentStock"
                      fill="#ef4444"
                      name="Current Stock"
                    />
                    <Bar
                      dataKey="minStockLevel"
                      fill="#f59e0b"
                      name="Min Stock"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-5 text-3xl font-bold">Analytics Summary</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MetricCard
                  label="Chart Records"
                  value={normalizedAnalyticsData.length}
                />
                <MetricCard
                  label="Products in Low Stock"
                  value={lowStockProducts.length}
                />
                <MetricCard
                  label="Total Purchases"
                  value={formatCurrency(safeSummary.totalPurchases)}
                />
                <MetricCard
                  label="Total Sales"
                  value={formatCurrency(safeSummary.totalSales)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
