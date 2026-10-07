import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, ListChecks, ClipboardList, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
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
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('dash.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('dash.desc')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ListChecks} label={t('dash.totalQ')} value={data.totalQuestions} tone="slate" />
        <StatCard icon={ListChecks} label={t('dash.activeQ')} value={data.activeQuestions} tone="emerald" />
        <StatCard icon={ClipboardList} label={t('dash.totalResults')} value={data.totalResults} tone="blue" />
        <StatCard icon={TrendingUp} label={t('dash.avg')} value={`${data.avg}%`} tone="amber" />
        <StatCard icon={ArrowUp} label={t('dash.high')} value={`${data.high}%`} tone="emerald" />
        <StatCard icon={ArrowDown} label={t('dash.low')} value={`${data.low}%`} tone="red" />
      </div>
    </div>
  );
}