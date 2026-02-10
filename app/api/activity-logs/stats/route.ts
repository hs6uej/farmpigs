import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get activity statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      totalLogs,
      todayLogs,
      last7DaysLogs,
      last30DaysLogs,
      actionStats,
      moduleStats,
      userStats,
      recentActivity,
    ] = await Promise.all([
      // Total logs
      prisma.activityLog.count(),
      
      // Today's logs
      prisma.activityLog.count({
        where: { createdAt: { gte: today } },
      }),
      
      // Last 7 days
      prisma.activityLog.count({
        where: { createdAt: { gte: last7Days } },
      }),
      
      // Last 30 days
      prisma.activityLog.count({
        where: { createdAt: { gte: last30Days } },
      }),
      
      // Action breakdown
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        where: { createdAt: { gte: last30Days } },
      }),
      
      // Module breakdown
      prisma.activityLog.groupBy({
        by: ['module'],
        _count: { module: true },
        where: { createdAt: { gte: last30Days } },
      }),
      
      // User activity (top 10)
      prisma.activityLog.groupBy({
        by: ['userId', 'userEmail', 'userName'],
        _count: { userId: true },
        where: { createdAt: { gte: last30Days } },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      
      // Recent activity timeline
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      summary: {
        totalLogs,
        todayLogs,
        last7DaysLogs,
        last30DaysLogs,
      },
      actionStats: actionStats.map(a => ({
        action: a.action,
        count: a._count.action,
      })),
      moduleStats: moduleStats.map(m => ({
        module: m.module,
        count: m._count.module,
      })),
      userStats: userStats.map(u => ({
        userId: u.userId,
        userEmail: u.userEmail,
        userName: u.userName,
        count: u._count.userId,
      })),
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
