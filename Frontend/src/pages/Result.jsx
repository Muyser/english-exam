import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GraduationCap, CheckCircle2, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

export default function Result() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const submitted = sessionStorage.getItem('npa_submitted');
    if (!submitted) { navigate('/', { replace: true }); return; }
    sessionStorage.removeItem('npa_submitted');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-900">{t('common.brand')}</div>
              <div className="text-[11px] text-muted-foreground">{t('common.examSubtitle')}</div>
            </div>
          </div>
          <LangSwitch />
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-16">
        <Card className="p-8 text-center border-slate-200 shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t('result.successTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t('result.successDesc')}
          </p>
          <Button onClick={() => navigate('/')} className="mt-7 h-11 w-full sm:w-auto px-8">
            <Home className="w-4 h-4 me-1.5" /> {t('common.backHome')}
          </Button>
        </Card>
      </main>
    </div>
  );
}