import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const whereClause: any = {};
        if (startDate && endDate) {
            whereClause.farrowingDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const farrowings = await prisma.farrowing.findMany({
            where: whereClause,
            include: {
                sow: true,
                piglets: {
                    select: {
                        status: true,
                        deathDate: true
                    }
                }
            },
            orderBy: {
                farrowingDate: 'desc',
            },
        });

        const reportData = farrowings.map((f: any) => {
            const bornAlive = f.bornAlive;
            const deadPiglets = f.piglets.filter((p: any) => p.status === 'DEAD').length;
            const survivors = bornAlive - deadPiglets;
            const survivalRate = bornAlive > 0 ? (survivors / bornAlive) * 100 : 0;

            return {
                id: f.id,
                sowTag: f.sow.tagNumber,
                batchDate: f.farrowingDate,
                bornAlive,
                stillborn: f.stillborn,
                mummified: f.mummified,
                deadPostFarrowing: deadPiglets,
                survivors,
                survivalRate: parseFloat(survivalRate.toFixed(2)),
            };
        });

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error fetching batch survival report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
