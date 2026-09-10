import type { DemoStore, Item, Product, Transaction } from "./demo";

/** Add a larger sample history once, without resetting existing demo edits. */
export function expandDemoStore(store: DemoStore, now = new Date()): DemoStore {
  if (store.expansionVersion === 1) return store;
  const nextId = (rows: { id: number }[]) =>
    Math.max(0, ...rows.map((row) => row.id)) + 1;
  const money = (value: number) => Math.round(value * 100) / 100;
  const at = (days: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    date.setHours(hour, days % 60, 0, 0);
    // Keep today's examples at or before the time the workspace is populated.
    return new Date(Math.min(date.getTime(), now.getTime())).toISOString();
  };
  const groups = [
    "Office & Tech",
    "Warehouse equipment",
    "Cleaning supplies",
    "Packaging",
  ];
  const categoryIds = groups.map((name) => {
    const existing = store.categories.find(
      (category) => category.name === name,
    );
    if (existing) return existing.id;
    const id = nextId(store.categories);
    store.categories.push({
      id,
      name,
      description: "Sample products for testing StockSync.",
      createdAt: at(100, 9),
    });
    return id;
  });
  const supplierIds = [
    "Clearview Office Supply",
    "Harbor Warehouse Goods",
    "Evergreen Janitorial",
    "ParcelWorks Packaging",
  ].map((name, index) => {
    const existing = store.suppliers.find((supplier) => supplier.name === name);
    if (existing) return existing.id;
    const id = nextId(store.suppliers);
    store.suppliers.push({
      id,
      name,
      email: `orders@stocksync-sample-${index + 1}.example`,
      phone: `555-012${index}`,
      address: "Fictional supplier · Sample data",
      createdAt: at(100, 9),
    });
    return id;
  });
  const catalog: [string, number, number, number][] = [
    ["Wireless keyboard", 0, 19, 34],
    ["USB-C hub · 7 port", 0, 24, 45],
    ["Desk organizer", 0, 8, 18],
    ["Thermal label printer", 0, 95, 159],
    ["Barcode scanner", 0, 42, 79],
    ["Shipping label rolls · 6 pack", 0, 12, 25],
    ["Storage bin · 40 L", 1, 9, 19],
    ["Steel shelf brackets · Pair", 1, 7, 16],
    ["Pallet wrap dispenser", 1, 18, 35],
    ["Hand truck · Folding", 1, 55, 99],
    ["Warehouse floor tape", 1, 8, 17],
    ["Picking tote · Stackable", 1, 11, 23],
    ["Microfiber cloths · 12 pack", 2, 6, 14],
    ["All-purpose cleaner · 1 gal", 2, 9, 20],
    ["Commercial mop head", 2, 7, 16],
    ["Push broom · 24 in", 2, 14, 29],
    ["Hand soap refill · 1 gal", 2, 8, 18],
    ["Spill absorbent pads · 50 pack", 2, 21, 42],
    ["Shipping boxes · Medium · 25 pack", 3, 18, 35],
    ["Bubble mailers · 50 pack", 3, 11, 24],
    ["Packing tape · 6 pack", 3, 9, 19],
    ["Kraft paper roll", 3, 13, 27],
    ["Stretch wrap · 1500 ft", 3, 17, 34],
    ["Fragile labels · 500 roll", 3, 5, 12],
  ];
  const added: Product[] = catalog.map(
    ([name, group, costPrice, sellingPrice], index) => {
      const product: Product = {
        id: nextId(store.products),
        name,
        sku: `SS-DEMO-${1001 + index}`,
        categoryId: categoryIds[group],
        supplierId: supplierIds[group],
        costPrice,
        sellingPrice,
        currentStock: 0,
        minStockLevel: 12,
        unit: "pcs",
        description: "Fictional product for exploring StockSync workflows.",
        createdAt: at(100, 9),
      };
      store.products.push(product);
      return product;
    },
  );
  const record = (
    kind: "purchases" | "sales",
    lines: { product: Product; quantity: number }[],
    days: number,
    order: number,
  ) => {
    const id = nextId(store[kind]);
    const date = at(days, kind === "purchases" ? 9 : 13 + order);
    const items: Item[] = lines.map(({ product, quantity }, index) => {
      const price =
        kind === "purchases" ? product.costPrice : product.sellingPrice;
      return {
        id: index + 1,
        productId: product.id,
        quantity,
        subtotal: money(quantity * price),
        ...(kind === "purchases"
          ? { purchaseId: id, unitCost: price }
          : {
              saleId: id,
              unitPrice: price,
              unitCostAtSale: product.costPrice,
              profit: money(quantity * (price - product.costPrice)),
            }),
      };
    });
    const transaction: Transaction = {
      id,
      items,
      createdBy: 1,
      totalAmount: money(
        items.reduce((total, item) => total + item.subtotal, 0),
      ),
      ...(kind === "purchases"
        ? { supplierId: lines[0].product.supplierId!, purchaseDate: date }
        : {
            customerName: [
              "Cedar Studio",
              "Bluebird Retail",
              "Maple Street Workshop",
              "Northstar Projects",
              "Walk-in customer",
              "Beacon Service Group",
            ][(days + order) % 6],
            saleDate: date,
          }),
    };
    store[kind].push(transaction);
    for (const { product, quantity } of lines) {
      product.currentStock += kind === "purchases" ? quantity : -quantity;
      store.movements.push({
        id: nextId(store.movements),
        productId: product.id,
        quantity,
        movementType: kind === "purchases" ? "IN" : "OUT",
        referenceType: kind === "purchases" ? "PURCHASE" : "SALE",
        referenceId: id,
        createdBy: 1,
        createdAt: date,
        note: `Sample ${kind === "purchases" ? "receipt" : "order"} #${id}`,
      });
    }
  };
  for (const [index, product] of added.entries())
    record("purchases", [{ product, quantity: 80 + index * 2 }], 91, 0);
  for (let day = 89; day >= 0; day--) {
    const index = day % added.length;
    // The two products on each purchase belong to the same sample supplier.
    const groupStart = Math.floor(index / 6) * 6;
    record(
      "purchases",
      [
        { product: added[index], quantity: 10 + (day % 13) },
        {
          product: added[groupStart + ((index + 1) % 6)],
          quantity: 8 + (day % 9),
        },
      ],
      day,
      0,
    );
    for (let order = 0; order < 2; order++) {
      const first = added[(day * 7 + order * 3) % added.length];
      const second = added[(day * 7 + order * 3 + 11) % added.length];
      const lines = [
        { product: first, quantity: 1 + ((day + order) % 5) },
        { product: second, quantity: 1 + (day % 4) },
      ];
      if (lines.some((line) => line.product.currentStock < line.quantity))
        throw new Error("Sample history would oversell a product.");
      record("sales", lines, day, order);
    }
  }
  store.expansionVersion = 1;
  return store;
}
