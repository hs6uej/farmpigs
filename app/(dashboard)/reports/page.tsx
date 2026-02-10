'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileDown, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming tabs exist or will be created
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Assuming table exists

export default function ReportsPage() {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [batchSurvival, setBatchSurvival] = useState<any[]>([]);
  const [sowPerformance, setSowPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data
    Promise.all([
      fetch('/api/analytics').then(res => res.ok ? res.json() : null),
      fetch('/api/reports/batch-survival').then(res => res.ok ? res.json() : []),
      fetch('/api/reports/sow-performance').then(res => res.ok ? res.json() : [])
    ]).then(([analyticsData, batchData, sowData]) => {
      setAnalytics(analyticsData);
      setBatchSurvival(batchData);
      setSowPerformance(sowData);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load reports", err);
      setLoading(false);
    });
  }, []);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Overview Sheet
    if (analytics) {
      const summary = [
        ['Metric', 'Value'],
        ['Total Sows', analytics.overview?.totalSows || 0],
        ['Total Boars', analytics.overview?.totalBoars || 0],
        ['Total Piglets', analytics.overview?.totalPiglets || 0],
        ['Total Pens', analytics.overview?.totalPens || 0],
        ['Breeding Success Rate', `${analytics.performance?.breedingSuccessRate || 0}%`],
        ['Mortality Rate', `${analytics.performance?.mortalityRate || 0}%`],
        ['Average ADG', `${analytics.performance?.avgDailyGain || 0} kg`],
        ['FCR', analytics.performance?.fcr || 'N/A']
      ];
      const ws = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    }

    // Batch Survival Sheet
    if (batchSurvival.length > 0) {
      const batchWS = XLSX.utils.json_to_sheet(batchSurvival);
      XLSX.utils.book_append_sheet(wb, batchWS, 'Batch Survival');
    }

    // Sow Performance Sheet
    if (sowPerformance.length > 0) {
      const sowWS = XLSX.utils.json_to_sheet(sowPerformance);
      XLSX.utils.book_append_sheet(wb, sowWS, 'Sow Performance');
    }

    XLSX.writeFile(wb, `farm-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-white dark:bg-background space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('menu.reports')}
        </h1>
        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="mr-2 h-4 w-4" />
          {t('common.exportExcel')}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batch-survival">Piglet Batch Survival</TabsTrigger>
          <TabsTrigger value="sow-performance">Mother Pig Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Re-use existing cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.totalSows')}</CardDescription>
                <CardTitle className="text-4xl">{analytics?.overview?.totalSows || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.totalPiglets')}</CardDescription>
                <CardTitle className="text-4xl">{analytics?.overview?.totalPiglets || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('dashboard.breedingRate')}</CardDescription>
                <CardTitle className="text-4xl">{analytics?.performance?.breedingSuccessRate || 0}%</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Mortality Rate</CardDescription>
                <CardTitle className="text-4xl">{analytics?.performance?.mortalityRate || 0}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch-survival">
          <Card>
            <CardHeader>
              <CardTitle>Piglet Batch Survival Report</CardTitle>
              <CardDescription>Survival rates per farrowing batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sow Tag</TableHead>
                      <TableHead>Batch Date</TableHead>
                      <TableHead>Born Alive</TableHead>
                      <TableHead>Stillborn</TableHead>
                      <TableHead>Dead (Post-Farrow)</TableHead>
                      <TableHead>Survivors</TableHead>
                      <TableHead>Survival Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchSurvival.map((batch: any) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.sowTag}</TableCell>
                        <TableCell>{new Date(batch.batchDate).toLocaleDateString()}</TableCell>
                        <TableCell>{batch.bornAlive}</TableCell>
                        <TableCell>{batch.stillborn}</TableCell>
                        <TableCell className="text-red-500">{batch.deadPostFarrowing}</TableCell>
                        <TableCell className="text-green-600 font-bold">{batch.survivors}</TableCell>
                        <TableCell>{batch.survivalRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sow-performance">
          <Card>
            <CardHeader>
              <CardTitle>Mother Pig Performance</CardTitle>
              <CardDescription>Lifetime performance statistics per sow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag Number</TableHead>
                      <TableHead>Breed</TableHead>
                      <TableHead>Total Litters</TableHead>
                      <TableHead>Avg Born/Litter</TableHead>
                      <TableHead>Avg Birth Wt (kg)</TableHead>
                      <TableHead>Total Dead</TableHead>
                      <TableHead>Survival Rate (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sowPerformance.map((sow: any) => (
                      <TableRow key={sow.id}>
                        <TableCell className="font-medium">{sow.tagNumber}</TableCell>
                        <TableCell>{sow.breed}</TableCell>
                        <TableCell>{sow.totalLitters}</TableCell>
                        <TableCell>{sow.avgBornPerLitter}</TableCell>
                        <TableCell>{sow.avgBirthWeight}</TableCell>
                        <TableCell className="text-red-500">{sow.totalDead}</TableCell>
                        <TableCell>{sow.survivalRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
