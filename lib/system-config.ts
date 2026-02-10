import { prisma } from './prisma';

// Default system configuration values
const DEFAULT_CONFIG = {
  activityLogRetentionDays: 90,
  maxLoginAttempts: 5,
  sessionTimeoutMinutes: 30,
  autoBackupEnabled: true,
  backupFrequencyDays: 7,
  maintenanceMode: false,
};

export interface SystemConfigType {
  activityLogRetentionDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  autoBackupEnabled: boolean;
  backupFrequencyDays: number;
  maintenanceMode: boolean;
}

/**
 * Get system configuration from database
 * Creates default config if none exists
 */
export async function getSystemConfig(): Promise<SystemConfigType> {
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

    return {
      activityLogRetentionDays: config.activityLogRetentionDays,
      maxLoginAttempts: config.maxLoginAttempts,
      sessionTimeoutMinutes: config.sessionTimeoutMinutes,
      autoBackupEnabled: config.autoBackupEnabled,
      backupFrequencyDays: config.backupFrequencyDays,
      maintenanceMode: config.maintenanceMode,
    };
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Return defaults if database error
    return DEFAULT_CONFIG;
  }
}

/**
 * Get max login attempts from system config
 * This is a convenience function for auth.ts
 */
export async function getMaxLoginAttempts(): Promise<number> {
  const config = await getSystemConfig();
  return config.maxLoginAttempts;
}

/**
 * Check if system is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const config = await getSystemConfig();
  return config.maintenanceMode;
}
