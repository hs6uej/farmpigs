import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Get all dead piglets with their context
        const deadPiglets = await prisma.piglet.findMany({
            where: { status: 'DEAD' },
            select: {
                id: true,
                tagNumber: true,
                deathDate: true,
                deathCause: true,
                birthWeight: true,
                gender: true,
                farrowing: {
                    select: {
                        farrowingDate: true,
                        sow: {
                            select: {
                                tagNumber: true,
                                breed: true,
                            }
                        }
                    }
                }
            },
            orderBy: { deathDate: 'desc' }
        });

        // Also get mortality health records for sows/boars
        const mortalityRecords = await prisma.healthRecord.findMany({
            where: { recordType: 'MORTALITY' },
            include: {
                sow: { select: { tagNumber: true, breed: true } },
                boar: { select: { tagNumber: true, breed: true } },
                piglet: {
                    select: {
                        tagNumber: true,
                        farrowing: {
                            select: {
                                sow: { select: { tagNumber: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { recordDate: 'desc' }
        });

        // Aggregate death causes
        const causeSummary: Record<string, number> = {};
        deadPiglets.forEach(p => {
            const cause = p.deathCause || 'ไม่ระบุสาเหตุ';
            causeSummary[cause] = (causeSummary[cause] || 0) + 1;
        });

        const causeSummaryList = Object.entries(causeSummary)
            .map(([cause, count]) => ({
                cause,
                count,
                percentage: deadPiglets.length > 0
                    ? parseFloat(((count / deadPiglets.length) * 100).toFixed(2))
                    : 0
            }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            totalDeaths: deadPiglets.length,
            causeSummary: causeSummaryList,
            deathRecords: deadPiglets.map(p => ({
                id: p.id,
                pigletTag: p.tagNumber || '-',
                sowTag: p.farrowing?.sow?.tagNumber || '-',
                sowBreed: p.farrowing?.sow?.breed || '-',
                batchDate: p.farrowing?.farrowingDate || null,
                deathDate: p.deathDate,
                cause: p.deathCause || 'ไม่ระบุสาเหตุ',
                birthWeight: p.birthWeight,
                gender: p.gender,
            })),
            mortalityRecords: mortalityRecords.map(r => ({
                id: r.id,
                recordDate: r.recordDate,
                subject: r.sow?.tagNumber || r.boar?.tagNumber || r.piglet?.tagNumber || '-',
                subjectType: r.sowId ? 'sow' : r.boarId ? 'boar' : 'piglet',
                sowTag: r.sow?.tagNumber || r.piglet?.farrowing?.sow?.tagNumber || '-',
                cause: r.deathCause || r.disease || 'ไม่ระบุสาเหตุ',
                notes: r.notes || '',
            }))
        });
    } catch (error) {
        console.error('Error fetching death causes report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
