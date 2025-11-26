# API Code Examples

Complete integration examples for the EL HADEGEL Tweet Tracking API in various programming languages.

## Table of Contents

- [cURL Examples](#curl-examples)
- [Python](#python)
- [Node.js / TypeScript](#nodejs--typescript)
- [Go](#go)
- [Error Handling Patterns](#error-handling-patterns)

---

## cURL Examples

### Submit a Tweet

```bash
curl -X POST https://www.elhadegel.co.il/api/tweets \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.",
    "sourceUrl": "https://twitter.com/example/status/123456",
    "sourcePlatform": "Twitter",
    "postedAt": "2024-01-15T10:30:00Z"
  }'
```

### Submit a Tweet Without Source URL

```bash
curl -X POST https://www.elhadegel.co.il/api/tweets \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 5,
    "content": "השיח על חוק הגיוס צריך להתנהל בכבוד ובהקשבה הדדית.",
    "sourcePlatform": "Knesset Website",
    "postedAt": "2024-01-15T14:20:00Z"
  }'
```

### Retrieve All Tweets

```bash
curl -X GET "https://www.elhadegel.co.il/api/tweets?limit=50&offset=0" \
  -H "Authorization: Bearer your-api-key-here"
```

### Retrieve Tweets for Specific MK

```bash
curl -X GET "https://www.elhadegel.co.il/api/tweets?mkId=1&limit=20" \
  -H "Authorization: Bearer your-api-key-here"
```

### Check Rate Limits

```bash
curl -X GET "https://www.elhadegel.co.il/api/tweets?limit=1" \
  -H "Authorization: Bearer your-api-key-here" \
  -i  # Include headers in output
```

Look for these headers in the response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000000
```

---

## Python

### Complete Integration Client

```python
"""
EL HADEGEL API Client for Python
Requires: requests
Install: pip install requests
"""

import requests
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import time
import os


class ElHadegelClient:
    """Client for EL HADEGEL Tweet Tracking API"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://www.elhadegel.co.il"
    ):
        """
        Initialize the API client

        Args:
            api_key: Your EL HADEGEL API key
            base_url: API base URL (default: production)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

        # Rate limit tracking
        self.rate_limit_remaining = 100
        self.rate_limit_reset = None

    def _update_rate_limits(self, response: requests.Response) -> None:
        """Update rate limit info from response headers"""
        if 'X-RateLimit-Remaining' in response.headers:
            self.rate_limit_remaining = int(response.headers['X-RateLimit-Remaining'])

        if 'X-RateLimit-Reset' in response.headers:
            self.rate_limit_reset = int(response.headers['X-RateLimit-Reset'])

        # Log if approaching limit
        if self.rate_limit_remaining < 10:
            print(f"Warning: Only {self.rate_limit_remaining} requests remaining")

    def _handle_error(self, response: requests.Response) -> None:
        """Handle API errors"""
        if response.status_code == 400:
            data = response.json()
            error_msg = data.get('error', 'Invalid request data')
            details = data.get('details', [])
            if details:
                detail_msgs = [f"{err['path']}: {err['message']}" for err in details]
                error_msg += f"\nDetails: {', '.join(detail_msgs)}"
            raise ValueError(error_msg)

        elif response.status_code == 401:
            raise PermissionError("Invalid API key")

        elif response.status_code == 404:
            data = response.json()
            raise ValueError(data.get('error', 'Resource not found'))

        elif response.status_code == 429:
            data = response.json()
            reset_at = data.get('resetAt')
            raise Exception(f"Rate limit exceeded. Resets at {reset_at}")

        elif response.status_code >= 500:
            raise Exception(f"Server error: {response.status_code}")

    def create_tweet(
        self,
        mk_id: int,
        content: str,
        source_platform: str,
        posted_at: datetime,
        source_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submit a new tweet

        Args:
            mk_id: Knesset member ID (1-120)
            content: Tweet content (max 5000 chars)
            source_platform: One of: Twitter, Facebook, Instagram, News, Knesset Website, Other
            posted_at: When the tweet was posted (datetime object)
            source_url: Optional URL to original post

        Returns:
            Dict containing created tweet data

        Raises:
            ValueError: Invalid input data
            PermissionError: Invalid API key
            Exception: Rate limit or server error
        """
        # Validate inputs
        if not 1 <= mk_id <= 120:
            raise ValueError(f"Invalid mk_id: {mk_id}. Must be 1-120")

        if not 1 <= len(content) <= 5000:
            raise ValueError(f"Content length must be 1-5000 chars, got {len(content)}")

        valid_platforms = ['Twitter', 'Facebook', 'Instagram', 'News', 'Knesset Website', 'Other']
        if source_platform not in valid_platforms:
            raise ValueError(f"Invalid platform. Must be one of: {valid_platforms}")

        # Build payload
        payload = {
            "mkId": mk_id,
            "content": content,
            "sourcePlatform": source_platform,
            "postedAt": posted_at.isoformat(),
        }

        if source_url:
            payload["sourceUrl"] = source_url

        # Make request
        response = self.session.post(
            f"{self.base_url}/api/tweets",
            json=payload
        )

        # Update rate limits
        self._update_rate_limits(response)

        # Handle errors
        if not response.ok:
            self._handle_error(response)

        return response.json()

    def get_tweets(
        self,
        mk_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieve tweets with optional filtering

        Args:
            mk_id: Optional MK ID to filter by
            limit: Max results per request (1-100, default 50)
            offset: Number of results to skip (for pagination)

        Returns:
            Dict containing tweets and pagination info

        Raises:
            ValueError: Invalid parameters
            PermissionError: Invalid API key
            Exception: Rate limit or server error
        """
        # Validate inputs
        if not 1 <= limit <= 100:
            raise ValueError(f"Limit must be 1-100, got {limit}")

        if offset < 0:
            raise ValueError(f"Offset must be >= 0, got {offset}")

        if mk_id and not 1 <= mk_id <= 120:
            raise ValueError(f"Invalid mk_id: {mk_id}. Must be 1-120")

        # Build params
        params = {"limit": limit, "offset": offset}
        if mk_id:
            params["mkId"] = mk_id

        # Make request
        response = self.session.get(
            f"{self.base_url}/api/tweets",
            params=params
        )

        # Update rate limits
        self._update_rate_limits(response)

        # Handle errors
        if not response.ok:
            self._handle_error(response)

        return response.json()

    def get_all_tweets_for_mk(self, mk_id: int) -> List[Dict[str, Any]]:
        """
        Retrieve all tweets for a specific MK (handles pagination automatically)

        Args:
            mk_id: Knesset member ID

        Returns:
            List of all tweets for the MK
        """
        all_tweets = []
        offset = 0
        limit = 100  # Max per request

        while True:
            result = self.get_tweets(mk_id=mk_id, limit=limit, offset=offset)
            tweets = result['tweets']
            all_tweets.extend(tweets)

            # Check if more results exist
            if not result['pagination']['hasMore']:
                break

            offset += limit

            # Small delay to avoid rate limiting
            time.sleep(0.5)

        return all_tweets


# Usage Examples
def example_basic_usage():
    """Basic usage example"""
    # Initialize client
    api_key = os.getenv('EL_HADEGEL_API_KEY', 'your-api-key-here')
    client = ElHadegelClient(api_key=api_key)

    # Submit a tweet
    result = client.create_tweet(
        mk_id=1,
        content="אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.",
        source_platform="Twitter",
        posted_at=datetime.now(timezone.utc),
        source_url="https://twitter.com/example/status/123456"
    )

    print(f"✓ Created tweet ID: {result['tweet']['id']}")
    print(f"  MK: {result['tweet']['mkName']}")
    print(f"  Content: {result['tweet']['content'][:50]}...")

    # Retrieve tweets for this MK
    tweets = client.get_tweets(mk_id=1, limit=10)
    print(f"\n✓ Found {len(tweets['tweets'])} tweets")
    print(f"  Total available: {tweets['pagination']['total']}")
    print(f"  Rate limit remaining: {client.rate_limit_remaining}")


def example_batch_submission():
    """Example: Submit multiple tweets"""
    api_key = os.getenv('EL_HADEGEL_API_KEY', 'your-api-key-here')
    client = ElHadegelClient(api_key=api_key)

    tweets_to_submit = [
        {
            "mk_id": 1,
            "content": "אני תומך בחוק הגיוס השוויוני.",
            "platform": "Twitter",
            "url": "https://twitter.com/example/status/1"
        },
        {
            "mk_id": 2,
            "content": "השיח על חוק הגיוס צריך להתנהל בכבוד.",
            "platform": "Facebook",
            "url": "https://facebook.com/post/2"
        },
        {
            "mk_id": 3,
            "content": "נושא הגיוס דורש פתרון מקיף.",
            "platform": "News",
            "url": "https://www.ynet.co.il/article/example"
        }
    ]

    for tweet_data in tweets_to_submit:
        try:
            # Check rate limits before submission
            if client.rate_limit_remaining < 5:
                print("Approaching rate limit, pausing...")
                time.sleep(60)

            result = client.create_tweet(
                mk_id=tweet_data["mk_id"],
                content=tweet_data["content"],
                source_platform=tweet_data["platform"],
                posted_at=datetime.now(timezone.utc),
                source_url=tweet_data["url"]
            )

            print(f"✓ Submitted tweet for MK {tweet_data['mk_id']}")

        except Exception as e:
            print(f"✗ Failed for MK {tweet_data['mk_id']}: {e}")


def example_pagination():
    """Example: Paginate through all tweets"""
    api_key = os.getenv('EL_HADEGEL_API_KEY', 'your-api-key-here')
    client = ElHadegelClient(api_key=api_key)

    page_size = 20
    offset = 0
    all_tweets = []

    while True:
        result = client.get_tweets(limit=page_size, offset=offset)
        tweets = result['tweets']
        pagination = result['pagination']

        all_tweets.extend(tweets)
        print(f"Fetched page {offset // page_size + 1}: {len(tweets)} tweets")

        if not pagination['hasMore']:
            break

        offset += page_size

    print(f"\nTotal tweets fetched: {len(all_tweets)}")


if __name__ == "__main__":
    # Run examples
    print("=== Basic Usage ===")
    example_basic_usage()

    print("\n=== Batch Submission ===")
    example_batch_submission()

    print("\n=== Pagination ===")
    example_pagination()
```

### Error Handling with Retries

```python
import time
from typing import Callable, Any


def retry_with_exponential_backoff(
    func: Callable,
    max_retries: int = 3,
    initial_delay: float = 1.0
) -> Any:
    """
    Retry a function with exponential backoff

    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds

    Returns:
        Function result

    Raises:
        Last exception if all retries fail
    """
    for attempt in range(max_retries):
        try:
            return func()

        except Exception as e:
            # Don't retry client errors (4xx)
            if isinstance(e, (ValueError, PermissionError)):
                raise

            # Retry server errors (5xx)
            if attempt == max_retries - 1:
                raise

            delay = initial_delay * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed: {e}")
            print(f"Retrying in {delay}s...")
            time.sleep(delay)


# Usage
def submit_tweet_with_retry():
    """Submit tweet with automatic retry on server errors"""
    client = ElHadegelClient(api_key="your-api-key")

    result = retry_with_exponential_backoff(
        lambda: client.create_tweet(
            mk_id=1,
            content="Test content",
            source_platform="Twitter",
            posted_at=datetime.now(timezone.utc)
        ),
        max_retries=3
    )

    return result
```

---

## Node.js / TypeScript

### Complete Integration Client

```typescript
/**
 * EL HADEGEL API Client for Node.js/TypeScript
 * Requires: axios
 * Install: npm install axios
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Types
interface CreateTweetRequest {
  mkId: number;
  content: string;
  sourcePlatform: string;
  postedAt: string;
  sourceUrl?: string;
}

interface Tweet {
  id: number;
  mkId: number;
  mkName: string;
  content: string;
  sourceUrl: string | null;
  sourcePlatform: string;
  postedAt: string;
  createdAt: string;
}

interface CreateTweetResponse {
  success: boolean;
  tweet?: Tweet;
  error?: string;
}

interface GetTweetsResponse {
  success: boolean;
  tweets: Tweet[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: Array<{
    path: string[];
    message: string;
  }>;
}

interface RateLimitError extends ErrorResponse {
  resetAt: string;
}

// Client class
export class ElHadegelClient {
  private client: AxiosInstance;
  private rateLimitRemaining: number = 100;
  private rateLimitReset: number | null = null;

  constructor(
    apiKey: string,
    baseURL: string = 'https://www.elhadegel.co.il'
  ) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for rate limit tracking
    this.client.interceptors.response.use(
      (response) => {
        this.updateRateLimits(response);
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          this.updateRateLimits(error.response);
          this.handleError(error);
        }
        throw error;
      }
    );
  }

  private updateRateLimits(response: AxiosResponse): void {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining);
    }

    if (reset) {
      this.rateLimitReset = parseInt(reset);
    }

    // Warn if approaching limit
    if (this.rateLimitRemaining < 10) {
      console.warn(`Warning: Only ${this.rateLimitRemaining} requests remaining`);
    }
  }

  private handleError(error: AxiosError): void {
    const response = error.response;
    if (!response) return;

    const data = response.data as ErrorResponse;

    switch (response.status) {
      case 400:
        const details = (data as any).details || [];
        const detailMsg = details.map((d: any) =>
          `${d.path.join('.')}: ${d.message}`
        ).join(', ');
        throw new Error(`Invalid request data: ${data.error}. ${detailMsg}`);

      case 401:
        throw new Error('Invalid API key');

      case 404:
        throw new Error(data.error || 'Resource not found');

      case 429:
        const resetAt = (data as RateLimitError).resetAt;
        throw new Error(`Rate limit exceeded. Resets at ${resetAt}`);

      case 500:
        throw new Error('Server error - please retry later');

      default:
        throw new Error(`API error: ${data.error}`);
    }
  }

  /**
   * Submit a new tweet
   */
  async createTweet(params: {
    mkId: number;
    content: string;
    sourcePlatform: string;
    postedAt: Date;
    sourceUrl?: string;
  }): Promise<CreateTweetResponse> {
    // Validate inputs
    if (params.mkId < 1 || params.mkId > 120) {
      throw new Error(`Invalid mkId: ${params.mkId}. Must be 1-120`);
    }

    if (params.content.length < 1 || params.content.length > 5000) {
      throw new Error(`Content length must be 1-5000 chars, got ${params.content.length}`);
    }

    const validPlatforms = ['Twitter', 'Facebook', 'Instagram', 'News', 'Knesset Website', 'Other'];
    if (!validPlatforms.includes(params.sourcePlatform)) {
      throw new Error(`Invalid platform. Must be one of: ${validPlatforms.join(', ')}`);
    }

    // Build request
    const request: CreateTweetRequest = {
      mkId: params.mkId,
      content: params.content,
      sourcePlatform: params.sourcePlatform,
      postedAt: params.postedAt.toISOString(),
    };

    if (params.sourceUrl) {
      request.sourceUrl = params.sourceUrl;
    }

    // Make request
    const response = await this.client.post<CreateTweetResponse>('/api/tweets', request);
    return response.data;
  }

  /**
   * Retrieve tweets with optional filtering
   */
  async getTweets(params?: {
    mkId?: number;
    limit?: number;
    offset?: number;
  }): Promise<GetTweetsResponse> {
    const { mkId, limit = 50, offset = 0 } = params || {};

    // Validate inputs
    if (limit < 1 || limit > 100) {
      throw new Error(`Limit must be 1-100, got ${limit}`);
    }

    if (offset < 0) {
      throw new Error(`Offset must be >= 0, got ${offset}`);
    }

    if (mkId && (mkId < 1 || mkId > 120)) {
      throw new Error(`Invalid mkId: ${mkId}. Must be 1-120`);
    }

    // Build query params
    const queryParams: any = { limit, offset };
    if (mkId) {
      queryParams.mkId = mkId;
    }

    // Make request
    const response = await this.client.get<GetTweetsResponse>('/api/tweets', {
      params: queryParams,
    });

    return response.data;
  }

  /**
   * Get all tweets for a specific MK (handles pagination automatically)
   */
  async getAllTweetsForMK(mkId: number): Promise<Tweet[]> {
    const allTweets: Tweet[] = [];
    let offset = 0;
    const limit = 100; // Max per request

    while (true) {
      const result = await this.getTweets({ mkId, limit, offset });
      allTweets.push(...result.tweets);

      if (!result.pagination.hasMore) {
        break;
      }

      offset += limit;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allTweets;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): { remaining: number; reset: number | null } {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset,
    };
  }
}

// Usage Examples
async function exampleBasicUsage() {
  const apiKey = process.env.EL_HADEGEL_API_KEY || 'your-api-key-here';
  const client = new ElHadegelClient(apiKey);

  try {
    // Submit a tweet
    const result = await client.createTweet({
      mkId: 1,
      content: 'אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.',
      sourcePlatform: 'Twitter',
      postedAt: new Date(),
      sourceUrl: 'https://twitter.com/example/status/123456',
    });

    console.log(`✓ Created tweet ID: ${result.tweet?.id}`);
    console.log(`  MK: ${result.tweet?.mkName}`);
    console.log(`  Content: ${result.tweet?.content.substring(0, 50)}...`);

    // Retrieve tweets
    const tweets = await client.getTweets({ mkId: 1, limit: 10 });
    console.log(`\n✓ Found ${tweets.tweets.length} tweets`);
    console.log(`  Total available: ${tweets.pagination.total}`);

    // Check rate limits
    const rateLimit = client.getRateLimitStatus();
    console.log(`  Rate limit remaining: ${rateLimit.remaining}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

async function exampleBatchSubmission() {
  const apiKey = process.env.EL_HADEGEL_API_KEY || 'your-api-key-here';
  const client = new ElHadegelClient(apiKey);

  const tweetsToSubmit = [
    {
      mkId: 1,
      content: 'אני תומך בחוק הגיוס השוויוני.',
      platform: 'Twitter',
      url: 'https://twitter.com/example/status/1',
    },
    {
      mkId: 2,
      content: 'השיח על חוק הגיוס צריך להתנהל בכבוד.',
      platform: 'Facebook',
      url: 'https://facebook.com/post/2',
    },
    {
      mkId: 3,
      content: 'נושא הגיוס דורש פתרון מקיף.',
      platform: 'News',
      url: 'https://www.ynet.co.il/article/example',
    },
  ];

  for (const tweetData of tweetsToSubmit) {
    try {
      // Check rate limits
      const rateLimit = client.getRateLimitStatus();
      if (rateLimit.remaining < 5) {
        console.log('Approaching rate limit, pausing...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }

      const result = await client.createTweet({
        mkId: tweetData.mkId,
        content: tweetData.content,
        sourcePlatform: tweetData.platform,
        postedAt: new Date(),
        sourceUrl: tweetData.url,
      });

      console.log(`✓ Submitted tweet for MK ${tweetData.mkId}`);

    } catch (error) {
      console.error(`✗ Failed for MK ${tweetData.mkId}:`, error);
    }
  }
}

// Export for use in other modules
export default ElHadegelClient;
```

### Retry Helper Function

```typescript
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry client errors (4xx)
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
      console.log(`Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
async function submitTweetWithRetry() {
  const client = new ElHadegelClient('your-api-key');

  const result = await retryWithBackoff(
    () => client.createTweet({
      mkId: 1,
      content: 'Test content',
      sourcePlatform: 'Twitter',
      postedAt: new Date(),
    }),
    3  // max retries
  );

  return result;
}
```

---

## Go

### Complete Integration Client

```go
// Package elhadegel provides a client for the EL HADEGEL Tweet Tracking API
package elhadegel

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "strconv"
    "time"
)

// Client represents an EL HADEGEL API client
type Client struct {
    apiKey           string
    baseURL          string
    httpClient       *http.Client
    rateLimitRemaining int
    rateLimitReset   int64
}

// Tweet represents a tweet/statement
type Tweet struct {
    ID             int       `json:"id"`
    MKId           int       `json:"mkId"`
    MKName         string    `json:"mkName"`
    Content        string    `json:"content"`
    SourceURL      *string   `json:"sourceUrl"`
    SourcePlatform string    `json:"sourcePlatform"`
    PostedAt       time.Time `json:"postedAt"`
    CreatedAt      time.Time `json:"createdAt"`
}

// CreateTweetRequest represents a request to create a tweet
type CreateTweetRequest struct {
    MKId           int     `json:"mkId"`
    Content        string  `json:"content"`
    SourcePlatform string  `json:"sourcePlatform"`
    PostedAt       string  `json:"postedAt"`
    SourceURL      *string `json:"sourceUrl,omitempty"`
}

// CreateTweetResponse represents a response from creating a tweet
type CreateTweetResponse struct {
    Success bool   `json:"success"`
    Tweet   *Tweet `json:"tweet,omitempty"`
    Error   string `json:"error,omitempty"`
}

// GetTweetsResponse represents a response from getting tweets
type GetTweetsResponse struct {
    Success bool   `json:"success"`
    Tweets  []Tweet `json:"tweets"`
    Pagination struct {
        Total   int  `json:"total"`
        Limit   int  `json:"limit"`
        Offset  int  `json:"offset"`
        HasMore bool `json:"hasMore"`
    } `json:"pagination"`
    Error string `json:"error,omitempty"`
}

// NewClient creates a new EL HADEGEL API client
func NewClient(apiKey string, baseURL string) *Client {
    if baseURL == "" {
        baseURL = "https://www.elhadegel.co.il"
    }

    return &Client{
        apiKey:             apiKey,
        baseURL:            baseURL,
        httpClient:         &http.Client{Timeout: 30 * time.Second},
        rateLimitRemaining: 100,
    }
}

// CreateTweet submits a new tweet
func (c *Client) CreateTweet(req CreateTweetRequest) (*CreateTweetResponse, error) {
    // Validate inputs
    if req.MKId < 1 || req.MKId > 120 {
        return nil, fmt.Errorf("invalid mkId: %d. Must be 1-120", req.MKId)
    }

    if len(req.Content) < 1 || len(req.Content) > 5000 {
        return nil, fmt.Errorf("content length must be 1-5000 chars, got %d", len(req.Content))
    }

    validPlatforms := map[string]bool{
        "Twitter": true, "Facebook": true, "Instagram": true,
        "News": true, "Knesset Website": true, "Other": true,
    }
    if !validPlatforms[req.SourcePlatform] {
        return nil, fmt.Errorf("invalid platform: %s", req.SourcePlatform)
    }

    // Marshal request body
    body, err := json.Marshal(req)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal request: %w", err)
    }

    // Create HTTP request
    httpReq, err := http.NewRequest(
        "POST",
        c.baseURL+"/api/tweets",
        bytes.NewReader(body),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
    httpReq.Header.Set("Content-Type", "application/json")

    // Execute request
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Update rate limits
    c.updateRateLimits(resp)

    // Parse response
    var result CreateTweetResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }

    // Handle errors
    if resp.StatusCode != http.StatusCreated {
        return nil, c.handleError(resp.StatusCode, result.Error)
    }

    return &result, nil
}

// GetTweets retrieves tweets with optional filtering
func (c *Client) GetTweets(mkId *int, limit, offset int) (*GetTweetsResponse, error) {
    // Validate inputs
    if limit < 1 || limit > 100 {
        return nil, fmt.Errorf("limit must be 1-100, got %d", limit)
    }

    if offset < 0 {
        return nil, fmt.Errorf("offset must be >= 0, got %d", offset)
    }

    if mkId != nil && (*mkId < 1 || *mkId > 120) {
        return nil, fmt.Errorf("invalid mkId: %d. Must be 1-120", *mkId)
    }

    // Build URL with query params
    u, _ := url.Parse(c.baseURL + "/api/tweets")
    q := u.Query()
    q.Set("limit", strconv.Itoa(limit))
    q.Set("offset", strconv.Itoa(offset))
    if mkId != nil {
        q.Set("mkId", strconv.Itoa(*mkId))
    }
    u.RawQuery = q.Encode()

    // Create HTTP request
    httpReq, err := http.NewRequest("GET", u.String(), nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

    // Execute request
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    // Update rate limits
    c.updateRateLimits(resp)

    // Parse response
    var result GetTweetsResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }

    // Handle errors
    if resp.StatusCode != http.StatusOK {
        return nil, c.handleError(resp.StatusCode, result.Error)
    }

    return &result, nil
}

// updateRateLimits updates rate limit info from response headers
func (c *Client) updateRateLimits(resp *http.Response) {
    if remaining := resp.Header.Get("X-RateLimit-Remaining"); remaining != "" {
        if val, err := strconv.Atoi(remaining); err == nil {
            c.rateLimitRemaining = val
        }
    }

    if reset := resp.Header.Get("X-RateLimit-Reset"); reset != "" {
        if val, err := strconv.ParseInt(reset, 10, 64); err == nil {
            c.rateLimitReset = val
        }
    }

    // Warn if approaching limit
    if c.rateLimitRemaining < 10 {
        fmt.Printf("Warning: Only %d requests remaining\n", c.rateLimitRemaining)
    }
}

// handleError returns appropriate error based on status code
func (c *Client) handleError(statusCode int, errorMsg string) error {
    switch statusCode {
    case http.StatusBadRequest:
        return fmt.Errorf("invalid request data: %s", errorMsg)
    case http.StatusUnauthorized:
        return fmt.Errorf("invalid API key")
    case http.StatusNotFound:
        return fmt.Errorf("resource not found: %s", errorMsg)
    case http.StatusTooManyRequests:
        return fmt.Errorf("rate limit exceeded: %s", errorMsg)
    case http.StatusInternalServerError:
        return fmt.Errorf("server error: %s", errorMsg)
    default:
        return fmt.Errorf("API error (%d): %s", statusCode, errorMsg)
    }
}

// GetRateLimitStatus returns current rate limit status
func (c *Client) GetRateLimitStatus() (remaining int, reset int64) {
    return c.rateLimitRemaining, c.rateLimitReset
}
```

### Usage Example

```go
package main

import (
    "fmt"
    "log"
    "os"
    "time"

    "your-module/elhadegel"
)

func main() {
    // Initialize client
    apiKey := os.Getenv("EL_HADEGEL_API_KEY")
    if apiKey == "" {
        apiKey = "your-api-key-here"
    }

    client := elhadegel.NewClient(apiKey, "")

    // Submit a tweet
    sourceURL := "https://twitter.com/example/status/123456"
    result, err := client.CreateTweet(elhadegel.CreateTweetRequest{
        MKId:           1,
        Content:        "אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.",
        SourcePlatform: "Twitter",
        PostedAt:       time.Now().UTC().Format(time.RFC3339),
        SourceURL:      &sourceURL,
    })

    if err != nil {
        log.Fatalf("Failed to create tweet: %v", err)
    }

    fmt.Printf("✓ Created tweet ID: %d\n", result.Tweet.ID)
    fmt.Printf("  MK: %s\n", result.Tweet.MKName)

    // Retrieve tweets
    mkId := 1
    tweets, err := client.GetTweets(&mkId, 10, 0)
    if err != nil {
        log.Fatalf("Failed to get tweets: %v", err)
    }

    fmt.Printf("\n✓ Found %d tweets\n", len(tweets.Tweets))
    fmt.Printf("  Total available: %d\n", tweets.Pagination.Total)

    // Check rate limits
    remaining, _ := client.GetRateLimitStatus()
    fmt.Printf("  Rate limit remaining: %d\n", remaining)
}
```

---

## Error Handling Patterns

### Python: Comprehensive Error Handler

```python
def make_api_request_with_handling(func, *args, **kwargs):
    """
    Make an API request with comprehensive error handling

    Returns tuple: (success: bool, result: Any, error: str)
    """
    try:
        result = func(*args, **kwargs)
        return True, result, None

    except ValueError as e:
        # Validation error - log and fix request
        print(f"Validation error: {e}")
        return False, None, str(e)

    except PermissionError as e:
        # Auth error - check API key
        print(f"Authentication failed: {e}")
        return False, None, "Invalid API key - check credentials"

    except Exception as e:
        error_msg = str(e)

        if "Rate limit exceeded" in error_msg:
            # Extract reset time and wait
            print(f"Rate limit hit: {error_msg}")
            return False, None, "Rate limit exceeded"

        elif "Server error" in error_msg:
            # Server error - can retry
            print(f"Server error: {error_msg}")
            return False, None, "Server error - retry later"

        else:
            # Unknown error
            print(f"Unexpected error: {error_msg}")
            return False, None, f"Unknown error: {error_msg}"


# Usage
success, result, error = make_api_request_with_handling(
    client.create_tweet,
    mk_id=1,
    content="Test",
    source_platform="Twitter",
    posted_at=datetime.now(timezone.utc)
)

if success:
    print(f"Tweet created: {result['tweet']['id']}")
else:
    print(f"Failed: {error}")
```

### TypeScript: Typed Error Handler

```typescript
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function makeApiRequestSafe<T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };

  } catch (error: any) {
    const message = error.message || 'Unknown error';

    if (message.includes('Invalid')) {
      // Validation error
      console.error('Validation error:', message);
      return { success: false, error: `Validation failed: ${message}` };
    }

    if (message.includes('Rate limit')) {
      // Rate limit error
      console.error('Rate limit exceeded');
      return { success: false, error: 'Rate limit exceeded - wait before retrying' };
    }

    if (message.includes('Server error')) {
      // Server error - can retry
      console.error('Server error:', message);
      return { success: false, error: 'Server error - please retry' };
    }

    // Unknown error
    console.error('Unknown error:', message);
    return { success: false, error: `Error: ${message}` };
  }
}

// Usage
const result = await makeApiRequestSafe(() =>
  client.createTweet({
    mkId: 1,
    content: 'Test',
    sourcePlatform: 'Twitter',
    postedAt: new Date(),
  })
);

if (result.success) {
  console.log(`Tweet created: ${result.data.tweet?.id}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

---

## Additional Resources

- [Developer Guide](./DEVELOPER_GUIDE.md) - Complete API documentation
- [OpenAPI Specification](./openapi.yaml) - Machine-readable API spec
- [Project Website](https://www.elhadegel.co.il) - View MKs and positions

---

*Last updated: January 2024*
