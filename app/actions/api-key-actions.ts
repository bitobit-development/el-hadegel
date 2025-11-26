'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { ApiKeyData } from '@/types/tweet';

export async function createApiKey(name: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Generate random API key
    const apiKey = `el-hadegel-${randomBytes(32).toString('hex')}`;

    // Hash it
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Store in DB
    await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        createdBy: session.user.email,
      },
    });

    // Return the plain API key (only time it's visible)
    return { success: true, apiKey };
  } catch (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: 'Failed to create API key' };
  }
}

export async function getApiKeys(): Promise<ApiKeyData[]> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return keys.map(key => ({
    id: key.id,
    name: key.name,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    createdBy: key.createdBy,
  }));
}

export async function toggleApiKey(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) {
      return { success: false, error: 'API key not found' };
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: !key.isActive },
    });

    return { success: true };
  } catch (error) {
    console.error('Error toggling API key:', error);
    return { success: false, error: 'Failed to toggle API key' };
  }
}

export async function deleteApiKey(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.apiKey.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: 'Failed to delete API key' };
  }
}
