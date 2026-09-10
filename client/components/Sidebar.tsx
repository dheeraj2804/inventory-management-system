"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, getUserInitials, removeToken } from "@/src/lib/auth";
import { clearApiCache, isDemoMode, prefetchData } from "@/src/lib/api";
import { navigation } from "@/src/lib/navigation";
import Icon from "./Icon";

export default function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname(),
    router = useRouter(),
    user = getUser();
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand" onClick={onNavigate}>
        <span className="brand-mark">
          <Icon name="box" size={25} />
        </span>
        <span>StockSync</span>
      </Link>
      <div className="workspace-switch">
        <span className="workspace-dot">S</span>
        <div>
          <strong>Main workspace</strong>
          <small>
            {isDemoMode() ? "Demo inventory" : "Inventory management"}
          </small>
        </div>
        <Icon name="layers" size={17} />
      </div>
      <nav aria-label="Main navigation">
        {["Workspace", "Operations"].map((group) => (
          <div className="nav-group" key={group}>
            <p>{group}</p>
            {navigation
              .filter((n) => n.group === group)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onMouseEnter={() => prefetchData(link.href)}
                  onFocus={() => prefetchData(link.href)}
                  onClick={onNavigate}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`nav-link ${pathname === link.href ? "active" : ""}`}
                >
                  <Icon name={link.icon} size={19} />
                  <span>{link.label}</span>
                  {pathname === link.href && <span className="nav-indicator" />}
                </Link>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <Icon name="sparkle" size={19} />
          <strong>A little more organized.</strong>
          <p>Everything your inventory needs, in one place.</p>
          <Link href="/products/add" onClick={onNavigate}>
            Add a product <Icon name="arrow" size={15} />
          </Link>
        </div>
        <div className="profile">
          <span className="avatar">{getUserInitials(user)}</span>
          <span>
            <strong>{user?.name || "Your account"}</strong>
            <small>
              {isDemoMode() ? "Demo workspace" : user?.role || "Team member"}
            </small>
          </span>
          <button
            aria-label="Log out"
            title="Log out"
            className="icon-button"
            onClick={() => {
              removeToken();
              clearApiCache();
              router.replace("/login");
            }}
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
