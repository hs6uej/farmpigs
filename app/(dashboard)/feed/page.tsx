/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Wheat,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Scale,
  Banknote,
  Calendar
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

interface FeedRecord {
  id: string;
  recordDate: string;
  penId: string;
  feedType: string;
  quantity: number;
  cost?: number;
  notes?: string;
  pen?: { id: string; penNumber: string; penType: string };
}

interface Pen {
  id: string;
  penNumber: string;
  penType: string;
}

const FEED_TYPE_OPTIONS = ['STARTER', 'GROWER', 'FINISHER', 'SOW', 'BOAR', 'CREEP'];

type SortField = 'recordDate' | 'penNumber' | 'feedType' | 'quantity' | 'cost';
type SortDirection = 'asc' | 'desc';

export default function FeedPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FeedRecord | null>(null);
  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split('T')[0],
    penId: '',
    feedType: 'GROWER',
    quantity: '',
    cost: '',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FeedRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchRecords();
    fetchPens();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/feed-consumption');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching feed records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPens = async () => {
    try {
      const res = await fetch('/api/pens');
      if (res.ok) {
        setPens(await res.json());
      }
    } catch (error) {
      console.error('Error fetching pens:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRecord ? `/api/feed-consumption/${editingRecord.id}` : '/api/feed-consumption';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const payload = {
        recordDate: formData.recordDate,
        penId: formData.penId,
        feedType: formData.feedType,
        quantity: parseFloat(formData.quantity),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null
      };
      
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
      console.error('Error saving feed record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/feed-consumption/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting feed record:', error);
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const openDeleteDialog = (record: FeedRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const openModal = (record?: FeedRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        recordDate: record.recordDate.split('T')[0],
        penId: record.penId,
        feedType: record.feedType,
        quantity: record.quantity.toString(),
        cost: record.cost?.toString() || '',
        notes: record.notes || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        recordDate: new Date().toISOString().split('T')[0],
        penId: '',
        feedType: 'GROWER',
        quantity: '',
        cost: '',
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
      [locale === 'th' ? 'วันที่' : 'Date']: format(new Date(r.recordDate), 'dd/MM/yyyy'),
      [locale === 'th' ? 'คอก' : 'Pen']: r.pen?.penNumber || '-',
      [locale === 'th' ? 'ประเภทอาหาร' : 'Feed Type']: getFeedTypeLabel(r.feedType),
      [locale === 'th' ? 'ปริมาณ (กก.)' : 'Quantity (kg)']: r.quantity,
      [locale === 'th' ? 'ค่าใช้จ่าย' : 'Cost']: r.cost || '-',
      [locale === 'th' ? 'หมายเหตุ' : 'Notes']: r.notes || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FeedRecords');
    XLSX.writeFile(wb, `feed_records_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getFeedTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STARTER: locale === 'th' ? 'อาหารเริ่มต้น' : 'Starter',
      GROWER: locale === 'th' ? 'อาหารขุน' : 'Grower',
      FINISHER: locale === 'th' ? 'อาหารขั้นสุดท้าย' : 'Finisher',
      SOW: locale === 'th' ? 'อาหารแม่พันธุ์' : 'Sow Feed',
      BOAR: locale === 'th' ? 'อาหารพ่อพันธุ์' : 'Boar Feed',
      CREEP: locale === 'th' ? 'อาหารลูกสุกร' : 'Creep Feed'
    };
    return labels[type] || type;
  };

  const getFeedTypeBadge = (type: string) => {
    const configs: Record<string, string> = {
      STARTER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      GROWER: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      FINISHER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      SOW: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
      BOAR: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
      CREEP: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
    };
    
    const colorClass = configs[type] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {getFeedTypeLabel(type)}
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
        (r.pen?.penNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.notes || '').toLowerCase().includes(search.toLowerCase());
      
      const matchType = filterType === 'ALL' || r.feedType === filterType;
      
      return matchSearch && matchType;
    });

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'recordDate':
            aValue = new Date(a.recordDate).getTime();
            bValue = new Date(b.recordDate).getTime();
            break;
          case 'penNumber':
            aValue = a.pen?.penNumber || '';
            bValue = b.pen?.penNumber || '';
            break;
          case 'feedType':
            aValue = a.feedType || '';
            bValue = b.feedType || '';
            break;
          case 'quantity':
            aValue = a.quantity || 0;
            bValue = b.quantity || 0;
            break;
          case 'cost':
            aValue = a.cost || 0;
            bValue = b.cost || 0;
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

  // Calculate stats
  const totalQuantity = records.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const todayRecords = records.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.recordDate.split('T')[0] === today;
  });

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
      <div className="sticky top-0 z-10 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <Wheat className="text-purple-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            {locale === 'th' ? 'บันทึกอาหาร' : 'Feed Records'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการการให้อาหารในแต่ละคอก' : 'Manage feed consumption per pen'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-600 text-white border-green-600 hover:bg-green-700 hover:text-white cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('common.exportExcel')}</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openModal()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-purple-600 text-white hover:text-white hover:bg-purple-700 cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{locale === 'th' ? 'เพิ่มบันทึก' : 'Add Record'}</span>
            <span className="sm:hidden">{locale === 'th' ? 'เพิ่ม' : 'Add'}</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors shadow-none"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="cursor-pointer h-10 bg-white w-full sm:w-48 text-sm  border-[#8B8D98]/20 rounded-lg dark:bg-[#1f1d2e] dark:text-gray-300 shadow-none">
            <SelectValue placeholder={locale === 'th' ? 'กรองตามประเภท' : 'Filter by Type'} />
          </SelectTrigger>
          <SelectContent className="z-300 bg-white dark:bg-[#2a2640] border border-[#8B8D98]/20  dark:border-[#8B8D98]/20 "> 
            <SelectItem value="ALL" className="cursor-pointer  dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400">{locale === 'th' ? 'ทั้งหมด' : 'All'}</SelectItem>    
            {FEED_TYPE_OPTIONS.map(type => (
              <SelectItem key={type}
              className="cursor-pointer  dark:text-gray-200  dark:hover:text-white  dark:data-[state=checked]:text-gray-200 hover:bg-gray-400"
               value={type}>{getFeedTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Wheat className="text-purple-600 dark:text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Scale className="text-green-600 dark:text-green-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ปริมาณ(kg)' : 'Qty(kg)'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Banknote className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ค่าใช้จ่าย' : 'Cost'}</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">฿{totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="pt-4 sm:pt-6 pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <Calendar 
                
                className="text-orange-600 dark:text-orange-400 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'วันนี้' : 'Today'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{todayRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed Records Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('recordDate')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'วันที่' : 'Date'}
                    {getSortIcon('recordDate')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('penNumber')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'คอก' : 'Pen'}
                    {getSortIcon('penNumber')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('feedType')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ประเภท' : 'Type'}
                    {getSortIcon('feedType')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ปริมาณ' : 'Qty'}
                    {getSortIcon('quantity')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('cost')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ค่าใช้จ่าย' : 'Cost'}
                    {getSortIcon('cost')}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                  {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                </TableHead>
                <TableHead className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  <span className="sm:hidden"></span>
                  <span className="hidden sm:inline">{t('common.edit')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="sm:hidden">{format(new Date(record.recordDate), 'd/M')}</span>
                    <span className="hidden sm:inline">{format(new Date(record.recordDate), 'dd/MM/yyyy')}</span>
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    <span className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{record.pen?.penNumber || '-'}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3">
                    {getFeedTypeBadge(record.feedType)}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {record.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {record.cost ? `฿${record.cost.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                    {record.notes || '-'}
                  </TableCell>
                  <TableCell className="px-1.5 sm:px-2 md:px-4 py-2 sm:py-3 text-right">
                    <div className="flex justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(record)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(record)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
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
              <Wheat className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">
                {locale === 'th' ? 'ไม่พบข้อมูลอาหาร' : 'No feed records found'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedRecords.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedRecords.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedRecords.length}</span>
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
                    <SelectTrigger className="w-14 sm:w-17.5 h-7 sm:h-8 px-2 py-1 text-xs sm:text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-md bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white focus:ring-0 focus:border-[#7800A3]">
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
                
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 px-1 sm:px-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{currentPage}</span>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">/</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{totalPages || 1}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer dark:text-gray-200 border-gray-200 dark:border-[#8B8D98]/50 dark:focus:border-[#7800A3]"
                  >
                    <ChevronRight className="w-4 h-4" />
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
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {editingRecord ? (locale === 'th' ? 'แก้ไขบันทึกอาหาร' : 'Edit Feed Record') : (locale === 'th' ? 'เพิ่มบันทึกอาหารใหม่' : 'Add New Feed Record')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                 className=" dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'วันที่' : 'Date'} *
                  </label>
                  <DatePicker
                    className="cursor-pointer w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/60 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3]"
                    value={formData.recordDate}
                    onChange={(date) => setFormData({...formData, recordDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                    placeholder={locale === 'th' ? 'เลือกวันที่' : 'Select Date'}
                    locale={locale}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'คอก' : 'Pen'} *
                  </label>
                  <Select value={formData.penId} onValueChange={(value) => setFormData({...formData, penId: value})}>
                    <SelectTrigger className="h-10 w-full px-3 py-2 border border-gray-200  dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors  dark:data-placeholder:text-gray-400">
                      <SelectValue placeholder={locale === 'th' ? 'เลือกคอก...' : 'Select pen...'} />
                    </SelectTrigger>
                    
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {pens.map((pen) => (
                        <SelectItem key={pen.id} value={pen.id} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {pen.penNumber} ({pen.penType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'ประเภทอาหาร' : 'Feed Type'} *
                  </label>
                  <Select value={formData.feedType} onValueChange={(value) => setFormData({...formData, feedType: value})}>
                    <SelectTrigger className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                      {FEED_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type} value={type} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                          {getFeedTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'ปริมาณ (กก.)' : 'Quantity (kg)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:outline-none  focus:ring-0 "
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'ค่าใช้จ่าย (บาท)' : 'Cost (THB)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:outline-none focus:ring-0 focus:ring-[#7800A3]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:outline-none focus:ring-0 focus:ring-[#7800A3]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t  border-gray-100 dark:border-gray-600 dark:text-white dark:hover:text-gray-200">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1 cursor-pointer h-10 border-gray-200 dark:border-[#8B8D98]/50 dark:text-gray-400 hover:text-gray-100">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="flex-1 bg-[#7800A3] hover:bg-[#9333EA] text-white cursor-pointer h-10">
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
            className="absolute right-4 top-4 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
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
                ? `คุณต้องการลบบันทึกอาหารนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้` 
                : `Are you sure you want to delete this feed record? This action cannot be undone.`}
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
