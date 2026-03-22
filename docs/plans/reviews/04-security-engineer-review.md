# Security Engineer Review

## Overall Score: 6/10

The plan demonstrates above-average security awareness for a project at the planning stage -- refresh token rotation with reuse detection, httpOnly cookies, helmet.js, rate limiting, Zod validation, and structured error handling are all explicitly addressed. However, several critical gaps exist that would be exploitable in production without remediation. The most dangerous problems are in WebSocket authorization, the OAuth callback flow, and the deferred security hardening phase.

---

## Critical Vulnerabilities (exploitable as designed)

### CRITICAL-01: WebSocket events have no per-event room membership authorization

**Location**: Section 8 (WebSocket Event Contract), Phase 4 tasks 4.7-4.8

The plan authenticates the socket connection (JWT verification on handshake in `auth.socket.ts`), but there is zero mention of per-event authorization. The `send_message` handler (Section 4.8) says "validate, save to DB, emit `new_message` to room" -- but never specifies checking whether the authenticated user is actually a participant of `conversationId`.

**Attack scenario**: Authenticated user A opens DevTools, emits `send_message` with `conversationId` belonging to a private conversation between users B and C. The server saves the message and broadcasts it. User A has injected content into a conversation they do not belong to.

The same applies to `join_room`, `typing_start`, `message_read`, and `message_delivered` -- all accept a `conversationId` from the client with no documented membership check.

**Fix**: Every socket event handler that accepts a `conversationId` MUST verify `ConversationMember.findOne({ conversationId, userId: socket.data.userId, leftAt: null })` before processing. Document this as a mandatory pattern in the socket handler architecture. Create a shared `assertMembership(userId, conversationId)` guard used by every handler.

---

### CRITICAL-02: OAuth state parameter validation is ambiguous -- likely CSRF on OAuth callback

**Location**: Section 7.1 (Google OAuth Sequence)

The sequence diagram shows Google returning `?code=ABC&state=XYZ` to the callback, but the plan never specifies:
- How the `state` parameter is generated (cryptographically random? signed?)
- Where it is stored before the redirect (server-side session? cookie?)
- Whether the callback handler validates `state` against the stored value

The `GET /auth/google` endpoint accepts `redirect_uri` as a query parameter (Section 6.1), which is another red flag -- an attacker can craft a link like `/auth/google?redirect_uri=https://evil.com` and if the redirect is not validated, they can steal the authorization code or tokens.

**Attack scenario (CSRF)**: Attacker initiates an OAuth flow, captures the callback URL with their own code, and tricks a victim into visiting it. Without state validation, the server exchanges the attacker's code and links the attacker's Google account to the victim's session.

**Attack scenario (open redirect)**: Attacker crafts `/auth/google?redirect_uri=https://evil.com/steal`. After OAuth, the server redirects to the attacker's domain with tokens in the URL.

**Fix**:
1. Generate a cryptographically random `state` value, store it in a short-lived httpOnly cookie or server-side session, and validate it in the callback handler. Reject the callback if `state` does not match.
2. The `redirect_uri` parameter MUST be validated against a whitelist of allowed origins (the frontend URL only). Do not pass it through to Google or use it in the final redirect without validation.

---

### CRITICAL-03: Access token delivered via URL fragment after OAuth -- token leakage

**Location**: Section 7.1, line "Frontend reads access token from URL hash fragment or makes immediate /auth/refresh call"

The "or" here is dangerous. If the access token is placed in a URL hash fragment (`#access_token=...`) during the OAuth redirect:
- The token appears in browser history
- The token may be logged by any analytics scripts or browser extensions
- The token is visible in the Referrer header if the user clicks an external link

**Attack scenario**: User completes OAuth. Access token is in the URL bar. User copies the URL to share with a colleague, or browser history sync sends it to another device. Token is compromised.

**Fix**: Never put the access token in the URL. The OAuth callback should ONLY set the httpOnly refresh cookie and redirect to the frontend with no token in the URL. The frontend then calls `POST /auth/refresh` to obtain the access token. The plan actually describes this as an option -- make it the ONLY option. Remove the URL hash fragment approach entirely.

---

### CRITICAL-04: No JWT algorithm pinning -- vulnerable to alg:none attack

**Location**: Section 2.2 (jsonwebtoken 9.x), Section 7.2 (JWT Lifecycle), Phase 2 task 2.3

The plan specifies using `jsonwebtoken` for sign/verify but never specifies which signing algorithm is used. The `signAccessToken` and `verifyAccessToken` pseudocode (Phase 2.3) shows no `algorithm` option.

**Attack scenario**: If the server does not explicitly set `algorithms: ['HS256']` (or whichever algorithm is chosen) in `jwt.verify()`, an attacker can forge a token with `"alg": "none"` in the header, which some JWT libraries accept as valid. The `jsonwebtoken` library is partially hardened against this, but only if you do NOT pass `algorithms` that include `none`. Explicit pinning is the only safe approach.

