import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching categories",
      error,
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({
      message: "Error creating category",
      error,
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return res.status(200).json(updatedCategory);
  } catch (error) {
    return res.status(500).json({
      message: "Error updating category",
      error,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
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
          "Cannot delete category because it is already linked to one or more products.",
      });
    }

    return res.status(500).json({
      message: "Error deleting category",
      error,
    });
  }
};