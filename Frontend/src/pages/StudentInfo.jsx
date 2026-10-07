import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, User, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

export default function StudentInfo() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const StartIcon = isRTL ? ArrowLeft : ArrowRight;
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError(t('student.errName'));
      return;
    }

    sessionStorage.setItem('npa_student', JSON.stringify({ name: n }));
    navigate('/exam');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="./noor.jpeg" 
              alt="Logo" 
              className="h-12 w-auto object-contain rounded-xl shrink-0" 
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-900">{t('common.brand')}</div>
              <div className="text-[11px] text-muted-foreground">{t('common.examSubtitle')}</div>
            </div>
          </div>
          <LangSwitch />
          </div>
        </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-slate-900 flex items-center gap-1.5 mb-6">
            <BackIcon className="w-4 h-4" /> {t('common.back')}
          </button>

          <Card className="p-6 md:p-8 border-slate-200 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">{t('student.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('student.desc')}</p>

            {error && (
              <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">{t('student.name')} <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name" autoFocus placeholder={t('student.namePh')}
                    value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
                    className="ps-10 h-11"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-12 text-base font-medium">
                {t('student.start')} <StartIcon className="w-4 h-4 ms-1.5" />
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}