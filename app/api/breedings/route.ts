import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all breedings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sowId = searchParams.get('sowId');
    
    const breedings = await prisma.breeding.findMany({
      where: sowId ? { sowId } : undefined,
      include: {
        sow: true,
        boar: true,
        farrowing: true,
      },
      orderBy: { breedingDate: 'desc' },
    });
    
    return NextResponse.json(breedings);
  } catch (error) {
    console.error('Error fetching breedings:', error);
    return NextResponse.json({ error: 'Failed to fetch breedings' }, { status: 500 });
  }
}

// POST create new breeding record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // Validate required fields
    if (!body.sowId) {
      return NextResponse.json({ error: 'กรุณาเลือกแม่พันธุ์', message: 'กรุณาเลือกแม่พันธุ์' }, { status: 400 });
    }
    if (!body.boarId) {
      return NextResponse.json({ error: 'กรุณาเลือกพ่อพันธุ์', message: 'กรุณาเลือกพ่อพันธุ์' }, { status: 400 });
    }
    if (!body.breedingDate) {
      return NextResponse.json({ error: 'กรุณาระบุวันผสม', message: 'กรุณาระบุวันผสม' }, { status: 400 });
    }
    
    // Calculate expected farrow date (114 days after breeding)
    const breedingDate = new Date(body.breedingDate);
    const expectedFarrowDate = new Date(breedingDate);
    expectedFarrowDate.setDate(expectedFarrowDate.getDate() + 114);
    
    const breeding = await prisma.breeding.create({
      data: {
        sowId: body.sowId,
        boarId: body.boarId,
        breedingDate: breedingDate,
        breedingMethod: body.breedingMethod || 'NATURAL',
        expectedFarrowDate: expectedFarrowDate,
        success: body.success,
        notes: body.notes || null,
      },
      include: {
        sow: true,
        boar: true,
      },
    });
    
    // Update sow status to PREGNANT if breeding is successful
    if (body.success) {
      await prisma.sow.update({
        where: { id: body.sowId },
        data: { status: 'PREGNANT' },
      });
    }
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'BREEDING',
        entityId: breeding.id,
        entityName: `${breeding.sow.tagNumber} x ${breeding.boar.tagNumber}`,
        details: { sowId: body.sowId, boarId: body.boarId, breedingDate: body.breedingDate, method: body.breedingMethod },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(breeding, { status: 201 });
  } catch (error) {
    console.error('Error creating breeding:', error);
    return NextResponse.json({ error: 'Failed to create breeding', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}
