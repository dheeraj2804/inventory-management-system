import { Router } from "express";
import {
  createPurchase,
  getPurchases,
} from "../controllers/purchase.controller.js";

const router = Router();

router.get("/", getPurchases);
router.post("/", createPurchase);

export default router;