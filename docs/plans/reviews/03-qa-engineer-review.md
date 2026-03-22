## QA Engineer Review

### Overall Score: 4/10

The plan demonstrates strong product thinking and a well-designed architecture, but the testing strategy is dangerously superficial. Testing is treated as a Phase 7 afterthought rather than an integral discipline. The plan lists what to test at a high level but almost never specifies how to test it, what infrastructure is required, or how to handle the hardest real-time testing problems. A team following this plan will reach Phase 7, discover that half the code is architecturally untestable, and spend more time refactoring for testability than writing tests.

---

### Untestable Designs (must fix in plan)

- [UNTESTABLE] **Google OAuth flow has no testability seam.** The plan says "mock Google token exchange" (Phase 2.9, 7.3) but never defines how. Passport.js strategies are deeply coupled to the HTTP redirect flow. Without an explicit design for injecting a fake Google profile at the strategy level (e.g., a factory function that accepts a mock verify callback in test mode, or extracting the profile-handling logic into a pure function that can be tested independently), integration tests will either skip OAuth entirely or require fragile HTTP intercepts. The plan must define a `createPassportStrategy(verifyFn)` pattern or an explicit seam at the auth service level that accepts a profile object directly.

- [UNTESTABLE] **Socket.IO event handlers are tightly coupled to socket instances.** Phase 4.13 says "Test socket event handlers (mock socket + DB)" but the plan's folder structure puts handlers in `socket/handlers/message.handler.ts` etc. without any specification of their function signatures. If handlers are written as `(socket: Socket, io: Server) => void` closures (the common pattern), they cannot be unit tested without constructing full Socket.IO mock objects. The plan must mandate that handler logic is extracted into pure service functions that receive plain data objects and return results, with a thin socket adapter layer that calls them. Without this separation, "unit testing" socket handlers means writing integration tests with mock sockets.

