import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { Building2, Eye, EyeOff, ArrowRight, User, KeyRound, ShieldCheck } from 'lucide-react';
import PublicNavbar from '../../components/shared/PublicNavbar';

export default function PortalLoginPage() {
  const { login }   = usePortalAuth();
  const navigate    = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/portal'); }
    catch (err) { setError(err.response?.data?.error || 'Credenciales incorrectas'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <PublicNavbar />

      <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-20 mt-16">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">

          {/* Panel izquierdo indigo */}
          <div className="md:w-5/12 bg-indigo-600 dark:bg-indigo-700 p-8 md:p-12 text-center md:text-left flex flex-col justify-center items-center md:items-start text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid2)" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md mb-6">
                <Building2 size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                Portal del <br className="hidden md:block" />Cliente
              </h2>
              <p className="text-indigo-100 text-sm mt-4 leading-relaxed">
                Consulta tu deuda, visualiza tus facturas y notifica tus pagos desde cualquier dispositivo, en cualquier momento.
              </p>
              <div className="hidden md:flex flex-col gap-3 mt-8">
                <div className="flex items-center gap-3 text-xs text-indigo-200">
                  <ShieldCheck size={16} /> Consulta tu estado de cuenta en tiempo real
                </div>
                <div className="flex items-center gap-3 text-xs text-indigo-200">
                  <ShieldCheck size={16} /> Notifica pagos adjuntando tu comprobante
                </div>
                <div className="flex items-center gap-3 text-xs text-indigo-200">
                  <ShieldCheck size={16} /> Revisa tu historial completo de pagos
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho — formulario */}
          <div className="md:w-7/12 p-8 md:p-12">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ingresa tus datos de acceso al portal</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <input type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="tucorreo@email.com"
                    className="block w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition outline-none placeholder:text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound size={18} className="text-slate-400" />
                  </div>
                  <input type={show ? 'text' : 'password'} required value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition outline-none placeholder:text-slate-400" />
                  <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition duration-200 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group disabled:opacity-60">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><span>Ingresar al Portal</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                }
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ¿Personal administrativo?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Ir al panel de gestión
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-white font-bold mb-1">Multiservicios AVOBLANHER C.A.</p>
            <p className="text-sm">dev.franco2005@gmail.com · +58 412 250 99 21</p>
          </div>
          <p className="text-xs italic">© 2026 AVOBLANHER C.A.</p>
        </div>
      </footer>
    </div>
  );
}