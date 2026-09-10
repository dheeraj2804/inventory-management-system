import "./globals.css";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Inventory Management System",
  description: "Inventory dashboard app",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}