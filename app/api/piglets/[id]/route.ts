import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE piglet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.piglet.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting piglet:', error);
    return NextResponse.json({ error: 'Failed to delete piglet' }, { status: 500 });
  }
}

// GET single piglet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const piglet = await prisma.piglet.findUnique({
      where: { id },
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
        },
      },
    });
    
    if (!piglet) {
      return NextResponse.json({ error: 'Piglet not found' }, { status: 404 });
    }
    
    return NextResponse.json(piglet);
  } catch (error) {
    console.error('Error fetching piglet:', error);
    return NextResponse.json({ error: 'Failed to fetch piglet' }, { status: 500 });
  }
}
