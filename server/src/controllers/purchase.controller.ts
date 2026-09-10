import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getPurchases = async (_req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        purchaseDate: "desc",
      },
    });

    return res.status(200).json(purchases);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching purchases",
      error,
    });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const { supplierId, createdBy, items } = req.body;

    if (!supplierId || !createdBy || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "supplierId, createdBy, and items are required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      for (const item of items) {
        totalAmount += Number(item.quantity) * Number(item.unitCost);
      }

      const purchase = await tx.purchase.create({
        data: {
          supplierId: Number(supplierId),
          createdBy: Number(createdBy),
          totalAmount,
        },
      });

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unitCost);
        const subtotal = quantity * unitCost;

        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId,
            quantity,
            unitCost,
            subtotal,
          },
        });

        const existingProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!existingProduct) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: existingProduct.currentStock + quantity,
            costPrice: unitCost,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId,
            movementType: "IN",
            quantity,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            note: `Stock added from purchase #${purchase.id}`,
            createdBy: Number(createdBy),
          },
        });
      }

      return purchase;
    });

    return res.status(201).json({
      message: "Purchase created successfully",
      purchase: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating purchase",
      error: error instanceof Error ? error.message : error,
    });
  }
};