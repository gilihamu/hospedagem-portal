import type { ReactNode, ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ListChecks,
  ExternalLink,
  Calendar,
  Building2,
} from 'lucide-react';
import { ROUTES } from '../../../router/routes';
import { cn } from '../../../utils/cn';

// ── Sumário (índice lateral) ───────────────────────────────────────────────
const TOC = [
  { id: 'visao-geral', label: 'Como funciona' },
  { id: 'antes', label: 'Antes de começar' },
  { id: 'importar', label: '1. Importar da Airbnb' },
  { id: 'exportar', label: '2. Exportar para a Airbnb' },
  { id: 'verificar', label: 'Como verificar' },
  { id: 'limites', label: 'Boas práticas e limites' },
  { id: 'problemas', label: 'Problemas comuns' },
  { id: 'api', label: 'Integração completa (API)' },
];

// ── Helpers de apresentação ─────────────────────────────────────────────────
function Section({ id, icon: Icon, title, children }: { id: string; icon: ElementType; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 card-base p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-4">
        <Icon className="w-5 h-5 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <div className="text-sm text-neutral-600 leading-relaxed pt-0.5">{children}</div>
    </li>
  );
}

function Callout({ tone, icon: Icon, children }: { tone: 'info' | 'warning' | 'success'; icon: ElementType; children: ReactNode }) {
  const tones: Record<typeof tone, string> = {
    info: 'bg-info-light text-info-dark',
    warning: 'bg-warning-light text-warning-dark',
    success: 'bg-success-light text-success-dark',
  };
  return (
    <div className={cn('flex items-start gap-2 p-3 rounded-lg text-sm', tones[tone])}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[0.8em] font-mono break-all">{children}</code>;
}

// ── Página ──────────────────────────────────────────────────────────────────
export function HelpPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-neutral-400 mb-1">
          <HelpCircle className="w-4 h-4" /> Central de Ajuda
        </div>
        <h1 className="text-2xl font-bold text-neutral-800">Integração com a Airbnb</h1>
        <p className="text-neutral-500 mt-1 max-w-2xl">
          Conecte o calendário do seu anúncio na Airbnb ao HospedaBR para que as datas ocupadas se bloqueiem
          automaticamente nos dois lados e você evite reservas duplicadas. Leva poucos minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        {/* Conteúdo */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Como funciona */}
          <Section id="visao-geral" icon={RefreshCw} title="Como funciona">
            <p className="text-sm text-neutral-600 leading-relaxed mb-4">
              A conexão usa <strong>calendário iCal</strong> — o formato universal que a Airbnb (e a maioria dos
              canais) entende. A grande vantagem é que <strong>não exige aprovação nem parceria</strong> com a
              Airbnb: funciona com qualquer anúncio, na hora.
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed mb-4">
              A sincronização tem <strong>dois sentidos</strong>, e o ideal é configurar os dois:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-surface-border p-4">
                <div className="flex items-center gap-2 font-semibold text-neutral-800 mb-1">
                  <ArrowDownToLine className="w-4 h-4 text-info" /> Importar
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Quando alguém reserva no seu anúncio da Airbnb, a data fica <strong>bloqueada</strong> aqui no
                  HospedaBR.
                </p>
              </div>
              <div className="rounded-lg border border-surface-border p-4">
                <div className="flex items-center gap-2 font-semibold text-neutral-800 mb-1">
                  <ArrowUpFromLine className="w-4 h-4 text-success" /> Exportar
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Quando você cria uma reserva ou bloqueio aqui, a data <strong>fecha</strong> na Airbnb.
                </p>
              </div>
            </div>
            <Callout tone="info" icon={Clock}>
              A sincronização <strong>não é instantânea</strong>. O HospedaBR lê o calendário da Airbnb a cada
              <strong> ~15 minutos</strong>; a Airbnb relê o nosso a cada algumas horas (intervalo definido por
              ela). Em períodos de alta demanda existe uma pequena janela em que a mesma data pode ser reservada
              nos dois lugares — confira as reservas logo após conectar.
            </Callout>
            <p className="text-sm text-neutral-500 leading-relaxed mt-4">
              O iCal troca <strong>apenas datas de disponibilidade</strong> — não transfere preços, dados do
              hóspede nem mensagens.
            </p>
          </Section>

          {/* Antes de começar */}
          <Section id="antes" icon={ListChecks} title="Antes de começar">
            <ul className="space-y-2">
              {[
                <>Tenha uma <strong>propriedade cadastrada</strong> no HospedaBR (Painel → Propriedades).</>,
                <>Tenha acesso de anfitrião ao <strong>anúncio na Airbnb</strong> que deseja conectar.</>,
                <>De preferência, use um <strong>computador</strong> — copiar e colar os links é mais fácil.</>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Callout tone="info" icon={Calendar}>
              No HospedaBR tudo acontece em <strong>Painel → Canais → aba “Calendário”</strong>. Lá, cada
              propriedade tem dois campos: <em>Importar da Airbnb</em> e <em>Exportar para a Airbnb</em>.
            </Callout>
          </Section>

          {/* Parte 1 — Importar */}
          <Section id="importar" icon={ArrowDownToLine} title="Passo 1 — Importar a Airbnb para o HospedaBR">
            <p className="text-sm text-neutral-500 mb-4">Traz as reservas e bloqueios da Airbnb para o seu calendário aqui.</p>

            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Na Airbnb</p>
            <ol className="space-y-3 mb-5">
              <Step n={1}>Acesse <Code>airbnb.com</Code> e entre como anfitrião.</Step>
              <Step n={2}>Vá em <strong>Anúncios</strong> e abra o anúncio desejado.</Step>
              <Step n={3}>Abra a aba <strong>Calendário</strong>.</Step>
              <Step n={4}>No painel à direita, em <strong>Disponibilidade</strong>, encontre <strong>Conectar calendários</strong> (ou “Sincronizar calendários”).</Step>
              <Step n={5}>Clique em <strong>Exportar calendário</strong>.</Step>
              <Step n={6}>Copie o link que termina em <Code>.ics</Code> — algo como <Code>https://www.airbnb.com/calendar/ical/….ics</Code>.</Step>
            </ol>

            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">No HospedaBR</p>
            <ol className="space-y-3 mb-4">
              <Step n={7}>Vá em <strong>Painel → Canais → aba “Calendário”</strong>.</Step>
              <Step n={8}>Na propriedade correspondente, cole o link no campo <strong>“Importar da Airbnb”</strong>.</Step>
              <Step n={9}>Clique em <strong>Salvar</strong>.</Step>
            </ol>
            <Callout tone="success" icon={CheckCircle2}>
              Pronto! Em até <strong>~15 minutos</strong> as datas ocupadas na Airbnb aparecem bloqueadas no
              calendário da propriedade no HospedaBR.
            </Callout>
          </Section>

          {/* Parte 2 — Exportar */}
          <Section id="exportar" icon={ArrowUpFromLine} title="Passo 2 — Exportar o HospedaBR para a Airbnb">
            <p className="text-sm text-neutral-500 mb-4">Impede que a Airbnb aceite reservas em datas já ocupadas aqui.</p>

            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">No HospedaBR</p>
            <ol className="space-y-3 mb-5">
              <Step n={1}>Na mesma aba <strong>“Calendário”</strong>, na mesma propriedade, localize o campo <strong>“Exportar para a Airbnb”</strong>.</Step>
              <Step n={2}>Clique em <strong>Copiar</strong> para copiar o link de exportação.</Step>
            </ol>

            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Na Airbnb</p>
            <ol className="space-y-3 mb-4">
              <Step n={3}>Volte para <strong>Calendário → Disponibilidade → Conectar calendários</strong>.</Step>
              <Step n={4}>Clique em <strong>Importar calendário</strong>.</Step>
              <Step n={5}>Cole o link copiado e dê um nome (ex.: <em>“HospedaBR”</em>).</Step>
              <Step n={6}>Confirme em <strong>Importar</strong>.</Step>
            </ol>
            <Callout tone="warning" icon={ShieldCheck}>
              O link de exportação é <strong>secreto e exclusivo</strong> da sua propriedade (contém um token de
              segurança). Não o publique nem compartilhe — quem tiver o link consegue ver as suas datas ocupadas.
            </Callout>
          </Section>

          {/* Verificar */}
          <Section id="verificar" icon={CheckCircle2} title="Como verificar se funcionou">
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-neutral-600">
                <ArrowDownToLine className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <span>
                  <strong>Importação:</strong> garanta uma reserva no anúncio da Airbnb e, após ~15 minutos,
                  veja a data bloqueada em <strong>Painel → Propriedades → (propriedade) → Calendário</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-neutral-600">
                <ArrowUpFromLine className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>
                  <strong>Exportação:</strong> bloqueie uma data aqui e confira algumas horas depois no
                  calendário da Airbnb — ela deve aparecer indisponível.
                </span>
              </li>
            </ul>
          </Section>

          {/* Limites */}
          <Section id="limites" icon={Info} title="Boas práticas e limites">
            <ul className="space-y-2">
              {[
                <><strong>Conecte os dois sentidos</strong> sempre. Só importar (ou só exportar) deixa um lado desprotegido contra dupla reserva.</>,
                <>O iCal <strong>não</strong> transfere preço, número de hóspedes, taxas nem mensagens — tarifas e regras continuam geridas em cada canal.</>,
                <>Para <strong>vários anúncios</strong>, repita o processo em cada propriedade: cada uma tem os seus próprios links.</>,
                <>A conexão com o <strong>Booking.com</strong> é separada (aba Canais → Conexões) e usa API — não confunda com o iCal da Airbnb.</>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Problemas */}
          <Section id="problemas" icon={AlertTriangle} title="Problemas comuns">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-surface-border">
                    <th className="py-2 pr-4 font-semibold">Sintoma</th>
                    <th className="py-2 pr-4 font-semibold">Causa provável</th>
                    <th className="py-2 font-semibold">O que fazer</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-600">
                  {[
                    ['As datas da Airbnb não bloqueiam aqui', 'Link de importação errado ou incompleto', <>Recopie o link “Exportar calendário” da Airbnb (precisa terminar em <Code>.ics</Code>) e salve de novo.</>],
                    ['As datas daqui não fecham na Airbnb', 'Import não cadastrado na Airbnb, ou o ciclo dela ainda não rodou', 'Confirme o “Importar calendário” na Airbnb e aguarde algumas horas.'],
                    ['Dupla reserva pontual', 'Janela entre os ciclos de sincronização', 'Confira as reservas logo após conectar; em alta demanda, monitore com mais atenção.'],
                    ['Mensagem “Cadastre uma propriedade…”', 'Nenhuma propriedade cadastrada no HospedaBR', 'Crie a propriedade primeiro, depois volte à aba Calendário.'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-surface-border last:border-0 align-top">
                      <td className="py-3 pr-4 font-medium text-neutral-700">{row[0]}</td>
                      <td className="py-3 pr-4 text-neutral-500">{row[1]}</td>
                      <td className="py-3">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* API */}
          <Section id="api" icon={Building2} title="Quer a integração completa?">
            <p className="text-sm text-neutral-600 leading-relaxed">
              A sincronização instantânea com troca de <strong>preços, mensagens e dados do hóspede</strong> exige
              a <strong>API oficial da Airbnb</strong>, disponível apenas para parceiros aprovados. Isso está no
              nosso roadmap. Se for prioridade para a sua operação, fale com o suporte.
            </p>
          </Section>
        </div>

        {/* Sumário lateral */}
        <aside className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-0 card-base p-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Neste guia</p>
            <ul className="space-y-0.5">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="block text-sm text-neutral-600 hover:text-primary rounded-md px-2 py-1.5 hover:bg-neutral-100 transition-colors">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              to={ROUTES.DASHBOARD_CHANNELS}
              className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-light transition-colors"
            >
              Abrir Canais <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
