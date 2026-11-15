import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(` EduManage REST API Server is running on port ${env.PORT}`);
  console.log(` Health check: http://localhost:${env.PORT}/api/health`);
  console.log(` Swagger Docs: http://localhost:${env.PORT}/api/docs`);
  console.log(` Environment:  ${env.NODE_ENV}`);
  console.log(`=======================================================`);
});

const gracefulShutdown = () => {
  console.log('Received termination signal. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
