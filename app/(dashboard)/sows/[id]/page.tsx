'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
    ArrowLeft, Baby, Heart, Skull, TrendingUp, TrendingDown,
    Calendar, Weight, Dna, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    return (
        <Card>
            <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                        <Icon size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SowDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const [sow, setSow] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const id = params?.id as string;

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US');
    };

    useEffect(() => {
        if (!id) return;
        fetch(`/api/sows/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(data => { setSow(data); setLoading(false); })
            .catch(() => { setError('ไม่พบข้อมูลแม่พันธุ์'); setLoading(false); });
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (error || !sow) {
        return (
            <div className="p-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft size={16} className="mr-2" /> กลับ
                </Button>
                <p className="text-red-500">{error || 'ไม่พบข้อมูล'}</p>
            </div>
        );
    }

    // Aggregate stats from farrowings
    let totalBorn = 0;
    let totalBornAlive = 0;
    let totalStillborn = 0;
    let totalDeadPostFarrowing = 0;
    let totalBirthWeight = 0;
    let weightCount = 0;
    const allDeadPiglets: { batchDate: string; deathDate: string | null; cause: string | null; gender: string | null }[] = [];

    sow.farrowings?.forEach((f: any) => {
        totalBorn += f.totalBorn ?? 0;
        totalBornAlive += f.bornAlive ?? 0;
        totalStillborn += f.stillborn ?? 0;
        if (f.averageBirthWeight) { totalBirthWeight += f.averageBirthWeight; weightCount++; }
        f.piglets?.filter((p: any) => p.status === 'DEAD').forEach((p: any) => {
            totalDeadPostFarrowing++;
            allDeadPiglets.push({
                batchDate: f.farrowingDate,
                deathDate: p.deathDate,
                cause: p.deathCause || null,
                gender: p.gender || null,
            });
        });
    });

    const survivors = totalBornAlive - totalDeadPostFarrowing;
    const survivalRate = totalBornAlive > 0 ? ((survivors / totalBornAlive) * 100).toFixed(1) : '0.0';
    const mortalityRate = totalBornAlive > 0 ? ((totalDeadPostFarrowing / totalBornAlive) * 100).toFixed(1) : '0.0';
    const avgBirthWeight = weightCount > 0 ? (totalBirthWeight / weightCount).toFixed(2) : '—';

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800',
            PREGNANT: 'bg-blue-100 text-blue-800',
            LACTATING: 'bg-yellow-100 text-yellow-800',
            WEANED: 'bg-cyan-100 text-cyan-800',
            CULLED: 'bg-orange-100 text-orange-800',
            SOLD: 'bg-gray-100 text-gray-800',
            DEAD: 'bg-gray-900 text-white',
        };
        return map[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} size="sm">
                    <ArrowLeft size={16} className="mr-1" /> กลับ
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            แม่พันธุ์ {sow.tagNumber}
                        </h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(sow.status)}`}>
                            {sow.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{sow.breed}</p>
                </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">วันเกิด</p>
                    <p className="text-sm font-medium">{formatDate(sow.birthDate)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">วันที่ซื้อ</p>
                    <p className="text-sm font-medium">{formatDate(sow.purchaseDate)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">จำนวนครอก</p>
                    <p className="text-sm font-medium">{sow.farrowings?.length || 0} ครอก</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">หมายเหตุ</p>
                    <p className="text-sm font-medium">{sow.notes || '—'}</p>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Baby} label="เกิดทั้งหมด" value={`${totalBorn} ตัว`} color="bg-blue-500" />
                <StatCard icon={Heart} label="เกิดมีชีวิต" value={`${totalBornAlive} ตัว`} color="bg-green-500" />
                <StatCard icon={Skull} label="ตายหลังคลอด" value={`${totalDeadPostFarrowing} ตัว`} color="bg-red-500" />
                <StatCard icon={Weight} label="น้ำหนักเฉลี่ย" value={avgBirthWeight === '—' ? '—' : `${avgBirthWeight} kg`} color="bg-orange-500" />
                <StatCard icon={Dna} label="ตายคลอด" value={`${totalStillborn} ตัว`} color="bg-yellow-500" />
                <StatCard icon={Activity} label="รอดชีวิต" value={`${survivors} ตัว`} color="bg-teal-500" />
                <StatCard icon={TrendingUp} label="อัตราการรอด" value={`${survivalRate}%`} color="bg-emerald-500" />
                <StatCard icon={TrendingDown} label="อัตราการตาย" value={`${mortalityRate}%`} color="bg-rose-500" />
            </div>

            {/* Death details table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Skull size={16} className="text-red-500" />
                        ประวัติลูกที่เสียชีวิต ({totalDeadPostFarrowing} ตัว)
                    </CardTitle>
                    <CardDescription>รายละเอียดวันที่ตายและสาเหตุ</CardDescription>
                </CardHeader>
                <CardContent>
                    {allDeadPiglets.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-6">ไม่มีลูกที่เสียชีวิตหลังคลอด 🎉</p>
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 text-xs">
                                        <th className="pb-2 pr-4 font-medium">#</th>
                                        <th className="pb-2 pr-4 font-medium">วันคลอด (Batch)</th>
                                        <th className="pb-2 pr-4 font-medium">เพศ</th>
                                        <th className="pb-2 pr-4 font-medium">วันที่ตาย</th>
                                        <th className="pb-2 font-medium">สาเหตุการตาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allDeadPiglets.map((d, i) => (
                                        <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="py-2 pr-4 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">{formatDate(d.batchDate)}</td>
                                            <td className="py-2 pr-4">
                                                {d.gender === 'MALE' ? '♂ ผู้' : d.gender === 'FEMALE' ? '♀ เมีย' : '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-red-500 font-medium">{d.deathDate ? formatDate(d.deathDate) : '—'}</td>
                                            <td className="py-2 text-gray-700 dark:text-gray-200">
                                                {d.cause || <span className="text-gray-400 italic">ไม่ระบุสาเหตุ</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Farrowing history */}
            {sow.farrowings?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar size={16} className="text-purple-500" />
                            ประวัติการคลอด ({sow.farrowings.length} ครอก)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500">
                                        <th className="pb-2 pr-4 font-medium">ครอกที่</th>
                                        <th className="pb-2 pr-4 font-medium">วันคลอด</th>
                                        <th className="pb-2 pr-4 font-medium text-center">เกิดทั้งหมด</th>
                                        <th className="pb-2 pr-4 font-medium text-center">มีชีวิต</th>
                                        <th className="pb-2 pr-4 font-medium text-center">ตายคลอด</th>
                                        <th className="pb-2 pr-4 font-medium text-center">ตายหลังคลอด</th>
                                        <th className="pb-2 font-medium text-center">น้ำหนักเฉลี่ย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...sow.farrowings].sort((a: any, b: any) =>
                                        new Date(a.farrowingDate).getTime() - new Date(b.farrowingDate).getTime()
                                    ).map((f: any, idx: number) => {
                                        const deadInBatch = f.piglets?.filter((p: any) => p.status === 'DEAD').length || 0;
                                        return (
                                            <tr key={f.id} className="border-t border-gray-100 dark:border-gray-800">
                                                <td className="py-2 pr-4 font-medium text-purple-600">#{idx + 1}</td>
                                                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{formatDate(f.farrowingDate)}</td>
                                                <td className="py-2 pr-4 text-center">{f.totalBorn ?? '—'}</td>
                                                <td className="py-2 pr-4 text-center text-green-600">{f.bornAlive ?? '—'}</td>
                                                <td className="py-2 pr-4 text-center text-orange-500">{f.stillborn ?? 0}</td>
                                                <td className="py-2 pr-4 text-center text-red-500 font-medium">{deadInBatch}</td>
                                                <td className="py-2 text-center">{f.averageBirthWeight ? `${f.averageBirthWeight} kg` : '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Health records */}
            {sow.healthRecords?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" />
                            ประวัติสุขภาพ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sow.healthRecords.slice(0, 10).map((r: any) => (
                                <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.recordType === 'MORTALITY' ? 'bg-red-100 text-red-700' :
                                                    r.recordType === 'VACCINATION' ? 'bg-blue-100 text-blue-700' :
                                                        r.recordType === 'TREATMENT' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>{r.recordType}</span>
                                            <span className="text-xs text-gray-400">{formatDate(r.recordDate)}</span>
                                        </div>
                                        {r.disease && <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{r.disease}</p>}
                                        {r.notes && <p className="text-xs text-gray-500 mt-0.5">{r.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
