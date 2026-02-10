/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all piglets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const farrowingId = searchParams.get('farrowingId');
    const penId = searchParams.get('penId');
    
    const piglets = await prisma.piglet.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(farrowingId && { farrowingId }),
        ...(penId && { currentPenId: penId }),
      },
      include: {
        farrowing: {
          include: {
            sow: true,
          },
        },
        currentPen: true,
        weaning: true,
        growthRecords: {
          orderBy: { recordDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(piglets);
  } catch (error) {
    console.error('Error fetching piglets:', error);
    return NextResponse.json({ error: 'Failed to fetch piglets' }, { status: 500 });
  }
}

// POST create or update piglet
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    // If id exists, update the piglet
    if (body.id) {
      // Validate tagNumber for update
      if (!body.tagNumber?.trim()) {
        return NextResponse.json(
          { error: 'กรุณากรอก Tag Number (Tag Number is required)' },
          { status: 400 }
        );
      }
      
      const piglet = await prisma.piglet.update({
        where: { id: body.id },
        data: {
          tagNumber: body.tagNumber.trim(),
          currentPenId: body.currentPenId || null,
          status: body.status,
          gender: body.gender,
          notes: body.notes,
        },
      });
      
      // Log update activity
      if (session?.user) {
        await logActivity({
          userId: session.user.id || '',
          userEmail: session.user.email || '',
          userName: session.user.name,
          action: 'UPDATE',
          module: 'PIGLETS',
          entityId: piglet.id,
          entityName: piglet.tagNumber || piglet.id,
          details: { tagNumber: piglet.tagNumber, currentPenId: piglet.currentPenId, status: piglet.status, gender: piglet.gender },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });
      }
      
      return NextResponse.json(piglet);
    }
    
    // Validate required fields for creating new piglet
    if (!body.tagNumber?.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอก Tag Number (Tag Number is required)' },
        { status: 400 }
      );
    }
    
    if (!body.farrowingId) {
      return NextResponse.json(
        { error: 'กรุณาเลือกการคลอด (Farrowing is required)' },
        { status: 400 }
      );
    }
    
    // Create new piglet
    const piglet = await prisma.piglet.create({
      data: {
        tagNumber: body.tagNumber.trim(),
        farrowingId: body.farrowingId,
        birthWeight: body.birthWeight || null,
        currentPenId: body.currentPenId || null,
        status: body.status || 'NURSING',
        gender: body.gender || null,
        notes: body.notes || null,
      },
    });
    
    // Log create activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'PIGLETS',
        entityId: piglet.id,
        entityName: piglet.tagNumber || piglet.id,
        details: { tagNumber: piglet.tagNumber, status: piglet.status, gender: piglet.gender, farrowingId: piglet.farrowingId },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(piglet);
  } catch (error) {
    console.error('Error saving piglet:', error);
    return NextResponse.json({ error: 'Failed to save piglet' }, { status: 500 });
  }
}
