/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from "@sentry/nextjs";

interface ErrorContext {
  [key: string]: any;
}

interface UserContext {
  user_id?: string;
  query_id?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Sentry utility for consistent error tracking and logging across the backend
 */
export class SentryTracker {
  /**
   * Capture an error with context and user information
   * @param userId - User ID or 'system' for system errors
   * @param error - Error object or error message
   * @param context - Additional context data
   */
  static captureError(
    userId: string | 'system', 
    error: Error | string, 
    context?: ErrorContext
  ): void {
    Sentry.withScope((scope) => {
      // Set user context
      if (userId && userId !== 'system') {
        scope.setUser({ id: userId });
      }

      // Set additional context
      if (context) {
        scope.setContext("error_details", context);
        
        // Set tags for filtering
        if (context.endpoint) scope.setTag("endpoint", context.endpoint);
        if (context.method) scope.setTag("method", context.method);
        if (context.failure_point) scope.setTag("failure_point", context.failure_point);
        if (context.query_id) scope.setTag("query_id", context.query_id);
      }

      // Capture the error
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(error, 'error');
      }
    });
  }

  /**
   * Capture a successful event with context
   * @param userId - User ID
   * @param eventName - Name of the event
   * @param data - Event data
   */
  static captureEvent(
    userId: string, 
    eventName: string, 
    data?: UserContext
  ): void {
    Sentry.withScope((scope) => {
      scope.setUser({ id: userId });
      
      if (data) {
        scope.setContext("event_details", data);
        
        // Set useful tags
        if (data.endpoint) scope.setTag("endpoint", data.endpoint);
        if (data.method) scope.setTag("method", data.method);
        if (data.query_id) scope.setTag("query_id", data.query_id);
      }

      Sentry.captureMessage(`${eventName}: ${JSON.stringify(data || {})}`, 'info');
    });
  }

  /**
   * Start a span for performance monitoring
   * @param name - Span name
   * @param operation - Operation type (e.g., 'api', 'task')
   * @param callback - Function to execute within the span
   */
  static startSpan<T>(
    name: string, 
    operation: string = 'api',
    callback: () => T | Promise<T>
  ): T | Promise<T> {
    return Sentry.startSpan({
      name,
      op: operation,
    }, callback);
  }

  /**
   * Add breadcrumb for tracking user actions
   * @param message - Breadcrumb message
   * @param category - Category (e.g., 'api', 'database', 'external')
   * @param level - Log level
   * @param data - Additional data
   */
  static addBreadcrumb(
    message: string, 
    category: string = 'api', 
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    data?: any
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set user context for the current scope
   * @param userId - User ID
   * @param additionalData - Additional user data
   */
  static setUser(userId: string, additionalData?: any): void {
    Sentry.setUser({
      id: userId,
      ...additionalData
    });
  }

  /**
   * Log performance metrics
   * @param metricName - Name of the metric
   * @param value - Metric value
   * @param unit - Unit of measurement
   * @param tags - Additional tags
   */
  static logMetric(
    metricName: string, 
    value: number, 
    unit: string = 'milliseconds',
    tags?: Record<string, string>
  ): void {
    Sentry.withScope((scope) => {
      if (tags) {
        Object.entries(tags).forEach(([key, val]) => {
          scope.setTag(key, val);
        });
      }
      
      Sentry.captureMessage(
        `Performance: ${metricName} = ${value}${unit}`, 
        'info'
      );
    });
  }

  /**
   * Log informational messages to Sentry
   * @param message - Log message
   * @param context - Additional context data
   * @param level - Log level (default: 'info')
   */
  static logger = {
    info: (message: string, context?: any) => {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext("log_details", context);
          
          // Set common tags for filtering
          if (context.log_source) scope.setTag("log_source", context.log_source);
          if (context.user_id) scope.setTag("user_id", context.user_id);
          if (context.query_id) scope.setTag("query_id", context.query_id);
          if (context.endpoint) scope.setTag("endpoint", context.endpoint);
        }
        
        Sentry.captureMessage(message, 'info');
      });
    },
    
    warn: (message: string, context?: any) => {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext("log_details", context);
          
          if (context.log_source) scope.setTag("log_source", context.log_source);
          if (context.user_id) scope.setTag("user_id", context.user_id);
          if (context.query_id) scope.setTag("query_id", context.query_id);
          if (context.endpoint) scope.setTag("endpoint", context.endpoint);
        }
        
        Sentry.captureMessage(message, 'warning');
      });
    },
    
    error: (message: string, context?: any) => {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext("log_details", context);
          
          if (context.log_source) scope.setTag("log_source", context.log_source);
          if (context.user_id) scope.setTag("user_id", context.user_id);
          if (context.query_id) scope.setTag("query_id", context.query_id);
          if (context.endpoint) scope.setTag("endpoint", context.endpoint);
        }
        
        Sentry.captureMessage(message, 'error');
      });
    }
  };
}

// Convenience exports
export const sentryServer = SentryTracker;