**Fix**: Explicitly specify `algorithm: 'HS256'` in `jwt.sign()` and `algorithms: ['HS256']` in `jwt.verify()`. Document this in the JWT utility specification (Phase 2.3). Consider using RS256 with asymmetric keys for production -- this prevents key confusion attacks and allows the frontend to verify tokens without knowing the secret.

---

## High Risk Gaps (likely to be exploited)

### HIGH-01: Authorization checks only at route middleware layer -- no service-layer enforcement

**Location**: Entire API architecture (Sections 4, 6)

The plan mentions `auth.middleware.ts` for JWT verification on routes, but authorization (who can do what) is never explicitly documented at the service layer. For example:
- `PATCH /messages/:id` (edit message) -- the plan says "Auth: Yes" but does not specify that `message.senderId === req.user.id` is checked.
- `DELETE /messages/:id` (soft-delete) -- same gap.
- `GET /conversations/:id` -- no documented check that the requesting user is a participant.
- `PATCH /conversations/:id` -- no documented check for membership or admin role.

If authorization is only in middleware (which typically just verifies "is authenticated"), any authenticated user can access any resource by guessing IDs.

**Fix**: Document explicit authorization rules for every endpoint. Create an `assertConversationMember(userId, conversationId)` service-layer guard. For message operations, check `message.senderId === userId`. These checks MUST be in the service layer, not just the controller, so they also protect the Socket.IO code path.

---

### HIGH-02: User ID sourced from request body in `CreateConversationBody`

**Location**: Section 6.2, `CreateConversationBody` type

The `CreateConversationBody` includes `participantIds: string[]`. The plan does not specify whether the requesting user's own ID is automatically included from the JWT or if the client is trusted to include it. If the client supplies participant IDs, they can:
1. Create conversations that include arbitrary users who never consented.
2. Exclude themselves from the participant list to create "ghost" conversations.

**Fix**: The server MUST always inject `req.user.id` into the participant list from the JWT. The client should only supply the IDs of the OTHER participants. Document this explicitly. Additionally, for group conversations, consider requiring an invitation/acceptance flow rather than instant forced inclusion.

---

### HIGH-03: No sanitization on `avatarUrl` field -- stored SSRF and XSS

**Location**: Section 5.1 (User model), Section 6.1 (`PATCH /users/me/profile`)

The `UpdateProfileBody` allows setting `avatarUrl` as a free-form string. The Mongoose schema has `avatarUrl: { type: String, default: '' }` with no URL validation.

**Attack scenario (Stored XSS)**: User sets `avatarUrl` to `javascript:alert(1)` or a `data:text/html` URI. When rendered in an `<img>` tag, some browsers may execute it. More realistically, if the URL is ever used in a non-`<img>` context (e.g., CSS `background-image`, or a link), it becomes XSS.

**Attack scenario (SSRF)**: If the server ever fetches or processes the avatar URL (e.g., for resizing, caching, or Open Graph previews), an attacker can set it to `http://169.254.169.254/latest/meta-data/` to probe internal infrastructure.

**Fix**: Validate `avatarUrl` with a Zod schema that enforces `z.string().url()` with an explicit protocol whitelist (`https://` only). For Google OAuth users, only allow URLs from `lh3.googleusercontent.com`. If arbitrary URLs are needed later, proxy them through the server with a URL whitelist.

---

### HIGH-04: `connectionStateRecovery.skipMiddlewares: true` bypasses auth on reconnect

**Location**: Section 8.2 (Socket.IO Server Configuration)

The plan sets `skipMiddlewares: true` for connection state recovery. This means that when a client reconnects within the 2-minute window, Socket.IO skips ALL middleware -- including `socketAuthMiddleware`. If the user's access token expired or was revoked during the disconnection, the reconnected socket is still treated as authenticated with the old `socket.data`.

**Attack scenario**: User logs out on another device (revoking tokens). They still have an active socket with `skipMiddlewares: true`. The socket reconnects within 2 minutes and continues operating without re-authentication.

**Fix**: Set `skipMiddlewares: false` or implement a custom recovery handler that re-validates the token. The reconnection latency cost is minimal compared to the security risk.

---

### HIGH-05: Emoji reaction `emoji` field is unbounded -- potential storage bomb and XSS

**Location**: Section 5.3 (Message model), Section 6.2 (`AddReactionBody`)

The `reactions` array stores `{ emoji: string, userId: ObjectId }`. The `AddReactionBody` only requires `{ emoji: string }`. There is no constraint on:
- The length of the emoji string (could be a 10KB Unicode string)
- Whether it is actually an emoji (could be HTML, script tags, or arbitrary text)
- How many reactions a single user can add to one message
- How many total reactions a message can have

