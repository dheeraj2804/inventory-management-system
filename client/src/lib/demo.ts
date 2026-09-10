/** Browser-only sample workspace. No requests from this workspace reach the API. */
export const DEMO_KEY = "gades-demo-v1";
export const DEMO_TOKEN = "gades-local-demo";
export type Category = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
};
export type Supplier = Category & {
  email?: string;
  phone?: string;
  address?: string;
};
export type Product = {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId: number;
  supplierId: number | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  createdAt: string;
};
export type Item = {
  id: number;
  productId: number;
  quantity: number;
  subtotal: number;
  unitCost?: number;
  unitPrice?: number;
  unitCostAtSale?: number;
  profit?: number;
  purchaseId?: number;
  saleId?: number;
};
export type Transaction = {
  id: number;
  supplierId?: number;
  customerName?: string;
  totalAmount: number;
  createdBy: number;
  purchaseDate?: string;
  saleDate?: string;
  items: Item[];
};
export type Movement = {
  id: number;
  productId: number;
  movementType: string;
  quantity: number;
  referenceType: string;
  referenceId: number;
  note: string;
  createdBy: number;
  createdAt: string;
};
export type DemoStore = {
  version: 1;
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  purchases: Transaction[];
  sales: Transaction[];
  movements: Movement[];
};
const round = (n: number) => Math.round(n * 100) / 100;
const nextId = (rows: { id: number }[]) =>
  Math.max(0, ...rows.map((r) => r.id)) + 1;

