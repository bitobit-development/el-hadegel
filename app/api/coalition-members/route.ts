import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { COALITION_FACTIONS } from '@/lib/coalition';

export async function GET(request: NextRequest) {
  try {
    const coalitionMKs = await prisma.mK.findMany({
      where: {
        faction: {
          in: COALITION_FACTIONS
        }
      },
      select: {
        id: true,
        nameHe: true,
        faction: true
      },
      orderBy: [
        { faction: 'asc' },
        { nameHe: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      total: coalitionMKs.length,
      members: coalitionMKs,
      byFaction: coalitionMKs.reduce((acc, mk) => {
        if (!acc[mk.faction]) acc[mk.faction] = [];
        acc[mk.faction].push(mk);
        return acc;
      }, {} as Record<string, typeof coalitionMKs>)
    });
  } catch (error) {
    console.error('Error fetching coalition members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coalition members' },
      { status: 500 }
    );
  }
}
