# Arquitetura Backend - HospedaBR

## Visão Geral

Arquitetura de microserviços em .NET 10 com Clean Architecture, CQRS, Dapper, PostgreSQL, RabbitMQ e Docker.

**Monitoramento Multi-Tenant**: Dashboard administrativo integrado na própria aplicação com acesso Super Admin para visualizar métricas, logs e status de todos os tenants.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND                                       │
│                            (React + TypeScript)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY (YARP)                                  │
│                    Rate Limiting │ Auth │ Load Balancing                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Identity   │ │   Business   │ │  Properties  │ │   Bookings   │ │   Channels   │
│   Service    │ │   Service    │ │   Service    │ │   Service    │ │   Service    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MESSAGE BUS (RabbitMQ)                              │
│                         Events │ Commands │ Sagas                                │
└─────────────────────────────────────────────────────────────────────────────────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Messaging   │ │   Analytics  │ │ Notification │ │ Integration  │ │   Payment    │
│   Service    │ │   Service    │ │   Worker     │ │   Worker     │ │   Service    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Stack Tecnológica

| Categoria | Tecnologia | Versão | Propósito |
|-----------|------------|--------|-----------|
| **Runtime** | .NET | 10.0 | Framework principal |
| **API** | ASP.NET Core Minimal APIs | 10.0 | APIs REST |
| **Micro-ORM** | Dapper | 2.1+ | Acesso a dados (alta performance) |
| **Database** | PostgreSQL | 16 | Banco relacional |
| **Migrations** | DbUp | 5.x | Migrações SQL |
| **Cache** | Redis | 7.x | Cache distribuído |
| **Message Broker** | RabbitMQ | 3.13 | Mensageria assíncrona |
| **Search** | Meilisearch | 1.x | Busca full-text |
| **Object Storage** | MinIO | Latest | Armazenamento de arquivos |
| **API Gateway** | YARP | 2.x | Reverse proxy |
| **Auth** | Keycloak | 24.x | Identity Provider |
| **Observability** | OpenTelemetry + Jaeger | Latest | Tracing distribuído |
| **Logs** | Seq | Latest | Agregação de logs |
| **Metrics** | In-App Dashboard | Custom | Monitoramento Super Admin |
| **Containers** | Docker + Docker Compose | Latest | Containerização |
| **Orchestration** | Kubernetes (opcional) | 1.29+ | Orquestração |

---

## Microserviços

### 1. Identity Service
**Responsabilidade**: Autenticação, autorização, gestão de usuários e tokens.

```
HospedaBR.Identity/
├── src/
│   ├── HospedaBR.Identity.API/
│   │   ├── Endpoints/
│   │   │   ├── AuthEndpoints.cs
│   │   │   ├── UserEndpoints.cs
│   │   │   └── TokenEndpoints.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── HospedaBR.Identity.Application/
│   │   ├── Commands/
│   │   │   ├── RegisterUser/
│   │   │   │   ├── RegisterUserCommand.cs
│   │   │   │   ├── RegisterUserCommandHandler.cs
│   │   │   │   └── RegisterUserCommandValidator.cs
│   │   │   ├── Login/
│   │   │   ├── RefreshToken/
│   │   │   └── ChangePassword/
│   │   ├── Queries/
│   │   │   ├── GetUserById/
│   │   │   └── GetUserByEmail/
│   │   ├── DTOs/
│   │   ├── Mappings/
│   │   └── Behaviors/
│   ├── HospedaBR.Identity.Domain/
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Role.cs
│   │   │   └── RefreshToken.cs
│   │   ├── ValueObjects/
│   │   │   ├── Email.cs
│   │   │   └── Password.cs
│   │   ├── Events/
│   │   │   ├── UserRegisteredEvent.cs
│   │   │   └── UserVerifiedEvent.cs
│   │   └── Interfaces/
│   └── HospedaBR.Identity.Infrastructure/
│       ├── Persistence/
│       │   ├── DbConnectionFactory.cs
│       │   └── Scripts/
│       │       └── Migrations/
│       ├── Repositories/
│       │   └── UserRepository.cs
│       ├── Services/
│       │   ├── JwtTokenService.cs
│       │   └── PasswordHasher.cs
│       └── Extensions/
└── tests/
    ├── HospedaBR.Identity.UnitTests/
    └── HospedaBR.Identity.IntegrationTests/
```

