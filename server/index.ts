import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './database.js';

import moldsRouter from './routes/molds.js';
import maintenanceRouter from './routes/maintenance.js';
import repairsRouter from './routes/repairs.js';
import partsRouter from './routes/parts.js';
import dashboardRouter from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/molds', moldsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/repairs', repairsRouter);
app.use('/api/parts', partsRouter);
app.use('/api/dashboard', dashboardRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});
