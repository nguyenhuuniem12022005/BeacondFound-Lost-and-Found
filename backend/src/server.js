require('dotenv').config();
const http = require('http');

const { createApp } = require('./app');
const { initSocket } = require('./socket');

const app = createApp();
const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`BeacondFound API đang chạy tại http://localhost:${PORT}`);
});
