"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/src/lib/auth";
import PageSkeleton from "./PageSkeleton";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("auth-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-changed", callback);
  };
};
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const token = useSyncExternalStore(subscribe, getToken, () => undefined);
  const allowed = pathname === "/login" || pathname === "/demo" || !!token;
  useEffect(() => {
    if (token !== undefined && !allowed) router.replace("/login");
  }, [allowed, token, router]);
  if (!allowed) return <PageSkeleton />;
  return children;
}
