"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, getUserInitials, removeToken } from "@/src/lib/auth";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/src/lib/auth";

const mainLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Categories", href: "/categories" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Stock Movements", href: "/stock-movements" },
];

const productLinks = [
  { name: "Products List", href: "/products" },
  { name: "Add Product", href: "/products/add" },
];

const purchaseLinks = [
  { name: "Create Purchase", href: "/purchases" },
  { name: "Purchase History", href: "/purchases/history" },
];

const salesLinks = [
  { name: "Create Sale", href: "/sales" },
  { name: "Sales History", href: "/sales/history" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    removeToken();
    toast.success("Logged out");
    router.push("/login");
  };

  const isExactActive = (href: string) => pathname === href;

  const isSectionActive = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 px-6 py-5">
        <h1 className="text-2xl font-bold">Inventory App</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-4 py-3 transition ${
                isExactActive(link.href)
                  ? "bg-white text-black"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <Section
          title="Products"
          isActive={isSectionActive("/products")}
          links={productLinks}
          isExactActive={isExactActive}
        />

        <Section
          title="Purchases"
          isActive={isSectionActive("/purchases")}
          links={purchaseLinks}
          isExactActive={isExactActive}
        />

        <Section
          title="Sales"
          isActive={isSectionActive("/sales")}
          links={salesLinks}
          isExactActive={isExactActive}
        />
      </nav>

      <div className="space-y-4 border-t border-zinc-800 p-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
              {getUserInitials(user)}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {user?.name || "Admin User"}
              </p>
              <p className="truncate text-sm text-zinc-400">
                {user?.email || "admin@test.com"}
              </p>
              <p className="text-xs text-zinc-500">
                {user?.role || "Admin"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-600 px-4 py-3 text-white transition hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

function Section({
  title,
  isActive,
  links,
  isExactActive,
}: {
  title: string;
  isActive: boolean;
  links: { name: string; href: string }[];
  isExactActive: (href: string) => boolean;
}) {
  return (
    <div className="mt-6">
      <div
        className={`mb-2 rounded-lg px-4 py-2 text-sm font-semibold ${
          isActive ? "bg-zinc-800 text-white" : "text-zinc-400"
        }`}
      >
        {title}
      </div>

      <div className="ml-3 space-y-2 border-l border-zinc-800 pl-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-lg px-4 py-2.5 text-sm transition ${
              isExactActive(link.href)
                ? "bg-white text-black"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}