**Endpoints:**
- `POST /api/v1/auth/register` - Registro de usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/users/{id}` - Obter usuário
- `PUT /api/v1/users/{id}` - Atualizar usuário
- `POST /api/v1/auth/forgot-password` - Recuperar senha

---

### 2. Business Service
**Responsabilidade**: Cadastro e gestão de empresas/negócios.

```
HospedaBR.Business/
├── src/
│   ├── HospedaBR.Business.API/
│   │   ├── Endpoints/
│   │   │   ├── BusinessEndpoints.cs
│   │   │   └── OnboardingEndpoints.cs
│   │   └── Program.cs
│   ├── HospedaBR.Business.Application/
│   │   ├── Commands/
│   │   │   ├── CreateBusiness/
│   │   │   ├── UpdateBusiness/
│   │   │   ├── CompleteOnboarding/
│   │   │   └── UploadLogo/
│   │   ├── Queries/
│   │   │   ├── GetBusinessById/
│   │   │   ├── GetBusinessByOwner/
│   │   │   └── GetOnboardingStatus/
│   │   └── IntegrationEvents/
│   │       └── BusinessCreatedIntegrationEvent.cs
│   ├── HospedaBR.Business.Domain/
│   │   ├── Entities/
│   │   │   └── Business.cs
│   │   ├── ValueObjects/
│   │   │   ├── CNPJ.cs
│   │   │   ├── CPF.cs
│   │   │   └── Address.cs
│   │   ├── Enums/
│   │   │   └── BusinessType.cs
│   │   └── Events/
│   │       ├── BusinessCreatedEvent.cs
│   │       └── OnboardingCompletedEvent.cs
│   └── HospedaBR.Business.Infrastructure/
│       ├── Persistence/
│       ├── Repositories/
│       └── Services/
└── tests/
```

**Endpoints:**
- `POST /api/v1/businesses` - Criar empresa
- `GET /api/v1/businesses/{id}` - Obter empresa
- `PUT /api/v1/businesses/{id}` - Atualizar empresa
- `GET /api/v1/businesses/owner/{ownerId}` - Empresa por proprietário
- `POST /api/v1/businesses/{id}/logo` - Upload de logo
- `GET /api/v1/onboarding/status` - Status do onboarding
- `POST /api/v1/onboarding/complete` - Completar onboarding

---

### 3. Properties Service
**Responsabilidade**: Gestão de propriedades/acomodações e filiais.

```
HospedaBR.Properties/
├── src/
│   ├── HospedaBR.Properties.API/
│   │   ├── Endpoints/
│   │   │   ├── PropertyEndpoints.cs
│   │   │   ├── BranchEndpoints.cs
│   │   │   ├── AmenityEndpoints.cs
│   │   │   └── SearchEndpoints.cs
│   │   └── Program.cs
│   ├── HospedaBR.Properties.Application/
│   │   ├── Commands/
│   │   │   ├── CreateProperty/
│   │   │   ├── UpdateProperty/
│   │   │   ├── DeleteProperty/
│   │   │   ├── UploadImages/
│   │   │   ├── CreateBranch/
│   │   │   └── ImportFromChannel/
│   │   ├── Queries/
│   │   │   ├── GetPropertyById/
│   │   │   ├── SearchProperties/
│   │   │   ├── GetPropertiesByOwner/
│   │   │   ├── GetFeaturedProperties/
│   │   │   └── GetBranchesByProperty/
│   │   └── IntegrationEvents/
│   │       ├── PropertyCreatedIntegrationEvent.cs
│   │       └── PropertyImportedIntegrationEvent.cs
│   ├── HospedaBR.Properties.Domain/
│   │   ├── Entities/
│   │   │   ├── Property.cs
│   │   │   ├── Branch.cs
│   │   │   ├── PropertyImage.cs
│   │   │   ├── Review.cs
│   │   │   └── GuestGuide.cs
│   │   ├── ValueObjects/
│   │   │   ├── Address.cs
│   │   │   ├── PricePerNight.cs
│   │   │   └── Rating.cs
│   │   ├── Enums/
│   │   │   ├── PropertyType.cs
│   │   │   └── PropertyStatus.cs
│   │   └── Events/
│   └── HospedaBR.Properties.Infrastructure/
│       ├── Persistence/
│       ├── Repositories/
│       ├── Search/
│       │   └── MeilisearchService.cs
│       └── Storage/
│           └── MinioStorageService.cs
└── tests/
```

**Endpoints:**
- `POST /api/v1/properties` - Criar propriedade
- `GET /api/v1/properties/{id}` - Obter propriedade
- `PUT /api/v1/properties/{id}` - Atualizar propriedade
- `DELETE /api/v1/properties/{id}` - Deletar propriedade
- `GET /api/v1/properties/search` - Buscar propriedades
- `GET /api/v1/properties/owner/{ownerId}` - Propriedades por dono
- `GET /api/v1/properties/featured` - Propriedades em destaque
- `POST /api/v1/properties/{id}/images` - Upload de imagens
- `POST /api/v1/branches` - Criar filial
- `GET /api/v1/branches/property/{propertyId}` - Filiais por propriedade
- `GET /api/v1/properties/{id}/guest-guide` - Guia do hóspede
- `PUT /api/v1/properties/{id}/guest-guide` - Atualizar guia

---

### 4. Bookings Service
**Responsabilidade**: Gestão de reservas e calendário.

```
HospedaBR.Bookings/
├── src/
│   ├── HospedaBR.Bookings.API/
│   │   ├── Endpoints/
│   │   │   ├── BookingEndpoints.cs
│   │   │   ├── CalendarEndpoints.cs
│   │   │   └── AvailabilityEndpoints.cs
│   │   └── Program.cs
│   ├── HospedaBR.Bookings.Application/
│   │   ├── Commands/
│   │   │   ├── CreateBooking/
│   │   │   ├── ConfirmBooking/
│   │   │   ├── CancelBooking/
│   │   │   ├── CheckIn/
│   │   │   ├── CheckOut/
│   │   │   └── ImportBookingFromChannel/
│   │   ├── Queries/
│   │   │   ├── GetBookingById/
│   │   │   ├── GetBookingsByProperty/
│   │   │   ├── GetBookingsByGuest/
│   │   │   ├── GetCalendar/
│   │   │   └── CheckAvailability/
│   │   ├── Sagas/
│   │   │   └── BookingSaga.cs
│   │   └── IntegrationEvents/
│   │       ├── BookingCreatedIntegrationEvent.cs
│   │       ├── BookingConfirmedIntegrationEvent.cs
│   │       └── BookingCancelledIntegrationEvent.cs
│   ├── HospedaBR.Bookings.Domain/
│   │   ├── Entities/
│   │   │   ├── Booking.cs
│   │   │   ├── BookingGuest.cs
│   │   │   └── BlockedDate.cs
│   │   ├── ValueObjects/
│   │   │   ├── DateRange.cs
│   │   │   ├── ConfirmationCode.cs
│   │   │   └── BookingPrice.cs
│   │   ├── Enums/
│   │   │   └── BookingStatus.cs
│   │   └── Events/
│   │       ├── BookingCreatedEvent.cs
│   │       ├── BookingConfirmedEvent.cs
│   │       └── BookingCancelledEvent.cs
│   └── HospedaBR.Bookings.Infrastructure/
└── tests/
```

**Endpoints:**
- `POST /api/v1/bookings` - Criar reserva
- `GET /api/v1/bookings/{id}` - Obter reserva
- `GET /api/v1/bookings/code/{code}` - Obter por código
- `PUT /api/v1/bookings/{id}/confirm` - Confirmar reserva
- `PUT /api/v1/bookings/{id}/cancel` - Cancelar reserva
- `PUT /api/v1/bookings/{id}/checkin` - Check-in
- `PUT /api/v1/bookings/{id}/checkout` - Check-out
- `GET /api/v1/bookings/property/{propertyId}` - Reservas por propriedade
- `GET /api/v1/bookings/guest/{guestId}` - Reservas por hóspede
- `GET /api/v1/calendar/property/{propertyId}` - Calendário
- `GET /api/v1/availability` - Verificar disponibilidade

---

### 5. Channels Service
**Responsabilidade**: Integração com canais externos (Booking.com, Airbnb, etc.).

```
HospedaBR.Channels/
├── src/
│   ├── HospedaBR.Channels.API/
│   │   ├── Endpoints/
│   │   │   ├── ChannelEndpoints.cs
│   │   │   ├── ConnectionEndpoints.cs
│   │   │   └── ImportEndpoints.cs
│   │   ├── Webhooks/
│   │   │   ├── BookingComWebhook.cs
│   │   │   └── AirbnbWebhook.cs
│   │   └── Program.cs
│   ├── HospedaBR.Channels.Application/
│   │   ├── Commands/
│   │   │   ├── ConnectChannel/
│   │   │   ├── DisconnectChannel/
│   │   │   ├── SyncChannel/
│   │   │   ├── ImportProperties/
│   │   │   ├── ImportBookings/
│   │   │   └── UpdateSyncSettings/
│   │   ├── Queries/
│   │   │   ├── GetAvailableChannels/
│   │   │   ├── GetConnectionsByBusiness/
│   │   │   ├── GetImportLogs/
│   │   │   └── GetChannelStatus/
│   │   └── IntegrationEvents/
│   │       ├── ChannelConnectedIntegrationEvent.cs
│   │       ├── PropertiesImportedIntegrationEvent.cs
│   │       └── BookingsImportedIntegrationEvent.cs
│   ├── HospedaBR.Channels.Domain/
│   │   ├── Entities/
│   │   │   ├── Channel.cs
│   │   │   ├── ChannelConnection.cs
│   │   │   ├── ChannelMapping.cs
│   │   │   └── ImportLog.cs
│   │   ├── Enums/
│   │   │   ├── ChannelSlug.cs
│   │   │   ├── ConnectionStatus.cs
│   │   │   └── SyncStatus.cs
│   │   └── Events/
│   └── HospedaBR.Channels.Infrastructure/
│       ├── Persistence/
│       ├── Adapters/
│       │   ├── IChannelAdapter.cs
│       │   ├── BookingComAdapter.cs
│       │   ├── AirbnbAdapter.cs
│       │   ├── VrboAdapter.cs
│       │   ├── ExpediaAdapter.cs
│       │   ├── TripAdvisorAdapter.cs
│       │   └── DecolarAdapter.cs
│       └── OAuth/
│           └── OAuthService.cs
└── tests/
```

**Endpoints:**
- `GET /api/v1/channels` - Listar canais disponíveis
- `GET /api/v1/channels/connections` - Conexões do negócio
- `POST /api/v1/channels/connect` - Conectar canal
- `DELETE /api/v1/channels/connections/{id}` - Desconectar
- `POST /api/v1/channels/connections/{id}/sync` - Sincronizar
- `POST /api/v1/channels/connections/{id}/import/properties` - Importar propriedades
- `POST /api/v1/channels/connections/{id}/import/bookings` - Importar reservas
- `PUT /api/v1/channels/connections/{id}/settings` - Configurações
- `GET /api/v1/channels/connections/{id}/logs` - Logs de importação
- `POST /api/v1/webhooks/booking-com` - Webhook Booking.com
- `POST /api/v1/webhooks/airbnb` - Webhook Airbnb

---

### 6. Messaging Service
**Responsabilidade**: Sistema de mensagens entre hóspedes e anfitriões.

```
HospedaBR.Messaging/
├── src/
│   ├── HospedaBR.Messaging.API/
│   │   ├── Endpoints/
│   │   │   ├── ConversationEndpoints.cs
│   │   │   └── MessageEndpoints.cs
│   │   ├── Hubs/
│   │   │   └── ChatHub.cs
│   │   └── Program.cs
│   ├── HospedaBR.Messaging.Application/
│   │   ├── Commands/
│   │   │   ├── SendMessage/
│   │   │   ├── MarkAsRead/
│   │   │   └── CreateConversation/
│   │   └── Queries/
│   │       ├── GetConversations/
│   │       ├── GetMessages/
│   │       └── GetUnreadCount/
│   ├── HospedaBR.Messaging.Domain/
│   │   ├── Entities/
│   │   │   ├── Conversation.cs
│   │   │   └── Message.cs
│   │   └── Events/
│   │       └── MessageSentEvent.cs
│   └── HospedaBR.Messaging.Infrastructure/
│       ├── Persistence/
│       └── SignalR/
└── tests/
```

**Endpoints:**
- `GET /api/v1/conversations` - Listar conversas
- `GET /api/v1/conversations/{id}` - Obter conversa
- `POST /api/v1/conversations` - Criar conversa
- `GET /api/v1/conversations/{id}/messages` - Mensagens da conversa
- `POST /api/v1/conversations/{id}/messages` - Enviar mensagem
- `PUT /api/v1/messages/{id}/read` - Marcar como lida
- `GET /api/v1/messages/unread/count` - Contagem de não lidas
- **SignalR Hub**: `/hubs/chat` - Chat em tempo real

---

### 7. Analytics Service
**Responsabilidade**: Estatísticas, relatórios e dashboards.

```
HospedaBR.Analytics/
├── src/
│   ├── HospedaBR.Analytics.API/
│   │   ├── Endpoints/
│   │   │   ├── DashboardEndpoints.cs
│   │   │   ├── RevenueEndpoints.cs
│   │   │   └── ReportEndpoints.cs
│   │   └── Program.cs
│   ├── HospedaBR.Analytics.Application/
│   │   ├── Queries/
│   │   │   ├── GetDashboardSummary/
│   │   │   ├── GetRevenueByPeriod/
│   │   │   ├── GetOccupancyRate/
│   │   │   ├── GetBookingsByChannel/
│   │   │   └── GenerateReport/
│   │   └── EventHandlers/
│   │       ├── BookingCreatedHandler.cs
│   │       ├── BookingConfirmedHandler.cs
│   │       └── PaymentReceivedHandler.cs
│   ├── HospedaBR.Analytics.Domain/
│   │   ├── Entities/
│   │   │   ├── DailyStat.cs
│   │   │   ├── PropertyStat.cs
│   │   │   └── ChannelStat.cs
│   │   └── ValueObjects/
│   │       └── Period.cs
│   └── HospedaBR.Analytics.Infrastructure/
│       ├── Persistence/
│       │   ├── AnalyticsRepository.cs
│       │   └── TimeSeriesQueries.cs
│       └── Aggregators/
└── tests/
```

**Endpoints:**
- `GET /api/v1/analytics/dashboard` - Resumo do dashboard
- `GET /api/v1/analytics/revenue` - Receita por período
- `GET /api/v1/analytics/occupancy` - Taxa de ocupação
- `GET /api/v1/analytics/bookings-by-channel` - Reservas por canal
- `GET /api/v1/analytics/top-properties` - Propriedades mais rentáveis
- `POST /api/v1/reports/generate` - Gerar relatório
- `GET /api/v1/reports/{id}` - Baixar relatório

---

### 8. Notification Worker
**Responsabilidade**: Processamento de notificações (email, SMS, push).

```
HospedaBR.Notifications/
├── src/
│   ├── HospedaBR.Notifications.Worker/
│   │   ├── Consumers/
│   │   │   ├── BookingCreatedConsumer.cs
│   │   │   ├── BookingConfirmedConsumer.cs
│   │   │   ├── BookingCancelledConsumer.cs
│   │   │   ├── MessageReceivedConsumer.cs
│   │   │   └── UserRegisteredConsumer.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── HospedaBR.Notifications.Application/
│   │   ├── Commands/
│   │   │   ├── SendEmail/
│   │   │   ├── SendSms/
│   │   │   └── SendPushNotification/
│   │   └── Templates/
│   │       ├── BookingConfirmationTemplate.cs
│   │       └── WelcomeEmailTemplate.cs
│   └── HospedaBR.Notifications.Infrastructure/
│       ├── Email/
│       │   └── SmtpEmailService.cs
│       ├── Sms/
│       │   └── TwilioSmsService.cs
│       └── Push/
│           └── FirebasePushService.cs
└── tests/
```

---

### 9. Channel Integration Worker
**Responsabilidade**: Processamento assíncrono de sincronização com canais.

```
HospedaBR.Channels.Worker/
├── src/
│   ├── HospedaBR.Channels.Worker/
│   │   ├── Jobs/
│   │   │   ├── SyncPropertiesJob.cs
│   │   │   ├── SyncBookingsJob.cs
│   │   │   ├── SyncAvailabilityJob.cs
│   │   │   └── ChannelHealthCheckJob.cs
│   │   ├── Consumers/
│   │   │   ├── ImportPropertiesConsumer.cs
│   │   │   └── ImportBookingsConsumer.cs
│   │   └── Program.cs
│   └── HospedaBR.Channels.Worker.Application/
│       └── Services/
│           └── ChannelSyncOrchestrator.cs
└── tests/
```

---

### 10. Payment Service (Futuro)
**Responsabilidade**: Processamento de pagamentos.

```
HospedaBR.Payments/
├── src/
│   ├── HospedaBR.Payments.API/
│   │   └── Endpoints/
│   │       ├── PaymentEndpoints.cs
│   │       └── RefundEndpoints.cs
│   ├── HospedaBR.Payments.Application/
│   │   ├── Commands/
│   │   │   ├── ProcessPayment/
│   │   │   ├── ProcessRefund/
│   │   │   └── CapturePayment/
│   │   └── Sagas/
│   │       └── PaymentSaga.cs
│   ├── HospedaBR.Payments.Domain/
│   │   └── Entities/
│   │       ├── Payment.cs
│   │       ├── Refund.cs
│   │       └── PaymentMethod.cs
│   └── HospedaBR.Payments.Infrastructure/
│       └── Gateways/
│           ├── StripeGateway.cs
│           └── PagarMeGateway.cs
└── tests/
```

---

### 11. Super Admin Dashboard Service
**Responsabilidade**: Monitoramento centralizado multi-tenant, métricas em tempo real e gestão de plataforma.

```
HospedaBR.SuperAdmin/
├── src/
│   ├── HospedaBR.SuperAdmin.API/
│   │   ├── Endpoints/
│   │   │   ├── MonitoringEndpoints.cs
│   │   │   ├── TenantsEndpoints.cs
│   │   │   ├── MetricsEndpoints.cs
│   │   │   ├── LogsEndpoints.cs
│   │   │   └── SystemHealthEndpoints.cs
│   │   ├── Hubs/
│   │   │   └── RealTimeMetricsHub.cs
│   │   ├── Authorization/
│   │   │   ├── SuperAdminRequirement.cs
│   │   │   └── SuperAdminHandler.cs
│   │   └── Program.cs
│   ├── HospedaBR.SuperAdmin.Application/
│   │   ├── Queries/
│   │   │   ├── GetAllTenants/
│   │   │   ├── GetTenantDetails/
│   │   │   ├── GetSystemMetrics/
│   │   │   ├── GetServiceHealth/
│   │   │   ├── GetRecentLogs/
│   │   │   ├── GetErrorRates/
│   │   │   └── GetResourceUsage/
│   │   ├── Commands/
│   │   │   ├── SuspendTenant/
│   │   │   ├── ActivateTenant/
│   │   │   ├── ImpersonateUser/
│   │   │   └── ClearTenantCache/
│   │   └── Services/
│   │       ├── MetricsAggregator.cs
│   │       └── TenantSwitcher.cs
│   ├── HospedaBR.SuperAdmin.Domain/
│   │   ├── Entities/
│   │   │   ├── Tenant.cs
│   │   │   ├── SystemMetric.cs
│   │   │   ├── ServiceHealth.cs
│   │   │   └── AuditLog.cs
│   │   └── Enums/
│   │       ├── TenantStatus.cs
│   │       └── ServiceStatus.cs
│   └── HospedaBR.SuperAdmin.Infrastructure/
│       ├── Persistence/
│       │   └── Repositories/
│       ├── Metrics/
│       │   ├── InMemoryMetricsStore.cs
│       │   ├── MetricsCollector.cs
│       │   └── DiagnosticsListener.cs
│       └── CrossTenant/
│           └── TenantContextAccessor.cs
└── tests/
```

**Endpoints (Requer role: super-admin):**
- `GET /api/v1/super-admin/tenants` - Listar todos os tenants
- `GET /api/v1/super-admin/tenants/{id}` - Detalhes do tenant
- `GET /api/v1/super-admin/tenants/{id}/switch` - Trocar contexto para tenant
- `PUT /api/v1/super-admin/tenants/{id}/suspend` - Suspender tenant
- `PUT /api/v1/super-admin/tenants/{id}/activate` - Ativar tenant
- `GET /api/v1/super-admin/metrics` - Métricas do sistema
- `GET /api/v1/super-admin/metrics/realtime` - Métricas em tempo real (SignalR)
- `GET /api/v1/super-admin/services/health` - Health de todos os serviços
- `GET /api/v1/super-admin/logs` - Logs agregados
- `GET /api/v1/super-admin/logs/errors` - Erros recentes
- `GET /api/v1/super-admin/resources` - Uso de recursos (CPU, RAM, etc.)
- `POST /api/v1/super-admin/cache/clear` - Limpar cache de tenant

**Dashboard Features:**
- 📊 **Visão Geral**: Número de tenants, reservas totais, receita mensal da plataforma
- 🏢 **Gestão de Tenants**: Lista completa, filtros, ações (suspender/ativar)
- 📈 **Métricas em Tempo Real**: Requisições/segundo, latência, throughput
- 🔍 **Logs Centralizados**: Busca em logs de todos os serviços
- ⚠️ **Alertas**: Erros críticos, serviços degradados
- 💾 **Recursos**: CPU, memória, conexões de banco
- 🔄 **Impersonação**: Login como qualquer usuário para suporte

---

## Shared Libraries

```
HospedaBR.Shared/
├── HospedaBR.Shared.Domain/
│   ├── Abstractions/
│   │   ├── Entity.cs
│   │   ├── AggregateRoot.cs
│   │   ├── ValueObject.cs
│   │   └── DomainEvent.cs
│   ├── Primitives/
│   │   ├── Result.cs
│   │   └── Error.cs
│   └── Interfaces/
│       ├── IDbConnectionFactory.cs
│       └── IRepository.cs
├── HospedaBR.Shared.Application/
│   ├── Behaviors/
│   │   ├── LoggingBehavior.cs
│   │   ├── ValidationBehavior.cs
│   │   └── TransactionBehavior.cs
│   ├── Messaging/
│   │   ├── ICommand.cs
│   │   ├── IQuery.cs
│   │   └── IIntegrationEvent.cs
│   └── Extensions/
├── HospedaBR.Shared.Infrastructure/
│   ├── Persistence/
│   │   ├── DbConnectionFactory.cs
│   │   ├── DapperExtensions.cs
│   │   └── MigrationRunner.cs
│   ├── Messaging/
│   │   ├── RabbitMqPublisher.cs
│   │   └── IntegrationEventService.cs
│   ├── Caching/
│   │   └── RedisCacheService.cs
│   ├── Metrics/
│   │   ├── MetricsMiddleware.cs
│   │   └── InMemoryMetricsCollector.cs
│   ├── Authentication/
│   │   └── JwtBearerExtensions.cs
│   └── Observability/
│       ├── OpenTelemetryExtensions.cs
│       └── SerilogExtensions.cs
└── HospedaBR.Shared.Contracts/
    ├── IntegrationEvents/
    │   ├── BookingCreatedIntegrationEvent.cs
    │   ├── BookingConfirmedIntegrationEvent.cs
    │   └── PropertyCreatedIntegrationEvent.cs
    └── DTOs/
