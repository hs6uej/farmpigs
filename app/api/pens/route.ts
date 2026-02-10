import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all pens
export async function GET() {
  try {
    const pens = await prisma.pen.findMany({
      include: {
        piglets: true,
      },
      orderBy: { penNumber: 'asc' },
    });
    
    return NextResponse.json(pens);
  } catch (error) {
    console.error('Error fetching pens:', error);
    return NextResponse.json({ error: 'Failed to fetch pens' }, { status: 500 });
  }
}

// POST create new pen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const pen = await prisma.pen.create({
      data: {
        penNumber: body.penNumber,
        penType: body.penType,
        capacity: body.capacity,
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
        module: 'PENS',
        entityId: pen.id,
        entityName: pen.penNumber,
        details: { penNumber: pen.penNumber, penType: pen.penType, capacity: pen.capacity },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(pen, { status: 201 });
  } catch (error) {
    console.error('Error creating pen:', error);
    return NextResponse.json({ error: 'Failed to create pen' }, { status: 500 });
  }
}
