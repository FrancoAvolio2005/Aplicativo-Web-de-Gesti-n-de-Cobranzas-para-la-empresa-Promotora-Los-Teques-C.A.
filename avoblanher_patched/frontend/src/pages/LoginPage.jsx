import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import api from '../api/axios';
import {
  Eye, EyeOff, ArrowRight, Mail, KeyRound,
  RefreshCw, CheckCircle2, Globe, UserPlus, Lock, Home, Moon, Sun
} from 'lucide-react';

function ForgotPasswordModal({ onClose, t }) {
  const STEPS = { EMAIL: 'email', CODE: 'code', NEW_PASS: 'new_pass', DONE: 'done' };
  const [step, setStep]         = useState(STEPS.EMAIL);
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    setTimeLeft(300); setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; } return prev - 1; });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);
  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const sendCode = async (e) => {
    e?.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setStep(STEPS.CODE);
      startTimer();
    } catch (err) {
      // Cambio #10: mostrar mensaje si el correo no está registrado
      setError(err.response?.data?.error || 'Error al enviar el código');
    }
    finally { setLoading(false); }
  };
  const verifyCode = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { setError(t('forgot_code_invalid')); return; }
    setError(''); setLoading(true);
    try { await api.post('/api/auth/verify-reset-code', { email, code }); setStep(STEPS.NEW_PASS); }
    catch (err) { setError(err.response?.data?.error || t('forgot_code_invalid')); }
    finally { setLoading(false); }
  };
  const changePassword = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (newPass !== confirmPass) { setError(t('forgot_pass_mismatch')); setLoading(false); return; }
    try { await api.post('/api/auth/reset-password', { email, code, newPassword: newPass }); setStep(STEPS.DONE); }
    catch (err) { setError(err.response?.data?.error || t('error_generic')); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#13161e] w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('forgot_title')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-lg leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">{error}</div>}
          {step === STEPS.EMAIL && (
            <form onSubmit={sendCode} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('forgot_desc')}</p>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : t('forgot_send_code')}
              </button>
            </form>
          )}
          {step === STEPS.CODE && (
            <form onSubmit={verifyCode} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('forgot_code_label')} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span></p>
              <input type="text" maxLength={6} inputMode="numeric" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))} placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-[14px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              {!canResend
                ? <p className="text-xs text-center text-slate-400">{t('forgot_timer')}: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{fmtTime(timeLeft)}</span></p>
                : <button type="button" onClick={sendCode} className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 font-semibold hover:underline"><RefreshCw size={13}/> {t('forgot_resend')}</button>
              }
              <button type="submit" disabled={code.length !== 6 || loading}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"/> : t('save')}
              </button>
            </form>
          )}
          {step === STEPS.NEW_PASS && (
            <form onSubmit={changePassword} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('reg_error_short')}</p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('forgot_new_pass')}</label>
                <input type="password" required minLength={6} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('forgot_confirm_pass')}</label>
                <input type="password" required minLength={6} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm disabled:opacity-60">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"/> : t('forgot_change_btn')}
              </button>
            </form>
          )}
          {step === STEPS.DONE && (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 size={44} className="text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{t('forgot_success')}</p>
              <button onClick={onClose} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">{t('reg_have_acc')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const { t, lang, toggleLang } = useI18n();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const pendingRedirect = useRef(null);
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

  useEffect(() => {
    if (!authLoading && user) navigate(user.rol === 'cliente' ? '/portal' : '/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (pendingRedirect.current && user) {
      const dest = pendingRedirect.current; pendingRedirect.current = null; navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      pendingRedirect.current = data.redirectTo || '/dashboard';
    } catch (err) { setError(err.response?.data?.error || t('error_generic')); }
    finally { setLoading(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0c10]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between p-12 bg-indigo-600 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
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
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
            {lang === 'es' ? <>Gestión de<br/>Cobranzas<br/><span className="text-indigo-200">Profesional</span></> : <>Professional<br/>Debt<br/><span className="text-indigo-200">Management</span></>}
          </h1>
          <p className="text-indigo-200 text-[15px] leading-relaxed max-w-xs">
            {lang === 'es' ? 'Plataforma integral para administrar facturas, pagos y clientes con inteligencia artificial.' : 'Comprehensive platform to manage invoices, payments, and clients with artificial intelligence.'}
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {(lang === 'es' 
            ? ['Cifrado SSL · JWT doble token','Control de acceso por roles (RBAC)','Tasa BCV sincronizada automáticamente','Notificaciones automáticas por Gmail']
            : ['SSL Encryption · Double JWT token', 'Role-Based Access Control (RBAC)', 'BCV Rate automatically synced', 'Automatic Gmail notifications']
          ).map(f => (
            <div key={f} className="flex items-center gap-3 text-[13px] text-indigo-200">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Lock size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Promotora Los Teques C.A.</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition">
              <Home size={12} /> {t('home')}
            </Link>
            <button onClick={() => setDark(!dark)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition">
              <Globe size={12} /> {lang === 'es' ? '🇺🇸 EN' : '🇻🇪 ES'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1.5">{t('login_title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('login_subtitle')}</p>
            </div>
            {error && <div className="mb-5 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('login_email')}</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@avoblanher.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{t('login_password')}</label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{t('login_forgot')}</button>
                </div>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition">{show ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group disabled:opacity-60">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><span>{t('login_btn')}</span><ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/></>}
                </button>
                <Link to="/registro" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition">
                  <UserPlus size={15}/><span className="hidden sm:inline">{t('reg_have_acc')}</span>
                </Link>
              </div>
            </form>
            <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">{t('login_detecting')}</p>
          </div>
        </div>
        <div className="px-8 py-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <p className="text-[11px] text-slate-400">© 2026 Promotora Los Teques C.A.</p>
          <p className="text-[11px] text-slate-400"></p>
        </div>
      </div>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} t={t} />}
    </div>
  );
}