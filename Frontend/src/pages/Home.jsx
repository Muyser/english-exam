import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, Clock, ListChecks, Award, ChevronLeft, ChevronRight, ShieldCheck, BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const StartIcon = isRTL ? ChevronLeft : ChevronRight;

  const stats = [
    { icon: ListChecks, label: t('home.statTotalQ'), value: '50' },
    { icon: Award, label: t('home.statTotalMarks'), value: '100' },
    { icon: BookOpen, label: t('home.statMarksPer'), value: '2' },
    { icon: Clock, label: t('home.statTime'), value: t('home.statTimeValue') },
  ];

  const instructions = [1, 2, 3, 4, 5].map((i) => t(`home.instr${i}`));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-900">{t('common.brand')}</div>
              <div className="text-[11px] text-muted-foreground">{t('home.assessment')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <Link to="/admin/login" className="text-xs font-medium text-muted-foreground hover:text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('home.admin')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 md:py-16">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
            <BookOpen className="w-3.5 h-3.5" /> {t('home.badge')}
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
            {t('home.title')}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t('home.desc')}
          </p>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border-b border-slate-100">
            {stats.map((s) => (
              <div key={s.label} className="p-5 md:p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-slate-700" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">{t('home.instructionsTitle')}</h2>
            <ul className="space-y-3">
              {instructions.map((txt, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base font-medium"
                onClick={() => navigate('/student-info')}
              >
                {t('home.start')} <StartIcon className="w-4 h-4 ms-1" />
              </Button>
              <span className="text-xs text-muted-foreground">{t('home.noAccount')}</span>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {t('home.footer', { year: new Date().getFullYear() })}
        </p>
      </main>
    </div>
  );
}