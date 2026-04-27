import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { configureSecurity } from './src/config/security';
import { loggingMiddleware, setupGlobalErrorHandling, logger } from './middleware/logger';
import { swaggerSpec } from './src/config/swagger';
import ConnectionPoolManager from './databases/ConnectionPoolManager';
import { initializeCacheSystem } from './services/cache/CacheInitializer';

const app = express();

// Initialize Connection Pool Manager
ConnectionPoolManager.startHealthMonitoring(60000); // Monitor every minute

// Initialize Cache System
initializeCacheSystem()
  .then((result) => {
    if (result.success) {
      logger.info('Cache system initialized successfully', {
        services: result.services,
        initializationTime: result.metrics.initializationTime
      });
    } else {
      logger.error('Cache system initialization failed', {
        errors: result.errors,
        services: result.services
      });
    }
  })
  .catch((error) => {
    logger.error('Cache system initialization error:', error);
  });

// Basic middleware setup
app.use(...loggingMiddleware);
configureSecurity(app);
app.use(express.json({ limit: '10kb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Connection Pool Management endpoints
app.get('/api/connection-pool/stats', async (req, res) => {
  try {
    const stats = await ConnectionPoolManager.getAllPoolStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connection pool stats' });
  }
});

app.get('/api/connection-pool/health', async (req, res) => {
  try {
    const healthChecks = await ConnectionPoolManager.getAllHealthChecks();
    res.json(healthChecks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connection pool health' });
  }
});

app.get('/api/connection-pool/performance', async (req, res) => {
  try {
    const metrics = await ConnectionPoolManager.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connection pool performance metrics' });
  }
});

// Cache System endpoints
app.get('/api/cache/health', async (req, res) => {
  try {
    const { getCacheInitializer } = await import('./services/cache/CacheInitializer');
    const initializer = getCacheInitializer();
    const status = await initializer.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache system status' });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const { getCacheManager } = await import('./services/RedisCacheManager');
    const cacheManager = getCacheManager();
    const stats = await cacheManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

app.get('/api/cache/metrics', async (req, res) => {
  try {
    const { getCacheMonitoringService } = await import('./services/cache/CacheMonitoringService');
    const monitoring = getCacheMonitoringService();
    const metrics = monitoring.getHealthMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache metrics' });
  }
});

app.get('/api/cache/performance', async (req, res) => {
  try {
    const { getCacheMonitoringService } = await import('./services/cache/CacheMonitoringService');
    const monitoring = getCacheMonitoringService();
    const report = monitoring.getPerformanceReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache performance report' });
  }
});

app.post('/api/cache/warmup', async (req, res) => {
  try {
    const { getCacheWarmupService } = await import('./services/cache/CacheWarmupService');
    const warmupService = getCacheWarmupService();
    const stats = await warmupService.runWarmup();
    res.json({ message: 'Cache warmup completed', stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run cache warmup' });
  }
});

app.delete('/api/cache/flush', async (req, res) => {
  try {
    const { getCacheManager } = await import('./services/RedisCacheManager');
    const cacheManager = getCacheManager();
    await cacheManager.flush();
    res.json({ message: 'Cache flushed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to flush cache' });
  }
});

// Setup global error handling
setupGlobalErrorHandling(app);

export default app;
