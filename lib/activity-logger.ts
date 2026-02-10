import { prisma } from './prisma';

type ActionType = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'LOGIN_FAILED'
  | 'LOGIN_BLOCKED'
  | 'ACCOUNT_LOCKED'
  | 'USER_UNLOCKED';

interface LogActivityParams {
  userId: string;
  userEmail: string;
  userName?: string | null;
  action: ActionType;
  module: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName || null,
        action: params.action,
        module: params.module,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the main operation
  }
}

// Cleanup old logs (based on retention days from config)
export async function cleanupOldLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  try {
    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return 0;
  }
}

// Helper to get client info from request headers
export function getClientInfo(headers: Headers): { ipAddress?: string; userAgent?: string } {
  const forwarded = headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') || undefined;
  const userAgent = headers.get('user-agent') || undefined;
  
  return { ipAddress, userAgent };
}

// Module name mapping
export const MODULE_NAMES: Record<string, string> = {
  sows: 'Sows',
  boars: 'Boars',
  piglets: 'Piglets',
  breedings: 'Breeding',
  farrowings: 'Farrowing',
  pens: 'Pens',
  'health-records': 'Health Records',
  'feed-consumption': 'Feed Records',
  users: 'Users',
  auth: 'Authentication',
  analytics: 'Analytics',
  reports: 'Reports',
};

// Action descriptions
export const ACTION_DESCRIPTIONS: Record<ActionType, { th: string; en: string }> = {
  CREATE: { th: 'สร้างข้อมูลใหม่', en: 'Created' },
  UPDATE: { th: 'แก้ไขข้อมูล', en: 'Updated' },
  DELETE: { th: 'ลบข้อมูล', en: 'Deleted' },
  VIEW: { th: 'ดูข้อมูล', en: 'Viewed' },
  EXPORT: { th: 'ส่งออกข้อมูล', en: 'Exported' },
  LOGIN: { th: 'เข้าสู่ระบบ', en: 'Logged in' },
  LOGOUT: { th: 'ออกจากระบบ', en: 'Logged out' },
  LOGIN_FAILED: { th: 'เข้าสู่ระบบล้มเหลว', en: 'Login failed' },
  LOGIN_BLOCKED: { th: 'การเข้าสู่ระบบถูกบล็อค', en: 'Login blocked' },
  ACCOUNT_LOCKED: { th: 'บัญชีถูกล็อค', en: 'Account locked' },
  USER_UNLOCKED: { th: 'ปลดล็อคบัญชี', en: 'User unlocked' },
};
