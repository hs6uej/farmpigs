'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Download, BarChart3, Baby, Heart, Skull, TrendingUp, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#a855f7',
  yellow: '#eab308',
  teal: '#14b8a6',
};

export default function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [analytics, setAnalytics] = useState<any>(null);
  const [batchSurvival, setBatchSurvival] = useState<any[]>([]);
  const [sowPerformance, setSowPerformance] = useState<any[]>([]);
  const [deathCauses, setDeathCauses] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSowId, setExpandedSowId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(res => res.ok ? res.json() : null),
      fetch('/api/reports/batch-survival').then(res => res.ok ? res.json() : []),
      fetch('/api/reports/sow-performance').then(res => res.ok ? res.json() : []),
      fetch('/api/reports/death-causes').then(res => res.ok ? res.json() : null),
      fetch('/api/analytics/yearly').then(res => res.ok ? res.json() : []),
    ]).then(([analyticsData, batchData, sowData, deathData, yearlyData]) => {
      setAnalytics(analyticsData);
      setBatchSurvival(batchData || []);
      setSowPerformance(sowData || []);
      setDeathCauses(deathData);
      setMonthlyData(yearlyData || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load reports", err);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '12px',
    },
    labelStyle: { color: '#d1d5db' },
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (analytics) {
      const summary = [
        ['รายการ', 'ค่า'],
        ['แม่พันธุ์ทั้งหมด', analytics.overview?.totalSows || 0],
        ['พ่อพันธุ์ทั้งหมด', analytics.overview?.totalBoars || 0],
        ['ลูกหมูทั้งหมด', analytics.overview?.totalPiglets || 0],
        ['อัตราผสมติด (%)', `${analytics.performance?.breedingSuccessRate || 0}%`],
        ['อัตราการตาย (%)', `${analytics.performance?.mortalityRate || 0}%`],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summary);
      ws1['!cols'] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'ภาพรวม');
    }

    if (monthlyData.length > 0) {
      const rows = monthlyData.map(m => ({
        'เดือน': m.month,
        'ผสมทั้งหมด': m.totalBreedings,
        'แม่ที่ผสม': m.uniqueSowsBreeding,
        'แม่คลอด': m.uniqueSowsFarrowing,
        'เกิดทั้งหมด': m.totalBorn,
        'มีชีวิต': m.totalBornAlive,
        'ตายคลอด': m.totalStillborn,
        'มัมมี่': m.totalMummified,
        'หย่านม': m.weanedCount,
        'อัตราการรอด (%)': m.survivalRate,
        'เฉลี่ยลูก/แม่': m.avgPerSow,
        'น้ำหนักแรกเกิดเฉลี่ย/ครอก (kg)': m.avgBirthWeightPerLitter,
        'น้ำหนักแรกเกิดเฉลี่ย/ตัว (kg)': m.avgBirthWeightPerPiglet,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = Array(14).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(wb, ws, 'รายงานรายเดือน');
    }

    if (sowPerformance.length > 0) {
      const sowRows = sowPerformance.map((s: any) => ({
        'รหัสแม่': s.tagNumber, 'สายพันธุ์': s.breed,
        'ครอก': s.totalLitters, 'เกิดทั้งหมด': s.totalBorn,
        'มีชีวิต': s.totalBornAlive, 'ตายคลอด': s.totalStillborn,
        'ตายหลังคลอด': s.totalDead, 'รอดชีวิต': s.survivors,
        'อัตราการรอด (%)': s.survivalRate, 'อัตราการตาย (%)': s.mortalityRate,
      }));
      const ws2 = XLSX.utils.json_to_sheet(sowRows);
      XLSX.utils.book_append_sheet(wb, ws2, 'ประสิทธิภาพแม่พันธุ์');
    }

    if (batchSurvival.length > 0) {
      const batchRows = batchSurvival.map((b: any) => ({
        'รหัสแม่': b.sowTag, 'วันคลอด': formatDate(b.batchDate),
        'เกิดมีชีวิต': b.bornAlive, 'ตายคลอด': b.stillborn,
        'รอดชีวิต': b.survivors, 'อัตราการรอด (%)': b.survivalRate,
      }));
      const ws3 = XLSX.utils.json_to_sheet(batchRows);
      XLSX.utils.book_append_sheet(wb, ws3, 'Batch Survival');
    }

    if (deathCauses?.deathRecords?.length > 0) {
      const deathRows = deathCauses.deathRecords.map((d: any) => ({
        'รหัสลูกหมู': d.pigletTag, 'รหัสแม่': d.sowTag,
        'วันที่ตาย': formatDate(d.deathDate), 'สาเหตุ': d.cause,
      }));
      const ws4 = XLSX.utils.json_to_sheet(deathRows);
      XLSX.utils.book_append_sheet(wb, ws4, 'รายงานการตาย');
    }

    XLSX.writeFile(wb, `farm-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-purple-500 w-7 h-7" />
            {t('menu.reports')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">รายงานและวิเคราะห์ข้อมูลฟาร์ม</p>
        </div>
        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Excel (ทุกรายงาน)
        </Button>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp size={14} />
            <span className="hidden sm:inline">รายเดือน</span>
            <span className="sm:hidden">เดือน</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart3 size={14} />
            <span className="hidden sm:inline">ภาพรวม</span>
            <span className="sm:hidden">รวม</span>
          </TabsTrigger>
          <TabsTrigger value="sow-performance" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Heart size={14} />
            <span className="hidden sm:inline">ประสิทธิภาพแม่</span>
            <span className="sm:hidden">แม่</span>
          </TabsTrigger>
          <TabsTrigger value="batch-survival" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Baby size={14} />
            <span className="hidden sm:inline">Batch Survival</span>
            <span className="sm:hidden">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="death-causes" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Skull size={14} />
            <span className="hidden sm:inline">รายงานการตาย</span>
            <span className="sm:hidden">การตาย</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab: รายงานรายเดือน ===== */}
        <TabsContent value="monthly">
          <div className="space-y-6">

            {/* Chart 1: ผสมเทียมและขึ้นคลอด */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">รายงานการผสมเทียมและขึ้นคลอดสุกรแม่พันธุ์</CardTitle>
                  <CardDescription>จำนวนครั้งที่ผสม, แม่พันธุ์ที่ผสม, แม่พันธุ์ที่คลอด รายเดือน</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const wb = XLSX.utils.book_new();
                  const rows = monthlyData.map(m => ({
                    'เดือน': m.month, 'จำนวนผสม': m.totalBreedings,
                    'แม่ที่ผสม': m.uniqueSowsBreeding, 'แม่ที่คลอด': m.uniqueSowsFarrowing,
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, 'ผสมและคลอด');
                  XLSX.writeFile(wb, `breeding-farrowing-${new Date().toISOString().split('T')[0]}.xlsx`);
                }}>
                  <Download size={13} className="mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="totalBreedings" name="จำนวนครั้งที่ผสมเทียม" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="uniqueSowsBreeding" name="แม่พันธุ์ที่ผสมเทียม" fill={COLORS.green} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="uniqueSowsFarrowing" name="แม่พันธุ์ที่คลอด" fill={COLORS.orange} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: การผลิตลูกสุกรเกิดคลอด */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">รายงานการผลิตลูกสุกรเกิดคลอด</CardTitle>
                  <CardDescription>จำนวนลูกสุกรหย่านม, มัมมี่, ตายแรกคลอด รายเดือน</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const wb = XLSX.utils.book_new();
                  const rows = monthlyData.map(m => ({
                    'เดือน': m.month, 'หย่านม': m.weanedCount,
                    'มัมมี่': m.totalMummified, 'ตายแรกคลอด': m.totalStillborn,
                    'เกิดมีชีวิต': m.totalBornAlive, 'เกิดทั้งหมด': m.totalBorn,
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, 'ผลิตลูกสุกร');
                  XLSX.writeFile(wb, `piglet-production-${new Date().toISOString().split('T')[0]}.xlsx`);
                }}>
                  <Download size={13} className="mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="weanedCount" name="หย่านม" fill={COLORS.green} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="totalMummified" name="มัมมี่" fill={COLORS.orange} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="totalStillborn" name="ตายแรกคลอด" fill={COLORS.red} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 3 & 4 side by side: อัตราการรอด + เฉลี่ยลูก/แม่ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">อัตราการรอดชีวิตของลูกสุกร (%)</CardTitle>
                  <CardDescription>รายเดือน</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'อัตราการรอด']} />
                        <Bar dataKey="survivalRate" name="อัตราการรอด" fill={COLORS.green} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">จำนวนลูกสุกรเฉลี่ย / แม่</CardTitle>
                  <CardDescription>รายเดือน</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [`${v} ตัว`, 'เฉลี่ย/แม่']} />
                        <Bar dataKey="avgPerSow" name="เฉลี่ยลูก/แม่" fill={COLORS.blue} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart 5: ค่าเฉลี่ยน้ำหนักแรกเกิด */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">ค่าเฉลี่ยน้ำหนักแรกเกิดของลูกสุกร (kg)</CardTitle>
                  <CardDescription>น้ำหนักรวมทั้งครอก, เฉลี่ย/ครอก, เฉลี่ย/ตัว</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => {
                  const wb = XLSX.utils.book_new();
                  const rows = monthlyData.map(m => ({
                    'เดือน': m.month, 'น้ำหนักรวม (kg)': m.totalBirthWeightSum,
                    'เฉลี่ย/ครอก (kg)': m.avgBirthWeightPerLitter, 'เฉลี่ย/ตัว (kg)': m.avgBirthWeightPerPiglet,
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, 'น้ำหนักแรกเกิด');
                  XLSX.writeFile(wb, `birth-weight-${new Date().toISOString().split('T')[0]}.xlsx`);
                }}>
                  <Download size={13} className="mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [`${v} kg`]} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="totalBirthWeightSum" name="น.อ.สุกรรวม" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="avgBirthWeightPerLitter" name="น.เฉลี่ย/ครอก" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="avgBirthWeightPerPiglet" name="น.เฉลี่ย/ตัว" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ===== Tab: ภาพรวม ===== */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>แม่พันธุ์ทั้งหมด</CardDescription>
                <CardTitle className="text-4xl text-purple-600">{analytics?.overview?.totalSows || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>ลูกหมูทั้งหมด</CardDescription>
                <CardTitle className="text-4xl text-blue-600">{analytics?.overview?.totalPiglets || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>อัตราผสมติด</CardDescription>
                <CardTitle className="text-4xl text-green-600">{analytics?.performance?.breedingSuccessRate || 0}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>อัตราการตาย</CardDescription>
                <CardTitle className="text-4xl text-red-500">{analytics?.performance?.mortalityRate || 0}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>ADG เฉลี่ย (kg/วัน)</CardDescription>
                <CardTitle className="text-3xl">{analytics?.performance?.avgDailyGain || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>FCR (อัตราการแลกเนื้อ)</CardDescription>
                <CardTitle className="text-3xl">{analytics?.performance?.fcr || 'N/A'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>เฉลี่ยลูก/ครอก</CardDescription>
                <CardTitle className="text-3xl">{analytics?.performance?.avgPigletsPerLitter || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Tab: ประสิทธิภาพแม่พันธุ์ ===== */}
        <TabsContent value="sow-performance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ประสิทธิภาพแม่พันธุ์รายตัว</CardTitle>
                <CardDescription>สถิติตลอดชีวิตของแม่สุกรแต่ละตัว</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                const wb = XLSX.utils.book_new();
                const rows = sowPerformance.map((s: any) => ({
                  'รหัสแม่': s.tagNumber, 'สายพันธุ์': s.breed,
                  'ครอก': s.totalLitters, 'เกิดทั้งหมด': s.totalBorn,
                  'มีชีวิต': s.totalBornAlive, 'ตายคลอด': s.totalStillborn,
                  'ตายหลังคลอด': s.totalDead, 'รอดชีวิต': s.survivors,
                  'อัตราการรอด (%)': s.survivalRate, 'อัตราการตาย (%)': s.mortalityRate,
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, 'ประสิทธิภาพแม่พันธุ์');
                XLSX.writeFile(wb, `sow-performance-${new Date().toISOString().split('T')[0]}.xlsx`);
              }} className="bg-green-600 hover:bg-green-700 text-white">
                <Download size={14} className="mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>รหัสแม่</TableHead>
                      <TableHead>สายพันธุ์</TableHead>
                      <TableHead className="text-center">ครอก</TableHead>
                      <TableHead className="text-center">เกิดทั้งหมด</TableHead>
                      <TableHead className="text-center">มีชีวิต</TableHead>
                      <TableHead className="text-center">ตายคลอด</TableHead>
                      <TableHead className="text-center">ตายหลังคลอด</TableHead>
                      <TableHead className="text-center">รอดชีวิต</TableHead>
                      <TableHead className="text-center">อัตราการรอด</TableHead>
                      <TableHead className="text-center">อัตราการตาย</TableHead>
                      <TableHead className="text-center">รายละเอียด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sowPerformance.length === 0 ? (
                      <TableRow><TableCell colSpan={12} className="text-center py-8 text-gray-500">ไม่มีข้อมูล</TableCell></TableRow>
                    ) : sowPerformance.map((sow: any) => (
                      <>
                        <TableRow
                          key={sow.id}
                          className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                          onClick={() => setExpandedSowId(expandedSowId === sow.id ? null : sow.id)}
                        >
                          <TableCell className="text-gray-400">
                            {expandedSowId === sow.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </TableCell>
                          <TableCell className="font-semibold text-purple-600">{sow.tagNumber}</TableCell>
                          <TableCell>{sow.breed}</TableCell>
                          <TableCell className="text-center">{sow.totalLitters}</TableCell>
                          <TableCell className="text-center">{sow.totalBorn}</TableCell>
                          <TableCell className="text-center text-green-600">{sow.totalBornAlive}</TableCell>
                          <TableCell className="text-center text-orange-500">{sow.totalStillborn}</TableCell>
                          <TableCell className="text-center text-red-500">{sow.totalDead}</TableCell>
                          <TableCell className="text-center font-bold text-green-600">{sow.survivors}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sow.survivalRate >= 80 ? 'bg-green-100 text-green-700' : sow.survivalRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {sow.survivalRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sow.mortalityRate <= 10 ? 'bg-green-100 text-green-700' : sow.mortalityRate <= 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {sow.mortalityRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <a
                              href={`/sows/${sow.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              <ExternalLink size={11} /> ดูโปรไฟล์
                            </a>
                          </TableCell>
                        </TableRow>
                        {expandedSowId === sow.id && (
                          <TableRow key={`${sow.id}-detail`}>
                            <TableCell colSpan={12} className="p-0 bg-gray-50 dark:bg-gray-900/40">
                              <div className="px-6 py-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">🐷 รายละเอียดลูกที่ตาย ({sow.totalDead} ตัว)</p>
                                {sow.deathDetails && sow.deathDetails.length > 0 ? (
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="text-left text-gray-400">
                                        <th className="pb-1 pr-4">วันคลอด (Batch)</th>
                                        <th className="pb-1 pr-4">วันที่ตาย</th>
                                        <th className="pb-1">สาเหตุการตาย</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sow.deathDetails.map((d: any, i: number) => (
                                        <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                          <td className="py-1 pr-4 text-gray-600 dark:text-gray-300">{formatDate(d.batchDate)}</td>
                                          <td className="py-1 pr-4 text-red-500">{d.deathDate ? formatDate(d.deathDate) : '—'}</td>
                                          <td className="py-1 text-gray-700 dark:text-gray-200">{d.cause || <span className="text-gray-400 italic">ไม่ระบุ</span>}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">ไม่มีลูกที่ตายหลังคลอด</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: Batch Survival ===== */}
        <TabsContent value="batch-survival">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>รายงาน Batch Survival</CardTitle>
                <CardDescription>อัตราการรอดของลูกหมูแต่ละครอก</CardDescription>
              </div>
              <Button size="sm" onClick={() => {
                const wb = XLSX.utils.book_new();
                const rows = batchSurvival.map((b: any) => ({
                  'รหัสแม่': b.sowTag, 'วันคลอด': formatDate(b.batchDate),
                  'เกิดมีชีวิต': b.bornAlive, 'ตายคลอด': b.stillborn,
                  'รอดชีวิต': b.survivors, 'อัตราการรอด (%)': b.survivalRate,
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, 'Batch Survival');
                XLSX.writeFile(wb, `batch-survival-${new Date().toISOString().split('T')[0]}.xlsx`);
              }} className="bg-green-600 hover:bg-green-700 text-white">
                <Download size={14} className="mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสแม่</TableHead>
                      <TableHead>วันคลอด</TableHead>
                      <TableHead className="text-center">เกิดมีชีวิต</TableHead>
                      <TableHead className="text-center">ตายคลอด</TableHead>
                      <TableHead className="text-center text-red-500">ตายหลังคลอด</TableHead>
                      <TableHead className="text-center text-green-600">รอดชีวิต</TableHead>
                      <TableHead className="text-center">อัตราการรอด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchSurvival.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">ไม่มีข้อมูล</TableCell></TableRow>
                    ) : batchSurvival.map((batch: any) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-semibold text-purple-600">{batch.sowTag}</TableCell>
                        <TableCell>{formatDate(batch.batchDate)}</TableCell>
                        <TableCell className="text-center">{batch.bornAlive}</TableCell>
                        <TableCell className="text-center text-orange-500">{batch.stillborn}</TableCell>
                        <TableCell className="text-center text-red-500 font-medium">{batch.deadPostFarrowing}</TableCell>
                        <TableCell className="text-center text-green-600 font-bold">{batch.survivors}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${batch.survivalRate >= 80 ? 'bg-green-100 text-green-700' : batch.survivalRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {batch.survivalRate}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: รายงานการตาย ===== */}
        <TabsContent value="death-causes">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>ตายทั้งหมด</CardDescription>
                  <CardTitle className="text-3xl text-red-500">{deathCauses?.totalDeaths || 0}</CardTitle>
                </CardHeader>
              </Card>
              {deathCauses?.causeSummary?.slice(0, 3).map((c: any, i: number) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardDescription className="truncate">{c.cause}</CardDescription>
                    <CardTitle className="text-3xl">{c.count} <span className="text-base text-gray-400">({c.percentage}%)</span></CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>รายละเอียดการตายรายตัว</CardTitle>
                  <CardDescription>รายการลูกหมูที่ตาย พร้อมสาเหตุและวันที่</CardDescription>
                </div>
                <Button size="sm" onClick={() => {
                  if (!deathCauses?.deathRecords?.length) return;
                  const wb = XLSX.utils.book_new();
                  const rows = deathCauses.deathRecords.map((d: any) => ({
                    'รหัสลูกหมู': d.pigletTag, 'รหัสแม่': d.sowTag,
                    'วัน Batch': formatDate(d.batchDate), 'วันที่ตาย': formatDate(d.deathDate), 'สาเหตุ': d.cause,
                  }));
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, 'รายการตาย');
                  XLSX.writeFile(wb, `death-report-${new Date().toISOString().split('T')[0]}.xlsx`);
                }} className="bg-green-600 hover:bg-green-700 text-white">
                  <Download size={14} className="mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัสลูกหมู</TableHead>
                        <TableHead>รหัสแม่</TableHead>
                        <TableHead>วัน Batch</TableHead>
                        <TableHead>วันที่ตาย</TableHead>
                        <TableHead>สาเหตุการตาย</TableHead>
                        <TableHead className="text-center">เพศ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!deathCauses?.deathRecords?.length ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">ไม่มีข้อมูลการตาย 🎉</TableCell></TableRow>
                      ) : deathCauses.deathRecords.map((d: any) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.pigletTag}</TableCell>
                          <TableCell className="text-purple-600 font-semibold">{d.sowTag}</TableCell>
                          <TableCell className="text-gray-500">{formatDate(d.batchDate)}</TableCell>
                          <TableCell className="text-red-500">{formatDate(d.deathDate)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">{d.cause}</span>
                          </TableCell>
                          <TableCell className="text-center">{d.gender === 'MALE' ? '♂' : d.gender === 'FEMALE' ? '♀' : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
