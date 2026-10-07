import express from 'express';
import cors from 'cors';
import '../server/database.js';

import moldsRouter from '../server/routes/molds.js';
import maintenanceRouter from '../server/routes/maintenance.js';
import repairsRouter from '../server/routes/repairs.js';
import partsRouter from '../server/routes/parts.js';
import dashboardRouter from '../server/routes/dashboard.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/molds', moldsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/repairs', repairsRouter);
app.use('/api/parts', partsRouter);
app.use('/api/dashboard', dashboardRouter);

export default app;
