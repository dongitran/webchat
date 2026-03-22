## DevOps Review

### Overall Score: 4/10

The plan demonstrates solid application-level thinking (Zod env validation, pino logging, graceful shutdown) but treats Docker and local orchestration as an afterthought. The Dockerfiles and docker-compose.yml presented in Phase 0.6 are sketch-quality -- they will not produce a working local dev environment on the first try, and they leave multiple production-critical gaps wide open. A new developer cloning this repo today would hit wall after wall before anything runs.

---

### Blockers (local dev won't work)

- [BLOCKER] **docker-compose.yml mixes production Dockerfile with dev commands** -- The `api` service builds from a multi-stage Dockerfile that produces a production image (`node dist/server.js`), then overrides it with `command: pnpm --filter api dev`. The production image does not have pnpm installed (it only copies `dist/`, `node_modules/`, `package.json`), does not have source files at `/app/src`, and does not have devDependencies. The `command` override will crash immediately. The same problem exists for `web`. Fix: either use a separate `Dockerfile.dev` / docker-compose target stage, or (better for DX) run `api` and `web` natively with `pnpm dev` and only containerize MongoDB + Redis in compose for local dev. The production Dockerfiles stay as-is for CI builds.

- [BLOCKER] **Volume mount paths are wrong for a monorepo** -- `volumes: ["./api/src:/app/src"]` assumes the build context is the repo root, but the Dockerfile `COPY . .` inside `api/Dockerfile` copies from the `api/` context. The paths inside the container and the paths on the host do not align. The mount will either shadow the wrong directory or land in a path the runtime never reads.

- [BLOCKER] **`web` Dockerfile builds a static nginx image, but docker-compose runs `pnpm --filter web dev`** -- The nginx stage has no Node.js, no pnpm, no source code. The dev command override cannot execute. The web container will exit immediately.

- [BLOCKER] **No health checks in docker-compose means `depends_on` is useless** -- `depends_on: [mongodb, redis]` only waits for the container to start, not for the service inside it to be ready. The API will attempt to connect to MongoDB while mongod is still initializing its journal, and to Redis before it accepts connections. This causes intermittent startup failures. Fix: add `healthcheck` blocks to `mongodb` and `redis` services, and use `depends_on: { mongodb: { condition: service_healthy } }`.

- [BLOCKER] **Single `.env` file shared by api and web via `env_file: .env`** -- The plan defines separate env var sets for api (MONGODB_URI, JWT secrets, etc.) and web (VITE_API_URL, etc.), but both services reference the same `.env` file. This means JWT secrets, MongoDB URI, and Google OAuth credentials are exposed to the frontend container's environment. Even though Vite only bundles `VITE_`-prefixed vars, the raw secrets exist in the container process environment. Worse, if a developer puts `NODE_ENV=production` for the API, the web dev server also reads it and may change behavior. Fix: use `api/.env` and `web/.env` separately, or use explicit `environment:` blocks per service in compose.

---

### Infrastructure Gaps

- [GAP] **No `.dockerignore` file mentioned** -- Without `.dockerignore`, `COPY . .` sends `node_modules/` (potentially hundreds of MB), `.git/`, `.env` (with secrets), test fixtures, and documentation into the build context. This makes builds slow, bloats image layers, and risks leaking secrets into the image. The plan mentions `.gitignore` in the folder structure but `.dockerignore` is absent. Each service directory (`api/`, `web/`) needs its own `.dockerignore`.

- [GAP] **No non-root USER in either Dockerfile** -- Both Dockerfiles run as root. In production, a compromised Node.js process running as root can write anywhere in the container filesystem and interact with the Docker socket if mounted. Fix: add `RUN addgroup -S app && adduser -S app -G app` and `USER app` before `CMD`.

- [GAP] **No HEALTHCHECK instruction in either Dockerfile** -- The API has a `/api/v1/health` endpoint (Phase 1.7), but neither Dockerfile declares a `HEALTHCHECK` instruction. Without it, Docker and orchestrators (Compose, Swarm, Kubernetes) cannot automatically detect a crashed or hung process. Fix: add `HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3001/api/v1/health || exit 1` to the api Dockerfile.

