"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";

type Product = {
  id: number;
  name: string;
  sku: string;
  sellingPrice: number;
  costPrice: number;
  currentStock: number;
  unit: string;
};

type SaleItemForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

const emptyItem = (): SaleItemForm => ({
  productId: "",
  quantity: "1",
  unitPrice: "",
});

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [createdBy, setCreatedBy] = useState("1");
  const [items, setItems] = useState<SaleItemForm[]>([emptyItem()]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsRes = await api.get("/products");
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (error) {
        console.error("Error loading sales page data:", error);
        setErrorMessage("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleItemChange = (
    index: number,
    field: keyof SaleItemForm,
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
            updated.unitPrice = String(selectedProduct.sellingPrice ?? "");
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

  const saleRows = useMemo(() => {
    return items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const subtotal = quantity * unitPrice;

      const selectedProduct = products.find(
        (product) => String(product.id) === item.productId
      );

      const currentStock = selectedProduct?.currentStock ?? 0;
      const remainingStock = currentStock - quantity;
      const unitCost = selectedProduct?.costPrice ?? 0;
      const estimatedProfit = quantity * (unitPrice - unitCost);

      return {
        ...item,
        quantity,
        unitPrice,
        subtotal,
        productName: selectedProduct?.name || "",
        productSku: selectedProduct?.sku || "",
        currentStock,
        remainingStock,
        unit: selectedProduct?.unit || "pcs",
        unitCost,
        estimatedProfit,
      };
    });
  }, [items, products]);

  const totalAmount = useMemo(() => {
    return saleRows.reduce((sum, item) => sum + item.subtotal, 0);
  }, [saleRows]);

  const totalEstimatedProfit = useMemo(() => {
    return saleRows.reduce((sum, item) => sum + item.estimatedProfit, 0);
  }, [saleRows]);

  const validateForm = () => {
    if (!createdBy || Number(createdBy) <= 0) {
      return "Created By is required.";
    }

    if (items.length === 0) {
      return "At least one sale item is required.";
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const selectedProduct = products.find(
        (product) => String(product.id) === item.productId
      );

      if (!item.productId) {
        return `Please select a product in row ${i + 1}.`;
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        return `Quantity must be greater than 0 in row ${i + 1}.`;
      }

      if (!item.unitPrice || Number(item.unitPrice) < 0) {
        return `Unit price must be valid in row ${i + 1}.`;
      }

      if (!selectedProduct) {
        return `Selected product not found in row ${i + 1}.`;
      }

      if (Number(item.quantity) > selectedProduct.currentStock) {
        return `Insufficient stock in row ${i + 1}. Available: ${selectedProduct.currentStock}, Requested: ${item.quantity}.`;
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
        customerName: customerName.trim() || null,
        createdBy: Number(createdBy),
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const res = await api.post("/sales", payload);

      setSuccessMessage(res.data?.message || "Sale created successfully.");
      setCustomerName("");
      setItems([emptyItem()]);

      const productsRes = await api.get("/products");
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (error: any) {
      console.error("Error creating sale:", error);
      setErrorMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to create sale."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading sales page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Create Sale</h1>
            <p className="mt-2 text-zinc-400">
              Sell products, reduce stock automatically, and track estimated profit.
            </p>
          </div>

          <Link
            href="/sales/history"
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Go to Sales History
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
            <h2 className="mb-5 text-2xl font-bold">Sale Details</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name (optional)"
                  className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                />
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
                <h3 className="text-xl font-bold">Sale Items</h3>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {saleRows.map((item, index) => {
                  const stockExceeded = item.quantity > item.currentStock;

                  return (
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
                          <label className="mb-2 block font-medium">Unit Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={items[index].unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <InfoCard label="SKU" value={item.productSku || "-"} />
                        <InfoCard label="Current Stock" value={String(item.currentStock)} />
                        <InfoCard
                          label="Remaining Stock"
                          value={String(item.remainingStock)}
                          valueClassName={
                            stockExceeded ? "text-red-600 font-bold" : undefined
                          }
                        />
                        <InfoCard label="Unit" value={item.unit} />
                        <InfoCard
                          label="Subtotal"
                          value={`$${item.subtotal.toFixed(2)}`}
                        />
                        <InfoCard
                          label="Est. Profit"
                          value={`$${item.estimatedProfit.toFixed(2)}`}
                          valueClassName={
                            item.estimatedProfit < 0
                              ? "text-red-600 font-bold"
                              : "text-green-600 font-bold"
                          }
                        />
                      </div>

                      {stockExceeded ? (
                        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                          Requested quantity exceeds available stock.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Sale Summary</h2>

              <div className="space-y-4">
                <InfoCard
                  label="Customer"
                  value={customerName.trim() || "Walk-in Customer"}
                />
                <InfoCard label="Total Items" value={String(items.length)} />
                <InfoCard label="Grand Total" value={`$${totalAmount.toFixed(2)}`} />
                <InfoCard
                  label="Estimated Profit"
                  value={`$${totalEstimatedProfit.toFixed(2)}`}
                  valueClassName={
                    totalEstimatedProfit < 0
                      ? "text-red-600 font-bold"
                      : "text-green-600 font-bold"
                  }
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
                  {submitting ? "Creating Sale..." : "Create Sale"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerName("");
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
                <li>Creates a sale entry</li>
                <li>Creates sale item records</li>
                <li>Reduces product stock</li>
                <li>Logs stock movement automatically</li>
                <li>Tracks profit per sale item</li>
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
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClassName || ""}`}>{value}</p>
    </div>
  );
}