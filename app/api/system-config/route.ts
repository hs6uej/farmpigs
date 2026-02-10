import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

const DEFAULT_CONFIG = {
  activityLogRetentionDays: 90,
  maxLoginAttempts: 5,
  sessionTimeoutMinutes: 30,
  autoBackupEnabled: true,
  backupFrequencyDays: 7,
  maintenanceMode: false,
};

// GET /api/system-config - Get system configuration
export async function GET() {
  try {
    let config = await prisma.systemConfig.findFirst({
      where: { id: 'system_config' }
    });

    // If no config exists, create default one
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'system_config',
          ...DEFAULT_CONFIG
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching system config:', error);
    return NextResponse.json({ error: 'Failed to fetch system config' }, { status: 500 });
  }
}

// PUT /api/system-config - Update system configuration (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as { id?: string; email?: string; name?: string; role?: string };
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      activityLogRetentionDays,
      maxLoginAttempts,
      sessionTimeoutMinutes,
      autoBackupEnabled,
      backupFrequencyDays,
      maintenanceMode,
    } = body;

    // Validate input
    if (maxLoginAttempts !== undefined && (maxLoginAttempts < 1 || maxLoginAttempts > 20)) {
      return NextResponse.json({ error: 'maxLoginAttempts must be between 1 and 20' }, { status: 400 });
    }

    if (activityLogRetentionDays !== undefined && (activityLogRetentionDays < 1 || activityLogRetentionDays > 365)) {
      return NextResponse.json({ error: 'activityLogRetentionDays must be between 1 and 365' }, { status: 400 });
    }

    // Update or create config
    const config = await prisma.systemConfig.upsert({
      where: { id: 'system_config' },
      update: {
        ...(activityLogRetentionDays !== undefined && { activityLogRetentionDays }),
        ...(maxLoginAttempts !== undefined && { maxLoginAttempts }),
        ...(sessionTimeoutMinutes !== undefined && { sessionTimeoutMinutes }),
        ...(autoBackupEnabled !== undefined && { autoBackupEnabled }),
        ...(backupFrequencyDays !== undefined && { backupFrequencyDays }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
      },
      create: {
        id: 'system_config',
        activityLogRetentionDays: activityLogRetentionDays ?? DEFAULT_CONFIG.activityLogRetentionDays,
        maxLoginAttempts: maxLoginAttempts ?? DEFAULT_CONFIG.maxLoginAttempts,
        sessionTimeoutMinutes: sessionTimeoutMinutes ?? DEFAULT_CONFIG.sessionTimeoutMinutes,
        autoBackupEnabled: autoBackupEnabled ?? DEFAULT_CONFIG.autoBackupEnabled,
        backupFrequencyDays: backupFrequencyDays ?? DEFAULT_CONFIG.backupFrequencyDays,
        maintenanceMode: maintenanceMode ?? DEFAULT_CONFIG.maintenanceMode,
      }
    });

    // Log the update activity
    await logActivity({
      userId: currentUser.id || '',
      userEmail: currentUser.email || '',
      userName: currentUser.name || null,
      action: 'UPDATE',
      module: 'SETTINGS',
      entityId: 'system_config',
      entityName: 'System Configuration',
      details: body,
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating system config:', error);
    return NextResponse.json({ error: 'Failed to update system config' }, { status: 500 });
  }
}
