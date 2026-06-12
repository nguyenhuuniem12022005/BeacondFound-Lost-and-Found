/** Middleware xử lý lỗi tập trung */
function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Lỗi máy chủ nội bộ' });
}

function notFound(req, res) {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
}

module.exports = { errorHandler, notFound };