export function createDemoStore(now = new Date()): DemoStore {
  const date = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(10 + (days % 7), days % 60, 0, 0);
    return d.toISOString();
  };
  const categories = [
    "Safety & PPE",
    "Electrical",
    "Hand tools",
    "Fasteners",
    "Site supplies",
    "Power tools",
  ].map((name, i) => ({
    id: i + 1,
    name,
    description: [
      "Protection for every job",
      "Connections you can count on",
      "Everyday workshop essentials",
      "Small parts. Strong foundations.",
      "Keep the job site moving",
      "Built for the heavy lifting",
    ][i],
    createdAt: date(60),
  }));
  const suppliers = [
    "Northline Industrial",
    "Summit Electrical",
    "Keystone Tools",
    "Atlas Supply Co.",
  ].map((name, i) => ({
    id: i + 1,
    name,
    email: `orders@sample-${i + 1}.example`,
    phone: `555-010${i}`,
    address: "Sample supplier · Demo data",
    description: "Sample supplier",
    createdAt: date(60),
  }));
  const catalog: [string, number, number, number][] = [
    ["Nitrile work gloves · 100 pack", 1, 12.5, 22],
    ["Safety glasses · Clear", 1, 4.2, 9.5],
    ["Hi-vis safety vest", 1, 8, 17.5],
    ["Hard hat · White", 1, 11, 24],
    ["Copper wire · 50 ft", 2, 32, 52],
    ["Duplex outlet · 15A", 2, 2.8, 6.5],
    ["LED work light", 2, 24, 42],
    ["Electrical tape · 10 pack", 2, 7, 14],
    ["Adjustable wrench · 10 in", 3, 14, 26],
    ["Precision screwdriver set", 3, 18, 34],
    ["Claw hammer · 16 oz", 3, 12, 23],
    ["Measuring tape · 25 ft", 3, 7.5, 16],
    ["Hex bolts · 50 pack", 4, 8, 15],
    ["Wood screws · 200 pack", 4, 9, 18],
    ["Wall anchors · 100 pack", 4, 5, 11],
    ["Stainless washers · 100 pack", 4, 4, 9],
    ["Heavy-duty trash bags", 5, 16, 28],
    ["Utility bucket · 5 gal", 5, 4.5, 10],
    ["Duct tape · Contractor", 5, 6, 12],
    ["Canvas tool bag", 5, 21, 39],
    ["Cordless drill · 20V", 6, 78, 129],
    ["Angle grinder · 4.5 in", 6, 45, 79],
    ["Circular saw blade", 6, 15, 29],
    ["Impact driver bit set", 6, 13, 25],
  ];
  const products = catalog.map(
    ([name, categoryId, costPrice, sellingPrice], i) => ({
      id: i + 1,
      name,
      sku: `GSC-${String(i + 1).padStart(4, "0")}`,
      categoryId,
      supplierId: (i % 4) + 1,
      costPrice,
      sellingPrice,
      currentStock: 0,
      minStockLevel: 15,
      unit: "pcs",
      description: "Sample inventory for exploring the Gades workspace.",
      createdAt: date(60),
    }),
  );
  const store: DemoStore = {
    version: 1,
    categories,
    suppliers,
    products,
    purchases: [],
    sales: [],
    movements: [],
  };
  for (const product of products) {
    const quantity = 60 + product.id * 3;
    const id = store.purchases.length + 1;
    store.purchases.push({
      id,
      supplierId: product.supplierId!,
      createdBy: 1,
      purchaseDate: date(35 + (product.id % 8)),
      totalAmount: round(quantity * product.costPrice),
      items: [
        {
          id,
          productId: product.id,
          purchaseId: id,
          quantity,
          unitCost: product.costPrice,
          subtotal: round(quantity * product.costPrice),
        },
      ],
    });
    product.currentStock = quantity;
    store.movements.push({
      id: store.movements.length + 1,
      productId: product.id,
      movementType: "IN",
      quantity,
      referenceType: "PURCHASE",
      referenceId: id,
      note: `Received purchase #${id}`,
      createdBy: 1,
      createdAt: date(35 + (product.id % 8)),
    });
  }
  for (let day = 29; day >= 0; day--) {
    const product = products[(day * 7) % products.length];
    const quantity = 2 + (day % 6);
    const id = store.sales.length + 1;
    store.sales.push({
      id,
      customerName: [
        "Oak & Stone Contractors",
        "Riverbend Workshop",
        "Westside Maintenance",
        "Walk-in customer",
      ][day % 4],
      createdBy: 1,
      saleDate: date(day),
      totalAmount: round(quantity * product.sellingPrice),
      items: [
        {
          id,
          saleId: id,
          productId: product.id,
          quantity,
          unitPrice: product.sellingPrice,
          unitCostAtSale: product.costPrice,
          subtotal: round(quantity * product.sellingPrice),
          profit: round(quantity * (product.sellingPrice - product.costPrice)),
        },
      ],
    });
    product.currentStock -= quantity;
    store.movements.push({
      id: store.movements.length + 1,
      productId: product.id,
      movementType: "OUT",
      quantity,
      referenceType: "SALE",
      referenceId: id,
      note: `Fulfilled sale #${id}`,
      createdBy: 1,
      createdAt: date(day),
    });
  }
  for (let day = 27; day >= 0; day -= 3) {
    const product = products[day % products.length],
      quantity = 8 + day,
      id = store.purchases.length + 1;
    store.purchases.push({
      id,
      supplierId: product.supplierId!,
      createdBy: 1,
      purchaseDate: date(day),
      totalAmount: round(quantity * product.costPrice),
      items: [
        {
          id,
          purchaseId: id,
          productId: product.id,
          quantity,
          unitCost: product.costPrice,
          subtotal: round(quantity * product.costPrice),
        },
      ],
    });
    product.currentStock += quantity;
    store.movements.push({
      id: store.movements.length + 1,
      productId: product.id,
      movementType: "IN",
      quantity,
      referenceType: "PURCHASE",
      referenceId: id,
      note: `Received purchase #${id}`,
      createdBy: 1,
      createdAt: date(day),
    });
  }
  // Additional fulfilled orders give the demo realistic low-stock examples.
  for (const [index, remaining] of [
    [0, 0],
    [4, 4],
    [8, 7],
    [12, 11],
  ] as const) {
    const p = products[index],
      quantity = p.currentStock - remaining,
      id = store.sales.length + 1;
    store.sales.push({
      id,
      customerName: "Summit Project Services",
      createdBy: 1,
      saleDate: date(index % 3),
      totalAmount: round(quantity * p.sellingPrice),
      items: [
        {
          id,
          saleId: id,
          productId: p.id,
          quantity,
          unitPrice: p.sellingPrice,
          unitCostAtSale: p.costPrice,
          subtotal: round(quantity * p.sellingPrice),
          profit: round(quantity * (p.sellingPrice - p.costPrice)),
        },
      ],
    });
    p.currentStock = remaining;
    store.movements.push({
      id: store.movements.length + 1,
      productId: p.id,
      movementType: "OUT",
      quantity,
      referenceType: "SALE",
      referenceId: id,
      note: `Fulfilled sale #${id}`,
      createdBy: 1,
      createdAt: date(index % 3),
    });
  }
  return store;
}

