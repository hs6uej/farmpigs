import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to 30 days if no date provided, or use specific defaults per metric if needed
    // But for "Dashboard Summary", usually we want everything to verify the selected range.

    const now = new Date();
    let startDate = new Date();
    startDate.setDate(now.getDate() - 30); // Default 30 days
    let endDate = now;

    if (startDateParam) startDate = new Date(startDateParam);
    if (endDateParam) endDate = new Date(endDateParam);

    // Get total counts (Snapshot, not affected by date range unless asking for "Growth")
    const [totalSows, totalBoars, totalPiglets, totalPens] = await Promise.all([
      prisma.sow.count({ where: { status: { not: 'DEAD' } } }),
      prisma.boar.count({ where: { status: { not: 'DEAD' } } }),
      prisma.piglet.count({ where: { status: { not: 'DEAD' } } }),
      prisma.pen.count(),
    ]);

    // Get sow status breakdown (Snapshot)
    const sowsByStatus = await prisma.sow.groupBy({
      by: ['status'],
      _count: true,
      where: { status: { not: 'DEAD' } },
    });

    // Get piglet status breakdown (Snapshot)
    const pigletsByStatus = await prisma.piglet.groupBy({
      by: ['status'],
      _count: true,
      where: { status: { not: 'DEAD' } },
    });

    // Calculate breeding success rate (in selected range)
    const totalBreedings = await prisma.breeding.count({
      where: { breedingDate: { gte: startDate, lte: endDate } },
    });

    const successfulBreedings = await prisma.breeding.count({
      where: {
        breedingDate: { gte: startDate, lte: endDate },
        success: true,
      },
    });

    const breedingSuccessRate = totalBreedings > 0
      ? ((successfulBreedings / totalBreedings) * 100).toFixed(2)
      : 0;

    // Get farrowing statistics (in selected range)
    const farrowings = await prisma.farrowing.findMany({
      where: { farrowingDate: { gte: startDate, lte: endDate } },
    });

    const totalFarrowings = farrowings.length;
    const totalBorn = farrowings.reduce((sum: number, f: any) => sum + f.totalBorn, 0);
    const totalBornAlive = farrowings.reduce((sum: number, f: any) => sum + f.bornAlive, 0);
    const avgPigletsPerLitter = totalFarrowings > 0
      ? (totalBornAlive / totalFarrowings).toFixed(2)
      : 0;
    const survivalRate = totalBorn > 0
      ? ((totalBornAlive / totalBorn) * 100).toFixed(2)
      : 0;

    // Calculate mortality rate (in selected range)
    const recentDeaths = await prisma.healthRecord.count({
      where: {
        recordType: 'MORTALITY',
        recordDate: { gte: startDate, lte: endDate },
      },
    });

    const totalAnimals = totalSows + totalBoars + totalPiglets;
    // Note: Mortality rate over a period ideally uses average population, but using current total is a common approximation.
    const mortalityRate = totalAnimals > 0
      ? ((recentDeaths / totalAnimals) * 100).toFixed(2)
      : 0;

    // Get average daily gain (in selected range)
    const recentGrowthRecords = await prisma.growthRecord.findMany({
      where: {
        recordDate: { gte: startDate, lte: endDate },
        adg: { not: null },
      },
    });

    const avgDailyGain = recentGrowthRecords.length > 0
      ? (recentGrowthRecords.reduce((sum: number, r: any) => sum + (r.adg || 0), 0) / recentGrowthRecords.length).toFixed(3)
      : 0;

    // Calculate Feed Conversion Ratio (FCR) - in selected range
    const feedConsumed = await prisma.feedConsumption.aggregate({
      where: { recordDate: { gte: startDate, lte: endDate } },
      _sum: { quantity: true },
    });

    // Get weight gain for piglets in selected range
    // Note: Raw query might need adjustment for date parameters if using parameters directly.
    // Ensure `startDate` and `endDate` are passed correctly to raw query.
    // Using simple concatenation for now (be careful with injection if user input, but searchParams are usually strings)
    // Actually, Prisma $queryRaw uses template literals for safety.
    const pigletWeightGain = await prisma.$queryRaw<Array<{ totalGain: number }>>`
      SELECT COALESCE(SUM(gr2.weight - gr1.weight), 0) as "totalGain"
      FROM "GrowthRecord" gr1
      INNER JOIN "GrowthRecord" gr2 ON gr1."pigletId" = gr2."pigletId"
      WHERE gr1."recordDate" >= ${startDate}
      AND gr2."recordDate" > gr1."recordDate"
      AND gr2."recordDate" <= ${endDate} 
    `;
    // Modified query to respect both start and end dates somewhat (gr2 recordDate <= end)

    const totalWeightGain = pigletWeightGain[0]?.totalGain || 0;
    const fcr = totalWeightGain > 0 && feedConsumed._sum.quantity
      ? (feedConsumed._sum.quantity / totalWeightGain).toFixed(2)
      : null;

    // Get upcoming expected farrowings (next 30 days from NOW, unrelated to selected range usually, or maybe we want "Upcoming in selected range"?)
    // "Dashboard Summary" usually shows "Upcoming Tasks". So keep it "Next 30 days".
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
