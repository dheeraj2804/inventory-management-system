import { Router } from "express";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../controllers/supplier.controller.js";

const router = Router();

router.get("/", getSuppliers);
router.post("/", createSupplier);

router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;