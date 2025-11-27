'use server';

import prisma from '@/lib/prisma';
import { MKData, MKDataWithTweetCount, MKDataWithStatusInfoCount, MKDataWithCounts, PositionStats, FilterOptions, PositionStatus, ChartFilterOptions, FilteredPositionStats } from '@/types/mk';
import { isStatusInfoEnabled } from '@/lib/feature-flags';
import { Position } from '@prisma/client';

/**
 * Get all MKs with optional filtering
 * @param filters - Optional filtering options
 * @param includeTweetCount - If true, includes tweet count for each MK
 * @param includeStatusInfoCount - If true, includes status info count for each MK
 */
export async function getMKs(
  filters: Partial<FilterOptions> | undefined,
  includeTweetCount: true,
  includeStatusInfoCount: true
): Promise<MKDataWithCounts[]>;

export async function getMKs(
  filters: Partial<FilterOptions> | undefined,
  includeTweetCount: true,
  includeStatusInfoCount?: false
): Promise<MKDataWithTweetCount[]>;

export async function getMKs(
  filters: Partial<FilterOptions> | undefined,
  includeTweetCount: false,
  includeStatusInfoCount: true
): Promise<MKDataWithStatusInfoCount[]>;

export async function getMKs(
  filters?: Partial<FilterOptions>,
  includeTweetCount?: false,
  includeStatusInfoCount?: false
): Promise<MKData[]>;

export async function getMKs(
  filters?: Partial<FilterOptions>,
  includeTweetCount: boolean = false,
  includeStatusInfoCount: boolean = false
): Promise<MKData[] | MKDataWithTweetCount[] | MKDataWithStatusInfoCount[] | MKDataWithCounts[]> {
  const where: any = {};

  // Apply faction filter
  if (filters?.factions && filters.factions.length > 0) {
    where.faction = { in: filters.factions };
  }

  // Apply position filter
  if (filters?.positions && filters.positions.length > 0) {
    where.currentPosition = { in: filters.positions as Position[] };
  }

  // Apply search query (searches both name and faction)
  if (filters?.searchQuery && filters.searchQuery.trim().length > 0) {
    where.OR = [
      { nameHe: { contains: filters.searchQuery.trim(), mode: 'insensitive' } },
      { faction: { contains: filters.searchQuery.trim(), mode: 'insensitive' } },
    ];
  }

  const mks = await prisma.mK.findMany({
    where,
    orderBy: { nameHe: 'asc' },
  });

  // If no counts are requested, return basic MK data
  if (!includeTweetCount && !includeStatusInfoCount) {
    return mks.map(mk => ({
      ...mk,
      currentPosition: mk.currentPosition as PositionStatus,
    }));
  }

  // Get tweet counts if requested
  let tweetCountMap = new Map<number, number>();
  if (includeTweetCount) {
    const tweetCounts = await prisma.tweet.groupBy({
      by: ['mkId'],
      _count: true,
    });
    tweetCountMap = new Map(
      tweetCounts.map(tc => [tc.mkId, tc._count])
    );
  }

  // Get status info counts if requested and feature is enabled
  let statusInfoCountMap = new Map<number, number>();
  if (includeStatusInfoCount && isStatusInfoEnabled()) {
    const statusInfoCounts = await prisma.mKStatusInfo.groupBy({
      by: ['mkId'],
      _count: true,
    });
    statusInfoCountMap = new Map(
      statusInfoCounts.map(sic => [sic.mkId, sic._count])
    );
  }

  return mks.map(mk => {
    const result: any = {
      ...mk,
      currentPosition: mk.currentPosition as PositionStatus,
    };

    if (includeTweetCount) {
      result.tweetCount = tweetCountMap.get(mk.id) || 0;
    }

    if (includeStatusInfoCount) {
      result.statusInfoCount = statusInfoCountMap.get(mk.id) || 0;
    }

    return result;
  });
}

/**
 * Get position statistics
 */
