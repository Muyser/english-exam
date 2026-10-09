import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, ClipboardList, Eye, Trash2, Edit3, AlertTriangle, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export default function AdminResults() {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingPassed, setDownloadingPassed] = useState(false);
  const [downloadingFailed, setDownloadingFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sort, setSort] = useState('latest');
  const [viewTarget, setViewTarget] = useState(null);

  // Edit / Update modal state
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ studentName: '', score: 0, correctAnswers: 0, totalQuestions: 50 });
  const [updating, setUpdating] = useState(false);

  // Single Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Delete All modal state
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://english-grammer-exam.onrender.com';

  const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Request failed');
    }
    return res.json();
  };

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await authFetch('/api/results');
      const normalized = (data || []).map((r) => {
        const correct = r.correctAnswers || 0;
        const totalQ = r.totalQuestions || 50;
        const wrong = r.wrongAnswers !== undefined ? r.wrongAnswers : Math.max(0, totalQ - correct);

        const calculatedScore = r.score !== undefined ? r.score : correct * 2;
        const calculatedPercentage = Math.round((calculatedScore / 100) * 100);

        return {
          ...r,
          id: r._id || r.id,
          score: calculatedScore,
          totalMarks: 100,
          totalQuestions: totalQ,
          percentage: calculatedPercentage,
          correctAnswers: correct,
          wrongAnswers: wrong,
          created_date: r.created_date || r.createdAt || new Date().toISOString(),
        };
      });
      setResults(normalized);
    } catch (e) {
      toast({ title: t('r.tLoadFail') || 'Failed to load results', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  // Open Edit Dialog
  const handleOpenEdit = (result) => {
    setEditTarget(result);
    setEditForm({
      studentName: result.studentName || '',
      score: result.score || 0,
      correctAnswers: result.correctAnswers || 0,
      totalQuestions: result.totalQuestions || 50,
    });
  };

  // Submit Update
  const handleUpdateConfirm = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setUpdating(true);
    try {
      const correct = Number(editForm.correctAnswers);
      const totalQ = Number(editForm.totalQuestions);
      const calculatedScore = Number(editForm.score);
      const wrong = Math.max(0, totalQ - correct);
      const pct = Math.round((calculatedScore / 100) * 100);

      const payload = {
        studentName: editForm.studentName,
        score: calculatedScore,
        correctAnswers: correct,
        totalQuestions: totalQ,
        wrongAnswers: wrong,
        percentage: pct,
      };

      await authFetch(`/api/results/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setResults((prev) =>
        prev.map((r) => (r.id === editTarget.id ? { ...r, ...payload, id: r.id } : r))
      );

      toast({ title: isAr ? 'تم تحديث النتيجة بنجاح' : 'Result updated successfully' });
      setEditTarget(null);
    } catch (e) {
      toast({
        title: isAr ? 'فشل تحديث النتيجة' : 'Failed to update result',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete Single Result
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authFetch(`/api/results/${deleteTarget.id}`, { method: 'DELETE' });
      setResults((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast({ title: isAr ? 'تم حذف النتيجة بنجاح' : 'Result deleted successfully' });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: isAr ? 'فشل حذف النتيجة' : 'Failed to delete result',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Delete All Results Handler
  const handleDeleteAllConfirm = async () => {
    setDeletingAll(true);
    try {
      await authFetch('/api/results', { method: 'DELETE' });
      setResults([]);
      toast({ title: isAr ? 'تم مسح جميع نتائج الامتحانات بنجاح' : 'All exam results cleared successfully' });
      setDeleteAllConfirm(false);
    } catch (e) {
      toast({
        title: isAr ? 'فشل حذف جميع النتائج' : 'Failed to delete all results',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingAll(false);
    }
  };

  // PDF Export Handlers
  const handleDownloadAllPDF = async () => {
    setDownloadingAll(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/results/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to generate combined PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `All_Student_Results_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: isAr ? 'فشل تحميل الملف' : 'Failed to download PDF', description: e.message, variant: 'destructive' });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadPassedPDF = async () => {
    setDownloadingPassed(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/results/export-passed-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to generate passed students PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Passed_Students_Results_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: isAr ? 'فشل تحميل الملف' : 'Failed to download PDF', description: e.message, variant: 'destructive' });
    } finally {
      setDownloadingPassed(false);
    }
  };

  const handleDownloadFailedPDF = async () => {
    setDownloadingFailed(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/results/export-failed-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to generate failed students PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Failed_Students_Results_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: isAr ? 'فشل تحميل الملف' : 'Failed to download PDF', description: e.message, variant: 'destructive' });
    } finally {
      setDownloadingFailed(false);
    }
  };

  const handleDownloadPDF = async (result) => {
    setDownloadingId(result.id);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/results/${result.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to download PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.studentName.replace(/\s+/g, '_')}_Result.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: isAr ? 'فشل تحميل ملف PDF' : 'Failed to download PDF', description: e.message, variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = results.slice();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => (r.studentName || '').toLowerCase().includes(s));
    }
    if (scoreFilter === 'high') list = list.filter((r) => (r.percentage || 0) >= 75);
    else if (scoreFilter === 'mid') list = list.filter((r) => (r.percentage || 0) >= 50 && (r.percentage || 0) < 75);
    else if (scoreFilter === 'low') list = list.filter((r) => (r.percentage || 0) < 50);

    if (sort === 'highest') list.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    else if (sort === 'lowest') list.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));
    else list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return list;
  }, [results, search, scoreFilter, sort]);

  return (
    <div className="w-full space-y-4">
      {/* Header and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{isAr ? 'نتائج الامتحانات' : 'Exam Results'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{isAr ? 'عرض وإدارة نتائج امتحانات الطلاب' : 'View and manage student exam scores'}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAllPDF}
            disabled={downloadingAll || results.length === 0}
            className="h-10 px-3 bg-red-600 hover:bg-red-700 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isAr ? 'تحميل الكل PDF' : 'Export All PDF'}</span>
          </button>

          <button
            onClick={handleDownloadPassedPDF}
            disabled={downloadingPassed || results.length === 0}
            className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            {downloadingPassed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isAr ? 'الناجحين فقط PDF' : 'Export Passed PDF'}</span>
          </button>

          <button
            onClick={handleDownloadFailedPDF}
            disabled={downloadingFailed || results.length === 0}
            className="h-10 px-3 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            {downloadingFailed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isAr ? 'الراسبين فقط PDF' : 'Export Failed PDF'}</span>
          </button>

          {/* Delete All Results Button */}
          <button
            onClick={() => setDeleteAllConfirm(true)}
            disabled={results.length === 0}
            className="h-10 px-3 bg-red-700 hover:bg-red-800 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isAr ? 'حذف جميع النتائج' : 'Delete All Results'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-3 sm:p-4 border-slate-200 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={isAr ? 'بحث باسم الطالب...' : 'Search student...'} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10 h-10 text-xs sm:text-sm" />
          </div>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? 'جميع الدرجات' : 'All Scores'}</SelectItem>
              <SelectItem value="high">{isAr ? 'ممتاز (75%+)' : 'High (75%+)'}</SelectItem>
              <SelectItem value="mid">{isAr ? 'متوسط (50% - 74%)' : 'Mid (50% - 74%)'}</SelectItem>
              <SelectItem value="low">{isAr ? 'راسب (أقل من 50%)' : 'Low (<50%)'}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{isAr ? 'الأحدث أولاً' : 'Latest First'}</SelectItem>
              <SelectItem value="highest">{isAr ? 'الأعلى درجة' : 'Highest Score'}</SelectItem>
              <SelectItem value="lowest">{isAr ? 'الأقل درجة' : 'Lowest Score'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search || scoreFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setScoreFilter('all'); }} className="mt-3 text-xs text-slate-500 hover:text-slate-900">{isAr ? 'إعادة ضبط' : 'Clear Filters'}</button>
        )}
      </Card>

      {/* Results Table & Mobile Cards */}
      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {isAr ? 'لا توجد نتائج مسجلة' : 'No results found'}
          </div>
        ) : (
          <>
            {/* Desktop Table with Sequential Numbers */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-muted-foreground border-b border-slate-200">
                  <tr>
                    <th className="text-center font-medium px-3 py-3 w-12">#</th>
                    <th className="text-start font-medium px-4 py-3">{isAr ? 'الطالب' : 'Student'}</th>
                    <th className="text-center font-medium px-4 py-3">{isAr ? 'الدرجة' : 'Score'}</th>
                    <th className="text-center font-medium px-4 py-3">%</th>
                    <th className="text-center font-medium px-4 py-3">{isAr ? 'أسئلة صحيحة' : 'Correct Questions'}</th>
                    <th className="text-center font-medium px-4 py-3">{isAr ? 'أسئلة خاطئة' : 'Wrong Questions'}</th>
                    <th className="text-start font-medium px-4 py-3 hidden md:table-cell">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-3 text-end font-medium">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r, index) => {
                    const pct = r.percentage || 0;
                    const isPdfLoading = downloadingId === r.id;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 text-center text-slate-500 font-medium tabular-nums">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{r.studentName}</td>
                        <td className="px-4 py-3 text-center text-slate-900 font-medium tabular-nums">{r.score}/100</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                            pct >= 75 ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600')}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-emerald-600 font-medium">{r.correctAnswers}/{r.totalQuestions}</td>
                        <td className="px-4 py-3 text-center text-red-500 font-medium">{r.wrongAnswers}/{r.totalQuestions}</td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{new Date(r.created_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDownloadPDF(r)}
                              disabled={isPdfLoading}
                              title={isAr ? 'تحميل تقرير PDF' : 'Download PDF Report'}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-50"
                            >
                              {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setViewTarget(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenEdit(r)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View with Sequential Numbers */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((r, index) => {
                const pct = r.percentage || 0;
                const isPdfLoading = downloadingId === r.id;
                return (
                  <div key={r.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                        <span className="font-semibold text-slate-900 text-sm">{r.studentName}</span>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold',
                        pct >= 75 ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600')}>
                        {pct}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div>
                        <div className="text-muted-foreground">{isAr ? 'الدرجة' : 'Score'}</div>
                        <div className="font-semibold text-slate-900">{r.score}/100</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{isAr ? 'صحيحة' : 'Correct'}</div>
                        <div className="font-semibold text-emerald-600">{r.correctAnswers}/{r.totalQuestions}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{isAr ? 'خاطئة' : 'Wrong'}</div>
                        <div className="font-semibold text-red-500">{r.wrongAnswers}/{r.totalQuestions}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">{new Date(r.created_date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadPDF(r)}
                          disabled={isPdfLoading}
                          className="p-1 rounded-md hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                        >
                          {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setViewTarget(r)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(r)} className="p-1 rounded-md hover:bg-amber-50 text-amber-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="p-1 rounded-md hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">{`عرض ${filtered.length} من أصل ${results.length} نتيجة`}</p>
      )}

      {/* Edit / Update Result Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl">
          <DialogHeader><DialogTitle>{isAr ? 'تحديث نتيجة الطالب' : 'Update Student Result'}</DialogTitle></DialogHeader>
          {editTarget && (
            <form onSubmit={handleUpdateConfirm} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>{isAr ? 'اسم الطالب' : 'Student Name'}</Label>
                <Input
                  value={editForm.studentName}
                  onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isAr ? 'الدرجة (من 100)' : 'Score (out of 100)'}</Label>
                  <Input
                    type="number"
                    value={editForm.score}
                    onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? 'الأسئلة الصحيحة' : 'Correct Answers'}</Label>
                  <Input
                    type="number"
                    value={editForm.correctAnswers}
                    onChange={(e) => setEditForm({ ...editForm, correctAnswers: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isAr ? 'إجمالي الأسئلة' : 'Total Questions'}</Label>
                <Input
                  type="number"
                  value={editForm.totalQuestions}
                  onChange={(e) => setEditForm({ ...editForm, totalQuestions: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 h-10 border rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl">
          <DialogHeader><DialogTitle>{isAr ? 'تفاصيل النتيجة' : 'Result Details'}</DialogTitle></DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <dl className="divide-y divide-slate-100">
                {[
                  [isAr ? 'اسم الطالب' : 'Student Name', viewTarget.studentName],
                  [isAr ? 'الدرجة الكلية' : 'Total Mark', `${viewTarget.score} / 100`],
                  [isAr ? 'النسبة المئوية' : 'Percentage', `${viewTarget.percentage}%`],
                  [isAr ? 'الأسئلة الصحيحة' : 'Correct Questions', `${viewTarget.correctAnswers} / ${viewTarget.totalQuestions}`],
                  [isAr ? 'الأسئلة الخاطئة' : 'Wrong Questions', `${viewTarget.wrongAnswers} / ${viewTarget.totalQuestions}`],
                  [isAr ? 'اسم الامتحان' : 'Exam Name', viewTarget.examName || 'Final Grammar Exam'],
                  [isAr ? 'التاريخ' : 'Date', new Date(viewTarget.created_date).toLocaleDateString()],
                  [isAr ? 'الوقت' : 'Time', new Date(viewTarget.created_date).toLocaleTimeString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 text-xs sm:text-sm">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium text-slate-900 text-start">{v ?? '—'}</dd>
                  </div>
                ))}
              </dl>

              <button
                onClick={() => handleDownloadPDF(viewTarget)}
                disabled={downloadingId === viewTarget.id}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {downloadingId === viewTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isAr ? 'تنزيل تقرير PDF' : 'Download PDF Report'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Single Result Confirmation Popup */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl p-4 sm:p-6">
          <AlertDialogHeader className="text-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-semibold text-slate-900">
                {isAr ? `حذف نتيجة ${deleteTarget?.studentName || ''}` : `Delete result for ${deleteTarget?.studentName || 'student'}`}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-600 pt-1">
              {isAr
                ? `هل أنت تأكيد من رغبتك في حذف نتيجة الطالب "${deleteTarget?.studentName}"؟ لا يمكنك التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete the result for "${deleteTarget?.studentName}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row gap-2 justify-end">
            <AlertDialogCancel disabled={deleting} className="h-9 text-xs sm:text-sm px-3 sm:px-4">
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
              disabled={deleting}
              className="h-9 text-xs sm:text-sm px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isAr ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Results Confirmation Popup */}
      <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <AlertDialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl p-4 sm:p-6">
          <AlertDialogHeader className="text-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <AlertDialogTitle className="text-base font-semibold text-slate-900">
                {isAr ? 'حذف جميع النتائج' : 'Delete All Results'}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs sm:text-sm text-slate-600 pt-1">
              {isAr
                ? 'هل أنت تأكيد تماماً من رغبتك في حذف جميع نتائج الطلاب المسجلة؟ سيؤدي هذا الإجراء إلى مسح كافة سجلات الامتحانات بشكل نهائي.'
                : 'Are you sure you want to delete ALL student exam results? This action will permanently remove all stored exam records and cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row gap-2 justify-end">
            <AlertDialogCancel disabled={deletingAll} className="h-9 text-xs sm:text-sm px-3 sm:px-4">
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAllConfirm(); }}
              disabled={deletingAll}
              className="h-9 text-xs sm:text-sm px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isAr ? 'نعم، احذف الجميع' : 'Yes, Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}