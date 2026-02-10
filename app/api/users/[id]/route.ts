/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (existingUser) {
        return NextResponse.json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await logActivity({
      userId: session.user.id || '',
      userEmail: session.user.email || '',
      userName: session.user.name,
      action: 'UPDATE',
      module: 'USERS',
      entityId: id,
      entityName: user.email || user.name || id,
      details: { updatedFields: Object.keys(updateData) },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent self-deletion
    if (session.user?.id === id) {
      return NextResponse.json({ message: 'ไม่สามารถลบบัญชีตัวเองได้' }, { status: 400 });
    }

    // Delete related records first
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.session.deleteMany({ where: { userId: id } });

    // Get user info before deletion for logging
    const userToDelete = await prisma.user.findUnique({ where: { id } });

    await prisma.user.delete({
      where: { id },
    });

    // Log activity
    await logActivity({
      userId: session.user.id || '',
      userEmail: session.user.email || '',
      userName: session.user.name,
      action: 'DELETE',
      module: 'USERS',
      entityId: id,
      entityName: userToDelete?.email || userToDelete?.name || id,
      details: { deletedUser: userToDelete?.email },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
