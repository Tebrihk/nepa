// Database performance monitoring integration
import metricsCollector from '../metrics/MetricsCollector';
import { createLogger } from '../logger/StructuredLogger';
import TracingMiddleware from '../tracing/TracingMiddleware';

const logger = createLogger('database-monitor');

export interface QueryMetrics {
  operation: string;
  table: string;
  duration: number;
  success: boolean;
  recordCount?: number;
}

export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryLog: QueryMetrics[] = [];
  private readonly maxLogSize = 1000;

  private constructor() {}

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  /**
   * Execute a database query with performance tracking
   */
  async executeQuery<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>,
    service: string
  ): Promise<T> {
    const start = Date.now();
    let success = true;
    let result: T;

    try {
      // Execute with tracing if available
      result = await TracingMiddleware.traceDatabase(
        operation,
        `${operation} on ${table}`,
        queryFn
      );
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = (Date.now() - start) / 1000; // Convert to seconds

      // Record metrics
      metricsCollector.recordDbQuery(operation, table, duration, service);

      // Log query metrics
      this.logQuery({
        operation,
        table,
        duration,
        success,
      });

      // Log slow queries
      if (duration > 1) {
        logger.warn('Slow database query detected', {
          operation,
          table,
          duration,
          service,
          threshold: 1000,
        });
      }
    }
  }

  /**
   * Wrap Prisma client with performance monitoring
   */
  wrapPrismaClient<T extends object>(client: T, service: string): T {
    const wrapper = new Proxy(client, {
      get: (target: any, prop: string | symbol) => {
        const original = target[prop];
        
        if (typeof original === 'function') {
          return (...args: any[]) => {
            return this.executeQuery(
              `prisma.${String(prop)}`,
              String(prop),
              () => original.apply(target, args),
              service
            );
          };
        }

        if (typeof original === 'object' && original !== null) {
          return this.wrapPrismaClient(original, service);
        }

        return original;
      },
    });

    return wrapper;
  }

  /**
   * Monitor connection pool
   */
  updateConnectionPool(
    service: string,
    database: string,
    active: number,
    idle: number
  ) {
    metricsCollector.setDbConnectionPool('active', active, database, service);
    metricsCollector.setDbConnectionPool('idle', idle, database, service);
  }

  /**
   * Log query for analysis
   */
  private logQuery(metrics: QueryMetrics) {
    this.queryLog.push(metrics);

    // Trim log if too large
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize);
    }

    logger.performance(`db.${metrics.operation}`, metrics.duration * 1000, {
      table: metrics.table,
      success: metrics.success,
      type: 'database_query',
    });
  }

  /**
   * Get query statistics
   */
  getQueryStats(): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    errors: number;
    topSlowTables: Array<{ table: string; avgDuration: number; count: number }>;
  } {
    const queries = this.queryLog;
    const total = queries.length;
    
    if (total === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowQueries: 0,
        errors: 0,
        topSlowTables: [],
      };
    }

    const avgDuration = queries.reduce((sum, q) => sum + q.duration, 0) / total;
    const slowQueries = queries.filter(q => q.duration > 1).length;
    const errors = queries.filter(q => !q.success).length;

    // Calculate per-table statistics
    const tableStats = new Map<string, { totalDuration: number; count: number }>();
    queries.forEach(q => {
      const current = tableStats.get(q.table) || { totalDuration: 0, count: 0 };
      current.totalDuration += q.duration;
      current.count++;
      tableStats.set(q.table, current);
    });

    const topSlowTables = Array.from(tableStats.entries())
      .map(([table, stats]) => ({
        table,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalQueries: total,
      averageDuration: avgDuration,
      slowQueries,
      errors,
      topSlowTables,
    };
  }

  /**
   * Clear query log
   */
  clearLog() {
    this.queryLog = [];
  }
}

export default DatabaseMonitor.getInstance();
