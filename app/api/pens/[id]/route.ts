import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single pen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pen = await prisma.pen.findUnique({
      where: { id },
      include: {
        piglets: true,
      },
    });

    if (!pen) {
      return NextResponse.json({ error: 'Pen not found' }, { status: 404 });
    }

    return NextResponse.json(pen);
  } catch (error) {
    console.error('Error fetching pen:', error);
    return NextResponse.json({ error: 'Failed to fetch pen' }, { status: 500 });
  }
}

// PUT update pen
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const pen = await prisma.pen.update({
      where: { id },
      data: {
        penNumber: body.penNumber,
        penType: body.penType,
        capacity: body.capacity,
        currentCount: body.currentCount,
        notes: body.notes,
      },
    });

    return NextResponse.json(pen);
  } catch (error) {
    console.error('Error updating pen:', error);
    return NextResponse.json({ error: 'Failed to update pen' }, { status: 500 });
  }
}

// DELETE pen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if pen has piglets
    const pen = await prisma.pen.findUnique({
      where: { id },
      include: { piglets: true },
    });

    if (pen && pen.piglets.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pen with piglets. Please move piglets first.' },
        { status: 400 }
      );
    }

    await prisma.pen.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Pen deleted successfully' });
  } catch (error) {
    console.error('Error deleting pen:', error);
    return NextResponse.json({ error: 'Failed to delete pen' }, { status: 500 });
  }
}
