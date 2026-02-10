import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single boar by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const boar = await prisma.boar.findUnique({
      where: { id },
      include: {
        breedings: {
          include: {
            sow: true,
            farrowing: true,
          },
          orderBy: { breedingDate: 'desc' },
        },
      },
    });
    
    if (!boar) {
      return NextResponse.json({ error: 'Boar not found' }, { status: 404 });
    }
    
    return NextResponse.json(boar);
  } catch (error) {
    console.error('Error fetching boar:', error);
    return NextResponse.json({ error: 'Failed to fetch boar' }, { status: 500 });
  }
}

// PUT update boar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingBoar = await prisma.boar.findUnique({
      where: { id },
    });
    
    if (!existingBoar) {
      return NextResponse.json({ error: 'Boar not found' }, { status: 404 });
    }
    
    const boar = await prisma.boar.update({
      where: { id },
      data: {
        tagNumber: body.tagNumber,
        breed: body.breed,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        status: body.status,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        notes: body.notes,
      },
    });
    
    return NextResponse.json(boar);
  } catch (error) {
    console.error('Error updating boar:', error);
    return NextResponse.json({ error: 'Failed to update boar' }, { status: 500 });
  }
}

// DELETE boar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existingBoar = await prisma.boar.findUnique({
      where: { id },
      include: { breedings: true },
    });
    
    if (!existingBoar) {
      return NextResponse.json({ error: 'Boar not found' }, { status: 404 });
    }
    
    // Check if boar has associated breedings
    if (existingBoar.breedings && existingBoar.breedings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete boar with associated breeding records' },
        { status: 400 }
      );
    }
    
    await prisma.boar.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Boar deleted successfully' });
  } catch (error) {
    console.error('Error deleting boar:', error);
    return NextResponse.json({ error: 'Failed to delete boar' }, { status: 500 });
  }
}