```

---

## Dapper + DbUp (Acesso a Dados)

### DbConnectionFactory:
```csharp
public interface IDbConnectionFactory
{
    Task<NpgsqlConnection> CreateAsync(CancellationToken ct = default);
}

public sealed class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;
    
    public DbConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string not found");
    }
    
    public async Task<NpgsqlConnection> CreateAsync(CancellationToken ct = default)
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(ct);
        return connection;
    }
}
```

### Repository Pattern com Dapper:
```csharp
public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Booking>> GetByPropertyAsync(Guid propertyId, CancellationToken ct = default);
    Task<bool> CheckAvailabilityAsync(Guid propertyId, DateOnly checkIn, DateOnly checkOut, CancellationToken ct = default);
    Task AddAsync(Booking booking, CancellationToken ct = default);
    Task UpdateAsync(Booking booking, CancellationToken ct = default);
}

public sealed class BookingRepository : IBookingRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    
    public BookingRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }
    
    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        using var connection = await _connectionFactory.CreateAsync(ct);
        
        return await connection.QueryFirstOrDefaultAsync<Booking>(
            @"SELECT * FROM bookings WHERE id = @Id",
            new { Id = id });
    }
    
    public async Task<bool> CheckAvailabilityAsync(
        Guid propertyId, 
        DateOnly checkIn, 
        DateOnly checkOut,
        CancellationToken ct = default)
    {
        using var connection = await _connectionFactory.CreateAsync(ct);
        
        var conflictingBookings = await connection.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM bookings 
              WHERE property_id = @PropertyId 
              AND status NOT IN ('cancelled', 'rejected')
              AND check_in < @CheckOut 
              AND check_out > @CheckIn",
            new { PropertyId = propertyId, CheckIn = checkIn, CheckOut = checkOut });
        
        return conflictingBookings == 0;
    }
    
    public async Task AddAsync(Booking booking, CancellationToken ct = default)
    {
        using var connection = await _connectionFactory.CreateAsync(ct);
        
        await connection.ExecuteAsync(
            @"INSERT INTO bookings 
              (id, property_id, guest_id, host_id, tenant_id, check_in, check_out, 
               guests, nights, price_per_night, subtotal, taxes, total_price, 
               status, confirmation_code, special_requests, created_at)
              VALUES 
              (@Id, @PropertyId, @GuestId, @HostId, @TenantId, @CheckIn, @CheckOut,
               @Guests, @Nights, @PricePerNight, @Subtotal, @Taxes, @TotalPrice,
               @Status, @ConfirmationCode, @SpecialRequests, @CreatedAt)",
            booking);
    }
}
```

### Migrations com DbUp:
```csharp
// Program.cs - Startup
public static void RunMigrations(IConfiguration configuration)
{
    var connectionString = configuration.GetConnectionString("DefaultConnection");
    
    EnsureDatabase.For.PostgresqlDatabase(connectionString);
    
    var upgrader = DeployChanges.To
        .PostgresqlDatabase(connectionString)
        .WithScriptsEmbeddedInAssembly(typeof(Program).Assembly)
        .WithTransaction()
        .LogToConsole()
        .Build();
    
    var result = upgrader.PerformUpgrade();
    
    if (!result.Successful)
    {
        throw new Exception("Database migration failed", result.Error);
    }
}
```

```sql
-- Scripts/001_CreateBookingsTable.sql
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    guest_id UUID NOT NULL,
    host_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL,
    nights INTEGER NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    taxes DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,
    special_requests TEXT,
    channel_source VARCHAR(50),
    channel_external_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
