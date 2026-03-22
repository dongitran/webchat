<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB 8" />
  <img src="https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">💬 WebChat</h1>

<p align="center">
  Production-grade real-time web chat application built for scale and responsiveness.<br/>
  🔗 WebSockets · 🖼️ Glassmorphism UI · 📦 Monorepo · 🛡️ End-to-End Type Safety
</p>

<p align="center">
  <a href="#architecture">Architecture</a> &bull;
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#api-reference">API Reference</a> &bull;
  <a href="#testing">Testing</a> &bull;
  <a href="#deployment">Deployment</a>
</p>

---

## 🏗️ Architecture

```
                        ┌───────────────────────────────────────────────┐
                        │             Client (Browser SPA)              │
                        │                                               │
                        │    React 19 + Vite + TanStack Router/Query    │
                        │     Zustand + Tailwind v4 CSS Components      │
                        └───────┬───────────────────────────────▲───────┘
                                │                               │
                      REST API  │                               │ WebSocket
               (HTTPS + Tokens) │                               │ (WSS connection)
                                │                               │
                        ┌───────▼───────────────────────────────┴───────┐
                        │              Express 5.x API Server           │
                        │         (Auth, Routes, Rate Limiting)         │
                        │                                               │
                        │ ┌───────────────┐             ┌─────────────┐ │
                        │ │  REST Layer   │             │  Socket.IO  │ │
                        │ └───────┬───────┘             └──────┬──────┘ │
                        │         │                            │        │
                        │         ├─────────── Auth ───────────┤        │
                        │         │                            │        │
                        │ ┌───────▼───────┐             ┌──────▼──────┐ │
                        │ │   Services    │             │   Handlers  │ │
                        │ └───────┬───────┘             └──────┬──────┘ │
                        └─────────┼────────────────────────────┼────────┘
                                  │                            │
                     ┌────────────┴───────────┐    ┌───────────┴────────────┐
              ┌──────▼──────┐          ┌──────▼────▼──┐              ┌──────▼──────┐
              │  Mongoose   │          │   ioredis    │<────────────>│Google OAuth │
              │   ODM (DB)  │          │    Cache     │   Tokens     │    2.0      │
              └──────┬──────┘          └──────┬───────┘              └─────────────┘
                     │                        │
              ┌──────▼──────┐          ┌──────▼──────┐
              │   MongoDB   │          │    Redis    │
              │ (Persistent)│          │  (Sessions/ │
              └─────────────┘          │   PubSub)   │
                                       └─────────────┘
```

### 💡 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Monorepo (pnpm) | Shared Zod schemas and TypeScript types between client and API via shared package |
| Real-time | Socket.IO 4.x | Auto-reconnect, fallback to polling, namespacing/rooms, Redis adapter for multi-instance |
| Server | Express 5.x | Native async/await error handling, mature middleware ecosystem |
| Frontend | React 19 + Vite | Concurrent rendering, fast HMR, TanStack router for file-based routing |
| Database | MongoDB 8 + Mongoose | Fluent document modeling, distinct Collections for read receipts to avoid contention |
| Caching & WS scale | Redis | Rate-limit state and scalable Pub/Sub via `@socket.io/redis-adapter` |
| State Management | Zustand & TanStack Query | Caching API state globally, simple non-React-tree updates for Socket handlers |
| Styling | Tailwind v4 CSS | Custom OKLCH color scale via `@theme`, semantic glassmorphism utilities |
| Auth | Google OAuth 2.0 | Seamless user onboarding with HTTP-only refresh tokens and JWT access tokens |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.x
- **Docker** and **Docker Compose** (for MongoDB + Redis)

### 1️⃣ Clone and install

```bash
git clone https://github.com/dongitran/webchat.git
cd webchat
pnpm install
```

