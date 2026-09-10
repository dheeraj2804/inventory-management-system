import { Router } from "express";
import { getStockMovements } from "../controllers/stockMovement.controller.js";

const router = Router();

router.get("/", getStockMovements);

export default router;