import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all health records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get('recordType');
    const sowId = searchParams.get('sowId');
    const boarId = searchParams.get('boarId');
    const pigletId = searchParams.get('pigletId');
    
    const records = await prisma.healthRecord.findMany({
      where: {
        ...(recordType && { recordType: recordType as any }),
        ...(sowId && { sowId }),
        ...(boarId && { boarId }),
        ...(pigletId && { pigletId }),
      },
      include: {
        sow: true,
        boar: true,
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
    console.error('Error fetching health records:', error);
    return NextResponse.json({ error: 'Failed to fetch health records' }, { status: 500 });
  }
}

// POST create new health record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const record = await prisma.healthRecord.create({
      data: {
        recordType: body.recordType,
        recordDate: new Date(body.recordDate),
        sowId: body.sowId,
        boarId: body.boarId,
        pigletId: body.pigletId,
        vaccineName: body.vaccineName,
        medicineName: body.medicineName,
        dosage: body.dosage,
        administeredBy: body.administeredBy,
        disease: body.disease,
        symptoms: body.symptoms,
        treatment: body.treatment,
        outcome: body.outcome,
        deathCause: body.deathCause,
        cost: body.cost,
        notes: body.notes,
      },
      include: {
        sow: true,
        boar: true,
        piglet: true,
      },
    });
    
    // If this is a mortality record, update the animal's status
    if (body.recordType === 'MORTALITY') {
      if (body.sowId) {
        await prisma.sow.update({
          where: { id: body.sowId },
          data: { status: 'DEAD' },
        });
      } else if (body.boarId) {
        await prisma.boar.update({
          where: { id: body.boarId },
          data: { status: 'DEAD' },
        });
      } else if (body.pigletId) {
        await prisma.piglet.update({
          where: { id: body.pigletId },
          data: { status: 'DEAD' },
        });
      }
    }
    
    // Log activity
    if (session?.user) {
      const animalTag = record.sow?.tagNumber || record.boar?.tagNumber || record.piglet?.tagNumber || 'Unknown';
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'HEALTH',
        entityId: record.id,
        entityName: `${body.recordType} - ${animalTag}`,
        details: { recordType: body.recordType, sowId: body.sowId, boarId: body.boarId, pigletId: body.pigletId },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating health record:', error);
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
  }
}
