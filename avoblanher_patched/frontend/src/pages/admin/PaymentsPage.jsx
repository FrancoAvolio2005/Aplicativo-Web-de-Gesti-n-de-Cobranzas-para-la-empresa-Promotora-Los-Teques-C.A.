import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import { useI18n } from '../../context/I18nContext';
import { CreditCard, Plus, X, Image, ExternalLink, Filter, User } from 'lucide-react';

const EMPTY = { factura_id: '', monto_original: '', moneda_original: 'VES', metodo_pago: 'transferencia', referencia: '' };
const METODOS = ['', 'transferencia', 'pago_movil', 'zelle', 'efectivo'];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600";
const labelCls = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";
const BILLING_SERVICE_URL = 'http://localhost:3002';

function ComprobanteModal({ url, onClose, t }) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${BILLING_SERVICE_URL}${path.startsWith('/') ? path : '/' + path}`;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#13161e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] w-full max-w-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><Image size={15} className="text-indigo-500" /> {t('pay_voucher_modal_title')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"><X size={15} /></button>
        </div>
        <div className="p-5 flex items-center justify-center min-h-[280px] bg-slate-50 dark:bg-black/20">
          {url ? (
            <>
              <img src={getFullUrl(url)} alt="Comprobante" className="max-w-full max-h-[55vh] object-contain rounded-xl shadow"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div style={{ display: 'none' }} className="flex-col items-center gap-3 text-center">
                <p className="text-sm text-slate-400">{t('pay_voucher_no_image')}</p>
                <a href={getFullUrl(url)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  <ExternalLink size={14} /> {t('pay_voucher_open')}
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">{t('pay_voucher_empty')}</p>
          )}
        </div>
        {url && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-white/[0.06] flex justify-end">
            <a href={getFullUrl(url)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              <ExternalLink size={13} /> {t('pay_voucher_open')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients]   = useState([]);
  const [bcv, setBcv]           = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [filterMetodo, setFilterMetodo]     = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [paymentsPage, setPaymentsPage]     = useState(1);
  const PAYMENTS_LIMIT = 8;

  const load = async () => {
    setLoading(true);
    try {
      const [pay, inv, rate, cli] = await Promise.all([
        api.get('/api/payments'),
        api.get('/api/invoices', { params: { status: 'pendiente' } }),
        api.get('/api/currency/bcv'),
        api.get('/api/auth/clients'),
      ]);

      console.log("DATOS DE PAGOS:", pay.data);

      setPayments(pay.data); setInvoices(inv.data); setBcv(rate.data); setClients(cli.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPaymentsPage(1); }, [filterMetodo, selectedClient]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/payments', { ...form, monto_original: parseFloat(form.monto_original), registradoPorAdmin: true });
      setModal(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.error || t('pay_error_generic')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('pay_revert_confirm'))) return;
    await api.delete(`/api/payments/${id}`); load();
  };

  const montoVesPreview = form.moneda_original === 'USD' && bcv && form.monto_original
    ? (parseFloat(form.monto_original) * parseFloat(bcv.tasa)).toFixed(2) : null;

  const displayedPayments = payments.filter(p => {
    const matchesMetodo = filterMetodo ? p.metodo_pago === filterMetodo : true;
    const matchesClient = selectedClient ? p.factura?.user_id === selectedClient : true;
    return matchesMetodo && matchesClient;
  });

  const paymentsTotal  = displayedPayments.length;
  const startIndex     = (paymentsPage - 1) * PAYMENTS_LIMIT;
  const paginatedPayments = displayedPayments.slice(startIndex, startIndex + PAYMENTS_LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={13} className="text-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">{t('pay_section_label')}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('pay_title')}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {paymentsTotal} {filterMetodo || selectedClient ? t('pay_subtitle_filtered') : t('pay_subtitle_total')}
                {bcv && <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full">BCV Bs. {parseFloat(bcv.tasa).toLocaleString('es-VE')}</span>}
              </p>
            </div>
            <button onClick={() => { setError(''); setForm(EMPTY); setModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
              <Plus size={15} /> {t('pay_register_btn')}
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 p-4 bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              {METODOS.map(m => (
                <button key={m} onClick={() => setFilterMetodo(m)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition capitalize ${
                    filterMetodo === m
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#f8fafc] dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                  }`}>
                  {m ? m.replace('_', ' ') : t('pay_filter_all')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 min-w-[280px]">
              <User size={14} className="text-slate-400 shrink-0" />
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0c10] text-slate-700 dark:text-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition">
                <option value="">{t('pay_filter_client')}</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>)}
              </select>
              {selectedClient && (
                <button onClick={() => setSelectedClient('')} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
                        <th className="px-5 py-3">{t('pay_col_invoice')}</th>
                        <th className="px-5 py-3">{t('pay_col_amount')}</th>
                        <th className="px-5 py-3">{t('pay_col_currency')}</th>
                        <th className="px-5 py-3">{t('pay_col_rate')}</th>
                        <th className="px-5 py-3">{t('pay_col_method')}</th>
                        <th className="px-5 py-3">{t('pay_col_ref')}</th>
                        <th className="px-5 py-3">{t('pay_col_datetime')}</th>
                        <th className="px-5 py-3">{t('pay_col_voucher')}</th>
                        <th className="px-5 py-3">{t('pay_col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map(p => (
                        <tr key={p.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
  {(() => {
    const clienteId = p.factura?.user_id;
    const cli = clients.find(c => c.id === clienteId);
    return cli?.nombre || clienteId?.slice(0, 8) || '—';
  })()}
</p>
                            <p className="text-[11px] text-slate-400">{p.factura?.descripcion || `#${p.factura_id?.slice(0,8)}`}</p>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white text-sm">{parseFloat(p.monto_ves).toLocaleString('es-VE',{minimumFractionDigits:2})}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.moneda_original==='USD' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                              {p.moneda_original}{p.moneda_original==='USD' && ` $${parseFloat(p.monto_original||0).toFixed(2)}`}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[12px] text-slate-500 dark:text-slate-400">{p.tasa_bcv ? `Bs. ${parseFloat(p.tasa_bcv).toFixed(2)}` : '—'}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 capitalize">{p.metodo_pago?.replace('_',' ')}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{p.referencia || '—'}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                            <span>{p.fecha_pago}</span>
                            {p.hora_pago && <span className="block text-[11px] text-slate-400">{p.hora_pago.slice(0,5)}</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => setComprobanteModal(p.comprobante_url || null)}
                              className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition ${
                                p.comprobante_url
                                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-default'}`}>
                              <Image size={11} /> {p.comprobante_url ? t('pay_voucher_view') : t('pay_voucher_none')}
                            </button>
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => handleDelete(p.id)}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition">
                              {t('pay_revert_btn')}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paymentsTotal === 0 && (
                        <tr><td colSpan={10} className="px-5 py-14 text-center text-sm text-slate-400">{t('pay_empty')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {paymentsTotal > PAYMENTS_LIMIT && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#13161e]">
                    <span className="text-[11px] text-slate-400">
                      {t('pay_showing')} {paginatedPayments.length} {t('pay_of')} {paymentsTotal} {t('pay_payments')}
                    </span>
                    <div className="flex gap-2">
                      <button disabled={paymentsPage <= 1} onClick={() => setPaymentsPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        {t('pay_prev')}
                      </button>
                      <span className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {t('pay_page')} {paymentsPage}
                      </span>
                      <button disabled={paymentsPage * PAYMENTS_LIMIT >= paymentsTotal} onClick={() => setPaymentsPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        {t('pay_next')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal nuevo pago */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#13161e] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">{t('pay_modal_title')}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">{error}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={labelCls}>{t('pay_modal_invoice_label')}</label>
                  <select required value={form.factura_id} onChange={e => setForm(f => ({ ...f, factura_id: e.target.value }))} className={inputCls}>
                    <option value="">{t('pay_modal_invoice_ph')}</option>
                    {invoices.map(i => <option key={i.id} value={i.id}>{i.descripcion || 'Factura'} — Bs. {parseFloat(i.monto_ves).toLocaleString('es-VE')}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t('pay_modal_currency')}</label>
                    <select value={form.moneda_original} onChange={e => setForm(f => ({ ...f, moneda_original: e.target.value }))} className={inputCls}>
                      <option value="VES">Bolívares (VES)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('pay_modal_amount')}</label>
                    <input type="number" required min="0" step="0.01" value={form.monto_original} onChange={e => setForm(f => ({ ...f, monto_original: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                {montoVesPreview && (
                  <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-[12px] text-indigo-700 dark:text-indigo-400 font-medium">
                    ≈ Bs. {parseFloat(montoVesPreview).toLocaleString('es-VE',{minimumFractionDigits:2})} · Tasa BCV: {parseFloat(bcv.tasa).toFixed(2)}
                  </div>
                )}
                <div>
                  <label className={labelCls}>{t('pay_modal_method')}</label>
                  <select value={form.metodo_pago} onChange={e => setForm(f => ({ ...f, metodo_pago: e.target.value }))} className={inputCls}>
                    <option value="transferencia">Transferencia</option>
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="zelle">Zelle</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('pay_modal_ref')}</label>
                  <input type="text" placeholder="00012345678" value={form.referencia} onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))} className={inputCls} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition">{t('cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">{saving ? t('pay_modal_saving') : t('pay_modal_submit')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {comprobanteModal !== null && <ComprobanteModal url={comprobanteModal} onClose={() => setComprobanteModal(null)} t={t} />}
    </div>
  );
}
