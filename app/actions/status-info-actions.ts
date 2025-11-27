'use server'

import prisma from '@/lib/prisma'
import { isStatusInfoEnabled } from '@/lib/feature-flags'
import type { MKStatusInfoData, CreateStatusInfoInput } from '@/types/mk-status-info'
import { revalidatePath } from 'next/cache'

export const createStatusInfo = async (
  input: CreateStatusInfoInput,
  adminEmail: string
): Promise<{ success: boolean; error?: string; data?: MKStatusInfoData }> => {
  if (!isStatusInfoEnabled()) {
    return { success: false, error: 'Feature not enabled' }
  }

  try {
    // Validate content length
    if (!input.content.trim() || input.content.length > 2000) {
      return { success: false, error: 'Content must be between 1 and 2000 characters' }
    }

    // Verify MK exists
    const mk = await prisma.mK.findUnique({ where: { id: input.mkId } })
    if (!mk) {
      return { success: false, error: 'MK not found' }
    }

    // Create entry
    const statusInfo = await prisma.mKStatusInfo.create({
      data: {
        mkId: input.mkId,
        content: input.content.trim(),
        createdBy: adminEmail,
      },
      include: {
        mk: {
          select: { nameHe: true, faction: true },
        },
      },
    })

    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, data: statusInfo as MKStatusInfoData }
  } catch (error) {
    console.error('Error creating status info:', error)
    return { success: false, error: 'Failed to create status info' }
  }
}

export const getMKStatusInfo = async (
  mkId: number,
  limit: number = 10
): Promise<MKStatusInfoData[]> => {
  if (!isStatusInfoEnabled()) {
    return []
  }

  const statusInfos = await prisma.mKStatusInfo.findMany({
    where: { mkId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      mk: {
        select: { nameHe: true, faction: true },
      },
    },
  })

  return statusInfos as MKStatusInfoData[]
}

export const getMKStatusInfoCount = async (mkId: number): Promise<number> => {
  if (!isStatusInfoEnabled()) {
    return 0
  }

  return await prisma.mKStatusInfo.count({
    where: { mkId },
  })
}

export const deleteStatusInfo = async (
  id: number
): Promise<{ success: boolean; error?: string }> => {
  if (!isStatusInfoEnabled()) {
    return { success: false, error: 'Feature not enabled' }
  }

  try {
    await prisma.mKStatusInfo.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting status info:', error)
    return { success: false, error: 'Failed to delete status info' }
  }
}
