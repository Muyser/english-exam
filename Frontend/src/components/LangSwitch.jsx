import { useI18n } from '@/lib/i18n';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LangSwitch({ className, variant = 'light' }) {
  const { lang, setLang } = useI18n();
  const next = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        variant === 'dark'
          ? 'bg-white/10 text-slate-200 hover:bg-white/20'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        className
      )}
      title={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Languages className="w-3.5 h-3.5" />
      {next === 'en' ? 'EN' : 'ع'}
    </button>
  );
}