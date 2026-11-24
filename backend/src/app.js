const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const seriesRoutes = require('./routes/seriesRoutes');
const productModelRoutes = require('./routes/productModelRoutes');
const productionLineRoutes = require('./routes/productionLineRoutes');
const operationRoutes = require('./routes/operationRoutes');
const parameterRoutes = require('./routes/parameterRoutes');
const templateRoutes = require('./routes/templateRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const ncRoutes = require('./routes/ncRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const path = require('path');

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'quality-os-backend', status: 'ok', time: new Date().toISOString() });
});

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/models', productModelRoutes);
app.use('/api/production-lines', productionLineRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/nc', ncRoutes);
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/dashboard', dashboardRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
