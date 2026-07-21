import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { useI18n } from '../../context/I18nContext';
import {
  LayoutDashboard, FileText, CreditCard,
  LogOut, Moon, Sun, Menu, X, ChevronRight,
  Wallet, Globe, Mail, MapPin, Building2, Phone, Fingerprint
} from 'lucide-react';

// ─── SACAMOS EL MODAL AFUERA PARA HACERLO 100% REACTIVO ───
const ProfileModal = ({ cliente, totalEmpresas, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white dark:bg-[#161920] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfil del Cliente</h3>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Información registrada</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Cabecera con Inicial */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl text-white font-bold shadow-lg shadow-indigo-500/20">
              {cliente.nombre?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Nombre Completo</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-slate-900 dark:text-white truncate">{cliente.nombre}</p>
              </div>
            </div>
          </div>

          {/* Listado de Datos */}
          <div className="grid gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                <Fingerprint size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Cédula de Identidad</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cliente.cedula || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Teléfono</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cliente.telefono || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Correo Electrónico</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cliente.email || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                <Building2 size={16} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Empresas Registradas</p>
                {/* Ahora detectará los cambios reactivos al instante */}
                {totalEmpresas > 0 && (
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {totalEmpresas} {totalEmpresas === 1 ? 'Empresa' : 'Empresas' || 'Ninguna'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Sistema Gestión de Cobranzas</p>
      </div>
    </div>
  </div>
);

export default function PortalNavbar({ onNotificar, totalEmpresas = 0 }) {
  const { cliente, logout }     = usePortalAuth();
  const { lang, toggleLang }    = useI18n();
  const navigate                = useNavigate();
  const location                = useLocation();
  const [dark, setDark]         = useState(() => localStorage.theme === 'dark');
  const [open, setOpen]         = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (to) =>
    to === '/portal'
      ? location.pathname === '/portal'
      : location.pathname.startsWith(to);

  const NAV_LINKS = [
    { to: '/portal',            label: 'Inicio',  icon: LayoutDashboard },
    { to: '/portal/pendientes', label: 'Deudas',  icon: FileText        },
    { to: '/portal/pagos',      label: 'Pagos',   icon: CreditCard      },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6
        bg-white/70 dark:bg-[#0d0f14]/80 backdrop-blur-xl
        border-b border-slate-200/60 dark:border-white/[0.06]">

        <Link to="/portal" className="flex items-center gap-2.5 select-none">
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

        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
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

          {cliente && (
            <>
              <button 
                onClick={() => setShowModal(true)}
                className="hidden sm:flex items-center gap-2 mx-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition group"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold group-hover:scale-110 transition-transform">
                  {cliente.nombre?.[0]?.toUpperCase() || 'C'}
                </div>
                <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {cliente.nombre?.split(' ')[0]}
                </span>
              </button>

              <button onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </>
          )}

          <button onClick={() => setOpen(o => !o)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Renderizado correcto del Modal pasando las variables necesarias como Props */}
      {showModal && cliente && (
        <ProfileModal 
          cliente={cliente} 
          totalEmpresas={totalEmpresas} 
          onClose={() => setShowModal(false)} 
        />
      )}

      {open && (
        <div className="md:hidden fixed inset-0 z-40 pt-14" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative w-64 h-full bg-white dark:bg-[#0d0f14] border-r border-slate-200 dark:border-white/[0.06] p-4 flex flex-col gap-1 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {cliente && (
              <div 
                onClick={() => { setShowModal(true); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm text-white font-bold group-hover:scale-105 transition-transform">
                  {cliente.nombre?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {cliente.nombre?.split(' ')[0]}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ver mi perfil</p>
                </div>
              </div>
            )}
            
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${isActive(to) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                <Icon size={16} />
                {label}
                {isActive(to) && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            ))}
            
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/[0.06] flex flex-col gap-1">
              <button onClick={toggleLang}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-slate-500 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition">
                <Globe size={16} /> {lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              </button>
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