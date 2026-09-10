import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoStore, demoRequest } from "../src/lib/demo.ts";
const make = () => createDemoStore(new Date("2026-09-10T12:00:00Z"));
const request = (s, path, items, extra = {}) =>
  demoRequest(s, "post", path, { items, createdBy: 1, ...extra });
test("sample balances reconcile with movements, totals, and historical profit", () => {
  const s = make();
  assert.equal(s.products.length, 24);
  assert.equal(s.categories.length, 6);
  assert.equal(s.suppliers.length, 4);
  for (const p of s.products) {
    assert.equal(
      p.currentStock,
      s.movements
        .filter((m) => m.productId === p.id)
        .reduce(
          (n, m) => n + (m.movementType === "IN" ? m.quantity : -m.quantity),
          0,
        ),
    );
    assert.ok(p.currentStock >= 0);
  }
  const summary = demoRequest(s, "get", "/dashboard/summary");
  assert.equal(summary.lowStockCount, 4);
  assert.equal(
    summary.totalSalesAmount,
    Math.round(s.sales.reduce((n, t) => n + t.totalAmount, 0) * 100) / 100,
  );
  assert.ok(
    s.purchases.some((t) => new Date(t.purchaseDate) > new Date("2026-09-01")),
  );
});
test("purchase and sale persist line details, stock and profit together", () => {
  const s = make(),
    p = s.products[0];
  assert.equal(p.currentStock, 0);
  request(s, "/purchases", [{ productId: p.id, quantity: 10, unitCost: 12 }], {
    supplierId: 1,
  });
  assert.equal(p.currentStock, 10);
  assert.equal(p.costPrice, 12);
  request(s, "/sales", [{ productId: p.id, quantity: 3, unitPrice: 20 }]);
  assert.equal(p.currentStock, 7);
  assert.equal(s.sales.at(-1).items[0].profit, 24);
  request(s, "/purchases", [{ productId: p.id, quantity: 1, unitCost: 15 }], {
    supplierId: 1,
  });
  assert.equal(s.sales.at(-1).items[0].unitCostAtSale, 12);
});
test("duplicate sale lines cannot oversell and failure leaves the workspace untouched", () => {
  const s = make(),
    p = s.products.find((p) => p.currentStock > 0),
    before = JSON.stringify(s);
  assert.throws(
    () =>
      request(s, "/sales", [
        { productId: p.id, quantity: p.currentStock, unitPrice: 1 },
        { productId: p.id, quantity: 1, unitPrice: 1 },
      ]),
    /Insufficient/,
  );
  assert.equal(JSON.stringify(s), before);
});
test("invalid quantities, prices, products and suppliers do not partially write", () => {
  for (const row of [
    { productId: 2, quantity: -2, unitCost: 1 },
    { productId: 2, quantity: 1.5, unitCost: 1 },
    { productId: 2, quantity: 1, unitCost: -1 },
    { productId: 999, quantity: 1, unitCost: 1 },
  ]) {
    const s = make(),
      before = JSON.stringify(s);
    assert.throws(() =>
      request(
        s,
        "/purchases",
        [{ productId: 2, quantity: 1, unitCost: 1 }, row],
        { supplierId: 1 },
      ),
    );
    assert.equal(JSON.stringify(s), before);
  }
  const s = make();
  assert.throws(() =>
    request(s, "/purchases", [{ productId: 2, quantity: 1, unitCost: 1 }], {
      supplierId: 999,
    }),
  );
});
test("CRUD protects referenced records and allows new standalone categories", () => {
  const s = make();
  assert.throws(() => demoRequest(s, "delete", "/categories/1"), /linked/);
  assert.throws(() => demoRequest(s, "delete", "/products/1"), /linked/);
  const c = demoRequest(s, "post", "/categories", { name: "Test category" });
  demoRequest(s, "put", `/categories/${c.id}`, { name: "Renamed" });
  assert.equal(s.categories.at(-1).name, "Renamed");
  demoRequest(s, "delete", `/categories/${c.id}`);
  assert.equal(s.categories.length, 6);
});
test("demo stock edits generate adjustments and a fresh demo is deterministic", () => {
  const s = make(),
    p = s.products[2];
  demoRequest(s, "put", `/products/${p.id}`, {
    ...p,
    currentStock: p.currentStock + 5,
  });
  assert.equal(s.movements.at(-1).quantity, 5);
  assert.equal(s.movements.at(-1).referenceType, "ADJUSTMENT");
  assert.deepEqual(make(), make());
});
