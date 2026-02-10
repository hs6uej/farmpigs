import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST create weaning record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const pigletIds = body.pigletIds as string[]; // Array of piglet IDs to wean
    
    const weaningDate = new Date(body.weaningDate);
    const results = [];
    
    for (const pigletId of pigletIds) {
      // Get piglet with farrowing info to calculate age
      const piglet = await prisma.piglet.findUnique({
        where: { id: pigletId },
        include: {
          farrowing: true,
        },
      });
      
      if (!piglet) continue;
      
      // Calculate age at weaning
      const farrowingDate = new Date(piglet.farrowing.farrowingDate);
      const ageAtWeaning = Math.floor(
        (weaningDate.getTime() - farrowingDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Create weaning record
      const weaning = await prisma.weaning.create({
        data: {
          pigletId: pigletId,
          weaningDate: weaningDate,
          weaningWeight: body.weaningWeight || 0,
          ageAtWeaning: ageAtWeaning,
          notes: body.notes,
        },
      });
      
      // Update piglet status
      await prisma.piglet.update({
        where: { id: pigletId },
        data: { status: 'WEANED' },
      });
      
      results.push(weaning);
    }
    
    // Update sow status to WEANED
    if (body.sowId) {
      await prisma.sow.update({
        where: { id: body.sowId },
        data: { status: 'WEANED' },
      });
    }
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'WEANING',
        entityId: results[0]?.id || '',
        entityName: `Weaned ${pigletIds.length} piglets`,
        details: { pigletCount: pigletIds.length, sowId: body.sowId, weaningDate: body.weaningDate },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Error creating weaning records:', error);
    return NextResponse.json({ error: 'Failed to create weaning records' }, { status: 500 });
  }
}
