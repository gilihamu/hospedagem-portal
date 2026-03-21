# HospedaBR - Portal de Hospedagem

Plataforma completa de gerenciamento de propriedades de hospedagem com suporte multi-tenant, integração com canais de distribuição, análise de dados e sistema de mensagens integrado.

**[🔗 Backend](https://github.com/seu-repo/hospedabr-backend)** | **[📚 Documentação](./docs/)** | **[🐛 Issues](https://github.com/seu-repo/issues)**

---

## 📋 Sumário

- [Características](#características)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Setup Rápido](#setup-rápido)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Frontend](#frontend)
- [Backend](#backend)
- [Desenvolvimento](#desenvolvimento)
- [Build & Deploy](#build--deploy)
- [Contribuindo](#contribuindo)

---

## ✨ Características

### Gerenciamento de Propriedades
- ✅ Cadastro e edição de propriedades
- ✅ Galeria de imagens com upload
- ✅ Amenidades e recursos customizáveis
- ✅ Preços dinâmicos por temporada

### Reservas (Bookings)
- ✅ Calendário interativo
- ✅ Bloqueio manual de datas
- ✅ Gestão de status de reservas
- ✅ Sistema de confirmação e comunicação

### Channels & Distribuição
- ✅ Integração com plataformas (Airbnb, Booking.com, etc.)
- ✅ Sincronização de calendários
- ✅ Centralizador de reservas
- ✅ Rate parity management

### Messaging & Comunicação
- ✅ Chat integrado com hóspedes
- ✅ Suporte a WhatsApp via Twilio
- ✅ Notificações automáticas
- ✅ Histórico de conversas

### Analytics & Insights
- ✅ Dashboard com KPIs
- ✅ Relatórios de ocupância
- ✅ Revenue analysis
- ✅ Guest analytics

### Multi-Tenant
- ✅ Isolamento de dados por tenant
- ✅ Gestão de usuários e permissões
- ✅ Branding customizável
- ✅ Dashboard Super Admin

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│           TypeScript + Vite + Tailwind + React Router           │
│              Hospedagem Portal - Interface Administrativa        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (YARP - .NET)                    │
│        Rate Limiting │ Auth │ Load Balancing │ CORS             │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────┬───────────┼──────────┬──────────┐
        ▼         ▼           ▼          ▼          ▼
    ┌────────┐┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Identity││Business│ │Property│ │Bookings│ │Channels│
    │Service ││Service │ │Service │ │Service │ │Service │
    └────────┘└────────┘ └────────┘ └────────┘ └────────┘
        │         │           │          │          │
        └─────────┴───────────┼──────────┴──────────┘
                              │
                    ┌─────────▼─────────┐
                    │   RabbitMQ Bus    │
                    │  Events & Sagas   │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐     ┌────────┐    ┌──────────┐
         │ Notif.  │     │ Payment│    │ Analytics│
         │ Worker  │     │Service │    │ Processor│
         └─────────┘     └────────┘    └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    ┌───────────────────┐
                    │   PostgreSQL      │
                    │       Redis       │
                    │   Meilisearch    │
                    │      MinIO       │
                    └───────────────────┘
```

### Fluxo de Dados
1. **Frontend** faz requisições HTTP para o API Gateway
2. **Gateway** roteia para o serviço apropriado
3. **Serviços** processam no banco de dados e publicam eventos
4. **RabbitMQ** distribui eventos para workers assíncronos
5. **Notificações** são enviadas via email/WhatsApp

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19.x | Library para UI |
| TypeScript | 5.9+ | Type safety |
| Vite | 7.x+ | Build tool |
| React Router | 7.x+ | Routing |
| TanStack Query | 5.x+ | State management async |
| Zustand | 5.x+ | Global state |
| Tailwind CSS | 3.4+ | Styling |
| React Hook Form | 7.x+ | Form management |
| Zod | 4.x+ | Validation |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| .NET | 10.0+ | Runtime |
| ASP.NET Core | 10.0+ | Framework web |
| Dapper | 2.1+ | ORM |
| PostgreSQL | 16+ | Database |
| RabbitMQ | 3.13+ | Message broker |
| Redis | 7.x+ | Cache |
| Meilisearch | 1.x+ | Search engine |
| MinIO | Latest | Object storage |
| OpenTelemetry | Latest | Observability |

---

## 🚀 Setup Rápido

### Pré-requisitos
- **Node.js** 18+ e **npm** 9+
- **.NET 10 SDK**
- **Docker** & **Docker Compose**
- **PostgreSQL** 16+

### 1️⃣ Frontend Setup

```bash
# Clonar repositório
git clone https://github.com/seu-repo/hospedagem-portal.git
cd hospedagem-portal

# Instalar dependências
npm install

# Criar .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:5283/api
VITE_ENV=development
VITE_ENABLE_MOCKS=false
EOF

# Iniciar dev server
npm run dev
```

Acesse: **http://localhost:5173**

### 2️⃣ Backend Setup

Consulte o [BACKEND_SETUP.md](./BACKEND_SETUP.md) para instruções completas.

```bash
# Breve resumo:
git clone https://github.com/seu-repo/hospedabr-backend.git
cd hospedabr-backend

# Iniciar infraestrutura
docker-compose up -d

# Restaurar e executar
dotnet restore
dotnet run --project src/ApiGateway/HospedaBR.ApiGateway
```

API Gateway: **http://localhost:5283**

---

## 📁 Estrutura do Projeto

```
hospedagem-portal/
├── src/
│   ├── assets/              # Imagens, ícones, fontes
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── shared/          # PropertyCard, BookingWidget, etc.
│   │   ├── dashboard/       # Componentes dashboard
│   │   ├── ui/              # Componentes de UI (Button, Input, etc.)
│   │   └── ErrorBoundary.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   ├── useProperties.ts
│   │   └── ...
│   ├── pages/               # Páginas/telas da aplicação
│   │   ├── admin/           # Pages admin
│   │   ├── auth/            # Login, Register
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── guest/           # Guest pages
│   │   ├── messages/        # Chat
│   │   └── public/          # Homepage
│   ├── services/            # API calls & business logic
│   │   ├── auth.service.ts  # Mock
│   │   ├── api-auth.service.ts  # Real API
│   │   ├── property.service.ts
│   │   ├── booking.service.ts
│   │   └── ...
│   ├── store/               # Zustand global state
│   │   ├── auth.store.ts
│   │   ├── booking.store.ts
│   │   └── ...
│   ├── types/               # TypeScript types & interfaces
│   ├── utils/               # Utility functions
│   ├── router/              # React Router setup
│   ├── lib/                 # API client config
│   ├── hooks/               # Custom hooks
│   ├── mocks/               # Mock data
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css
├── public/                  # Static files
├── docs/                    # Documentação
│   ├── BACKEND_ARCHITECTURE.md
│   ├── PROJETO.md
│   └── ...
├── .env.local          # Environments (não commitar)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── eslint.config.js
└── README.md
```

---

## 💻 Frontend

### Teknologias & Padrões

**Estado Global (Zustand):**
```typescript
// src/store/auth.store.ts
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
}));
```

**Custom Hooks:**
```typescript
// src/hooks/useAuth.ts
import { useAuthStore } from '@/store/auth.store';

export const useAuth = () => {
  const { user, isLoggedIn, login, logout } = useAuthStore();
  return { user, isLoggedIn, login, logout };
};
```

**API Service:**
```typescript
// src/services/property.service.ts
import { apiClient } from '@/lib/api';

export const propertyService = {
  getAll: () => apiClient.get('/properties'),
  getById: (id: string) => apiClient.get(`/properties/${id}`),
  create: (data) => apiClient.post('/properties', data),
};
```

### Componentes Principais

| Componente | Localização | Propósito |
|-----------|------------|----------|
| **PropertyCard** | `components/shared/` | Exibe propriedade |
| **BookingWidget** | `components/shared/` | Booking form |
| **Calendar** | `components/shared/` | Date range picker |
| **ChatBubble** | `components/shared/` | Mensagens |
| **DashboardTopBar** | `components/layout/` | Header |
| **AdminSidebar** | `components/layout/` | Navigation admin |
| **StatCard** | `components/shared/` | KPI card |

### Temas & Styling

- **Tailwind CSS** para componentes
- **CSS Modules** opcionais
- **Responsive** mobile-first
- **Dark mode** suportado (via Zustand + localStorage)

### Testando

```bash
# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

---

## 🔌 Backend

### Arquitetura Clean + CQRS

```
Service/
├── API/              # Endpoints (Minimal APIs)
├── Application/      # Commands, Queries, DTOs
├── Domain/           # Entities, Business Logic
└── Infrastructure/   # Database, External Services
```

### Exemplos

**Command (Create Property):**
```csharp
public class CreatePropertyCommand : IRequest<PropertyDto>
{
    public string Name { get; set; }
    public string Description { get; set; }
}

public class CreatePropertyCommandHandler 
    : IRequestHandler<CreatePropertyCommand, PropertyDto>
{
    public async Task<PropertyDto> Handle(
        CreatePropertyCommand request, 
        CancellationToken ct)
    {
        // Lógica de criar propriedade
        return propertyDto;
    }
}
```

**Endpoint:**
```csharp
app.MapPost("/properties", CreatePropertyEndpoint)
   .WithName("CreateProperty")
   .WithOpenApi();

async Task<IResult> CreatePropertyEndpoint(
    CreatePropertyCommand cmd,
    IMediator mediator)
{
    var result = await mediator.Send(cmd);
    return Results.Created($"/properties/{result.Id}", result);
}
```

Para mais detalhes, veja [BACKEND_SETUP.md](./BACKEND_SETUP.md).

---

## 👨‍💻 Desenvolvimento

### Workflow Local

#### Terminal 1: Frontend
```bash
cd hospedagem-portal
npm run dev
# http://localhost:5173
```

#### Terminal 2: Backend (API Gateway)
```bash
cd ../hospedabr-backend
docker-compose up -d        # Infraestrutura
dotnet run --project src/ApiGateway/HospedaBR.ApiGateway
# http://localhost:5283
```

#### Terminal 3: Backend (Identity Service)
```bash
dotnet run --project src/Services/Identity/HospedaBR.Identity.API
```

#### Terminal 4: Backend (Property Service)
```bash
dotnet run --project src/Services/Properties/HospedaBR.Properties.API
```

**Etc.** para outros serviços conforme necessário.

### Variáveis de Ambiente

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:5283/api
VITE_ENV=development
VITE_ENABLE_MOCKS=false
```

**Backend (appsettings.Development.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=hospedabr;..."
  },
  "Logging": {
    "LogLevel": { "Default": "Information" }
  }
}
```

### Scripts & Comandos

**Frontend:**
```bash
npm run dev          # Dev server
npm run build        # Build production
npm run preview      # Preview build localmente
npm run lint         # ESLint
```

**Backend:**
```bash
dotnet build         # Build solution
dotnet test          # Rodar testes
dotnet run           # Executar projeto
```

---

## 📦 Build & Deploy

### Frontend Build

```bash
npm run build
# Gera: dist/

# Servir localmente
npm run preview

# Deploy (exemplo: Vercel)
vercel deploy dist/
```

### Backend Build

```bash
dotnet publish -c Release -o ./publish

# Docker
docker build -t hospedabr/api-gateway:latest .
docker push hospedabr/api-gateway:latest
```

### Docker Compose Full Stack

```bash
docker-compose up -d --build

# Verificar
docker-compose ps

# Logs
docker-compose logs -f api-gateway

# Parar
docker-compose down -v
```

---

## 📚 Documentação

- **[Backend Setup](./BACKEND_SETUP.md)** - Setup e configuração do backend
- **[Backend Architecture](./docs/BACKEND_ARCHITECTURE.md)** - Design detalhado
- **[Projeto Overview](./docs/PROJETO.md)** - Visão geral do projeto
- **[Security](./docs/SECURITY.md)** - Boas práticas de segurança
- **[API Reference](./docs/API.md)** - Documentação de endpoints (Swagger)

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **Frontend:** ESLint + Prettier
- **Backend:** .NET conventions, StyleCop
- **Commits:** Conventional Commits (feat: | fix: | docs: | etc.)

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE).

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/seu-repo/issues)
- **Discussões:** [GitHub Discussions](https://github.com/seu-repo/discussions)
- **Email:** tech@hospedabr.com

---

**Versão:** 1.0.0  
**Última atualização:** Março 2026  
**Status:** Em Desenvolvimento

