import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all farrowing records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sowId = searchParams.get('sowId');
    
    const farrowings = await prisma.farrowing.findMany({
      where: sowId ? { sowId } : undefined,
      include: {
        sow: true,
        breeding: {
          include: {
            boar: true,
          },
        },
        piglets: true,
      },
      orderBy: { farrowingDate: 'desc' },
    });
    
    return NextResponse.json(farrowings);
  } catch (error) {
    console.error('Error fetching farrowings:', error);
    return NextResponse.json({ error: 'Failed to fetch farrowings' }, { status: 500 });
  }
}

// POST create new farrowing record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const farrowing = await prisma.farrowing.create({
      data: {
        sowId: body.sowId,
        breedingId: body.breedingId,
        farrowingDate: new Date(body.farrowingDate),
        totalBorn: body.totalBorn,
        bornAlive: body.bornAlive,
        stillborn: body.stillborn || 0,
        mummified: body.mummified || 0,
        averageBirthWeight: body.averageBirthWeight,
        notes: body.notes,
      },
      include: {
        sow: true,
        breeding: true,
      },
    });
    
    // Update sow status to LACTATING
    await prisma.sow.update({
      where: { id: body.sowId },
      data: { status: 'LACTATING' },
    });
    
    // Update breeding success status
    await prisma.breeding.update({
      where: { id: body.breedingId },
      data: { success: true },
    });
    
    // Create piglet records
    if (body.bornAlive > 0) {
      const piglets = Array.from({ length: body.bornAlive }, (_, i) => ({
        farrowingId: farrowing.id,
        status: 'NURSING' as const,
        birthWeight: body.averageBirthWeight,
      }));
      
      await prisma.piglet.createMany({
        data: piglets,
      });
    }
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'FARROWING',
        entityId: farrowing.id,
        entityName: farrowing.sow.tagNumber,
        details: { sowId: body.sowId, totalBorn: body.totalBorn, bornAlive: body.bornAlive, farrowingDate: body.farrowingDate },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(farrowing, { status: 201 });
  } catch (error) {
    console.error('Error creating farrowing:', error);
    return NextResponse.json({ error: 'Failed to create farrowing' }, { status: 500 });
  }
}
