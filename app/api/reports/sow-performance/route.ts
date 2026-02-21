import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const sows = await prisma.sow.findMany({
            include: {
                farrowings: {
                    include: {
                        piglets: {
                            select: {
                                id: true,
                                status: true,
                                deathDate: true,
                                deathCause: true,
                                birthWeight: true,
                                gender: true,
                            }
                        }
                    }
                },
                healthRecords: {
                    where: { recordType: 'MORTALITY' },
                    select: {
                        recordDate: true,
                        deathCause: true,
                        disease: true,
                        notes: true,
                    }
                }
            },
        });

        const reportData = sows.map((sow: any) => {
            const totalLitters = sow.farrowings.length;

            let totalBorn = 0;
            let totalBornAlive = 0;
            let totalStillborn = 0;
            let totalBirthWeight = 0;
            let weightCount = 0;
            const deathDetails: {
                batchDate: string;
                deathDate: string | null;
                cause: string | null;
            }[] = [];

            sow.farrowings.forEach((f: any) => {
                totalBorn += f.totalBorn;
                totalBornAlive += f.bornAlive;
                totalStillborn += f.stillborn;
                if (f.averageBirthWeight) {
                    totalBirthWeight += f.averageBirthWeight;
                    weightCount++;
                }

                // Collect death records from piglets in this batch
                f.piglets
                    .filter((p: any) => p.status === 'DEAD')
                    .forEach((p: any) => {
                        deathDetails.push({
                            batchDate: f.farrowingDate,
                            deathDate: p.deathDate,
                            cause: p.deathCause || null,
                        });
                    });
            });

            const totalDeadPostFarrowing = deathDetails.length;
            const avgBornPerLitter = totalLitters > 0 ? totalBorn / totalLitters : 0;
            const survivors = totalBornAlive - totalDeadPostFarrowing;
            const survivalRate = totalBornAlive > 0
                ? (survivors / totalBornAlive) * 100
                : 0;
            const mortalityRate = totalBornAlive > 0
                ? (totalDeadPostFarrowing / totalBornAlive) * 100
                : 0;
            const avgBirthWeight = weightCount > 0 ? totalBirthWeight / weightCount : 0;

            return {
                id: sow.id,
                tagNumber: sow.tagNumber,
                breed: sow.breed,
                totalLitters,
                totalBorn,
                totalBornAlive,
                totalStillborn,
                totalDead: totalDeadPostFarrowing,
                survivors,
                survivalRate: parseFloat(survivalRate.toFixed(2)),
                mortalityRate: parseFloat(mortalityRate.toFixed(2)),
                avgBornPerLitter: parseFloat(avgBornPerLitter.toFixed(2)),
                avgBirthWeight: parseFloat(avgBirthWeight.toFixed(2)),
                deathDetails, // Array of {batchDate, deathDate, cause}
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error fetching sow performance report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
