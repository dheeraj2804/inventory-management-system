import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching products",
      error,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      supplierId,
      costPrice,
      sellingPrice,
      currentStock,
      minStockLevel,
      unit,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode,
        description,
        categoryId: Number(categoryId),
        supplierId: supplierId ? Number(supplierId) : null,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock),
        minStockLevel: Number(minStockLevel),
        unit,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({
      message: "Error creating product",
      error,
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const {
      name,
      sku,
      barcode,
      description,
      categoryId,
      supplierId,
      costPrice,
      sellingPrice,
      currentStock,
      minStockLevel,
      unit,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        barcode,
        description,
        categoryId: Number(categoryId),
        supplierId: supplierId ? Number(supplierId) : null,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock),
        minStockLevel: Number(minStockLevel),
        unit,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    return res.status(500).json({
      message: "Error updating product",
      error,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Product deleted successfully",
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
          "Cannot delete product because it is already linked to purchases, sales, or stock history.",
      });
    }

    return res.status(500).json({
      message: "Error deleting product",
    });
  }
};