import type { IconName } from "@/components/Icon";
export const navigation: {
  label: string;
  href: string;
  icon: IconName;
  group: string;
}[] = [
  { label: "Overview", href: "/dashboard", icon: "grid", group: "Workspace" },
  { label: "Products", href: "/products", icon: "box", group: "Workspace" },
  {
    label: "Categories",
    href: "/categories",
    icon: "layers",
    group: "Workspace",
  },
  { label: "Suppliers", href: "/suppliers", icon: "truck", group: "Workspace" },
  {
    label: "New purchase",
    href: "/purchases",
    icon: "in",
    group: "Operations",
  },
  {
    label: "Purchase history",
    href: "/purchases/history",
    icon: "history",
    group: "Operations",
  },
  { label: "New sale", href: "/sales", icon: "out", group: "Operations" },
  {
    label: "Sales history",
    href: "/sales/history",
    icon: "history",
    group: "Operations",
  },
  {
    label: "Stock movements",
    href: "/stock-movements",
    icon: "activity",
    group: "Operations",
  },
  {
    label: "Add product",
    href: "/products/add",
    icon: "plus",
    group: "Actions",
  },
];