```

---

## Clean Architecture por Serviço

```
┌─────────────────────────────────────────────────────────────────┐
│                              API                                 │
│         (Endpoints, Middleware, DI Configuration)               │
├─────────────────────────────────────────────────────────────────┤
│                          APPLICATION                             │
│    (Commands, Queries, Handlers, DTOs, Validators, Mappings)    │
├─────────────────────────────────────────────────────────────────┤
│                            DOMAIN                                │
│      (Entities, Value Objects, Domain Events, Interfaces)       │
├─────────────────────────────────────────────────────────────────┤
│                        INFRASTRUCTURE                            │
│  (Persistence, Repositories, External Services, Messaging)      │
└─────────────────────────────────────────────────────────────────┘
```

### Dependências entre camadas:
- **API** → Application, Infrastructure (DI)
- **Application** → Domain
- **Domain** → Nenhuma (core isolado)
- **Infrastructure** → Domain, Application (implementa interfaces)

---

## CQRS com MediatR + Dapper

### Command Example:
```csharp
// Command
public sealed record CreateBookingCommand(
    Guid PropertyId,
    Guid GuestId,
    DateOnly CheckIn,
    DateOnly CheckOut,
    int Guests,
    string? SpecialRequests
) : ICommand<Result<BookingDto>>;