export async function getPositionStats(): Promise<PositionStats> {
  const [support, neutral, against, total] = await Promise.all([
    prisma.mK.count({ where: { currentPosition: 'SUPPORT' } }),
    prisma.mK.count({ where: { currentPosition: 'NEUTRAL' } }),
    prisma.mK.count({ where: { currentPosition: 'AGAINST' } }),
    prisma.mK.count(),
  ]);

  return { support, neutral, against, total };
}

/**
 * Get all unique factions
 */
export async function getFactions(): Promise<string[]> {
  const factions = await prisma.mK.findMany({
    select: { faction: true },
    distinct: ['faction'],
    orderBy: { faction: 'asc' },
  });

  return factions.map(f => f.faction);
}

/**
 * Get a single MK by ID
 */
export async function getMKById(id: number): Promise<MKData | null> {
  const mk = await prisma.mK.findUnique({
    where: { id },
  });

  if (!mk) return null;

  return {
    ...mk,
    currentPosition: mk.currentPosition as PositionStatus,
  };
}

/**
 * Update MK position (admin only)
 */
export async function updateMKPosition(
  mkId: number,
  position: PositionStatus,
  changedBy: string,
  notes?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update the MK's current position
    await tx.mK.update({
      where: { id: mkId },
      data: { currentPosition: position as Position },
    });

    // Create a history entry
    await tx.positionHistory.create({
      data: {
        mkId,
        position: position as Position,
        changedBy,
        notes,
      },
    });
  });
}

/**
 * Bulk update MK positions (admin only)
 */
export async function bulkUpdatePositions(
  mkIds: number[],
  position: PositionStatus,
  changedBy: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update all MKs
    await tx.mK.updateMany({
      where: { id: { in: mkIds } },
      data: { currentPosition: position as Position },
    });

    // Create history entries for each
    await Promise.all(
      mkIds.map((mkId) =>
        tx.positionHistory.create({
          data: {
            mkId,
            position: position as Position,
            changedBy,
          },
        })
      )
    );
  });
}

/**
 * Get position history for an MK
 */
export async function getMKPositionHistory(mkId: number) {
  const history = await prisma.positionHistory.findMany({
    where: { mkId },
    orderBy: { changedAt: 'desc' },
  });

  return history.map(h => ({
    ...h,
    position: h.position as PositionStatus,
  }));
}

/**
 * Get filtered position statistics for charts
 */
export async function getFilteredPositionStats(
  filters: ChartFilterOptions
): Promise<FilteredPositionStats> {
  const where: any = {};

  // Build where clause based on filters
  const conditions = [];

  if (filters.factions && filters.factions.length > 0) {
    conditions.push({ faction: { in: filters.factions } });
  }

  if (filters.mkIds && filters.mkIds.length > 0) {
    conditions.push({ id: { in: filters.mkIds } });
  }

  // If we have both filters, use AND logic
  // If we have one filter, use that
  // If we have no filters, query all MKs
  if (conditions.length > 0) {
    where.AND = conditions;
  }

  // Get filtered MKs
  const filteredMKs = await prisma.mK.findMany({
    where,
    orderBy: { nameHe: 'asc' },
    select: {
      id: true,
      nameHe: true,
      faction: true,
      currentPosition: true,
    },
  });

  // Calculate position counts
  const support = filteredMKs.filter(mk => mk.currentPosition === 'SUPPORT').length;
  const neutral = filteredMKs.filter(mk => mk.currentPosition === 'NEUTRAL').length;
  const against = filteredMKs.filter(mk => mk.currentPosition === 'AGAINST').length;
  const filteredTotal = filteredMKs.length;

  // Total is always 120 (all MKs in Knesset)
  const total = 120;

  // Build MK breakdown
  const mkBreakdown = filteredMKs.map(mk => ({
    mkId: mk.id,
    name: mk.nameHe,
    faction: mk.faction,
    position: mk.currentPosition as PositionStatus,
  }));

  return {
    support,
    neutral,
    against,
    total,
    filteredTotal,
    mkBreakdown,
  };
}
