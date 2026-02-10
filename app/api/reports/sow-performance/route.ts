import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const sows = await prisma.sow.findMany({
            where: {
                status: { not: 'DEAD' } // Or include dead sows if needed
            },
            include: {
                farrowings: {
                    include: {
                        piglets: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            },
        });

        const reportData = sows.map((sow: any) => {
            const totalLitters = sow.farrowings.length;

            let totalBorn = 0;
            let totalBornAlive = 0;
            let totalDeadPostFarrowing = 0;
            let totalBirthWeight = 0;
            let weightCount = 0;

            sow.farrowings.forEach((f: any) => {
                totalBorn += f.totalBorn;
                totalBornAlive += f.bornAlive;
                totalDeadPostFarrowing += f.piglets.filter((p: any) => p.status === 'DEAD').length;
                if (f.averageBirthWeight) {
                    totalBirthWeight += f.averageBirthWeight;
                    weightCount++;
                }
            });

            const avgBornPerLitter = totalLitters > 0 ? totalBorn / totalLitters : 0;
            const survivalRate = totalBornAlive > 0
                ? ((totalBornAlive - totalDeadPostFarrowing) / totalBornAlive) * 100
                : 0;
            const avgBirthWeight = weightCount > 0 ? totalBirthWeight / weightCount : 0;

            return {
                id: sow.id,
                tagNumber: sow.tagNumber,
                breed: sow.breed,
                totalLitters,
                totalBorn,
                totalBornAlive,
                totalDead: totalDeadPostFarrowing,
                survivalRate: parseFloat(survivalRate.toFixed(2)),
                avgBornPerLitter: parseFloat(avgBornPerLitter.toFixed(2)),
                avgBirthWeight: parseFloat(avgBirthWeight.toFixed(2)),
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error fetching sow performance report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
