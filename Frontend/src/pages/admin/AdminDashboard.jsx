import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, ListChecks, ClipboardList, TrendingUp, ArrowUp, ArrowDown, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <Card className="p-5 border-slate-200">
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', tones[tone])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'https://english-grammer-exam.onrender.com';

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/questions/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const statsData = await response.json();
        setData(statsData);
      } catch (e) {
        console.error('Error loading dashboard stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">{t('dash.loadFail')}</p>;

  // Safely check passed / failed values from statsData or fallback calculations
  const passedStudents = data.passedCount !== undefined ? data.passedCount : (data.passed || 0);
  const failedStudents = data.failedCount !== undefined ? data.failedCount : (data.failed || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('dash.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('dash.desc')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListChecks} label={t('dash.totalQ')} value={data.totalQuestions || 0} tone="slate" />
        <StatCard icon={ListChecks} label={t('dash.activeQ')} value={data.activeQuestions || 0} tone="emerald" />
        <StatCard icon={ClipboardList} label={t('dash.totalResults')} value={data.totalResults || 0} tone="blue" />
        <StatCard icon={TrendingUp} label={t('dash.avg')} value={`${data.avg || 0}%`} tone="amber" />
        <StatCard icon={CheckCircle2} label={isAr ? 'الناجحين' : 'Passed Students'} value={passedStudents} tone="emerald" />
        <StatCard icon={XCircle} label={isAr ? 'الراسبين' : 'Failed Students'} value={failedStudents} tone="red" />
        <StatCard icon={ArrowUp} label={t('dash.high')} value={`${data.high || 0}%`} tone="emerald" />
        <StatCard icon={ArrowDown} label={t('dash.low')} value={`${data.low || 0}%`} tone="red" />
      </div>
    </div>
  );
}