import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single breeding by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const breeding = await prisma.breeding.findUnique({
      where: { id },
      include: {
        sow: true,
        boar: true,
        farrowing: true,
      },
    });
    
    if (!breeding) {
      return NextResponse.json({ error: 'Breeding not found' }, { status: 404 });
    }
    
    return NextResponse.json(breeding);
  } catch (error) {
    console.error('Error fetching breeding:', error);
    return NextResponse.json({ error: 'Failed to fetch breeding' }, { status: 500 });
  }
}

// PUT update breeding
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingBreeding = await prisma.breeding.findUnique({
      where: { id },
    });
    
    if (!existingBreeding) {
      return NextResponse.json({ error: 'Breeding not found' }, { status: 404 });
    }
    
    // Calculate expected farrow date if breeding date changed
    let expectedFarrowDate = body.expectedFarrowDate;
    if (body.breedingDate && !body.expectedFarrowDate) {
      const breedingDate = new Date(body.breedingDate);
      const calcExpected = new Date(breedingDate);
      calcExpected.setDate(calcExpected.getDate() + 114);
      expectedFarrowDate = calcExpected;
    }
    
    const breeding = await prisma.breeding.update({
      where: { id },
      data: {
        sowId: body.sowId,
        boarId: body.boarId,
        breedingDate: body.breedingDate ? new Date(body.breedingDate) : undefined,
        breedingMethod: body.breedingMethod,
        expectedFarrowDate: expectedFarrowDate ? new Date(expectedFarrowDate) : null,
        success: body.success,
        notes: body.notes,
      },
      include: {
        sow: true,
        boar: true,
      },
    });
    
    // Update sow status based on breeding success
    if (body.success === true) {
      await prisma.sow.update({
        where: { id: body.sowId || existingBreeding.sowId },
        data: { status: 'PREGNANT' },
      });
    } else if (body.success === false) {
      await prisma.sow.update({
        where: { id: body.sowId || existingBreeding.sowId },
        data: { status: 'ACTIVE' },
      });
    }
    
    return NextResponse.json(breeding);
  } catch (error) {
    console.error('Error updating breeding:', error);
    return NextResponse.json({ error: 'Failed to update breeding' }, { status: 500 });
  }
}

// DELETE breeding
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existingBreeding = await prisma.breeding.findUnique({
      where: { id },
      include: { farrowing: true },
    });
    
    if (!existingBreeding) {
      return NextResponse.json({ error: 'Breeding not found' }, { status: 404 });
    }
    
    // Check if breeding has associated farrowing
    if (existingBreeding.farrowing) {
      return NextResponse.json(
        { error: 'Cannot delete breeding with associated farrowing record' },
        { status: 400 }
      );
    }
    
    await prisma.breeding.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Breeding deleted successfully' });
  } catch (error) {
    console.error('Error deleting breeding:', error);
    return NextResponse.json({ error: 'Failed to delete breeding' }, { status: 500 });
  }
}
