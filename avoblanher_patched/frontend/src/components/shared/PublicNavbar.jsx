import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wallet, Moon, Sun, Globe } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function PublicNavbar() {
  const [dark, setDark]   = useState(() => localStorage.theme === 'dark');
  const location          = useLocation();
  const isLanding         = location.pathname === '/';
  const { t, lang, toggleLang } = useI18n();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-10
      bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.06] transition-colors">

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Wallet size={15} className="text-white" />
        </div>
        <Link to="/" className="font-bold text-[13px] tracking-wide text-slate-900 dark:text-white transition-colors">
          Promotora Los Teques C.A.
        </Link>
      </div>

      {/* Links — solo en la landing */}
      <div className="hidden md:flex items-center gap-1">
        {isLanding ? (
          <>
            <a href="#inicio"    className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">{t('home')}</a>
            <a href="#nosotros"  className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">Nosotros</a>
            <a href="#servicios" className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">Funciones</a>
          </>
        ) : (
          <>
            <Link to="/"           className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">{t('home')}</Link>
            <Link to="/#nosotros"  className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">Nosotros</Link>
            <Link to="/#servicios" className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition">Funciones</Link>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button onClick={() => setDark(d => !d)}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition">
          <Globe size={13} />
          {lang === 'es' ? '🇺🇸 EN' : '🇻🇪 ES'}
        </button>
        <Link to="/login"
          className="px-5 py-1.5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
          {t('home_login')}
        </Link>
      </div>
    </nav>
  );
}
