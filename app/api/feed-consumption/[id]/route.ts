import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single feed consumption record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedConsumption = await prisma.feedConsumption.findUnique({
      where: { id },
    });

    if (!feedConsumption) {
      return NextResponse.json({ error: 'Feed consumption record not found' }, { status: 404 });
    }

    return NextResponse.json(feedConsumption);
  } catch (error) {
    console.error('Error fetching feed consumption:', error);
    return NextResponse.json({ error: 'Failed to fetch feed consumption' }, { status: 500 });
  }
}

// PUT update feed consumption record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const feedConsumption = await prisma.feedConsumption.update({
      where: { id },
      data: {
        recordDate: body.recordDate ? new Date(body.recordDate) : undefined,
        penId: body.penId,
        feedType: body.feedType,
        quantity: body.quantity,
        cost: body.cost,
        notes: body.notes,
      },
    });

    return NextResponse.json(feedConsumption);
  } catch (error) {
    console.error('Error updating feed consumption:', error);
    return NextResponse.json({ error: 'Failed to update feed consumption' }, { status: 500 });
  }
}

// DELETE feed consumption record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.feedConsumption.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Feed consumption record deleted successfully' });
  } catch (error) {
    console.error('Error deleting feed consumption:', error);
    return NextResponse.json({ error: 'Failed to delete feed consumption' }, { status: 500 });
  }
}
