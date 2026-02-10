import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST create growth record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Get piglet's previous weight to calculate ADG
    const piglet = await prisma.piglet.findUnique({
      where: { id: body.pigletId },
      include: {
        farrowing: true,
        growthRecords: {
          orderBy: { recordDate: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!piglet) {
      return NextResponse.json({ error: 'Piglet not found' }, { status: 404 });
    }
    
    // Calculate age in days
    const recordDate = new Date(body.recordDate);
    const farrowingDate = new Date(piglet.farrowing.farrowingDate);
    const ageInDays = Math.floor(
      (recordDate.getTime() - farrowingDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate ADG if there's a previous record
    let adg = null;
    if (piglet.growthRecords.length > 0) {
      const previousRecord = piglet.growthRecords[0];
      const daysDiff = Math.floor(
        (recordDate.getTime() - new Date(previousRecord.recordDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 0) {
        adg = (body.weight - previousRecord.weight) / daysDiff;
      }
    } else if (piglet.birthWeight) {
      // Calculate from birth weight
      adg = (body.weight - piglet.birthWeight) / ageInDays;
    }
    
    const growthRecord = await prisma.growthRecord.create({
      data: {
        pigletId: body.pigletId,
        recordDate: recordDate,
        weight: body.weight,
        ageInDays: ageInDays,
        adg: adg,
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
        module: 'GROWTH_RECORD',
        entityId: growthRecord.id,
        entityName: `${piglet.tagNumber || piglet.id} - ${body.weight}kg`,
        details: { pigletId: body.pigletId, weight: body.weight, ageInDays },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(growthRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating growth record:', error);
    return NextResponse.json({ error: 'Failed to create growth record' }, { status: 500 });
  }
}

// GET growth records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pigletId = searchParams.get('pigletId');
    
    const records = await prisma.growthRecord.findMany({
      where: pigletId ? { pigletId } : undefined,
      include: {
        piglet: {
          include: {
            farrowing: {
              include: {
                sow: true,
              },
            },
          },
        },
      },
      orderBy: { recordDate: 'desc' },
    });
    
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching growth records:', error);
    return NextResponse.json({ error: 'Failed to fetch growth records' }, { status: 500 });
  }
}
