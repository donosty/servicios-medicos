require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api', (_request, response) => {
  response.json({ message: 'Servicios Médicos API' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend escuchando en el puerto ${port}`);
});
