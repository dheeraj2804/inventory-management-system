import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getSales = async (_req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    return res.status(200).json(sales);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching sales",
      error,
    });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const { customerName, createdBy, items } = req.body;

    if (!createdBy || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "createdBy and items are required",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        if (product.currentStock < quantity) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Available: ${product.currentStock}, Requested: ${quantity}`
          );
        }

        totalAmount += quantity * Number(item.unitPrice ?? product.sellingPrice);
      }

      const sale = await tx.sale.create({
        data: {
          customerName: customerName || null,
          createdBy: Number(createdBy),
          totalAmount,
        },
      });

      for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        const unitPrice = Number(item.unitPrice ?? product.sellingPrice);
        const unitCostAtSale = Number(product.costPrice);
        const subtotal = quantity * unitPrice;
        const profit = quantity * (unitPrice - unitCostAtSale);

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId,
            quantity,
            unitPrice,
            unitCostAtSale,
            subtotal,
            profit,
          },
        });

        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: product.currentStock - quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId,
            movementType: "OUT",
            quantity,
            referenceType: "SALE",
            referenceId: sale.id,
            note: `Stock sold in sale #${sale.id}`,
            createdBy: Number(createdBy),
          },
        });
      }

      return sale;
    });

    return res.status(201).json({
      message: "Sale created successfully",
      sale: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating sale",
      error: error instanceof Error ? error.message : error,
    });
  }
};