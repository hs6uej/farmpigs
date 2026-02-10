import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity, cleanupOldLogs, getClientInfo } from '@/lib/activity-logger';

// GET - Fetch activity logs with pagination and filters
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const modName = searchParams.get('module') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (modName) where.module = modName;
    
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new activity log entry (for client-side logging)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, module, entityId, entityName, details } = body;
    
    const { ipAddress, userAgent } = getClientInfo(req.headers as unknown as Headers);

    await logActivity({
      userId: session.user.id as string,
      userEmail: session.user.email as string,
      userName: session.user.name,
      action,
      module,
      entityId,
      entityName,
      details,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Cleanup old logs (admin only, or scheduled job)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';
    const retentionDays = parseInt(searchParams.get('retentionDays') || '90');
    
    // Log this cleanup action
    const { ipAddress, userAgent } = getClientInfo(req.headers as unknown as Headers);
    await logActivity({
      userId: session.user.id as string,
      userEmail: session.user.email as string,
      userName: session.user.name,
      action: 'DELETE',
      module: 'activity-logs',
      details: { type: force ? 'force_cleanup' : 'scheduled_cleanup', retentionDays },
      ipAddress,
      userAgent,
    });

    const deletedCount = await cleanupOldLogs(retentionDays);

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} logs older than ${retentionDays} days` 
    });
  } catch (error) {
    console.error('Error cleaning up activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
