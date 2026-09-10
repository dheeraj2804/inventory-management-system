import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(suppliers);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching suppliers",
      error,
    });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({
      message: "Error creating supplier",
      error,
    });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, address } = req.body;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    return res.status(200).json(updatedSupplier);
  } catch (error) {
    return res.status(500).json({
      message: "Error updating supplier",
      error,
    });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return res.status(404).json({
        message: "Supplier not found",
      });
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Supplier deleted successfully",
    });
  } catch (error: any) {
    const errorMessage =
      error?.cause?.originalMessage ||
      error?.message ||
      "";

    if (
      errorMessage.includes("violates RESTRICT setting of foreign key constraint") ||
      errorMessage.includes("is referenced from table")
    ) {
      return res.status(400).json({
        message:
          "Cannot delete supplier because it is already linked to products or purchases.",
      });
    }

    return res.status(500).json({
      message: "Error deleting supplier",
      error,
    });
  }
};