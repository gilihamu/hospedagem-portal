# Hospedagem Portal

Portal web para gerenciamento de hospedagens, reservas e propriedades de acomodação.

## Visão Geral

O **Hospedagem Portal** é uma aplicação web moderna construída em React + TypeScript que permite:

- **Hóspedes**: Buscar e reservar propriedades (hotéis, pousadas, apartamentos, etc.)
- **Anfitriões (Hosts)**: Gerenciar propriedades, visualizar reservas e interagir com hóspedes
- **Administradores**: Supervisionar toda a plataforma, usuários e relatórios

## Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| React | 19.2.0 | Framework de UI |
| TypeScript | 5.9.3 | Tipagem estática |
| Vite | 7.3.1 | Build tool e dev server |
| TailwindCSS | 3.4.19 | Estilização |
| React Router | 7.13.1 | Roteamento SPA |
| TanStack Query | 5.90.21 | Gerenciamento de estado servidor |
| Zustand | 5.0.11 | Gerenciamento de estado global |
| React Hook Form | 7.71.2 | Gerenciamento de formulários |
| Zod | 4.3.6 | Validação de schemas |
| Recharts | 3.8.0 | Gráficos e visualizações |
| Lucide React | 0.577.0 | Ícones |

## Estrutura do Projeto

```
src/
├── assets/           # Imagens e recursos estáticos
├── components/       # Componentes reutilizáveis
│   ├── layout/       # Componentes de layout (Header, Footer, Sidebar)
│   ├── shared/       # Componentes compartilhados entre páginas
│   └── ui/           # Componentes de UI primitivos (Button, Input, Modal, etc.)
├── hooks/            # Custom hooks
├── mocks/            # Dados mockados para desenvolvimento
├── pages/            # Páginas da aplicação
│   ├── admin/        # Painel administrativo
│   ├── auth/         # Autenticação (Login, Registro)
│   ├── dashboard/    # Dashboard do anfitrião
│   ├── guest/        # Portal do hóspede
│   ├── messages/     # Sistema de mensagens
│   └── public/       # Páginas públicas (Home, Busca, Detalhes)
├── router/           # Configuração de rotas e guards
├── services/         # Serviços de API
├── store/            # Stores Zustand
├── types/            # Definições de tipos TypeScript
└── utils/            # Funções utilitárias
```

## Funcionalidades

### Área Pública
- **Home**: Página inicial com busca rápida e propriedades em destaque
- **Busca**: Filtros avançados (cidade, datas, número de hóspedes, tipo, preço, comodidades)
- **Detalhes da Propriedade**: Galeria de fotos, descrição, avaliações, reserva

### Autenticação
- Login com email/senha
- Registro de novos usuários
- Guards de autenticação e autorização por role

### Dashboard do Anfitrião
- **Visão Geral**: Métricas e resumo de atividades
- **Propriedades**: CRUD completo de propriedades
- **Filiais**: Gerenciamento de unidades/filiais
- **Reservas**: Lista e calendário de reservas
- **Analytics**: Gráficos e estatísticas
- **Guia do Hóspede**: Informações para hóspedes
- **Perfil**: Configurações da conta

### Painel Administrativo
- **Visão Geral**: Dashboard administrativo
- **Usuários**: Gerenciamento de usuários da plataforma
- **Propriedades**: Moderação de propriedades
- **Reservas**: Visão geral de todas as reservas
- **Relatórios**: Relatórios gerenciais

### Sistema de Mensagens
- Chat em tempo real entre hóspedes e anfitriões
- Histórico de conversas por reserva

## Tipos de Propriedade

- Hotel
- Pousada
- Hostel
- Apartamento
- Resort
- Chalé

## Roles de Usuário

| Role | Acesso |
|------|--------|
| `guest` | Busca, reservas, mensagens |
| `host` | Dashboard, gerenciamento de propriedades |
| `admin` | Painel administrativo completo |

## Componentes de UI

A aplicação possui uma biblioteca de componentes reutilizáveis:

- Avatar, Badge, Button, Card
- Checkbox, Switch, Select, Input, Textarea
- DateRangePicker, RangeSlider
- Modal, Toast, Tabs
- Table, Pagination
- Spinner, Skeleton, EmptyState
- FileUpload

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## Configuração de Cores

O projeto utiliza um sistema de cores customizado via Tailwind:

- **Primary**: Azul escuro (#1E3A5F) - Cor principal da marca
- **Accent**: Dourado (#D4A017) - Destaques e CTAs
- **Surface**: Tons de branco/cinza para backgrounds
- **Neutral**: Escala de cinzas para textos

## Integrações

O projeto possui serviços preparados para integração com:

- Autenticação (auth.service.ts)
- Propriedades (property.service.ts)
- Reservas (booking.service.ts)
- Mensagens (message.service.ts)
- Analytics (analytics.service.ts)
- Filiais (branch.service.ts)
- Canais externos (channel.service.ts)
- Guia do hóspede (guestGuide.service.ts)
- Usuários (user.service.ts)
- Negócios (business.service.ts)

## Estado da Aplicação

O gerenciamento de estado é feito com Zustand através de stores modulares:

- `auth.store.ts` - Autenticação e usuário logado
- `booking.store.ts` - Estado de reservas
- `chat.store.ts` - Estado do chat/mensagens
- `onboarding.store.ts` - Fluxo de onboarding
- `search.store.ts` - Filtros e resultados de busca
- `ui.store.ts` - Estado de UI (modais, sidebars, etc.)

## Requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:5173`
