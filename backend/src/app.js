const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

/**
 * Khởi tạo Express app (tách riêng khỏi http server để có thể
 * import vào test - tương tự cách JUnit test một class riêng lẻ).
 */
function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));

  // Phục vụ ảnh upload local (mock Cloudinary)
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'BeacondFound API' }));
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
