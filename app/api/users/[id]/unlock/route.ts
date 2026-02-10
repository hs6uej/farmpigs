import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

// POST /api/users/[id]/unlock - Unlock a user account (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = session.user as { id?: string; email?: string; name?: string; role?: string };
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Find the user to unlock
    const userToUnlock = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lockedAt: true,
        failedLoginAttempts: true,
      }
    });

    if (!userToUnlock) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userToUnlock.lockedAt) {
      return NextResponse.json({ error: 'User is not locked' }, { status: 400 });
    }

    // Unlock the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedAt: null,
        lockedUntil: null,
        lockedReason: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lockedAt: true,
        failedLoginAttempts: true,
      }
    });

    // Log the unlock activity
    await logActivity({
      userId: currentUser.id || '',
      userEmail: currentUser.email || '',
      userName: currentUser.name || null,
      action: 'USER_UNLOCKED',
      module: 'USER_MANAGEMENT',
      details: {
        unlockedUserId: id,
        unlockedUserEmail: userToUnlock.email,
        unlockedUserName: userToUnlock.name,
        previousFailedAttempts: userToUnlock.failedLoginAttempts,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User account has been unlocked',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error unlocking user:', error);
    return NextResponse.json({ error: 'Failed to unlock user' }, { status: 500 });
  }
}
