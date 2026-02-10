import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single farrowing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farrowing = await prisma.farrowing.findUnique({
      where: { id },
      include: {
        sow: true,
        breeding: {
          include: {
            boar: true,
          },
        },
        piglets: true,
      },
    });

    if (!farrowing) {
      return NextResponse.json({ error: 'Farrowing record not found' }, { status: 404 });
    }

    return NextResponse.json(farrowing);
  } catch (error) {
    console.error('Error fetching farrowing:', error);
    return NextResponse.json({ error: 'Failed to fetch farrowing' }, { status: 500 });
  }
}

// PUT update farrowing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const farrowing = await prisma.farrowing.update({
      where: { id },
      data: {
        farrowingDate: body.farrowingDate ? new Date(body.farrowingDate) : undefined,
        totalBorn: body.totalBorn,
        bornAlive: body.bornAlive,
        stillborn: body.stillborn,
        mummified: body.mummified,
        averageBirthWeight: body.averageBirthWeight,
        notes: body.notes,
      },
      include: {
        sow: true,
        breeding: true,
        piglets: true,
      },
    });

    return NextResponse.json(farrowing);
  } catch (error) {
    console.error('Error updating farrowing:', error);
    return NextResponse.json({ error: 'Failed to update farrowing' }, { status: 500 });
  }
}

// DELETE farrowing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if farrowing has piglets
    const farrowing = await prisma.farrowing.findUnique({
      where: { id },
      include: { piglets: true, sow: true, breeding: true },
    });

    if (!farrowing) {
      return NextResponse.json({ error: 'Farrowing not found' }, { status: 404 });
    }

    // Delete associated piglets first
    if (farrowing.piglets.length > 0) {
      await prisma.piglet.deleteMany({
        where: { farrowingId: id },
      });
    }

    // Update sow status back to pregnant
    if (farrowing.sow && farrowing.breeding) {
      await prisma.sow.update({
        where: { id: farrowing.sowId },
        data: { status: 'PREGNANT' },
      });
    }

    await prisma.farrowing.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Farrowing record deleted successfully' });
  } catch (error) {
    console.error('Error deleting farrowing:', error);
    return NextResponse.json({ error: 'Failed to delete farrowing' }, { status: 500 });
  }
}
