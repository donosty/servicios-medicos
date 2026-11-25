import { Router } from "express";
import { getMedicalServices } from "../controllers/medicalServiceController.js";

const router = Router();

router.get("/api/services", getMedicalServices);

export default router;