export function demoRequest(
  store: DemoStore,
  method: string,
  url: string,
  body: Record<string, unknown> = {},
): unknown {
  const parsed = new URL(url, "http://demo.local");
  const [resource, rawId] = parsed.pathname.split("/").filter(Boolean);
  const id = Number(rawId);
  const enrichedProduct = (p: Product) => ({
    ...p,
    category: store.categories.find((c) => c.id === p.categoryId),
    supplier: store.suppliers.find((s) => s.id === p.supplierId),
  });
  const enrichedTransaction = (t: Transaction) => ({
    ...t,
    supplier: store.suppliers.find((s) => s.id === t.supplierId),
    items: t.items.map((i) => ({
      ...i,
      product: store.products.find((p) => p.id === i.productId),
    })),
  });
  const transactions = (rows: Transaction[]) =>
    [...rows]
      .sort((a, b) =>
        (b.saleDate || b.purchaseDate || "").localeCompare(
          a.saleDate || a.purchaseDate || "",
        ),
      )
      .map(enrichedTransaction);
  const movements = () =>
    [...store.movements]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => ({
        ...m,
        product: store.products.find((p) => p.id === m.productId),
      }));
  const lowStockItems = store.products.filter(
    (p) => p.currentStock <= p.minStockLevel,
  );
  if (method === "get") {
    if (resource === "products") return store.products.map(enrichedProduct);
    if (resource === "categories") return store.categories;
    if (resource === "suppliers") return store.suppliers;
    if (resource === "purchases") return transactions(store.purchases);
    if (resource === "sales") return transactions(store.sales);
    if (resource === "stock-movements") return movements();
    if (resource === "dashboard") {
      if (rawId === "summary")
        return {
          totalProducts: store.products.length,
          totalCategories: store.categories.length,
          totalSuppliers: store.suppliers.length,
          totalStockUnits: store.products.reduce(
            (s, p) => s + p.currentStock,
            0,
          ),
          totalInventoryValue: round(
            store.products.reduce(
              (s, p) => s + p.currentStock * p.costPrice,
              0,
            ),
          ),
          totalPurchaseAmount: round(
            store.purchases.reduce((s, p) => s + p.totalAmount, 0),
          ),
          totalSalesAmount: round(
            store.sales.reduce((s, p) => s + p.totalAmount, 0),
          ),
          totalProfit: round(
            store.sales
              .flatMap((s) => s.items)
              .reduce((s, i) => s + (i.profit || 0), 0),
          ),
          lowStockCount: lowStockItems.length,
          lowStockItems,
        };
      if (rawId === "recent-sales")
        return transactions(store.sales).slice(0, 5);
      if (rawId === "recent-purchases")
        return transactions(store.purchases).slice(0, 5);
      if (rawId === "recent-movements") return movements().slice(0, 5);
    }
    throw new Error("This demo endpoint is not available.");
  }
  if (resource === "sales" || resource === "purchases") {
    if (method !== "post")
      throw new Error("Transaction history cannot be edited.");
    const rows = body.items as Record<string, unknown>[];
    if (!Array.isArray(rows) || !rows.length)
      throw new Error("Add at least one item.");
    if (
      resource === "purchases" &&
      !store.suppliers.some((s) => s.id === Number(body.supplierId))
    )
      throw new Error("Choose a valid supplier.");
    const requested = new Map<number, number>();
    const items: Item[] = rows.map((row, i) => {
      const p = store.products.find((p) => p.id === Number(row.productId));
      const quantity = Number(row.quantity),
        price = Number(
          resource === "sales"
            ? (row.unitPrice ?? p?.sellingPrice)
            : row.unitCost,
        );
      if (
        !p ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      )
        throw new Error(
          "Use valid products, positive whole quantities, and nonnegative prices.",
        );
      requested.set(p.id, (requested.get(p.id) || 0) + quantity);
      return {
        id: i + 1,
        productId: p.id,
        quantity,
        subtotal: round(quantity * price),
        ...(resource === "sales"
          ? {
              unitPrice: price,
              unitCostAtSale: p.costPrice,
              profit: round(quantity * (price - p.costPrice)),
            }
          : { unitCost: price }),
      };
    });
    if (resource === "sales")
      for (const [pid, qty] of requested)
        if (store.products.find((p) => p.id === pid)!.currentStock < qty)
          throw new Error("Insufficient stock. Reduce the quantity.");
    const list = store[resource],
      tid = nextId(list),
      now = new Date().toISOString();
    const transaction: Transaction = {
      id: tid,
      totalAmount: round(items.reduce((s, i) => s + i.subtotal, 0)),
      createdBy: 1,
      items: items.map((i) => ({
        ...i,
        ...(resource === "sales" ? { saleId: tid } : { purchaseId: tid }),
      })),
      ...(resource === "sales"
        ? {
            saleDate: now,
            customerName: String(body.customerName || "Walk-in customer"),
          }
        : { purchaseDate: now, supplierId: Number(body.supplierId) }),
    };
    for (const item of items) {
      const p = store.products.find((p) => p.id === item.productId)!;
      p.currentStock += resource === "sales" ? -item.quantity : item.quantity;
      if (resource === "purchases") p.costPrice = item.unitCost!;
      store.movements.push({
        id: nextId(store.movements),
        productId: p.id,
        movementType: resource === "sales" ? "OUT" : "IN",
        quantity: item.quantity,
        referenceType: resource === "sales" ? "SALE" : "PURCHASE",
        referenceId: tid,
        note: `Demo ${resource === "sales" ? "sale" : "purchase"} #${tid}`,
        createdBy: 1,
        createdAt: now,
      });
    }
    list.push(transaction);
    return {
      message: `${resource === "sales" ? "Sale" : "Purchase"} created successfully`,
      [resource === "sales" ? "sale" : "purchase"]: transaction,
    };
  }
  if (
    resource !== "products" &&
    resource !== "categories" &&
    resource !== "suppliers"
  )
    throw new Error("This demo action is not available.");
  const list = store[resource];
  const index = list.findIndex((r) => r.id === id);
  if (method !== "post" && index < 0) throw new Error("Record not found.");
  if (method === "delete") {
    if (
      resource === "products" &&
      store.movements.some((m) => m.productId === id)
    )
      throw new Error("Product is linked to stock history.");
    if (
      resource === "categories" &&
      store.products.some((p) => p.categoryId === id)
    )
      throw new Error("Category is linked to one or more products.");
    if (
      resource === "suppliers" &&
      (store.products.some((p) => p.supplierId === id) ||
        store.purchases.some((p) => p.supplierId === id))
    )
      throw new Error("Supplier is linked to products or purchases.");
    list.splice(index, 1);
    return { message: "Record deleted successfully" };
  }
  if (method !== "put" && method !== "post")
    throw new Error("Unsupported action.");
  if (!String(body.name || "").trim()) throw new Error("A name is required.");
  const record = {
    ...body,
    id: method === "post" ? nextId(list) : id,
    name: String(body.name).trim(),
    createdAt:
      method === "post" ? new Date().toISOString() : list[index].createdAt,
  };
  if (resource === "products") {
    const p = {
      ...record,
      costPrice: Number(body.costPrice),
      sellingPrice: Number(body.sellingPrice),
      currentStock: Number(body.currentStock),
      minStockLevel: Number(body.minStockLevel),
      categoryId: Number(body.categoryId),
      supplierId: body.supplierId ? Number(body.supplierId) : null,
    } as Product;
    if (
      !p.sku?.trim() ||
      !p.unit?.trim() ||
      store.products.some((x) => x.sku === p.sku && x.id !== p.id)
    )
      throw new Error("A unique SKU and unit are required.");
    if (
      !store.categories.some((c) => c.id === p.categoryId) ||
      (p.supplierId !== null &&
        !store.suppliers.some((s) => s.id === p.supplierId))
    )
      throw new Error("Choose a valid category and supplier.");
    if (
      ![p.costPrice, p.sellingPrice].every(
        (n) => Number.isFinite(n) && n >= 0,
      ) ||
      ![p.currentStock, p.minStockLevel].every(
        (n) => Number.isInteger(n) && n >= 0,
      )
    )
      throw new Error("Prices and whole stock quantities must be nonnegative.");
    const previous = method === "post" ? 0 : store.products[index].currentStock;
    if (method === "post") store.products.push(p);
    else store.products[index] = p;
    if (p.currentStock !== previous)
      store.movements.push({
        id: nextId(store.movements),
        productId: p.id,
        movementType: p.currentStock > previous ? "IN" : "OUT",
        quantity: Math.abs(p.currentStock - previous),
        referenceType: "ADJUSTMENT",
        referenceId: p.id,
        note: "Demo stock adjustment",
        createdBy: 1,
        createdAt: new Date().toISOString(),
      });
    return enrichedProduct(p);
  }
  const simpleList = store[resource];
  if (method === "post") simpleList.push(record);
  else simpleList[index] = record;
  return record;
}
