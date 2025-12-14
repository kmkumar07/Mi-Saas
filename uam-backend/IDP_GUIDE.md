# UAM Service - Identity Provider (IdP) Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Identity Model](#identity-model)
4. [Tenant Registration](#tenant-registration)
5. [Authentication & Login](#authentication--login)
6. [OAuth2/OIDC as IdP](#oauth2oidc-as-idp)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [Configuration](#configuration)
10. [Security Considerations](#security-considerations)

---

## Overview

The UAM (User Access Management) Service acts as an **Identity Provider (IdP)** for your multi-tenant SaaS platform. It provides:

- **Multi-tenant identity management** - Each tenant has isolated user identities
- **OAuth2/OIDC authorization server** - Full OAuth2 and OpenID Connect support
- **Role-Based Access Control (RBAC)** - Fine-grained permissions
- **Cross-domain authentication** - Can authenticate users across different domains/applications

### Key Features

✅ **Identity Chain**: Identity → AuthenticationAccount → OrganizationMember  
✅ **OAuth2/OIDC**: Full authorization server with multiple grant types  
✅ **Multi-tenant**: Complete tenant isolation  
✅ **JWT-based**: Secure token-based authentication  
✅ **Cookie support**: HttpOnly cookies for web applications  

---

## Architecture

### Identity Model

The system uses a three-layer identity model:

```
Identity (Global Person)
  ↓
AuthenticationAccount (Login Method)
  ↓
OrganizationMember (Tenant Membership) ← JWT sub claim
  ↓
Roles + Permissions (What they can do)
```

**Why this model?**

1. **Identity** - Represents a global human across all tenants (one person can be in multiple companies)
2. **AuthenticationAccount** - Separates login methods from identity (one person can have multiple login methods: local password, Azure AD, Google, etc.)
3. **OrganizationMember** - Tenant-scoped membership (required for all access)
4. **JWT sub claim** - Uses `organization_member.id` (tenant-scoped), not `identity.id` (global)

### Authentication Flow

```
User Login Request
  ↓
Resolve Identity (email + password + tenantId)
  ↓
Find AuthenticationAccount → Verify Password
  ↓
Get Identity → Get OrganizationMember (for tenant)
  ↓
Generate JWT (sub = organizationMemberId)
  ↓
Return Access Token + Refresh Token
```

### OAuth2 Flow

```
Client App → Redirect to /oauth2/authorize
  ↓
User Authenticates (if not already)
  ↓
Authorization Code Generated (10 min expiry)
  ↓
Client Exchanges Code for Token
  ↓
Access Token + Refresh Token Issued
  ↓
Client Uses Token to Access Protected Resources
```

---

## Identity Model

### Core Entities

#### 1. Identity
- **Purpose**: Global human identity across all tenants
- **Key Fields**: `id`, `email`, `firstName`, `lastName`
- **Uniqueness**: Email is unique globally
- **Note**: Identity alone does NOT grant access

#### 2. AuthenticationAccount
- **Purpose**: Login method for an identity
- **Key Fields**: `identityId`, `provider` (local/azure_ad/google/cognito), `passwordHash`, `email`
- **Multiple Accounts**: One identity can have multiple authentication accounts (e.g., local password + Azure AD)
- **Note**: Authentication accounts are for login only, not access control

#### 3. OrganizationMember
- **Purpose**: Tenant membership (REQUIRED for all access)
- **Key Fields**: `id` (JWT sub claim), `identityId`, `tenantId`, `isActive`
- **Critical**: This is the JWT `sub` claim - tenant-scoped
- **Note**: No access to tenant resources without being a member

#### 4. OrganizationAdmin
- **Purpose**: Tenant-level administrative authority
- **Key Fields**: `organizationMemberId`, `tenantId`
- **Note**: Admin status is ADDITIVE - admins still need RBAC permissions

---

## Tenant Registration

### Overview

When a new tenant registers, the system:

1. Creates a tenant in the Subscription Service (SS backend)
2. Creates a global Identity for the admin user
3. Creates an AuthenticationAccount (local password)
4. Creates an OrganizationMember (tenant membership)
5. Creates an OrganizationAdmin (admin authority)

### Registration Endpoint

**Endpoint**: `POST /api/auth/register-tenant`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "SecureP@ssw0rd",
  "firstName": "John",
  "lastName": "Doe",
  "accountType": "company",
  "companyName": "Acme Inc.",
  "workspaceName": "Acme Workspace"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email address (must be unique) |
| `password` | string | Yes | Password (min 8 chars, must include uppercase, lowercase, number, special char) |
| `firstName` | string | No | Admin first name |
| `lastName` | string | No | Admin last name |
| `accountType` | enum | Yes | `'individual'` or `'company'` |
| `companyName` | string | No | Company name (required if accountType is 'company') |
| `workspaceName` | string | No | Workspace name (for individual tenants) |

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (`@$!%*?&`)

**Response**:
```json
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "tenantName": "Acme Inc.",
  "accountType": "company",
  "adminUser": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "isEmailVerified": false
  }
}
```

### What Happens Internally

```mermaid
flowchart TD
    A[POST /api/auth/register-tenant] --> B[RegisterTenantUseCase]
    B --> C[Create Tenant in SS Backend]
    C --> D[CreateIdentityWithMembershipUseCase]
    D --> E[Create Identity]
    D --> F[Create AuthenticationAccount]
    D --> G[Create OrganizationMember]
    B --> H[Create OrganizationAdmin]
    H --> I[Return Tenant + Admin Info]
```

**Step-by-Step Process**:

1. **Tenant Creation** (SS Backend)
   - Creates record in `public.tenants` table
   - Returns `tenantId`

2. **Identity Creation** (UAM Backend)
   - Checks if identity exists by email (idempotent)
   - Creates new `Identity` if not exists
   - Updates profile if identity exists

3. **Authentication Account Creation**
   - Creates `AuthenticationAccount` with provider `'local'`
   - Hashes password with bcrypt (12 salt rounds)
   - Links to identity

4. **Organization Member Creation**
   - Creates `OrganizationMember` for tenant
   - Links to identity
   - Sets `isActive: true`

5. **Organization Admin Creation**
   - Creates `OrganizationAdmin` record
   - Grants tenant-level administrative authority
   - Links to organization member

### Example: Register a Company Tenant

```bash
curl -X POST http://localhost:3001/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecureP@ssw0rd123",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "company",
    "companyName": "Acme Corporation",
    "workspaceName": "Acme Workspace"
  }'
```

**Response**:
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantName": "Acme Corporation",
  "accountType": "company",
  "adminUser": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "admin@acme.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "isEmailVerified": false,
    "accountType": "company",
    "createdAt": "2025-01-14T18:33:23.000Z"
  }
}
```

**Save the `tenantId`** - You'll need it for login!

---

## Authentication & Login

### Overview

Login requires:
- Email address
- Password
- **Tenant ID** (required for organization membership resolution)

The system resolves: `AuthenticationAccount` → `Identity` → `OrganizationMember` → JWT token

### Login Endpoint

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "admin@acme.com",
  "password": "SecureP@ssw0rd123",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

**Token Details**:
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **Token Type**: Bearer
- **JWT Payload**: Contains `sub` (organizationMemberId), `identityId`, `email`, `tenantId`

**Cookie**: The server also sets an HttpOnly cookie `uam_access_token` with the access token.

### JWT Token Structure

The JWT payload contains:

```json
{
  "sub": "org-member-uuid",      // organization_members.id (tenant-scoped)
  "identityId": "identity-uuid",  // identities.id (global)
  "email": "admin@acme.com",
  "tenantId": "tenant-uuid",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Important**: The `sub` claim is `organization_members.id`, not `identity.id`. This ensures tenant-scoped authentication.

### Login Flow Details

```mermaid
sequenceDiagram
    participant Client
    participant UAM
    participant DB

    Client->>UAM: POST /api/auth/login (email, password, tenantId)
    UAM->>DB: Find AuthenticationAccount by email
    DB-->>UAM: AuthenticationAccount
    UAM->>UAM: Verify password (bcrypt)
    UAM->>DB: Find Identity by identityId
    DB-->>UAM: Identity
    UAM->>DB: Find OrganizationMember (identityId + tenantId)
    DB-->>UAM: OrganizationMember
    UAM->>UAM: Generate JWT (sub = organizationMemberId)
    UAM-->>Client: Access Token + Refresh Token
```

**Step-by-Step Process**:

1. **Find Authentication Account**
   - Query `authentication_accounts` by email
   - Verify provider is `'local'`
   - Verify account is active

2. **Verify Password**
   - Compare plain password with hashed password (bcrypt)
   - Throw error if mismatch

3. **Get Identity**
   - Query `identities` by `identityId` from auth account
   - Verify identity exists

4. **Get Organization Member**
   - Query `organization_members` by `identityId` + `tenantId`
   - Verify member exists and is active
   - This is the JWT `sub` claim

5. **Generate Tokens**
   - Create JWT with `sub = organizationMemberId`
   - Access token: 15 minutes
   - Refresh token: 7 days

6. **Set Cookie** (optional)
   - HttpOnly cookie with access token
   - SameSite: 'lax'
   - Secure in production

### Example: Login

```bash
# Login request
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecureP@ssw0rd123",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000"
  }' \
  -c cookies.txt

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJpZGVudGl0eUlkIjoiNzcxZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAyIiwiZW1haWwiOiJhZG1pbkBhY21lLmNvbSIsInRlbmFudElkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiaWF0IjoxNzM2ODg4MDAzLCJleHAiOjE3MzY4ODg5MDN9.signature",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

### Using the Token

**Option 1: Authorization Header**
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Option 2: Cookie** (if using browser)
```bash
curl -X GET http://localhost:3001/api/users \
  -b cookies.txt
```

### Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: Same as login (new access token + refresh token)

---

## OAuth2/OIDC as IdP

### Overview

The UAM service acts as a full OAuth2/OIDC Identity Provider, allowing:

- **Third-party applications** to authenticate users
- **Cross-domain SSO** (Single Sign-On)
- **Standard OAuth2 flows** (authorization code, client credentials, refresh token)
- **OpenID Connect** user information

### OAuth2 Client Registration

Before using OAuth2, you need to register a client application.

**Endpoint**: `POST /oauth2/clients` (requires organization admin)

**Request Body**:
```json
{
  "name": "My Application",
  "redirectUris": [
    "https://myapp.com/callback",
    "https://myapp.com/callback2"
  ],
  "scopes": ["openid", "profile", "email"],
  "grantTypes": ["authorization_code", "refresh_token"]
}
```

**Response**:
```json
{
  "clientId": "client_abc123xyz",
  "clientSecret": "secret_xyz789abc",
  "clientIdIssuedAt": 1736888003,
  "clientSecretExpiresAt": null
}
```

**⚠️ Important**: Save the `clientSecret` immediately - it's shown only once!

### OAuth2 Authorization Code Flow

This is the standard flow for web applications:

**Step 1: Redirect User to Authorization Endpoint**

```
GET /oauth2/authorize?client_id=client_abc123xyz&redirect_uri=https://myapp.com/callback&response_type=code&scope=openid profile email&state=random_state
```

**User must be authenticated** (logged in) before accessing this endpoint.

**Step 2: User Approves (if needed)**

The system generates an authorization code and redirects:

```
https://myapp.com/callback?code=abc123xyz&state=random_state
```

**Step 3: Exchange Code for Token**

```bash
curl -X POST http://localhost:3001/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=abc123xyz&redirect_uri=https://myapp.com/callback&client_id=client_abc123xyz&client_secret=secret_xyz789abc"
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "refresh_token_xyz",
  "scope": "openid profile email"
}
```

**Step 4: Use Access Token**

```bash
curl -X GET http://localhost:3001/oauth2/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:
```json
{
  "sub": "org-member-uuid",
  "email": "admin@acme.com",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email_verified": true,
  "tenant_id": "tenant-uuid"
}
```

### OpenID Connect Discovery

**Endpoint**: `GET /.well-known/openid-configuration`

Returns the OpenID Connect discovery document:

```json
{
  "issuer": "http://localhost:3001/oauth2",
  "authorization_endpoint": "http://localhost:3001/oauth2/authorize",
  "token_endpoint": "http://localhost:3001/oauth2/token",
  "userinfo_endpoint": "http://localhost:3001/oauth2/userinfo",
  "jwks_uri": "http://localhost:3001/oauth2/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "client_credentials", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "claims_supported": ["sub", "email", "name", "given_name", "family_name", "email_verified", "tenant_id"]
}
```

### Client Credentials Flow

For service-to-service authentication:

```bash
curl -X POST http://localhost:3001/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Basic base64(client_id:client_secret)" \
  -d "grant_type=client_credentials&scope=openid"
```

### Refresh Token Flow

```bash
curl -X POST http://localhost:3001/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token=refresh_token_xyz&client_id=client_abc123xyz&client_secret=secret_xyz789abc"
```

---

## API Reference

### Authentication Endpoints

#### Register Tenant
- **Endpoint**: `POST /api/auth/register-tenant`
- **Auth**: None (public)
- **Description**: Creates a new tenant and admin user
- **Request**: `RegisterTenantDto`
- **Response**: `RegisterTenantResponseDto`

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: None (public)
- **Description**: Authenticates user and returns JWT tokens
- **Request**: `LoginDto` (email, password, tenantId)
- **Response**: `TokenResponseDto`

#### Refresh Token
- **Endpoint**: `POST /api/auth/refresh`
- **Auth**: None (public)
- **Description**: Issues new access token from refresh token
- **Request**: `RefreshTokenDto`
- **Response**: `TokenResponseDto`

#### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: Bearer token or cookie
- **Description**: Revokes tokens and clears cookies

#### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Auth**: Bearer token or cookie
- **Description**: Returns current authenticated user

### OAuth2 Endpoints

#### Authorize
- **Endpoint**: `GET /oauth2/authorize`
- **Auth**: User must be authenticated (cookie/token)
- **Description**: Generates authorization code
- **Query Params**: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`

#### Token
- **Endpoint**: `POST /oauth2/token`
- **Auth**: Client credentials (Basic Auth or body)
- **Description**: Issues access and refresh tokens
- **Request**: `TokenRequestDto` (grant_type, code, etc.)

#### UserInfo
- **Endpoint**: `GET /oauth2/userinfo`
- **Auth**: Bearer token
- **Description**: Returns user information (OpenID Connect)

#### Discovery
- **Endpoint**: `GET /.well-known/openid-configuration`
- **Auth**: None (public)
- **Description**: OpenID Connect discovery document

#### Register Client
- **Endpoint**: `POST /oauth2/clients`
- **Auth**: Organization admin (Bearer token)
- **Description**: Registers new OAuth2 client

#### List Clients
- **Endpoint**: `GET /oauth2/clients`
- **Auth**: Organization admin (Bearer token)
- **Description**: Lists OAuth2 clients for tenant

---

## Examples

### Complete Registration and Login Flow

```bash
# 1. Register a new tenant
TENANT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register-tenant \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecureP@ssw0rd123",
    "firstName": "John",
    "lastName": "Doe",
    "accountType": "company",
    "companyName": "Example Corp"
  }')

# Extract tenantId from response
TENANT_ID=$(echo $TENANT_RESPONSE | jq -r '.tenantId')
echo "Tenant ID: $TENANT_ID"

# 2. Login with the tenant
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@example.com\",
    \"password\": \"SecureP@ssw0rd123\",
    \"tenantId\": \"$TENANT_ID\"
  }" \
  -c cookies.txt)

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
echo "Access Token: $ACCESS_TOKEN"

