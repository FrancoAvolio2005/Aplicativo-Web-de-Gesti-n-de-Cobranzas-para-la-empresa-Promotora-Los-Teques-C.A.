import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  LayoutDashboard, Users, FileText, CreditCard, Brain,
  Bot, LogOut, Moon, Sun, Menu, X, ChevronRight,
  Wallet, Globe
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  const NAV_LINKS = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard, roles: ['admin','supervisor','operador'] },
    { to: '/clients',   label: t('nav_clients'),   icon: Users,            roles: ['admin','supervisor','operador'] },
    { to: '/invoices',  label: t('nav_invoices'),  icon: FileText,         roles: ['admin','supervisor','operador'] },
    { to: '/payments',  label: t('nav_payments'),  icon: CreditCard,       roles: ['admin','supervisor','operador'] },
    { to: '/risk',      label: t('nav_risk'),       icon: Brain,            roles: ['admin','supervisor','operador'] },
    { to: '/bot',       label: t('nav_bot'),        icon: Bot,              roles: ['admin'] },
  ];

  const links = NAV_LINKS.filter(l => user && l.roles.includes(user.rol));

  return (
    <>
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6
        bg-white/70 dark:bg-[#0d0f14]/80 backdrop-blur-xl
        border-b border-slate-200/60 dark:border-white/[0.06]">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-lg bg-white dark:bg-transparent overflow-hidden flex items-center justify-center shrink-0 transition-colors">
                <img 
                  src="/images/logo1.jpg" 
                  alt="Logo Promotora Los Teques C.A" 
                  className="h-12 w-auto object-contain rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 dark:border-white/10 dark:invert dark:hue-rotate-180"
                />
              </div>
          <span className="font-bold text-[13px] tracking-wide text-slate-900 dark:text-white hidden sm:block">
            Promotora Los Teques C.A.
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150
                ${isActive(to)
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}>
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <button onClick={toggleLang}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold
              text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            <Globe size={12} />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          <button onClick={() => setDark(d => !d)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-white/5 transition">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 mx-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {user.nombre?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
                  {user.nombre?.split(' ')[0]}
                </span>
              </div>
              <button onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setOpen(o => !o)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 pt-14" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-64 h-full bg-white dark:bg-[#0d0f14] border-r border-slate-200 dark:border-white/[0.06] p-4 flex flex-col gap-1"
            onClick={e => e.stopPropagation()}>
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${isActive(to)
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                    : 'text-slate-600 dark:text-slate-400'
                  }`}>
                <Icon size={16} />
                {label}
                {isActive(to) && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            ))}
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/[0.06]">
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-rose-500 font-medium rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
