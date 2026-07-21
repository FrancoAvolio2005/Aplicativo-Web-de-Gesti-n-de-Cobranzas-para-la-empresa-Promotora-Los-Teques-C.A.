import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { 
  ArrowRight, Bot, Moon, Sun,
  ChevronLeft, ChevronRight, Compass, Eye, Layers, Globe,
  Target, TrendingUp, Brain, BellRing, Users, ShieldCheck,
  MessageSquare, X, HelpCircle
} from 'lucide-react';

import AppFooter from '../components/shared/AppFooter';
// Ya no hacemos import del logo aquí arriba porque está en la carpeta public

const CAROUSEL_IMAGES = [
  { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200" },
  { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" },
  { url: "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=1200" }
];

const FAQ_DATA = {
  es: [
    {
      q: "¿Qué servicios ofrecen?",
      a: "Servicios contables, administrativos y computarizados tanto para personas jurídicas como naturales en la región de los Altos Mirandinos."
    },
    {
      q: "¿Cómo puedo crear una cuenta?",
      a: "Puedes registrarte haciendo clic en el botón 'Crear cuenta' o 'Registrarse' en la parte superior."
    },
    {
      q: "¿Es seguro el sistema?",
      a: "Sí, contamos con altos estándares de seguridad y encriptación de datos para proteger tu información financiera."
    },
    {
      q: "¿Cómo contacto al soporte?",
      a: "Puedes contactarnos vía correo en promotoraltc.a@gmail.com o desde la sección de contacto en el pie de página."
    }
  ],
  en: [
    {
      q: "What services do you offer?",
      a: "We offer accounting, administrative, and computerized services for both legal and natural persons in the Los Altos Mirandinos region."
    },
    {
      q: "How can I create an account?",
      a: "You can register by clicking on the 'Create account' or 'Register' button at the top."
    },
    {
      q: "Is the system secure?",
      a: "Yes, we adhere to high security and data encryption standards to protect your financial information."
    },
    {
      q: "How do I contact support?",
      a: "You can contact us via email at promotoraltc.a@gmail.com or through the contact section in the footer."
    }
  ]
};

export default function LandingPage() {
  const { t, lang, toggleLang } = useI18n();
  const [dark, setDark] = useState(() => localStorage.theme === 'dark');
  const [activeSlide, setActiveSlide] = useState(0);

  // Estados para el Chatbot FAQ
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === CAROUSEL_IMAGES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          sender: 'bot',
          text: lang === 'es' 
            ? '¡Hola! 👋 Selecciona una de las preguntas frecuentes para ver su respuesta.' 
            : 'Hello! 👋 Select one of the frequently asked questions to see its answer.'
        }
      ]);
    }
  }, [lang]);

  const nextSlide = () => setActiveSlide(prev => (prev === CAROUSEL_IMAGES.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setActiveSlide(prev => (prev === CAROUSEL_IMAGES.length - 1 ? 0 : prev + 1));

  // Manejador al hacer clic en una pregunta
  const handleSelectFaq = (faq) => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: faq.q },
      { sender: 'bot', text: faq.a }
    ]);
  };

  const FEATURES = [
    { icon: Target, title: t('feat_1_title'), desc: t('feat_1_desc') },
    { icon: TrendingUp, title: t('feat_2_title'), desc: t('feat_2_desc') },
    { icon: Brain, title: t('feat_3_title'), desc: t('feat_3_desc') },
    { icon: BellRing, title: t('feat_4_title'), desc: t('feat_4_desc') },
    { icon: Users, title: t('feat_5_title'), desc: t('feat_5_desc') },
    { icon: ShieldCheck, title: t('feat_6_title'), desc: t('feat_6_desc') },
  ];

  const IDENTITY = [
    { icon: Compass, title: t('mission_title'), desc: t('mission_desc') },
    { icon: Eye, title: t('vision_title'), desc: t('vision_desc') },
    { icon: Layers, title: t('function_title'), desc: t('function_desc') }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] text-slate-900 dark:text-white transition-colors relative">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-10
        bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/[0.06]">
        
        {/* LOGO ACTUALIZADO AQUÍ CON RUTA DIRECTA A PUBLIC */}
        <div className="flex items-center gap-2.5">
  <img 
    src="/images/logo1.jpg" 
    alt="Logo Promotora Los Teques C.A" 
    className="h-12 w-auto object-contain rounded-lg bg-white p-0.5 shadow-sm border border-slate-100 dark:border-white/10 dark:invert dark:hue-rotate-180"
  />
  <span className="font-bold text-[13px] tracking-wide text-slate-800 dark:text-slate-100">
    Promotora Los Teques C.A.
  </span>
