import 'dotenv/config';
import app from './app.js';
import { sequelize } from './models/index.js';

const port = Number(process.env.PORT || 3000);

export const startServer = async () => {
  await sequelize.authenticate();
  return app.listen(port, '0.0.0.0', () => {
    console.log(`Backend escuchando en el puerto ${port}`);
  });
};
