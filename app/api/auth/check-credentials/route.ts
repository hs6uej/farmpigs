import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-logger';
import { getMaxLoginAttempts } from '@/lib/system-config';

const DEFAULT_MAX_LOGIN_ATTEMPTS = 5;

// POST /api/auth/check-credentials - Check credentials before actual login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        error: 'INVALID_CREDENTIALS',
        message: 'Username and password are required'
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || !user.password) {
      await logActivity({
        userId: 'unknown',
        userEmail: '', // No email available if using username login that failed
        userName: username,
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        details: { reason: 'User not found or no password' },
      });
      return NextResponse.json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password'
      }, { status: 401 });
    }

    // Check if account is locked
    if (user.lockedAt) {
      if (user.lockedUntil && new Date() > user.lockedUntil) {
        // Lock has expired, reset
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedAt: null,
            lockedUntil: null,
            lockedReason: null,
          }
        });
      } else {
        await logActivity({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name || username,
          action: 'LOGIN_BLOCKED',
          module: 'AUTH',
          details: { reason: 'Account is locked' },
        });
        return NextResponse.json({
          error: 'ACCOUNT_LOCKED',
          message: 'Your account is locked. Please contact administrator.'
        }, { status: 403 });
      }
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      const maxLoginAttempts = await getMaxLoginAttempts() || DEFAULT_MAX_LOGIN_ATTEMPTS;
      const newFailedAttempts = user.failedLoginAttempts + 1;

      if (newFailedAttempts >= maxLoginAttempts) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lockedAt: new Date(),
            lockedUntil: null,
            lockedReason: `Too many failed login attempts (${newFailedAttempts})`,
          }
        });

        await logActivity({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name || username,
          action: 'ACCOUNT_LOCKED',
          module: 'AUTH',
          details: {
            reason: 'Too many failed login attempts',
            failedAttempts: newFailedAttempts,
          },
        });

        return NextResponse.json({
          error: 'ACCOUNT_LOCKED_NOW',
          message: 'Your account has been locked due to too many failed login attempts.',
          failedAttempts: newFailedAttempts,
          remainingAttempts: 0
        }, { status: 403 });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
          }
        });

        await logActivity({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.name || username,
          action: 'LOGIN_FAILED',
          module: 'AUTH',
          details: {
            reason: 'Invalid password',
            failedAttempts: newFailedAttempts,
            remainingAttempts: maxLoginAttempts - newFailedAttempts,
          },
        });

        return NextResponse.json({
          error: 'INVALID_PASSWORD',
          message: 'Invalid password',
          failedAttempts: newFailedAttempts,
          remainingAttempts: maxLoginAttempts - newFailedAttempts
        }, { status: 401 });
      }
    }

    // Password correct - credentials are valid
    // Reset failed attempts will be done by NextAuth authorize
    return NextResponse.json({
      success: true,
      message: 'Credentials valid'
    });

  } catch (error) {
    console.error('Check credentials error:', error);
    return NextResponse.json({
      error: 'SERVER_ERROR',
      message: 'Internal server error'
    }, { status: 500 });
  }
}
