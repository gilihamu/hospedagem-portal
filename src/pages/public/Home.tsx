import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Calendar, BarChart3, MessageSquare, CreditCard, Users,
  Zap, Shield, Globe, ArrowRight, Check, Star, ChevronDown, ChevronUp,
  Smartphone, Bot, FileText, TrendingUp, Repeat, BellRing, MapPin,
  Layers, Sparkles, Lock, HeartHandshake, Play, Quote,
} from 'lucide-react';
import { ROUTES } from '../../router/routes';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

interface Testimonial {
  name: string;
  role: string;
  city: string;
  avatar: string;
  rating: number;
  text: string;
}

interface FAQ {
  q: string;
  a: string;
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Gestão de Propriedades',
    description: 'Cadastre e gerencie múltiplas propriedades com fotos, descrições, comodidades e regras da casa em um só lugar.',
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Calendário Inteligente',
    description: 'Visualize reservas, bloqueios e disponibilidade em um calendário sincronizado com todos os seus canais.',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Channel Manager',
    description: 'Conecte Airbnb, Booking.com, Expedia, VRBO e mais. Evite conflitos de reservas com sincronização em tempo real.',
    badge: 'Destaque',
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: 'Chatbot Bia com IA',
    description: 'Assistente virtual 24/7 no WhatsApp e web. Responde dúvidas, envia instruções de check-in e escalona para você.',
    badge: 'Novo',
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Central de Mensagens',
    description: 'Todas as mensagens dos seus hóspedes em um único inbox. WhatsApp, e-mail e OTAs centralizados.',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Guia Digital do Hóspede',
    description: 'Crie guias personalizados com WiFi, check-in, regras, dicas locais e comparte com um link ou QR Code.',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Controle Financeiro',
    description: 'Registre despesas com OCR por foto, visualize fluxo de caixa e gere relatórios para declaração de IR.',
    badge: 'IA',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Analytics & Relatórios',
    description: 'Dashboard com receita, taxa de ocupação, avaliações e comparativos mensais. Tome decisões baseadas em dados.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Gestão de Hóspedes',
    description: 'Histórico completo de cada hóspede, preferências, avaliações e documentos armazenados com segurança.',
  },
  {
    icon: <Repeat className="w-6 h-6" />,
    title: 'Reservas Diretas',
    description: 'Receba reservas pelo seu próprio site com zero comissão. Portfólio com seu domínio personalizado.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Precificação Dinâmica',
    description: 'Atualize preços e mínimo de noites no calendário para alta e baixa temporada com poucos cliques.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Segurança & Conformidade',
    description: 'Dados criptografados, backups automáticos e conformidade com LGPD. Sua operação protegida.',
  },
];

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: 'R$ 97',
    period: '/mês',
    description: 'Ideal para anfitriões que estão começando com 1–3 propriedades.',
    features: [
      'Até 3 propriedades',
      'Calendário e reservas',
      'Guia digital do hóspede',
      'Central de mensagens',
      'Suporte por e-mail',
    ],
    cta: 'Começar gratuitamente',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$ 197',
    period: '/mês',
    description: 'Para anfitriões profissionais que querem crescer e automatizar.',
    features: [
      'Propriedades ilimitadas',
      'Channel Manager completo',
      'Chatbot Bia no WhatsApp',
      'Controle financeiro com OCR',
      'Analytics avançado',
      'Reservas diretas (site próprio)',
      'Suporte prioritário',
    ],
    cta: 'Assinar Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    description: 'Para administradoras e gestoras com múltiplas unidades.',
    features: [
      'Tudo do plano Pro',
      'Multi-empresa e multi-usuário',
      'API e integrações customizadas',
      'Onboarding dedicado',
      'SLA com suporte 24/7',
      'Relatórios personalizados',
    ],
    cta: 'Falar com consultor',
    highlighted: false,
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ana Paula Ferreira',
    role: 'Anunciante — 8 propriedades',
    city: 'Florianópolis, SC',
    avatar: 'AP',
    rating: 5,
    text: 'O HospedaBR transformou minha operação. Antes eu gerenciava tudo no WhatsApp e planilha. Hoje tenho tudo centralizado, recebo reservas automáticas e o chatbot responde meus hóspedes enquanto durmo.',
  },
  {
    name: 'Rodrigo Mendes',
    role: 'Gestor de Temporada — 22 unidades',
    city: 'Búzios, RJ',
    avatar: 'RM',
    rating: 5,
    text: 'O Channel Manager acabou com os overbookings. Antes eu tinha um pesadelo com Airbnb e Booking ao mesmo tempo. Agora o sistema sincroniza tudo na hora. O controle financeiro com OCR também é incrível.',
  },
  {
    name: 'Camila Souza',
    role: 'Anfitriã — 4 apartamentos',
    city: 'São Paulo, SP',
    avatar: 'CS',
    rating: 5,
    text: 'A Bia, o chatbot, é fantástica! Ela responde perguntas sobre check-in, WiFi e regras da casa automaticamente. Meus hóspedes adoram e eu economizo horas por semana. Vale cada centavo.',
  },
];

