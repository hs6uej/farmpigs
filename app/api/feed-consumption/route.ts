import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all feed consumption records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const penId = searchParams.get('penId');
    
    const records = await prisma.feedConsumption.findMany({
      where: {
        ...(penId && { penId }),
        ...(startDate && endDate && {
          recordDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      orderBy: { recordDate: 'desc' },
    });
    
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching feed consumption:', error);
    return NextResponse.json({ error: 'Failed to fetch feed consumption' }, { status: 500 });
  }
}

// POST create feed consumption record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const record = await prisma.feedConsumption.create({
      data: {
        recordDate: new Date(body.recordDate),
        penId: body.penId,
        feedType: body.feedType,
        quantity: body.quantity,
        cost: body.cost,
        notes: body.notes,
      },
    });
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'FEED',
        entityId: record.id,
        entityName: `${body.feedType} - ${body.quantity}kg`,
        details: { feedType: body.feedType, quantity: body.quantity, cost: body.cost, penId: body.penId },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating feed consumption:', error);
    return NextResponse.json({ error: 'Failed to create feed consumption' }, { status: 500 });
  }
}
