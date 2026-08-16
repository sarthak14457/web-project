import express from "express";

import supplierController from "../controllers/supplierController.js";
import validate from "../middlewares/validationMiddleware.js";
import { validateSupplier } from "../validators/supplierValidator.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", supplierController.list);
router.post("/", validate(validateSupplier), supplierController.create);
router.put("/:id", supplierController.update);
router.delete("/:id", supplierController.remove);

export default router;
