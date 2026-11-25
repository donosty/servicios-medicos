import { Router } from "express";
import { getDoctorsController } from "../controllers/doctorController.js";

const router = Router();

router.get("/api/doctors", getDoctorsController);

export default router;
