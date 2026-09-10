import { Router } from "express";
import { createSale, getSales } from "../controllers/sale.controller.js";

const router = Router();

router.get("/", getSales);
router.post("/", createSale);

export default router;