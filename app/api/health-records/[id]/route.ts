import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single health record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const healthRecord = await prisma.healthRecord.findUnique({
      where: { id },
      include: {
        sow: true,
        boar: true,
        piglet: true,
      },
    });

    if (!healthRecord) {
      return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
    }

    return NextResponse.json(healthRecord);
  } catch (error) {
    console.error('Error fetching health record:', error);
    return NextResponse.json({ error: 'Failed to fetch health record' }, { status: 500 });
  }
}

// PUT update health record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const healthRecord = await prisma.healthRecord.update({
      where: { id },
      data: {
        recordType: body.recordType,
        recordDate: body.recordDate ? new Date(body.recordDate) : undefined,
        sowId: body.sowId || null,
        boarId: body.boarId || null,
        pigletId: body.pigletId || null,
        vaccineName: body.vaccineName,
        medicineName: body.medicineName,
        dosage: body.dosage,
        disease: body.disease,
        symptoms: body.symptoms,
        treatment: body.treatment,
        cost: body.cost,
        administeredBy: body.administeredBy,
        notes: body.notes,
      },
      include: {
        sow: true,
        boar: true,
        piglet: true,
      },
    });

    return NextResponse.json(healthRecord);
  } catch (error) {
    console.error('Error updating health record:', error);
    return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 });
  }
}

// DELETE health record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.healthRecord.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Health record deleted successfully' });
  } catch (error) {
    console.error('Error deleting health record:', error);
    return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
  }
}
