"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  costPrice: number;
  currentStock: number;
  unit: string;
};

type PurchaseItemForm = {
  productId: string;
  quantity: string;
  unitCost: string;
};

const emptyItem = (): PurchaseItemForm => ({
  productId: "",
  quantity: "1",
  unitCost: "",
});

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [createdBy, setCreatedBy] = useState("1");
  const [items, setItems] = useState<PurchaseItemForm[]>([emptyItem()]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [suppliersRes, productsRes] = await Promise.all([
          api.get("/suppliers"),
          api.get("/products"),
        ]);

        setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (error) {
        console.error("Error loading purchase page data:", error);
        setErrorMessage("Failed to load suppliers or products.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItemForm,
    value: string
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        if (field === "productId") {
          const selectedProduct = products.find(
            (product) => String(product.id) === value
          );

          if (selectedProduct) {
            updated.unitCost = String(selectedProduct.costPrice ?? "");
          }
        }

        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const purchaseRows = useMemo(() => {
    return items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitCost = Number(item.unitCost || 0);
      const subtotal = quantity * unitCost;

      const selectedProduct = products.find(
        (product) => String(product.id) === item.productId
      );

      return {
        ...item,
        quantity,
        unitCost,
        subtotal,
        productName: selectedProduct?.name || "",
        productSku: selectedProduct?.sku || "",
        currentStock: selectedProduct?.currentStock ?? 0,
        unit: selectedProduct?.unit || "pcs",
      };
    });
  }, [items, products]);

  const totalAmount = useMemo(() => {
    return purchaseRows.reduce((sum, item) => sum + item.subtotal, 0);
  }, [purchaseRows]);

  const validateForm = () => {
    if (!supplierId) return "Please select a supplier.";
    if (!createdBy || Number(createdBy) <= 0) return "Created By is required.";
    if (items.length === 0) return "At least one purchase item is required.";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.productId) {
        return `Please select a product in row ${i + 1}.`;
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        return `Quantity must be greater than 0 in row ${i + 1}.`;
      }

      if (!item.unitCost || Number(item.unitCost) < 0) {
        return `Unit cost must be valid in row ${i + 1}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        supplierId: Number(supplierId),
        createdBy: Number(createdBy),
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      };

      const res = await api.post("/purchases", payload);

      setSuccessMessage(res.data?.message || "Purchase created successfully.");
      setSupplierId("");
      setItems([emptyItem()]);
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create purchase."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading purchases page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Create Purchase</h1>
            <p className="mt-2 text-zinc-400">
              Add supplier purchases and automatically increase inventory stock.
            </p>
          </div>

          <Link
            href="/purchases/history"
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Go to Purchase History
          </Link>
        </div>

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-5 rounded-2xl border border-green-800 bg-green-950/50 px-4 py-3 text-green-200">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-3xl bg-white p-6 text-black shadow-lg">
            <h2 className="mb-5 text-2xl font-bold">Purchase Details</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-medium">Created By (User ID)</label>
                <input
                  type="number"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Purchase Items</h3>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {purchaseRows.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Item #{index + 1}</h4>

                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length === 1}
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="xl:col-span-2">
                        <label className="mb-2 block font-medium">Product</label>
                        <select
                          value={items[index].productId}
                          onChange={(e) =>
                            handleItemChange(index, "productId", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                          required
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block font-medium">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={items[index].quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-medium">Unit Cost</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={items[index].unitCost}
                          onChange={(e) =>
                            handleItemChange(index, "unitCost", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <InfoCard label="SKU" value={item.productSku || "-"} />
                      <InfoCard label="Current Stock" value={String(item.currentStock)} />
                      <InfoCard label="Unit" value={item.unit} />
                      <InfoCard
                        label="Subtotal"
                        value={`$${item.subtotal.toFixed(2)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Purchase Summary</h2>

              <div className="space-y-4">
                <InfoCard
                  label="Selected Supplier"
                  value={
                    suppliers.find((supplier) => String(supplier.id) === supplierId)?.name ||
                    "-"
                  }
                />
                <InfoCard label="Total Items" value={String(items.length)} />
                <InfoCard
                  label="Grand Total"
                  value={`$${totalAmount.toFixed(2)}`}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Actions</h2>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Creating Purchase..." : "Create Purchase"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSupplierId("");
                    setItems([emptyItem()]);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset Form
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">What this does</h2>

              <ul className="space-y-2 text-sm text-slate-700">
                <li>Creates a purchase entry</li>
                <li>Creates purchase item records</li>
                <li>Increases product stock</li>
                <li>Logs stock movement automatically</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}