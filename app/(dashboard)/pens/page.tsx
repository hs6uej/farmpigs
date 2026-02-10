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
  Home,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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

interface Pen {
  id: string;
  penNumber: string;
  penType: string;
  capacity: number;
  currentCount: number;
  notes?: string;
  piglets?: any[];
}

const PEN_TYPE_OPTIONS = ['FARROWING', 'NURSERY', 'GROWING', 'FINISHING'];

type SortField = 'penNumber' | 'penType' | 'capacity' | 'currentCount' | 'occupancy';
type SortDirection = 'asc' | 'desc';

export default function PensPage() {
  const t = useTranslations();
  const locale = useLocale();
  
  const [pens, setPens] = useState<Pen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPen, setEditingPen] = useState<Pen | null>(null);
  const [formData, setFormData] = useState({
    penNumber: '',
    penType: 'FARROWING',
    capacity: '',
    currentCount: '0',
    notes: ''
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [penToDelete, setPenToDelete] = useState<Pen | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchPens();
  }, []);

  const fetchPens = async () => {
    try {
      const res = await fetch('/api/pens');
      if (res.ok) {
        const data = await res.json();
        setPens(data);
      }
    } catch (error) {
      console.error('Error fetching pens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPen ? `/api/pens/${editingPen.id}` : '/api/pens';
      const method = editingPen ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
          currentCount: parseInt(formData.currentCount)
        })
      });

      if (res.ok) {
        fetchPens();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving pen:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPens();
      } else {
        const error = await res.json();
        alert(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting pen:', error);
    } finally {
      setDeleteDialogOpen(false);
      setPenToDelete(null);
    }
  };

  const openDeleteDialog = (pen: Pen) => {
    setPenToDelete(pen);
    setDeleteDialogOpen(true);
  };

  const openModal = (pen?: Pen) => {
    if (pen) {
      setEditingPen(pen);
      setFormData({
        penNumber: pen.penNumber,
        penType: pen.penType,
        capacity: pen.capacity.toString(),
        currentCount: pen.currentCount.toString(),
        notes: pen.notes || ''
      });
    } else {
      setEditingPen(null);
      setFormData({ penNumber: '', penType: 'FARROWING', capacity: '', currentCount: '0', notes: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPen(null);
    setFormData({ penNumber: '', penType: 'FARROWING', capacity: '', currentCount: '0', notes: '' });
  };

  const exportToExcel = () => {
    const exportData = pens.map(pen => ({
      [locale === 'th' ? 'หมายเลขคอก' : 'Pen Number']: pen.penNumber,
      [locale === 'th' ? 'ประเภท' : 'Type']: pen.penType,
      [locale === 'th' ? 'ความจุ' : 'Capacity']: pen.capacity,
      [locale === 'th' ? 'จำนวนปัจจุบัน' : 'Current Count']: pen.currentCount,
      [locale === 'th' ? 'การใช้งาน %' : 'Occupancy %']: ((pen.currentCount / pen.capacity) * 100).toFixed(1)
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pens');
    XLSX.writeFile(wb, `pens_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Filter and sort pens
  const filteredAndSortedPens = useMemo(() => {
    let result = pens.filter(pen => 
      pen.penNumber.toLowerCase().includes(search.toLowerCase()) ||
      pen.penType.toLowerCase().includes(search.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'penNumber':
            aValue = a.penNumber || '';
            bValue = b.penNumber || '';
            break;
          case 'penType':
            aValue = a.penType || '';
            bValue = b.penType || '';
            break;
          case 'capacity':
            aValue = a.capacity || 0;
            bValue = b.capacity || 0;
            break;
          case 'currentCount':
            aValue = a.currentCount || 0;
            bValue = b.currentCount || 0;
            break;
          case 'occupancy':
            aValue = a.capacity > 0 ? (a.currentCount / a.capacity) * 100 : 0;
            bValue = b.capacity > 0 ? (b.currentCount / b.capacity) * 100 : 0;
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
  }, [pens, search, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPens.length / rowsPerPage);
  const paginatedPens = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedPens.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedPens, currentPage, rowsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const getPenTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      FARROWING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
      NURSERY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      GROWING: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      FINISHING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
    };
    
    const labels: Record<string, string> = {
      FARROWING: locale === 'th' ? 'คลอด' : 'Farrowing',
      NURSERY: locale === 'th' ? 'อนุบาล' : 'Nursery',
      GROWING: locale === 'th' ? 'เติบโต' : 'Growing',
      FINISHING: locale === 'th' ? 'ขุน' : 'Finishing',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getOccupancyBadge = (current: number, capacity: number) => {
    const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
    let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
    
    if (percentage >= 90) {
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    } else if (percentage >= 70) {
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {percentage.toFixed(0)}%
      </span>
    );
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
      <div className="sticky top-0 z-50 bg-gray-100 dark:bg-[#0f0d1a] pt-2 pb-4 -mt-2 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-gray-900 dark:text-white gap-2">
            <Home className="text-purple-500" />
            {locale === 'th' ? 'จัดการคอก' : 'Pen Management'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {locale === 'th' ? 'จัดการข้อมูลคอกสุกร' : 'Manage pig pen records'}
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
            {locale === 'th' ? 'เพิ่มคอก' : 'Add Pen'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-white dark:bg-[#1f1d2e] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ทั้งหมด' : 'Total'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{pens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'คอกคลอด' : 'Farrowing'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600">{pens.filter(p => p.penType === 'FARROWING').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'คอกอนุบาล' : 'Nursery'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{pens.filter(p => p.penType === 'NURSERY').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-[#1f1d2e]">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-0.5 sm:mb-1">{locale === 'th' ? 'ความจุรวม' : 'Total Capacity'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{pens.reduce((sum, p) => sum + p.capacity, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pens Table */}
      <Card className="bg-white dark:bg-[#1f1d2e] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2640] hover:bg-gray-50 dark:hover:bg-[#2a2640]">
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase first:rounded-tl-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('penNumber')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'หมายเลข' : 'Pen #'}
                    {getSortIcon('penNumber')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('penType')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ประเภท' : 'Type'}
                    {getSortIcon('penType')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('capacity')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ความจุ' : 'Capacity'}
                    {getSortIcon('capacity')}
                  </div>
                </TableHead>
                <TableHead 
                  className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('currentCount')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ปัจจุบัน' : 'Current'}
                    {getSortIcon('currentCount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3a3650]"
                  onClick={() => handleSort('occupancy')}
                >
                  <div className="flex items-center">
                    {locale === 'th' ? 'ใช้งาน' : 'Use'}
                    {getSortIcon('occupancy')}
                  </div>
                </TableHead>
                <TableHead className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase text-right last:rounded-tr-lg">
                  {t('common.edit')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPens.map((pen) => (
                <TableRow key={pen.id} className="hover:bg-gray-50 dark:hover:bg-[#7800A3]/10">
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{pen.penNumber}</span>
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    {getPenTypeBadge(pen.penType)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
                    {pen.capacity}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 dark:text-gray-400">
                    {pen.currentCount}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                    {getOccupancyBadge(pen.currentCount, pen.capacity)}
                  </TableCell>
                  <TableCell className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(pen)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                      >
                        <Edit2 size={14} className="sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(pen)}
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
          
          {paginatedPens.length === 0 && (
            <div className="text-center py-12">
              <Home className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">
                {locale === 'th' ? 'ไม่พบข้อมูลคอก' : 'No pens found'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedPens.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 dark:border-[#8B8D98]/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>{locale === 'th' ? 'แสดง' : 'Showing'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredAndSortedPens.length)}
                </span>
                <span>{locale === 'th' ? 'จาก' : 'of'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredAndSortedPens.length}</span>
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
                    <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
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
          <div className="bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingPen ? (locale === 'th' ? 'แก้ไขคอก' : 'Edit Pen') : (locale === 'th' ? 'เพิ่มคอกใหม่' : 'Add New Pen')}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="dark:hover:text-gray-200 cursor-pointer rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300  dark:hover:bg-[#2a2640] transition-colors" 
                onClick={closeModal}
              >
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'หมายเลขคอก' : 'Pen Number'} *
                </label>
                <input
                  type="text"
                  value={formData.penNumber}
                  onChange={(e) => setFormData({...formData, penNumber: e.target.value})}
                  required
                  className="w-full px-3 py-2 h-10 border focus:border-0 border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                  placeholder="e.g., P001"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'ประเภท' : 'Type'} *
                </label>
                <Select value={formData.penType} onValueChange={(value) => setFormData({...formData, penType: value})}>
                  <SelectTrigger className="w-full h-10 px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                    {PEN_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-[#7800A3]/20 dark:text-white dark:hover:text-white">
                        {type === 'FARROWING' ? (locale === 'th' ? 'คลอด' : 'Farrowing') :
                         type === 'NURSERY' ? (locale === 'th' ? 'อนุบาล' : 'Nursery') :
                         type === 'GROWING' ? (locale === 'th' ? 'เติบโต' : 'Growing') :
                         (locale === 'th' ? 'ขุน' : 'Finishing')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'ความจุ' : 'Capacity'} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                  className="w-full px-3 py-2 h-10 border focus:border-0 border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'จำนวนปัจจุบัน' : 'Current Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentCount}
                  onChange={(e) => setFormData({...formData, currentCount: e.target.value})}
                  className="w-full px-3 py-2 h-10 border focus:border-0 border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-1 focus:ring-[#7800A3] outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {locale === 'th' ? 'หมายเหตุ' : 'Notes'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-[#8B8D98]/50 rounded-lg bg-gray-50 dark:bg-[#2a2640] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-[#7800A3] focus:ring-0 focus:ring-[#7800A3] outline-none resize-none"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer dark:text-white"
                >
                  {editingPen ? t('common.save') : t('common.add')}
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
              {t('common.delete')} {locale === 'th' ? 'คอก?' : 'Pen?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              {penToDelete?.penNumber} - {penToDelete?.penType}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-gray-400 dark:text-white dark:hover:text-gray-200 hover:border-gray-200 dark:bg-transparent">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => penToDelete && handleDelete(penToDelete.id)}
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
