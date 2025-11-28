import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { ApiKey } from '@prisma/client';

interface AuthResult {
  authenticated: boolean;
  apiKeyId?: number;
  error?: string;
}

export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { authenticated: false, error: 'Missing Authorization header' };
  }

  const [type, key] = authHeader.split(' ');

  if (type !== 'Bearer' || !key) {
    return { authenticated: false, error: 'Invalid Authorization format. Use: Bearer <api-key>' };
  }

  try {
    // Option 1: Check against environment variable (for development/simple setup)
    const envApiKey = process.env.NEWS_API_KEY;
    if (envApiKey && key === envApiKey) {
      console.log('✅ Authenticated via environment variable API key');
      return { authenticated: true, apiKeyId: 0 }; // Use ID 0 for env-based auth
    }

    // Option 2: Check against database (for production with multiple API keys)
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true },
    });

    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(key, apiKey.keyHash);
      if (isValid) {
        // Update last used timestamp
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });

        console.log('✅ Authenticated via database API key');
        return { authenticated: true, apiKeyId: apiKey.id };
      }
    }

    return { authenticated: false, error: 'Invalid API key' };
  } catch (error) {
    console.error('API authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Verify API key and return ApiKey record or null
 * Convenience wrapper around authenticateApiKey
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKey | null> {
  const authResult = await authenticateApiKey(request);

  if (!authResult.authenticated || !authResult.apiKeyId) {
    return null;
  }

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: authResult.apiKeyId },
    });
    return apiKey;
  } catch (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
}
