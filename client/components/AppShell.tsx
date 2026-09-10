"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import AuthGuard from "./AuthGuard";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import api, { clearApiCache, isDemoMode, resetDemo } from "@/src/lib/api";
import { navigation } from "@/src/lib/navigation";
import type { Product } from "@/src/lib/demo";

function Workspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(""),
    [products, setProducts] = useState<Product[]>([]),
    [alertError, setAlertError] = useState(false);
  const palette = useRef<HTMLDialogElement>(null),
    alerts = useRef<HTMLDialogElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const demo = isDemoMode();
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = drawer.current;
    const focusable = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) || [],
      );
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusable(),
        first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [mobile]);
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .get("/products")
        .then((r) => {
          if (active) {
            setProducts(r.data);
            setAlertError(false);
          }
        })
        .catch(() => {
          if (active) setAlertError(true);
        });
    void load();
    const refresh = () => {
      clearApiCache();
      void load();
    };
    window.addEventListener("inventory-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("inventory-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        palette.current?.showModal();
      }
      if (e.key === "Escape") setMobile(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const low = products.filter((p) => p.currentStock <= p.minStockLevel);
  const matches = navigation.filter((n) =>
    n.label.toLowerCase().includes(search.toLowerCase()),
  );
  const productMatches = search.trim()
    ? products
        .filter((p) =>
          `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
        )
        .slice(0, 6)
    : [];
  const closePalette = () => {
    palette.current?.close();
    setSearch("");
  };
  return (
    <div className="app-shell">
      <a href="#workspace-content" className="skip-link">
        Skip to content
      </a>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div ref={drawer} className={`sidebar-wrap ${mobile ? "is-open" : ""}`}>
        <Sidebar onNavigate={() => setMobile(false)} />
      </div>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>
              {navigation.find((n) => n.href === pathname)?.label ||
                (pathname === "/products/add" ? "Add product" : "Overview")}
            </strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => palette.current?.showModal()}
            >
              <Icon name="search" size={17} />
              <span>Search workspace</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className={`mode-pill ${demo ? "demo" : ""}`}>
              <i />
              {demo ? "Demo mode" : "Live workspace"}
            </span>
            <button
              className="icon-button notification-button"
              aria-label={`Stock alerts${low.length ? `: ${low.length} products` : ""}`}
              onClick={() => alerts.current?.showModal()}
            >
              <Icon name="bell" />
              {low.length > 0 && <b />}
            </button>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <Icon name="sparkle" size={15} />
              <strong>Your demo playground.</strong> Sample data, saved only in
              this browser.
            </span>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Reset your demo edits and restore the sample inventory?",
                  )
                ) {
                  resetDemo();
                  window.location.reload();
                }
              }}
            >
              Reset demo <Icon name="refresh" size={13} />
            </button>
          </div>
        )}
        <main id="workspace-content" className="workspace-content">
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
        <footer className="workspace-footer">
          <span>
            Personal project <span>·</span> Inventory, thoughtfully organized.
          </span>
          <span>{demo ? "Sample workspace" : "Connected workspace"}</span>
        </footer>
      </div>
      <dialog
        ref={palette}
        className="command-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePalette();
        }}
        onClose={() => setSearch("")}
      >
        <div className="command-search">
          <Icon name="search" />
          <input
            autoFocus
            aria-label="Search pages and products"
            placeholder="Where would you like to go?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={closePalette}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="command-results">
          <p className="eyebrow">Pages & actions</p>
          {matches.map((n) => (
            <button
              key={n.href}
              onClick={() => {
                closePalette();
                router.push(n.href);
              }}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
          {productMatches.length > 0 && <p className="eyebrow">Products</p>}
          {productMatches.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                closePalette();
                router.push(`/products?q=${encodeURIComponent(p.sku)}`);
              }}
            >
              <Icon name="box" />
              <span>
                {p.name}
                <small>
                  {p.sku} · {p.currentStock} in stock
                </small>
              </span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
          {!matches.length && !productMatches.length && (
            <p className="empty-message">
              No matches. Try a product name, SKU, or page.
            </p>
          )}
        </div>
        <div className="command-footer">
          Tab to move · Enter to open · Esc to close
        </div>
      </dialog>
      <dialog
        ref={alerts}
        className="alerts-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) alerts.current?.close();
        }}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Needs attention</p>
            <h2>Stock alerts</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close alerts"
            onClick={() => alerts.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        {alertError ? (
          <p className="empty-message">
            Could not load stock alerts. Check your API connection and refresh.
          </p>
        ) : low.length ? (
          low.map((p) => (
            <Link
              key={p.id}
              href={`/products?q=${encodeURIComponent(p.sku)}`}
              className="alert-row"
              onClick={() => alerts.current?.close()}
            >
              <span className="product-symbol">
                <Icon name="box" />
              </span>
              <span>
                <strong>{p.name}</strong>
                <small>
                  {p.currentStock} available · Minimum {p.minStockLevel}
                </small>
              </span>
              <Icon name="arrow" size={16} />
            </Link>
          ))
        ) : (
          <div className="empty-message">
            <Icon name="check" />
            <p>All stocked up. No products below their minimum.</p>
          </div>
        )}
      </dialog>
    </div>
  );
}
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AuthGuard>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#172c27", color: "#fff", borderRadius: "12px" },
          duration: 3500,
        }}
      />
      {pathname === "/login" ? children : <Workspace>{children}</Workspace>}
    </AuthGuard>
  );
}
