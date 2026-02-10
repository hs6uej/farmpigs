import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all sows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const sows = await prisma.sow.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        breedings: {
          orderBy: { breedingDate: 'desc' },
          take: 1,
          include: {
            boar: true,
            farrowing: true,
          },
        },
        farrowings: {
          orderBy: { farrowingDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { tagNumber: 'asc' },
    });
    
    return NextResponse.json(sows);
  } catch (error) {
    console.error('Error fetching sows:', error);
    return NextResponse.json({ error: 'Failed to fetch sows' }, { status: 500 });
  }
}

// POST create new sow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const sow = await prisma.sow.create({
      data: {
        tagNumber: body.tagNumber,
        breed: body.breed,
        birthDate: new Date(body.birthDate),
        status: body.status || 'ACTIVE',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
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
        module: 'SOWS',
        entityId: sow.id,
        entityName: sow.tagNumber,
        details: { tagNumber: sow.tagNumber, breed: sow.breed, status: sow.status },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(sow, { status: 201 });
  } catch (error) {
    console.error('Error creating sow:', error);
    return NextResponse.json({ error: 'Failed to create sow' }, { status: 500 });
  }
}
