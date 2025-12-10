## AG SaaS – Running & Debugging with Docker

This project is designed to run **entirely inside Docker**, while still allowing you to debug the code from your IDE.

This guide explains how to:

- **Run all services via Docker Compose**
- **Debug backend services (NestJS) from the IDE by attaching to containers**
- **Debug frontends (Vue + Angular) via the browser**

---

## 1. Prerequisites

- Docker & Docker Compose installed and running
- Cursor / VS Code opened on the **repo root** (the folder that contains `docker-compose.dev.yml`)

> You do **not** run `npm run start` directly on the host when following this guide; everything runs inside containers.

---

## 2. Start the full stack in Docker

From the project root **using Docker Compose directly**:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Or, using the **Makefile shortcuts**:

```bash
make up       # start all services (build + attached)
make down     # stop and remove all services
make restart  # restart everything
make debug    # start stack and print debug port info
```

This starts:

- `postgres` (database)
- `backend` (main NestJS backend) on `http://localhost:3000`
- `uam-backend` (UAM NestJS backend) on `http://localhost:3001`
- `thirdparty-backend` (third-party NestJS backend) on `http://localhost:5003`
- `frontend` (Vue app) on `http://localhost:5173`
- `uam-frontend` (Angular app) on `http://localhost:4200`
- `thirdparty-frontend` (Angular app) on `http://localhost:4300`

Leave this terminal running while you debug.

---

## 3. Backend debugging (NestJS in Docker, IDE attach)

The Docker Compose file is configured so that each backend runs with Node’s inspector enabled:

- Inside each container, Node runs with:
  - `NODE_OPTIONS=--inspect=0.0.0.0:9229`
- Ports are mapped to your host:
  - `backend` debug: `localhost:9229`
  - `uam-backend` debug: `localhost:9230` (container `9229`)
  - `thirdparty-backend` debug: `localhost:9231` (container `9229`)

### 3.1. Debug configs in `.vscode/launch.json`

In the repo root, `.vscode/launch.json` defines **attach** configurations:

- **`Backend: Attach (Docker)`**
  - Attaches to the main backend container on port `9229`
  - Maps:
    - `localRoot`: `backend`
    - `remoteRoot`: `/usr/src/app`

- **`UAM Backend: Attach (Docker)`**
  - Attaches to the UAM backend container on port `9230`
  - Maps:
    - `localRoot`: `uam-backend`
    - `remoteRoot`: `/usr/src/app`

- **`Thirdparty Backend: Attach (Docker)`**
  - Attaches to the third-party backend container on port `9231`
  - Maps:
    - `localRoot`: `thirdparty-backend`
    - `remoteRoot`: `/usr/src/app`

There are also **local launch** configs (named `... Local Debug NestJS`) which start Node directly on your host; for Docker-based debugging you do **not** use those.

### 3.2. How to debug a backend (example: thirdparty-backend)

1. Make sure Docker is running:

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

2. In Cursor / VS Code, open the **Run and Debug** view.
3. Choose **`Thirdparty Backend: Attach (Docker)`** from the dropdown.
4. Set breakpoints in `thirdparty-backend/src/**` (for example, in `third-party.controller.ts`).
5. Click **Start Debugging** (green triangle).
6. Trigger a request to the thirdparty backend (via the thirdparty frontend or Postman).
7. Execution should pause on your breakpoints in the IDE.

Follow the same pattern for:

- **Main backend**: use `Backend: Attach (Docker)` and set breakpoints in `backend/src/**`.
- **UAM backend**: use `UAM Backend: Attach (Docker)` and set breakpoints in `uam-backend/src/**`.

---

## 4. Frontend debugging (Vue + Angular)

Frontends run in Docker but are accessed from your browser on the host:

- **Main SaaS frontend (Vue)**: `http://localhost:5173`
- **UAM frontend (Angular)**: `http://localhost:4200`
- **Third-party frontend (Angular)**: `http://localhost:4300`

### 4.1. Debug with browser devtools (recommended)

For all frontends, the simplest and most reliable option is:

1. Open the corresponding URL in your browser.
2. Open browser developer tools:
   - Chrome / Edge: `F12` or `Cmd+Option+I` on macOS.
3. Use:
   - **Sources** tab to set breakpoints in JS/TS (Vite / Angular provide source maps).
   - **Network** tab to inspect API calls to the backends.

Because the source is mounted into the containers (`./frontend/src`, `./uam-frontend/src`, `./thirdparty-frontend/src`), code changes will trigger live reloads inside the containers.

### 4.2. Optional: Debug frontends from the IDE

If you prefer debugging the browser from Cursor / VS Code:

- Use the built-in **“JavaScript Debug Terminal”** or **“Chrome”** launch templates to attach to a running browser session.
- Point them at:
  - `http://localhost:5173` for the Vue app
  - `http://localhost:4200` for the UAM Angular app
  - `http://localhost:4300` for the third-party Angular app

This is optional; browser devtools are usually sufficient.

---

## 5. Typical workflow summary

1. **Start stack in Docker**:

   ```bash
   # Option 1: raw Docker Compose
   docker compose -f docker-compose.dev.yml up --build

   # Option 2: Makefile shortcut (recommended for day-to-day)
   make up
   ```

2. **Debug backends**:
   - In Cursor / VS Code:
     - Open the **Run and Debug** view (left sidebar, play/bug icon).
     - In the configuration dropdown at the top, choose one of:
       - `Backend: Attach (Docker)`
       - `UAM Backend: Attach (Docker)`
       - `Thirdparty Backend: Attach (Docker)`
     - Click **Start Debugging** (green triangle button).
   - Set breakpoints in the corresponding `src` folder (for example `backend/src/**`, `uam-backend/src/**`, or `thirdparty-backend/src/**`).
   - Trigger requests; the debugger will hit the breakpoints.

3. **Debug frontends**:
   - Open the frontend URL in a browser.
   - Use browser devtools (or optional IDE browser debug) to set breakpoints and inspect behavior.

With this setup, your **runtime stays inside Docker**, but you still get a full debugging experience from the IDE for both backends and frontends.


