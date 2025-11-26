import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
    // Find all active API keys and compare hashes
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

        return { authenticated: true, apiKeyId: apiKey.id };
      }
    }

    return { authenticated: false, error: 'Invalid API key' };
  } catch (error) {
    console.error('API authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}
