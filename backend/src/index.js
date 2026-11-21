import 'dotenv/config';
import { startServer } from './server.js';

startServer().catch((error) => {
  console.error('No fue posible iniciar el backend:', error);
  process.exit(1);
});
