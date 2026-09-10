"use client";

import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import api from "@/src/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { errorMessage } from "@/src/lib/errors";

type Product = {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  categoryId?: number;
  supplierId?: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
  supplier?: {
    id: number;
    name: string;
  } | null;
};

type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

type EditFormData = {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  supplierId: string;
  costPrice: string;
  sellingPrice: string;
  currentStock: string;
  minStockLevel: string;
  unit: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const query = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
        api.get("/suppliers"),
      ]);

      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(
        Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
      );
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
    } catch (error) {
      console.error("Error fetching products data:", error);
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(query.get("q") || "");
    setLowStockOnly(query.get("stock") === "low");
    fetchData();
  }, [query]);

  const categoryOptions = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((category) => map.set(category.id, category));
    return Array.from(map.values());
  }, [categories]);

  const supplierOptions = useMemo(() => {
    const map = new Map<number, Supplier>();
    suppliers.forEach((supplier) => map.set(supplier.id, supplier));
    return Array.from(map.values());
  }, [suppliers]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory
        ? String(product.category?.id) === selectedCategory
        : true;

      const matchesSupplier = selectedSupplier
        ? String(product.supplier?.id) === selectedSupplier
        : true;

      const matchesLowStock = lowStockOnly
        ? product.currentStock <= product.minStockLevel
        : true;

      return (
        matchesSearch && matchesCategory && matchesSupplier && matchesLowStock
      );
    });
  }, [products, searchTerm, selectedCategory, selectedSupplier, lowStockOnly]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedSupplier("");
    setLowStockOnly(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "SKU",
      "Category",
      "Supplier",
      "Cost Price",
      "Selling Price",
      "Current Stock",
      "Min Stock Level",
      "Unit",
      "Status",
    ];

    const rows = filteredProducts.map((product) => {
      const isLowStock = product.currentStock <= product.minStockLevel;

      return [
        product.id,
        product.name,
        product.sku,
        product.category?.name ?? "",
        product.supplier?.name ?? "",
        product.costPrice,
        product.sellingPrice,
        product.currentStock,
        product.minStockLevel,
        product.unit,
        isLowStock ? "Low Stock" : "Healthy",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openEditModal = (product: Product) => {
    setEditFormData({
      id: product.id,
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      description: product.description || "",
      categoryId: String(product.category?.id ?? ""),
      supplierId: String(product.supplier?.id ?? ""),
      costPrice: String(product.costPrice ?? ""),
      sellingPrice: String(product.sellingPrice ?? ""),
      currentStock: String(product.currentStock ?? ""),
      minStockLevel: String(product.minStockLevel ?? ""),
      unit: product.unit || "pcs",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditFormData(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!editFormData) return;

    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      setEditLoading(true);

      await api.put(`/products/${editFormData.id}`, {
        name: editFormData.name,
        sku: editFormData.sku,
        barcode: editFormData.barcode || null,
        description: editFormData.description || null,
        categoryId: Number(editFormData.categoryId),
        supplierId: editFormData.supplierId
          ? Number(editFormData.supplierId)
          : null,
        costPrice: Number(editFormData.costPrice),
        sellingPrice: Number(editFormData.sellingPrice),
        currentStock: Number(editFormData.currentStock),
        minStockLevel: Number(editFormData.minStockLevel),
        unit: editFormData.unit,
      });

      toast.success("Product updated successfully");
      closeEditModal();
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`,
    );

    if (!confirmed) return;

    try {
      const res = await api.delete(`/products/${id}`);
      toast.success(
        res.data.message || `Product "${name}" deleted successfully.`,
      );
      fetchData();
    } catch (error: unknown) {
      const backendMessage = errorMessage(error, "");

      if (
        backendMessage.includes(
          "linked to purchases, sales, or stock history",
        ) ||
        backendMessage.includes(
          "violates RESTRICT setting of foreign key constraint",
        ) ||
        backendMessage.includes("is referenced from table") ||
        backendMessage.includes("PurchaseItem_productId_fkey") ||
        backendMessage.includes("SaleItem") ||
        backendMessage.includes("StockMovement")
      ) {
        toast.error(
          `Cannot delete "${name}" because it is already linked to purchases, sales, or stock history.`,
        );
        return;
      }

      if (backendMessage.includes("Product not found")) {
        toast.error(`Product "${name}" was not found.`);
        return;
      }

      toast.error(`Failed to delete "${name}". Please try again.`);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="legacy-page min-h-screen p-8">
      <h1 className="mb-6 text-4xl font-bold">Products</h1>

      <div className="mb-6 rounded-2xl bg-white p-5 text-black shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold">Search & Filters</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              className="mb-2 block font-medium"
              htmlFor="products-field-1"
            >
              Search
            </label>
            <input
              id="products-field-1"
              type="text"
              placeholder="Search by name or SKU"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label
              className="mb-2 block font-medium"
              htmlFor="products-field-2"
            >
              Category
            </label>
            <select
              id="products-field-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-2 block font-medium"
              htmlFor="products-field-3"
            >
              Supplier
            </label>
            <select
              id="products-field-3"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">All Suppliers</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span className="font-medium">Low stock only</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Export CSV
            </button>

            <button
              onClick={clearFilters}
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-zinc-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white text-black shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Cost Price</th>
              <th className="p-4">Selling Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Min Stock</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-6 text-center text-gray-500">
                  No matching products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock =
                  product.currentStock <= product.minStockLevel;

                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{product.id}</td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">{product.sku}</td>
                    <td className="p-4">{product.category?.name ?? "-"}</td>
                    <td className="p-4">{product.supplier?.name ?? "-"}</td>
                    <td className="p-4">{formatCurrency(product.costPrice)}</td>
                    <td className="p-4">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="p-4">{product.currentStock}</td>
                    <td className="p-4">{product.minStockLevel}</td>
                    <td className="p-4">{product.unit}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          isLowStock
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLowStock ? "Low Stock" : "Healthy"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 text-black shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Product</h2>
              <button
                onClick={closeEditModal}
                className="rounded-lg bg-zinc-200 px-4 py-2 hover:bg-zinc-300"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleUpdateProduct}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-4"
                >
                  Name
                </label>
                <input
                  id="products-field-4"
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-5"
                >
                  SKU
                </label>
                <input
                  id="products-field-5"
                  type="text"
                  name="sku"
                  value={editFormData.sku}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-6"
                >
                  Barcode
                </label>
                <input
                  id="products-field-6"
                  type="text"
                  name="barcode"
                  value={editFormData.barcode}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-7"
                >
                  Category
                </label>
                <select
                  id="products-field-7"
                  name="categoryId"
                  value={editFormData.categoryId}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-8"
                >
                  Supplier
                </label>
                <select
                  id="products-field-8"
                  name="supplierId"
                  value={editFormData.supplierId}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Select supplier</option>
                  {supplierOptions.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-9"
                >
                  Cost Price
                </label>
                <input
                  id="products-field-9"
                  type="number"
                  name="costPrice"
                  value={editFormData.costPrice}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-10"
                >
                  Selling Price
                </label>
                <input
                  id="products-field-10"
                  type="number"
                  name="sellingPrice"
                  value={editFormData.sellingPrice}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-11"
                >
                  Current Stock
                </label>
                <input
                  id="products-field-11"
                  type="number"
                  name="currentStock"
                  value={editFormData.currentStock}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-12"
                >
                  Min Stock Level
                </label>
                <input
                  id="products-field-12"
                  type="number"
                  name="minStockLevel"
                  value={editFormData.minStockLevel}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-13"
                >
                  Unit
                </label>
                <input
                  id="products-field-13"
                  type="text"
                  name="unit"
                  value={editFormData.unit}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="mb-2 block font-medium"
                  htmlFor="products-field-14"
                >
                  Description
                </label>
                <textarea
                  id="products-field-14"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  rows={4}
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Update Product"}
                </button>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg bg-zinc-200 px-6 py-3 hover:bg-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
