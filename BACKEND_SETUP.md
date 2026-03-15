# Configuração do Backend - HospedaBR

## Pré-requisitos

1. **.NET 9 SDK** instalado
2. **Backend** clonado em `C:\src\hospedabr-backend`

## Executando o Backend

### 1. Inicie o API Gateway

```bash
cd C:\src\hospedabr-backend
dotnet run --project src/ApiGateway/HospedaBR.ApiGateway
```

O API Gateway estará disponível em:
- **HTTP**: http://localhost:5283
- **HTTPS**: https://localhost:7284

### 2. Inicie os serviços necessários

Em terminais separados:

```bash
# Identity Service (autenticação)
dotnet run --project src/Services/Identity/HospedaBR.Identity.API

# Business Service
dotnet run --project src/Services/Business/HospedaBR.Business.API

# Properties Service
dotnet run --project src/Services/Properties/HospedaBR.Properties.API

# Bookings Service
dotnet run --project src/Services/Bookings/HospedaBR.Bookings.API
```

## Executando o Frontend

```bash
cd C:\src\hospedagem-portal
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

## Arquitetura de Comunicação

```
Frontend (5173) --> API Gateway (5283) --> Microservices
                         |
                         +-> Identity API (/api/auth/*)
                         +-> Business API (/api/businesses/*)
                         +-> Properties API (/api/properties/*)
                         +-> Bookings API (/api/bookings/*)
```

## Variáveis de Ambiente

O arquivo `.env` configura a URL do backend:

```env
VITE_API_URL=http://localhost:5283/api
VITE_ENV=development
```

## Alternando entre Mock e API Real

Para usar a **API real**, importe de `api-auth.service.ts`:
```typescript
import { apiAuthService } from './services/api-auth.service';
```

Para usar **mocks locais**, continue usando:
```typescript
import { authService } from './services/auth.service';
```
