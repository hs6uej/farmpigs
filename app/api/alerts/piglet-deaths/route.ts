import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        // Count piglets with deathDate today OR status changed to DEAD today (if we track status history, but we don't really have detailed history except ActivityLog)
        // We added `deathDate` to Piglet model, so we use that.

        const deathCount = await prisma.piglet.count({
            where: {
                deathDate: {
                    gte: start,
                    lte: end,
                },
            },
        });

        // Also check HealthRecords of type MORTALITY created today (as a backup or primary source if deathDate wasn't set)
        // But since we added deathDate, we should rely on it. However, let's check both or just prioritize deathDate.
        // Actually, let's just use deathDate for simplicity as per our schema update.

        return NextResponse.json({ count: deathCount });
    } catch (error) {
        console.error('Error checking death alerts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
