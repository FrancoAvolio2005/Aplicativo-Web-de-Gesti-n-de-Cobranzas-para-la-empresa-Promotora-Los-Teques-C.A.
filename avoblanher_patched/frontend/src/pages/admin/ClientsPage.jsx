import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import { useI18n } from '../../context/I18nContext';
import { Users, Search, Edit2, UserX, UserCheck, X, Building2, ChevronRight, ChevronDown, Plus } from 'lucide-react';

const EMPTY_COMPANY = { rif: '', nombre: '', direccion: '', user_id: '' };

function Modal({ title, onClose, children }) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-[#13161e] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-600";
const labelCls = "block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5";

export default function ClientsPage() {
  const { t } = useI18n();
  const [clients, setClients]       = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState({});
  const [companiesMap, setCompaniesMap] = useState({});
  const [companyModal, setCompanyModal] = useState(false);
  const [companyForm, setCompanyForm]   = useState(EMPTY_COMPANY);
  const [companyError, setCompanyError] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // Estados para la paginación de clientes
  const [clientsPage, setClientsPage]   = useState(1);
  const CLIENTS_LIMIT = 8;

  const loadClients = async () => {
    setLoading(true);
    try { const { data } = await api.get('/api/auth/clients'); setClients(data); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { loadClients(); }, []);

  // Resetear a la página 1 si el usuario escribe en el buscador
  useEffect(() => {
    setClientsPage(1);
  }, [search]);

  const handleToggleClientStatus = async (client) => {
    const action = client.activo !== false ? 'inactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${action} al cliente "${client.nombre}"?`)) return;
    try { await api.patch(`/api/auth/clients/${client.id}/toggle-status`); loadClients(); }
    catch (err) { alert(err.response?.data?.error || `Error al ${action} cliente`); }
  };

  const filteredClients = clients.filter(c =>
    !search ||
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Segmentación de clientes según la página actual
  const clientsTotal = filteredClients.length;
  const startIndex = (clientsPage - 1) * CLIENTS_LIMIT;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + CLIENTS_LIMIT);

  const loadCompanies = async (userId) => {
    try { const { data } = await api.get(`/api/companies/by-user/${userId}`); setCompaniesMap(p => ({ ...p, [userId]: data })); }
    catch { setCompaniesMap(p => ({ ...p, [userId]: [] })); }
  };

  const toggleExpand = (userId) => {
    const next = !expanded[userId];
    setExpanded(p => ({ ...p, [userId]: next }));
    if (next && !companiesMap[userId]) loadCompanies(userId);
  };

  const openCreateCompany = (client) => {
    setEditingCompany(null);
    setCompanyForm({ ...EMPTY_COMPANY, user_id: client.id });
    setCompanyError('');
    setCompanyModal(true);
  };
  const openEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyForm({ rif: company.rif, nombre: company.nombre, direccion: company.direccion || '', user_id: company.user_id });
    setCompanyError('');
    setCompanyModal(true);
  };
  const handleSaveCompany = async (e) => {
    e.preventDefault(); setSavingCompany(true); setCompanyError('');
    try {
      if (editingCompany) await api.put(`/api/companies/${editingCompany.id}`, companyForm);
      else await api.post('/api/companies', companyForm);
      setCompanyModal(false);
      loadCompanies(companyForm.user_id);
    } catch (err) { setCompanyError(err.response?.data?.error || 'Error al guardar empresa'); }
    finally { setSavingCompany(false); }
  };
  const handleToggleCompany = async (company) => {
    if (!window.confirm(company.activo ? '¿Desactivar esta empresa?' : '¿Activar esta empresa?')) return;
    try {
      if (company.activo) await api.patch(`/api/companies/${company.id}/deactivate`);
      else await api.patch(`/api/companies/${company.id}/activate`);
      loadCompanies(company.user_id);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      <Navbar />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">Gestión</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('clients_title')}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{clientsTotal} clientes registrados</p>
            </div>
            <button
              onClick={() => { setEditingCompany(null); setCompanyForm(EMPTY_COMPANY); setCompanyError(''); setCompanyModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
              <Building2 size={15} /> Registrar Empresa
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('clients_search')}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#13161e] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" />
          </div>

          {/* List */}
          <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : filteredClients.length === 0 ? (
              <p className="py-14 text-center text-sm text-slate-400">No se encontraron clientes</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {paginatedClients.map(c => (
                    <div key={c.id}>
                      {/* Client row */}
                      <div className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                        <button onClick={() => toggleExpand(c.id)}
                          className="p-1 text-slate-400 hover:text-indigo-500 transition flex-shrink-0">
                          {expanded[c.id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-indigo-700 dark:text-indigo-400 font-bold text-sm">{c.nombre?.[0]?.toUpperCase()}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{c.nombre}</p>
                          <p className="text-[12px] text-slate-400 truncate">{c.email}</p>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0
                          ${c.activo !== false
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                          {c.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openCreateCompany(c)} title="Agregar empresa"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => handleToggleClientStatus(c)}
                            className={`p-1.5 rounded-lg transition
                              ${c.activo !== false
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                            {c.activo !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Companies sub-row */}
                      {expanded[c.id] && (
                        <div className="bg-slate-50/60 dark:bg-white/[0.015] border-t border-slate-100 dark:border-white/[0.04]">
                          {!companiesMap[c.id] ? (
                            <p className="px-14 py-3 text-[12px] text-slate-400">Cargando...</p>
                          ) : companiesMap[c.id].length === 0 ? (
                            <p className="px-14 py-3 text-[12px] text-slate-400 italic">Sin empresas registradas</p>
                          ) : (
                            companiesMap[c.id].map(emp => (
                              <div key={emp.id} className="flex items-center gap-3 px-14 py-3 border-b border-slate-100 dark:border-white/[0.03] last:border-0 hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition">
                                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 size={13} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.nombre}</p>
                                  <p className="text-[11px] text-slate-400">RIF: {emp.rif}{emp.direccion && ` · ${emp.direccion}`}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0
                                  ${emp.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                  {emp.activo ? 'Activa' : 'Inactiva'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditCompany(emp)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"><Edit2 size={12} /></button>
                                  <button onClick={() => handleToggleCompany(emp)}
                                    className={`p-1.5 rounded-lg transition ${emp.activo ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                                    {emp.activo ? <UserX size={12} /> : <UserCheck size={12} />}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Paginación de Clientes */}
                {clientsTotal > CLIENTS_LIMIT && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-white dark:bg-[#13161e]">
                    <span className="text-[11px] text-slate-400">
                      Mostrando {paginatedClients.length} de {clientsTotal} clientes
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={clientsPage <= 1}
                        onClick={() => setClientsPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        ← Anterior
                      </button>
                      <span className="px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Pág. {clientsPage}
                      </span>
                      <button
                        disabled={clientsPage * CLIENTS_LIMIT >= clientsTotal}
                        onClick={() => setClientsPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-40 transition">
                        Siguiente →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {companyModal && (
        <Modal title={editingCompany ? 'Editar Empresa' : 'Registrar Empresa'} onClose={() => setCompanyModal(false)}>
          {companyError && <div className="mb-4 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm">{companyError}</div>}
          <form onSubmit={handleSaveCompany} className="space-y-4">
            {!editingCompany && (
              <div>
                <label className={labelCls}>Cliente propietario</label>
                <select required value={companyForm.user_id} onChange={e => setCompanyForm(f => ({ ...f, user_id: e.target.value }))}
                  className={inputCls}>
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.email}</option>)}
                </select>
              </div>
            )}
            <div><label className={labelCls}>RIF</label><input required placeholder="J-12345678-9" value={companyForm.rif} onChange={e => setCompanyForm(f => ({ ...f, rif: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Nombre de la empresa</label><input required placeholder="Empresa S.A." value={companyForm.nombre} onChange={e => setCompanyForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Dirección <span className="text-slate-300 dark:text-slate-600 normal-case font-normal">(opcional)</span></label><input placeholder="Av. Principal..." value={companyForm.direccion} onChange={e => setCompanyForm(f => ({ ...f, direccion: e.target.value }))} className={inputCls} /></div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setCompanyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition">
                Cancelar
              </button>
              <button type="submit" disabled={savingCompany}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
                {savingCompany ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}