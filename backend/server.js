const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { connectSQL } = require('./config/sqlDb');
const cookieParser = require('cookie-parser');
const { port, nodeEnv } = require('./config/env');
const { errorHandler } = require('./middlewares/errorHandler');
const { logger } = require('./middlewares/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const schemaRoutes = require('./routes/schemaRoutes');

const app = express();

// ─── Middleware ───────────────────────────────────────
app.use(cors({
  origin: true, // Allow all origins (or specify your frontend URL)
  credentials: true, // Allow cookies
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(logger(nodeEnv));

// ─── Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/evaluate', evaluationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/schema', schemaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Rule Engine API is running',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    const { sequelize } = require('./config/sqlDb');
    await connectSQL();
    
    // Sync Sequelize models
    console.log('🔄 Syncing SQL models (alter: true)...');
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ SQL models synced and schema updated.');
    } catch (syncError) {
      console.error('⚠️ Sync with alter:true failed, trying simple sync:', syncError.message);
      await sequelize.sync();
    }

    app.listen(port, () => {
      console.log(`\n🚀 RuleForge API running on port ${port}`);
      console.log(`📋 Environment: ${nodeEnv}`);
      console.log(`🔗 http://localhost:${port}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
