"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";

type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

type FormDataType = {
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

const initialFormData: FormDataType = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  categoryId: "",
  supplierId: "",
  costPrice: "",
  sellingPrice: "",
  currentStock: "",
  minStockLevel: "",
  unit: "pcs",
};

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<FormDataType>(initialFormData);

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);
        const [categoriesRes, suppliersRes] = await Promise.all([
          api.get("/categories"),
          api.get("/suppliers"),
        ]);

        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
      } catch (error) {
        console.error("Error loading categories/suppliers:", error);
        setErrorMessage("Failed to load categories or suppliers.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  const parsedValues = useMemo(() => {
    return {
      costPrice: Number(formData.costPrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      currentStock: Number(formData.currentStock || 0),
      minStockLevel: Number(formData.minStockLevel || 0),
    };
  }, [
    formData.costPrice,
    formData.sellingPrice,
    formData.currentStock,
    formData.minStockLevel,
  ]);

  const profitPerUnit =
    parsedValues.sellingPrice > 0 || parsedValues.costPrice > 0
      ? parsedValues.sellingPrice - parsedValues.costPrice
      : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Product name is required.";
    if (!formData.sku.trim()) return "SKU is required.";
    if (!formData.categoryId) return "Category is required.";
    if (parsedValues.costPrice < 0) return "Cost price cannot be negative.";
    if (parsedValues.sellingPrice < 0) return "Selling price cannot be negative.";
    if (parsedValues.currentStock < 0) return "Current stock cannot be negative.";
    if (parsedValues.minStockLevel < 0) return "Minimum stock level cannot be negative.";

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

    setSubmitting(true);

    try {
      await api.post("/products", {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || null,
        description: formData.description.trim() || null,
        categoryId: Number(formData.categoryId),
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        costPrice: parsedValues.costPrice,
        sellingPrice: parsedValues.sellingPrice,
        currentStock: parsedValues.currentStock,
        minStockLevel: parsedValues.minStockLevel,
        unit: formData.unit.trim() || "pcs",
      });

      setSuccessMessage("Product created successfully.");

      setTimeout(() => {
        router.push("/products");
      }, 800);
    } catch (error: any) {
      console.error("Error creating product:", error);
      setErrorMessage(
        error?.response?.data?.message || "Failed to create product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading add product page...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Add Product</h1>
            <p className="mt-2 text-zinc-400">
              Create a new inventory item and assign it to a category and supplier.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/products")}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Back to Products
          </button>
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

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-3"
        >
          <div className="xl:col-span-2 rounded-3xl bg-white p-6 text-black shadow-lg">
            <h2 className="mb-5 text-2xl font-bold">Product Details</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
              />

              <Input
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                placeholder="Enter SKU"
              />

              <Input
                label="Barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Enter barcode"
              />

              <Input
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                placeholder="pcs"
              />

              <SelectField
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                options={categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                placeholder="Select category"
              />

              <SelectField
                label="Supplier"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                options={suppliers.map((supplier) => ({
                  value: String(supplier.id),
                  label: supplier.name,
                }))}
                placeholder="Select supplier"
              />

              <NumberInput
                label="Cost Price"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />

              <NumberInput
                label="Selling Price"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />

              <NumberInput
                label="Current Stock"
                name="currentStock"
                value={formData.currentStock}
                onChange={handleChange}
                required
                min="0"
                step="1"
                placeholder="0"
              />

              <NumberInput
                label="Minimum Stock Level"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                required
                min="0"
                step="1"
                placeholder="0"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Enter product description"
                className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 text-black shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Quick Summary</h2>

              <div className="space-y-4">
                <SummaryRow
                  label="Expected Profit / Unit"
                  value={`$${profitPerUnit.toFixed(2)}`}
                />
                <SummaryRow
                  label="Initial Stock Value"
                  value={`$${(parsedValues.currentStock * parsedValues.costPrice).toFixed(2)}`}
                />
                <SummaryRow
                  label="Reorder Warning At"
                  value={`${parsedValues.minStockLevel} ${formData.unit || "pcs"}`}
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
                  {submitting ? "Creating Product..." : "Create Product"}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(initialFormData)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-black transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
      />
    </div>
  );
}

function NumberInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 p-3 outline-none transition focus:border-black"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}