</div>

        <div className="flex items-center gap-3">
          <button onClick={() => setDark(d => !d)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button onClick={toggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition">
            <Globe size={13} />
            {lang === 'es' ? 'EN' : 'ES'}
          </button>

          <Link to="/login"
            className="px-5 py-1.5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
            {t('home_login')}
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-10 px-6 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-indigo-600/8 dark:bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <Bot size={11} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{t('home_badge')}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.08] mb-6">
                {lang === 'es' ? <>Automatiza tus<br/><span className="text-indigo-600">Deudas y Pagos</span></> : <>Recover your portfolio<br/><span className="text-indigo-600">with intelligence.</span></>}
              </h1>

              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
                {t('home_hero_desc')}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/login"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition shadow-xl shadow-indigo-500/25">
                  {t('home_hero_cta_1')} <ArrowRight size={15} />
                </Link>
                <Link to="/registro"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition">
                  {t('home_hero_cta_2')}
                </Link>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl h-[300px] md:h-[400px] bg-slate-100 dark:bg-slate-800">
              {CAROUSEL_IMAGES.map((img, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === activeSlide ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={img.url} alt="Slide" className="w-full h-full object-cover object-center" />
                </div>
              ))}
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition hover:bg-white/20">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition hover:bg-white/20">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-slate-50 dark:bg-[#0d0f14]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-2">{t('home_feat_badge')}</p>
            <h2 className="text-3xl font-black">{lang === 'es' ? <>Todo lo que necesitas<br/>para cobrar mejor.</> : <>Everything you need<br/>for better collection.</>}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-white dark:bg-[#13161e] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] p-6 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition">
                  <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-[15px]">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDENTIDAD ───────────────────────────────── */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">{t('id_title')}</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {IDENTITY.map((item, idx) => (
              <div key={idx} className="relative p-8 rounded-3xl bg-white dark:bg-[#13161e] border border-slate-200 dark:border-white/5 shadow-xl text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-black mb-4">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <ShieldCheck size={13} />
            <span className="text-[12px] font-semibold">{t('home_cta_badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-white">{t('home_cta_title')}</h2>
          <p className="text-indigo-100 mb-8 text-lg">{t('home_cta_desc')}</p>
          <Link to="/registro" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition shadow-2xl">
            {t('home_cta_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── CHATBOT DE PREGUNTAS FRECUENTES (SOLO SELECCIÓN) ─────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <MessageSquare size={20} />
          </button>
        ) : (
          <div className="w-[340px] sm:w-[380px] h-[480px] bg-white dark:bg-[#13161e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
            {/* Header Chat */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">
                    {lang === 'es' ? 'Asistente de Preguntas' : 'FAQ Assistant'}
                  </h3>
                  <span className="text-[10px] text-indigo-200">
                    {lang === 'es' ? 'En línea' : 'Online'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mensajes Chat y Opciones de Preguntas */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Lista de Preguntas Seleccionables */}
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <HelpCircle size={12} />
                  {lang === 'es' ? 'Selecciona una pregunta:' : 'Select a question:'}
                </p>
                <div className="flex flex-col gap-1.5">
                  {(FAQ_DATA[lang] || FAQ_DATA.es).map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectFaq(faq)}
                      className="text-left text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition"
                    >
                      {faq.q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie del Chat (Sin input de texto) */}
            <div className="p-3 border-t border-slate-200/80 dark:border-white/10 text-center bg-slate-50 dark:bg-[#0d0f14]">
              <p className="text-[11px] text-slate-400">
                {lang === 'es' ? 'Selecciona una pregunta para ver la respuesta.' : 'Select a question to view the answer.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER COMPONENT ─────────────────────────────────────────────── */}
      <AppFooter />

    </div>
  );
}