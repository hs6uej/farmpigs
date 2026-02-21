import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET single sow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sow = await prisma.sow.findUnique({
      where: { id },
      include: {
        breedings: {
          include: {
            boar: true,
            farrowing: {
              include: {
                piglets: true,
              },
            },
          },
          orderBy: { breedingDate: 'desc' },
        },
        farrowings: {
          include: {
            breeding: {
              include: {
                boar: true,
              },
            },
            piglets: true,
          },
          orderBy: { farrowingDate: 'desc' },
        },
        healthRecords: {
          orderBy: { recordDate: 'desc' },
        },
      },
    });

    if (!sow) {
      return NextResponse.json({ error: 'Sow not found' }, { status: 404 });
    }

    return NextResponse.json(sow);
  } catch (error) {
    console.error('Error fetching sow:', error);
    return NextResponse.json({ error: 'Failed to fetch sow' }, { status: 500 });
  }
}

// PUT update sow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();

    // Get current status before update
    const existing = await prisma.sow.findUnique({ where: { id }, select: { status: true, tagNumber: true } });

    const sow = await prisma.sow.update({
      where: { id },
      data: {
        tagNumber: body.tagNumber,
        breed: body.breed,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        status: body.status,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        notes: body.notes,
      },
    });

    // Trigger death notification when status changes to DEAD
    if (body.status === 'DEAD' && existing?.status !== 'DEAD') {
      await prisma.notification.create({
        data: {
          userId: null, // broadcast
          title: '🚨 แม่พันธุ์เสียชีวิต',
          message: `แม่พันธุ์ ${sow.tagNumber} (สายพันธุ์: ${sow.breed}) เสียชีวิตแล้ว`,
          type: 'WARNING',
          category: 'mortality',
          link: '/sows',
        },
      });
    }

    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'UPDATE',
        module: 'SOWS',
        entityId: id,
        entityName: sow.tagNumber,
        details: { tagNumber: sow.tagNumber, breed: sow.breed, status: sow.status },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json(sow);
  } catch (error) {
    console.error('Error updating sow:', error);
    return NextResponse.json({ error: 'Failed to update sow' }, { status: 500 });
  }
}

// DELETE sow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    // Get sow info before deletion for logging
    const sowToDelete = await prisma.sow.findUnique({ where: { id } });

    await prisma.sow.delete({
      where: { id },
    });

    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'DELETE',
        module: 'SOWS',
        entityId: id,
        entityName: sowToDelete?.tagNumber || id,
        details: { deletedSow: sowToDelete?.tagNumber },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json({ message: 'Sow deleted successfully' });
  } catch (error) {
    console.error('Error deleting sow:', error);
    return NextResponse.json({ error: 'Failed to delete sow' }, { status: 500 });
  }
}
