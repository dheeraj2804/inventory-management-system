"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import { errorMessage } from "@/src/lib/errors";

type Category = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
};

type EditFormData = {
  id: number;
  name: string;
  description: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/categories", {
        name,
        description,
      });

      setName("");
      setDescription("");
      toast.success("Category created successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditFormData({
      id: category.id,
      name: category.name || "",
      description: category.description || "",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditFormData(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!editFormData) return;

    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      setEditLoading(true);

      await api.put(`/categories/${editFormData.id}`, {
        name: editFormData.name,
        description: editFormData.description || null,
      });

      toast.success("Category updated successfully");
      closeEditModal();
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number, categoryName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${categoryName}"?`,
    );

    if (!confirmed) return;

    try {
      const res = await api.delete(`/categories/${id}`);
      toast.success(
        res.data.message || `Category "${categoryName}" deleted successfully.`,
      );
      fetchCategories();
    } catch (error: unknown) {
      const backendMessage = errorMessage(error, "");

      if (
        backendMessage.includes("linked to one or more products") ||
        backendMessage.includes(
          "violates RESTRICT setting of foreign key constraint",
        ) ||
        backendMessage.includes("is referenced from table") ||
        backendMessage.includes("Product_categoryId_fkey") ||
        backendMessage.includes("Product")
      ) {
        toast.error(
          `Cannot delete "${categoryName}" because it is already linked to one or more products.`,
        );
        return;
      }

      if (backendMessage.includes("Category not found")) {
        toast.error(`Category "${categoryName}" was not found.`);
        return;
      }

      toast.error(`Failed to delete "${categoryName}". Please try again.`);
    }
  };

  return (
    <div className="legacy-page min-h-screen p-8">
      <h1 className="mb-6 text-4xl font-bold">Categories</h1>

      <div className="mb-8 max-w-3xl rounded-2xl bg-white p-6 text-black shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold">Add Category</h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label
              className="mb-2 block font-medium"
              htmlFor="categories-field-1"
            >
              Category Name
            </label>
            <input
              id="categories-field-1"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label
              className="mb-2 block font-medium"
              htmlFor="categories-field-2"
            >
              Description
            </label>
            <textarea
              id="categories-field-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border p-3"
              rows={4}
              placeholder="Enter category description"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Category"}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white text-black shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Created At</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{category.id}</td>
                  <td className="p-4 font-medium">{category.name}</td>
                  <td className="p-4">{category.description || "-"}</td>
                  <td className="p-4">
                    {new Date(category.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteCategory(category.id, category.name)
                        }
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 text-black shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Category</h2>
              <button
                onClick={closeEditModal}
                className="rounded-lg bg-zinc-200 px-4 py-2 hover:bg-zinc-300"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label
                  className="mb-2 block font-medium"
                  htmlFor="categories-field-3"
                >
                  Category Name
                </label>
                <input
                  id="categories-field-3"
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
                  htmlFor="categories-field-4"
                >
                  Description
                </label>
                <textarea
                  id="categories-field-4"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Update Category"}
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
