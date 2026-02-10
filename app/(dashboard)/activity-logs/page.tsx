/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Edit2,
  Plus,
  LogIn,
  LogOut,
  FileText,
  X,
  Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  action: string;
  module: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface Stats {
  summary: {
    totalLogs: number;
    todayLogs: number;
    last7DaysLogs: number;
    last30DaysLogs: number;
  };
  actionStats: { action: string; count: number }[];
  moduleStats: { module: string; count: number }[];
  userStats: { userId: string; userEmail: string; userName: string | null; count: number }[];
}

const ACTION_ICONS: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit2,
  DELETE: Trash2,
  VIEW: Eye,
  EXPORT: Download,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  LOGIN_FAILED: X,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  VIEW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  EXPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  LOGIN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  LOGOUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  LOGIN_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
};

const MODULE_NAMES_TH: Record<string, string> = {
  sows: 'แม่พันธุ์',
  boars: 'พ่อพันธุ์',
  piglets: 'ลูกสุกร',
  breedings: 'การผสมพันธุ์',
  farrowings: 'การคลอด',
  pens: 'คอก',
  'health-records': 'บันทึกสุขภาพ',
  'feed-consumption': 'บันทึกอาหาร',
  users: 'ผู้ใช้งาน',
  auth: 'การยืนยันตัวตน',
  analytics: 'สถิติ',
  reports: 'รายงาน',
  'activity-logs': 'บันทึกกิจกรรม',
};

const MODULE_NAMES_EN: Record<string, string> = {
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
  'activity-logs': 'Activity Logs',
};

const ACTION_NAMES_TH: Record<string, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
  VIEW: 'ดู',
  EXPORT: 'ส่งออก',
  LOGIN: 'เข้าสู่ระบบ',
  LOGOUT: 'ออกจากระบบ',
  LOGIN_FAILED: 'เข้าสู่ระบบล้มเหลว',
};

const ACTION_NAMES_EN: Record<string, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  VIEW: 'View',
  EXPORT: 'Export',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Failed',
};