# 3. Use the token to access protected resources
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### OAuth2 Complete Flow

```bash
# 1. Register OAuth2 client (as admin)
CLIENT_RESPONSE=$(curl -s -X POST http://localhost:3001/oauth2/clients \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My OAuth App",
    "redirectUris": ["https://myapp.com/callback"],
    "scopes": ["openid", "profile", "email"],
    "grantTypes": ["authorization_code", "refresh_token"]
  }')

CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.clientId')
CLIENT_SECRET=$(echo $CLIENT_RESPONSE | jq -r '.clientSecret')
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"

# 2. User visits authorization URL (in browser)
# http://localhost:3001/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=https://myapp.com/callback&response_type=code&scope=openid profile email&state=xyz123

# 3. After user approves, exchange code for token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=https://myapp.com/callback&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET")

OAUTH_ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# 4. Get user info
curl -X GET http://localhost:3001/oauth2/userinfo \
  -H "Authorization: Bearer $OAUTH_ACCESS_TOKEN"
```

### JavaScript/TypeScript Example

```typescript
// Register tenant
async function registerTenant() {
  const response = await fetch('http://localhost:3001/api/auth/register-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'SecureP@ssw0rd123',
      firstName: 'John',
      lastName: 'Doe',
      accountType: 'company',
      companyName: 'Example Corp',
    }),
  });
  
  const data = await response.json();
  return data.tenantId;
}

// Login
async function login(email: string, password: string, tenantId: string) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ email, password, tenantId }),
  });
  
  const data = await response.json();
  return data.accessToken;
}

// Use token
async function getUsers(accessToken: string) {
  const response = await fetch('http://localhost:3001/api/users', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  
  return response.json();
}
```