- [GAP] **nginx.conf referenced but never defined** -- `web/Dockerfile` copies `nginx.conf` but the plan never specifies its contents. This file needs SPA fallback (`try_files $uri /index.html`), gzip compression, cache headers for hashed assets, and a health check location. Without it, client-side routing will 404 on page refresh.

- [GAP] **No resource limits in docker-compose** -- No `deploy.resources.limits` or `mem_limit`/`cpus` defined. A runaway MongoDB query or a memory leak in the API can consume all host memory and freeze the developer's machine. Basic limits (`mem_limit: 512m` for api, `1g` for MongoDB) prevent this.

- [GAP] **No explicit Docker network defined** -- The compose file relies on the implicit default network. This works for simple setups but makes it impossible to isolate services or connect to external compose stacks later. Define `networks: { webchat: {} }` and assign services explicitly.

- [GAP] **No `docker-compose.test.yml` or test profile** -- Integration tests need a separate MongoDB instance to avoid polluting dev data. The plan uses `mongodb-memory-server` for unit tests but says nothing about running the full stack in a CI-like configuration. A `docker-compose.test.yml` (or compose profiles) with a separate MongoDB instance and deterministic environment is needed for reliable integration testing.

- [GAP] **No seed script for local development data** -- After `docker-compose up`, the developer faces an empty database. There is no mention of a seed script to create test users, conversations, or messages. Since auth is Google OAuth only, the developer cannot even log in without a real Google OAuth client ID configured. A seed/bypass mechanism for local dev (e.g., a dev-only `/auth/dev-login` endpoint or a seed script that inserts test users and generates valid JWTs) is essential.

- [GAP] **node_modules copied from builder in API Dockerfile includes devDependencies** -- `COPY --from=builder /app/node_modules ./node_modules` copies the full install (including devDependencies like vitest, eslint, etc.) into the production image. Fix: run `pnpm install --frozen-lockfile --prod` in a separate stage, or use `pnpm deploy --prod` to create a pruned production bundle.

- [GAP] **No `restart` policy on any service** -- If MongoDB or Redis crashes during development, the developer has to manually restart. Add `restart: unless-stopped` at minimum.

- [GAP] **Redis has no persistence configuration** -- Redis data (sessions, rate limit counters) is lost on every container restart. For dev this is annoying; for production it means all users are logged out on every deploy. At minimum, note the production requirement for Redis persistence (RDB/AOF) and consider `--appendonly yes` for the dev compose as well.

---

### Security Issues (infra-level)

- [SECURITY] **Secrets have default placeholder values in the env example that could be copied as-is** -- `.env.example` shows `JWT_ACCESS_SECRET=<random-64-char>` which is good as a placeholder, but `PORT=3001`, `NODE_ENV=development`, and `MONGODB_URI=mongodb://localhost:27017/webchat` are real functional values. The danger is that someone copies `.env.example` to `.env` and runs in production with the default MongoDB URI (no auth) and default development settings. Fix: secrets like `JWT_ACCESS_SECRET` and `GOOGLE_CLIENT_SECRET` should have empty values or `CHANGE_ME` with a startup validation that rejects those sentinel values.

- [SECURITY] **MongoDB has no authentication in docker-compose** -- `image: mongo:7` with no `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD` environment variables means the database accepts unauthenticated connections from any container on the network (and from the host via the published port `27017`). For local dev this is convenient but it trains developers to use unauthenticated connection strings. At minimum, document that production MongoDB requires auth, and consider adding auth even in dev compose for parity.

- [SECURITY] **Redis has no password** -- Same issue as MongoDB. `redis:7-alpine` with no `--requirepass` flag. Any process on the host or Docker network can read/write session data and rate limit state.

