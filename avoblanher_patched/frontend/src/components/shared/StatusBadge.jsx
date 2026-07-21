import React from 'react';
import { useI18n } from '../../context/I18nContext';

const STYLES = {
  pendiente: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  vencida:   'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  mora:      'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400',
  pagada:    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  anulada:   'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  bajo:      'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  medio:     'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  alto:      'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  enviado:   'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  fallido:   'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400',
  admin:     'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  supervisor:'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
  operador:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  cliente:   'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

const I18N_MAP = {
  pendiente: 'status_pendiente',
  vencida:   'status_vencida',
  mora:      'status_mora',
  pagada:    'status_pagada',
  anulada:   'status_anulada',
  enviado:   'status_enviado',
  fallido:   'status_fallido',
  bajo:      'status_bajo',
  medio:     'status_medio',
  alto:      'status_alto',
};

export default function StatusBadge({ value }) {
  const { t } = useI18n();
  const cls   = STYLES[value] || 'bg-slate-100 text-slate-600';
  const label = I18N_MAP[value] ? t(I18N_MAP[value]) : value;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {label}
    </span>
  );
}
