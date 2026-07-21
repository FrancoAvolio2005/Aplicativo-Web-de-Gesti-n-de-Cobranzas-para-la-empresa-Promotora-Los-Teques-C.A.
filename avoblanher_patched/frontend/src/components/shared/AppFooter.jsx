import React, { useState, useEffect } from 'react';
import { Mail, Phone, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

// ── Modal de información ──────────────────────────────────────────────────────
function FooterModal({ type, onClose, t }) {
  const data = {
    terminos: {
      title: t('footer_terms'),
      content: (
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">
            {t('footer_last_update')}
          </p>
          <p>
            {t('footer_terms_intro')}{' '}
            <strong className="text-slate-800 dark:text-slate-200">Promotora Los Teques C.A.</strong>,{' '}
            {t('footer_terms_accept')}
          </p>
          <ul className="space-y-2 pl-4">
            {[
              t('footer_terms_1'),
              t('footer_terms_2'),
              t('footer_terms_3'),
              t('footer_terms_4'),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    privacidad: {
      title: t('footer_privacy'),
      content: (
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
          <p>{t('footer_privacy_intro')}</p>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
            <p className="text-indigo-700 dark:text-indigo-400 text-xs font-medium">
              {t('footer_privacy_ssl')}
            </p>
          </div>
          <p>
            <strong className="text-slate-700 dark:text-slate-300">{t('footer_privacy_use_label')}:</strong>{' '}
            {t('footer_privacy_use_desc')}
          </p>
        </div>
      ),
    },
    contacto: {
      title: t('footer_contact'),
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('footer_contact_desc')}</p>
          <div className="space-y-3">
            {[
              { icon: Mail,  color: 'indigo',  label: t('footer_contact_email'), value: 'promotoraltc.a@gmail.com' },
              { icon: Mail,  color: 'indigo',  label: t('footer_contact_email'), value: 'dev.franco2005@gmail.com' },
              { icon: Mail,  color: 'indigo',  label: t('footer_contact_email'), value: 'pgleybert@gmail.com' },
              { icon: Phone, color: 'emerald', label: t('footer_contact_phone'), value: '+58 422 150 48 21' },
            ].map(({ icon: Icon, color, label, value }) => (
              <div
                key={label}
                className={`flex items-center gap-4 p-4 rounded-xl bg-${color}-50 dark:bg-${color}-500/10 border border-${color}-100 dark:border-${color}-500/20`}
              >
                <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-center text-slate-400 italic">{t('footer_contact_hours')}</p>
        </div>
      ),
    },
  };

  const info = data[type];
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-[#13161e] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">{info.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-lg leading-none">✕</button>
        </div>
        <div className="p-6">{info.content}</div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition"
          >
            {t('footer_modal_close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Footer principal ──────────────────────────────────────────────────────────
export default function AppFooter() {
  const { t } = useI18n();
  const [modal, setModal] = useState(null);

  return (
    <>
      <footer className="bg-slate-900 dark:bg-[#06080b] border-t border-white/[0.06] py-10 px-6 md:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          
          {/* Marca con Logo Dinámico */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-transparent overflow-hidden flex items-center justify-center shrink-0 transition-colors">
                <img 
                  src="/images/logo1.jpg" 
                  alt="Logo Promotora Los Teques C.A" 
                  className="h-12 w-auto object-contain rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 dark:border-white/10 dark:invert dark:hue-rotate-180"
                />
              </div>
              <span className="font-bold text-white text-sm">Promotora Los Teques C.A.</span>
            </div>
            <p className="text-[13px] text-slate-500">{t('home_badge')}</p>
          </div>

          {/* Links */}
          <div className="flex gap-6">
            {['terminos', 'privacidad', 'contacto'].map((k) => (
              <button
                key={k}
                onClick={() => setModal(k)}
                className="text-[13px] text-slate-500 hover:text-white transition font-medium"
              >
                {k === 'terminos' ? t('footer_terms') : k === 'privacidad' ? t('footer_privacy') : t('footer_contact')}
              </button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-white/[0.06] text-[11px] text-slate-600">
          © 2026 Promotora Los Teques C.A.
        </div>
      </footer>

      {modal && <FooterModal type={modal} onClose={() => setModal(null)} t={t} />}
    </>
  );
}