import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { 
  UserPlus, Eye, EyeOff, Mail, 
  KeyRound, User, CheckCircle2, Lock, Home, Globe, Moon, Sun,
  ArrowLeft
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  
  // Lógica de Modo Oscuro[cite: 5]
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [dark]);

  const [form, setForm] = useState({ 
    nombre: '', apellido: '', email: '', 
    cedula: '', telefono: '', password: '', confirmPassword: '' 
  });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [done, setDone]         = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');

    // Validaciones con traducciones[cite: 4]
    if (form.password !== form.confirmPassword) { 
      setError(t('reg_error_match')); 
      return; 
    }
    if (form.password.length < 6) { 
      setError(t('reg_error_short')); 
      return; 
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register/cliente', {
        nombre:   `${form.nombre.trim()} ${form.apellido.trim()}`,
        email:    form.email.trim().toLowerCase(),
        cedula:   form.cedula.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
      });
      setDone(true);
      setTimeout(async () => {
        const data = await login(form.email.trim().toLowerCase(), form.password);
        navigate(data.redirectTo || '/portal', { replace: true });
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.error || t('error_generic'));
    } finally { setLoading(false); }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const labelCls = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

  if (done) return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <p className="font-bold text-slate-900 dark:text-white text-lg">{t('reg_success')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('reg_redirect')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] flex">
      {/* ── PANEL IZQUIERDO — Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-12 bg-indigo-600 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-40" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500 rounded-full blur-3xl opacity-30" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-white dark:bg-transparent overflow-hidden flex items-center justify-center shrink-0 transition-colors">
                <img 
                  src="/images/logo1.jpg" 
                  alt="Logo Promotora Los Teques C.A" 
                  className="h-12 w-auto object-contain rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 dark:border-white/10 dark:invert dark:hue-rotate-180"
                />
              </div>
            <span className="text-white font-bold tracking-wide text-sm">Promotora Los Teques C.A.</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
            {t('reg_title_p1')}<br/>{t('reg_title_p2')}<br/><span className="text-indigo-200">{t('reg_title_p3')}</span>
          </h2>
          <p className="text-indigo-200 text-[15px] leading-relaxed max-w-xs">
            {t('reg_subtitle')}
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[t('reg_feat1'), t('reg_feat2'), t('reg_feat3'), t('reg_feat4')].map(f => (
            <div key={f} className="flex items-center gap-3 text-[13px] text-indigo-200">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── PANEL DERECHO — Formulario ── */}
      <div className="flex-1 flex flex-col">
        {/* Barra superior */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Lock size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Promotora Los Teques C.A.</span>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <Link to="/" 
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition">
              <Home size={12} /> {t('home')}
            </Link>

            {/* Botón Modo Oscuro Gris[cite: 5] */}
            <button onClick={() => setDark(!dark)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
                          {dark ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
      
            {/* Botón de Idioma[cite: 4, 5] */}
            <button onClick={toggleLang}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition">
              <Globe size={12} /> {lang === 'es' ? '🇺🇸 EN' : '🇻🇪 ES'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={14} className="text-indigo-500" />
                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">{t('reg_badge')}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('reg_create_acc')}</h2>
              <p className="text-sm text-slate-400 mt-1">{t('reg_fill_data')}</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('reg_first_name')}</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required value={form.nombre} onChange={set('nombre')} placeholder="Juan"
                      className={inputCls.replace('px-4', 'pl-10 pr-4')} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('reg_last_name')}</label>
                  <input required value={form.apellido} onChange={set('apellido')} placeholder="Pérez" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('reg_email')}</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="email@example.com"
                    className={inputCls.replace('px-4', 'pl-10 pr-4')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('reg_id_card')}</label>
                  <input required value={form.cedula} onChange={set('cedula')} placeholder="V-12345678" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('reg_phone')}</label>
                  <input value={form.telefono} onChange={set('telefono')} placeholder="+58 412..." className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('reg_password')}</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={form.password} onChange={set('password')} placeholder="••••••"
                    className={inputCls.replace('px-4', 'pl-10 pr-11')} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition">
                    {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('reg_confirm_pass')}</label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showConf ? 'text' : 'password'} required minLength={6} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••"
                    className={inputCls.replace('px-4', 'pl-10 pr-11')} />
                  <button type="button" onClick={() => setShowConf(s => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition">
                    {showConf ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
  {/* Botón "Ya tengo cuenta" a la izquierda con flecha */}
  <Link to="/login"
    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition">
    <ArrowLeft size={15} /> 
    <span>{t('reg_have_acc1')}</span>
  </Link>

  {/* Botón "Crear cuenta" a la derecha */}
  <button type="submit" disabled={loading}
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition shadow-lg shadow-indigo-500/20 disabled:opacity-60">
    {loading
      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
      : <><UserPlus size={15}/> {t('reg_btn')}</>
    }
  </button>
</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}