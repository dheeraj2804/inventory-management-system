import { Router } from "express";
import {
  getDashboardSummary,
  getRecentPurchases,
  getRecentSales,
  getRecentMovements,
  getDashboardAnalytics,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", getDashboardSummary);
router.get("/recent-purchases", getRecentPurchases);
router.get("/recent-sales", getRecentSales);
router.get("/recent-movements", getRecentMovements);
router.get("/analytics", getDashboardAnalytics);

export default router;