import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import { useI18n } from '../../context/I18nContext';
import { Bot, RefreshCw, Send, TrendingUp, Mail, Eye, EyeOff, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';

function EmailPreview({ currentRate, t }) {
  const [expanded, setExpanded] = useState(false);
  const montoVes = 15800.00;
  const tasaBcv  = currentRate ? parseFloat(currentRate.tasa) : null;
  const montoUsd = tasaBcv ? `(≈ USD ${(montoVes / tasaBcv).toFixed(2)})` : '';
  const hoy = new Date().toISOString().split('T')[0];

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:20px}
  .card{background:#fff;border-radius:16px;max-width:540px;margin:0 auto;overflow:hidden}
  .header{background:#4f46e5;padding:32px 40px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:22px}.header p{color:#c7d2fe;margin:6px 0 0;font-size:14px}
  .body{padding:32px 40px}.body p{color:#475569;line-height:1.6}
  .amount{background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:24px 0}
  .amount .label{color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px}
  .amount .value{color:#0f172a;font-size:32px;font-weight:700;margin:4px 0}
  .amount .usd{color:#64748b;font-size:14px}
  .btn{display:block;background:#4f46e5;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;margin:24px 0 0}
  .footer{background:#f8fafc;padding:20px 40px;text-align:center;color:#94a3b8;font-size:12px}
  </style></head><body>
  <div class="card">
    <div class="header"><h1>Multiservicios AVOBLANHER C.A.</h1><p>${t('bot_email_pending_notice')}</p></div>
    <div class="body">
      <p>${t('bot_email_greeting')} <strong>Cliente Ejemplo</strong>,</p>
      <p>${t('bot_email_body')}</p>
      <div class="amount">
        <div class="label">${t('bot_email_amount_label')}</div>
        <div class="value">Bs. ${montoVes.toLocaleString('es-VE',{minimumFractionDigits:2})}</div>
        <div class="usd">${montoUsd}</div>
      </div>
      <p><strong>${t('bot_email_due_label')}</strong> ${hoy}</p>
      <p><strong>${t('bot_email_invoice_label')}</strong> EJEMPLO-00001</p>
      <a href="#" class="btn">${t('bot_email_cta')}</a>
    </div>
    <div class="footer">
      <p>${t('bot_email_footer')}</p>
      <p>© ${new Date().getFullYear()} Multiservicios AVOBLANHER C.A. — Los Teques, Miranda, Venezuela</p>
    </div>
  </div></body></html>`;

  return (
    <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Mail size={14} className="text-indigo-500" /> {t('bot_email_preview_title')}
        </h3>
        <button onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition">
          {expanded ? <EyeOff size={12}/> : <Eye size={12}/>}
          {expanded ? t('bot_email_preview_hide') : t('bot_email_preview_show')}
        </button>
      </div>
      {!expanded ? (
        <div className="px-5 py-4 text-sm text-slate-400">
          {t('bot_email_preview_desc')}
          {tasaBcv && <span className="ml-1.5 text-indigo-500 font-medium">{t('bot_email_preview_rate')} {tasaBcv.toFixed(2)}</span>}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-black/20">
          <div className="max-w-xl mx-auto">
            <div className="bg-white dark:bg-[#13161e] rounded-xl shadow-sm mb-2 px-4 py-3 text-[11px] text-slate-400 border border-slate-200 dark:border-white/10 space-y-0.5">
              <div><span className="font-semibold text-slate-600 dark:text-slate-300">{t('bot_email_preview_from')}</span> "AVOBLANHER C.A." &lt;notificaciones@avoblanher.com&gt;</div>
              <div><span className="font-semibold text-slate-600 dark:text-slate-300">{t('bot_email_preview_subject')}</span> ⚠️ Factura vencida pendiente — AVOBLANHER C.A.</div>
            </div>
            <iframe srcDoc={html} title="Preview email" className="w-full border-0 rounded-xl shadow-md" style={{ height: 500 }} sandbox="allow-same-origin" />
            <p className="text-center text-[11px] text-slate-400 mt-2 italic">{t('bot_email_preview_note')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BotPage() {
  const { t } = useI18n();
  const [rate, setRate]           = useState(null);
  const [history, setHistory]     = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const HISTORY_LIMIT = 8;
  const [notifHistory, setNotifHistory] = useState([]);
  const [syncing, setSyncing]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [syncResult, setSyncResult]   = useState(null);
  const [sendResult, setSendResult]   = useState(null);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r, h, n] = await Promise.all([
        api.get('/api/currency/bcv'),
        api.get(`/api/currency/history?limit=${HISTORY_LIMIT}&page=${historyPage}`),
        api.get('/api/notifications/history'),
      ]);
      setRate(r.data);
      const historyData = h.data?.results || h.data?.data || h.data || [];
      setHistory(historyData);
      setHistoryTotal(h.data?.total || historyData.length);
      setNotifHistory(n.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [historyPage]);

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const { data } = await api.post('/api/currency/sync');
      setSyncResult({ ok: true, msg: `${t('bot_kpi_rate')}: Bs. ${parseFloat(data.result?.tasa || rate?.tasa || 0).toFixed(2)}` });
      load();
    } catch (err) { setSyncResult({ ok: false, msg: err.response?.data?.error || t('bot_sync_error') }); }
    finally { setSyncing(false); }
  };

  const handleSendNotifications = async () => {
    setSending(true); setSendResult(null);
    try {
      const { data } = await api.post('/api/notifications/send');
      setSendResult({ ok: true, msg: `Enviados: ${data.result?.enviados ?? 0} · Fallidos: ${data.result?.fallidos ?? 0} · Omitidos: ${data.result?.omitidos ?? 0}` });
      load();
    } catch (err) { setSendResult({ ok: false, msg: err.response?.data?.error || t('bot_send_error') }); }
    finally { setSending(false); }
  };

  const enviados = notifHistory.filter(n => n.estado === 'enviado').length;
  const fallidos = notifHistory.filter(n => n.estado === 'fallido').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={13} className="text-indigo-500" />
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">{t('bot_section_label')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('bot_title')}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{t('bot_subtitle')}</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: t('bot_kpi_rate'),   value: rate ? `Bs. ${parseFloat(rate.tasa).toLocaleString('es-VE')}` : '—', icon: TrendingUp,  color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-500/10'  },
              { label: t('bot_kpi_source'), value: rate?.fuente || '—',                                                  icon: Zap,         color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10'    },
              { label: t('bot_kpi_sent'),   value: enviados,                                                              icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { label: t('bot_kpi_failed'), value: fallidos,                                                              icon: XCircle,     color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-500/10'      },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-4">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={15} className={color} />
                </div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* BCV sync */}
            <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                <RefreshCw size={14} className="text-indigo-500" /> {t('bot_bcv_title')}
              </h3>
              <p className="text-[12px] text-slate-400 mb-4">{t('bot_bcv_desc')}</p>
              {syncResult && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-[12px] font-medium border ${syncResult.ok ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                  {syncResult.msg}
                </div>
              )}
              <button onClick={handleSync} disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition shadow-lg shadow-indigo-500/20">
                {syncing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><RefreshCw size={14}/> {t('bot_bcv_sync_btn')}</>}
              </button>
              {history.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('bot_bcv_history')}</p>
                  {history.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
                      <span className="text-[12px] text-slate-500 dark:text-slate-400">{new Date(r.created_at).toLocaleString('es-VE')}</span>
                      <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">Bs. {parseFloat(r.tasa).toLocaleString('es-VE')}</span>
                    </div>
                  ))}
                </div>
              )}
              {historyTotal > HISTORY_LIMIT && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-400">{t('bot_bcv_showing')} {history.length} {t('bot_bcv_of')} {historyTotal} {t('bot_bcv_records')}</span>
                  <div className="flex gap-2">
                    <button disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                      {t('bot_bcv_prev')}
                    </button>
                    <span className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">{t('bot_bcv_page')} {historyPage}</span>
                    <button disabled={historyPage * HISTORY_LIMIT >= historyTotal} onClick={() => setHistoryPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                      {t('bot_bcv_next')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                <Send size={14} className="text-indigo-500" /> {t('bot_notif_title')}
              </h3>
              <p className="text-[12px] text-slate-400 mb-4">{t('bot_notif_desc')}</p>
              {sendResult && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-[12px] font-medium border ${sendResult.ok ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                  {sendResult.msg}
                </div>
              )}
              <button onClick={handleSendNotifications} disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition shadow-lg shadow-emerald-500/20">
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Send size={14}/> {t('bot_notif_send_btn')}</>}
              </button>
              <div className="mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-[12px] text-amber-700 dark:text-amber-400">
                  <Clock size={12} /> {t('bot_notif_cron')} <strong>{t('bot_notif_cron_time')}</strong> {t('bot_notif_cron_tz')}
                </div>
              </div>
              {notifHistory.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('bot_notif_last')}</p>
                  {notifHistory.slice(0, 4).map((n, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
                      <div>
                        <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{n.destinatario}</p>
                        <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString('es-VE')}</p>
                      </div>
                      <StatusBadge value={n.estado} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email preview */}
          <EmailPreview currentRate={rate} t={t} />

        </div>
      </main>
    </div>
  );
}