const FAQS: FAQ[] = [
  {
    q: 'Como funciona o período de testes gratuito?',
    a: 'Você tem 14 dias para testar o plano Pro completo sem precisar inserir cartão de crédito. Ao final do período, escolha o plano que melhor se encaixa na sua operação.',
  },
  {
    q: 'Consigo conectar o Airbnb e Booking.com ao mesmo tempo?',
    a: 'Sim! O Channel Manager suporta Airbnb, Booking.com, Expedia, VRBO e outros. A sincronização é bidirecional e em tempo real para evitar conflitos de reserva.',
  },
  {
    q: 'O chatbot Bia funciona no WhatsApp do meu negócio?',
    a: 'Sim. A Bia se conecta à API oficial do WhatsApp Business (Meta). Ela responde hóspedes automaticamente e só transfere para você quando não consegue resolver.',
  },
  {
    q: 'Posso migrar meus dados de outra plataforma?',
    a: 'Nossa equipe oferece suporte completo na migração de propriedades, reservas e hóspedes. Entre em contato e montamos um plano de migração sem interrupção da operação.',
  },
  {
    q: 'Os dados dos meus hóspedes ficam seguros?',
    a: 'Absolutamente. Todos os dados são criptografados em trânsito e em repouso, com backups automáticos diários. Estamos em total conformidade com a LGPD.',
  },
  {
    q: 'É possível ter mais de um usuário na conta?',
    a: 'No plano Pro você pode ter até 3 usuários (ideal para co-anfitriões). O plano Enterprise oferece usuários ilimitados com controle de permissões por função.',
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Badge({ children, variant = 'accent' }: { children: React.ReactNode; variant?: 'accent' | 'primary' | 'green' }) {
  const cls = {
    accent: 'bg-accent/10 text-accent-dark border border-accent/20',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    green: 'bg-success/10 text-success border border-success/20',
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center mb-4">
      <Badge variant="primary">
        <Sparkles className="w-3 h-3" />
        {children}
      </Badge>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-dark via-primary to-primary-light pt-16 pb-24 lg:pt-24 lg:pb-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="container-app relative text-center">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
          <Sparkles className="w-4 h-4 text-accent" />
          Novo: Chatbot Bia com IA generativa no WhatsApp
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto mb-6">
          A plataforma completa para{' '}
          <span className="text-accent">transformar</span>{' '}
          sua hospedagem em negócio
        </h1>

        <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
          Gerencie propriedades, sincronize canais, automatize a comunicação com hóspedes
          e controle suas finanças — tudo em um único lugar.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            to={ROUTES.REGISTER}
            className="w-full sm:w-auto bg-accent hover:bg-accent-light text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base"
          >
            Começar grátis — 14 dias
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#como-funciona"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 text-base"
          >
            <Play className="w-4 h-4" />
            Ver demonstração
          </a>
        </div>

        {/* Mock Dashboard */}
        <div className="relative max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-2xl">
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Mock browser bar */}
              <div className="bg-neutral-100 px-4 py-2.5 flex items-center gap-2 border-b border-neutral-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-neutral-400 text-center max-w-xs mx-auto border border-neutral-200">
                  app.hospedabr.com.br/dashboard
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-4 bg-surface-muted min-h-[240px] sm:min-h-[340px]">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Receita Mensal', value: 'R$ 18.450', trend: '+12%', color: 'text-success' },
                    { label: 'Reservas Ativas', value: '23', trend: '+3 hoje', color: 'text-primary' },
                    { label: 'Taxa de Ocupação', value: '87%', trend: '+5 p.p.', color: 'text-accent-dark' },
                    { label: 'Avaliação Média', value: '4.93 ★', trend: '128 avaliações', color: 'text-neutral-700' },
                  ].map((m) => (
                    <div key={m.label} className="bg-white rounded-xl p-3 border border-surface-border shadow-sm">
                      <p className="text-xs text-neutral-500 mb-1">{m.label}</p>
                      <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-success font-medium">{m.trend}</p>
                    </div>
                  ))}
                </div>
                {/* Mock calendar + chat */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 bg-white rounded-xl p-3 border border-surface-border shadow-sm">
                    <p className="text-xs font-semibold text-neutral-700 mb-2">Calendário — Próximas reservas</p>
                    <div className="space-y-1.5">
                      {[
                        { name: 'Carlos M.', prop: 'Apto Beira-Mar 302', date: 'Hoje — 3 noites', color: 'bg-primary' },
                        { name: 'Juliana S.', prop: 'Casa da Montanha', date: 'Amanhã — 5 noites', color: 'bg-accent' },
                        { name: 'Pedro A.', prop: 'Studio Centro', date: '15 Jan — 2 noites', color: 'bg-success' },
                      ].map((b) => (
                        <div key={b.name} className="flex items-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${b.color}`} />
                          <span className="font-medium text-neutral-800 w-20 truncate">{b.name}</span>
                          <span className="text-neutral-500 flex-1 truncate">{b.prop}</span>
                          <span className="text-neutral-400 shrink-0">{b.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-surface-border shadow-sm">
                    <p className="text-xs font-semibold text-neutral-700 mb-2">Bia — Chatbot IA</p>
                    <div className="space-y-2">
                      <div className="bg-neutral-100 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 rounded-tl-none">
                        Qual o código do WiFi? 🤔
                      </div>
                      <div className="bg-primary rounded-lg px-2.5 py-1.5 text-xs text-white rounded-tr-none ml-4">
                        Rede: HospedaBR_302 · Senha: casa2024 📶
                      </div>
                      <div className="bg-neutral-100 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 rounded-tl-none">
                        Obrigado! Que rápido 😊
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating badges */}
          <div className="absolute -left-4 top-12 bg-white rounded-xl px-3 py-2 shadow-xl border border-surface-border hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-800">Nova reserva!</p>
              <p className="text-xs text-neutral-500">Airbnb · Apto 302</p>
            </div>
          </div>
          <div className="absolute -right-4 bottom-16 bg-white rounded-xl px-3 py-2 shadow-xl border border-surface-border hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-800">+23% receita</p>
              <p className="text-xs text-neutral-500">vs. mês anterior</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 48V24C360 0 720 0 1080 24L1440 48H0Z" fill="#F8F9FA" />
        </svg>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '2.800+', label: 'Propriedades gerenciadas' },
    { value: '98.000+', label: 'Reservas processadas' },
    { value: '4,9★', label: 'Avaliação média na plataforma' },
    { value: '87%', label: 'Taxa de ocupação média' },
  ];

  return (
    <section className="bg-surface-muted py-10 border-b border-surface-border">
      <div className="container-app">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-1">{s.value}</p>
              <p className="text-sm text-neutral-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuePropsSection() {
  const props = [
    {
      icon: <Layers className="w-7 h-7 text-primary" />,
      title: 'Gestão Centralizada',
      description: 'Todas as suas propriedades, reservas, hóspedes e finanças em um único painel. Chega de planilhas e mensagens perdidas no WhatsApp.',
    },
    {
      icon: <Zap className="w-7 h-7 text-accent-dark" />,
      title: 'Automação Inteligente',
      description: 'Chatbot com IA, channel manager automático e envio de mensagens programadas. Trabalhe menos e hospede mais.',
    },
    {
      icon: <BarChart3 className="w-7 h-7 text-success" />,
      title: 'Decisões Baseadas em Dados',
      description: 'Dashboard em tempo real com receita, ocupação, tendências e comparativos. Saiba exatamente como sua operação está performando.',
    },
  ];

  return (
    <section className="py-20 bg-surface-muted">
      <div className="container-app">
        <SectionLabel>Por que HospedaBR?</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Tudo que você precisa para crescer
        </h2>
        <p className="text-center text-neutral-500 max-w-xl mx-auto mb-14">
          Desenvolvido por anfitriões para anfitriões. Cada funcionalidade foi pensada para resolver problemas reais do dia a dia da hospedagem.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {props.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl p-8 border border-surface-border shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">{p.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-20 bg-white">
      <div className="container-app">
        <SectionLabel>Funcionalidades</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Uma plataforma. Todas as ferramentas.
        </h2>
        <p className="text-center text-neutral-500 max-w-xl mx-auto mb-14">
          Do cadastro da propriedade até o relatório anual de receitas, o HospedaBR cobre toda a operação de hospedagem.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-surface-muted hover:bg-white border border-surface-border hover:border-primary/20 rounded-xl p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary/10 group-hover:bg-primary rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <span className="text-primary group-hover:text-white transition-colors">
                    {f.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-neutral-800">{f.title}</h3>
                    {f.badge && (
                      <Badge variant={f.badge === 'Novo' ? 'green' : f.badge === 'IA' ? 'accent' : 'primary'}>
                        {f.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChannelManagerSection() {
  const channels = [
    { name: 'Airbnb', color: '#FF5A5F', initial: 'A' },
    { name: 'Booking', color: '#003580', initial: 'B' },
    { name: 'Expedia', color: '#FFC72C', initial: 'E' },
    { name: 'VRBO', color: '#1D75B3', initial: 'V' },
    { name: 'Decolar', color: '#EF3B24', initial: 'D' },
    { name: 'TripAdvisor', color: '#00AA6C', initial: 'T' },
  ];

  return (
    <section className="py-20 bg-primary overflow-hidden">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <Badge variant="accent">
              <Globe className="w-3 h-3" />
              Channel Manager
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-5 leading-snug">
              Sincronize todos os canais.<br />Nunca mais perca uma reserva.
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Conecte Airbnb, Booking.com, Expedia, VRBO e mais de 10 portais em tempo real.
              O calendário atualiza automaticamente em todos os canais quando uma reserva chega —
              eliminando overbookings de uma vez por todas.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Sincronização bidirecional em segundos',
                'Regras de reserva por canal (mínimo de noites, taxa)',
                'Preços diferenciados por plataforma',
                'Notificação instantânea a cada nova reserva',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                  <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Conectar meus canais
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — visual */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
              {/* Center hub */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
              </div>
              {/* Channel logos */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {channels.map((ch) => (
                  <div
                    key={ch.name}
                    className="flex flex-col items-center gap-2 bg-white/10 rounded-xl p-3 border border-white/20"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: ch.color }}
                    >
                      {ch.initial}
                    </div>
                    <span className="text-white/80 text-xs font-medium">{ch.name}</span>
                    <div className="flex items-center gap-1 text-success text-xs font-semibold">
                      <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                      Ativo
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-success/20 border border-success/30 rounded-xl px-4 py-3 text-center">
                <p className="text-success text-sm font-semibold">✓ Nenhum conflito de reserva detectado</p>
                <p className="text-white/60 text-xs mt-0.5">Última sincronização: agora</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatbotSection() {
  return (
    <section id="chatbot" className="py-20 bg-surface-muted">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — chat mockup */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-xl border border-surface-border overflow-hidden max-w-sm mx-auto lg:mx-0">
              {/* WhatsApp-like header */}
              <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#075E54]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Bia — HospedaBR</p>
                  <p className="text-white/70 text-xs">Online agora</p>
                </div>
              </div>
              {/* Messages */}
              <div className="bg-[#ECE5DD] p-3 space-y-2 min-h-[280px]">
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-neutral-800">Olá! Pode me enviar o código de acesso? Chego às 23h 🙏</p>
                    <p className="text-xs text-neutral-400 text-right mt-0.5">22:47</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-3 py-2 max-w-[85%] shadow-sm">
                    <p className="text-sm text-neutral-800">Olá, Carlos! 😊 Boa chegada! Segue o acesso:</p>
                    <p className="text-sm text-neutral-800 mt-1">🏠 <strong>Portão:</strong> Código #1234<br />🔑 <strong>Porta:</strong> #5678<br />📶 <strong>WiFi:</strong> HospedaBR_302 / casa2024</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <p className="text-xs text-neutral-400">22:47</p>
                      <Check className="w-3 h-3 text-[#4FC3F7]" />
                      <Check className="w-3 h-3 text-[#4FC3F7] -ml-2" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-[75%] shadow-sm">
                    <p className="text-sm text-neutral-800">Perfeito! Que incrível 🤩</p>
                    <p className="text-xs text-neutral-400 text-right mt-0.5">22:48</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tr-none px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-sm text-neutral-800">Boa estada! Me avise se precisar de qualquer coisa 🏡✨</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <p className="text-xs text-neutral-400">22:48</p>
                      <Check className="w-3 h-3 text-[#4FC3F7]" />
                      <Check className="w-3 h-3 text-[#4FC3F7] -ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="order-1 lg:order-2">
            <Badge variant="accent">
              <Bot className="w-3 h-3" />
              Chatbot Bia
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-4 mb-5 leading-snug">
              Sua assistente virtual<br />que nunca dorme
            </h2>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              A Bia atende seus hóspedes 24/7 pelo WhatsApp e widget web. Ela responde perguntas,
              envia códigos de acesso, regras da casa, sugestões de restaurantes — e só te chama
              quando realmente precisa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: <Smartphone className="w-5 h-5" />, label: 'WhatsApp & Web Widget' },
                { icon: <FileText className="w-5 h-5" />, label: 'Leitura de documentos por OCR' },
                { icon: <BellRing className="w-5 h-5" />, label: 'Escalona para você quando precisa' },
                { icon: <MapPin className="w-5 h-5" />, label: 'Dicas personalizadas por propriedade' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-surface-border shadow-sm">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{item.label}</span>
                </div>
              ))}
            </div>
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Ativar a Bia agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinanceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="green">
              <CreditCard className="w-3 h-3" />
              Controle Financeiro
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-4 mb-5 leading-snug">
              Suas finanças na ponta<br />dos dedos — e do IR também
            </h2>
            <p className="text-neutral-500 mb-6 leading-relaxed">
              Fotografe o comprovante de qualquer despesa e a IA extrai os dados automaticamente.
              Visualize seu fluxo de caixa, categorize gastos e exporte relatórios prontos para
              a declaração de Imposto de Renda.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                { icon: <Zap className="w-4 h-4 text-accent-dark" />, text: 'OCR inteligente — foto de nota fiscal → dados preenchidos' },
                { icon: <BarChart3 className="w-4 h-4 text-primary" />, text: 'Fluxo de caixa mensal e anual por propriedade' },
                { icon: <FileText className="w-4 h-4 text-success" />, text: 'Relatórios exportáveis em PDF e Excel' },
                { icon: <TrendingUp className="w-4 h-4 text-neutral-600" />, text: 'Projeções de receita com base em histórico' },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-neutral-600">
                  <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Controlar minhas finanças
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — dashboard mock */}
          <div className="bg-surface-muted rounded-2xl p-5 border border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-neutral-800 text-sm">Fluxo de Caixa — Janeiro 2025</p>
              <Badge variant="green">+18% vs. dez</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Receita', value: 'R$ 24.800', color: 'text-success', bg: 'bg-success/10' },
                { label: 'Despesas', value: 'R$ 6.240', color: 'text-red-500', bg: 'bg-red-50' },
                { label: 'Lucro', value: 'R$ 18.560', color: 'text-primary font-bold', bg: 'bg-primary/10' },
              ].map((m) => (
                <div key={m.label} className={`${m.bg} rounded-xl p-3 text-center`}>
                  <p className="text-xs text-neutral-500 mb-1">{m.label}</p>
                  <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
            {/* Expense list mock */}
            <p className="text-xs font-semibold text-neutral-600 mb-2">Últimas despesas registradas</p>
            <div className="space-y-2">
              {[
                { icon: '🧹', desc: 'Serviço de limpeza', cat: 'Limpeza', val: '-R$ 320', date: 'Hoje' },
                { icon: '🔧', desc: 'Manutenção ar-cond.', cat: 'Manutenção', val: '-R$ 450', date: 'Ontem' },
                { icon: '💡', desc: 'Conta de energia', cat: 'Contas', val: '-R$ 185', date: '12 jan' },
              ].map((e) => (
                <div key={e.desc} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-surface-border">
                  <span className="text-base">{e.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-800">{e.desc}</p>
                    <p className="text-xs text-neutral-400">{e.cat} · {e.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-500">{e.val}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <button className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 mx-auto">
                <Zap className="w-3 h-3 text-accent-dark" />
                Escanear nova despesa com IA
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: <Building2 className="w-7 h-7 text-primary" />,
      title: 'Cadastre suas propriedades',
      description: 'Adicione fotos, descrição, comodidades, regras e preços. Pronto em menos de 15 minutos por propriedade.',
    },
    {
      step: '02',
      icon: <Globe className="w-7 h-7 text-accent-dark" />,
      title: 'Conecte seus canais',
      description: 'Vincule Airbnb, Booking.com e demais OTAs com um clique. Todas as reservas chegam centralizadas.',
    },
    {
      step: '03',
      icon: <Zap className="w-7 h-7 text-success" />,
      title: 'Automatize e cresça',
      description: 'Ative a Bia, configure mensagens automáticas e monitore tudo pelo dashboard. Foque no que importa: seus hóspedes.',
    },
  ];

  return (
    <section id="como-funciona" className="py-20 bg-surface-muted">
      <div className="container-app">
        <SectionLabel>Como funciona</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Pronto para operar em 3 passos
        </h2>
        <p className="text-center text-neutral-500 max-w-xl mx-auto mb-14">
          Setup rápido, sem burocracia. Nossa equipe te acompanha na configuração inicial.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-primary/10" />
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              <div className="bg-white rounded-2xl p-7 border border-surface-border shadow-sm h-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
                    {s.icon}
                  </div>
                  <span className="text-4xl font-bold text-primary/10">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-800 mb-2">{s.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{s.description}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-primary rounded-full items-center justify-center shadow-md">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="planos" className="py-20 bg-white">
      <div className="container-app">
        <SectionLabel>Planos e Preços</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Planos para todos os tamanhos
        </h2>
        <p className="text-center text-neutral-500 max-w-xl mx-auto mb-4">
          14 dias grátis em qualquer plano. Sem cartão de crédito. Cancele quando quiser.
        </p>
        <div className="flex justify-center mb-12">
          <div className="bg-success/10 border border-success/20 text-success text-xs font-semibold px-4 py-1.5 rounded-full">
            🎉 Plano Pro com 30% OFF nos 3 primeiros meses — até 31 de Janeiro
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-7 flex flex-col ${
                plan.highlighted
                  ? 'bg-primary border-primary shadow-2xl scale-105 relative'
                  : 'bg-white border-surface-border shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                    Mais popular
                  </span>
                </div>
              )}
              <p className={`text-sm font-semibold mb-2 ${plan.highlighted ? 'text-white/70' : 'text-neutral-500'}`}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-primary'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? 'text-white/60' : 'text-neutral-400'}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/70' : 'text-neutral-500'}`}>
                {plan.description}
              </p>
              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.highlighted ? 'bg-accent' : 'bg-success/20'
                    }`}>
                      <Check className={`w-2.5 h-2.5 ${plan.highlighted ? 'text-white' : 'text-success'}`} />
                    </div>
                    <span className={plan.highlighted ? 'text-white/85' : 'text-neutral-700'}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to={ROUTES.REGISTER}
                className={`w-full py-3 rounded-xl text-center font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-accent hover:bg-accent-light text-white shadow-lg'
                    : 'bg-primary/5 hover:bg-primary hover:text-white text-primary border border-primary/20'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-neutral-400 text-xs mt-8">
          Preços em BRL · Cobrado mensalmente · Cancele a qualquer momento
        </p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container-app">
        <SectionLabel>Depoimentos</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
          Anfitriões que já transformaram sua operação
        </h2>
        <p className="text-center text-white/60 max-w-xl mx-auto mb-14">
          Mais de 1.200 anfitriões usam o HospedaBR todos os dias para crescer com menos trabalho.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                <Quote className="w-5 h-5 text-accent opacity-80" />
              </div>
              <p className="text-white/85 text-sm leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.role}</p>
                  <p className="text-white/40 text-xs">{t.city}</p>
                </div>
                <div className="ml-auto">
                  <StarRating rating={t.rating} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust logos */}
        <div className="mt-14 pt-10 border-t border-white/10">
          <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-6">Integrado com os maiores portais do mundo</p>
          <div className="flex flex-wrap justify-center gap-6 items-center">
            {['Airbnb', 'Booking.com', 'Expedia', 'VRBO', 'Decolar', 'TripAdvisor', 'Google Vacation'].map((brand) => (
              <div key={brand} className="bg-white/10 border border-white/10 rounded-xl px-4 py-2">
                <span className="text-white/50 text-sm font-semibold">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-surface-muted">
      <div className="container-app max-w-3xl">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Perguntas frequentes
        </h2>
        <p className="text-center text-neutral-500 mb-12">
          Não encontrou o que procura?{' '}
          <a href="mailto:suporte@hospedabr.com.br" className="text-primary font-medium hover:underline">
            Fale com nosso time
          </a>
        </p>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="text-sm font-semibold text-neutral-800">{faq.q}</span>
                {openIdx === i
                  ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                }
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4 text-sm text-neutral-500 leading-relaxed border-t border-surface-border pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const benefits = [
    '14 dias grátis sem cartão',
    'Setup em menos de 1 hora',
    'Suporte em português',
    'Cancele quando quiser',
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary-dark via-primary to-accent-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="container-app relative text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-4 py-1.5 rounded-full mb-6">
          <HeartHandshake className="w-4 h-4 text-accent" />
          Junte-se a mais de 1.200 anfitriões
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
          Comece hoje.<br />Resultados desde a primeira semana.
        </h2>
        <p className="text-xl text-white/70 max-w-xl mx-auto mb-10">
          Cadastre-se em 2 minutos e descubra como o HospedaBR pode transformar sua gestão de hospedagem.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            to={ROUTES.REGISTER}
            className="w-full sm:w-auto bg-white text-primary hover:bg-neutral-100 font-bold px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-base"
          >
            Criar conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to={ROUTES.LOGIN}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all text-base"
          >
            Já tenho uma conta
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {benefits.map((b) => (
            <span key={b} className="flex items-center gap-1.5 text-white/70 text-sm">
              <Check className="w-4 h-4 text-success" />
              {b}
            </span>
          ))}
        </div>

        {/* Security badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
          {[
            { icon: <Lock className="w-4 h-4" />, text: 'SSL + Criptografia' },
            { icon: <Shield className="w-4 h-4" />, text: 'LGPD Compliant' },
            { icon: <HeartHandshake className="w-4 h-4" />, text: 'Suporte em PT-BR' },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-white/50 text-xs">
              {b.icon}
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export function HomePage() {
  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <ValuePropsSection />
      <FeaturesSection />
      <ChannelManagerSection />
      <ChatbotSection />
      <FinanceSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
