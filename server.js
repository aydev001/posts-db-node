require('dotenv').config();
const os = require('os');
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

function getLanAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

(async () => {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log('\nServer is running. Reachable at:');
      console.log(`  - Local:   http://localhost:${PORT}`);
      for (const ip of getLanAddresses()) {
        console.log(`  - Network: http://${ip}:${PORT}`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
