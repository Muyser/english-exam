import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock, Loader2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read environment variable with local fallback
  const API_URL = import.meta.env.VITE_API_URL || 'https://english-grammer-exam.onrender.com';

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('alogin.errInvalid'));
      }

      // Save token and user details under keys expected by AdminRoute / base44
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('token', data.token); // Common fallback key
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      // Navigate replacing history to prevent back-button loops
      navigate('/admin/dashboard', { replace: true });

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check if your backend server is running.');
      } else {
        setError(err.message || t('alogin.errInvalid'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="max-w-md w-full mx-auto px-5 pt-10 flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5">
          <BackIcon className="w-4 h-4" /> {t('alogin.backSite')}
        </Link>
        <LangSwitch variant="dark" />
      </div>
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4 p-2">
              <img 
                src="/noor.jpeg" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-xl" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('alogin.title')}</h1>
            <p className="text-sm text-slate-400 mt-1">{t('alogin.subtitle')}</p>
          </div>

          <Card className="p-6 md:p-8 bg-slate-900 border-slate-800">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">{t('alogin.email')}</Label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email" type="email" autoFocus required
                    placeholder="admin@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="ps-10 h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t('alogin.password')}</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password" type="password" required
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="ps-10 h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-medium">
                {loading ? <><Loader2 className="w-4 h-4 me-2 animate-spin" /> {t('alogin.signingIn')}</> : <><ShieldCheck className="w-4 h-4 me-2" /> {t('alogin.signIn')}</>}
              </Button>
            </form>
          </Card>
          <p className="text-center text-xs text-slate-500 mt-6">
            {t('alogin.note')}
          </p>
        </div>
      </div>
    </div>
  );
}