- [UNTESTABLE] **TanStack Query cache mutations from socket events.** The plan describes socket events updating TanStack Query cache from outside React (via Zustand's `getState()`), but Phase 7 testing makes no mention of how to test this boundary. You cannot use `@testing-library/react`'s `renderHook` to test imperative cache updates triggered by socket events. The plan needs to specify: (a) a `socket-event-handlers.ts` module with pure functions that take a `QueryClient` and return void, testable by constructing a real `QueryClient` in isolation, or (b) explicit integration tests that spin up both the socket mock and a test `QueryClient`.

- [UNTESTABLE] **`use-socket.ts` hook lifecycle.** This hook manages Socket.IO connection, disconnection, and reconnection. Testing reconnection behavior requires simulating network interruptions. The plan says "Test reconnection behavior" (Phase 7.5) with zero detail. `happy-dom` does not support WebSocket. Without specifying that socket-client.ts exposes a factory function accepting a mock transport, or that tests use `socket.io-mock` or a real Socket.IO server in-process, this line item is a wish, not a plan.

- [UNTESTABLE] **Intersection Observer for read receipts.** Phase 5.4 says messages are marked as read using Intersection Observer when visible. `happy-dom` does not implement Intersection Observer. The plan must specify that either (a) a polyfill/mock is registered in the test setup file, or (b) the visibility detection logic is extracted behind an adapter that can be stubbed in tests. Without this, read receipt tests will silently pass (because the observer never fires) or fail with `IntersectionObserver is not defined`.

---

### Missing Test Scenarios (critical gaps)

- [MISSING] **Empty message body submission.** No Zod schema test for `content: ""`. The `SendMessage` schema must reject empty strings, but neither Phase 4.13 ("Test Zod schemas") nor Phase 7 mentions this specific case. Empty messages are the single most common chat application bug.

- [MISSING] **Whitespace-only message body.** `content: "   \n\t  "` must be rejected. Zod's `string().min(1)` passes whitespace. The schema needs `.trim().min(1)` or a `.refine()`, and the test must verify this boundary.

- [MISSING] **Message exceeding 10,000 characters.** The Mongoose schema has `maxlength: 10000` and LIMITS constant is defined, but no test scenario verifies the Zod schema enforces this limit at the API boundary (before it reaches Mongoose). If only Mongoose validates length, the error message will be a raw Mongoose validation error leaking internal details. The plan must include a test: send 10,001-character message via REST and via socket, both return structured 400 error.

- [MISSING] **NoSQL injection in message content and query parameters.** Phase 8.5 says "Verify all queries use Mongoose parameterized methods" and "Audit all controller methods," but there is no test for it. There must be explicit test cases: `content: {"$gt": ""}` as a message body, `q: {"$regex": ".*"}` as a search parameter, and `conversationId: {"$ne": null}` as a route parameter. The audit is manual; the tests make it automated and regression-proof.

- [MISSING] **XSS payload in message content.** Phase 8.8 mentions "Test XSS: message with `<script>` -> sanitized" but this is a single test case. A real XSS test suite must cover: `<img onerror=alert(1)>`, `<svg onload=alert(1)>`, `javascript:` protocol in links, HTML entities, and nested encoding. More critically, the plan mentions DOMPurify on client and "string sanitization" on server but does not specify which library or approach for server-side sanitization, making the test target undefined.

- [MISSING] **User sends message to a conversation they are not a member of.** The plan tests conversation CRUD and message CRUD separately but never explicitly tests the authorization boundary: user A sends a message to conversation C where user A is not a participant. This must return 403, and there must be a test for it on both the REST endpoint and the `send_message` socket event.

- [MISSING] **Token expiry mid-WebSocket session.** The plan describes JWT verification on socket handshake but does not address what happens when the access token expires while the socket is connected. Socket.IO does not re-run middleware on every event. Either: (a) the server must verify the token on every event (expensive), (b) the server must have a mechanism to disconnect stale sessions, or (c) the client must proactively re-authenticate the socket after token refresh. None of these are designed, so there is nothing to test. This is a security hole, not just a testing gap.

- [MISSING] **Refresh token reuse detection under race conditions.** The plan describes family-based revocation (Phase 2.4, Section 7.3) but does not test the race condition: two browser tabs simultaneously call `POST /auth/refresh` with the same refresh token. Only one should succeed; the other should trigger family revocation. Without this test, the rotation logic may revoke a legitimate user's session on a normal tab-switch.

- [MISSING] **Rapid-fire messages (flood test).** The rate limiter allows 30 messages/minute/user. There is no test for what happens when message 31 arrives. Does the socket event return an error via the acknowledgment callback? Does the REST endpoint return 429? Is the message silently dropped? The plan must specify the behavior and test it.

- [MISSING] **Two browser tabs for the same user.** The plan mentions `user:<userId>` rooms but never tests: user opens two tabs, sends a message from tab 1, tab 2 should also show the message. User closes tab 1, presence should remain "online" because tab 2 is still connected. This is a fundamental multi-connection scenario that breaks naive presence logic (which sets status to "offline" on any disconnect).

- [MISSING] **User disconnects mid-message-send.** What happens when the socket disconnects after `send_message` is emitted but before the acknowledgment arrives? The optimistic update shows a "pending" message. Does it become "failed"? Is there a retry mechanism? The plan describes the happy path (Section 9.3) but does not design or test the failure path beyond "mark as failed."

- [MISSING] **Message delivery when recipient is offline.** The plan says messages are stored in MongoDB regardless, and `message_delivered` is emitted when the recipient's socket receives the event. But there is no test for: user A sends a message while user B is offline. User B comes online. Does B receive a `new_message` event for the missed message, or does B only see it via REST fetch? The plan's Connection State Recovery covers 2-minute windows, but what about longer offline periods?

- [MISSING] **Conversation creation with self as participant.** Can a user create a DM with themselves? The plan does not specify this edge case or test for it.

- [MISSING] **Conversation creation with duplicate participant IDs.** `participantIds: ["user1", "user1"]` -- does the Zod schema deduplicate? Does MongoDB handle it? No test specified.

- [MISSING] **Concurrent message edits.** User A edits a message. User B reacts to the same message at the same time. Does the edit overwrite the reaction or vice versa? MongoDB does not have row-level locking by default. No test specified.

- [MISSING] **Pagination boundary: exactly `limit` messages exist.** When the number of messages equals the page size exactly, does `hasMore` return `true` or `false`? Off-by-one errors in cursor pagination are extremely common and are not in the test plan.

- [MISSING] **Soft-deleted message in pagination.** If message 15 of 30 is soft-deleted, does the cursor skip it? Does the page still return `limit` items? No test specified.

---

### Naive Test Assumptions

- [NAIVE] **"Run 3 times to verify no flaky tests" (Phase 7 quality gate).** Running a test suite 3 times proves nothing about flakiness. Real-time tests with socket connections, timers (typing timeout), and database operations are inherently timing-sensitive. The plan should specify: (a) Vitest's `--retry` flag for automatic retries in CI, (b) explicit `vi.useFakeTimers()` for all timer-dependent tests (typing debounce, auto-stop, toast auto-dismiss), (c) deterministic test helpers that wait for socket events via promises rather than assuming timing. Three runs with green results is a coin flip, not a verification.

- [NAIVE] **"Mock Socket.IO server for frontend tests" (Phase 7.5).** This is one line for what is arguably the hardest testing problem in the entire application. Which mock library? `socket.io-mock` is unmaintained. `socket.io-client` can connect to a real in-process `socket.io` server -- is that the approach? Or is it MSW intercepting the WebSocket upgrade? The plan must specify the concrete library and setup pattern. Without this, whoever implements Phase 7.5 will spend days evaluating options.

- [NAIVE] **80% coverage target applied uniformly to both services.** 80% line coverage on the API is reasonable because services and controllers are straightforward to test. 80% line coverage on the web service is misleading because it will be inflated by testing simple component rendering while the hard-to-test code (socket integration, cache mutations, real-time state synchronization) remains uncovered. The plan should set differentiated targets: 80% for API, 70% for web, with an explicit list of what is excluded from coverage (animation code, CSS-in-JS, third-party component wrappers) and what must be at 90%+ (hooks, stores, utility functions).

- [NAIVE] **"Test auth service methods (mock Mongoose models)" (Phase 2.10).** Mocking Mongoose models for the auth service means mocking `findOne`, `create`, `updateOne`, etc. This tests that the service calls the right Mongoose methods with the right arguments -- it does not test that the queries actually work against MongoDB. The refresh token rotation logic (find token, check family, check revoked, create new token, revoke old token) involves multiple database operations that must be atomic. Unit tests with mocked models will pass even if the real queries have index problems or atomicity bugs. The integration tests (Phase 2.9) partially cover this, but the plan presents unit and integration as additive rather than complementary. The plan should clarify: unit tests verify business logic branching (what happens when token is revoked vs. valid), integration tests verify the queries actually work.

- [NAIVE] **"Test Zustand stores (state transitions)" (Phase 3.13).** Zustand stores with simple state (auth token, sidebar open) are trivial to test and add little value. The real testing challenge is the interaction between Zustand stores and Socket.IO events: socket receives `presence_changed`, which updates the socket store, which triggers a re-render in the sidebar. The plan lists store testing as a checkbox item without identifying these cross-cutting scenarios.

- [NAIVE] **"Test `Button` renders all variants" (Phase 3.13).** Snapshot or render testing for a design-system Button component catches zero bugs. Buttons break when click handlers are wired incorrectly, when loading states disable interactions, or when conditional rendering hides them. Testing "renders all variants" is box-checking coverage. If the plan insists on component tests, they should test behavior: "Button in loading state is disabled and shows spinner." "Button with onClick handler fires callback on click."

- [NAIVE] **Integration tests for Phase 4 assume sequential execution.** The plan lists "Test conversation CRUD" and "Test message CRUD" as separate items. But message creation depends on having a conversation. If each test file runs in isolation with its own `mongodb-memory-server` instance, every test must create its own users and conversations in `beforeEach`. The plan's `setup.ts` file (line 706) is a single line item with no detail about whether the in-memory server is shared per file, per suite, or per test. This architectural decision determines whether the test suite runs in 30 seconds or 5 minutes.

- [NAIVE] **Manual E2E flow in Phase 9 as the only E2E verification.** The plan has zero automated E2E tests. The "Manual E2E flow" (Phase 9.5) is a 9-step checklist performed by a human. This means every code change requires someone to manually sign in with Google, create a DM, send a message, open a second browser, check typing indicators, check read receipts, check presence, and sign out. This will not happen consistently. The plan should include at least a smoke test using Playwright (already in the project's testing rules) that automates the critical path: login (via `storageState`), create conversation, send message, verify message appears.

---

### Test Infrastructure Gaps

- **No test database lifecycle management.** The plan mentions `mongodb-memory-server` in Phase 0.7 and the test setup file, but does not specify: When is the in-memory server started? Per test file? Per `describe` block? When is it stopped? Are collections dropped between tests? Without this, tests will either leak state between runs or timeout due to repeated server startups. The setup file must define `beforeAll` (start server, connect mongoose), `afterEach` (drop all collections), `afterAll` (disconnect, stop server).

- **No Redis mock or in-memory Redis for tests.** The application uses Redis for rate limiting, Socket.IO adapter, typing state TTL, and presence cache. The test plan never mentions how Redis is handled in tests. Options: `ioredis-mock`, `redis-memory-server`, or skipping Redis-dependent code in unit tests with explicit mocks. Without this, any test that touches rate limiting, presence, or Socket.IO adapter will either fail or require a running Redis instance, making tests non-portable and non-isolated.

- **No MSW (Mock Service Worker) setup details for frontend.** The plan lists MSW as a dev dependency (Appendix B, line 2895) and mentions it in the test setup file name, but never defines which API routes MSW intercepts, what the mock responses look like, or whether MSW is used in `browser` mode (for Playwright) or `node` mode (for Vitest). The setup file must contain concrete MSW handlers for at least: `GET /auth/me`, `GET /conversations`, `GET /conversations/:id/messages`, and `POST /auth/refresh`.

- **No test data factories.** Every integration test needs users, conversations, and messages. The plan has no mention of factory functions (`createTestUser()`, `createTestConversation()`, `createTestMessage()`) or libraries like `fishery` or `@mswjs/data`. Without factories, each test file will have its own ad-hoc data creation code, leading to inconsistency and maintenance burden.

- **No Socket.IO testing library specified.** The plan says "Mock Socket.IO server for frontend tests" without naming a library. For backend tests, the plan says "Test socket event handlers (mock socket + DB)" without specifying whether tests use `socket.io-client` connecting to a real in-process server, or a mock library. The recommended approach for backend: spin up the actual Express+Socket.IO server in `beforeAll`, connect with `socket.io-client` in each test, tear down in `afterAll`. For frontend: either use `socket.io-mock` (if maintained) or MSW's WebSocket interception (experimental). This must be decided at plan time, not at implementation time.

- **No `vi.useFakeTimers()` strategy.** The application has multiple timer-dependent behaviors: typing auto-stop (5 seconds), toast auto-dismiss (5 seconds), typing debounce (2 seconds), JWT expiry (15 minutes). The plan never mentions fake timers. Without them, tests for these features will either use real timers (making tests slow and flaky) or be skipped. The plan must mandate `vi.useFakeTimers()` in all tests involving timeouts and specify `vi.advanceTimersByTime()` for assertions.

- **No CI pipeline defined.** The plan references `pnpm test` and `pnpm test:coverage` in quality gates for every phase, but there is no GitHub Actions workflow, no Docker-based CI setup, and no mention of CI at all. The Gantt chart (Appendix C) shows no CI phase. Without CI, test quality gates are honor-system, not enforced. At minimum, the plan should include a `.github/workflows/ci.yml` that runs lint, typecheck, and test on every push and PR.

- **No test run time budget.** With `mongodb-memory-server` startup (~2-4 seconds), potentially 100+ test files, and socket tests that involve real connections, the total test runtime could easily exceed 5 minutes. The plan has no estimated test runtime and no strategy for parallelization (Vitest's `--pool forks` vs. `--pool threads`, or `--shard` for CI). If the test suite takes too long, developers will stop running it locally.

---

### Verdict

The testing strategy in this plan is a decorated checklist, not an engineering plan. It names the right tools (Vitest, mongodb-memory-server, MSW, supertest) and identifies the right categories of tests (unit, integration, socket), but it fails at the level that matters: specifying how the hardest problems are solved.

The three critical failures are:

1. **Testing is Phase 7.** By the time the team reaches Phase 7, the code in Phases 1-6 will have been written without testability as a design constraint. Socket handlers will be closures over `io` and `socket`. Hooks will mix IO with state. Services will have implicit dependencies. Phase 7 will become "refactoring for testability" before any test is written.

2. **No real-time testing architecture.** For a real-time chat application, WebSocket testing is the ball game. The plan devotes three lines to it (Phase 7.5). There is no specification for how two simulated clients interact in a test, how socket events are awaited deterministically, how the Redis adapter is handled in test isolation, or how typing/presence timers are controlled. This is the area where the application is most likely to have bugs and where the plan provides the least guidance.

3. **No automated E2E tests.** The plan builds a real-time multi-user application and then proposes to verify its core flow manually. A single Playwright test that automates "user A sends a message, user B receives it" would catch more regressions than 200 unit tests for individual components. The absence of any E2E automation is the single largest gap in the plan.

The plan should be restructured so that (a) every phase includes its own test tasks with specific setup details, not just bullet points, (b) a WebSocket testing architecture document is created before Phase 4, (c) at least 3 automated E2E smoke tests are added using Playwright, and (d) the test setup files (`api/src/__tests__/setup.ts` and `web/src/__tests__/setup.ts`) are fully specified with database lifecycle, Redis mock, MSW handlers, fake timers, and Socket.IO mock configuration.