// Handler
public sealed class CreateBookingCommandHandler 
    : ICommandHandler<CreateBookingCommand, Result<BookingDto>>
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IPublisher _publisher;

    public CreateBookingCommandHandler(
        IDbConnectionFactory connectionFactory,
        IPublisher publisher)
    {
        _connectionFactory = connectionFactory;
        _publisher = publisher;
    }

    public async Task<Result<BookingDto>> Handle(
        CreateBookingCommand request, 
        CancellationToken cancellationToken)
    {
        using var connection = await _connectionFactory.CreateAsync();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Validate property exists
            var property = await connection.QueryFirstOrDefaultAsync<Property>(
                "SELECT * FROM properties WHERE id = @Id",
                new { Id = request.PropertyId },
                transaction);
                
            if (property is null)
                return Result.Failure<BookingDto>(PropertyErrors.NotFound);

            // 2. Check availability
            var conflictingBooking = await connection.QueryFirstOrDefaultAsync<Guid?>(
                @"SELECT id FROM bookings 
                  WHERE property_id = @PropertyId 
                  AND status NOT IN ('cancelled', 'rejected')
                  AND check_in < @CheckOut AND check_out > @CheckIn",
                new { request.PropertyId, request.CheckIn, request.CheckOut },
                transaction);
            
            if (conflictingBooking.HasValue)
                return Result.Failure<BookingDto>(BookingErrors.NotAvailable);

            // 3. Create booking
            var booking = Booking.Create(
                request.PropertyId,
                request.GuestId,
                new DateRange(request.CheckIn, request.CheckOut),
                request.Guests,
                property.PricePerNight,
                request.SpecialRequests);

            await connection.ExecuteAsync(
                @"INSERT INTO bookings 
                  (id, property_id, guest_id, host_id, check_in, check_out, 
                   guests, nights, price_per_night, subtotal, taxes, total_price, 
                   status, confirmation_code, special_requests, created_at)
                  VALUES 
                  (@Id, @PropertyId, @GuestId, @HostId, @CheckIn, @CheckOut,
                   @Guests, @Nights, @PricePerNight, @Subtotal, @Taxes, @TotalPrice,
                   @Status, @ConfirmationCode, @SpecialRequests, @CreatedAt)",
                booking,
                transaction);

            transaction.Commit();

            // 4. Publish domain events
            await _publisher.Publish(
                new BookingCreatedEvent(booking.Id), 
                cancellationToken);

            return Result.Success(booking.ToDto());
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

// Validator
public sealed class CreateBookingCommandValidator 
    : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.GuestId).NotEmpty();
        RuleFor(x => x.CheckIn).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today));
        RuleFor(x => x.CheckOut).GreaterThan(x => x.CheckIn);
        RuleFor(x => x.Guests).InclusiveBetween(1, 20);
    }
}
```

### Query Example (Dapper):
```csharp
// Query
public sealed record GetBookingsByPropertyQuery(
    Guid PropertyId,
    Guid TenantId,
    int Page = 1,
    int PageSize = 20
) : IQuery<PagedResult<BookingDto>>;

// Handler
public sealed class GetBookingsByPropertyQueryHandler 
    : IQueryHandler<GetBookingsByPropertyQuery, PagedResult<BookingDto>>
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ICacheService _cacheService;

    public async Task<PagedResult<BookingDto>> Handle(
        GetBookingsByPropertyQuery request, 
        CancellationToken cancellationToken)
    {
        var cacheKey = $"bookings:property:{request.PropertyId}:{request.Page}";
        
        var cached = await _cacheService.GetAsync<PagedResult<BookingDto>>(cacheKey);
        if (cached is not null)
            return cached;

        using var connection = await _connectionFactory.CreateAsync();
        
        var offset = (request.Page - 1) * request.PageSize;
        
        // Count total
        var totalCount = await connection.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM bookings 
              WHERE property_id = @PropertyId AND tenant_id = @TenantId",
            request);
        
        // Get paginated data
        var bookings = await connection.QueryAsync<BookingDto>(
            @"SELECT b.*, g.name as guest_name, g.email as guest_email
              FROM bookings b
              JOIN users g ON g.id = b.guest_id
              WHERE b.property_id = @PropertyId AND b.tenant_id = @TenantId
              ORDER BY b.check_in DESC
              LIMIT @PageSize OFFSET @Offset",
            new { request.PropertyId, request.TenantId, request.PageSize, Offset = offset });
        
        var result = new PagedResult<BookingDto>(
            bookings.ToList(), 
            totalCount, 
            request.Page, 
            request.PageSize);
        
        await _cacheService.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));
        
        return result;
    }
}
```

---

## Super Admin Dashboard (Monitoramento In-App)

### Arquitetura do Monitoramento:
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPER ADMIN DASHBOARD                                  │
│                        (React + SignalR Real-time)                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN API SERVICE                                  │
│                 Metrics Aggregation │ Cross-Tenant Access                       │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │   Identity  │     │  Bookings   │     │  Channels   │     │   Other     │
  │   Service   │     │   Service   │     │   Service   │     │  Services   │
  │  /metrics   │     │  /metrics   │     │  /metrics   │     │  /metrics   │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Coleta de Métricas:
```csharp
// Shared: MetricsMiddleware.cs
public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMetricsCollector _metricsCollector;

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            
            _metricsCollector.RecordRequest(new RequestMetric
            {
                Path = context.Request.Path,
                Method = context.Request.Method,
                StatusCode = context.Response.StatusCode,
                DurationMs = stopwatch.ElapsedMilliseconds,
                TenantId = context.User.FindFirstValue("tenant_id"),
                Timestamp = DateTime.UtcNow
            });
        }
    }
}

// Shared: IMetricsCollector.cs
public interface IMetricsCollector
{
    void RecordRequest(RequestMetric metric);
    Task<SystemMetrics> GetCurrentMetricsAsync();
    Task<IEnumerable<RequestMetric>> GetRecentRequestsAsync(int count = 100);
}

// Infrastructure: InMemoryMetricsCollector.cs
public sealed class InMemoryMetricsCollector : IMetricsCollector
{
    private readonly ConcurrentQueue<RequestMetric> _recentRequests = new();
    private readonly Channel<RequestMetric> _metricsChannel;
    private long _totalRequests;
    private long _totalErrors;
    
    public void RecordRequest(RequestMetric metric)
    {
        Interlocked.Increment(ref _totalRequests);
        
        if (metric.StatusCode >= 500)
            Interlocked.Increment(ref _totalErrors);
        
        _recentRequests.Enqueue(metric);
        
        // Keep only last 10000 requests
        while (_recentRequests.Count > 10000)
            _recentRequests.TryDequeue(out _);
    }
    
    public Task<SystemMetrics> GetCurrentMetricsAsync()
    {
        var process = Process.GetCurrentProcess();
        
        return Task.FromResult(new SystemMetrics
        {
            TotalRequests = _totalRequests,
            TotalErrors = _totalErrors,
            ErrorRate = _totalRequests > 0 ? (double)_totalErrors / _totalRequests * 100 : 0,
            CpuUsage = GetCpuUsage(),
            MemoryUsageMb = process.WorkingSet64 / 1024 / 1024,
            ActiveConnections = GetActiveConnections(),
            UptimeSeconds = (DateTime.UtcNow - process.StartTime.ToUniversalTime()).TotalSeconds
        });
    }
}
```

### Super Admin Endpoints:
```csharp
// SuperAdmin.API/Endpoints/MonitoringEndpoints.cs
public static class MonitoringEndpoints
{
    public static void MapMonitoringEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/super-admin")
            .RequireAuthorization("super-admin-only")
            .WithTags("Super Admin");

        // Tenants Management
        group.MapGet("/tenants", GetAllTenants);
        group.MapGet("/tenants/{id}", GetTenantDetails);
        group.MapPut("/tenants/{id}/suspend", SuspendTenant);
        group.MapPut("/tenants/{id}/activate", ActivateTenant);
        group.MapPost("/tenants/{id}/impersonate", ImpersonateUser);
        
