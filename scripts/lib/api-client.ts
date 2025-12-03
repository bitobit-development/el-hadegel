/**
 * API client for historical comments with retry logic and rate limiting
 * Handles authentication, error handling, and exponential backoff
 */

import type { HistoricalCommentRow } from './csv-utils';

/**
 * API response structure
 */
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  isDuplicate?: boolean;
  statusCode: number;
  headers: Record<string, string>;
}

/**
 * Rate limit information from response headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000, // 1 second
  backoffMultiplier: 2, // Exponential: 1s, 2s, 4s
};

/**
 * API client for submitting historical comments
 */
export class HistoricalCommentsApiClient {
  private apiKey: string;
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(
    apiKey: string,
    baseUrl: string = 'http://localhost:3000',
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.retryConfig = retryConfig;
  }

  /**
   * Submit a historical comment with retry logic
   * @param comment Comment data from CSV
   * @returns API response
   */
  async submitComment(
    comment: HistoricalCommentRow
  ): Promise<ApiResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.makeRequest(comment);

        // Success or duplicate (both are acceptable outcomes)
        if (response.success || response.isDuplicate) {
          return response;
        }

        // Rate limit exceeded - wait and retry
        if (response.statusCode === 429) {
          const rateLimitInfo = this.extractRateLimitInfo(response.headers);
          if (rateLimitInfo) {
            await this.waitForRateLimitReset(rateLimitInfo);
            continue; // Retry without counting against attempts
          }
        }

        // Server error (5xx) - retry with backoff
        if (response.statusCode >= 500) {
          lastError = new Error(
            `Server error: ${response.statusCode} - ${response.error}`
          );
          if (attempt < this.retryConfig.maxAttempts) {
            await this.exponentialBackoff(attempt);
            continue;
          }
        }

        // Client error (4xx except 429) - don't retry
        if (response.statusCode >= 400 && response.statusCode < 500) {
          return response;
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Network error - retry with backoff
        if (attempt < this.retryConfig.maxAttempts) {
          await this.exponentialBackoff(attempt);
          continue;
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      error: lastError?.message || 'Unknown error after all retry attempts',
      statusCode: 0,
      headers: {},
    };
  }

  /**
   * Make HTTP request to API
   * @param comment Comment data
   * @returns API response
   */
  private async makeRequest(
    comment: HistoricalCommentRow
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}/api/historical-comments`;

    // Prepare request body
    const body = {
      mkId: parseInt(comment.mkId),
      content: comment.content,
      sourceUrl: comment.sourceUrl,
      sourcePlatform: comment.sourcePlatform,
      sourceType: comment.sourceType,
      commentDate: comment.commentDate,
      sourceName: comment.sourceName || undefined,
      sourceCredibility: comment.sourceCredibility
        ? parseInt(comment.sourceCredibility)
        : undefined,
      imageUrl: comment.imageUrl || undefined,
      videoUrl: comment.videoUrl || undefined,
      additionalContext: comment.additionalContext || undefined,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Extract headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Parse response
    let data: any = null;
    let error: string | undefined;

    try {
      const json = await response.json();
      if (response.ok) {
        data = json;
      } else {
        error = json.error || json.message || 'Unknown error';
      }
    } catch {
      error = await response.text();
    }

    // Check if duplicate
    const isDuplicate =
      data?.isDuplicate ||
      error?.includes('duplicate') ||
      error?.includes('כפילות');

    return {
      success: response.ok,
      data,
      error,
      isDuplicate,
      statusCode: response.status,
      headers,
    };
  }

  /**
   * Extract rate limit information from response headers
   * @param headers Response headers
   * @returns Rate limit info or null
   */
  private extractRateLimitInfo(
    headers: Record<string, string>
  ): RateLimitInfo | null {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
      };
    }

    return null;
  }

  /**
   * Wait until rate limit resets
   * @param rateLimitInfo Rate limit information
   */
  private async waitForRateLimitReset(
    rateLimitInfo: RateLimitInfo
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const waitSeconds = Math.max(0, rateLimitInfo.reset - now);

    if (waitSeconds > 0) {
      console.log(
        `⏳ Rate limit exceeded. Waiting ${waitSeconds} seconds until reset...`
      );
      await this.sleep(waitSeconds * 1000);
    }
  }

  /**
   * Exponential backoff delay
   * @param attempt Current attempt number
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const delayMs =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

    console.log(
      `⏳ Retry attempt ${attempt}/${this.retryConfig.maxAttempts} after ${delayMs}ms...`
    );
    await this.sleep(delayMs);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check rate limit status without making a request
   * @returns Rate limit info or null if not available
   */
  async checkRateLimit(): Promise<RateLimitInfo | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/historical-comments?limit=1`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return this.extractRateLimitInfo(headers);
    } catch {
      return null;
    }
  }
}

/**
 * Calculate safe delay between requests to stay under rate limit
 * @param rateLimitPerHour Maximum requests per hour
 * @returns Delay in milliseconds
 */
export function calculateSafeDelay(rateLimitPerHour: number): number {
  // Add 10% buffer for safety
  const safeRequestsPerHour = rateLimitPerHour * 0.9;
  const delayMs = (3600 * 1000) / safeRequestsPerHour;
  return Math.ceil(delayMs);
}

/**
 * Format API error for display
 * @param response API response
 * @returns Formatted error message
 */
export function formatApiError(response: ApiResponse): string {
  if (response.isDuplicate) {
    return 'כפילות - התגובה כבר קיימת במערכת';
  }

  if (response.statusCode === 401) {
    return 'שגיאת הזדהות - מפתח API לא תקין';
  }

  if (response.statusCode === 429) {
    return 'חריגה ממגבלת קצב הבקשות';
  }

  if (response.statusCode >= 500) {
    return `שגיאת שרת (${response.statusCode})`;
  }

  return response.error || 'שגיאה לא ידועה';
}
