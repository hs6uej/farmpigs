/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Syringe,
  Pill,
  AlertTriangle,
  Skull
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

interface HealthRecord {
  id: string;
  recordType: string;
  recordDate: string;
  sowId?: string;
  boarId?: string;
  pigletId?: string;
  vaccineName?: string;
  medicineName?: string;
  dosage?: string;
  disease?: string;
  symptoms?: string;
  treatment?: string;
  cost?: number;
  performedBy?: string;
  notes?: string;
  sow?: { id: string; tagNumber: string };
  boar?: { id: string; tagNumber: string };
  piglet?: { id: string; tagNumber: string };
}

interface Animal {
  id: string;
  tagNumber: string;
}

const RECORD_TYPE_OPTIONS = ['VACCINATION', 'TREATMENT', 'DISEASE', 'MORTALITY'];

type SortField = 'recordType' | 'recordDate' | 'animal' | 'vaccineName' | 'disease' | 'cost' | 'performedBy';
type SortDirection = 'asc' | 'desc';

export default function HealthPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [sows, setSows] = useState<Animal[]>([]);
  const [boars, setBoars] = useState<Animal[]>([]);
  const [piglets, setPiglets] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [formData, setFormData] = useState({
    recordType: 'VACCINATION',
    recordDate: new Date().toISOString().split('T')[0],
    animalType: 'sow',
    animalId: '',
    vaccineName: '',
    medicineName: '',
    dosage: '',
    disease: '',
    symptoms: '',
    treatment: '',
    cost: '',
    performedBy: '',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<HealthRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchRecords();
    fetchAnimals();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/health-records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimals = async () => {
    try {
      const [sowsRes, boarsRes, pigletsRes] = await Promise.all([
        fetch('/api/sows'),
        fetch('/api/boars'),
        fetch('/api/piglets')
      ]);
      
      if (sowsRes.ok) setSows(await sowsRes.json());
      if (boarsRes.ok) setBoars(await boarsRes.json());
      if (pigletsRes.ok) setPiglets(await pigletsRes.json());
    } catch (error) {
      console.error('Error fetching animals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRecord ? `/api/health-records/${editingRecord.id}` : '/api/health-records';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const payload: any = {
        recordType: formData.recordType,
        recordDate: formData.recordDate,
        vaccineName: formData.vaccineName || null,
        medicineName: formData.medicineName || null,
        dosage: formData.dosage || null,
        disease: formData.disease || null,
        symptoms: formData.symptoms || null,
        treatment: formData.treatment || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        performedBy: formData.performedBy || null,
        notes: formData.notes || null,
        sowId: null,
        boarId: null,
        pigletId: null
      };

      // Set the appropriate animal ID
      if (formData.animalType === 'sow') payload.sowId = formData.animalId;
      else if (formData.animalType === 'boar') payload.boarId = formData.animalId;
      else if (formData.animalType === 'piglet') payload.pigletId = formData.animalId;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchRecords();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving health record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/health-records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting health record:', error);
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const openDeleteDialog = (record: HealthRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const openModal = (record?: HealthRecord) => {
    if (record) {
      setEditingRecord(record);
      let animalType = 'sow';
      let animalId = '';
      if (record.sowId) { animalType = 'sow'; animalId = record.sowId; }
      else if (record.boarId) { animalType = 'boar'; animalId = record.boarId; }
      else if (record.pigletId) { animalType = 'piglet'; animalId = record.pigletId; }
      
      setFormData({
        recordType: record.recordType,
        recordDate: record.recordDate.split('T')[0],
        animalType,
        animalId,
        vaccineName: record.vaccineName || '',
        medicineName: record.medicineName || '',
        dosage: record.dosage || '',
        disease: record.disease || '',
        symptoms: record.symptoms || '',
        treatment: record.treatment || '',
        cost: record.cost?.toString() || '',
        performedBy: record.performedBy || '',
        notes: record.notes || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        recordType: 'VACCINATION',
        recordDate: new Date().toISOString().split('T')[0],
        animalType: 'sow',
        animalId: '',
        vaccineName: '',
        medicineName: '',
        dosage: '',
        disease: '',
        symptoms: '',
        treatment: '',
        cost: '',
        performedBy: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const exportToExcel = () => {
    const exportData = records.map(r => ({
      [locale === 'th' ? 'ประเภท' : 'Type']: getRecordTypeLabel(r.recordType),
      [locale === 'th' ? 'วันที่' : 'Date']: format(new Date(r.recordDate), 'dd/MM/yyyy'),
      [locale === 'th' ? 'สัตว์' : 'Animal']: getAnimalTag(r),
      [locale === 'th' ? 'วัคซีน/ยา' : 'Vaccine/Medicine']: r.vaccineName || r.medicineName || '-',
      [locale === 'th' ? 'โรค' : 'Disease']: r.disease || '-',
      [locale === 'th' ? 'ค่าใช้จ่าย' : 'Cost']: r.cost || '-',
      [locale === 'th' ? 'ผู้ดำเนินการ' : 'Performed By']: r.performedBy || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HealthRecords');
    XLSX.writeFile(wb, `health_records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getRecordTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      VACCINATION: locale === 'th' ? 'ฉีดวัคซีน' : 'Vaccination',
      TREATMENT: locale === 'th' ? 'รักษา' : 'Treatment',
      DISEASE: locale === 'th' ? 'โรค' : 'Disease',
      MORTALITY: locale === 'th' ? 'ตาย' : 'Mortality'
    };
    return labels[type] || type;
  };

  const getAnimalTag = (record: HealthRecord) => {
    if (record.sow) return `${locale === 'th' ? 'แม่พันธุ์' : 'Sow'}: ${record.sow.tagNumber}`;
    if (record.boar) return `${locale === 'th' ? 'พ่อพันธุ์' : 'Boar'}: ${record.boar.tagNumber}`;
    if (record.piglet) return `${locale === 'th' ? 'ลูกสุกร' : 'Piglet'}: ${record.piglet.tagNumber || 'N/A'}`;
    return '-';
  };

  const getRecordTypeBadge = (type: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      VACCINATION: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', icon: Syringe },
      TREATMENT: { color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', icon: Pill },
      DISEASE: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200', icon: AlertTriangle },
      MORTALITY: { color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', icon: Skull }
    };
    
    const config = configs[type] || { color: 'bg-gray-100 text-gray-800', icon: HeartPulse };
    const Icon = config.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${config.color}`}>
        <Icon size={14} />
        {getRecordTypeLabel(type)}
      </span>
    );
  };

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-purple-500" /> 
      : <ArrowDown size={14} className="ml-1 text-purple-500" />;
  };

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let result = records.filter(r => {
      const matchSearch = 
        getAnimalTag(r).toLowerCase().includes(search.toLowerCase()) ||
        (r.vaccineName || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.disease || '').toLowerCase().includes(search.toLowerCase());
      
      const matchType = filterType === 'ALL' || r.recordType === filterType;
      
      return matchSearch && matchType;
    });

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'recordType':
            aValue = a.recordType || '';
            bValue = b.recordType || '';
            break;
          case 'recordDate':
            aValue = new Date(a.recordDate).getTime();
            bValue = new Date(b.recordDate).getTime();
            break;
          case 'animal':
            aValue = getAnimalTag(a);
            bValue = getAnimalTag(b);
            break;
          case 'vaccineName':
            aValue = a.vaccineName || a.medicineName || '';
            bValue = b.vaccineName || b.medicineName || '';
            break;
          case 'disease':
            aValue = a.disease || '';
            bValue = b.disease || '';
            break;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
            break;
          case 'performedBy':
            aValue = a.performedBy || '';
            bValue = b.performedBy || '';
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        } else {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
    }

    return result;
  }, [records, search, filterType, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRecords.length / rowsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedRecords, currentPage, rowsPerPage]);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal]);

  // Get animals for dropdown based on selected type
  const getAnimalsForType = () => {
    switch (formData.animalType) {
      case 'sow': return sows;
      case 'boar': return boars;
      case 'piglet': return piglets;
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            {locale === 'th' ? 'บันทึกสุขภาพ' : 'Health Records'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลวัคซีน การรักษา และโรค' : 'Manage vaccination, treatment and disease records'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer"
          >
            <Download size={16} />
            {t('common.exportExcel')}
          </Button>
          <Button
            size="sm"
            onClick={() => openModal()}
            className="flex items-center gap-1.5 bg-purple-600 text-white hover:text-white hover:bg-purple-700 cursor-pointer"
          >
            <Plus size={16} />
            {locale === 'th' ? 'เพิ่มบันทึก' : 'Add Record'}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="cursor-pointer h-10 bg-white w-full sm:w-48 text-sm border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] dark:text-gray-300 focus:ring-0 focus:border-[#7800A3]  focus:ring-[#7800A3] transition-colors shadow-none">
            <SelectValue placeholder={locale === 'th' ? 'กรองตามประเภท' : 'Filter by Type'} />
          </SelectTrigger>
          <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-[#8B8D98]/20  dark:border-[#8B8D98]/20 "> 
            <SelectItem value="ALL" className="cursor-pointer  dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400">
              {locale === 'th' ? 'ทั้งหมด' : 'All'}
            </SelectItem>
            {RECORD_TYPE_OPTIONS.map(type => (
              <SelectItem key={type}
              className="cursor-pointer  dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400"
              value={type}>{getRecordTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Syringe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'วัคซีน' : 'Vaccines'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{records.filter(r => r.recordType === 'VACCINATION').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'รักษา' : 'Treats'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{records.filter(r => r.recordType === 'TREATMENT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Skull className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ตาย' : 'Deaths'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{records.filter(r => r.recordType === 'MORTALITY').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Records Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('recordType')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ประเภท' : 'Type'}
                    {getSortIcon('recordType')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('recordDate')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'วันที่' : 'Date'}
                    {getSortIcon('recordDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('animal')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'สัตว์' : 'Animal'}
                    {getSortIcon('animal')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('vaccineName')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'วัคซีน/ยา' : 'Med'}
                    {getSortIcon('vaccineName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('cost')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ค่าใช้จ่าย' : 'Cost'}
                    {getSortIcon('cost')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('performedBy')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'โดย' : 'By'}
                    {getSortIcon('performedBy')}
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  {t('common.edit')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    {getRecordTypeBadge(record.recordType)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(record.recordDate), 'dd/MM/yy')}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{getAnimalTag(record)}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
                    {record.vaccineName || record.medicineName || record.disease || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
                    {record.cost ? `฿${record.cost.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
                    {record.performedBy || '-'}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(record)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                      >
                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(record)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          
          {paginatedRecords.length === 0 && (
            <div className="text-center py-12">
              <HeartPulse className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">
                {locale === 'th' ? 'ไม่พบข้อมูลสุขภาพ' : 'No health records found'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedRecords.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedRecords.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedRecords.length}</span>
                <span>{locale === 'th' ? 'รายการ' : 'records'}</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{locale === 'th' ? 'แถวต่อหน้า' : 'Rows per page'}</span>
                  <Select
                    value={String(rowsPerPage)}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-14 sm:w-17.5 h-8 px-2 py-1 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      <SelectItem value="5" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">5</SelectItem>
                      <SelectItem value="10" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">10</SelectItem>
                      <SelectItem value="20" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">20</SelectItem>
                      <SelectItem value="50" className="cursor-pointer dark:text-gray-200 dark:hover:text-white dark:data-[state=checked]:text-gray-200">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-1 px-1 sm:px-2">
                    <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">{locale === 'th' ? 'หน้า' : 'Page'}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{currentPage}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">/</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{totalPages || 1}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-8 w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-3 sm:p-4">
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-[#8B8D98]/20">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingRecord ? (locale === 'th' ? 'แก้ไขบันทึก' : 'Edit Record') : (locale === 'th' ? 'เพิ่มบันทึกใหม่' : 'Add Record')}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal} 
               className="h-8 w-8 dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
              >
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'ประเภท' : 'Record Type'} *
                  </label>
                  <Select value={formData.recordType} onValueChange={(value) => setFormData({...formData, recordType: value})}>
                    <SelectTrigger className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-[#8B8D98]/20  dark:border-[#8B8D98]/20 "> 
         
                      {RECORD_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type} value={type} className="cursor-pointer dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400">{getRecordTypeLabel(type)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'วันที่' : 'Date'} *
                  </label>
                  <DatePicker
                    value={formData.recordDate}
                    onChange={(date) => setFormData({...formData, recordDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                    placeholder={locale === 'th' ? 'เลือกวันที่' : 'Select date'}
                    locale={locale}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'ประเภทสัตว์' : 'Animal Type'} *
                  </label>
                  <Select value={formData.animalType} onValueChange={(value) => setFormData({...formData, animalType: value, animalId: ''})}>
                    <SelectTrigger className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20 rounded-lg">
                      <SelectItem value="sow" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">{locale === 'th' ? 'แม่พันธุ์' : 'Sow'}</SelectItem>
                      <SelectItem value="boar" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">{locale === 'th' ? 'พ่อพันธุ์' : 'Boar'}</SelectItem>
                      <SelectItem value="piglet" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">{locale === 'th' ? 'ลูกสุกร' : 'Piglet'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'เลือกสัตว์' : 'Select Animal'} *
                  </label>
                  <Select value={formData.animalId} onValueChange={(value) => setFormData({...formData, animalId: value})}>
                    <SelectTrigger className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg dark:text-white focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors shadow-none">
                      <SelectValue placeholder={locale === 'th' ? 'เลือก...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/20 rounded-lg">
                      {getAnimalsForType().map((animal: any) => (
                        <SelectItem key={animal.id} value={animal.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650] dark:text-white rounded-lg">
                          {animal.tagNumber || animal.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(formData.recordType === 'VACCINATION') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'ชื่อวัคซีน' : 'Vaccine Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.vaccineName}
                        onChange={(e) => setFormData({...formData, vaccineName: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'ขนาดยา' : 'Dosage'}
                      </label>
                      <input
                        type="text"
                        value={formData.dosage}
                        onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {(formData.recordType === 'TREATMENT') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'ชื่อยา' : 'Medicine Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.medicineName}
                        onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'การรักษา' : 'Treatment'}
                      </label>
                      <input
                        type="text"
                        value={formData.treatment}
                        onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {(formData.recordType === 'DISEASE' || formData.recordType === 'MORTALITY') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'โรค' : 'Disease'}
                      </label>
                      <input
                        type="text"
                        value={formData.disease}
                        onChange={(e) => setFormData({...formData, disease: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {locale === 'th' ? 'อาการ' : 'Symptoms'}
                      </label>
                      <input
                        type="text"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                        className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'ค่าใช้จ่าย (บาท)' : 'Cost (THB)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'ผู้ดำเนินการ' : 'Performed By'}
                  </label>
                  <input
                    type="text"
                    value={formData.performedBy}
                    onChange={(e) => setFormData({...formData, performedBy: e.target.value})}
                    className="h-10 w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2a2640] border border-gray-300 dark:border-[#8B8D98]/20 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 ocus:ring-0 focus:border-[#7800A3] focus:ring-[#7800A3] transition-colors focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-[#8B8D98]/20">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal} 
                  className="flex-1 cursor-pointer bg-white hover:bg-gray-50 hover:text-gray-100 dark:bg-transparent dark:hover:bg-[#2a2640] border-gray-300 dark:border-[#8B8D98]/20 text-gray-700 dark:text-white rounded-lg"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer rounded-lg">
                  {editingRecord ? t('common.save') : t('common.add')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/20"
          onEscapeKeyDown={() => setDeleteDialogOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 cursor-pointer rounded-lg text-gray-500 hover:text-gray-100 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#2a2640] transition-colors"
            onClick={() => setDeleteDialogOpen(false)}
          >
            <X size={18} />
          </Button>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              {locale === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {locale === 'th' 
                ? `คุณต้องการลบบันทึกสุขภาพนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้` 
                : `Are you sure you want to delete this health record? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && handleDelete(recordToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