        // System Metrics
        group.MapGet("/metrics", GetSystemMetrics);
        group.MapGet("/metrics/history", GetMetricsHistory);
        
        // Service Health
        group.MapGet("/services/health", GetAllServicesHealth);
        
        // Logs
        group.MapGet("/logs", GetAggregatedLogs);
        group.MapGet("/logs/errors", GetRecentErrors);
        
        // Resources
        group.MapGet("/resources", GetResourceUsage);
        
        // Cache
        group.MapPost("/cache/clear/{tenantId}", ClearTenantCache);
    }
    
    private static async Task<IResult> GetAllTenants(
        ISender sender,
        [AsParameters] GetAllTenantsQuery query)
    {
        var result = await sender.Send(query);
        return Results.Ok(result);
    }
    
    private static async Task<IResult> GetSystemMetrics(
        ISender sender,
        [FromQuery] Guid? tenantId = null)
    {
        var query = new GetSystemMetricsQuery(tenantId);
        var result = await sender.Send(query);
        return Results.Ok(result);
    }
}

// Real-time metrics via SignalR
public sealed class RealTimeMetricsHub : Hub
{
    private readonly IMetricsCollector _metricsCollector;
    
    public override async Task OnConnectedAsync()
    {
        // Verify super-admin role
        if (!Context.User?.IsInRole("super-admin") ?? true)
        {
            Context.Abort();
            return;
        }
        
        await base.OnConnectedAsync();
    }
    
    public async Task SubscribeToMetrics()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "metrics-subscribers");
    }
}

// Background service to push metrics
public sealed class MetricsBroadcaster : BackgroundService
{
    private readonly IHubContext<RealTimeMetricsHub> _hubContext;
    private readonly IMetricsCollector _metricsCollector;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var metrics = await _metricsCollector.GetCurrentMetricsAsync();
            
            await _hubContext.Clients
                .Group("metrics-subscribers")
                .SendAsync("MetricsUpdate", metrics, stoppingToken);
            
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}
```

### Multi-Tenant Access para Super Admin:
```csharp
// CrossTenant/TenantContextAccessor.cs
public interface ITenantContextAccessor
{
    Guid? CurrentTenantId { get; }
    void SetTenant(Guid? tenantId);
    bool IsSuperAdmin { get; }
}

public sealed class TenantContextAccessor : ITenantContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid? _overrideTenantId;
    
    public Guid? CurrentTenantId
    {
        get
        {
            if (_overrideTenantId.HasValue)
                return _overrideTenantId;
                
            var claim = _httpContextAccessor.HttpContext?.User.FindFirstValue("tenant_id");
            return Guid.TryParse(claim, out var tenantId) ? tenantId : null;
        }
    }
    
    public bool IsSuperAdmin => 
        _httpContextAccessor.HttpContext?.User.IsInRole("super-admin") ?? false;
    
    public void SetTenant(Guid? tenantId)
    {
        if (!IsSuperAdmin)
            throw new UnauthorizedAccessException("Only super-admin can switch tenants");
            
        _overrideTenantId = tenantId;
    }
}

