/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { posthogServer } from './posthog-server';

// Enhanced API response with PostHog tracking
export class APIResponse {
  static async success<T = any>(
    data: T,
    options: {
      status?: number;
      message?: string;
      userId?: string;
      endpoint?: string;
      context?: Record<string, any>;
    } = {}
  ) {
    const { status = 200, message, userId = 'anonymous', endpoint = 'unknown', context = {} } = options;
    
    // Track successful API call
    await posthogServer.captureApiUsage(
      userId,
      endpoint,
      'unknown', // Method will be added by middleware
      status,
      {
        success: true,
        message,
        data_keys: typeof data === 'object' && data ? Object.keys(data) : [],
        ...context,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static async error(
    error: string | Error,
    options: {
      status?: number;
      userId?: string;
      endpoint?: string;
      context?: Record<string, any>;
      originalError?: Error;
    } = {}
  ) {
    const { 
      status = 500, 
      userId = 'anonymous', 
      endpoint = 'unknown', 
      context = {},
      originalError 
    } = options;
    
    const errorMessage = error instanceof Error ? error.message : error;
    const errorToTrack = originalError || (error instanceof Error ? error : new Error(errorMessage));
    
    // Track API error
    await posthogServer.captureError(
      userId,
      errorToTrack,
      {
        endpoint,
        status_code: status,
        error_message: errorMessage,
        ...context,
      }
    );

    await posthogServer.captureApiUsage(
      userId,
      endpoint,
      'unknown',
      status,
      {
        success: false,
        error_message: errorMessage,
        ...context,
      }
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }
}

// Middleware wrapper for API routes
export function withAPILogging(
  handler: (req: Request, context?: any) => Promise<Response>,
  endpoint?: string
) {
  return async (req: Request, context?: any): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const endpointName = endpoint || url.pathname;
    const method = req.method;
    
    // Extract user ID from request (adjust based on your auth implementation)
    const userId = await getUserIdFromRequest(req);
    
    try {
      const response = await handler(req, context);
      const duration = Date.now() - startTime;
      
      // Track successful API performance
      await posthogServer.capturePerformance(
        userId,
        endpointName,
        duration,
        {
          method,
          status_code: response.status,
          success: true,
        }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Track error and performance
      await posthogServer.captureError(
        userId,
        errorObj,
        {
          endpoint: endpointName,
          method,
          duration_ms: duration,
        }
      );
      
      await posthogServer.capturePerformance(
        userId,
        endpointName,
        duration,
        {
          method,
          error_message: errorObj.message,
          success: false,
        }
      );
      
      // Return structured error response
      return APIResponse.error(errorObj, {
        status: 500,
        userId,
        endpoint: endpointName,
        context: { method, duration_ms: duration },
        originalError: errorObj,
      });
    }
  };
}

// Extract user ID from request
async function getUserIdFromRequest(req: Request): Promise<string> {
  try {
    // Try to get user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      // If using Bearer tokens, you might decode JWT here
      // For now, we'll use a simple approach
      return 'authenticated-user';
    }
    
    // Try to get from query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    if (userId) {
      return userId;
    }
    
    // Try to get from request body (for POST requests)
    if (req.method === 'POST') {
      try {
        const body = await req.clone().json();
        if (body.user_id || body.userId) {
          return body.user_id || body.userId;
        }
      } catch {
        // Body parsing failed, continue with anonymous
      }
    }
    
    return 'anonymous';
  } catch {
    return 'anonymous';
  }
}

// Custom event tracking for specific business logic
export const trackBusinessEvent = async (
  userId: string,
  eventName: string,
  properties: Record<string, any> = {}
) => {
  await posthogServer.capture(userId, eventName, {
    ...properties,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

// Track AI/LLM specific events
export const trackAIEvent = async (
  userId: string,
  eventType: 'ai_request' | 'ai_response' | 'ai_error',
  data: {
    model?: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    duration_ms?: number;
    cost_usd?: number;
    provider?: string;
    error_message?: string;
    [key: string]: any;
  }
) => {
  await posthogServer.capture(userId, eventType, {
    ...data,
    category: 'ai_operations',
    timestamp: new Date().toISOString(),
  });
};
