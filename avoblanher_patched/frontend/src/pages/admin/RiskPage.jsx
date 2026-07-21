import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import { useI18n } from '../../context/I18nContext';
import { Brain, Play, Zap } from 'lucide-react';

const EMPTY = { user_id: '', promedioRetrasoRaw: 0, tasaCumplimiento: 1, promedioCobertura: 1, frecuenciaEfectivo: 0, cantidadRegistros: 1 };

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition";
const labelCls = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

const RISK_CONFIG = {
  bajo:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  medio: { bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',     bar: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400'   },
  alto:  { bg: 'bg-rose-50 dark:bg-rose-500/10',       border: 'border-rose-200 dark:border-rose-500/20',       bar: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400'     },
};

export default function RiskPage() {
  const { t } = useI18n();
  const [report, setReport]           = useState([]);
  const [clients, setClients]         = useState([]);
  const [form, setForm]               = useState(EMPTY);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [classifying, setClassifying] = useState(false);
  
  // Estado para la paginación
  const [riskPage, setRiskPage]       = useState(1);
  const RISK_LIMIT = 8;

  const load = async () => {
    setLoading(true);
    const [rep, cli] = await Promise.all([api.get('/api/risk/report'), api.get('/api/auth/clients')]);
    setReport(rep.data); setClients(cli.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleClassify = async (e) => {
    e.preventDefault(); setClassifying(true); setResult(null);
    try { const { data } = await api.post('/api/risk/classify', form); setResult(data); load(); }
    catch (err) { alert(err.response?.data?.error || t('risk_classify_error')); }
    finally { setClassifying(false); }
  };

  const fields = [
    { key: 'promedioRetrasoRaw', label: t('risk_field_delay'),      min: 0, max: 90,  step: 1    },
    { key: 'tasaCumplimiento',   label: t('risk_field_compliance'),  min: 0, max: 1,   step: 0.01 },
    { key: 'promedioCobertura',  label: t('risk_field_coverage'),    min: 0, max: 1,   step: 0.01 },
    { key: 'frecuenciaEfectivo', label: t('risk_field_cash'),        min: 0, max: 1,   step: 0.01 },
    { key: 'cantidadRegistros',  label: t('risk_field_records'),     min: 1, max: 200, step: 1    },
  ];

  const cfg = result ? RISK_CONFIG[result.nivel_riesgo] || RISK_CONFIG.medio : null;

  // Lógica de cálculo para la paginación
  const riskTotal = report.length;
  const startIndex = (riskPage - 1) * RISK_LIMIT;
  const paginatedReport = report.slice(startIndex, startIndex + RISK_LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={13} className="text-indigo-500" />
              <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">{t('risk_section_label')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('risk_title')}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{t('risk_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* ── Form panel ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-6 h-fit">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" /> {t('risk_form_title')}
              </h2>

              <form onSubmit={handleClassify} className="space-y-4">
                <div>
                  <label className={labelCls}>{t('risk_client_label')}</label>
                  <select required value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} className={inputCls}>
                    <option value="">{t('risk_client_placeholder')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                {fields.map(({ key, label, min, max, step }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls.replace('mb-1.5', '')}>{label}</label>
                      <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg min-w-[40px] text-center">
                        {form[key]}
                      </span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>{min}</span><span>{max}</span>
                    </div>
                  </div>
                ))}

                <button type="submit" disabled={classifying}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition shadow-lg shadow-indigo-500/20 mt-2">
                  {classifying
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    : <><Play size={14} /> {t('risk_classify_btn')}</>
                  }
                </button>
              </form>

              {/* Result */}
              {result && cfg && (
                <div className={`mt-5 p-5 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{t('risk_result_label')}</span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {result.nivel_riesgo}
                    </span>
                  </div>
                  {[
                    { label: t('risk_prob_low'),  val: result.probabilidad_bajo,  bar: 'bg-emerald-500' },
                    { label: t('risk_prob_mid'),  val: result.probabilidad_medio, bar: 'bg-amber-500'   },
                    { label: t('risk_prob_high'), val: result.probabilidad_alto,  bar: 'bg-rose-500'    },
                  ].map(({ label, val, bar }) => (
                    <div key={label} className="mb-2.5">
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <span>{label}</span>
                        <span className="font-semibold">{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full">
                        <div className={`${bar} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${val * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {result.recomendacion && (
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3">
                      {result.recomendacion}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Report table ───────────────────────────────────────────── */}
            <div className="lg:col-span-3 bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04]">
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('risk_history_title')}</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">{riskTotal} {t('risk_history_count')}</p>
                </div>
                {loading ? (
                  <div className="flex justify-center py-14"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
                          <th className="px-5 py-3">{t('risk_col_client')}</th>
                          <th className="px-5 py-3">{t('risk_col_risk')}</th>
                          <th className="px-5 py-3">{t('risk_col_low')}</th>
                          <th className="px-5 py-3">{t('risk_col_mid')}</th>
                          <th className="px-5 py-3">{t('risk_col_high')}</th>
                          <th className="px-5 py-3">{t('risk_col_date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedReport.map(r => {
                          const c  = clients.find(cl => cl.id === r.user_id);
                          const rc = RISK_CONFIG[r.nivel_riesgo] || RISK_CONFIG.medio;
                          return (
                            <tr key={r.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{c?.nombre?.[0]?.toUpperCase() || '?'}</span>
                                  </div>
                                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{c?.nombre || r.user_id?.slice(0,8)}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${rc.bg} ${rc.text} ${rc.border}`}>
                                  {r.nivel_riesgo}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">{(r.probabilidad_bajo  * 100).toFixed(1)}%</td>
                              <td className="px-5 py-3.5 text-sm text-amber-600  dark:text-amber-400  font-medium">{(r.probabilidad_medio * 100).toFixed(1)}%</td>
                              <td className="px-5 py-3.5 text-sm text-rose-600   dark:text-rose-400   font-medium">{(r.probabilidad_alto  * 100).toFixed(1)}%</td>
                              <td className="px-5 py-3.5 text-[12px] text-slate-400">{new Date(r.created_at).toLocaleDateString('es-VE')}</td>
                            </tr>
                          );
                        })}
                        {riskTotal === 0 && (
                          <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">{t('risk_history_empty')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Controles de paginación opcionales según el límite */}
              {!loading && riskTotal > RISK_LIMIT && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#13161e]">
                  <span className="text-[11px] text-slate-400">
                    {t('pay_showing')} {paginatedReport.length} {t('pay_of')} {riskTotal} {t('risk_history_count')}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={riskPage <= 1} onClick={() => setRiskPage(p => p - 1)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                      {t('pay_prev')}
                    </button>
                    <span className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {t('pay_page')} {riskPage}
                    </span>
                    <button disabled={riskPage * RISK_LIMIT >= riskTotal} onClick={() => setRiskPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                      {t('pay_next')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}