export default function ActivityLogsPage() {
  const locale = useLocale();
  const dateLocale = locale === 'th' ? th : enUS;
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Cleanup dialog
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
  // Retention days from system config
  const [retentionDays, setRetentionDays] = useState(90);
  
  // Load retention days from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.activityLogRetentionDays) {
        setRetentionDays(config.activityLogRetentionDays);
      }
    }
  }, []);

  const t = useMemo(() => ({
    title: locale === 'th' ? 'บันทึกกิจกรรม' : 'Activity Logs',
    description: locale === 'th' ? 'ติดตามการใช้งานระบบของผู้ใช้ทุกคน' : 'Track system usage by all users',
    totalLogs: locale === 'th' ? 'ทั้งหมด' : 'Total',
    todayLogs: locale === 'th' ? 'วันนี้' : 'Today',
    last7Days: locale === 'th' ? '7 วัน' : '7 Days',
    last30Days: locale === 'th' ? '30 วัน' : '30 Days',
    search: locale === 'th' ? 'ค้นหา...' : 'Search...',
    export: locale === 'th' ? 'ส่งออก' : 'Export',
    cleanup: locale === 'th' ? 'ล้างข้อมูลเก่า' : 'Cleanup Old',
    refresh: locale === 'th' ? 'รีเฟรช' : 'Refresh',
    user: locale === 'th' ? 'ผู้ใช้' : 'User',
    action: locale === 'th' ? 'การกระทำ' : 'Action',
    module: locale === 'th' ? 'โมดูล' : 'Module',
    entity: locale === 'th' ? 'ข้อมูล' : 'Entity',
    time: locale === 'th' ? 'เวลา' : 'Time',
    details: locale === 'th' ? 'รายละเอียด' : 'Details',
    allActions: locale === 'th' ? 'ทุกการกระทำ' : 'All Actions',
    allModules: locale === 'th' ? 'ทุกโมดูล' : 'All Modules',
    filterByDate: locale === 'th' ? 'กรองตามวันที่' : 'Filter by Date',
    from: locale === 'th' ? 'จาก' : 'From',
    to: locale === 'th' ? 'ถึง' : 'To',
    noData: locale === 'th' ? 'ไม่มีข้อมูล' : 'No Data',
    showing: locale === 'th' ? 'แสดง' : 'Showing',
    of: locale === 'th' ? 'จาก' : 'of',
    records: locale === 'th' ? 'รายการ' : 'records',
    rowsPerPage: locale === 'th' ? 'แถวต่อหน้า' : 'Rows per page',
    page: locale === 'th' ? 'หน้า' : 'Page',
    cleanupTitle: locale === 'th' ? 'ล้างข้อมูลเก่า?' : 'Cleanup Old Logs?',
    cleanupDescription: locale === 'th' 
      ? `การดำเนินการนี้จะลบบันทึกกิจกรรมที่เก่ากว่า ${retentionDays} วัน` 
      : `This will delete activity logs older than ${retentionDays} days`,
    cancel: locale === 'th' ? 'ยกเลิก' : 'Cancel',
    confirm: locale === 'th' ? 'ยืนยัน' : 'Confirm',
    ipAddress: locale === 'th' ? 'IP Address' : 'IP Address',
    browser: locale === 'th' ? 'เบราว์เซอร์' : 'Browser',
    close: locale === 'th' ? 'ปิด' : 'Close',
    retentionNote: locale === 'th' ? `(เก็บข้อมูล ${retentionDays} วัน)` : `(${retentionDays} days retention)`,
  }), [locale, retentionDays]);

  const actionNames = locale === 'th' ? ACTION_NAMES_TH : ACTION_NAMES_EN;
  const moduleNames = locale === 'th' ? MODULE_NAMES_TH : MODULE_NAMES_EN;

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(rowsPerPage),
      });
      
      if (search) params.set('search', search);
      if (selectedAction !== 'all') params.set('action', selectedAction);
      if (selectedModule !== 'all') params.set('module', selectedModule);
      if (startDate) params.set('startDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.set('endDate', format(endDate, 'yyyy-MM-dd'));

      const res = await fetch(`/api/activity-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setTotalLogs(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/activity-logs/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [currentPage, rowsPerPage, selectedAction, selectedModule, startDate, endDate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLogs();
    fetchStats();
  };

  const handleCleanup = async () => {
    try {
      const res = await fetch(`/api/activity-logs?force=true&retentionDays=${retentionDays}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        
        // Create notification instead of alert
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: locale === 'th' ? 'ล้างข้อมูลเสร็จสิ้น' : 'Cleanup Completed',
            message: locale === 'th' 
              ? `ลบบันทึกกิจกรรมเก่ากว่า ${retentionDays} วัน แล้ว ${data.deletedCount} รายการ`
              : `Successfully deleted ${data.deletedCount} log entries older than ${retentionDays} days`,
            type: 'SUCCESS',
            category: 'system',
          }),
        });
        
        handleRefresh();
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      // Create error notification
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
          message: locale === 'th' 
            ? 'ไม่สามารถล้างข้อมูลเก่าได้'
            : 'Failed to cleanup old logs',
          type: 'ERROR',
          category: 'system',
        }),
      });
    } finally {
      setCleanupDialogOpen(false);
    }
  };

  const exportToExcel = () => {
    const exportData = logs.map(log => ({
      [t.time]: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      [t.user]: log.userName || log.userEmail,
      'Email': log.userEmail,
      [t.action]: actionNames[log.action] || log.action,
      [t.module]: moduleNames[log.module] || log.module,
      [t.entity]: log.entityName || '-',
      [t.ipAddress]: log.ipAddress || '-',
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `activity_logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getActionBadge = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    const colorClass = ACTION_COLORS[action] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        <Icon size={12} />
        <span className="hidden sm:inline">{actionNames[action] || action}</span>
      </span>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <Activity className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6" />
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {t.description} <span className="text-gray-400">{t.retentionNote}</span>
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white disabled:bg-green-400 disabled:border-green-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t.refresh}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer text-xs sm:text-sm"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t.export}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCleanupDialogOpen(true)}
            className="flex items-center gap-1.5 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white cursor-pointer text-xs sm:text-sm"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">{t.cleanup}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <Card className="bg-white dark:bg-[#1f1d2e] shadow-none border border-gray-200 dark:border-[#8B8D98]/20">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <FileText className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t.totalLogs}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{stats.summary.totalLogs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1f1d2e] shadow-none border border-gray-200 dark:border-[#8B8D98]/20">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Clock className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t.todayLogs}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{stats.summary.todayLogs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1f1d2e] shadow-none border border-gray-200 dark:border-[#8B8D98]/20">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Calendar className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t.last7Days}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{stats.summary.last7DaysLogs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1f1d2e] shadow-none border border-gray-200 dark:border-[#8B8D98]/20">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Activity className="text-orange-600 dark:text-orange-400 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{t.last30Days}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{stats.summary.last30DaysLogs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white border border-[#8B8D98]/20 rounded-lg bg-white dark:bg-[#1f1d2e] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
          />
        </div>
        
        {/* Action Filter */}
        <Select value={selectedAction} onValueChange={setSelectedAction}>
          {/* <SelectTrigger className="cursor-pointer h-10 bg-white w-full sm:w-40 text-sm text-gray-500 hover:text-gray-400 dark:hover:text-white border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] dark:text-gray-300 focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-all"> */}
           {/* <SelectTrigger className="cursor-pointer w-full h-10 sm:w-40 text-sm bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-all"> */}
           <SelectTrigger className="cursor-pointer h-10 bg-white w-full sm:w-40 text-sm  text-gray-500 hover:text-gray-400 dark:hover:text-white border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] dark:text-gray-300 focus:ring-0 shadow-none focus:border-[#7800A3] focus:ring-[#7800A3] transition-all">
          
            <SelectValue placeholder={t.allActions} className='text-sm'/>
          </SelectTrigger>
           <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20">
            <SelectItem value="all" className="cursor-pointer text-sm dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">{t.allActions}</SelectItem>
            {Object.keys(ACTION_NAMES_EN).map((action) => (
              <SelectItem key={action} value={action} className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200  hover:bg-gray-600">
                {actionNames[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Module Filter */}
        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger className="cursor-pointer h-10 bg-white w-full sm:w-40 text-sm  text-gray-500 hover:text-gray-400 dark:hover:text-white border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] dark:text-gray-300 focus:ring-0 shadow-none focus:border-[#7800A3] focus:ring-[#7800A3] transition-all">
            <SelectValue placeholder={t.allModules} className='text-sm' />
          </SelectTrigger>
          <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-[#8B8D98]/20  dark:border-[#8B8D98]/20 ">
            <SelectItem value="all" className="cursor-pointer text-sm dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">{t.allModules}</SelectItem>
            {Object.keys(MODULE_NAMES_EN).map((module) => (
              <SelectItem key={module} value={module} className="cursor-pointer dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400">
                {moduleNames[module]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Filters */}
        <div className="flex gap-2">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder={locale === 'th' ? 'วันเริ่มต้น' : 'Start date'}
            locale={locale}
            className="w-full sm:w-44 h-10 text-sm border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] focus:ring-0 placeholder:text-sm"
            showClearButton={false}
          />
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder={locale === 'th' ? 'วันสิ้นสุด' : 'End date'}
            locale={locale}
            className="w-full sm:w-44 h-10 text-sm border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] focus:ring-0 placeholder:text-sm"
            showClearButton={false}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden shadow-none border border-gray-200 dark:border-[#8B8D98]/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                    {t.time}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                    {t.user}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                    {t.action}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap hidden sm:table-cell">
                    {t.module}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap hidden md:table-cell">
                    {t.entity}
                  </TableHead>
                  <TableHead className="px-2 sm:px-4 text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap text-right">
                    {t.details}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-b border-gray-100 dark:border-[#8B8D98]/20 hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(log.createdAt), 'dd/MM/yy HH:mm')}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <User size={12} className="sm:hidden text-purple-600" />
                          <User size={16} className="hidden sm:block text-purple-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-[150px]">
                            {log.userName || log.userEmail.split('@')[0]}
                          </span>
                          <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-[150px] hidden sm:block">
                            {log.userEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {moduleNames[log.module] || log.module}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {log.entityName || '-'}
                    </TableCell>
                    <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailsDialogOpen(true);
                        }}
                        className="cursor-pointer text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Eye size={14} className="sm:hidden" />
                        <Eye size={16} className="hidden sm:block" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t.noData}
            </div>
          )}

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{t.showing}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, totalLogs)}
                </span>
                <span>{t.of}</span>
                <span className="font-medium text-gray-900 dark:text-white">{totalLogs.toLocaleString()}</span>
                <span className="hidden sm:inline">{t.records}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{t.rowsPerPage}</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8 px-2 py-1 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      <SelectItem value="10" className="cursor-pointer dark:text-gray-200">10</SelectItem>
                      <SelectItem value="20" className="cursor-pointer dark:text-gray-200">20</SelectItem>
                      <SelectItem value="50" className="cursor-pointer dark:text-gray-200">50</SelectItem>
                      <SelectItem value="100" className="cursor-pointer dark:text-gray-200">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50"
                  >
                    <ChevronLeft size={14} className="sm:hidden" />
                    <ChevronLeft size={16} className="hidden sm:block" />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{t.page}</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{currentPage}</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">/</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{totalPages || 1}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50"
                  >
                    <ChevronRight size={14} className="sm:hidden" />
                    <ChevronRight size={16} className="hidden sm:block" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">
              {t.cleanupTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-gray-300">
              {t.cleanupDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-9 sm:h-10 text-sm cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              className="h-9 sm:h-10 text-sm bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      {selectedLog && (
        <AlertDialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <AlertDialogContent className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 w-[calc(100%-2rem)] sm:w-full max-w-lg mx-auto">
            <AlertDialogHeader className="flex flex-row items-center justify-between">
              <AlertDialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-purple-500" />
                {t.details}
              </AlertDialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2a2640] transition-colors" 
                onClick={() => setDetailsDialogOpen(false)}
              >
                <X size={18} />
              </Button>
            </AlertDialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 dark:text-gray-400">{t.time}:</div>
                <div className="text-gray-900 dark:text-white">
                  {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 dark:text-gray-400">{t.user}:</div>
                <div className="text-gray-900 dark:text-white">{selectedLog.userName || selectedLog.userEmail}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 dark:text-gray-400">Email:</div>
                <div className="text-gray-900 dark:text-white break-all">{selectedLog.userEmail}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 dark:text-gray-400">{t.action}:</div>
                <div>{getActionBadge(selectedLog.action)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500 dark:text-gray-400">{t.module}:</div>
                <div className="text-gray-900 dark:text-white">{moduleNames[selectedLog.module] || selectedLog.module}</div>
              </div>
              {selectedLog.entityName && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500 dark:text-gray-400">{t.entity}:</div>
                  <div className="text-gray-900 dark:text-white">{selectedLog.entityName}</div>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500 dark:text-gray-400">{t.ipAddress}:</div>
                  <div className="text-gray-900 dark:text-white">{selectedLog.ipAddress}</div>
                </div>
              )}
              {selectedLog.userAgent && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500 dark:text-gray-400">{t.browser}:</div>
                  <div className="text-gray-900 dark:text-white text-xs break-all">{selectedLog.userAgent}</div>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <div className="text-gray-500 dark:text-gray-400 mb-1">{t.details}:</div>
                  <pre className="text-xs bg-gray-100 dark:bg-[#2a2640] p-2 rounded overflow-x-auto text-gray-900 dark:text-white">
                    {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-9 sm:h-10 text-sm cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
                {t.close}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