---

## Configuration

### Environment Variables

Create a `.env` file in the `uam-backend` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ag_saas_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=3001
NODE_ENV=development

# CORS (optional - defaults to allow all origins)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# SS Backend (for tenant provisioning)
SS_BACKEND_URL=http://localhost:3000
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-secret-key` |
| `PORT` | Server port | `3001` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `*` (all) |

### Security Recommendations

1. **JWT_SECRET**: Use a strong, random secret (at least 32 characters)
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

2. **CORS**: Restrict origins in production
   ```env
   ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
   ```

3. **Database**: Use connection pooling and SSL in production

4. **HTTPS**: Always use HTTPS in production

---

## Security Considerations

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Enforced complexity requirements
- **Storage**: Never stored in plain text

### Token Security

- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Longer-lived (7 days), revocable
- **HttpOnly Cookies**: Prevents XSS attacks
- **SameSite**: 'lax' (prevents CSRF)
- **Secure Flag**: Enabled in production

### OAuth2 Security

- **Client Secrets**: Hashed with bcrypt
- **Authorization Codes**: Single-use, 10-minute expiry
- **Redirect URI Validation**: Strict validation against registered URIs
- **Scope Validation**: Enforced per client

### Multi-Tenancy Security

- **Tenant Isolation**: All queries filtered by tenantId
- **JWT sub Claim**: Tenant-scoped (organizationMemberId)
- **Organization Membership**: Required for all access

### Best Practices

1. **Never log passwords or tokens**
2. **Use HTTPS in production**
3. **Implement rate limiting** (recommended)
4. **Monitor failed login attempts**
5. **Regular security audits**
6. **Keep dependencies updated**

---

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" on login after registration

**Cause**: Identity chain not created properly

**Solution**: Ensure `CreateIdentityWithMembershipUseCase` is called during registration

#### 2. "Not a member of this organization"

**Cause**: User exists but not a member of the specified tenant

**Solution**: Verify `tenantId` is correct and user is a member

#### 3. "Invalid redirect URI" in OAuth2

**Cause**: Redirect URI doesn't match registered URIs

**Solution**: Ensure exact match (including protocol, domain, path)

#### 4. "Client is inactive"

**Cause**: OAuth2 client was deactivated

**Solution**: Reactivate client or create a new one

#### 5. "Authorization code has expired"

**Cause**: Code expired (10 minutes) or already used

**Solution**: Request new authorization code

---

## Additional Resources

- **Swagger Documentation**: http://localhost:3001/api
- **Database Schema**: See `src/infrastructure/database/schema.ts`
- **Use Cases**: See `src/application/use-cases/`

---

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

