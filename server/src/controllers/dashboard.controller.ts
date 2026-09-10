import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalSuppliers = await prisma.supplier.count();

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
        costPrice: true,
      },
    });

    const purchases = await prisma.purchase.findMany({
      select: {
        totalAmount: true,
      },
    });

    const sales = await prisma.sale.findMany({
      select: {
        totalAmount: true,
      },
    });

    const saleItems = await prisma.saleItem.findMany({
      select: {
        profit: true,
      },
    });

    const totalStockUnits = products.reduce(
      (sum, product) => sum + product.currentStock,
      0
    );

    const totalInventoryValue = products.reduce(
      (sum, product) => sum + product.currentStock * product.costPrice,
      0
    );

    const totalPurchaseAmount = purchases.reduce(
      (sum, purchase) => sum + purchase.totalAmount,
      0
    );

    const totalSalesAmount = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalProfit = saleItems.reduce(
      (sum, item) => sum + item.profit,
      0
    );

    const lowStockItems = products.filter(
      (product) => product.currentStock <= product.minStockLevel
    );

    return res.status(200).json({
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalStockUnits,
      totalInventoryValue,
      totalPurchaseAmount,
      totalSalesAmount,
      totalProfit,
      lowStockCount: lowStockItems.length,
      lowStockItems,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching dashboard summary",
      error,
    });
  }
};

export const getRecentPurchases = async (_req: Request, res: Response) => {
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
      take: 5,
    });

    return res.status(200).json(purchases);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching recent purchases",
      error,
    });
  }
};

export const getRecentSales = async (_req: Request, res: Response) => {
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
      take: 5,
    });

    return res.status(200).json(sales);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching recent sales",
      error,
    });
  }
};

export const getRecentMovements = async (_req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    return res.status(200).json(movements);
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching recent movements",
      error,
    });
  }
};

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const productId = req.query.productId
      ? Number(req.query.productId)
      : null;

    const purchaseItems = await prisma.purchaseItem.findMany({
      where: productId ? { productId } : {},
      include: {
        purchase: true,
        product: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const saleItems = await prisma.saleItem.findMany({
      where: productId ? { productId } : {},
      include: {
        sale: true,
        product: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const totalPurchases = purchaseItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const totalSales = saleItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const totalProfit = saleItems.reduce(
      (sum, item) => sum + item.profit,
      0
    );

    const purchaseChartData = purchaseItems.map((item) => ({
      label: `Purchase #${item.purchaseId}`,
      sales: 0,
      purchases: item.subtotal,
      profit: 0,
    }));

    const saleChartData = saleItems.map((item) => ({
      label: `Sale #${item.saleId}`,
      sales: item.subtotal,
      purchases: 0,
      profit: item.profit,
    }));

    const chartData = [...purchaseChartData, ...saleChartData];

    return res.status(200).json({
      summary: {
        totalSales,
        totalPurchases,
        totalProfit,
      },
      chartData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching dashboard analytics",
      error,
    });
  }
};