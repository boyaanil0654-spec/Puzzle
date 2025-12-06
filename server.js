// server.js - Main entry point
const cluster = require('cluster');
const os = require('os');
const path = require('path');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master ${process.pid} is running`);
  console.log(`🔧 Starting ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < Math.min(numCPUs, 4); i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    setTimeout(() => process.exit(0), 5000);
  });

} else {
  // Worker process - start the actual server
  require('./backend/server.js');
}
