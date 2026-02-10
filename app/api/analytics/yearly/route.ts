import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get data for the last 12 months
    const now = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      // Get breeding data for this month
      const totalBreedings = await prisma.breeding.count({
        where: {
          breedingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const successfulBreedings = await prisma.breeding.count({
        where: {
          breedingDate: {
            gte: startDate,
            lte: endDate,
          },
          success: true,
        },
      });

      const breedingSuccessRate = totalBreedings > 0 
        ? parseFloat(((successfulBreedings / totalBreedings) * 100).toFixed(1))
        : 0;

      // Get farrowing data for this month
      const farrowings = await prisma.farrowing.findMany({
        where: {
          farrowingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalFarrowings = farrowings.length;
      const totalBorn = farrowings.reduce((sum, f) => sum + f.totalBorn, 0);
      const totalBornAlive = farrowings.reduce((sum, f) => sum + f.bornAlive, 0);
      
      const avgPigletsPerLitter = totalFarrowings > 0 
        ? parseFloat((totalBornAlive / totalFarrowings).toFixed(1))
        : 0;
      
      const survivalRate = totalBorn > 0 
        ? parseFloat(((totalBornAlive / totalBorn) * 100).toFixed(1))
        : 0;

      monthlyData.push({
        month: startDate.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
        monthEn: startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        breedingSuccessRate,
        survivalRate,
        avgPigletsPerLitter,
        totalBreedings,
        successfulBreedings,
        totalFarrowings,
        totalBorn,
        totalBornAlive,
      });
    }

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Error fetching yearly analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch yearly analytics' }, { status: 500 });
  }
}
