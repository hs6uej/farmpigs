import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST create pen transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const pigletIds = body.pigletIds as string[];
    const toPenId = body.toPenId;
    
    const results = [];
    
    for (const pigletId of pigletIds) {
      const piglet = await prisma.piglet.findUnique({
        where: { id: pigletId },
      });
      
      if (!piglet) continue;
      
      // Create transfer record
      const transfer = await prisma.penTransfer.create({
        data: {
          pigletId: pigletId,
          fromPenId: piglet.currentPenId,
          toPenId: toPenId,
          transferDate: new Date(body.transferDate),
          reason: body.reason,
          notes: body.notes,
        },
      });
      
      // Update piglet's current pen
      await prisma.piglet.update({
        where: { id: pigletId },
        data: { currentPenId: toPenId },
      });
      
      // Update pen counts
      if (piglet.currentPenId) {
        await prisma.pen.update({
          where: { id: piglet.currentPenId },
          data: { currentCount: { decrement: 1 } },
        });
      }
      
      await prisma.pen.update({
        where: { id: toPenId },
        data: { currentCount: { increment: 1 } },
      });
      
      results.push(transfer);
    }
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'PEN_TRANSFER',
        entityId: results[0]?.id || '',
        entityName: `Transferred ${pigletIds.length} piglets`,
        details: { pigletCount: pigletIds.length, toPenId: toPenId, reason: body.reason },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error('Error creating pen transfers:', error);
    return NextResponse.json({ error: 'Failed to create pen transfers' }, { status: 500 });
  }
}

// GET pen transfer history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pigletId = searchParams.get('pigletId');
    
    const transfers = await prisma.penTransfer.findMany({
      where: pigletId ? { pigletId } : undefined,
      include: {
        piglet: true,
        toPen: true,
      },
      orderBy: { transferDate: 'desc' },
    });
    
    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching pen transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch pen transfers' }, { status: 500 });
  }
}
