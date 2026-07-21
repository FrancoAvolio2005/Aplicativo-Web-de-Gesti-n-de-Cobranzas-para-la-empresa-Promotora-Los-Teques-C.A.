import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../api/axios';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import { DollarSign, Clock, Users, Download, TrendingUp, ArrowUpRight, Zap, Activity, AlertTriangle, CheckCircle2, Bell, X, FileSpreadsheet, Receipt, CreditCard } from 'lucide-react';
import ExcelJS from 'exceljs';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#64748b'];

// ── AUXILIAR: DESCARGAR WORKBOOK ─────────────────────────────────────────────
const downloadExcel = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── 1. EXPORTAR REPORTE DE CLIENTES ──────────────────────────────────────────
const exportClientsExcel = async () => {
  try {
    const { data: clients } = await api.get('/api/auth/clients');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clientes');
    sheet.views = [{ showGridLines: true }];

    // Título
    sheet.mergeCells('B2:E2');
    const titleCell = sheet.getCell('B2');
    titleCell.value = 'REPORTE GENERAL DE CLIENTES';
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 36;

    // Subtítulo
    sheet.mergeCells('B3:E3');
    const subCell = sheet.getCell('B3');
    subCell.value = `Fecha de emisión: ${new Date().toLocaleDateString('es-VE')} | Avoblanher`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '64748B' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 20;

    // Encabezados
    const headers = ['Nombre', 'Correo Electrónico', 'Rol', 'Estado'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 26;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Filas
    clients.forEach((c, i) => {
      const row = sheet.getRow(6 + i);
      row.height = 22;
      const esActivo = c.activo !== false;
      const bgZebra = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      const vals = [c.nombre, c.email, (c.rol || 'cliente').toUpperCase(), esActivo ? 'ACTIVO' : 'INACTIVO'];

      vals.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 2);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgZebra } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colIdx < 2) cell.alignment = { horizontal: 'left', vertical: 'middle' };
        else if (colIdx === 2) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: esActivo ? '166534' : '991B1B' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: esActivo ? 'DCFCE7' : 'FEE2E2' } };
        }
      });
    });

    sheet.getColumn(1).width = 4;
    sheet.getColumn(2).width = 32;
    sheet.getColumn(3).width = 38;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 16;

    await downloadExcel(workbook, 'reporte_clientes_avoblanher');
  } catch (e) { alert('Error al exportar clientes: ' + e.message); }
};

// ── 2. EXPORTAR REPORTE DE FACTURAS ──────────────────────────────────────────
const exportInvoicesExcel = async () => {
  try {
    const [invRes, clientsRes] = await Promise.all([
      api.get('/api/invoices'),
      api.get('/api/auth/clients')
    ]);
    const invoices = invRes.data || [];
    const clients = clientsRes.data || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Facturas');
    sheet.views = [{ showGridLines: true }];

    // Título
    sheet.mergeCells('B2:F2');
    const titleCell = sheet.getCell('B2');
    titleCell.value = 'REPORTE DE FACTURAS EMITIDAS';
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D97706' } }; // Ámbar
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 36;

    // Subtítulo
    sheet.mergeCells('B3:F3');
    const subCell = sheet.getCell('B3');
    subCell.value = `Fecha de emisión: ${new Date().toLocaleDateString('es-VE')} | Avoblanher`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '64748B' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 20;

    // Encabezados
    const headers = ['Cliente', 'Descripción', 'Monto (Bs)', 'Fecha Vencimiento', 'Estado'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 26;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Filas
    invoices.forEach((inv, i) => {
      const cli = clients.find(c => c.id === inv.user_id);
      const nombreCli = cli?.nombre || `Cliente #${inv.user_id || 'N/A'}`;
      const row = sheet.getRow(6 + i);
      row.height = 22;
      const bgZebra = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

      const statusUpper = (inv.status || 'pendiente').toUpperCase();
      let statusBg = 'FEF3C7', statusFg = '92400E'; // Pendiente (Amarillo)
      if (['pagada', 'pagado'].includes(inv.status?.toLowerCase())) {
        statusBg = 'DCFCE7'; statusFg = '166534'; // Verde
      } else if (['vencida', 'mora'].includes(inv.status?.toLowerCase())) {
        statusBg = 'FEE2E2'; statusFg = '991B1B'; // Rojo
      }

      const vals = [nombreCli, inv.descripcion || 'Sin descripción', parseFloat(inv.monto_ves || 0), inv.fecha_vencimiento || 'N/A', statusUpper];

      vals.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 2);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgZebra } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colIdx === 0 || colIdx === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIdx === 2) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
        } else if (colIdx === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: statusFg } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
        }
      });
    });

    sheet.getColumn(1).width = 4;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 36;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 20;
    sheet.getColumn(6).width = 16;

    await downloadExcel(workbook, 'reporte_facturas_avoblanher');
  } catch (e) { alert('Error al exportar facturas: ' + e.message); }
};

