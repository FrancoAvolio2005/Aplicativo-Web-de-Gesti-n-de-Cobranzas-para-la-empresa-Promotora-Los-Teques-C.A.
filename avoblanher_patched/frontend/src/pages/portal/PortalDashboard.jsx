import React, { useEffect, useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import { portalApi } from '../../api/axios';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { useI18n } from '../../context/I18nContext';
import StatusBadge from '../../components/shared/StatusBadge';
import AppFooter from '../../components/shared/AppFooter';
import PortalNavbar from '../../components/shared/PortalNavbar';

// Importaciones de Recharts para la analítica visual
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend 
} from 'recharts';

import {
  DollarSign, CheckCircle, Clock,
  Building2, Upload, Download, Activity, ArrowUpRight, X,
  FileText, CreditCard, AlertCircle, TrendingUp, Calendar,
  ChevronRight, Wallet, Image as ImageIcon, ShieldAlert, ArrowRight, ArrowDownLeft, BarChart3,
  MessageSquare, Send, Bot, User, Sparkles, Minimize2, HelpCircle, CheckCircle2
} from 'lucide-react';

// Helper para convertir la imagen local en public/images/ a formato Base64 para jsPDF (Opción 2)
const obtenerBase64DesdePublic = async (url) => {
  const respuesta = await fetch(url);
  const blob = await respuesta.blob();
  return new Promise((resolve) => {
    const lector = new FileReader();
    lector.onloadend = () => resolve(lector.result);
    lector.readAsDataURL(blob);
  });
};

