import "./globals.css";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Inventory Management System",
  description: "Gades Sales Co. inventory, purchasing, and sales workspace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
