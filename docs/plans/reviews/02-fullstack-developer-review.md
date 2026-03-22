## Fullstack Developer Review

### Overall Score: 7/10

This is a thorough plan that covers a lot of ground. The data models, API contract, WebSocket event typing, and auth flow are genuinely well thought out. But several areas will cause real implementation friction or outright compilation failures if followed literally. Below is everything I found.

---

### Implementation Blockers (will stop dev cold)

- [BLOCKER] **`exactOptionalPropertyTypes: true` will break Mongoose schemas immediately.** The plan enables this in `tsconfig.base.json` (line 1811) and all Mongoose schemas use `default: null` patterns (e.g., `replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null }`). With `exactOptionalPropertyTypes`, assigning `undefined` to an optional property that is typed as `T | null` (but not `T | null | undefined`) becomes a compile error. Mongoose's internal typing relies on `undefined` for optional fields. This will cause dozens of type errors across every model file. **Fix**: Either remove `exactOptionalPropertyTypes` from the base config, or document a Mongoose-compatible pattern that explicitly adds `| undefined` to every nullable field in the Document interfaces.

- [BLOCKER] **Docker Compose dev setup is contradictory.** The `api/Dockerfile` (line 1878-1896) is a production multi-stage build that compiles to `dist/` and runs `node dist/server.js`. The `docker-compose.yml` then overrides the CMD with `pnpm --filter api dev` and mounts `./api/src:/app/src` for hot reload. But the Dockerfile only copies `package.json`, `pnpm-lock.yaml`, and runs `pnpm install` at the root context -- it does not copy the shared package, `pnpm-workspace.yaml`, or the root `package.json`. `pnpm --filter api dev` will fail because the workspace structure is not present inside the container. Same problem for `web`. **Fix**: Either (a) create a separate `docker-compose.dev.yml` that uses a dev-specific Dockerfile with the full workspace context and all three packages mounted, or (b) document that local dev runs `pnpm dev` directly on the host with only MongoDB and Redis in Docker Compose.

- [BLOCKER] **Shared package is not buildable.** The plan lists `packages/shared/package.json` and `tsconfig.json` but never specifies how the shared package is consumed. There is no `build` script, no mention of `tsup` or `tsc` as the build tool, no `main`/`exports` field in `package.json`, and no path alias configuration. When `api` or `web` tries to `import { IUser } from '@webchat/shared'`, it will fail unless: (a) there is a build step that outputs `.js` + `.d.ts`, or (b) the consuming tsconfigs use project references with `composite: true`, or (c) the consuming bundlers (Vite for web, `tsx` for api) are configured to resolve TypeScript source directly. The plan mentions none of these. **Fix**: Specify the exact build/consumption strategy. Recommended: configure `package.json` `exports` to point at TypeScript source (`"./src/index.ts"`) and let each consumer's bundler handle it, documented explicitly in the plan.

- [BLOCKER] **`noUncheckedIndexedAccess: true` is enabled but the optimistic update code and array access patterns ignore it.** The pseudo-code at line 1651 does `old.messages` spread without null-checking. With `noUncheckedIndexedAccess`, any `array[index]` returns `T | undefined`, meaning every `participants[0]`, `readBy[i]`, `messages[cursor]` pattern in the services will need explicit narrowing. This is the right flag to enable, but the plan's code examples do not demonstrate awareness of it. **Fix**: Add a note in Phase 0 acknowledging this flag's impact and showing the project's canonical pattern for safe indexed access (e.g., guard clauses, `Array.at()` with narrowing, or a shared `assertDefined` utility).

- [BLOCKER] **No `express-async-errors` or async wrapper specified.** Express 4.x does not catch rejected promises in route handlers. If any `async` controller throws, the error will be an unhandled rejection that crashes the process instead of reaching the global error handler. The plan describes a global error handler middleware (line 2079) but never mentions how async errors get there. **Fix**: Either (a) add `express-async-errors` to the dependency list (one import at the top of `app.ts` patches Express), or (b) specify a `catchAsync` wrapper function that every route handler must use, or (c) upgrade to Express 5.x which handles async natively (but then the `express: 4.x` version pin is wrong).

