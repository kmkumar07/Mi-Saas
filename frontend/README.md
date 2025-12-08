# AG SaaS Frontend

Vue 3.5.25 frontend application for subscription management with Razorpay payment integration.

## Features

- Subscription/Pricing page displaying plans grouped by plan families
- Tenant and Account registration flow
- Razorpay payment gateway integration
- Payment success page with subscription details

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The application will run on `http://localhost:5173`

## Configuration

The frontend is configured to proxy API requests to the backend running on `http://localhost:3000`. This is configured in `vite.config.js`.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable Vue components
│   ├── views/            # Page components
│   ├── services/          # API and external service integrations
│   ├── stores/            # Pinia state management
│   ├── router/            # Vue Router configuration
│   └── assets/            # Styles and static assets
```

## API Endpoints Used

- `GET /api/plan-families` - List plan families
- `GET /api/plans/:id` - Get plan details
- `POST /tenants` - Create tenant
- `POST /api/accounts` - Create account
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

