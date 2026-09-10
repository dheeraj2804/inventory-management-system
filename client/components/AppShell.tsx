"use client";

import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthGuard>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#18181b",
            color: "#ffffff",
            border: "1px solid #3f3f46",
          },
          success: {
            duration: 2500,
          },
          error: {
            duration: 4000,
          },
        }}
      />

      {isLoginPage ? (
        children
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
      )}
    </AuthGuard>
  );
}