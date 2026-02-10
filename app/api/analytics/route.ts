import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total counts
    const [totalSows, totalBoars, totalPiglets, totalPens] = await Promise.all([
      prisma.sow.count({ where: { status: { not: 'DEAD' } } }),
      prisma.boar.count({ where: { status: { not: 'DEAD' } } }),
      prisma.piglet.count({ where: { status: { not: 'DEAD' } } }),
      prisma.pen.count(),
    ]);

    // Get sow status breakdown
    const sowsByStatus = await prisma.sow.groupBy({
      by: ['status'],
      _count: true,
      where: { status: { not: 'DEAD' } },
    });

    // Get piglet status breakdown
    const pigletsByStatus = await prisma.piglet.groupBy({
      by: ['status'],
      _count: true,
      where: { status: { not: 'DEAD' } },
    });

    // Calculate breeding success rate (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const totalBreedings = await prisma.breeding.count({
      where: { breedingDate: { gte: sixMonthsAgo } },
    });

    const successfulBreedings = await prisma.breeding.count({
      where: {
        breedingDate: { gte: sixMonthsAgo },
        success: true,
      },
    });

    const breedingSuccessRate = totalBreedings > 0 
      ? ((successfulBreedings / totalBreedings) * 100).toFixed(2)
      : 0;

    // Get farrowing statistics (last 6 months)
    const farrowings = await prisma.farrowing.findMany({
      where: { farrowingDate: { gte: sixMonthsAgo } },
    });

    const totalFarrowings = farrowings.length;
    const totalBorn = farrowings.reduce((sum, f) => sum + f.totalBorn, 0);
    const totalBornAlive = farrowings.reduce((sum, f) => sum + f.bornAlive, 0);
    const avgPigletsPerLitter = totalFarrowings > 0 
      ? (totalBornAlive / totalFarrowings).toFixed(2)
      : 0;
    const survivalRate = totalBorn > 0 
      ? ((totalBornAlive / totalBorn) * 100).toFixed(2)
      : 0;

    // Calculate mortality rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDeaths = await prisma.healthRecord.count({
      where: {
        recordType: 'MORTALITY',
        recordDate: { gte: thirtyDaysAgo },
      },
    });

    const totalAnimals = totalSows + totalBoars + totalPiglets;
    const mortalityRate = totalAnimals > 0 
      ? ((recentDeaths / totalAnimals) * 100).toFixed(2)
      : 0;

    // Get average daily gain (last 30 days)
    const recentGrowthRecords = await prisma.growthRecord.findMany({
      where: {
        recordDate: { gte: thirtyDaysAgo },
        adg: { not: null },
      },
    });

    const avgDailyGain = recentGrowthRecords.length > 0
      ? (recentGrowthRecords.reduce((sum, r) => sum + (r.adg || 0), 0) / recentGrowthRecords.length).toFixed(3)
      : 0;

    // Calculate Feed Conversion Ratio (FCR) - last 30 days
    const feedConsumed = await prisma.feedConsumption.aggregate({
      where: { recordDate: { gte: thirtyDaysAgo } },
      _sum: { quantity: true },
    });

    // Get weight gain for piglets in last 30 days
    const pigletWeightGain = await prisma.$queryRaw<Array<{ totalGain: number }>>`
      SELECT COALESCE(SUM(gr2.weight - gr1.weight), 0) as "totalGain"
      FROM "GrowthRecord" gr1
      INNER JOIN "GrowthRecord" gr2 ON gr1."pigletId" = gr2."pigletId"
      WHERE gr1."recordDate" >= ${thirtyDaysAgo}
      AND gr2."recordDate" > gr1."recordDate"
      AND gr2."recordDate" >= ${thirtyDaysAgo}
    `;

    const totalWeightGain = pigletWeightGain[0]?.totalGain || 0;
    const fcr = totalWeightGain > 0 && feedConsumed._sum.quantity
      ? (feedConsumed._sum.quantity / totalWeightGain).toFixed(2)
      : null;

    // Get upcoming expected farrowings (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingFarrowings = await prisma.breeding.findMany({
      where: {
        expectedFarrowDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
        farrowing: null, // Not yet farrowed
      },
      include: {
        sow: true,
        boar: true,
      },
      orderBy: { expectedFarrowDate: 'asc' },
      take: 10,
    });

    // Recent activities
    const recentHealthRecords = await prisma.healthRecord.findMany({
      orderBy: { recordDate: 'desc' },
      take: 5,
      include: {
        sow: true,
        boar: true,
        piglet: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalSows,
        totalBoars,
        totalPiglets,
        totalPens,
        totalAnimals,
      },
      sowsByStatus: sowsByStatus.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      pigletsByStatus: pigletsByStatus.reduce((acc, p) => {
        acc[p.status] = p._count;
        return acc;
      }, {} as Record<string, number>),
      performance: {
        breedingSuccessRate: parseFloat(breedingSuccessRate as string),
        avgPigletsPerLitter: parseFloat(avgPigletsPerLitter as string),
        survivalRate: parseFloat(survivalRate as string),
        mortalityRate: parseFloat(mortalityRate as string),
        avgDailyGain: parseFloat(avgDailyGain as string),
        fcr: fcr ? parseFloat(fcr) : null,
      },
      upcomingFarrowings,
      recentHealthRecords,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