### 2️⃣ Start infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d    # MongoDB + Redis
```

### 3️⃣ Configure environment

```bash
cp .env.example .env
# Edit .env file with your specific environment configurations
```

### 4️⃣ Run development servers

```bash
make dev    # Starts API (port 3001) and Web (port 5173) in watch mode concurrently
```

The app starts at `http://localhost:5173`. 
Note: Local development bypassing OAuth can use the `POST /api/v1/auth/dev-login` route.

---

## 📡 API Reference

### 🌐 Auth Endpoints (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/google` | Redirect to Google OAuth consent screen |
| `GET` | `/auth/google/callback` | Google OAuth callback handler |
| `POST` | `/auth/refresh` | Refresh an access token |
| `POST` | `/auth/logout` | Revoke token and clear cookies |
| `GET` | `/auth/me` | Current user profile |

### 👤 User Endpoints (`/api/v1/users`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/search` | Search users by name/email |
| `PATCH` | `/users/me/status` | Adjust online/idle/dnd status |

### 💬 Conversation & Message Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/conversations` | List user's conversations |
| `POST` | `/conversations` | Create direct or group conversation |
| `GET` | `/conversations/:id/messages` | Paginated message history lookup |
| `POST` | `/conversations/:id/messages` | REST fallback to send message |
| `POST` | `/messages/:id/reactions` | React to a specific message |

---

## 📁 Project Structure

```
webchat/
├── packages/
│   └── shared/          # Shared TS types, Constants, Zod schemas (API & Web)
├── api/                 # Node.js + Express API Backend
│   ├── src/
│   │   ├── config/      # Env loading, DB and Redis configs
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # Auth, rate limits, schema validation 
│   │   ├── models/      # Mongoose schemas (User, Message, Converse, etc.)
│   │   ├── routes/      # REST definitions
│   │   ├── services/    # Core business logic
│   │   └── socket/      # Socket.IO handlers and emitters
│   └── __tests__/       # Integrations + Service unit tests
├── web/                 # React SPA Frontend
│   ├── src/
│   │   ├── components/  # Atomic and Compound React UI elements
│   │   ├── hooks/       # Custom business logic (TanStack, Stores, Sockets)
│   │   ├── routes/      # TanStack file-based routing
│   │   ├── stores/      # Zustand slices for global state
│   │   └── styles/      # app.css (Tailwind configs and utilities)
│   └── __tests__/       # UI component test specs
├── docker-compose.yml   # Production orchestration
└── Makefile             # Dev workflow commands
```

---

## 🧪 Testing

### ✅ Unit & Integration Tests

```bash
# In api or web packages
pnpm test                # Watch mode
pnpm run test:coverage   # With coverage report
pnpm test:integration    # Requires infrastructure (Mongo, Redis via memory server/mocks)
```

---

## 🔒 Security

- 🛡️ **Input validation**: Handled by Zod at the boundary for both Express & React.
- 🔑 **Authentication**: Robust JWT with proper HTTP-only rotated refresh tokens via OAuth.
- ⏱️ **Rate limiting**: Anti-spam limiting powered by `rate-limit-redis`.
- 👁️ **Data Leeway**: Socket rooms tightly scoped via namespace guards and session access checks. Error stack traces disabled globally in responses.

---

## 🚢 Deployment

### 🐳 Docker

Multi-stage dockerfiles exist to prune devDependencies in both API and Web build steps. Production Docker Compose scales the app seamlessly via Redis Socket.IO adapter.

```bash
docker compose up -d --build
```

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Monorepo | pnpm workspaces | 9.x |
| Frontend | React + Vite + Tailwind CSS | 19.x, 6.x, v4 |
| API | Express | 5.x |
| Websockets | Socket.IO | 4.x |
| Database | MongoDB + Mongoose | 8.x |
| DB Cache | Redis + ioredis | 7.x |
| Validation | Zod | 3.x |
| Logging | Pino | 9.x |
| Testing | Vitest | 3.x |

---

## 📄 License

MIT
