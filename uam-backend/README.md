# UAM Service - User Access Management

Multi-tenant User Access Management service with Role-Based Access Control (RBAC) and OAuth2 authentication.

## 🏗️ Architecture

This project follows **Onion Architecture** (Clean Architecture) with strict adherence to **SOLID principles**:

```
src/
├── domain/                 # Core business logic (innermost layer)
│   ├── entities/          # Business entities with domain logic
│   ├── value-objects/     # Immutable value objects
│   ├── enums/            # Domain enums
│   ├── repositories/      # Repository interfaces (DIP)
│   └── services/          # Domain services
│
├── application/           # Use cases & orchestration
│   ├── use-cases/        # Business use cases
│   │   ├── auth/         # Authentication use cases
│   │   ├── users/        # User management use cases
│   │   ├── roles/        # Role management use cases
│   │   ├── permissions/  # Permission management use cases
│   │   └── invitations/  # Invitation workflow use cases
│   ├── dtos/             # Data transfer objects
│   └── mappers/          # Entity-DTO mappers
│
├── infrastructure/        # External concerns (outermost layer)
│   ├── database/         # Drizzle ORM, repositories implementation
│   │   ├── schema.ts     # Database schema
│   │   ├── migrations/   # Database migrations
│   │   ├── repositories/ # Repository implementations
│   │   └── seeders/      # Database seeders
│   ├── auth/             # JWT strategy, guards
│   ├── http/             # HTTP clients for inter-service communication
│   └── config/           # Configuration services
│
└── presentation/          # API layer
    ├── controllers/       # REST controllers
    ├── modules/          # NestJS modules
    ├── guards/           # Auth guards
    ├── decorators/       # Custom decorators
    └── filters/          # Exception filters
```

## 🎯 SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each entity has one reason to change (e.g., `User` entity only handles user business logic)
- Repositories handle only persistence logic
- Use cases orchestrate single business operations

### Open/Closed Principle (OCP)
- Entities are open for extension but closed for modification
- Strategy pattern for authentication providers (local, Azure AD)
- Repository interfaces allow different implementations

### Liskov Substitution Principle (LSP)
- Repository implementations can be substituted without breaking code
- All entities follow the same factory pattern

### Interface Segregation Principle (ISP)
- Repository interfaces are specific to each entity
- No fat interfaces - each interface has focused methods

### Dependency Inversion Principle (DIP)
- Use cases depend on repository interfaces, not implementations
- Infrastructure layer implements domain interfaces
- Domain layer has no dependencies on outer layers

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/ag_saas_db
```

### Database Setup

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed system roles
npm run db:seed

# Open Drizzle Studio (optional)
npm run db:studio
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3001
- **Swagger Documentation**: http://localhost:3001/api

## 📋 Features

### ✅ Implemented
- ✅ Onion Architecture with clear layer separation
- ✅ SOLID principles throughout codebase
- ✅ Domain entities with business logic
- ✅ Repository pattern with interfaces
- ✅ Multi-tenancy support
- ✅ Database schema with Drizzle ORM

### 🚧 In Progress
- 🚧 OAuth2 authentication
- 🚧 RBAC implementation
- 🚧 Employee invitation workflow
- 🚧 REST API controllers
- 🚧 Permission checking

### 📅 Planned
- 📅 Azure AD integration
- 📅 Account types (Individual/Company)
- 📅 Email service integration
- 📅 Audit logging
- 📅 Rate limiting

## 🗄️ Database Schema

### UAM Schema Tables
1. **users** - User accounts with authentication
2. **system_roles** - Predefined and custom roles
3. **user_roles** - User-role assignments
4. **role_permissions** - Role-feature permissions
5. **employee_invitations** - Invitation workflow
6. **audit_logs** - Audit trail
7. **oauth_tokens** - OAuth2 tokens

### System Roles
- `super_admin` (Level 1) - Platform-wide access
- `full_authority` (Level 2) - Complete tenant access
- `product_owner` (Level 3) - Product management
- `tenant_admin` (Level 3) - User management

## 🔐 Security

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Multi-Tenancy**: Row-level security with tenant isolation
- **CORS**: Configured for frontend origin
- **Validation**: Global validation pipe with class-validator

## 📚 API Documentation

Access Swagger documentation at `/api` endpoint when the server is running.

### Main Endpoints (Planned)

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

#### Users
- `GET /api/users` - List users (tenant-scoped)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

#### Roles
- `GET /api/roles` - List roles
- `GET /api/roles/:id/permissions` - Get role permissions
- `POST /api/roles/:id/permissions` - Assign permissions

#### Invitations
- `POST /api/invitations` - Send invitation
- `GET /api/invitations/verify/:token` - Verify invitation
- `POST /api/invitations/accept` - Accept invitation

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

Follow the established architecture patterns:
1. Keep domain logic in entities
2. Use repository interfaces in use cases
3. Implement repositories in infrastructure layer
4. Keep controllers thin - delegate to use cases

## 📄 License

MIT
