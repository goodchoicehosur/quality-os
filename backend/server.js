require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n  QualityOS API running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`  Listening on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
});

start();