- [SECURITY] **Ports published to host for MongoDB and Redis** -- `ports: ["27017:27017"]` and `ports: ["6379:6379"]` expose database ports to localhost. This is fine for dev but the plan should note that production deployments must NOT expose these ports. There is no documentation or warning about this.

- [SECURITY] **`.env` file is not explicitly listed in `.gitignore` in the plan** -- The plan mentions `.gitignore` in the folder structure but never specifies its contents. The `.env` file containing JWT secrets and Google OAuth credentials must be in `.gitignore`. This seems obvious but it is not explicitly stated and is a common source of secret leaks.

---

### DX Improvements

- [DX] **The "getting started" flow requires 5 steps and implicit knowledge** -- The README plan (Phase 9.3) lists: clone, copy `.env.example`, `pnpm install`, `docker-compose up`, `pnpm dev`. This is 5 steps, two terminal windows (compose in one, pnpm dev in another), and requires the developer to know they need Docker running first. A `Makefile` or root script (`pnpm start:dev`) that runs compose in detached mode, waits for health checks, then starts the dev servers would reduce this to one command.

- [DX] **No `pnpm dev` command starts infrastructure** -- The root `pnpm dev` script (`pnpm -r --parallel dev`) only starts the Node.js dev servers. It does not start MongoDB or Redis. The developer must remember to run `docker-compose up` first in a separate terminal. This is a guaranteed source of "why isn't it working" questions from every new team member.

- [DX] **No mention of pino-pretty for development logs** -- pino outputs JSON by default, which is unreadable for human development. The plan mentions pino (Phase 1.5) but never mentions `pino-pretty` as a dev transport. Without it, developers see single-line JSON blobs for every request. Add `pino-pretty` as a devDependency and configure it as the transport when `NODE_ENV=development`.

- [DX] **No `docker-compose down -v` warning or cleanup script** -- MongoDB named volumes persist across `docker-compose down`. When a developer wants a fresh database (schema changed, seed data corrupted), they need to know about `-v`. A `pnpm clean` or `make reset` command that tears down volumes and re-seeds would save time.

- [DX] **Google OAuth requires real credentials for any local testing** -- There is no dev-only authentication bypass. Every developer needs to create a Google Cloud project, configure OAuth consent screen, and obtain client credentials before they can log in locally. This violates the "working in 5 minutes" goal. A dev-only login route or a mock OAuth provider for local development is needed.

- [DX] **No mention of VS Code devcontainer or codespace configuration** -- For teams, a `.devcontainer/` config eliminates "works on my machine" entirely. Not critical but worth noting as a future improvement.

- [DX] **No `docker-compose up -d` mentioned in the README flow** -- The README steps show `docker-compose up` which blocks the terminal. The developer then needs a second terminal for `pnpm dev`. Either use `-d` (detached) or provide a single script that handles both.

---

### Verdict

The plan is strong on application architecture -- the tech choices are solid, the API design is thorough, and the auth flow is well thought out. But the Docker and local dev infrastructure is a rough sketch that will not work as written. The docker-compose.yml has fundamental conflicts between production Dockerfiles and dev-mode commands. There are no health checks, no `.dockerignore`, no non-root users, no resource limits, no network isolation, and no seed data strategy.

The most critical issue: a new developer cannot get a working environment from what is written. The production Dockerfiles cannot run dev commands, the volume mounts are misaligned, and Google OAuth requires external credential setup with no bypass for local development. The "clone and run in 5 minutes" goal is not achievable without significant rework of the Docker strategy.

Recommended immediate actions:
1. Split the Docker strategy: use compose only for MongoDB + Redis locally; run api/web natively with `pnpm dev`. Keep production Dockerfiles separate and CI-only.
2. Add health checks to all compose services with `condition: service_healthy` in `depends_on`.
3. Create a `.dockerignore` for each service.
4. Add a non-root USER to both Dockerfiles.
5. Add a dev-only auth bypass or seed script so developers can log in without Google credentials.
6. Create a single `pnpm start:dev` command that starts compose (detached), waits for healthy services, then starts the dev servers.
