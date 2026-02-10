import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Check user status
// POST - Lock user
// This is a temporary admin script endpoint

export async function GET() {
  try {
    const email = 'mac77717778@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        failedLoginAttempts: true,
        lockedAt: true,
        lockedUntil: true,
        lockedReason: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function POST() {
  try {
    const email = 'mac77717778@gmail.com';
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Lock the user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        lockedAt: new Date(),
        lockedReason: 'Locked by admin',
        failedLoginAttempts: 5,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        failedLoginAttempts: true,
        lockedAt: true,
        lockedUntil: true,
        lockedReason: true,
      }
    });

    return NextResponse.json({ 
      message: 'User has been locked',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
