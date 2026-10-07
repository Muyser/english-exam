import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, Settings as SettingsIcon, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const DEFAULTS = {
  examTitle: 'Final Grammar Exam',
  examDescription: 'English Grammar Assessment — Intensive Grammar Course',
  timeLimit: 45,
  numberOfQuestions: 50,
  pointsPerQuestion: 2,
  instructions: 'Read each question carefully and choose the best answer. You have 45 minutes for 50 questions.',
};

export default function AdminSettings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Change Password State
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await authFetch('/api/settings');
        setSettings({ ...DEFAULTS, ...data });
      } catch (e) {
        toast({ title: t('s.tLoadFail'), description: e.message, variant: 'destructive' });
        setSettings({ ...DEFAULTS });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        examTitle: settings.examTitle,
        examDescription: settings.examDescription,
        timeLimit: Number(settings.timeLimit) || 45,
        numberOfQuestions: Number(settings.numberOfQuestions) || 50,
        pointsPerQuestion: Number(settings.pointsPerQuestion) || 2,
        instructions: settings.instructions,
      };

      const updated = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSettings({ ...DEFAULTS, ...updated });
      toast({ title: t('s.tSaved') });
    } catch (e) {
      toast({ title: t('s.tSaveFail'), description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast({ title: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: 'New passwords do not match', variant: 'destructive' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({ title: 'New password must be at least 6 characters long', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    try {
      await authFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        }),
      });

      toast({ title: 'Password updated successfully!' });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast({ title: 'Password update failed', description: e.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('s.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('s.desc')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Section: General Exam Settings */}
        <Card className="lg:col-span-2 p-6 md:p-8 border-slate-200">
          <div className="flex items-center gap-2 mb-5">
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{t('s.general')}</h2>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t('s.fTitle')}</Label>
              <Input value={settings.examTitle} onChange={(e) => setField('examTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('s.fDesc')}</Label>
              <Input value={settings.examDescription} onChange={(e) => setField('examDescription', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('s.fTime')}</Label>
                <Input type="number" value={settings.timeLimit} onChange={(e) => setField('timeLimit', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('s.fNum')}</Label>
                <Input type="number" value={settings.numberOfQuestions} onChange={(e) => setField('numberOfQuestions', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('s.fPoints')}</Label>
                <Input type="number" value={settings.pointsPerQuestion} onChange={(e) => setField('pointsPerQuestion', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('s.fInstr')}</Label>
              <Textarea rows={4} value={settings.instructions} onChange={(e) => setField('instructions', e.target.value)} />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={saveSettings} disabled={saving} className="h-11">
              {saving ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <Save className="w-4 h-4 me-1.5" />}
              {t('s.save')}
            </Button>
          </div>
        </Card>

        {/* Right Section: Security / Change Password */}
        <div>
          <Card className="p-6 border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Security</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Old Password</Label>
                <Input
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={changingPassword} className="w-full h-10 mt-2">
                {changingPassword ? <Loader2 className="w-4 h-4 me-1.5 animate-spin" /> : <Lock className="w-4 h-4 me-1.5" />}
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}