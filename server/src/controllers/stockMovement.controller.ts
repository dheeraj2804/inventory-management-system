import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getStockMovements = async (_req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(movements);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching stock movements",
      error,
    });
  }
};