// ─── COMPONENTE CHATBOT FLOTANTE BILINGÜE AMPLIADO (ES / EN) ─────────────────────
function PortalChatbot({ account, cliente, onOpenNotificar, lang = 'es' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang); // 'es' | 'en'

  // Diccionario de traducciones ampliadas
  const t = {
    es: {
      title: 'Asistente Virtual',
      status: 'En línea',
      welcome: `¡Hola ${cliente?.nombre || ''}! 👋 Soy tu asistente virtual de AVOBLANHER. ¿En qué puedo ayudarte hoy?`,
      selectQuery: 'Selecciona una consulta:',
      footerText: 'Selecciona una pregunta para ver la respuesta.',
      btnReport: 'Reportar Pago Ahora',
      // Preguntas
      q1: '💰 ¿Cuál es mi saldo pendiente?',
      q2: '💳 Quiero reportar un pago',
      q3: '📈 ¿Cuál es la tasa BCV del día?',
      q4: '🏦 ¿Qué métodos de pago aceptan?',
      q5: '⏱️ ¿Cuánto tarda en validarse un pago?',
      q6: '📄 ¿Dónde puedo ver mis facturas?',
      q7: '🗓️ ¿Cuándo vence mi servicio o factura?',
      q8: '🎧 Soporte y atención técnica',
      // Respuestas
      r1: (ves, usd, num) => `Tu saldo adeudado actual es de Bs. ${ves} (Equivalente a $${usd} USD). Tienes ${num} factura(s) activa(s).`,
      r2: `Puedes reportar tu pago adjuntando el comprobante de transferencia, Pago Móvil o Zelle. Haz clic abajo para comenzar:`,
      r3: (tasa) => `La tasa oficial del BCV registrada actualmente en el sistema es de Bs. ${tasa} por USD.`,
      r4: `Aceptamos transferencias en Bolívares (Pago Móvil y Transferencia Bancaria), Zelle, efectivo en divisa y transferencias internacionales.`,
      r5: `Los pagos reportados vía Pago Móvil o Zelle suelen validarse en un lapso de 1 a 12 horas hábiles. Recibirás un correo cuando sea confirmado.`,
      r6: `Puedes consultar y descargar todas tus facturas en formato PDF desde la sección "Facturas" en tu panel de control.`,
      r7: `Tus facturas tienen fecha de vencimiento detallada en la tabla principal. Recuerda realizar tu pago antes de la fecha límite para evitar suspensión.`,
      r8: `Para atención personalizada o soporte técnico, puedes comunicarte vía correo a soporte@avoblanher.com o por WhatsApp corporativo.`,
      rDefault: `Entendido. Si tienes alguna otra duda sobre tus saldos o pagos, selecciona una de las opciones sugeridas.`
    },
    en: {
      title: 'Virtual Assistant',
      status: 'Online',
      welcome: `Hello ${cliente?.nombre || ''}! 👋 I am your AVOBLANHER virtual assistant. How can I help you today?`,
      selectQuery: 'Select an inquiry:',
      footerText: 'Select a question to view the response.',
      btnReport: 'Report Payment Now',
      // Questions
      q1: '💰 What is my outstanding balance?',
      q2: '💳 I want to report a payment',
      q3: '📈 What is today\'s BCV exchange rate?',
      q4: '🏦 What payment methods are accepted?',
      q5: '⏱️ How long does payment validation take?',
      q6: '📄 Where can I view my invoices?',
      q7: '🗓️ When is my invoice or service due?',
      q8: '🎧 Technical support & help',
      // Answers
      r1: (ves, usd, num) => `Your current outstanding balance is Bs. ${ves} (Equivalent to $${usd} USD). You have ${num} active invoice(s).`,
      r2: `You can report your payment by attaching your wire transfer, Pago Móvil, or Zelle receipt. Click below to start:`,
      r3: (tasa) => `The official BCV exchange rate currently registered in the system is Bs. ${tasa} per USD.`,
      r4: `We accept VES bank transfers, Pago Móvil, Zelle, USD cash, and international wire transfers.`,
      r5: `Payments reported via Pago Móvil or Zelle are usually validated within 1 to 12 business hours. You will receive an email upon confirmation.`,
      r6: `You can view and download all your PDF invoices directly from the "Invoices" section in your control panel.`,
      r7: `Your invoices have specific due dates listed in the main table. Please settle your balance before the deadline to prevent service interruption.`,
      r8: `For personalized assistance or technical support, contact us at soporte@avoblanher.com or via corporate WhatsApp.`,
      rDefault: `Understood. If you have any other questions regarding your balance or payments, please select one of the suggested options.`
    }
  };

  const texts = t[currentLang] || t.es;

  // Estado de mensajes
  const [messages, setMessages] = useState([
    { sender: 'bot', text: texts.welcome }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Manejador de consultas ampliadas
  const handleSendQuery = (type) => {
    const r = account?.resumen;
    let userText = '';
    let botMsg = { sender: 'bot', text: '', action: null };

    const locale = currentLang === 'es' ? 'es-VE' : 'en-US';
    const deudaVes = parseFloat(r?.total_deuda_ves || 0).toLocaleString(locale, { minimumFractionDigits: 2 });
    const deudaUsd = parseFloat(r?.total_deuda_usd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const tasa = r?.tasa_bcv ? parseFloat(r.tasa_bcv).toLocaleString(locale, { minimumFractionDigits: 2 }) : 'N/A';

    switch (type) {
      case 'saldo':
        userText = texts.q1;
        botMsg.text = texts.r1(deudaVes, deudaUsd, r?.facturas_pendientes || 0);
        break;
      case 'pago':
        userText = texts.q2;
        botMsg.text = texts.r2;
        botMsg.action = {
          label: texts.btnReport,
          onClick: () => {
            setIsOpen(false);
            onOpenNotificar();
          }
        };
        break;
      case 'tasa':
        userText = texts.q3;
        botMsg.text = texts.r3(tasa);
        break;
      case 'metodos':
        userText = texts.q4;
        botMsg.text = texts.r4;
        break;
      case 'tiempo':
        userText = texts.q5;
        botMsg.text = texts.r5;
        break;
      case 'facturas':
        userText = texts.q6;
        botMsg.text = texts.r6;
        break;
      case 'vencimiento':
        userText = texts.q7;
        botMsg.text = texts.r7;
        break;
      case 'soporte':
        userText = texts.q8;
        botMsg.text = texts.r8;
        break;
      default:
        userText = type;
        botMsg.text = texts.rDefault;
        break;
    }

    setMessages(prev => [...prev, { sender: 'user', text: userText }, botMsg]);
  };

  // Alternar idioma
  const toggleLanguage = () => {
    const newLang = currentLang === 'es' ? 'en' : 'es';
    setCurrentLang(newLang);
    const newTexts = t[newLang];
    setMessages([
      { sender: 'bot', text: newTexts.welcome }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón Flotante */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <MessageSquare size={20} />
        </button>
      ) : (
        /* Ventana del Chatbot */
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-white dark:bg-[#13161e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-none">
                  {texts.title}
                </h3>
                <span className="text-[10px] text-indigo-200">
                  {texts.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="px-2 py-0.5 text-xs font-bold bg-white/10 hover:bg-white/25 rounded-md text-white transition border border-white/20"
                title="Cambiar idioma / Switch language"
              >
                {currentLang === 'es' ? 'EN 🇺🇸' : 'ES 🇪🇸'}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mensajes Chat */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.action && (
                    <button
                      onClick={msg.action.onClick}
                      className="mt-2.5 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Upload size={12} />
                      <span>{msg.action.label}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />

            {/* Opciones de Preguntas Dinámicas */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <HelpCircle size={12} />
                {texts.selectQuery}
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'saldo', label: texts.q1 },
                  { key: 'pago', label: texts.q2 },
                  { key: 'tasa', label: texts.q3 },
                  { key: 'metodos', label: texts.q4 },
                  { key: 'tiempo', label: texts.q5 },
                  { key: 'facturas', label: texts.q6 },
                  { key: 'vencimiento', label: texts.q7 },
                  { key: 'soporte', label: texts.q8 },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleSendQuery(item.key)}
                    className="text-left text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pie del Chat */}
          <div className="p-3 border-t border-slate-200/80 dark:border-white/10 text-center bg-slate-50 dark:bg-[#0d0f14]">
            <p className="text-[11px] text-slate-400">
              {texts.footerText}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── MODAL NOTIFICAR PAGO ──────────────────────────────────────────────────────
function NotificarPagoModal({ facturas, pagos = [], onClose, onSuccess, t, lang }) {
  const [tipoPago, setTipoPago] = useState('abonar');
  const [form, setForm] = useState({
    factura_id: '',
    monto_original: '',
    moneda_original: 'VES',
    metodo_pago: 'transferencia',
    referencia: '',
    concepto: '',
  });
  const [imagen, setImagen]     = useState(null);
  const [preview, setPreview]   = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk]             = useState(false);
  const [error, setError]       = useState('');
  const [bcvRate, setBcvRate]   = useState(null);

  const facturaSeleccionada = facturas.find(f => f.id === form.factura_id);

  // Calcular saldo pendiente real: monto original de la factura menos abonos ya registrados
  const totalAbonadoFactura = facturaSeleccionada
    ? pagos.filter(p => String(p.factura_id) === String(facturaSeleccionada.id))
           .reduce((s, p) => s + parseFloat(p.monto_ves || 0), 0)
    : 0;
  const saldoPendienteFactura = facturaSeleccionada
    ? Math.max(0, parseFloat(facturaSeleccionada.monto_ves) - totalAbonadoFactura)
    : 0;

  useEffect(() => {
    portalApi.get('/api/currency/bcv')
      .then(({ data }) => setBcvRate(data?.tasa ? parseFloat(data.tasa) : null))
      .catch(() => setBcvRate(null));
  }, []);

  useEffect(() => {
    if (tipoPago === 'pagar_completo' && facturaSeleccionada) {
      // Usar el saldo pendiente real (monto original − abonos previos), no el total completo
      const totalBs = saldoPendienteFactura;
      if (form.moneda_original === 'VES') {
        setForm(prev => ({ ...prev, monto_original: totalBs.toFixed(2) }));
      } else if (form.moneda_original === 'USD' && bcvRate) {
        setForm(prev => ({ ...prev, monto_original: (totalBs / bcvRate).toFixed(2) }));
      }
    }
  }, [tipoPago, facturaSeleccionada, form.moneda_original, bcvRate, saldoPendienteFactura]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagen(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.referencia.trim()) {
      setError('El número de referencia es obligatorio.');
      return;
    }
    if (!imagen) {
      setError('Debes adjuntar una imagen del comprobante de pago.');
      return;
    }

    setEnviando(true);
    setOk(false);
    try {
      let comprobante_url = null;
      if (imagen) {
        comprobante_url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imagen);
        });
      }
      await portalApi.post('/api/payments', {
        ...form,
        monto_original: parseFloat(form.monto_original),
        comprobante_url,
        tipo_pago: tipoPago,
      });
      setOk(true);
      setTimeout(() => { onSuccess && onSuccess(); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('portal_notify_error_generic'));
    } finally {
      setEnviando(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1c212a] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm transitionplaceholder:text-slate-400 font-medium';

  const labelCls = "block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5";

  const montoEnBs = form.monto_original && form.moneda_original === 'USD' && bcvRate
    ? (parseFloat(form.monto_original) * bcvRate).toFixed(2)
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-opacity"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-[#161b22] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col transform transition-all">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Upload size={16} className="text-indigo-500" /> {t('portal_notify_title')}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {ok && (
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle size={16} /> {t('modal_notify_success_short')}
            </div>
          )}
          {error && (
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm border border-rose-500/20 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>{t('portal_notify_invoice_label')}</label>
              <select required value={form.factura_id} onChange={e => setForm(prev => ({ ...prev, factura_id: e.target.value }))} className={inputCls}>
                <option value="">{t('portal_notify_invoice_placeholder')}</option>
                {facturas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.descripcion} — Bs. {parseFloat(f.monto_ves).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-[#0d1117] rounded-xl">
              {[
                ['abonar', t('portal_notify_partial')],
                ['pagar_completo', t('portal_notify_full')]
              ].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTipoPago(val)}
                  className={`py-2 rounded-lg font-bold text-xs transition ${
                    tipoPago === val
                      ? 'bg-white dark:bg-[#161b22] text-indigo-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 border border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('portal_notify_currency')}</label>
                <select value={form.moneda_original} onChange={e => setForm(prev => ({ ...prev, moneda_original: e.target.value }))} className={inputCls}>
                  <option value="VES">Bolívares (VES)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('portal_notify_amount')}</label>
                <input
                  type="number" required step="0.01" min="0.01"
                  value={form.monto_original}
                  readOnly={tipoPago === 'pagar_completo'}
                  onChange={e => {
                    if (tipoPago === 'pagar_completo') return;
                    setForm(prev => ({ ...prev, monto_original: e.target.value }));
                  }}
                  className={inputCls + (tipoPago === 'pagar_completo' ? ' opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : '')}
                />
                {tipoPago === 'pagar_completo' && (
                  <p className="text-[10px] text-indigo-500 font-medium mt-1 ml-0.5">
                    {t('portal_notify_full_hint')}
                    {totalAbonadoFactura > 0 && ` — Saldo pendiente: Bs. ${saldoPendienteFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                  </p>
                )}
                {tipoPago === 'abonar' && facturaSeleccionada && (
                  <p className="text-[10px] text-slate-400 font-medium mt-1 ml-0.5">
                    {t('portal_notify_partial_hint')}
                    {` Saldo pendiente: Bs. ${saldoPendienteFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                  </p>
                )}
              </div>
            </div>

            {form.moneda_original === 'USD' && montoEnBs && (
              <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <DollarSign size={13} className="shrink-0" />
                <span>Equivalente: <strong>Bs. {parseFloat(montoEnBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong></span>
                {bcvRate && <span className="ml-auto text-[10px] opacity-70">Tasa: Bs. {bcvRate.toLocaleString('es-VE')}</span>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('portal_notify_method')}</label>
                <select value={form.metodo_pago} onChange={e => setForm(prev => ({ ...prev, metodo_pago: e.target.value }))} className={inputCls}>
                  <option value="transferencia">Transferencia</option>
                  <option value="pago_movil">Pago Móvil</option>
                  <option value="zelle">Zelle</option>
                  <option value="efectivo">Efectivo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  {t('portal_notify_ref')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" required value={form.referencia}
                  onChange={e => setForm(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Ej: 123456789"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                {t('portal_notify_voucher')} <span className="text-rose-500">*</span>
              </label>
              <input type="file" accept="image/*" onChange={handleImagen} className="hidden" id="voucher-upload" />
              <label
                htmlFor="voucher-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-xl cursor-pointer transition overflow-hidden bg-slate-50 dark:bg-[#0d1117] ${
                  imagen ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                }`}
              >
                {preview ? (
                  <div className="relative w-full h-full group">
                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Upload size={14} /> Cambiar Imagen
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400 px-4 text-center">
                    <ImageIcon size={20} className="mb-1 text-slate-300" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('portal_notify_voucher_click')}</span>
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit" disabled={enviando}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg text-sm"
            >
              {enviando ? t('portal_notify_sending') : t('modal_notify_btn_short')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── PORTAL DASHBOARD (DISEÑO ASIMÉTRICO FINTECH) ──────────────────────────────
export default function PortalDashboard() {
  const { cliente }                           = usePortalAuth();
  const { t, lang }                           = useI18n();
  const location                              = useLocation();
  const [showNotificar, setShowNotificar]     = useState(false);
  const [empresas, setEmpresas]               = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [account, setAccount]                 = useState(null);
  const [loading, setLoading]                 = useState(true);

  const [currentPage, setCurrentPage]         = useState(1);
  const RECORDS_PER_PAGE = 6;
  const [nuevasFacturas, setNuevasFacturas]   = useState([]);
  const [showNewInvoiceBanner, setShowNewInvoiceBanner] = useState(false);

  const statusColors = {
    pendiente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    vencida:   'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    mora:      'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
    pagada:    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    anulada:   'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    procesado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  };

  const descargarPDF = async (item) => {
  const doc = new jsPDF();
  
  // 1. Cargamos el logo JPG desde public/images/
  let logoBase64 = '';
  try {
    logoBase64 = await obtenerBase64DesdePublic('/images/logo.jpg');
  } catch (e) {
    console.warn('No se pudo cargar el logo para el PDF:', e);
  }

  // Colores corporativos
  const primaryBlue = [0, 51, 153]; 
  const darkText = [30, 30, 30];

  // --- LÓGICA DE DATOS ---
  const idFacturaBuscada = item.factura_id || item.id;
  const todosLosAbonos = account?.pagos?.filter(p => String(p.factura_id) === String(idFacturaBuscada)) || [];
  const totalAbonado = todosLosAbonos.reduce((sum, p) => sum + parseFloat(p.monto_ves || 0), 0);

  const facturaOriginal = account?.facturas?.find(f => String(f.id) === String(idFacturaBuscada));
  const montoOriginalFijo = facturaOriginal
    ? parseFloat(facturaOriginal.monto_ves)
    : parseFloat(item.factura?.monto_ves || item.monto_ves || 0);

  const pendienteReal = Math.max(0, montoOriginalFijo - totalAbonado);

  // --- LÓGICA MEJORADA DE CLIENTE Y EMPRESA ---
  const nombreCliente = item.cliente?.nombre || account?.nombre || item.nombre_cliente || 'CLIENTE REGISTRADO';
  const nombreEmpresa = item.empresa?.nombre || item.factura?.empresa?.nombre || account?.empresa || item.empresa_nombre || item.razon_social || '';

  // Formato: "JUAN PÉREZ - INVERSIONES 2026 C.A." (o solo el cliente si no hay empresa)
  const clienteTextoFinal = nombreEmpresa 
    ? `${nombreCliente} - ${nombreEmpresa}` 
    : nombreCliente;

  const conceptoTexto = (facturaOriginal?.descripcion || item.factura?.descripcion || item.descripcion || 'SERVICIOS PRESTADOS').toUpperCase();
  const fechaEmision = facturaOriginal?.fecha_emision || item.fecha_emision || '—';

  // --- 1. LOGO DE LA EMPRESA ---
  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', 15, 12, 45, 30);
  }

  // --- 2. ENCABEZADO FISCAL ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryBlue);
  
  const startXInfo = 65;
  doc.text('PROMOTORA LOS TEQUES C.A.', startXInfo, 18);
  
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text('CALLE ROSCIO EDIFICIO Nro. 06 LOCAL Nro 36', startXInfo, 24);
  doc.text('LOS TEQUES ESTADO MIRANDA', startXInfo, 29);
  doc.text('TELÉFONO: (0412) 718-5261', startXInfo, 34);
  doc.text('Nro. RIF: J-06463283-0', startXInfo, 39);

  // --- 3. TÍTULO Y FECHA ---
  const idRaw = String(idFacturaBuscada);
  const idFormateado = idRaw.length > 10 ? idRaw.substring(0, 8).toUpperCase() : idRaw.padStart(4, '0');

  let currentY = 55;

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryBlue);
  doc.text(`RECIBO DE PAGO Nro. ${idFormateado}`, 15, currentY);

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkText);
  doc.text(`Los Teques, ${fechaEmision}`, 195, currentY, { align: 'right' });

  // Línea divisora principal
  currentY += 5;
  doc.setLineWidth(0.6);
  doc.setDrawColor(...primaryBlue);
  doc.line(15, currentY, 195, currentY);

  // --- 4. CUERPO TIPO RECIBO ---
  currentY += 20;

  // Hemos recibido de...
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryBlue);
  doc.text('Hemos recibido de:', 15, currentY);
  
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkText);
  // Imprime Cliente y Empresa juntas
  doc.text(clienteTextoFinal.toUpperCase(), 55, currentY);
  doc.setLineWidth(0.2);
  doc.setDrawColor(180, 180, 180);
  doc.line(53, currentY + 1.5, 195, currentY + 1.5);

  // La cantidad de...
  currentY += 18;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryBlue);
  doc.text('La cantidad de:', 15, currentY);
  
  doc.setFont('times', 'bold');
  doc.setTextColor(...darkText);
  doc.text(`Bs. ${montoOriginalFijo.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 55, currentY);
  doc.line(53, currentY + 1.5, 195, currentY + 1.5);

  // Por concepto de...
  currentY += 18;
  doc.setFont('times', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Por concepto de:', 15, currentY);
  
  doc.setFont('times', 'normal');
  doc.setTextColor(...darkText);
  
  const lineasConcepto = doc.splitTextToSize(conceptoTexto, 138);
  doc.text(lineasConcepto, 55, currentY);
  
  for (let i = 0; i < lineasConcepto.length; i++) {
    const lineY = currentY + (i * 8) + 1.5;
    doc.line(i === 0 ? 53 : 15, lineY, 195, lineY);
  }
  
  currentY += (lineasConcepto.length * 8) + 15;

  // --- 5. TABLA DE HISTORIAL / DESGLOSE ---
  if (todosLosAbonos.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Fecha', 'Referencia', 'Método de Pago', 'Monto Abonado']],
      body: todosLosAbonos.map(a => [
        a.fecha_pago || '—',
        a.referencia || 'N/A',
        (a.metodo_pago || 'TRANSFERENCIA').toUpperCase(),
        `Bs. ${parseFloat(a.monto_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
      ]),
      theme: 'grid',
      styles: { 
        font: 'times', 
        fontSize: 10, 
        cellPadding: 5,
        textColor: darkText,
        halign: 'center'
      },
      headStyles: { 
        fillColor: primaryBlue, 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 10.5,
        halign: 'center'
      },
      columnStyles: { 
        3: { halign: 'right', fontStyle: 'bold' } 
      },
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // --- 6. RESUMEN DE SALDOS ---
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text(`Total Abonado: Bs. ${totalAbonado.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });

  currentY += 9;
  if (pendienteReal > 0.01) {
    doc.setTextColor(180, 0, 0);
    doc.text(`SALDO PENDIENTE POR PAGAR: Bs. ${pendienteReal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });
  } else {
    doc.setTextColor(0, 128, 0);
    doc.setFontSize(13);
    doc.text('RECIBO PAGADO', 195, currentY, { align: 'right' });
  }

  // --- 7. SECCIÓN DE FIRMAS ---
  currentY += 40;
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(150, 150, 150);
  
  // Línea izquierda
  doc.line(25, currentY, 85, currentY);
  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkText);
  doc.text('Entregado por (Firma / Sello)', 55, currentY + 5, { align: 'center' });

  // Línea derecha
  doc.line(125, currentY, 185, currentY);
  doc.text('Recibido Conforme (Cliente)', 155, currentY + 5, { align: 'center' });

  // Guardar archivo
  doc.save(`Recibo_Pago_${idFormateado}.pdf`);
};

  const loadData = useCallback(async (companyId = null) => {
    if (!cliente) return;
    setLoading(true);
    try {
      const { data: comps } = await portalApi.get(`/api/companies/by-user/${cliente.id}`);
      setEmpresas(comps);
      let selEmp = null;
      if (companyId && companyId !== 'sin_empresa') {
        selEmp = comps.find(c => c.id === companyId) || null;
      } else if (!companyId) {
        selEmp = selectedEmpresa || comps[0] || null;
      }
      setSelectedEmpresa(selEmp);
      const params = selEmp ? `?company_id=${selEmp.id}` : '?no_company=true';
      const { data: acc } = await portalApi.get(`/api/accounts/${cliente.id}${params}`);
      setAccount(acc);
      setCurrentPage(1);

      // ── Detectar facturas nuevas (no vistas antes) ────────────────────────
      const storageKey = `avob_seen_invoices_${cliente.id}`;
      const seenRaw = localStorage.getItem(storageKey);
      const seenIds = seenRaw ? JSON.parse(seenRaw) : null;
      const todasFacturas = acc?.facturas || [];
      if (seenIds === null) {
        // Primera vez: guardar todos los IDs actuales como vistos, sin mostrar banner
        localStorage.setItem(storageKey, JSON.stringify(todasFacturas.map(f => f.id)));
      } else {
        const nuevas = todasFacturas.filter(f => !seenIds.includes(f.id));
        if (nuevas.length > 0) {
          setNuevasFacturas(nuevas);
          setShowNewInvoiceBanner(true);
          // Marcar todas como vistas
          localStorage.setItem(storageKey, JSON.stringify(todasFacturas.map(f => f.id)));
        }
      }
      // ─────────────────────────────────────────────────────────────────────
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [cliente, selectedEmpresa]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { setCurrentPage(1); }, [location.pathname]);

  if (!cliente) return null;

  const path            = location.pathname;
  const r               = account?.resumen;
  const facturasActivas = account?.facturas?.filter(f => ['pendiente', 'vencida', 'mora'].includes(f.status)) || [];
  const tableItems      = path === '/portal/pagos' ? account?.pagos : account?.facturas;
  const isPagosView     = path === '/portal/pagos';

  const totalRecords = (tableItems || []).length;
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const paginatedItems = (tableItems || []).slice(startIndex, startIndex + RECORDS_PER_PAGE);

  // ─── PARSEO DE DATA PARA LAS GRÁFICAS ────────────────────────────────────────
  // 1. Data de Tendencia (Monto adeudado vs Último Mes Facturado)
  const trendData = [
    { name: 'Histórico', monto: parseFloat(r?.ultimo_mes || 0) * 0.8 }, 
    { name: t('portal_notify_partial'), monto: parseFloat(r?.ultimo_mes || 0) },
    { name: 'Saldo Actual', monto: parseFloat(r?.total_deuda_ves || 0) }
  ];

  // 2. Data de Distribución por Estados (Pie Chart)
  const statusCounts = (account?.facturas || []).reduce((acc, current) => {
    const status = current.status || 'pendiente';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(key => ({
    name: key.toUpperCase(),
    value: statusCounts[key]
  }));

  // Paleta de colores sincronizada con la UI del sistema
  const COLORS = {
    PENDIENTE: '#f59e0b', // Amber
    VENCIDA: '#f43f5e',   // Rose
    MORA: '#f97316',      // Orange
    PAGADA: '#10b981',    // Emerald
    ANULADA: '#64748b'    // Slate
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] transition-colors flex flex-col antialiased">
      <PortalNavbar onNotificar={() => setShowNotificar(true)} totalEmpresas={empresas.length} />

      {/* Alerta global superior (Si hay deudas críticas) */}
      {facturasActivas.some(f => ['vencida','mora'].includes(f.status)) && (
        <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 fixed top-14 left-0 right-0 z-40 shadow-sm">
          <ShieldAlert size={14} />
          <span>Atención: Posee compromisos vencidos o en mora. Evite la suspensión del servicio comercial.</span>
          <button onClick={() => setShowNotificar(true)} className="underline ml-2 hover:text-rose-100 flex items-center gap-0.5">
            Reportar Pago <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Banner: Factura(s) nueva(s) */}
      {showNewInvoiceBanner && (
        <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 fixed top-14 left-0 right-0 z-50 shadow-md animate-pulse">
          <FileText size={14} />
          <span>
            {nuevasFacturas.length === 1
              ? `${t('portal_new_invoice_single')} — ${nuevasFacturas[0].descripcion || `Factura #${nuevasFacturas[0].id}`}`
              : `${t('portal_new_invoice_plural').replace('{n}', nuevasFacturas.length)}`}
          </span>
          <button
            onClick={() => setShowNewInvoiceBanner(false)}
            className="ml-3 p-0.5 hover:bg-indigo-500 rounded transition"
            title="Cerrar"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Contenedor Principal con Layout Bifocal (Layout Dividido) */}
      <main className={`flex-grow px-4 md:px-8 max-w-7xl w-full mx-auto ${
        (facturasActivas.some(f => ['vencida','mora'].includes(f.status)) && showNewInvoiceBanner) ? 'pt-36' :
        (facturasActivas.some(f => ['vencida','mora'].includes(f.status)) || showNewInvoiceBanner) ? 'pt-28' : 'pt-20'
      } pb-16`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ════ BARRA LATERAL IZQUIERDA (CONTROL GENERAL Y TASA) ════ */}
          <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Tarjeta de Identificación y Bienvenida */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 pointer-events-none">
                <Wallet size={120} />
              </div>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">{t('portal_login_title')}</p>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('portal_hello')}, <span className="text-indigo-600 dark:text-indigo-400">{cliente?.nombre}</span>
              </h1>

              {/* Tasa del Día integrada directamente aquí */}
              {r?.tasa_bcv && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span>Tasa Oficial BCV</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Bs. {parseFloat(r.tasa_bcv).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Selector de Entidad / Empresa Embozado */}
            {empresas.length > 0 && (
              <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Empresa o Cuenta Activa</label>
                <div className="relative">
                  <select
                    value={selectedEmpresa?.id || 'sin_empresa'}
                    onChange={e => loadData(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-xs font-bold px-3 py-3 rounded-xl outline-none text-slate-800 dark:text-slate-200 cursor-pointer appearance-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                    <option value="sin_empresa">{t('dash_individual')}</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={14} />
                  </div>
                </div>
              </div>
            )}

            {/* Banner de Acción Rápida para Notificar Pago */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/10 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">¿Realizaste una transferencia?</p>
                <h3 className="text-lg font-extrabold tracking-tight">Reporta tu pago de forma inmediata</h3>
              </div>
              <p className="text-xs text-indigo-100/80 leading-relaxed">Adjunta tu comprobante digital y procesaremos el balance de tu cuenta a la brevedad.</p>
              <button
                onClick={() => setShowNotificar(true)}
                className="w-full bg-white text-indigo-700 font-bold py-3 px-4 rounded-xl text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Upload size={14} />
                <span>{t('portal_notify_btn')}</span>
              </button>
            </div>

          </section>

          {/* ════ PANEL DERECHO PRINCIPAL (MÉTRICAS COMBINADAS Y VISTA OPERATIVA) ════ */}
          <section className="lg:col-span-8 space-y-6">
            
            {loading ? (
              <div className="flex justify-center py-24 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Bloque Consolidado de Balances Avanzado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Tarjeta 1: Estado General de Cuenta */}
                  <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Balance Total Adeudado</span>
                      <div className="p-1 rounded-md bg-rose-500/10 text-rose-500"><ArrowDownLeft size={14} /></div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Bs. {parseFloat(r?.total_deuda_ves || 0).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', {minimumFractionDigits:2})}
                      </p>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <DollarSign size={12} /> Ref: $ {parseFloat(r?.total_deuda_usd || 0).toLocaleString('en-US', {minimumFractionDigits:2})}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {r?.facturas_pendientes ? `${r.facturas_pendientes} facturas activas cargadas` : 'Sin deudas pendientes'}
                    </div>
                  </div>

                  {/* Tarjeta 2: Resumen Histórico Comercial */}
                  <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                    <div className="grid grid-cols-2 gap-2 divide-x divide-slate-100 dark:divide-slate-800">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturado este mes</span>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                          Bs. {parseFloat(r?.ultimo_mes || 0).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', {minimumFractionDigits:2})}
                        </p>
                      </div>
                      <div className="space-y-1 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Último Abono Recibido</span>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          Bs. {r?.ultimo_pago ? parseFloat(r.ultimo_pago.monto_ves).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', {minimumFractionDigits:2}) : '0,00'}
                        </p>
                      </div>
                    </div>
                    {r?.ultimo_pago?.fecha && (
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 bg-slate-50 dark:bg-[#0d1117] p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span>Abonado el día: <strong>{r?.ultimo_pago?.fecha}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── NUEVA SECCIÓN DE GRÁFICAS ANALÍTICAS ─────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Gráfico 1: Histórico de Volumen vs Balance (Area Chart) */}
                  <div className="md:col-span-7 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <BarChart3 size={14} className="text-indigo-500" />
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tendencia de Compromisos (Bs.)</h3>
                    </div>
                    <div className="h-48 w-full text-[11px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value) => [`Bs. ${value.toLocaleString()}`, 'Monto']}
                          />
                          <Area type="monotone" dataKey="monto" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorMonto)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfico 2: Proporción de Estados de Factura (Pie Chart) */}
                  <div className="md:col-span-5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity size={14} className="text-indigo-500" />
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Distribución por Estatus</h3>
                    </div>
                    {pieData.length > 0 ? (
                      <div className="h-40 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={55}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#64748b'} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} ítems`, 'Cantidad']} />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Leyenda manual compacta adaptada a Fintech */}
                        <div className="absolute bottom-0 flex flex-wrap gap-x-3 gap-y-1 justify-center text-[9px] font-bold text-slate-500">
                          {pieData.map((entry, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
                              <span>{entry.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-xs text-slate-400 font-medium">Sin estados cargados</div>
                    )}
                  </div>
                </div>

                {/* Contenedor Reestructurado de la Tabla de Datos */}
                <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  
                  {/* Encabezado Operativo */}
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
                    <div className="flex items-center gap-2">
                      {isPagosView ? <CreditCard size={15} className="text-indigo-500" /> : <FileText size={15} className="text-indigo-500" />}
                      <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                        {isPagosView ? t('portal_payments_title') : t('dash_account_status')}
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                      {totalRecords} ítems
                    </span>
                  </div>

                  {/* Tabla Limpia de Datos Financieros */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/20">
                          <th className="py-3 px-5">{isPagosView ? 'Método de Pago' : 'Detalle / Concepto'}</th>
                          <th className="py-3 px-5">Emisión / Registro</th>
                          {!isPagosView && <th className="py-3 px-5">Vence</th>}
                          <th className="py-3 px-5 text-center">Estado</th>
                          <th className="py-3 px-5 text-right">Monto Total</th>
                          <th className="py-3 px-5 text-right">Descargas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {paginatedItems.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-[#1c212a]/40 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white capitalize">
                              {(item.metodo_pago || item.descripcion || '—').replace('_', ' ')}
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-medium">
                              {item.fecha_pago || item.fecha_emision}
                            </td>
                            {!isPagosView && (
                              <td className="py-3.5 px-5 text-slate-400">
                                {item.fecha_vencimiento || '—'}
                              </td>
                            )}
                            <td className="py-3.5 px-5 text-center">
                              {item.status ? (
                                <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isPagosView ? statusColors['procesado'] : (statusColors[item.status] || statusColors.pendiente)
                                }`}>
                                  {isPagosView ? 'procesado' : item.status}
                                </span>
                              ) : (
                                isPagosView ? (
                                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors['procesado']}`}>
                                    procesado
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right font-black text-slate-900 dark:text-white text-sm">
                              Bs. {parseFloat(item.monto_ves).toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => descargarPDF(item)}
                                className="inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-md hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                              >
                                <Download size={11} />
                                <span>Descargar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty State */}
                  {totalRecords === 0 && (
                    <div className="py-16 text-center space-y-2">
                      <FileText size={24} className="mx-auto text-slate-300" />
                      <p className="text-xs text-slate-400 font-medium">{t('table_no_records')}</p>
                    </div>
                  )}

                  {/* Controles de Paginación Compactos */}
                  {totalRecords > RECORDS_PER_PAGE && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Viendo {paginatedItems.length} de {totalRecords} registros
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition"
                        >
                          Anterior
                        </button>
                        <span className="px-3 text-[11px] font-bold text-slate-800 dark:text-slate-300">
                          {currentPage}
                        </span>
                        <button
                          disabled={currentPage * RECORDS_PER_PAGE >= totalRecords}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 hover:text-indigo-600 disabled:opacity-40 transition"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </section>

        </div>
      </main>

      {/* Componente del Chatbot Integrado */}
      <PortalChatbot
        account={account}
        cliente={cliente}
        onOpenNotificar={() => setShowNotificar(true)}
      />

      <AppFooter />

      {showNotificar && (
        <NotificarPagoModal
          facturas={facturasActivas}
          pagos={account?.pagos || []}
          onClose={() => setShowNotificar(false)}
          onSuccess={() => loadData()}
          t={t}
          lang={lang}
        />
      )}
    </div>
  );
}