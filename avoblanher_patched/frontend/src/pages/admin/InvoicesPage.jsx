import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import { useI18n } from '../../context/I18nContext';
import { FileText, Plus, X, Eye, Send, Building2, Filter, User, Loader2 } from 'lucide-react';

const EMPTY    = { user_id: '', company_id: '', descripcion: '', monto_ves: '', fecha_vencimiento: '' };
const STATUSES = ['', 'pendiente', 'vencida', 'mora', 'pagada', 'anulada'];

function isLast30Days(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600";
const labelCls = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

function InvoiceDetailModal({ invoice, clients, onClose, t }) {
  const [sending, setSending] = useState(false);
  const client    = clients.find(c => c.id === invoice.user_id);
  const isVencida = ['vencida', 'mora', 'pagada', 'anulada'].includes(invoice.status);

  const handleSend = async () => {
    setSending(true);
    try { await api.post(`/api/bot/notify/${invoice.id}`); alert(t('inv_notify_success')); onClose(); }
    catch (e) { alert(e.response?.data?.error || t('inv_notify_error')); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#13161e] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><FileText size={15} className="text-indigo-500" /> {t('inv_title')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-3">
          {[
            [t('inv_detail_client'),  client?.nombre || '—'],
            [t('inv_detail_email'),   client?.email  || '—'],
            [t('inv_detail_company'), invoice.empresa?.nombre || t('inv_detail_no_company')],
            [t('inv_detail_desc'),    invoice.descripcion || '—'],
            [t('inv_detail_amount'),  `Bs. ${parseFloat(invoice.monto_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
            [t('inv_detail_issued'),  invoice.fecha_emision],
            [t('inv_detail_due'),     invoice.fecha_vencimiento],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-white/[0.04] last:border-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t('inv_detail_status')}</span>
            <StatusBadge value={invoice.status} />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-between items-center gap-3">
  <button onClick={onClose}
    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition">
    {t('inv_detail_close')}
  </button>
  {/* 
  {!isVencida && (
    <button onClick={handleSend} disabled={sending}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
      {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Send size={14}/> {t('inv_detail_notify')}</>}
    </button>
  )} 
  */}
</div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { t } = useI18n();
  const [invoices, setInvoices]         = useState([]);
  const [clients, setClients]           = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [filter, setFilter]             = useState('');
  const [last30, setLast30]             = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [modal, setModal]               = useState(false);
  const [detailInv, setDetailInv]       = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [error, setError]               = useState('');
  const [saving, setSaving]             = useState(false);
  const [loading, setLoading]           = useState(true);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const INVOICES_LIMIT = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cli] = await Promise.all([
        api.get('/api/invoices', { params: filter ? { status: filter } : {} }),
        api.get('/api/auth/clients'),
      ]);
      setInvoices(inv.data); setClients(cli.data);
    } catch {}
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setInvoicesPage(1); }, [filter, last30, selectedClient]);

  useEffect(() => {
    if (!form.user_id || companiesMap[form.user_id]) return;
    api.get(`/api/companies/by-user/${form.user_id}`)
      .then(({ data }) => setCompaniesMap(p => ({ ...p, [form.user_id]: data })))
      .catch(() => setCompaniesMap(p => ({ ...p, [form.user_id]: [] })));
  }, [form.user_id]);

  const handleCreate = async (e) => {
  e.preventDefault(); setSaving(true); setError('');
  const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
  try {
    await Promise.all([
      api.post('/api/invoices', {
        user_id: form.user_id, company_id: form.company_id || null,
        descripcion: form.descripcion, monto_ves: parseFloat(form.monto_ves),
        fecha_vencimiento: form.fecha_vencimiento,
      }),
      minDelay,
    ]);
    setModal(false); setForm(EMPTY); load();
  } catch (err) { await minDelay; setError(err.response?.data?.error || t('inv_create_error')); }
  finally { setSaving(false); }
};

  const updateStatus = async (id, status) => {
    try { await api.patch(`/api/invoices/${id}/status`, { status }); load(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('inv_delete_confirm'))) return;
    try { await api.delete(`/api/invoices/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || t('inv_delete_error')); }
  };

  const empresasDeCliente = companiesMap[form.user_id] || [];

  const displayedInvoices = invoices.filter(inv => {
    const matches30Days = last30 ? isLast30Days(inv.fecha_emision) : true;
    const matchesClient = selectedClient ? inv.user_id === selectedClient : true;
    return matches30Days && matchesClient;
  });

  const invoicesTotal    = displayedInvoices.length;
  const startIndex       = (invoicesPage - 1) * INVOICES_LIMIT;
  const paginatedInvoices = displayedInvoices.slice(startIndex, startIndex + INVOICES_LIMIT);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText size={13} className="text-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">{t('inv_section_label')}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('inv_title')}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {invoicesTotal} {t('inv_invoices')}
                {last30 ? ` ${t('inv_subtitle_days')}` : ''}
                {selectedClient ? ` ${t('inv_subtitle_client')}` : ''}
              </p>
            </div>
            <button onClick={() => { setError(''); setForm(EMPTY); setModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
              <Plus size={15} /> {t('inv_new')}
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 p-4 bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              {STATUSES.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold transition capitalize ${
                    filter === s
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-[#f8fafc] dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                  }`}>
                  {s || t('inv_filter_all')}
                </button>
              ))}
              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
              <button onClick={() => setLast30(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition ${
                  last30
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-[#f8fafc] dark:bg-white/5 border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-500/40'
                }`}>
                <Filter size={10} /> {t('inv_filter_last30')}
              </button>
            </div>
            <div className="flex items-center gap-2 min-w-[280px]">
              <User size={14} className="text-slate-400 shrink-0" />
              <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0c10] text-slate-700 dark:text-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition">
                <option value="">{t('inv_filter_all_clients')}</option>
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
                        <th className="px-5 py-3">{t('inv_col_client')}</th>
                        <th className="px-5 py-3">{t('inv_col_amount')}</th>
                        <th className="px-5 py-3">{t('inv_col_issued')}</th>
                        <th className="px-5 py-3">{t('inv_col_due')}</th>
                        <th className="px-5 py-3">{t('inv_col_status')}</th>
                        <th className="px-5 py-3">{t('inv_col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map(inv => {
                        const cli = clients.find(c => c.id === inv.user_id);
                        return (
                          <tr key={inv.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{cli?.nombre || inv.user_id?.slice(0,8) || '—'}</p>
                              {inv.empresa && <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Building2 size={10}/>{inv.empresa.nombre}</p>}
                              {inv.descripcion && <p className="text-[11px] text-slate-400 mt-0.5">{inv.descripcion.slice(0,35)}</p>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">Bs. {parseFloat(inv.monto_ves).toLocaleString('es-VE',{minimumFractionDigits:2})}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{inv.fecha_emision}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{inv.fecha_vencimiento}</td>
                            <td className="px-5 py-3.5"><StatusBadge value={inv.status} /></td>
                            {inv.pagos?.length > 0 && inv.status !== 'pagada' && (
                              <td className="px-5 py-3.5 text-[11px] text-slate-400 italic" colSpan={1}>
                                {inv.pagos[0]?.concepto?.includes('abonó')
                                  ? inv.pagos[0].concepto
                                  : inv.pagos[0]?.concepto?.includes('administrador')
                                  ? t('inv_by_admin')
                                  : ''}
                              </td>
                            )}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button onClick={() => setDetailInv(inv)}
                                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition font-semibold">
                                  <Eye size={11} /> {t('inv_view_btn')}
                                </button>
                                {inv.status === 'pendiente' && (
                                  <button onClick={() => updateStatus(inv.id, 'anulada')}
                                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition">
                                    {t('inv_void_btn')}
                                  </button>
                                )}
                                {inv.status === 'vencida' && (
                                  <button onClick={() => updateStatus(inv.id, 'mora')}
                                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition">
                                    {t('inv_mora_btn')}
                                  </button>
                                )}
                                <button onClick={() => handleDelete(inv.id)}
                                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition">
                                  {t('inv_delete_btn')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {invoicesTotal === 0 && (
                        <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">{t('inv_empty')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {invoicesTotal > INVOICES_LIMIT && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#13161e]">
                    <span className="text-[11px] text-slate-400">
                      {t('inv_showing')} {paginatedInvoices.length} {t('inv_of')} {invoicesTotal} {t('inv_invoices')}
                    </span>
                    <div className="flex gap-2">
                      <button disabled={invoicesPage <= 1} onClick={() => setInvoicesPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        {t('inv_prev')}
                      </button>
                      <span className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {t('inv_page')} {invoicesPage}
                      </span>
                      <button disabled={invoicesPage * INVOICES_LIMIT >= invoicesTotal} onClick={() => setInvoicesPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        {t('inv_next')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal nueva factura */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#13161e] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white">{t('inv_new')}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"><X size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">{error}</div>}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={labelCls}>{t('inv_modal_client')}</label>
                  <select required value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value, company_id: '' }))} className={inputCls}>
                    <option value="">{t('inv_modal_client_ph')}</option>
                    {clients.filter(c => c.activo !== false).map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.email}</option>)}
                  </select>
                </div>
                {form.user_id && (
                  <div>
                    <label className={labelCls}>{t('inv_modal_company')} <span className="normal-case font-normal text-slate-300 dark:text-slate-600">{t('inv_modal_company_opt')}</span></label>
                    {empresasDeCliente.length === 0
                      ? <p className="text-[12px] text-slate-400 italic px-1">{t('inv_modal_no_companies')}</p>
                      : <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} className={inputCls}>
                          <option value="">{t('inv_modal_no_company_opt')}</option>
                          {empresasDeCliente.filter(e => e.activo).map(e => <option key={e.id} value={e.id}>{e.nombre} — {e.rif}</option>)}
                        </select>
                    }
                  </div>
                )}
                <div>
                  <label className={labelCls}>{t('inv_modal_desc')}</label>
                  <input type="text" required value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder={t('inv_modal_desc_ph')} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t('inv_modal_amount')}</label>
                    <input type="number" required min="0" step="0.01" placeholder="150000.00" value={form.monto_ves} onChange={e => setForm(f => ({ ...f, monto_ves: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('inv_modal_due_date')}</label>
                    <input type="date" required value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition">{t('cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">{saving ? t('inv_modal_saving') : t('inv_modal_submit')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {saving && (
  <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center">
    <div className="bg-white dark:bg-slate-900 rounded-2xl px-8 py-7 flex flex-col items-center gap-3 shadow-xl">
      <Loader2 size={32} className="animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('inv_modal_saving')}</p>
    </div>
  </div>
)}

{detailInv && <InvoiceDetailModal invoice={detailInv} clients={clients} onClose={() => setDetailInv(null)} t={t} />}
    </div>
  );
}
