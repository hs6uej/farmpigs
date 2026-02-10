'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Trash2, Shield, User, Bell, MessageSquare, Settings2, 
  Database, Clock, FileText, Save, RotateCcw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Helper function to get cookie
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

interface UserType {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface NotificationSettings {
  comments: { push: boolean; email: boolean; slack: boolean };
  favorites: { push: boolean; email: boolean; slack: boolean };
  systemAlerts: { push: boolean; email: boolean };
  dailyReport: { push: boolean; email: boolean };
}

interface SystemConfig {
  activityLogRetentionDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  autoBackupEnabled: boolean;
  backupFrequencyDays: number;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState('th');
  
  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    comments: { push: true, email: true, slack: false },
    favorites: { push: true, email: false, slack: false },
    systemAlerts: { push: true, email: true },
    dailyReport: { push: true, email: true },
  });

  // System configuration state
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    activityLogRetentionDays: 90,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
    autoBackupEnabled: true,
    backupFrequencyDays: 7,
    maintenanceMode: false,
  });

  // Get locale from cookie on mount
  useEffect(() => {
    const cookieLocale = getCookie('NEXT_LOCALE');
    if (cookieLocale) setLocale(cookieLocale);
  }, []);

  // Translations
  const texts = {
    title: locale === 'th' ? 'ตั้งค่า' : 'Settings',
    subtitle: locale === 'th' ? 'จัดการผู้ใช้และการตั้งค่าระบบ' : 'Manage users and system configuration',
    userManagement: locale === 'th' ? 'จัดการผู้ใช้' : 'User Management',
    notifications: locale === 'th' ? 'การแจ้งเตือน' : 'Notifications',
    notificationsDesc: locale === 'th' ? 'จัดการการตั้งค่าการแจ้งเตือนของคุณ' : 'Manage your notification settings.',
    comments: locale === 'th' ? 'ความคิดเห็น' : 'Comments',
    commentsDesc: locale === 'th' ? 'รับการแจ้งเตือนเมื่อมีคนแสดงความคิดเห็นหรือกล่าวถึงคุณ' : 'Receive notifications when someone comments on your documents or mentions you.',
    favorites: locale === 'th' ? 'รายการโปรด' : 'Favorites',
    favoritesDesc: locale === 'th' ? 'รับการแจ้งเตือนเมื่อมีกิจกรรมเกี่ยวกับรายการโปรดของคุณ' : 'Receive notifications when there is activity related to your favorited items.',
    systemAlerts: locale === 'th' ? 'การแจ้งเตือนระบบ' : 'System Alerts',
    systemAlertsDesc: locale === 'th' ? 'รับการแจ้งเตือนสำคัญเกี่ยวกับระบบและความปลอดภัย' : 'Receive important system and security notifications.',
    dailyReport: locale === 'th' ? 'รายงานประจำวัน' : 'Daily Report',
    dailyReportDesc: locale === 'th' ? 'รับสรุปกิจกรรมประจำวัน' : 'Receive daily activity summary',
    push: 'Push',
    email: 'Email',
    slack: 'Slack',
    rolePermissions: locale === 'th' ? 'สิทธิ์ตามบทบาท:' : 'Role Permissions:',
    adminDesc: locale === 'th' ? 'เข้าถึงได้ทั้งหมด - จัดการข้อมูล ผู้ใช้ และการตั้งค่าทั้งหมด' : 'Full access - can manage all data, users, and settings',
    userDesc: locale === 'th' ? 'อ่านอย่างเดียว - ดูรายงานได้เท่านั้น' : 'Read-only access - can only view reports',
    confirmDelete: locale === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?' : 'Are you sure you want to delete this user?',
    // System Config translations
    systemConfig: locale === 'th' ? 'การตั้งค่าระบบ' : 'System Configuration',
    systemConfigDesc: locale === 'th' ? 'จัดการการตั้งค่าและพารามิเตอร์ของระบบ' : 'Manage system settings and parameters.',
    activityLogRetention: locale === 'th' ? 'ระยะเวลาเก็บ Activity Log' : 'Activity Log Retention',
    activityLogRetentionDesc: locale === 'th' ? 'จำนวนวันที่จะเก็บประวัติกิจกรรมในระบบ' : 'Number of days to keep activity logs in the system.',
    days: locale === 'th' ? 'วัน' : 'days',
    maxLoginAttempts: locale === 'th' ? 'จำนวนครั้งที่อนุญาตให้ Login ผิดพลาด' : 'Max Login Attempts',
    maxLoginAttemptsDesc: locale === 'th' ? 'จำนวนครั้งที่อนุญาตให้ผู้ใช้พยายาม Login ก่อนถูกล็อก' : 'Maximum failed login attempts before account lockout.',
    times: locale === 'th' ? 'ครั้ง' : 'times',
    sessionTimeout: locale === 'th' ? 'หมดเวลา Session' : 'Session Timeout',
    sessionTimeoutDesc: locale === 'th' ? 'ระยะเวลาที่ไม่มีกิจกรรมก่อน Session หมดอายุ' : 'Duration of inactivity before session expires.',
    minutes: locale === 'th' ? 'นาที' : 'minutes',
    autoBackup: locale === 'th' ? 'สำรองข้อมูลอัตโนมัติ' : 'Auto Backup',
    autoBackupDesc: locale === 'th' ? 'เปิดใช้งานการสำรองข้อมูลฐานข้อมูลอัตโนมัติ' : 'Enable automatic database backup.',
    backupFrequency: locale === 'th' ? 'ความถี่ในการสำรองข้อมูล' : 'Backup Frequency',
    backupFrequencyDesc: locale === 'th' ? 'จำนวนวันระหว่างการสำรองข้อมูลอัตโนมัติ' : 'Number of days between automatic backups.',
    maintenanceMode: locale === 'th' ? 'โหมดบำรุงรักษา' : 'Maintenance Mode',
    maintenanceModeDesc: locale === 'th' ? 'เปิดใช้งานโหมดบำรุงรักษาเพื่อจำกัดการเข้าถึงระบบ' : 'Enable maintenance mode to restrict system access.',
    saveChanges: locale === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes',
    resetDefaults: locale === 'th' ? 'รีเซ็ตเป็นค่าเริ่มต้น' : 'Reset to Defaults',
    saved: locale === 'th' ? 'บันทึกแล้ว!' : 'Saved!',
  };

  useEffect(() => {
    fetchUsers();
    // Load saved notification settings from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    // Load system config from API
    const fetchSystemConfig = async () => {
      try {
        const res = await fetch('/api/system-config');
        if (res.ok) {
          const config = await res.json();
          setSystemConfig({
            activityLogRetentionDays: config.activityLogRetentionDays,
            maxLoginAttempts: config.maxLoginAttempts,
            sessionTimeoutMinutes: config.sessionTimeoutMinutes,
            autoBackupEnabled: config.autoBackupEnabled,
            backupFrequencyDays: config.backupFrequencyDays,
            maintenanceMode: config.maintenanceMode,
          });
        }
      } catch (error) {
        console.error('Failed to fetch system config:', error);
      }
    };
    fetchSystemConfig();
  }, []);

  // Save notification settings when changed with activity log
  const updateNotificationSetting = async (
    category: keyof NotificationSettings,
    type: string,
    value: boolean
  ) => {
    setNotifications(prev => {
      const newSettings = {
        ...prev,
        [category]: {
          ...prev[category],
          [type]: value
        }
      };
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      return newSettings;
    });
    
    // Log to activity log
    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE',
          module: 'settings',
          entityType: 'NotificationSettings',
          entityName: locale === 'th' ? 'การตั้งค่าการแจ้งเตือน' : 'Notification Settings',
          details: { category, type, value },
        }),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  // Update system config
  const updateSystemConfig = (key: keyof SystemConfig, value: number | boolean) => {
    setSystemConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save system config with activity log
  const saveSystemConfig = async () => {
    setSaving(true);
    
    try {
      // Save to API (database)
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemConfig),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save system config');
      }
    } catch (error) {
      console.error('Failed to save system config:', error);
      alert(locale === 'th' ? 'ไม่สามารถบันทึกการตั้งค่าได้' : 'Failed to save settings');
    }
    
    setTimeout(() => setSaving(false), 1000);
  };

  // Reset system config to defaults
  const resetSystemConfig = () => {
    const defaults: SystemConfig = {
      activityLogRetentionDays: 90,
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 30,
      autoBackupEnabled: true,
      backupFrequencyDays: 7,
      maintenanceMode: false,
    };
    setSystemConfig(defaults);
    localStorage.setItem('systemConfig', JSON.stringify(defaults));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(texts.confirmDelete)) return;

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
          <p className="text-red-700 dark:text-red-200">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Settings2 className="w-6 h-6 sm:w-8 sm:h-8" />
          {texts.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {texts.subtitle}
        </p>
      </div>

      {/* System Configuration */}
      <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5" />
            {texts.systemConfig}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {texts.systemConfigDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Activity Log Retention */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.activityLogRetention}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.activityLogRetentionDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <Select
                value={systemConfig.activityLogRetentionDays.toString()}
                onValueChange={(value) => updateSystemConfig('activityLogRetentionDays', parseInt(value))}
              >
                <SelectTrigger className="w-[120px] h-9 text-sm border-gray-300 dark:border-[#8B8D98]/50 bg-white dark:bg-[#2a2640] text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                  <SelectItem value="30" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">30 {texts.days}</SelectItem>
                  <SelectItem value="60" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">60 {texts.days}</SelectItem>
                  <SelectItem value="90" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">90 {texts.days}</SelectItem>
                  <SelectItem value="180" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">180 {texts.days}</SelectItem>
                  <SelectItem value="365" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">365 {texts.days}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Max Login Attempts */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.maxLoginAttempts}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.maxLoginAttemptsDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <Select
                value={systemConfig.maxLoginAttempts.toString()}
                onValueChange={(value) => updateSystemConfig('maxLoginAttempts', parseInt(value))}
              >
                <SelectTrigger className="w-[120px] h-9 text-sm border-gray-300 dark:border-[#8B8D98]/50 bg-white dark:bg-[#2a2640] text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                  <SelectItem value="3" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">3 {texts.times}</SelectItem>
                  <SelectItem value="5" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">5 {texts.times}</SelectItem>
                  <SelectItem value="10" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">10 {texts.times}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Timeout */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.sessionTimeout}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.sessionTimeoutDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <Select
                value={systemConfig.sessionTimeoutMinutes.toString()}
                onValueChange={(value) => updateSystemConfig('sessionTimeoutMinutes', parseInt(value))}
              >
                <SelectTrigger className="w-[120px] h-9 text-sm border-gray-300 dark:border-[#8B8D98]/50 bg-white dark:bg-[#2a2640] text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                  <SelectItem value="15" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">15 {texts.minutes}</SelectItem>
                  <SelectItem value="30" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">30 {texts.minutes}</SelectItem>
                  <SelectItem value="60" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">60 {texts.minutes}</SelectItem>
                  <SelectItem value="120" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">120 {texts.minutes}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto Backup */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.autoBackup}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.autoBackupDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <Switch
                checked={systemConfig.autoBackupEnabled}
                onCheckedChange={(checked) => updateSystemConfig('autoBackupEnabled', checked)}
               
              />
            </div>
          </div>

          {/* Backup Frequency */}
          {systemConfig.autoBackupEnabled && (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{texts.backupFrequency}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {texts.backupFrequencyDesc}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-8 sm:ml-0">
                <Select
                  value={systemConfig.backupFrequencyDays.toString()}
                  onValueChange={(value) => updateSystemConfig('backupFrequencyDays', parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] h-9 text-sm border-gray-300 dark:border-[#8B8D98]/50 bg-white dark:bg-[#2a2640] text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                    <SelectItem value="1" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">1 {texts.days}</SelectItem>
                    <SelectItem value="3" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">3 {texts.days}</SelectItem>
                    <SelectItem value="7" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">7 {texts.days}</SelectItem>
                    <SelectItem value="14" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">14 {texts.days}</SelectItem>
                    <SelectItem value="30" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">30 {texts.days}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Maintenance Mode */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Settings2 className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.maintenanceMode}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.maintenanceModeDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <Switch
                checked={systemConfig.maintenanceMode}
                onCheckedChange={(checked) => updateSystemConfig('maintenanceMode', checked)}
                
              />
            </div>
          </div>

          {/* Save/Reset Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[#8B8D98]/20">
            <Button
              onClick={saveSystemConfig}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save size={16} />
              {saving ? texts.saved : texts.saveChanges}
            </Button>
            <Button
              onClick={resetSystemConfig}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 dark:border-[#8B8D98]/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2640]"
            >
              <RotateCcw size={16} />
              {texts.resetDefaults}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {texts.notifications}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {texts.notificationsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comments */}
          {/* <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.comments}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.commentsDesc}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 ml-8 sm:ml-0">
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.push}</span>
                <Switch
                  checked={notifications.comments.push}
                  onCheckedChange={(checked) => updateNotificationSetting('comments', 'push', checked)}
                  
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.email}</span>
                <Switch
                  checked={notifications.comments.email}
                  onCheckedChange={(checked) => updateNotificationSetting('comments', 'email', checked)}
                  
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.slack}</span>
                <Switch
                  checked={notifications.comments.slack}
                  onCheckedChange={(checked) => updateNotificationSetting('comments', 'slack', checked)}
                  
                />
              </div>
            </div>
          </div> */}

          {/* Favorites */}
          {/* <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.favorites}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.favoritesDesc}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 ml-8 sm:ml-0">
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.push}</span>
                <Switch
                  checked={notifications.favorites.push}
                  onCheckedChange={(checked) => updateNotificationSetting('favorites', 'push', checked)}
                  
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.email}</span>
                <Switch
                  checked={notifications.favorites.email}
                  onCheckedChange={(checked) => updateNotificationSetting('favorites', 'email', checked)}
                  
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{texts.slack}</span>
                <Switch
                  checked={notifications.favorites.slack}
                  onCheckedChange={(checked) => updateNotificationSetting('favorites', 'slack', checked)}
                  
                />
              </div>
            </div>
          </div> */}

          {/* System Alerts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.systemAlerts}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.systemAlertsDesc}
                </p>
              </div>
            </div>
            <div className="ml-8 sm:ml-0">
              <Switch
                checked={notifications.systemAlerts.push}
                onCheckedChange={(checked) => {
                  updateNotificationSetting('systemAlerts', 'push', checked);
                  updateNotificationSetting('systemAlerts', 'email', checked);
                }}
              />
            </div>
          </div>

          {/* Daily Report */}
          <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${!notifications.systemAlerts.push ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{texts.dailyReport}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {texts.dailyReportDesc}
                </p>
                {!notifications.systemAlerts.push && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {locale === 'th' ? '⚠️ ต้องเปิดการแจ้งเตือนระบบก่อน' : '⚠️ Enable System Alerts first'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 ml-8 sm:ml-0">
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">LINE</span>
                <Switch
                  checked={notifications.dailyReport.push && notifications.systemAlerts.push}
                  disabled={!notifications.systemAlerts.push}
                  onCheckedChange={(checked) => updateNotificationSetting('dailyReport', 'push', checked)}
                />
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">Telegram</span>
                <Switch
                  checked={notifications.dailyReport.email && notifications.systemAlerts.push}
                  disabled={!notifications.systemAlerts.push}
                  onCheckedChange={(checked) => updateNotificationSetting('dailyReport', 'email', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="bg-white dark:bg-[#1f1d2e] border-gray-200 dark:border-[#8B8D98]/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {texts.userManagement}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#8B8D98]/20">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell">Name</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Role</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 dark:border-[#8B8D98]/10 hover:bg-gray-50 dark:hover:bg-[#2a2640]"
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white">
                        <span className="block truncate max-w-[120px] sm:max-w-none">{user.email}</span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                        {user.name || '-'}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                          disabled={user.id === session?.user?.id}
                        >
                          <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs sm:text-sm border-gray-300 dark:border-[#8B8D98]/50 bg-white dark:bg-[#2a2640] text-gray-900 dark:text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                            <SelectItem value="USER" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">
                              USER
                            </SelectItem>
                            <SelectItem value="ADMIN" className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#7800A3]/20">
                              ADMIN
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.id === session?.user?.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
        <CardContent className="p-4">
          <h3 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-200 mb-2">
            {texts.rolePermissions}
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start sm:items-center gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span><strong>ADMIN:</strong> {texts.adminDesc}</span>
            </li>
            <li className="flex items-start sm:items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span><strong>USER:</strong> {texts.userDesc}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