**Attack scenario**: An attacker sends thousands of unique "emoji" strings per message, bloating the document beyond MongoDB's 16MB BSON limit, or uses HTML/JS in the emoji field for XSS when rendered.

**Fix**:
1. Validate `emoji` with a strict whitelist or regex for valid Unicode emoji codepoints (max 1-2 codepoints).
2. Limit reactions per user per message to 1 instance of each emoji.
3. Limit total reactions per message (e.g., 50).
4. HTML-escape the emoji value before rendering on the client.

---

## Medium Risk (should address before launch)

### MEDIUM-01: Security hardening deferred to Phase 8 -- security is an afterthought

**Location**: Phase 8 (Security Hardening), Appendix C (Phase Dependencies)

Rate limiting, CSP, input sanitization, and MongoDB injection prevention are all deferred to Phase 8, which is the second-to-last phase. This means Phases 1-7 run in production-like environments without:
- Rate limiting (any script can spam the API)
- Input sanitization (XSS vectors in messages from Phase 4 onward)
- CSP headers (no defense-in-depth against XSS)

**Fix**: Move security controls into the phases where the attack surface is introduced. Rate limiting should be in Phase 1 (API Foundation). Input sanitization must be in Phase 4 (when messages are first stored). CSP should be in Phase 3 (Web Foundation). Phase 8 should be a hardening and audit phase, not the introduction of basic security controls.

---

### MEDIUM-02: No CSRF token mechanism documented despite using cookies

**Location**: Section 7.2 (JWT Lifecycle)

The plan argues that `sameSite: strict` on the refresh cookie eliminates CSRF. This is mostly correct for the refresh endpoint, but `sameSite: strict` has compatibility issues:
- It breaks in Safari when navigating from an external link (the cookie is not sent on the first request after a cross-site navigation).
- If ANY future endpoint uses the cookie for authentication (not just `/api/v1/auth`), and `sameSite` is accidentally weakened, CSRF becomes exploitable.

**Fix**: Implement a defense-in-depth approach. Use `sameSite: lax` (better Safari compatibility) combined with a CSRF token (e.g., the double-submit cookie pattern or a synchronizer token). Alternatively, document explicitly that the refresh cookie `path: /api/v1/auth` restriction is the CSRF mitigation and add integration tests that verify the cookie is NOT sent to other API paths.

---

### MEDIUM-03: No account enumeration prevention on user search

**Location**: Section 6.1 (`GET /users/search`), Phase 4 task 4.6

The user search endpoint (`GET /users/search?q=...`) returns user objects including email addresses. Any authenticated user can enumerate all users in the system by searching common names or email patterns.

**Fix**:
1. Rate limit the search endpoint (this is planned in Phase 8 but should be immediate).
2. Return only `displayName`, `avatarUrl`, and `_id` from the search endpoint -- not `email`.
3. Consider requiring a minimum query length (3+ characters) to prevent broad enumeration.

---

### MEDIUM-04: Soft-deleted messages remain visible in data layer

**Location**: Section 5.3 (Message model), Section 6.1

Messages use soft delete (`deletedAt: Date | null`), but the plan does not specify that query filters exclude soft-deleted messages. The `GET /conversations/:id/messages` endpoint and all Socket.IO events could return messages with `deletedAt !== null`, leaking "deleted" content.

**Fix**: All message queries MUST include `{ deletedAt: null }` as a default filter. The service layer should enforce this. For `message_deleted` socket events, only send the `messageId`, never the content. Consider overwriting `content` with a placeholder string (e.g., "This message was deleted") at the service layer when `deletedAt` is set.

---

### MEDIUM-05: No request body size limit on Socket.IO events

**Location**: Section 8.2 (`maxHttpBufferSize: 1e6`)

The `maxHttpBufferSize: 1e6` (1MB) applies to the HTTP transport, but the Socket.IO event payload for `send_message` has a `content` field with a Mongoose `maxlength: 10000` (10K characters). However:
- The Zod validation on socket events is not documented (only REST validation is explicit).
- 1MB allows an attacker to send a single socket event with a massive payload that consumes server memory during parsing before validation rejects it.

**Fix**:
1. Reduce `maxHttpBufferSize` to 100KB (more than enough for any legitimate chat message).
2. Explicitly document that ALL socket event handlers must validate input with the same Zod schemas used by REST endpoints.

---

### MEDIUM-06: `health` endpoint exposes infrastructure details

**Location**: Section 6.1 (Health Route)

The health check returns `{ mongo: 'connected' | 'disconnected', redis: 'connected' | 'disconnected' }`. This reveals the database technologies in use to any unauthenticated caller.

