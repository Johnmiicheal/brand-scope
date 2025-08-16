/* eslint-disable @typescript-eslint/no-explicit-any */
import { PostHog } from 'posthog-node';

// Singleton instance for server-side PostHog
class PostHogServer {
  private static instance: PostHogServer;
  private client: PostHog | null = null;

  private constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        this.client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          flushAt: 1, // Send events immediately for serverless
          flushInterval: 0, // Disable interval flushing for serverless
        });
      } else {
        console.warn('PostHog API key not found. Server-side tracking disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize PostHog server client:', error);
    }
  }

  public static getInstance(): PostHogServer {
    if (!PostHogServer.instance) {
      PostHogServer.instance = new PostHogServer();
    }
    return PostHogServer.instance;
  }

  /**
   * Capture an event
   */
  async capture(
    distinctId: string,
    event: string,
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.client) {
      console.warn('PostHog client not initialized. Skipping event capture.');
      return;
    }

    try {
      await this.client.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          $lib: 'brand-scope-server',
          $lib_version: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
      });
      
      // Ensure events are sent immediately in serverless environment
      await this.client.shutdown();
    } catch (error) {
      console.error('Failed to capture PostHog event:', error);
    }
  }

  /**
   * Capture error events with additional context
   */
  async captureError(
    distinctId: string,
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    if (!this.client) {
      console.warn('PostHog client not initialized. Skipping error capture.');
      return;
    }

    try {
      await this.client.capture({
        distinctId,
        event: 'server_error',
        properties: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          ...context,
          $lib: 'brand-scope-server',
          $lib_version: '1.0.0',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        },
      });
      
      // Ensure events are sent immediately in serverless environment
      await this.client.shutdown();
    } catch (captureError) {
      console.error('Failed to capture PostHog error event:', captureError);
    }
  }

  /**
   * Capture API usage events
   */
  async captureApiUsage(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.capture(userId, 'api_usage', {
      endpoint,
      method,
      status_code: statusCode,
      ...context,
    });
  }

  /**
   * Capture performance metrics
   */
  async capturePerformance(
    distinctId: string,
    operation: string,
    durationMs: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.capture(distinctId, 'performance_metric', {
      operation,
      duration_ms: durationMs,
      ...context,
    });
  }

  /**
   * Shut down the client (for cleanup)
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}

// Export singleton instance
export const posthogServer = PostHogServer.getInstance();