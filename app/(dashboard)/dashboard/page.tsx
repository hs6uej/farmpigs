/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalSows: number;
    totalBoars: number;
    totalPiglets: number;
    totalPens: number;
    totalAnimals: number;
  };
  sowsByStatus: Record<string, number>;
  pigletsByStatus: Record<string, number>;
  performance: {
    breedingSuccessRate: number;
    avgPigletsPerLitter: number;
    survivalRate: number;
    mortalityRate: number;
    avgDailyGain: number;
    fcr: number | null;
  };
  upcomingFarrowings: any[];
  recentHealthRecords: any[];
}

interface YearlyData {
  month: string;
  monthEn: string;
  breedingSuccessRate: number;
  survivalRate: number;
  avgPigletsPerLitter: number;
  totalBreedings: number;
  successfulBreedings: number;
  totalFarrowings: number;
  totalBorn: number;
  totalBornAlive: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [farrowingPage, setFarrowingPage] = useState(1);
  const [healthRecordPage, setHealthRecordPage] = useState(1);
  const itemsPerPage = 5;
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(res => res.json()),
      fetch('/api/analytics/yearly').then(res => res.json())
    ])
      .then(([analyticsData, yearlyAnalytics]) => {
        setData(analyticsData);
        setYearlyData(yearlyAnalytics);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-transparent flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white dark:bg-transparent flex items-center justify-center">
        <div className="text-xl text-red-600 dark:text-red-400">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-white dark:bg-transparent">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 md:mb-8">{t('dashboard.overview')}</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.sows')}</CardDescription>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{data.overview.totalSows}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.units')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.boars')}</CardDescription>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{data.overview.totalBoars}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.units')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.piglets')}</CardDescription>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{data.overview.totalPiglets}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.units')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.pens')}</CardDescription>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{data.overview.totalPens}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.pensUnit')}</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#1f1d2e] col-span-2 sm:col-span-1">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <CardDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.totalAnimals')}</CardDescription>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{data.overview.totalAnimals}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">{t('dashboard.units')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="bg-white dark:bg-[#1f1d2e]  mb-4 sm:mb-6 md:mb-8">
        <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{t('dashboard.performanceMetrics')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.breedingSuccessRate')}</div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {data.performance.breedingSuccessRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.last6Months')}</div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.avgPigletsPerLitter')}</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {data.performance.avgPigletsPerLitter}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.pigletsPerLitter')}</div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.survivalRate')}</div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {data.performance.survivalRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.sinceBirth')}</div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.mortalityRate')}</div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {data.performance.mortalityRate}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.last30Days')}</div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.avgDailyGain')}</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {data.performance.avgDailyGain}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.kgPerDay')}</div>
            </div>

            <div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">{t('dashboard.fcr')}</div>
              <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                {data.performance.fcr || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.feedConversionRatio')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Performance Chart */}
      {yearlyData.length > 0 && (
        <Card className="bg-white dark:bg-[#1f1d2e] mb-4 sm:mb-6 md:mb-8">
          <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{t('dashboard.yearlyPerformance')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yearlyData.map(d => ({
                    ...d,
                    name: locale === 'th' ? d.month : d.monthEn,
                  }))}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#8B8D98" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#8B8D98', fontSize: 12 }}
                    axisLine={{ stroke: '#8B8D98', opacity: 0.3 }}
                  />
                  <YAxis
                    tick={{ fill: '#8B8D98', fontSize: 12 }}
                    axisLine={{ stroke: '#8B8D98', opacity: 0.3 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f1d2e',
                      border: '1px solid #8B8D98',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="breedingSuccessRate"
                    name={t('dashboard.breedingSuccessRateChart')}
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="survivalRate"
                    name={t('dashboard.survivalRateChart')}
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPigletsPerLitter"
                    name={t('dashboard.avgPigletsPerLitterChart')}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Upcoming Farrowings */}
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">
              {t('dashboard.upcomingFarrowings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            {data.upcomingFarrowings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('common.noData')}</p>
            ) : (
              <>
                <div className="space-y-4">
                  {data.upcomingFarrowings
                    .slice((farrowingPage - 1) * itemsPerPage, farrowingPage * itemsPerPage)
                    .map((breeding: any) => (
                      <div key={breeding.id} className="border-l-4 border-green-500 pl-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {t('dashboard.sowLabel')}: {breeding.sow.tagNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t('dashboard.boarLabel')}: {breeding.boar.tagNumber}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {t('dashboard.expectedFarrowDate')}: {new Date(breeding.expectedFarrowDate).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    ))}
                </div>
                {data.upcomingFarrowings.length > itemsPerPage && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setFarrowingPage(prev => Math.max(1, prev - 1))}
                          className={farrowingPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.ceil(data.upcomingFarrowings.length / itemsPerPage) }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            onClick={() => setFarrowingPage(i + 1)}
                            isActive={farrowingPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setFarrowingPage(prev => Math.min(Math.ceil(data.upcomingFarrowings.length / itemsPerPage), prev + 1))}
                          className={farrowingPage === Math.ceil(data.upcomingFarrowings.length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Health Records */}
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{t('dashboard.recentHealthRecords')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            {data.recentHealthRecords.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('common.noData')}</p>
            ) : (
              <>
                <div className="space-y-4">
                  {data.recentHealthRecords
                    .slice((healthRecordPage - 1) * itemsPerPage, healthRecordPage * itemsPerPage)
                    .map((record: any) => (
                      <div key={record.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {record.recordType === 'VACCINATION' && t('dashboard.healthRecord.vaccination')}
                          {record.recordType === 'TREATMENT' && t('dashboard.healthRecord.treatment')}
                          {record.recordType === 'DISEASE' && t('dashboard.healthRecord.disease')}
                          {record.recordType === 'MORTALITY' && t('dashboard.healthRecord.mortality')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {record.sow && `${t('dashboard.sowLabel')}: ${record.sow.tagNumber}`}
                          {record.boar && `${t('dashboard.boarLabel')}: ${record.boar.tagNumber}`}
                          {record.piglet && t('dashboard.pigletLabel')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(record.recordDate).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    ))}
                </div>
                {data.recentHealthRecords.length > itemsPerPage && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setHealthRecordPage(prev => Math.max(1, prev - 1))}
                          className={healthRecordPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.ceil(data.recentHealthRecords.length / itemsPerPage) }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            onClick={() => setHealthRecordPage(i + 1)}
                            isActive={healthRecordPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setHealthRecordPage(prev => Math.min(Math.ceil(data.recentHealthRecords.length / itemsPerPage), prev + 1))}
                          className={healthRecordPage === Math.ceil(data.recentHealthRecords.length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-6 md:mt-8">
        {/* Sows by Status */}
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{t('dashboard.sowStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(data.sowsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {status === 'ACTIVE' && t('dashboard.status.active')}
                    {status === 'PREGNANT' && t('dashboard.status.pregnant')}
                    {status === 'LACTATING' && t('dashboard.status.lactating')}
                    {status === 'WEANED' && t('dashboard.status.weaned')}
                    {status === 'CULLED' && t('dashboard.status.culled')}
                    {status === 'SOLD' && t('dashboard.status.sold')}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Piglets by Status */}
        <Card className="bg-white dark:bg-[#1f1d2e] ">
          <CardHeader className="border-b border-gray-200 dark:border-border px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">{t('dashboard.pigletStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(data.pigletsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {status === 'NURSING' && t('dashboard.status.nursing')}
                    {status === 'WEANED' && t('dashboard.status.weaned')}
                    {status === 'GROWING' && t('dashboard.status.growing')}
                    {status === 'READY' && t('dashboard.status.ready')}
                    {status === 'SOLD' && t('dashboard.status.sold')}
                  </span>
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