// Query para buscar dados de qualquer tenant (Super Admin)
public sealed class GetTenantBookingsQueryHandler 
    : IQueryHandler<GetTenantBookingsQuery, PagedResult<BookingDto>>
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContextAccessor _tenantContext;
    
    public async Task<PagedResult<BookingDto>> Handle(
        GetTenantBookingsQuery request, 
        CancellationToken cancellationToken)
    {
        // Super Admin pode acessar qualquer tenant
        var tenantId = _tenantContext.IsSuperAdmin 
            ? request.TenantId 
            : _tenantContext.CurrentTenantId;
            
        if (tenantId is null && !_tenantContext.IsSuperAdmin)
            throw new UnauthorizedAccessException();
            
        using var connection = await _connectionFactory.CreateAsync();
        
        var sql = tenantId.HasValue
            ? "SELECT * FROM bookings WHERE tenant_id = @TenantId ORDER BY created_at DESC"
            : "SELECT * FROM bookings ORDER BY created_at DESC"; // Super Admin - all tenants
            
        var bookings = await connection.QueryAsync<BookingDto>(sql, new { TenantId = tenantId });
        
        return new PagedResult<BookingDto>(bookings.ToList(), bookings.Count(), 1, 100);
    }
}
```

### Dashboard Metrics Model:
```csharp
// Entities/SystemMetrics.cs
public sealed record SystemMetrics
{
    public long TotalRequests { get; init; }
    public long TotalErrors { get; init; }
    public double ErrorRate { get; init; }
    public double CpuUsage { get; init; }
    public long MemoryUsageMb { get; init; }
    public int ActiveConnections { get; init; }
    public double UptimeSeconds { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}

public sealed record TenantSummary
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public TenantStatus Status { get; init; }
    public int TotalUsers { get; init; }
    public int TotalProperties { get; init; }
    public int TotalBookings { get; init; }
    public decimal MonthlyRevenue { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastActivityAt { get; init; }
}

public sealed record ServiceHealthStatus
{
    public string ServiceName { get; init; } = string.Empty;
    public ServiceStatus Status { get; init; }
    public double ResponseTimeMs { get; init; }
    public DateTime LastChecked { get; init; }
    public string? ErrorMessage { get; init; }
}
```

---

## Event-Driven Architecture

### Integration Events Flow:
```
┌─────────────┐    Booking Created    ┌─────────────┐
│   Bookings  │ ───────────────────▶  │  RabbitMQ   │
│   Service   │                        │   Exchange  │
└─────────────┘                        └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │ Notification│           │  Analytics  │           │  Channels   │
            │   Worker    │           │   Service   │           │   Worker    │
            └─────────────┘           └─────────────┘           └─────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
              Send Email              Update Stats              Sync to Channel
```

### RabbitMQ Topology:
```
Exchanges:
├── hospedabr.events (fanout) - Eventos de domínio
├── hospedabr.commands (direct) - Comandos direcionados
└── hospedabr.deadletter (fanout) - Dead letter

Queues:
├── notifications.booking-created
├── notifications.booking-confirmed
├── notifications.message-received
├── analytics.booking-events
├── channels.sync-requests
├── channels.import-requests
└── payments.process-requests
```

---

## Banco de Dados

### PostgreSQL Databases (Database per Service):
```
hospedabr_identity    - Usuários, tokens, roles
hospedabr_business    - Empresas
hospedabr_properties  - Propriedades, filiais, imagens
hospedabr_bookings    - Reservas, calendário
hospedabr_channels    - Conexões, mapeamentos, logs
hospedabr_messaging   - Conversas, mensagens
hospedabr_analytics   - Estatísticas (TimescaleDB extension)
hospedabr_payments    - Pagamentos, transações
```

### Schema Example (Bookings):
```sql
-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    guest_id UUID NOT NULL,
    host_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL,
    nights INTEGER NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    taxes DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    confirmation_code VARCHAR(20) UNIQUE NOT NULL,
    special_requests TEXT,
    channel_source VARCHAR(50),
    channel_external_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_property FOREIGN KEY (property_id) 
        REFERENCES properties(id) ON DELETE RESTRICT
);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Blocked Dates
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_property FOREIGN KEY (property_id) 
        REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX idx_blocked_dates ON blocked_dates(property_id, start_date, end_date);
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ══════════════════════════════════════════════════════════════════
  # INFRASTRUCTURE
  # ══════════════════════════════════════════════════════════════════
  
  postgres:
    image: postgres:16-alpine
    container_name: hospedabr-postgres
    environment:
      POSTGRES_USER: hospedabr
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_MULTIPLE_DATABASES: hospedabr_identity,hospedabr_business,hospedabr_properties,hospedabr_bookings,hospedabr_channels,hospedabr_messaging,hospedabr_analytics,hospedabr_payments
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init-multiple-dbs.sh:/docker-entrypoint-initdb.d/init-multiple-dbs.sh
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospedabr"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hospedabr-network

  redis:
    image: redis:7-alpine
    container_name: hospedabr-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hospedabr-network

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: hospedabr-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: hospedabr
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - hospedabr-network

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: hospedabr-meilisearch
    environment:
      MEILI_MASTER_KEY: ${MEILISEARCH_KEY}
      MEILI_ENV: development
    volumes:
      - meilisearch_data:/meili_data
    ports:
      - "7700:7700"
    networks:
      - hospedabr-network

  minio:
    image: minio/minio:latest
    container_name: hospedabr-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: hospedabr
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - hospedabr-network

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: hospedabr-keycloak
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/hospedabr_identity
      KC_DB_USERNAME: hospedabr
      KC_DB_PASSWORD: ${POSTGRES_PASSWORD}
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hospedabr-network

  # ══════════════════════════════════════════════════════════════════
  # OBSERVABILITY
  # ══════════════════════════════════════════════════════════════════

  seq:
    image: datalust/seq:latest
    container_name: hospedabr-seq
    environment:
      ACCEPT_EULA: Y
    ports:
      - "5341:5341"
      - "8081:80"
    volumes:
      - seq_data:/data
    networks:
      - hospedabr-network

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: hospedabr-jaeger
    environment:
      COLLECTOR_OTLP_ENABLED: true
    ports:
      - "6831:6831/udp"
      - "16686:16686"
      - "4317:4317"
      - "4318:4318"
    networks:
      - hospedabr-network

  # Métricas são coletadas internamente via In-App Dashboard (Super Admin)
  # Removido Prometheus + Grafana em favor de monitoramento integrado

  # ══════════════════════════════════════════════════════════════════
  # API GATEWAY
  # ══════════════════════════════════════════════════════════════════

  api-gateway:
    build:
      context: .
      dockerfile: src/HospedaBR.ApiGateway/Dockerfile
    container_name: hospedabr-gateway
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:80
    ports:
      - "5000:80"
    depends_on:
      - identity-api
      - business-api
      - properties-api
      - bookings-api
      - channels-api
      - messaging-api
      - analytics-api
      - super-admin-api
    networks:
      - hospedabr-network

  # ══════════════════════════════════════════════════════════════════
  # MICROSERVICES
  # ══════════════════════════════════════════════════════════════════

  identity-api:
    build:
      context: .
      dockerfile: src/Services/Identity/HospedaBR.Identity.API/Dockerfile
    container_name: hospedabr-identity-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_identity;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
      - RabbitMQ__Host=rabbitmq
      - RabbitMQ__Username=hospedabr
      - RabbitMQ__Password=${RABBITMQ_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - hospedabr-network

  business-api:
    build:
      context: .
      dockerfile: src/Services/Business/HospedaBR.Business.API/Dockerfile
    container_name: hospedabr-business-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_business;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
      - RabbitMQ__Host=rabbitmq
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hospedabr-network

  properties-api:
    build:
      context: .
      dockerfile: src/Services/Properties/HospedaBR.Properties.API/Dockerfile
    container_name: hospedabr-properties-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_properties;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Meilisearch__Host=http://meilisearch:7700
      - Meilisearch__Key=${MEILISEARCH_KEY}
      - Minio__Endpoint=minio:9000
    depends_on:
      - postgres
      - meilisearch
      - minio
    networks:
      - hospedabr-network

  bookings-api:
    build:
      context: .
      dockerfile: src/Services/Bookings/HospedaBR.Bookings.API/Dockerfile
    container_name: hospedabr-bookings-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_bookings;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
      - RabbitMQ__Host=rabbitmq
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - hospedabr-network

  channels-api:
    build:
      context: .
      dockerfile: src/Services/Channels/HospedaBR.Channels.API/Dockerfile
    container_name: hospedabr-channels-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_channels;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - RabbitMQ__Host=rabbitmq
    depends_on:
      - postgres
      - rabbitmq
    networks:
      - hospedabr-network

  messaging-api:
    build:
      context: .
      dockerfile: src/Services/Messaging/HospedaBR.Messaging.API/Dockerfile
    container_name: hospedabr-messaging-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_messaging;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - hospedabr-network

  analytics-api:
    build:
      context: .
      dockerfile: src/Services/Analytics/HospedaBR.Analytics.API/Dockerfile
    container_name: hospedabr-analytics-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_analytics;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - hospedabr-network

  super-admin-api:
    build:
      context: .
      dockerfile: src/Services/SuperAdmin/HospedaBR.SuperAdmin.API/Dockerfile
    container_name: hospedabr-super-admin-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__AllDatabases=Host=postgres;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379,password=${REDIS_PASSWORD}
      - RabbitMQ__Host=rabbitmq
    depends_on:
      - postgres
      - redis
      - rabbitmq
      - identity-api
      - business-api
      - properties-api
      - bookings-api
      - channels-api
    networks:
      - hospedabr-network

  # ══════════════════════════════════════════════════════════════════
  # WORKERS
  # ══════════════════════════════════════════════════════════════════

  notification-worker:
    build:
      context: .
      dockerfile: src/Workers/HospedaBR.Notifications.Worker/Dockerfile
    container_name: hospedabr-notification-worker
    environment:
      - DOTNET_ENVIRONMENT=Development
      - RabbitMQ__Host=rabbitmq
      - RabbitMQ__Username=hospedabr
      - RabbitMQ__Password=${RABBITMQ_PASSWORD}
    depends_on:
      - rabbitmq
    networks:
      - hospedabr-network

  channels-worker:
    build:
      context: .
      dockerfile: src/Workers/HospedaBR.Channels.Worker/Dockerfile
    container_name: hospedabr-channels-worker
    environment:
      - DOTNET_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=hospedabr_channels;Username=hospedabr;Password=${POSTGRES_PASSWORD}
      - RabbitMQ__Host=rabbitmq
    depends_on:
      - postgres
      - rabbitmq
    networks:
      - hospedabr-network

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  meilisearch_data:
  minio_data:
  seq_data:

networks:
  hospedabr-network:
    driver: bridge
```

---

## Estrutura de Pastas do Projeto

```
hospedabr-backend/
├── docker/
│   └── postgres/
│       └── init-multiple-dbs.sh
├── src/
│   ├── ApiGateway/
│   │   └── HospedaBR.ApiGateway/
│   ├── BuildingBlocks/
│   │   ├── HospedaBR.Shared.Domain/
│   │   ├── HospedaBR.Shared.Application/
│   │   ├── HospedaBR.Shared.Infrastructure/
│   │   └── HospedaBR.Shared.Contracts/
│   ├── Services/
│   │   ├── Identity/
│   │   │   ├── HospedaBR.Identity.API/
│   │   │   ├── HospedaBR.Identity.Application/
│   │   │   ├── HospedaBR.Identity.Domain/
│   │   │   └── HospedaBR.Identity.Infrastructure/
│   │   ├── Business/
│   │   │   ├── HospedaBR.Business.API/
│   │   │   ├── HospedaBR.Business.Application/
│   │   │   ├── HospedaBR.Business.Domain/
│   │   │   └── HospedaBR.Business.Infrastructure/
│   │   ├── Properties/
│   │   │   └── ...
│   │   ├── Bookings/
│   │   │   └── ...
│   │   ├── Channels/
│   │   │   └── ...
│   │   ├── Messaging/
│   │   │   └── ...
│   │   ├── Analytics/
│   │   │   └── ...
│   │   ├── SuperAdmin/
│   │   │   ├── HospedaBR.SuperAdmin.API/
│   │   │   ├── HospedaBR.SuperAdmin.Application/
│   │   │   ├── HospedaBR.SuperAdmin.Domain/
│   │   │   └── HospedaBR.SuperAdmin.Infrastructure/
│   │   └── Payments/
│   │       └── ...
│   └── Workers/
│       ├── HospedaBR.Notifications.Worker/
│       └── HospedaBR.Channels.Worker/
├── tests/
│   ├── UnitTests/
│   ├── IntegrationTests/
│   └── ArchitectureTests/
├── .env.example
├── docker-compose.yml
├── docker-compose.override.yml
├── HospedaBR.sln
└── README.md
```

---

## API Gateway (YARP)

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://app.hospedabr.com.br")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();

app.Run();
```

```json
// appsettings.json - YARP Config
{
  "ReverseProxy": {
    "Routes": {
      "identity-route": {
        "ClusterId": "identity-cluster",
        "Match": { "Path": "/api/v1/auth/{**catch-all}" }
      },
      "users-route": {
        "ClusterId": "identity-cluster",
        "Match": { "Path": "/api/v1/users/{**catch-all}" },
        "AuthorizationPolicy": "authenticated"
      },
      "business-route": {
        "ClusterId": "business-cluster",
        "Match": { "Path": "/api/v1/businesses/{**catch-all}" },
        "AuthorizationPolicy": "authenticated"
      },
      "properties-route": {
        "ClusterId": "properties-cluster",
        "Match": { "Path": "/api/v1/properties/{**catch-all}" }
      },
      "bookings-route": {
        "ClusterId": "bookings-cluster",
        "Match": { "Path": "/api/v1/bookings/{**catch-all}" },
        "AuthorizationPolicy": "authenticated"
      },
      "channels-route": {
        "ClusterId": "channels-cluster",
        "Match": { "Path": "/api/v1/channels/{**catch-all}" },
        "AuthorizationPolicy": "host-only"
      },
      "messaging-route": {
        "ClusterId": "messaging-cluster",
        "Match": { "Path": "/api/v1/{conversations,messages}/{**catch-all}" },
        "AuthorizationPolicy": "authenticated"
      },
      "analytics-route": {
        "ClusterId": "analytics-cluster",
        "Match": { "Path": "/api/v1/analytics/{**catch-all}" },
        "AuthorizationPolicy": "host-only"
      },
      "super-admin-route": {
        "ClusterId": "super-admin-cluster",
        "Match": { "Path": "/api/v1/super-admin/{**catch-all}" },
        "AuthorizationPolicy": "super-admin-only"
      }
    },
    "Clusters": {
      "identity-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://identity-api" }
        }
      },
      "business-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://business-api" }
        }
      },
      "properties-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://properties-api" }
        }
      },
      "bookings-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://bookings-api" }
        }
      },
      "channels-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://channels-api" }
        }
      },
      "messaging-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://messaging-api" }
        }
      },
      "analytics-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://analytics-api" }
        }
      },
      "super-admin-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://super-admin-api" }
        }
      }
    }
  }
}
```

---

## Packages NuGet Principais

```xml
<!-- Shared packages across services -->
<ItemGroup>
  <!-- CQRS & Mediator -->
  <PackageReference Include="MediatR" Version="12.4.0" />
  
  <!-- Validation -->
  <PackageReference Include="FluentValidation" Version="11.10.0" />
  <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.10.0" />
  
  <!-- Micro-ORM (Dapper) -->
  <PackageReference Include="Dapper" Version="2.1.35" />
  <PackageReference Include="Dapper.Contrib" Version="2.0.78" />
  <PackageReference Include="Npgsql" Version="9.0.0" />
  
  <!-- Migrations -->
  <PackageReference Include="DbUp" Version="5.0.40" />
  <PackageReference Include="DbUp.PostgreSQL" Version="5.0.40" />
  
  <!-- Messaging -->
  <PackageReference Include="MassTransit" Version="8.3.0" />
  <PackageReference Include="MassTransit.RabbitMQ" Version="8.3.0" />
  
  <!-- Caching -->
  <PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="10.0.0" />
  
  <!-- Mapping -->
  <PackageReference Include="Mapster" Version="7.4.1" />
  
  <!-- Observability -->
  <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.10.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore" Version="1.10.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.Http" Version="1.10.0" />
  <PackageReference Include="OpenTelemetry.Instrumentation.SqlClient" Version="1.10.0-beta.1" />
  <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.10.0" />
  
  <!-- Logging -->
  <PackageReference Include="Serilog.AspNetCore" Version="9.0.0" />
  <PackageReference Include="Serilog.Sinks.Seq" Version="9.0.0" />
  
  <!-- Health Checks -->
  <PackageReference Include="AspNetCore.HealthChecks.NpgSql" Version="9.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.Redis" Version="9.0.0" />
  <PackageReference Include="AspNetCore.HealthChecks.Rabbitmq" Version="9.0.0" />
  
  <!-- API Documentation -->
  <PackageReference Include="Scalar.AspNetCore" Version="2.0.0" />
  
  <!-- Background Jobs -->
  <PackageReference Include="Hangfire.Core" Version="1.8.17" />
  <PackageReference Include="Hangfire.PostgreSql" Version="1.20.10" />
  
  <!-- In-App Metrics (Super Admin Dashboard) -->
  <PackageReference Include="System.Diagnostics.DiagnosticSource" Version="10.0.0" />
</ItemGroup>
```

---

## Próximos Passos

### Fase 1 - Fundação (2-3 semanas)
1. [ ] Setup inicial do repositório e estrutura de pastas
2. [ ] Configurar Docker Compose com infraestrutura base
3. [ ] Criar Shared Libraries (Domain, Application, Infrastructure)
4. [ ] Implementar Identity Service (auth básico)
5. [ ] Configurar API Gateway (YARP)

### Fase 2 - Core Services (3-4 semanas)
1. [ ] Implementar Business Service
2. [ ] Implementar Properties Service
3. [ ] Implementar Bookings Service
4. [ ] Configurar RabbitMQ e eventos de integração

### Fase 3 - Canais e Integrações (3-4 semanas)
1. [ ] Implementar Channels Service
2. [ ] Criar adaptadores para canais (Booking.com, Airbnb)
3. [ ] Implementar Channel Integration Worker
4. [ ] Webhooks e sincronização

### Fase 4 - Features Complementares (2-3 semanas)
1. [ ] Implementar Messaging Service (SignalR)
2. [ ] Implementar Analytics Service
3. [ ] Implementar Notification Worker
4. [ ] Configurar Meilisearch para busca

### Fase 5 - Observabilidade e Super Admin (1-2 semanas)
1. [ ] Configurar OpenTelemetry (tracing)
2. [ ] Implementar Super Admin Dashboard (monitoramento in-app)
3. [ ] Configurar Seq (logs centralizados)
4. [ ] Health checks e alertas
5. [ ] Sistema de métricas multi-tenant

### Fase 6 - Pagamentos (2-3 semanas)
1. [ ] Implementar Payment Service
2. [ ] Integração com gateway de pagamento
3. [ ] Sagas para fluxo de pagamento

---

## Considerações de Segurança

1. **Autenticação**: JWT com refresh tokens, integração opcional com Keycloak
2. **Autorização**: Policy-based authorization por role (guest, host, admin, **super-admin**)
3. **Super Admin**: Acesso total a todos os tenants para monitoramento e suporte
4. **Rate Limiting**: Por IP e por usuário autenticado
5. **CORS**: Configuração restritiva por ambiente
6. **Secrets**: Variáveis de ambiente via Docker secrets ou Vault
7. **HTTPS**: Obrigatório em produção (TLS termination no load balancer)
8. **Input Validation**: FluentValidation em todos os commands
9. **SQL Injection**: Parametrized queries via Dapper
10. **Audit Logging**: Log de ações sensíveis
11. **Multi-Tenancy**: Isolamento de dados por tenant_id em todas as queries

---

## Estimativa de Recursos (Produção)

| Serviço | CPU | RAM | Réplicas |
|---------|-----|-----|----------|
| API Gateway | 0.5 | 512MB | 2 |
| Identity API | 0.5 | 512MB | 2 |
| Business API | 0.25 | 256MB | 2 |
| Properties API | 0.5 | 512MB | 2 |
| Bookings API | 0.5 | 512MB | 2 |
| Channels API | 0.5 | 512MB | 2 |
| Messaging API | 0.5 | 512MB | 2 |
| Analytics API | 0.25 | 256MB | 2 |
| Notification Worker | 0.25 | 256MB | 2 |
| Channels Worker | 0.5 | 512MB | 2 |
| PostgreSQL | 2 | 4GB | 1 (primary) + 1 (replica) |
| Redis | 0.5 | 1GB | 1 |
| RabbitMQ | 1 | 2GB | 1 |
| Meilisearch | 1 | 2GB | 1 |

**Total estimado**: ~10 vCPUs, ~16GB RAM
