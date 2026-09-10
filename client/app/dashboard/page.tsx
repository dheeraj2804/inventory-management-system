"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import api, { clearApiCache, isDemoMode } from "@/src/lib/api";
import type { Product, Transaction, Movement } from "@/src/lib/demo";
import Icon, { type IconName } from "@/components/Icon";
import PageSkeleton from "@/components/PageSkeleton";
const RevenueChart = dynamic(() => import("@/components/RevenueChart"), {
  loading: () => <div className="skeleton" style={{ height: 240 }} />,
  ssr: false,
});
type Summary = {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalStockUnits: number;
  totalInventoryValue: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  totalProfit: number;
  lowStockCount: number;
};
type Data = {
  summary: Summary;
  products: (Product & { category?: { name: string } })[];
  sales: Transaction[];
  purchases: Transaction[];
  movements: (Movement & { product?: Product })[];
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
function Metric({
  label,
  value,
  caption,
  icon,
  href,
  tone = "green",
}: {
  label: string;
  value: string;
  caption: string;
  icon: IconName;
  href: string;
  tone?: string;
}) {
  return (
    <Link href={href} className={`metric-card ${tone}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon name={icon} size={19} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="metric-bottom">
        <span>{caption}</span>
        <Icon name="arrow" size={16} />
      </div>
    </Link>
  );
}
export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [refreshing, setRefreshing] = useState(false),
    [days, setDays] = useState(30),
    [productFilter, setProductFilter] = useState("");
  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const [summary, products, sales, purchases, movements] =
        await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/products"),
          api.get("/sales"),
          api.get("/purchases"),
          api.get("/dashboard/recent-movements"),
        ]);
      setData({
        summary: summary.data,
        products: products.data,
        sales: sales.data,
        purchases: purchases.data,
        movements: movements.data,
      });
    } catch {
      setError(
        "We couldn’t load your overview. Check the API connection and try again.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => {
      clearApiCache();
      void load();
    };
    window.addEventListener("inventory-updated", refresh);
    return () => window.removeEventListener("inventory-updated", refresh);
  }, [load]);
  const chart = useMemo(() => {
    const buckets = new Map<
      string,
      { label: string; sales: number; purchases: number }
    >();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const key = (d: Date) =>
      `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.set(key(d), {
        label: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: 0,
        purchases: 0,
      });
    }
    for (const kind of ["sales", "purchases"] as const)
      for (const t of data?.[kind] || []) {
        const d = new Date(t.saleDate || t.purchaseDate || "");
        const b = buckets.get(key(d));
        if (b)
          b[kind] += productFilter
            ? t.items
                .filter((i) => i.productId === Number(productFilter))
                .reduce((s, i) => s + i.subtotal, 0)
            : t.totalAmount;
      }
    return [...buckets.values()];
  }, [data, days, productFilter]);
  if (!data) {
    if (error)
      return (
        <div className="dashboard-page">
          <div className="error-panel">
            <Icon name="alert" />
            <h1>Let’s reconnect.</h1>
            <p>{error}</p>
            <button className="button primary" onClick={load}>
              Try again
            </button>
          </div>
        </div>
      );
    return <PageSkeleton />;
  }
  const { summary: s, products } = data,
    low = products
      .filter((p) => p.currentStock <= p.minStockLevel)
      .sort((a, b) => a.currentStock - b.currentStock),
    out = products.filter((p) => p.currentStock === 0).length,
    healthy = products.length - low.length;
  const totalChartSales = chart.reduce((sum, d) => sum + d.sales, 0),
    totalChartPurchases = chart.reduce((sum, d) => sum + d.purchases, 0);
  const categories = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      const c = p.category?.name || "Uncategorized";
      acc[c] = (acc[c] || 0) + p.currentStock;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
          <h1>
            Overview<span className="heading-dot">.</span>
          </h1>
          <p>A little clarity for your everyday operations.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary refresh-button"
            disabled={refreshing}
            onClick={() => {
              clearApiCache();
              void load();
            }}
            aria-label="Refresh dashboard"
          >
            <Icon
              name="refresh"
              size={17}
              className={refreshing ? "spin" : ""}
            />
            <span>Refresh</span>
          </button>
          <Link className="button primary" href="/sales">
            <Icon name="plus" size={17} />
            New sale
          </Link>
        </div>
      </div>
      {error && (
        <div role="alert" className="inline-error">
          {error} Showing the last loaded data.
        </div>
      )}
      <div className="metric-grid">
        <Metric
          label="Inventory value"
          value={money(s.totalInventoryValue)}
          caption={`${s.totalStockUnits.toLocaleString()} units on hand`}
          icon="box"
          href="/products"
        />
        <Metric
          label="Total sales"
          value={money(s.totalSalesAmount)}
          caption={`${data.sales.length} recorded orders · All time`}
          icon="trend"
          href="/sales/history"
        />
        <Metric
          label="Recorded profit"
          value={money(s.totalProfit)}
          caption="Sales less captured product cost"
          icon="wallet"
          href="/sales/history"
        />
        <Metric
          label="Needs attention"
          value={String(s.lowStockCount)}
          caption={`${out} out of stock · ${low.length - out} running low`}
          icon="alert"
          href="/products?stock=low"
          tone="amber"
        />
      </div>
      <div className="dashboard-primary">
        <section className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <h2>Sales & purchasing</h2>
              <p>Follow the flow of your business.</p>
            </div>
            <select
              className="compact-select"
              aria-label="Chart period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="chart-toolbar">
            <div className="chart-totals">
              <div>
                <span>
                  <i className="legend-dot green" />
                  Sales
                </span>
                <strong>{money(totalChartSales)}</strong>
              </div>
              <div>
                <span>
                  <i className="legend-dot sand" />
                  Purchases
                </span>
                <strong>{money(totalChartPurchases)}</strong>
              </div>
            </div>
            <select
              className="compact-select product-select"
              aria-label="Chart product"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <RevenueChart data={chart} />
          <div className="panel-footnote">
            <Icon name="clock" size={13} />
            Daily totals for the selected period
            {isDemoMode() ? " · Sample transactions" : ""}
          </div>
        </section>
        <section className="panel health-panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory health</h2>
              <p>A pulse on your shelves.</p>
            </div>
            <Icon name="activity" size={19} />
          </div>
          <div
            className="health-ring"
            style={{
              background: `conic-gradient(#368a70 0 ${products.length ? (healthy / products.length) * 100 : 0}%, #d9b66c 0 ${products.length ? ((products.length - out) / products.length) * 100 : 0}%, #d98874 0 100%)`,
            }}
          >
            <div>
              <strong>{products.length}</strong>
              <span>total products</span>
            </div>
          </div>
          <div className="health-legend">
            <Link href="/products">
              <span>
                <i style={{ background: "#368a70" }} />
                Healthy stock
              </span>
              <strong>{healthy}</strong>
            </Link>
            <Link href="/products?stock=low">
              <span>
                <i style={{ background: "#d9b66c" }} />
                Running low
              </span>
              <strong>{low.length - out}</strong>
            </Link>
            <Link href="/products?stock=low">
              <span>
                <i style={{ background: "#d98874" }} />
                Out of stock
              </span>
              <strong>{out}</strong>
            </Link>
          </div>
          <Link href="/products" className="panel-link">
            View inventory
            <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel low-stock-panel">
          <div className="panel-heading">
            <div className="heading-inline">
              <h2>Time to restock</h2>
              <span className="count-badge">{low.length}</span>
            </div>
            <Link href="/purchases" className="text-link">
              New purchase
              <Icon name="arrow" size={15} />
            </Link>
          </div>
          <div className="table-scroll">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {low.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <span className="product-symbol">
                          <Icon name="box" size={18} />
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>{p.sku}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{p.currentStock}</strong>
                      <small> / min {p.minStockLevel}</small>
                    </td>
                    <td>
                      <span
                        className={`status-tag ${p.currentStock === 0 ? "red" : "amber"}`}
                      >
                        {p.currentStock === 0 ? "Out of stock" : "Low stock"}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        href={`/products?q=${encodeURIComponent(p.sku)}`}
                        aria-label={`View ${p.name}`}
                      >
                        <Icon name="arrow" size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!low.length && (
              <div className="empty-message">
                <Icon name="check" />
                <p>All stocked up. Your inventory is in a good place.</p>
              </div>
            )}
          </div>
          <Link href="/products?stock=low" className="panel-link">
            View all stock alerts
            <Icon name="arrow" size={16} />
          </Link>
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <Link className="text-link" href="/stock-movements">
              View all
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          <div className="activity-list">
            {data.movements.map((m) => (
              <div className="activity-item" key={m.id}>
                <span
                  className={`activity-icon ${m.movementType === "IN" ? "green" : "sand"}`}
                >
                  <Icon
                    name={m.movementType === "IN" ? "in" : "out"}
                    size={16}
                  />
                </span>
                <div>
                  <strong>
                    {m.movementType === "IN"
                      ? "Stock received"
                      : "Order fulfilled"}
                  </strong>
                  <p>
                    {m.product?.name || "Product"} <b>· {m.quantity} units</b>
                  </p>
                  <small>
                    {new Date(m.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {m.referenceType} #{m.referenceId}
                  </small>
                </div>
              </div>
            ))}
            {!data.movements.length && (
              <p className="empty-message">
                Your next purchase or sale will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel category-panel">
          <div className="panel-heading">
            <h2>On the shelves</h2>
            <span className="muted">Units by category</span>
          </div>
          <div className="category-bars">
            {categories.map(([name, units], i) => (
              <div key={name}>
                <span>
                  {name}
                  <strong>{units.toLocaleString()}</strong>
                </span>
                <div className="bar-track">
                  <i
                    style={{
                      width: `${s.totalStockUnits ? (units / s.totalStockUnits) * 100 : 0}%`,
                      background: [
                        "#2d7b65",
                        "#62937e",
                        "#91ad8d",
                        "#b7c5a2",
                        "#d0bd92",
                        "#bda17b",
                      ][i % 6],
                    }}
                  />
                </div>
              </div>
            ))}
            {!categories.length && (
              <p className="muted">
                Add products to see your category breakdown.
              </p>
            )}
          </div>
        </section>
        <section className="quick-panel">
          <span className="quick-decoration" aria-hidden="true">
            <Icon name="box" size={110} />
          </span>
          <p className="eyebrow">KEEP THINGS MOVING</p>
          <h2>
            Your next move,
            <br />
            one click away.
          </h2>
          <div className="quick-actions">
            <Link href="/products/add">
              <Icon name="plus" size={17} />
              Add product
              <Icon name="arrow" size={15} />
            </Link>
            <Link href="/purchases">
              <Icon name="in" size={17} />
              Receive stock
              <Icon name="arrow" size={15} />
            </Link>
            <Link href="/sales">
              <Icon name="out" size={17} />
              Record a sale
              <Icon name="arrow" size={15} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