// ── 3. EXPORTAR REPORTE DE PAGOS ─────────────────────────────────────────────
const exportPaymentsExcel = async () => {
  try {
    const [payRes, clientsRes] = await Promise.all([
      api.get('/api/payments'),
      api.get('/api/auth/clients')
    ]);
    const payments = payRes.data || [];
    const clients = clientsRes.data || [];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pagos');
    sheet.views = [{ showGridLines: true }];

    // Título
    sheet.mergeCells('B2:F2');
    const titleCell = sheet.getCell('B2');
    titleCell.value = 'REPORTE DE PAGOS RECIBIDOS';
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }; // Esmeralda
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 36;

    // Subtítulo
    sheet.mergeCells('B3:F3');
    const subCell = sheet.getCell('B3');
    subCell.value = `Fecha de emisión: ${new Date().toLocaleDateString('es-VE')} | Avoblanher`;
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '64748B' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 20;

    // Encabezados
    const headers = ['Cliente', 'Método de Pago', 'Monto (Bs)', 'Fecha de Pago', 'Referencia'];
    const headerRow = sheet.getRow(5);
    headerRow.height = 26;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Filas
    payments.forEach((p, i) => {
      const cli = clients.find(c => c.id === p.user_id);
      const nombreCli = cli?.nombre || `Cliente #${p.user_id || 'N/A'}`;
      const row = sheet.getRow(6 + i);
      row.height = 22;
      const bgZebra = i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

      const metodoFormatted = (p.metodo_pago || 'otro').replace('_', ' ').toUpperCase();
      const vals = [nombreCli, metodoFormatted, parseFloat(p.monto_ves || 0), p.fecha_pago || 'N/A', p.referencia || 'N/A'];

      vals.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 2);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '0F172A' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgZebra } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colIdx === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colIdx === 1 || colIdx === 3 || colIdx === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colIdx === 2) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.00';
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '047857' } };
        }
      });
    });

    sheet.getColumn(1).width = 4;
    sheet.getColumn(2).width = 30;
    sheet.getColumn(3).width = 22;
    sheet.getColumn(4).width = 18;
    sheet.getColumn(5).width = 18;
    sheet.getColumn(6).width = 22;

    await downloadExcel(workbook, 'reporte_pagos_avoblanher');
  } catch (e) { alert('Error al exportar pagos: ' + e.message); }
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#13161e] border border-slate-200/80 dark:border-white/[0.06] p-5 group hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300">
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${accent}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.replace('bg-gradient-to-r from-', 'bg-').split(' ')[0]}/10`}>
          <Icon size={18} className={accent.includes('indigo') ? 'text-indigo-500' : accent.includes('emerald') ? 'text-emerald-500' : accent.includes('amber') ? 'text-amber-500' : 'text-blue-500'} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={10} /> {trend}
          </span>
        )}
      </div>
      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1d27] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="text-slate-400 text-[11px] mb-1">{label}</p>
      <p className="font-bold text-slate-900 dark:text-white">Bs. {parseFloat(payload[0].value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { user }  = useAuth();
  const { t }     = useI18n();
  const [stats, setStats]       = useState({ clientes: 0, facturas: 0, pendienteVes: 0, pagosHoy: 0 });
  const [invoices, setInvoices] = useState([]);
  const [bcv, setBcv]           = useState(null);
  const [pieData, setPieData]   = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [metodosData, setMetodosData] = useState([]);
  const [topDeudores, setTopDeudores] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [nuevosPagos, setNuevosPagos]         = useState([]);
  const [showPagosBanner, setShowPagosBanner] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); // Estado para Modal de Exportación

  const load = useCallback(async () => {
    try {
      const [clients, inv, payments, rate, last7] = await Promise.all([
        api.get('/api/auth/clients'),
        api.get('/api/invoices'),
        api.get('/api/payments'),
        api.get('/api/currency/bcv'),
        api.get('/api/payments/last7days'),
      ]);
      const allInvoices = inv.data, allClients = clients.data, allPayments = payments.data;
      const pendientes  = allInvoices.filter(i => ['pendiente','vencida','mora'].includes(i.status));
      const totalDeuda  = pendientes.reduce((s, i) => s + parseFloat(i.monto_ves || 0), 0);
      const today       = new Date().toISOString().split('T')[0];
      const pagosHoy    = allPayments.filter(p => p.fecha_pago === today).length;
      setStats({ clientes: allClients.filter(c => c.activo !== false).length, facturas: allInvoices.length, pendienteVes: totalDeuda.toFixed(2), pagosHoy });
      setInvoices(allInvoices.slice(0, 6));
      const statusCount = {};
      allInvoices.forEach(i => { statusCount[i.status] = (statusCount[i.status] || 0) + 1; });
      setPieData(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

      // Métodos de pago
      const metodosCount = {};
      allPayments.forEach(p => { const m = p.metodo_pago || 'otro'; metodosCount[m] = (metodosCount[m] || 0) + 1; });
      setMetodosData(Object.entries(metodosCount).map(([name, value]) => ({ name: name.replace('_', ' '), value })));

      // Top deudores
      const deudaPorCliente = {};
      allInvoices.filter(i => ['pendiente','vencida','mora'].includes(i.status)).forEach(inv => {
        const cli = allClients.find(c => c.id === inv.user_id);
        const nombre = cli?.nombre?.split(' ')[0] || inv.user_id?.slice(0,8) || 'N/A';
        deudaPorCliente[nombre] = (deudaPorCliente[nombre] || 0) + parseFloat(inv.monto_ves || 0);
      });
      setTopDeudores(
        Object.entries(deudaPorCliente)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, monto]) => ({ name, monto: Math.round(monto) }))
      );

      setBcv(rate.data);
      setAreaData(last7.data || []);

      // ── Detectar pagos nuevos desde la última visita del admin ────────────
      const storageKey = `avob_admin_seen_payments_${user?.id || 'admin'}`;
      const seenRaw = localStorage.getItem(storageKey);
      const seenIds = seenRaw ? JSON.parse(seenRaw) : null;
      if (seenIds === null) {
        localStorage.setItem(storageKey, JSON.stringify(allPayments.map(p => p.id)));
      } else {
        const nuevos = allPayments.filter(p => !seenIds.includes(p.id)).map(p => {
  // 1. Intentar obtener el ID del usuario directamente o a través de la factura
  let userId = p.user_id ?? p.client_id ?? p.user?.id;

  if (!userId) {
    const invoiceId = p.invoice_id ?? p.factura_id ?? p.invoice?.id;
    const invoice = allInvoices.find(inv => String(inv.id) === String(invoiceId));
    if (invoice) {
      userId = invoice.user_id;
    }
  }

  // 2. Buscar el objeto del cliente correspondiente
  const cli = allClients.find(c => String(c.id) === String(userId));

  // 3. Obtener el nombre de la empresa probando las distintas fuentes posibles
  const nombreEmpresa = 
    p.empresa?.nombre || 
    p.empresa_nombre || 
    cli?.empresa?.nombre || 
    cli?.empresa || 
    cli?.nombre_empresa || 
    cli?.nombre || 
    (userId ? `Cliente #${userId}` : 'Empresa Desconocida');

  return { 
    ...p, 
    clienteNombre: nombreEmpresa 
  };
});
        if (nuevos.length > 0) {
          setNuevosPagos(nuevos);
          setShowPagosBanner(true);
          localStorage.setItem(storageKey, JSON.stringify(allPayments.map(p => p.id)));
        }
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] transition-colors">
      <Navbar />

      {/* Banner: Pagos nuevos recibidos */}
      {showPagosBanner && nuevosPagos.length > 0 && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-emerald-600 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2 flex-1 flex-wrap">
              <Bell size={15} className="mt-0.5 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide mr-1">
                {nuevosPagos.length === 1 ? t('dash_new_payment_single') : t('dash_new_payment_plural').replace('{n}', nuevosPagos.length)}
              </span>
              <div className="flex flex-wrap gap-2">
                {nuevosPagos.map(p => (
                  <span key={p.id} className="bg-emerald-500/40 rounded-lg px-2 py-0.5 text-xs font-semibold">
                    {p.clienteNombre}
                    {p.empresa?.nombre ? ` (${p.empresa.nombre})` : ''}
                    {' — '}Bs.&nbsp;{parseFloat(p.monto_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowPagosBanner(false)}
              className="p-1 hover:bg-emerald-500 rounded-lg transition flex-shrink-0"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <main className={`${showPagosBanner ? 'pt-28' : 'pt-20'} pb-12 px-4 md:px-6`}>
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={14} className="text-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-500 uppercase tracking-widest">{t('dash_title')}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('dash_welcome')}, <span className="text-indigo-600 dark:text-indigo-400">{user?.nombre?.split(' ')[0]}</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('es-VE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                {bcv && <span className="ml-3 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-semibold">BCV Bs. {parseFloat(bcv.tasa).toLocaleString('es-VE')}</span>}
              </p>
            </div>
            
            {/* Botón de Exportar abre el Modal */}
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
            >
              <Download size={15} /> Exportar
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
              label={t('dash_active_clients')} 
              value={stats.clientes}
              icon={Users} 
              accent="bg-gradient-to-r from-indigo-500 to-indigo-600" 
              trend={t('dash_trend_active')}
            />
            <KpiCard label={t('dash_invoices')} value={stats.facturas}
              icon={TrendingUp} accent="bg-gradient-to-r from-amber-400 to-amber-500" sub={t('dash_sub_total_issued')} />
            <KpiCard label={t('dash_pending')} value={`Bs. ${parseFloat(stats.pendienteVes || 0).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`}
              icon={Clock} accent="bg-gradient-to-r from-rose-400 to-rose-500" sub={t('dash_sub_to_collect')} />
            <KpiCard label={t('dash_payments_today')} value={stats.pagosHoy}
              icon={DollarSign} accent="bg-gradient-to-r from-emerald-400 to-emerald-500" sub={t('dash_sub_payments_today')} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Area chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{t('dash_cobros')}</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{t('dash_last7')}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Zap size={11} className="text-indigo-400" /> {t('dash_realtime')}
                </div>
              </div>
              {areaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={areaData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="monto" stroke="#6366f1" strokeWidth={2} fill="url(#colorMonto)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">{t('dash_no_collections')}</div>
              )}
            </div>

            {/* Pie chart */}
            <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{t('dash_invoice_status')}</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm mb-4">{t('dash_invoices')}</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-slate-500 dark:text-slate-400 capitalize">{d.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">{t('no_data')}</div>
              )}
            </div>
          </div>

          {/* Extra Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Métodos de pago - Bar chart */}
            <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Pagos</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Métodos de pago usados</p>
              </div>
              {metodosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={metodosData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" className="hidden dark:block" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" name="Pagos" fill="#6366f1" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-sm text-slate-400">Sin pagos registrados</div>
              )}
            </div>

            {/* Top deudores */}
            <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-5">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Cobranza</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Top 5 mayores deudores</p>
              </div>
              {topDeudores.length > 0 ? (
                <div className="space-y-3">
                  {topDeudores.map((d, i) => {
                    const max = topDeudores[0].monto;
                    const pct = Math.round((d.monto / max) * 100);
                    const colors = ['bg-rose-500','bg-orange-500','bg-amber-500','bg-yellow-400','bg-lime-400'];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{d.name}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Bs. {d.monto.toLocaleString('es-VE')}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full ${colors[i]} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-sm text-slate-400">
                  <div className="text-center">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                    <p>Sin deudas pendientes</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent invoices */}
          <div className="bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{t('dash_recent')}</p>
              <a href="/invoices" className="text-[12px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline">{t('dash_see_all')}</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/[0.04]">
                    <th className="px-5 py-3">{t('dash_col_client')}</th>
                    <th className="px-5 py-3">{t('dash_col_amount')}</th>
                    <th className="px-5 py-3">{t('dash_col_due')}</th>
                    <th className="px-5 py-3">{t('dash_invoice_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{inv.descripcion?.slice(0,35) || `Factura #${i+1}`}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Bs. {parseFloat(inv.monto_ves).toLocaleString('es-VE',{minimumFractionDigits:2})}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{inv.fecha_vencimiento}</span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge value={inv.status} /></td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">{t('dash_no_invoices')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL OPCIONES DE EXPORTACIÓN ──────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#13161e] border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Botón Cerrar */}
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              <X size={18} />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exportar Reportes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona el reporte Excel (.xlsx) a descargar</p>
              </div>
            </div>

            {/* Opciones */}
            <div className="space-y-3">
              {/* Opción 1: Clientes */}
              <button
                onClick={() => { exportClientsExcel(); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg group-hover:scale-105 transition-transform">
                    <Users size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reporte de Clientes</p>
                    <p className="text-[11px] text-slate-400">Directorio con datos, roles y estados</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </button>

              {/* Opción 2: Facturas Emitidas */}
              <button
                onClick={() => { exportInvoicesExcel(); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-amber-50/50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/30 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:scale-105 transition-transform">
                    <Receipt size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Facturas Emitidas</p>
                    <p className="text-[11px] text-slate-400">Detalle de montos, vencimientos y estatus</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </button>

              {/* Opción 3: Pagos */}
              <button
                onClick={() => { exportPaymentsExcel(); setShowExportModal(false); }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-105 transition-transform">
                    <CreditCard size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reporte de Pagos</p>
                    <p className="text-[11px] text-slate-400">Historial de montos, métodos y referencias</p>
                  </div>
                </div>
                <Download size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}