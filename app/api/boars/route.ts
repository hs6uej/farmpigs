import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// GET all boars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const boars = await prisma.boar.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        breedings: {
          orderBy: { breedingDate: 'desc' },
          take: 5,
          include: {
            sow: true,
            farrowing: true,
          },
        },
      },
      orderBy: { tagNumber: 'asc' },
    });
    
    return NextResponse.json(boars);
  } catch (error) {
    console.error('Error fetching boars:', error);
    return NextResponse.json({ error: 'Failed to fetch boars' }, { status: 500 });
  }
}

// POST create new boar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const boar = await prisma.boar.create({
      data: {
        tagNumber: body.tagNumber,
        breed: body.breed,
        birthDate: new Date(body.birthDate),
        status: body.status || 'ACTIVE',
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        notes: body.notes,
      },
    });
    
    // Log activity
    if (session?.user) {
      await logActivity({
        userId: session.user.id || '',
        userEmail: session.user.email || '',
        userName: session.user.name,
        action: 'CREATE',
        module: 'BOARS',
        entityId: boar.id,
        entityName: boar.tagNumber,
        details: { tagNumber: boar.tagNumber, breed: boar.breed, status: boar.status },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }
    
    return NextResponse.json(boar, { status: 201 });
  } catch (error) {
    console.error('Error creating boar:', error);
    return NextResponse.json({ error: 'Failed to create boar' }, { status: 500 });
  }
}