**Fix**: The public health endpoint should return only `{ status: 'ok' }` or `{ status: 'degraded' }`. The detailed component status should be on a separate internal endpoint protected by an API key or network restriction.

---

### MEDIUM-07: No conversation join/invite mechanism for group chats

**Location**: Section 5.2 (Conversation model), Section 6.1 (Conversation Routes)

The `POST /conversations` endpoint accepts `participantIds` and immediately creates the conversation with all participants added. There is no invitation or consent mechanism. Any authenticated user can force any other user into a group conversation.

**Fix**: For group conversations, implement an invitation flow where added users must accept before they see the conversation. At minimum, document this as a known limitation and add the ability to block users or leave conversations immediately.

---

## Security Debt (acceptable to defer with tracking)

### DEFERRED-01: No file upload security controls

**Location**: Section 9.5 (File Upload Strategy)

File uploads are explicitly deferred to post-MVP. The data model supports `contentType: 'image' | 'file'` but no upload endpoint exists. When implemented, the following must be addressed: MIME type validation (not just extension), file size limits enforced server-side, no direct filesystem path exposure, virus scanning for uploads, image reprocessing to strip EXIF metadata and embedded scripts.

**When to address**: Before file upload feature is enabled. Block the feature flag until security review is complete.

---

### DEFERRED-02: No WebSocket rate limiting

**Location**: Section 9.6 (Rate Limiting Strategy)

Rate limiting is defined for REST endpoints only. Socket.IO events (`send_message`, `typing_start`, etc.) have no documented rate limiting. An attacker can flood `typing_start` events or spam `send_message` at arbitrary rates.

**When to address**: Phase 4 at the latest, when socket handlers are implemented. Implement per-socket event rate limiting using a sliding window counter in Redis.

---

### DEFERRED-03: No audit logging for sensitive operations

There is no mention of audit logging for: token revocation events, conversation creation/deletion, user profile changes, admin-level actions. For a chat application, audit trails are important for abuse investigation.

**When to address**: Before any production deployment with real users.

---

### DEFERRED-04: No session termination UI

**Location**: Section 5.4 (RefreshToken model)

The RefreshToken model stores `userAgent` and `ipAddress`, suggesting a future "active sessions" feature. But there is no endpoint or UI for viewing/revoking individual sessions. A user who suspects their account is compromised has no way to revoke specific sessions -- only full logout.

**When to address**: Before public launch. Add `GET /auth/sessions` and `DELETE /auth/sessions/:id` endpoints.

---

### DEFERRED-05: No Content Security Policy reporting endpoint

**Location**: Phase 8 task 8.2

CSP is defined but there is no `report-uri` or `report-to` directive. Without reporting, CSP violations in the wild go undetected, and you cannot iterate on the policy effectively.

**When to address**: During Phase 8, configure `report-to` with a CSP reporting service.

---

## Threat Model Summary

The plan has a genuinely solid foundation for authentication -- the refresh token rotation with family-based reuse detection is well-designed, and the httpOnly cookie + in-memory access token split is a strong pattern. The choice of Zod for input validation, helmet for security headers, and pino for structured logging shows security-conscious technology selection.

However, the plan has a dangerous blind spot in authorization. Authentication (who are you?) is well-covered. Authorization (what can you do?) is almost entirely absent from the specification. No endpoint documents its authorization rule. No service method specifies ownership or membership checks. The WebSocket layer is particularly exposed -- it authenticates the connection but does not authorize individual events, which means any authenticated user can interact with any conversation.

The second systemic issue is the sequencing of security controls. Deferring rate limiting, input sanitization, and CSP to Phase 8 means the application runs through 7 phases of development with exploitable attack surfaces. XSS via message content is possible from Phase 4 onward. Rate limiting abuse is possible from Phase 1 onward.

The OAuth callback flow has two concrete vulnerabilities: ambiguous state parameter validation and the option to deliver access tokens via URL fragments. Both are exploitable by a moderately skilled attacker.

---

## Verdict

This plan is designed by someone who understands modern authentication patterns but has not applied the same rigor to authorization, input handling, and real-time event security. The authentication architecture (token rotation, httpOnly cookies, separate secrets) is genuinely good work. But a chat application's primary attack surface is the message and conversation layer -- and that is where the plan is weakest.

The four critical vulnerabilities (unauthroized socket events, OAuth state/redirect, URL token leakage, JWT algorithm pinning) are all exploitable in the current design and must be addressed before any code is written. The high-risk gaps (service-layer authorization, avatar URL SSRF, socket reconnect auth bypass, reaction abuse) should be designed into the architecture from the start, not patched later.

My recommendation: do not start implementation until the plan explicitly documents authorization rules for every endpoint and every socket event, pins the JWT algorithm, removes the URL fragment token delivery, and moves input sanitization into Phase 4. These are architectural decisions that become exponentially harder to retrofit.
