# Database Seed

This seed file populates the database with sample data for testing and development purposes.

## What's Included

The seed creates a complete multi-tenant SaaS setup with:

### Tenants (2)
- **Acme Corporation** - Enterprise technology company
- **StartupXYZ** - SaaS startup

### Products (3)
- **API Access** - Core API with rate limiting
- **Analytics Dashboard** - Advanced analytics and reporting
- **Premium Support** - 24/7 priority support

### Features (8)
Distributed across products:
- API rate limiting (metered)
- Webhook support (boolean)
- API keys quota
- Custom reports
- Data retention
- Export capabilities
- Priority support
- Dedicated account manager

### Plans (4)

| Plan | Price | Products | Trial | Features |
|------|-------|----------|-------|----------|
| **Free** | $0 | API Access | None | Basic API access |
| **Standard** | $29/mo | API + Analytics | 14 days | Standard features + analytics |
| **Pro** | $99/mo | API + Analytics | 14 days | Enhanced limits + advanced analytics |
| **Enterprise** | $299/mo | All Products | 30 days | Everything + premium support |

## Running the Seed

```bash
# Make sure your database is running and migrations are applied
npm run db:migrate

# Run the seed
npm run db:seed
```

## Environment Variables

The seed uses the `DATABASE_URL` environment variable. Make sure it's set in your `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ag_saas
```

## Seed Data Details

### Price Structure
- Prices are stored in cents (e.g., 2900 = $29.00)
- All plans use monthly recurring charges except Free (one-time)
- Enterprise plan has a 12-month contract period

### Trial Periods
- Standard & Pro: 14-day trial
- Enterprise: 30-day trial
- Free: No trial (free forever)

### Renewal Definitions
- Standard & Pro: Auto-renewable monthly, unlimited cycles
- Enterprise: Manual renewal yearly, max 5 years
- All include grace periods (7-30 days)

## Resetting the Database

To clear and reseed:

```bash
# Drop all tables and recreate
npm run db:migrate

# Reseed
npm run db:seed
```

## Fixed UUIDs

The seed uses fixed UUIDs for consistency in development. This allows you to reference specific entities in tests and development:

- Tenant 1: `550e8400-e29b-41d4-a716-446655440001`
- Free Plan: `550e8400-e29b-41d4-a716-446655440031`
- Standard Plan: `550e8400-e29b-41d4-a716-446655440032`
- Pro Plan: `550e8400-e29b-41d4-a716-446655440033`
- Enterprise Plan: `550e8400-e29b-41d4-a716-446655440034`
