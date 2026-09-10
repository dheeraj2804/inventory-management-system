"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import api from "@/src/lib/api";

type Supplier = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
};

type EditFormData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const createSupplier = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await api.post("/suppliers", {
      name,
      email,
      phone,
      address,
    });

    setName("");
    setEmail("");
    setPhone("");
    setAddress("");

    toast.success("Supplier created successfully");
    fetchSuppliers();
  } catch (error) {
    console.error("Error creating supplier:", error);
    toast.error("Failed to create supplier.");
  }
};

  const openEditModal = (supplier: Supplier) => {
    setEditFormData({
      id: supplier.id,
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditFormData(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editFormData) return;

    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editFormData) return;

  try {
    setEditLoading(true);

    await api.put(`/suppliers/${editFormData.id}`, {
      name: editFormData.name,
      email: editFormData.email || null,
      phone: editFormData.phone || null,
      address: editFormData.address || null,
    });

    toast.success("Supplier updated successfully");
    closeEditModal();
    fetchSuppliers();
  } catch (error) {
    console.error("Error updating supplier:", error);
    toast.error("Failed to update supplier.");
  } finally {
    setEditLoading(false);
  }
};

 const handleDeleteSupplier = async (id: number, supplierName: string) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${supplierName}"?`
  );

  if (!confirmed) return;

  try {
    const res = await api.delete(`/suppliers/${id}`);
    toast.success(
      res.data.message || `Supplier "${supplierName}" deleted successfully.`
    );
    fetchSuppliers();
  } catch (error: any) {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error?.cause?.originalMessage ||
      error?.response?.data?.error?.message ||
      "";

    if (
      backendMessage.includes("linked to products or purchases") ||
      backendMessage.includes("violates RESTRICT setting of foreign key constraint") ||
      backendMessage.includes("is referenced from table") ||
      backendMessage.includes("Product_supplierId_fkey") ||
      backendMessage.includes("Purchase_supplierId_fkey") ||
      backendMessage.includes("Product") ||
      backendMessage.includes("Purchase")
    ) {
      toast.error(
        `Cannot delete "${supplierName}" because it is already linked to products or purchases.`
      );
      return;
    }

    if (backendMessage.includes("Supplier not found")) {
      toast.error(`Supplier "${supplierName}" was not found.`);
      return;
    }

    toast.error(`Failed to delete "${supplierName}". Please try again.`);
  }
};

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <h1 className="mb-6 text-4xl font-bold">Suppliers</h1>

      <div className="mb-8 max-w-3xl rounded-2xl bg-white p-6 text-black shadow-lg">
        <h2 className="mb-4 text-2xl font-semibold">Add Supplier</h2>

        <form onSubmit={createSupplier} className="space-y-4">
          <input
            className="w-full rounded-lg border p-3"
            placeholder="Supplier Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="w-full rounded-lg border p-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-3"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <textarea
            className="w-full rounded-lg border p-3"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
          />

          <button className="rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800">
            Create Supplier
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white text-black shadow-lg">
        <table className="min-w-full">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Phone</th>
              <th className="p-4 text-left">Address</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{supplier.id}</td>
                  <td className="p-4 font-medium">{supplier.name}</td>
                  <td className="p-4">{supplier.email || "-"}</td>
                  <td className="p-4">{supplier.phone || "-"}</td>
                  <td className="p-4">{supplier.address || "-"}</td>
                  <td className="p-4">
                    {new Date(supplier.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteSupplier(supplier.id, supplier.name)
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
              <h2 className="text-2xl font-bold">Edit Supplier</h2>
              <button
                onClick={closeEditModal}
                className="rounded-lg bg-zinc-200 px-4 py-2 hover:bg-zinc-300"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Supplier Name</label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Email</label>
                <input
                  type="text"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Address</label>
                <textarea
                  name="address"
                  value={editFormData.address}
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
                  {editLoading ? "Updating..." : "Update Supplier"}
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