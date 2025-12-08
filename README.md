# Multi-Tenant SaaS Backend

A production-ready backend system built with **Onion Architecture** using NestJS, Drizzle ORM, and PostgreSQL.

## 🏗️ Architecture

This project follows **Onion Architecture** (Clean Architecture) with clear layer separation:

```
src/
├── domain/              # Core business logic (no dependencies)
│   ├── entities/        # Business entities
│   ├── value-objects/   # Value objects (Money, etc.)
│   ├── enums/          # Domain enums
│   └── repositories/    # Repository interfaces
├── application/         # Use cases & orchestration
│   ├── use-cases/      # Business use cases
│   └── dtos/           # Data transfer objects
├── infrastructure/      # External concerns
│   └── database/       # Drizzle ORM, repositories
└── presentation/        # API layer
    └── controllers/    # REST controllers
```

## 🚀 Features

- ✅ **Multi-tenant architecture** with tenant isolation
- ✅ **Flexible pricing models** (static, metered, hybrid, usage-based, seat-based, feature-based)
- ✅ **Multiple charge models** (flat, per-seat, per-API-call, tiered, package, volume, graduated)
- ✅ **Subscription management** with billing intervals (daily, weekly, monthly, quarterly, yearly)
- ✅ **Feature management** with meter types (API calls, events, storage, bandwidth, CPU, GPU)
- ✅ **Type-safe database** with Drizzle ORM
- ✅ **API documentation** with Swagger
- ✅ **Razorpay payment integration** with order-based flow and webhook support

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/ag_saas
```

## 🗄️ Database Setup

```bash
# Generate migration
npm run db:generate

# Apply migration to database
npm run db:migrate

# Open Drizzle Studio (optional)
npm run db:studio
```

## 🏃 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## 📚 API Usage

### 1. Create a Product

```bash
POST /api/products
Content-Type: application/json

{
  "tenantId": "tenant-uuid",
  "name": "API Platform",
  "description": "Full API access",
  "pricingStrategy": "metered"
}
```

### 2. Create a Feature

```bash
POST /api/features
Content-Type: application/json

{
  "productId": "product-uuid",
  "name": "API Calls",
  "code": "api_calls",
  "featureType": "metered",
  "chargeModel": "per_api_call",
  "meterType": "api_call"
}
```

### 3. Create a Plan

```bash
POST /api/plans
Content-Type: application/json

{
  "productId": "product-uuid",
  "tenantId": "tenant-uuid",
  "name": "Premium Plan",
  "planType": "pro",
  "billingInterval": "monthly",
  "priceCents": 9900,
  "currency": "USD"
}
```

### 4. Get Plan Details

```bash
GET /api/plans/{plan-id}
```

## 🎯 Domain Enums

### Pricing Strategy
- `static` - Fixed pricing
- `metered` - Usage-based pricing
- `hybrid` - Combination of fixed and usage
- `usage_only` - Pure usage-based
- `seat_based` - Per-seat pricing
- `feature_based` - Feature-gated pricing

### Charge Model
- `flat` - Flat rate
- `per_seat` - Per user/seat
- `per_api_call` - Per API call
- `tiered` - Tiered pricing
- `package` - Package-based
- `volume` - Volume-based
- `graduated` - Graduated pricing

### Billing Interval
- `daily`, `weekly`, `monthly`, `quarterly`, `yearly`

### Plan Type
- `free`, `standard`, `pro`, `enterprise`

### Meter Type
- `api_call`, `event`, `request`, `storage`, `bandwidth`, `cpu`, `gpu`, `custom`

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Project Structure

```
├── src/
│   ├── domain/                    # Domain layer
│   │   ├── entities/
│   │   │   ├── plan.entity.ts
│   │   │   ├── product.entity.ts
│   │   │   └── feature.entity.ts
│   │   ├── value-objects/
│   │   │   └── money.vo.ts
│   │   ├── enums/
│   │   └── repositories/
│   ├── application/               # Application layer
│   │   ├── use-cases/
│   │   │   ├── plans/
│   │   │   ├── products/
│   │   │   └── features/
│   │   └── dtos/
│   ├── infrastructure/            # Infrastructure layer
│   │   └── database/
│   │       ├── schema.ts
│   │       ├── database.module.ts
│   │       └── repositories/
│   ├── presentation/              # Presentation layer
│   │   └── controllers/
│   ├── plans.module.ts
│   ├── app.module.ts
│   └── main.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## 🔒 Environment Variables

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ag_saas
PORT=3000

# Razorpay Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_SUCCESS_URL=https://your-frontend.com/payment/success
RAZORPAY_CANCEL_URL=https://your-frontend.com/payment/cancel
```

### Razorpay Setup

1. Sign up for a Razorpay account at https://razorpay.com
2. Get your API keys from the Razorpay Dashboard → Settings → API Keys
3. Set up webhooks in Razorpay Dashboard → Settings → Webhooks
4. Configure the webhook URL: `https://your-api.com/api/webhooks/razorpay`
5. Copy the webhook secret and set it in `RAZORPAY_WEBHOOK_SECRET`

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please follow the Onion Architecture principles when adding new features.
