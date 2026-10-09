import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, ListChecks, ClipboardList, Settings, LogOut, GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const nav = [
    { to: '/admin/dashboard', label: t('alayout.overview'), icon: LayoutDashboard },
    { to: '/admin/questions', label: t('alayout.questions'), icon: ListChecks },
    { to: '/admin/results', label: t('alayout.results'), icon: ClipboardList },
    { to: '/admin/settings', label: t('alayout.settings'), icon: Settings },
  ];

  const handleLogout = async () => {
    try { await base44.auth.logout(); } catch {}
    navigate('/admin/login', { replace: true });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex md:w-64 flex-col fixed inset-y-0 start-0 border-e border-slate-200 bg-white">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-200">
          <img 
            src="/noor.jpeg" 
            alt="Logo" 
            className="h-12 w-auto object-contain rounded-lg shrink-0" 
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">{t('alayout.brand')}</div>
            <div className="text-[11px] text-muted-foreground">{t('alayout.panel')}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="px-1 pb-2"><LangSwitch /></div>
          <Link to="/" className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-slate-900">
            <BackIcon className="w-3.5 h-3.5" /> {t('alayout.backSite')}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            <LogOut className="w-4 h-4" /> {t('alayout.logout')}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-30 flex items-center px-4">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center me-2">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">{t('alayout.mobileBrand')}</span>
        <div className="ms-auto flex items-center gap-2">
          <LangSwitch />
          <button onClick={handleLogout} className="p-2 text-slate-500"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <main className="flex-1 md:ms-64 pt-14 md:pt-0">
        <div className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 bg-white border-b border-slate-200 sticky top-14 z-20">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                )
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}