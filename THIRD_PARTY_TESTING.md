## Third-party test app (UAM integration)

This repo contains a minimal third-party application (backend + frontend) that uses the UAM
service to validate tenant/user permissions before allowing access to a protected API.

### Components

- **thirdparty-backend**: Minimal NestJS app that exposes:
  - `GET /public/ping` – no auth; returns `"third-party public OK"`.
  - `GET /api/feature-x` – requires a valid JWT and calls UAM to check if the current user has
    `THIRDPARTY_FEATURE_X`. On success it returns a plain string including the role name.
- **thirdparty-frontend**: Minimal Angular app with a single page that:
  - Reuses the `uam_access_token` stored by the UAM frontend.
  - Lets you call `/public/ping` and `/api/feature-x` and see the raw responses + HTTP status.

### Backend: thirdparty-backend

Location: `thirdparty-backend/`

Env vars (create a `.env` file here):

```env
PORT=5003

# Must match the secret/public key used by UAM to sign access tokens
JWT_SECRET_OR_PUBLIC_KEY=change_me_to_uam_jwt_secret

# Base URL of the running UAM backend
UAM_BASE_URL=http://localhost:3001

# Path on UAM that performs a feature permission check for the current user.
# The third-party backend will POST { featureKey } with the same Authorization header.
UAM_PERMISSION_CHECK_PATH=/api/internal/permissions/check-feature
```

Scripts:

- `cd thirdparty-backend`
- `npm install`
- `npm run start:dev` (listens on `http://localhost:5003` by default)

### Frontend: thirdparty-frontend

Location: `thirdparty-frontend/`

Config:

- The Angular app uses `THIRDPARTY_API_BASE_URL` from
  `thirdparty-frontend/src/app/core/thirdparty-api.config.ts` (default:
  `http://localhost:5003`).
- A custom HTTP interceptor (`thirdparty-auth.interceptor.ts`) reads the `uam_access_token` key
  from `localStorage` – the same key used by `uam-frontend` – and attaches it as
  `Authorization: Bearer <token>` for requests going to the third-party backend.

Scripts:

- `cd thirdparty-frontend`
- `npm install`
- `npm start` (serves on Angular’s default dev port, e.g. `http://localhost:4200`)

### End-to-end test scenario

1. **Start core services**
   - Start UAM backend (e.g. `cd uam-backend && npm run start:dev`).
   - Start UAM frontend (e.g. `cd uam-frontend && npm start`).
   - Start SaaS backend/frontend if needed for your flow.
2. **Start third-party apps**
   - `cd thirdparty-backend && npm run start:dev`.
   - `cd thirdparty-frontend && npm start`.
3. **Prepare tenant/users in UAM**
   - In UAM, register a **tenant**.
   - Create an **admin** user and a **staff** user for that tenant.
   - In UAM, grant the staff role the permission/feature key
     `THIRDPARTY_FEATURE_X` (or whatever mapping your UAM permission-check endpoint expects).
4. **Log in via UAM frontend**
   - Open the UAM frontend in the browser.
   - Log in as **staff**. This will populate `localStorage` with `uam_access_token`.
5. **Use the third-party frontend**
   - In the same browser, open the third-party Angular app.
   - Click **“Call /public/ping”** – you should see a 200 + `"third-party public OK"`.
   - Click **“Call /api/feature-x”**:
     - The browser sends the `uam_access_token` to the third-party backend.
     - The backend validates the JWT, extracts `tenantId` from the token, then calls UAM to check
       the feature.
     - If allowed, you see `"Access granted for role {roleName} to feature THIRDPARTY_FEATURE_X"`.
     - If not allowed (e.g. wrong role or missing permission), you see 403 with an error message.
6. **Repeat as admin**
   - Log out in UAM, log in as admin, and repeat the third-party calls to verify behavior
     differences between admin and staff as needed.


