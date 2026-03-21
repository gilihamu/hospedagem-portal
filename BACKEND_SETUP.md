# Backend - HospedaBR

Documentação completa de setup, configuração e execução do backend da plataforma HospedaBR.

**Índice**
- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Setup Inicial](#setup-inicial)
- [Executando Localmente](#executando-localmente)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Serviços de Infraestrutura](#serviços-de-infraestrutura)
- [Integração com Frontend](#integração-com-frontend)
- [Docker & Deployment](#docker--deployment)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

O backend da HospedaBR é construído com uma **arquitetura de microserviços** em .NET 10, seguindo padrões de **Clean Architecture**, **CQRS** e inclusive **Domain-Driven Design (DDD)**. O sistema utiliza múltiplas tecnologias complementares para garantir escalabilidade, resiliência e observabilidade.

**Características principais:**
- ✅ Microserviços independentes e escaláveis
- ✅ API Gateway com Rate Limiting e Load Balancing (YARP)
- ✅ Arquitetura multi-tenant
- ✅ Dashboard administrativo integrado para Super Admin
- ✅ Mensageria assíncrona com RabbitMQ
- ✅ Cache distribuído com Redis
- ✅ Busca full-text com Meilisearch
- ✅ Observabilidade completa (OpenTelemetry, Jaeger, Seq)
- ✅ Containerização com Docker & Docker Compose

---

## Stack Tecnológica

| Categoria | Tecnologia | Versão | Propósito |
|-----------|------------|--------|-----------|
| **Runtime** | .NET | 10.0 | Framework principal |
| **API** | ASP.NET Core Minimal APIs | 10.0 | APIs REST eficientes |
| **Micro-ORM** | Dapper | 2.1+ | Acesso otimizado a dados |
| **Database** | PostgreSQL | 16+ | Banco de dados relacional |
| **Migrações** | DbUp | 5.x | Versionamento do schema |
| **Cache** | Redis | 7.x+ | Cache distribuído |
| **Message Broker** | RabbitMQ | 3.13+ | Mensageria assíncrona |
| **Busca** | Meilisearch | 1.x+ | Search full-text |
| **Storage** | MinIO | Latest | S3-compatible Storage |
| **API Gateway** | YARP | 2.x+ | Reverse proxy & routing |
| **Autenticação** | Keycloak | 24.x+ | Identity Provider |
| **Tracing** | OpenTelemetry + Jaeger | Latest | Distributed tracing |
| **Logs** | Seq | Latest | Log aggregation |
| **Monitoring** | Dashboard Custom | - | Métricas Super Admin |
| **Containers** | Docker + Compose | Latest | Containerização |
| **Orquestração** | Kubernetes | 1.29+ | Production (opcional) |

---

## Pré-requisitos

### Obrigatórios
- **[.NET 10 SDK](https://dotnet.microsoft.com/download)** (versão 10.0+)
- **[Git](https://git-scm.com/)** para clonar o repositório
- **[Docker](https://www.docker.com/products/docker-desktop)** & **Docker Compose** (para infraestrutura local)
- **[PostgreSQL](https://www.postgresql.org/)** 16+ (ou via Docker)

### Recomendados
- **[Visual Studio 2022](https://visualstudio.microsoft.com/)** ou **Visual Studio Code** com a extensão C#
- **[Postman](https://www.postman.com/)** ou **[Insomnia](https://insomnia.rest/)** para testar APIs
- **[DBeaver](https://dbeaver.io/)** ou pgAdmin para gerenciar PostgreSQL
- **[Docker Desktop](https://www.docker.com/products/docker-desktop)** para facilitar gerenciamento de containers

### Verificar Instalação

```bash
# Verificar .NET
dotnet --version

# Verificar Docker
docker --version
docker-compose --version

# Verificar Git
git --version
```

---

## Estrutura do Projeto

```
hospedabr-backend/
├── src/
│   ├── ApiGateway/
│   │   └── HospedaBR.ApiGateway/
│   │       ├── Program.cs
│   │       ├── appsettings.json
│   │       └── Routes/
│   │
│   └── Services/
│       ├── Identity/
│       │   ├── HospedaBR.Identity.API/
│       │   ├── HospedaBR.Identity.Application/
│       │   ├── HospedaBR.Identity.Domain/
│       │   └── HospedaBR.Identity.Infrastructure/
│       │
│       ├── Business/
│       │   ├── HospedaBR.Business.API/
│       │   ├── HospedaBR.Business.Application/
│       │   ├── HospedaBR.Business.Domain/
│       │   └── HospedaBR.Business.Infrastructure/
│       │
│       ├── Properties/
│       │   ├── HospedaBR.Properties.API/
│       │   ├── HospedaBR.Properties.Application/
│       │   ├── HospedaBR.Properties.Domain/
│       │   └── HospedaBR.Properties.Infrastructure/
│       │
│       ├── Bookings/
│       │   ├── HospedaBR.Bookings.API/
│       │   ├── HospedaBR.Bookings.Application/
│       │   ├── HospedaBR.Bookings.Domain/
│       │   └── HospedaBR.Bookings.Infrastructure/
│       │
│       ├── Channels/
│       ├── Messaging/
│       ├── Payments/
│       └── [outros serviços]
│
├── docker-compose.yml
├── Dockerfile
├── Directory.Build.props
└── README.md
```

---

## Setup Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-repo/hospedabr-backend.git
cd hospedabr-backend
```

### 2. Restaurar Dependências

```bash
dotnet restore
```

### 3. Iniciar Infraestrutura com Docker Compose

```bash
docker-compose up -d
```

Este comando inicializa:
- ✅ PostgreSQL (porta 5432)
- ✅ RabbitMQ (portas 5672, 15672)
- ✅ Redis (porta 6379)
- ✅ Seq (porta 5341)
- ✅ Meilisearch (porta 7700)
- ✅ MinIO (portas 9000, 9001)
- ✅ Keycloak (porta 8080)

### 4. Executar Migrações de Banco de Dados

```bash
# Usar DbUp ou ferramenta customizada para aplicar migrações
dotnet run --project src/DbMigration/HospedaBR.DbMigration
```

---

## Executando Localmente

### Opção 1: Execução Individual (Desenvolvimento)

Abra **múltiplos terminais** e execute cada serviço separadamente:

#### Terminal 1: API Gateway
```bash
cd src/ApiGateway/HospedaBR.ApiGateway
dotnet run
```
**Endpoints:**
- HTTP: http://localhost:5283
- HTTPS: https://localhost:7284

#### Terminal 2: Identity Service
```bash
cd src/Services/Identity/HospedaBR.Identity.API
dotnet run
```
**Porta:** 5001 (configurável em `launchSettings.json`)

#### Terminal 3: Business Service
```bash
cd src/Services/Business/HospedaBR.Business.API
dotnet run
```

#### Terminal 4: Properties Service
```bash
cd src/Services/Properties/HospedaBR.Properties.API
dotnet run
```

#### Terminal 5: Bookings Service
```bash
cd src/Services/Bookings/HospedaBR.Bookings.API
dotnet run
```

#### Serviços Adicionais (conforme necessário)
```bash
# Channels Service
cd src/Services/Channels/HospedaBR.Channels.API && dotnet run

# Messaging/Notifications Worker
cd src/Workers/HospedaBR.Messaging.Worker && dotnet run

# Analytics Processor
cd src/Workers/HospedaBR.Analytics.Worker && dotnet run
```

### Opção 2: Execução com Docker Compose (Produção-like)

```bash
# Build das imagens
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api-gateway

# Parar tudo
docker-compose down
```

---

## Variáveis de Ambiente

### Configurar localmente

Crie um arquivo `.env` na raiz do projeto (ou configure em `appsettings.Development.json`):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospedabr
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_CONNECTION=localhost:6379

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Meilisearch
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=your_api_key

# MinIO / S3
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=hospedabr-files

# Keycloak / Auth
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=hospedabr
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-secret

# Seq (Logs)
SEQ_URL=http://localhost:5341

# Jaeger (Tracing)
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# JWT
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_ISSUER=https://localhost:7284
JWT_AUDIENCE=hospedabr-api

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@hospedabr.com

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+55...

# Payment Gateway
PAYMENT_PROVIDER=stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Settings
ENVIRONMENT=Development
LOG_LEVEL=Information
ENABLE_SWAGGER=true
ENABLE_HEALTH_CHECKS=true
```

### Aplicar em appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=hospedabr;Username=postgres;Password=your_password;",
    "Redis": "localhost:6379"
  },
  "RabbitMq": {
    "Host": "localhost",
    "Port": 5672,
    "Username": "guest",
    "Password": "guest"
  },
  "Meilisearch": {
    "Url": "http://localhost:7700",
    "ApiKey": "your_api_key"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    },
    "Seq": {
      "Url": "http://localhost:5341"
    }
  }
}
```

---

## Banco de Dados

### PostgreSQL Setup

#### Localmente com Docker
```bash
docker run -d \
  --name postgres-hospedabr \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=hospedabr \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Conectar com psql
```bash
psql -h localhost -U postgres -d hospedabr
```

### Executar Migrações

```bash
# DbUp CLI ou customizado
dotnet run --project src/Database/HospedaBR.Database.Migrations

# Ou usando dotnet-ef (se aplicável)
dotnet ef database update --project src/Services/Business/HospedaBR.Business.Infrastructure
```

### Backup & Restore

```bash
# Backup
pg_dump -h localhost -U postgres hospedabr > backup.sql

# Restore
psql -h localhost -U postgres hospedabr < backup.sql
```

---

## Serviços de Infraestrutura

### RabbitMQ Management
- **URL:** http://localhost:15672
- **User:** guest
- **Password:** guest

Visualize filas, exchanges e monitoramento de mensagens.

### Redis Commander
```bash
npm install -g redis-commander
redis-commander
# Acessa http://localhost:8081
```

### Seq (Log Aggregation)
- **URL:** http://localhost:5341
- Visualize todos os logs centralizados
- Filtre por timestamp, level, serviço, etc.

### Jaeger (Distributed Tracing)
- **URL:** http://localhost:16686
- Rastreie requisições entre microserviços

### Meilisearch Admin
- **URL:** http://localhost:7700/admin
- Crie e gerencie índices de busca

### MinIO Console
- **URL:** http://localhost:9001
- **User:** minioadmin
- **Password:** minioadmin

### Keycloak Admin Console
- **URL:** http://localhost:8080/admin
- **User:** admin
- **Password:** (configure no docker-compose.yml)

---

## Integração com Frontend

### Frontend URL
```
http://localhost:5173 (Vite Dev Server)
```

### API Gateway URL (do Frontend)
```
http://localhost:5283/api
```

### Configurar CORS no API Gateway

No `Program.cs` do API Gateway:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

### .env do Frontend
```env
VITE_API_URL=http://localhost:5283/api
VITE_ENV=development
VITE_ENABLE_MOCKS=false # false = usar API real
```

### Testando Integração

```bash
# Terminal 1: Backend
cd backend && docker-compose up -d

# Terminal 2: Frontend
cd ./hospedagem-portal
npm install
npm run dev
```

Acesse http://localhost:5173 e teste as chamadas de API.

---

## Docker & Deployment

### Buildar Imagens Individuais

```bash
# API Gateway
docker build -t hospedabr/api-gateway:latest -f src/ApiGateway/Dockerfile .

# Identity Service
docker build -t hospedabr/identity-api:latest -f src/Services/Identity/Dockerfile .

# Etc...
```

### Docker Compose Full Stack

```bash
# Build + Up
docker-compose up -d --build

# Verificar status
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Remover tudo
docker-compose down -v
```

### Deployment em Kubernetes (Opcional)

```bash
# Gerar manifests
kubectl apply -f k8s/

# Verificar deployment
kubectl get pods -n hospedabr
kubectl describe pod <pod-name> -n hospedabr
```

---

## Troubleshooting

### Problema: PostgreSQL não conecta

**Solução:**
```bash
# Verificar se está rodando
docker ps | grep postgres

# Ver logs
docker logs postgres-hospedabr

# Reiniciar
docker restart postgres-hospedabr

# Ou remover e recriar
docker rm postgres-hospedabr
docker-compose up -d postgres
```

### Problema: RabbitMQ Management UI não abre

**Solução:**
```bash
# Aguardar inicialização (pode levar 30s)
sleep 30

# Tentar novamente http://localhost:15672
# Usar guest/guest se credenciais default
```

### Problema: Migrações falhando

**Solução:**
```bash
# Resetar banco (cuidado em produção!)
docker exec postgres-hospedabr psql -U postgres -c "DROP DATABASE hospedabr;"
docker exec postgres-hospedabr psql -U postgres -c "CREATE DATABASE hospedabr;"

# Re-executar migrações
dotnet run --project src/Database/HospedaBR.Database.Migrations
```

### Problema: Porta já em uso

**Solução:**
```bash
# Encontrar processo na porta (ex: 5283)
lsof -i :5283      # macOS/Linux
netstat -ano | findstr :5283  # Windows

# Matar processo
kill -9 <PID>      # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Problema: Serviço não encontra Cache/RabbitMQ

**Solução:**
```bash
# Verificar conectividade
ping redis              # dentro de container do docker-compose
docker-compose exec identity-api ping rabbitmq

# Revisar appsettings com variáveis corretas
# Usar nomes de serviço do docker-compose (não localhost)
```

### Health Checks

```bash
# API Gateway
curl http://localhost:5283/health

# Identity Service
curl http://localhost:5001/health

# ou via docker-compose
docker-compose ps  # mostra status de health
```

---

## Documentação Adicional

- **[Arquitetura Detalhada](./docs/BACKEND_ARCHITECTURE.md)** - Design, padrões, fluxos
- **[API Documentation](./docs/API.md)** - Endpoints, schemas, exemplos
- **[Performance Tuning](./docs/PERFORMANCE.md)** - Otimizações, benchmarks
- **[Security Guide](./docs/SECURITY.md)** - Autenticação, autorização, boas práticas

---

## Suporte & Contribuição

Para dúvidas ou problemas:
1. Consulte a [documentação completa](./docs/)
2. Abra uma [issue no repositório](https://github.com/seu-repo/issues)
3. Contate o time de backend

**Versão da Documentação:** 1.0.0 (atualizado em 2024)
