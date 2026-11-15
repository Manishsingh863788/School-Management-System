import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { sendError, sendSuccess } from './utils/response.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import studentRoutes from './modules/students/students.routes.js';
import guardianRoutes from './modules/guardians/guardians.routes.js';
import teacherRoutes from './modules/teachers/teachers.routes.js';
import academicsRoutes from './modules/academics/academics.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import examinationRoutes from './modules/examinations/examinations.routes.js';
import feeRoutes from './modules/fees/fees.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(standardRateLimiter);

  // Health check
  app.get('/api/health', (req, res) => {
    return sendSuccess(res, 'EduManage API is healthy and operational', {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    });
  });

  // Swagger OpenAPI documentation configuration
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'EduManage - School Management System REST API',
        version: '1.0.0',
        description:
          'Comprehensive enterprise-grade school management system REST API for ALGIONS AI LABS assessment.',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Local development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/guardians', guardianRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/academics', academicsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/examinations', examinationRoutes);
  app.use('/api/fees', feeRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/audit-logs', auditRoutes);

  // Direct REST aliases matching assessment specifications
  app.use('/api/classes', (req, res, next) => {
    req.url = '/classes' + req.url;
    academicsRoutes(req, res, next);
  });
  app.use('/api/sections', (req, res, next) => {
    req.url = '/sections' + req.url;
    academicsRoutes(req, res, next);
  });
  app.use('/api/subjects', (req, res, next) => {
    req.url = '/subjects' + req.url;
    academicsRoutes(req, res, next);
  });
  app.use('/api/assignments', (req, res, next) => {
    req.url = '/assignments' + req.url;
    academicsRoutes(req, res, next);
  });
  app.use('/api/invoices', (req, res, next) => {
    req.url = '/invoices' + req.url;
    feeRoutes(req, res, next);
  });
  app.use('/api/payments', (req, res, next) => {
    req.url = '/payments' + req.url;
    feeRoutes(req, res, next);
  });
  app.use('/api/report-cards', (req, res, next) => {
    req.url = '/report-cards' + req.url;
    examinationRoutes(req, res, next);
  });

  // Serve frontend static assets and SPA fallback in production
  const candidatePaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
  ];
  const clientDistPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });

  // 404 handler for unknown routes
  app.use((req, res) => {
    return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};
