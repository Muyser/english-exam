import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, Search, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const EMPTY = {
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctAnswer: 'A', points: 2, order: 1, status: 'active', part: '',
};

export default function AdminQuestions() {
  const { t } = useI18n();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://english-grammer-exam.onrender.com';

  // Helper function to send authenticated requests
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

  const load = async () => {
    setLoading(true);
    try {
      const data = await authFetch('/api/questions');
      // Normalize MongoDB _id to id
      const normalized = (data || []).map((q) => ({
        ...q,
        id: q._id || q.id,
      }));
      setQuestions(normalized.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (e) {
      toast({ title: t('q.tLoadFail'), description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (search) {
        const txt = (q.questionText || '').toLowerCase();
        if (!txt.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [questions, search, statusFilter]);

  const openAdd = () => {
    const nextOrder = questions.length ? Math.max(...questions.map((q) => q.order || 0)) + 1 : 1;
    setEditing({ ...EMPTY, order: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (q) => {
    setEditing({ ...q });
    setDialogOpen(true);
  };

  const setField = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const save = async () => {
    if (!editing.questionText.trim() || !editing.optionA.trim() || !editing.optionB.trim() || !editing.optionC.trim() || !editing.optionD.trim()) {
      toast({ title: t('q.tFillAll'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        questionText: editing.questionText.trim(),
        optionA: editing.optionA.trim(),
        optionB: editing.optionB.trim(),
        optionC: editing.optionC.trim(),
        optionD: editing.optionD.trim(),
        correctAnswer: editing.correctAnswer,
        points: Number(editing.points) || 2,
        order: Number(editing.order) || 1,
        status: editing.status,
        part: editing.part || '',
      };

      if (editing.id) {
        await authFetch(`/api/questions/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast({ title: t('q.tUpdated') });
      } else {
        await authFetch('/api/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast({ title: t('q.tAdded') });
      }
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: t('q.tSaveFail'), description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (q) => {
    try {
      const newStatus = q.status === 'active' ? 'inactive' : 'active';
      await authFetch(`/api/questions/${q.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
      toast({ title: newStatus === 'inactive' ? t('q.tMarkedInactive') : t('q.tMarkedActive') });
    } catch (e) {
      toast({ title: t('q.tStatusFail'), description: e.message, variant: 'destructive' });
    }
  };

  const move = async (q, dir) => {
    const idx = questions.findIndex((x) => x.id === q.id);
    const swapWith = questions[idx + dir];
    if (!swapWith) return;
    try {
      await authFetch('/api/questions/bulk', {
        method: 'PATCH',
        body: JSON.stringify([
          { id: q.id, order: swapWith.order },
          { id: swapWith.id, order: q.order },
        ]),
      });
      await load();
    } catch (e) {
      toast({ title: t('q.tReorderFail'), description: e.message, variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authFetch(`/api/questions/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      toast({ title: t('q.tDeleted') });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast({ title: t('q.tDelFail'), description: e.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('q.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('q.desc')}</p>
        </div>
        <Button onClick={openAdd} className="h-10"><Plus className="w-4 h-4 me-1.5" /> {t('q.add')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('q.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('q.statusAll')}</SelectItem>
            <SelectItem value="active">{t('q.statusActive')}</SelectItem>
            <SelectItem value="inactive">{t('q.statusInactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {t('q.empty')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((q, i) => (
              <div key={q.id} className="p-4 flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                  {String(q.order || (i + 1)).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">{q.questionText}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium',
                      q.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {q.status === 'active' ? t('q.badgeActive') : t('q.badgeInactive')}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{t('q.correct')} <strong className="text-slate-700">{q.correctAnswer}</strong></span>
                    <span className="text-[11px] text-muted-foreground">{q.points} {t('q.pts')}</span>
                    {q.part && <span className="text-[11px] text-muted-foreground hidden sm:inline">{q.part}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(q, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => move(q, 1)} disabled={i === filtered.length - 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => setViewTarget(q)} className="p-1.5 rounded hover:bg-slate-100"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => toggleStatus(q)} className={cn('text-[11px] px-2 py-1 rounded font-medium',
                    q.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50')}>
                    {q.status === 'active' ? t('q.deactivate') : t('q.activate')}
                  </button>
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(q)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t('q.editTitle') : t('q.addTitle')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t('q.fQuestion')}</Label>
                <Textarea rows={3} value={editing.questionText} onChange={(e) => setField('questionText', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <div key={letter} className="space-y-2">
                    <Label>{t('q.fOption', { x: letter })}</Label>
                    <Input value={editing[`option${letter}`]} onChange={(e) => setField(`option${letter}`, e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('q.fCorrect')}</Label>
                  <Select value={editing.correctAnswer} onValueChange={(v) => setField('correctAnswer', v)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('q.fPoints')}</Label>
                  <Input type="number" value={editing.points} onChange={(e) => setField('points', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('q.fOrder')}</Label>
                  <Input type="number" value={editing.order} onChange={(e) => setField('order', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('q.fStatus')}</Label>
                  <Select value={editing.status} onValueChange={(v) => setField('status', v)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('q.statusActive')}</SelectItem>
                      <SelectItem value="inactive">{t('q.statusInactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('q.fPart')}</Label>
                <Input value={editing.part} onChange={(e) => setField('part', e.target.value)} placeholder={t('q.fPartPh')} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>{t('common.cancel')}</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : null}
              {t('q.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('q.preview')}</DialogTitle></DialogHeader>
          {viewTarget && (
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-slate-900">{viewTarget.questionText}</p>
              {['A', 'B', 'C', 'D'].map((letter) => (
                <div key={letter} className={cn('flex items-center gap-2 p-2.5 rounded-lg border text-sm',
                  viewTarget.correctAnswer === letter ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200')}>
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold flex items-center justify-center">{letter}</span>
                  <span className="text-slate-700">{viewTarget[`option${letter}`]}</span>
                  {viewTarget.correctAnswer === letter && <span className="ms-auto text-xs text-emerald-600 font-medium">{t('q.correctTag')}</span>}
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-1">{t('q.previewMeta', { o: viewTarget.order, p: viewTarget.points, s: viewTarget.status === 'active' ? t('q.statusActive') : t('q.statusInactive') })}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('q.delTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('q.delDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDelete(); }} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 me-1.5" />} {t('q.del')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}