---

### Technical Gaps (vague or incorrect)

- [GAP] **`api/tsconfig.json` says it adds `"jsx": "react-jsx"` exclusion (line 1826) -- this makes no sense.** The API is an Express server; it does not use JSX. It should set `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` if running via `tsx` or compiled with `tsc`, or keep `"bundler"` if using a bundler. The plan does not specify how the API TypeScript is compiled for development (`tsx watch`? `ts-node`? `tsc --watch + nodemon`?) or for production (`tsc` to `dist/`?). **Fix**: Specify `tsx` for dev and `tsc` for production build. Set the API tsconfig to `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

- [GAP] **The validate middleware only validates `req.body` (line 2330-2335).** The API contract includes query parameters (`q`, `limit`, `page`, `before`) and route params (`:id`). The middleware needs to validate all three: `req.body`, `req.query`, `req.params`. **Fix**: The validate middleware should accept a schema object with optional `body`, `query`, `params` keys, each a Zod schema, and validate all present keys.

- [GAP] **Response envelope is inconsistent.** Some endpoints return `{ user: IUser }`, others return `{ conversations: [...], total }`, and there is a generic `PaginatedResponse<T>` defined at line 1336 that is never actually used by any endpoint. The conversations list returns `{ conversations, total }` instead of `{ data, total, page, limit, hasMore }`. The messages list returns `{ messages, hasMore }` without `total`. **Fix**: Pick one envelope and use it everywhere. Either adopt `PaginatedResponse<T>` for all list endpoints, or remove it and document the per-endpoint shapes. Currently the developer will not know which pattern to follow.

- [GAP] **Socket.IO event `send_message` duplicates REST `POST /conversations/:id/messages`.** The plan says the REST endpoint is a "fallback" (line 1227) but does not define when the client should use REST vs socket. If both exist, the service layer must be shared, but the plan has message creation logic in both `message.controller.ts` (REST) and `message.handler.ts` (Socket). Without explicit guidance, the developer will implement the same logic twice with subtle divergences. **Fix**: Specify that the Socket handler calls `message.service.ts` internally (same as the REST controller), and that the REST endpoint exists only for when the socket is disconnected.

- [GAP] **No mention of how to handle the `conversation:<id>` unique index for DMs.** The plan creates a partial unique index on `{ participants: 1, type: 1 }` where `type: 'direct'` (line 971-975). But MongoDB array equality in unique indexes is order-dependent -- `[userA, userB]` and `[userB, userA]` are different values. The index will NOT prevent duplicate DM conversations with the same pair in different order. **Fix**: The service layer must sort participant IDs before insertion, and this sorting must be documented as a hard requirement in the plan.

- [GAP] **Auth callback does not explain how the access token reaches the frontend.** Line 1369 says "302 redirect to frontend" and line 1370 says "frontend reads access token from URL hash fragment or makes immediate /auth/refresh call". The "or" is a design decision that must be made, not deferred. URL hash fragments are visible in browser history. **Fix**: Specify that the callback redirects to the frontend with no token in the URL, and the frontend immediately calls `POST /auth/refresh` using the httpOnly cookie that was just set. This is the secure pattern consistent with the rest of the auth design.

- [GAP] **`tailwind.config.ts` is listed (line 824) but Tailwind v4 does not use `tailwind.config.ts`.** Tailwind CSS v4 moved all configuration to CSS (`@theme` in `app.css`), which the plan already does. The config file is a v3 artifact. Having both will confuse the developer. **Fix**: Remove `tailwind.config.ts` from the folder structure. All config is in `app.css` via `@theme`.

- [GAP] **No Vite proxy for WebSocket connections.** The plan configures a Vite proxy for `/api` (line 2203) but Socket.IO needs its own proxy entry for the `/socket.io/` path. Without it, WebSocket connections will fail in dev mode because the browser connects to `localhost:5173` but the Socket.IO server is on `localhost:3001`. **Fix**: Add `'/socket.io': { target: 'http://localhost:3001', ws: true }` to the Vite proxy config.

- [GAP] **`bcrypt` is listed for hashing refresh token fingerprints (line 117) but the actual implementation uses SHA-256 (line 1108, 2129).** bcrypt is a password hashing algorithm -- slow by design. SHA-256 is a fast hash appropriate for token fingerprinting. The plan describes the correct approach (SHA-256) in the implementation but lists bcrypt in the dependency table with the wrong justification. **Fix**: Remove `bcrypt` from the dependency list if it is not used for anything else. No passwords exist in this system (Google OAuth only).

- [GAP] **`IUser._id` is typed as `string` in the shared package but Mongoose generates `ObjectId`.** When using `.lean<IUser>()`, the `_id` will be an `ObjectId` instance, not a `string`. The serialization to JSON converts it, but within the service layer, comparisons like `user._id === someStringId` will fail silently (object vs string). **Fix**: Either type `_id` as `string` and ensure all `.lean()` queries use a transform to convert `_id` to string, or use a separate API response type that has `string` IDs (mapped from the DB types that use `ObjectId`).

- [GAP] **The Conversation model's `lastMessage` sub-document schema has a conflicting `type` field.** In the Mongoose schema at line 951-963, the `lastMessage` field uses `type: { content: ..., senderId: ..., sentAt: ... }`. Mongoose interprets the `type` key as the SchemaType definition keyword, not as a field name. This conflicts with the outer `type` (which is `String` for conversation type) and will cause schema compilation errors. **Fix**: Use `Schema.Types.Mixed` or define a separate sub-schema for `lastMessage`, or use the Mongoose `typeKey` option to avoid the conflict.

- [GAP] **No mention of `@tanstack/react-router` Vite plugin for route generation.** The plan says "Install `@tanstack/react-router` + Vite plugin for file-based routing" (line 2213) but never specifies the package name (`@tanstack/router-plugin`) or the `vite.config.ts` integration. The TanStack Router file-based routing requires a plugin that generates `routeTree.gen.ts` -- this is not a trivial detail.

---

### DX Issues (will slow down daily development)

- [DX] **No path aliases defined for the API project.** The web project gets `@/` -> `src/` (line 2203), but the API project has no path alias configuration. API imports will be relative path hell: `../../../lib/errors`. **Fix**: Add `"paths": { "@/": ["./src/"] }` to `api/tsconfig.json` and configure `tsx` or the build tool to resolve them. Alternatively, use `tsconfig-paths` for runtime resolution.

- [DX] **`eslint-plugin-unicorn/recommended` enables 100+ opinionated rules.** Many will conflict with the codebase patterns (e.g., `unicorn/prevent-abbreviations` renames `req`/`res`/`err` to `request`/`response`/`error`, `unicorn/no-null` conflicts with every Mongoose `default: null`). Without a documented list of overrides, the developer will spend hours fighting ESLint on the first file. **Fix**: Specify the exact overrides in the plan, at minimum: `unicorn/prevent-abbreviations: off`, `unicorn/no-null: off`, `unicorn/no-array-for-each: off`.

- [DX] **`eslint-plugin-sonarjs/recommended` with ESLint v9 flat config.** As of late 2025, `eslint-plugin-sonarjs` uses the `eslint-plugin-sonarjs/recommended-legacy` export for flat config. The plan does not mention this. It will fail with a config error on first run. **Fix**: Verify the correct import path for the flat config export and document it.

- [DX] **No `prettier` in the tooling stack.** The plan uses ESLint for formatting (implicitly via fix) but does not include Prettier. With 2+ developers (or even one developer + AI agent), inconsistent formatting will cause noisy diffs. **Fix**: Either add Prettier with `eslint-config-prettier` to disable conflicting ESLint rules, or add an explicit note that ESLint handles formatting and configure `@stylistic/eslint-plugin` rules.

- [DX] **Vitest configs do not configure path aliases.** Both `api/vitest.config.ts` and `web/vitest.config.ts` are specified but neither includes `resolve.alias` to match the tsconfig path aliases. Imports using `@/` in test files will fail. **Fix**: Add `resolve: { alias: { '@': path.resolve(__dirname, './src') } }` to both vitest configs, or use the `vite-tsconfig-paths` plugin.

- [DX] **No MSW configuration details for the web test setup.** The plan mentions MSW in `web/src/__tests__/setup.ts` (line 806) but never shows handlers or setup. MSW v2 has a completely different API from v1 (uses `http.get()` instead of `rest.get()`), and the setup is non-trivial. A developer following this plan will get stuck. **Fix**: At minimum, specify MSW v2 and show the `setupServer`/handler pattern.

- [DX] **`pnpm -r --parallel dev` will interleave stdout from 3 packages.** This makes log output unreadable. **Fix**: Use `turbo dev` (add Turborepo) or `concurrently` with color-coded prefixes for readable output, or document that the developer should run each service in a separate terminal.

- [DX] **No mention of `tsx` in the API dev script.** The plan does not specify how `pnpm --filter api dev` works. Is it `tsx watch src/server.ts`? `ts-node-dev`? `nodemon + tsc`? This must be specified because the `package.json` scripts are not defined for the API package.

- [DX] **`pino` produces JSON logs by default, which are unreadable in development.** The plan does not mention `pino-pretty` for dev mode. **Fix**: Add `pino-pretty` as a dev dependency and pipe through it when `NODE_ENV=development`.

---

### Dependency Versions to Pin

- `@tanstack/react-router` at `1.x` -- the API changed significantly between 1.0 and 1.93+. Pin to a specific minor (e.g., `^1.80.0` or later) or the file-based routing plugin import paths will differ.
- `@tanstack/router-plugin` (Vite plugin) -- not listed at all in the dependency install commands (Appendix B). Must be added.
- `socket.io` and `socket.io-client` must be the same major version. Pin both to `4.8.x` to avoid protocol mismatch.
- `msw` -- must be `2.x` for the modern API. Not version-pinned in the install commands.
- `tailwindcss` at `4.x` -- the `@tailwindcss/vite` plugin listed in the install commands is the correct v4 integration, but `tailwind.config.ts` should not exist.
- `eslint-plugin-sonarjs` -- specify a version that supports ESLint v9 flat config natively.
- `mongoose` at `8.x` -- the Document type generics changed between 8.0 and 8.8+. Pin to `^8.8.0` or later for stable generic support with `lean<T>()`.
- `shiki` -- not in the API install commands (correct, it is frontend only) but no version specified. Pin to `1.x` -- the `shiki` package was renamed and restructured at v1.0.
- `@emoji-mart/react` and `@emoji-mart/data` -- these are large packages. The plan does not discuss bundle size impact or lazy loading strategy. At minimum note that the emoji picker should be dynamically imported.

---

### Verdict

This plan is above average in ambition and detail. The auth flow with token family rotation, the Socket.IO typed event contract, the Mongoose index strategy, and the phase-by-phase quality gates are genuinely solid work that shows real production experience.

However, it has a pattern of specifying *what* to build without specifying *how* to wire it together. The shared package has no build/consumption strategy. The Docker dev setup will not work as written. The TypeScript config enables strict flags that will immediately conflict with Mongoose patterns. The API has no async error handling and no specified dev runtime. These are not "nice to have" clarifications -- they are the kind of things that will stop a developer on day one.

If I were implementing this tomorrow, I would spend the first two hours fixing the five blockers above before writing a single line of application code. The plan needs a "Phase 0.5: Verify the toolchain actually compiles" step that walks through `pnpm dev` -> everything starts -> one test passes -> one ESLint rule triggers -> one shared type imports correctly. Until that loop works, everything downstream is theoretical.

The plan is 85% of the way to being implementable. The remaining 15% is the glue that holds it all together.
