import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import specialtyRoutes from './routes/specialtyRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import medicalServiceRoutes from './routes/medicalServiceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

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
