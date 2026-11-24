import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import healthRoutes from "./routes/healthRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import specialtyRoutes from "./routes/specialtyRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import medicalServiceRoutes from "./routes/medicalServiceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGINS es obligatorio en producción.");
}

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS."));
    },
  }),
);
app.use(express.json());
app.use(morgan("combined"));

app.use(healthRoutes);
app.use(apiRoutes);
app.use(authRoutes);
app.use(specialtyRoutes);
app.use(doctorRoutes);
app.use(availabilityRoutes);
app.use(appointmentRoutes);
app.use(medicalServiceRoutes);
app.use(profileRoutes);
app.use(errorHandler);

export default app;
