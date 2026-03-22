## UI/UX Reviewer Review

### Overall Score: 7/10

The plan is significantly above average for a technical implementation document. Design tokens are thorough, the component inventory is solid, and interaction specs cover the primary flows. However, several gaps would force a developer to make subjective design decisions during implementation, and the accessibility specification is surface-level at best. A developer could build roughly 80% of the UI from this plan alone; the remaining 20% would require guesswork or follow-up questions.

---

### Showstopper Gaps (will produce inconsistent/broken UI)

- [SHOWSTOPPER] No focus ring style defined anywhere -- the plan defines hover, active, loading, and disabled states for buttons, but never specifies what the keyboard focus ring looks like. Every interactive element (buttons, inputs, sidebar items, message items, dropdown triggers, modal close buttons) needs a visible focus indicator. Without a defined token (`--focus-ring-color`, `--focus-ring-width`, `--focus-ring-offset`), each component will be implemented with ad-hoc focus styles or worse, no focus styles at all. This is both a consistency problem and a WCAG 2.1 SC 2.4.7 failure.

- [SHOWSTOPPER] No font weight scale defined -- the typography section defines `--font-sans`, `--font-mono`, font sizes, line heights, and letter spacing, but never defines font weight tokens. A chat app has at least 5 weight contexts: regular body text, bold sender names, semi-bold headings, medium button labels, and light secondary text. Without `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold` tokens, developers will hardcode arbitrary Tailwind weight classes (`font-medium`, `font-semibold`, `font-bold`) inconsistently across components.

- [SHOWSTOPPER] Message bubble layout for own messages is vague -- Section 3.3 Screen 4 says "Own messages: slight different layout (no avatar, right-aligned or subtle background differentiation)" with the word "or" doing critical load-bearing work. A developer cannot implement this without choosing between two fundamentally different layouts. Right-alignment changes the entire message list layout model. Background differentiation is a completely different approach. The plan must pick one and spec the exact CSS: background color token for own messages, alignment, avatar visibility, timestamp position, and how the hover toolbar positions relative to a right-aligned bubble.

- [SHOWSTOPPER] Consecutive message grouping rules are undefined -- chat apps universally group messages from the same sender within a time window (e.g., "same sender within 2 minutes: hide avatar and name on subsequent messages, reduce vertical spacing"). The plan shows a single standalone message bubble but never defines: (1) what constitutes a "group" of messages, (2) how the avatar/name/timestamp display changes in grouped messages, (3) the reduced vertical spacing between grouped messages vs. ungrouped messages. This directly affects the visual density of the most-viewed screen in the app.

---

### Missing States

- [STATE] Auth screen -- no state for Google OAuth popup blocked by browser. User clicks "Continue with Google", popup is blocked. The plan specifies a loading spinner and error toast, but not this specific, common failure mode. Needs: inline warning text explaining the popup was blocked, with a "Try again" link.

- [STATE] Sidebar conversation list -- no "search returned zero results" empty state. The plan defines `EmptyState` for "no conversations" and search in `SearchDialog`, but the sidebar conversation list itself has no spec for what happens when the user has conversations but a filter/search returns nothing.

- [STATE] Message list -- no "scroll to bottom" button state. Section 6.10 mentions a "New messages" button appears if scrolled up, but there is no visual spec for this element: position, styling, animation, badge count of unseen messages, or whether it appears as a floating button, a banner, or a toast-like element.

- [STATE] Message input -- no "replying to" state. The data model supports `replyTo` and the hover toolbar has a reply action, but the message input has no spec for the "replying to [message preview]" UI that should appear above the text area when the user clicks reply. Needs: the preview layout, a dismiss button, and how the quoted message is visually linked to the reply.

- [STATE] Message input -- no "editing message" state. The API supports `PATCH /messages/:id` for editing, but the message input has no spec for how editing mode looks. Needs: visual indicator that the user is editing (not composing new), the original text pre-filled, a cancel button, and whether the send button changes to "Save".

- [STATE] Message bubble -- no "edited" indicator state. The data model has `editedAt`, but the message bubble spec never describes how edited messages are visually marked (e.g., "(edited)" text next to timestamp).

- [STATE] Message bubble -- no "deleted" message state. The data model supports soft delete (`deletedAt`), but the spec never defines what a deleted message looks like to other participants. Chat apps typically show "This message was deleted" in italicized, muted text. Without this spec, the developer must decide whether to hide deleted messages entirely or show a placeholder.

- [STATE] Message bubble -- no "failed to load image" state. The `contentType` supports `'image'`, but there is no spec for a broken image fallback within a message bubble.

- [STATE] New conversation modal -- no "creating" loading state or "creation failed" error state.

- [STATE] Conversation header -- no "user left the conversation" indicator or "conversation no longer available" state.

- [STATE] Member list -- no loading state and no empty state (though empty is unlikely, a group where all other members left is possible).

- [STATE] Search dialog -- no loading state, no error state, no "no results" state.

---

### Accessibility Issues

- [A11Y] No ARIA landmarks defined for the three-panel layout. The sidebar should be `<nav>` or `role="navigation"`, the message list region should be `role="main"` or `<main>`, and the member list should be `role="complementary"` or `<aside>`. Without these, screen reader users cannot navigate between panels.

- [A11Y] Message list `role="log"` and `aria-live="polite"` are mentioned in Phase 6 task 6.11 but are buried in implementation tasks, not in the UI/UX spec itself (Section 3). A developer reading only Section 3 for component specs would miss this entirely. ARIA roles should be specified per-component in the component inventory table.

- [A11Y] No specification for screen reader announcement of new messages. When a new message arrives, a screen reader user needs an `aria-live` region to announce "[Sender] says: [message preview]". The plan mentions `aria-live="polite"` for the message list, but does not specify the announcement text pattern, whether it uses `aria-live="polite"` (wait for current speech to finish) or `aria-live="assertive"` (interrupt), or how to avoid announcement spam during rapid message streams.

- [A11Y] No keyboard navigation path defined for the message list. Can the user Tab into the message list? Can they arrow-key between messages? How do they access the hover toolbar (which by definition is not keyboard-accessible since it appears on mouse hover)? The toolbar needs to be accessible via focus (e.g., when a message receives focus, the toolbar actions become focusable via Tab).

- [A11Y] Color contrast not verified numerically. Section 6.11 says "Color contrast meets WCAG AA for text on dark backgrounds" but Section 3.1 does not include the actual contrast ratios. Given the OKLCH color definitions, the secondary text (`oklch(0.70 0.02 260)` ~ `#8b95b0`) on the darkest background (`oklch(0.13 0.02 260)` ~ `#0a0e1a`) needs to be verified. OKLCH lightness 0.70 on 0.13 is likely borderline for WCAG AA (4.5:1 ratio). The tertiary text (`oklch(0.50 0.02 260)` ~ `#4f5b78`) almost certainly fails AA for normal-sized text.

- [A11Y] No `aria-label` or accessible name defined for icon-only buttons. The `IconButton` component spec lists `tooltip` as a prop but does not mandate that the tooltip text is also used as `aria-label`. Without this, icon-only buttons (emoji, reply, copy, delete in the hover toolbar, the formatting toolbar buttons) have no accessible name.

- [A11Y] Emoji picker accessibility not addressed. `@emoji-mart/react` has built-in accessibility, but the plan does not specify how the emoji picker is triggered via keyboard, how focus is managed when it opens/closes, or how selected emojis are announced.

- [A11Y] No skip-navigation link defined. The three-panel layout with sidebar means keyboard users must Tab through the entire sidebar to reach the message input. A "Skip to message input" link at the top of the page is standard practice.

- [A11Y] No `aria-busy` specified for loading states. When the message list or conversation list is loading, the container should have `aria-busy="true"` so screen readers know content is not yet available.

---

### Design Token Gaps

- [TOKEN] No `--font-weight-*` tokens -- font weights are critical for visual hierarchy (sender names, headings, button labels, body text, secondary text). Without tokens, weight usage will be inconsistent. Need at minimum: `--font-weight-normal: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`.

- [TOKEN] No `--color-focus-ring` token -- every interactive element needs a consistent focus indicator. Need: `--color-focus-ring: oklch(0.65 0.20 250 / 0.5)` (semi-transparent accent) and `--focus-ring-width: 2px`, `--focus-ring-offset: 2px`.

- [TOKEN] No `--color-bg-own-message` token -- own messages need a visually distinct background. Without this token, the developer has to guess. Need: something like `oklch(0.65 0.20 250 / 0.08)` (very subtle accent tint).

- [TOKEN] No `--color-text-link` token -- message content can contain links. Need a link color distinct from body text, plus a hover color: `--color-text-link: oklch(0.70 0.18 250)`, `--color-text-link-hover: oklch(0.75 0.20 250)`.

- [TOKEN] No `--color-code-bg` token for inline and block code -- the message content component renders code blocks with syntax highlighting via `shiki`, but there is no background color token for code blocks or inline code within messages. Need: `--color-code-bg: oklch(0.15 0.02 260)`.

- [TOKEN] No transition duration token for interactive state changes on non-animated elements -- the plan defines `--duration-fast` through `--duration-slow` for Framer Motion animations, but does not specify which duration applies to CSS transitions for hover background changes, border color changes, and opacity changes on non-animated elements (sidebar items, buttons without Framer Motion, input focus borders). A developer will guess between 100ms and 300ms inconsistently.

- [TOKEN] No `--color-scrollbar-thumb-hover` token -- the `scrollbar-thin` utility defines `scrollbar-color: var(--color-border) transparent`, but does not specify the thumb hover color. Users on macOS may not notice (overlay scrollbars), but Windows/Linux users will see the inconsistency.

- [TOKEN] No `--max-width-message-bubble` token -- message bubbles need a max-width constraint (typically 60-70% of the container) so they do not stretch to full width. This is a layout-critical value that should be tokenized.

---

### Implementation Ambiguities

- [AMBIGUOUS] Timestamp display rules are incomplete -- Section 3.3 Screen 4 says timestamps show "relative ('2m ago'), full datetime on hover tooltip". But the sidebar conversation items show absolute times ("2:30 PM", "Yest."). The plan never defines the complete formatting rules: when to show relative vs. absolute, the transition thresholds (e.g., < 1 min = "just now", < 60 min = "Xm ago", today = "2:30 PM", yesterday = "Yesterday", older = "Mar 15"), and whether the message list and sidebar use different formatting strategies.

- [AMBIGUOUS] Date separator logic in message list is undefined -- Section 4.11 mentions "Date separator `Divider` between days" but does not specify: the label format ("Today", "Yesterday", "March 15, 2026"), timezone handling (server time vs. user's local time), or whether the separator sticks to the top of the viewport during scroll.

- [AMBIGUOUS] Cmd+K search dialog behavior is underspecified -- it is listed in the component inventory and keyboard shortcuts, but there is no wireframe or behavioral spec. What does it search (conversations only? messages? users?)? How are results categorized? What is the result item layout? Is it an instant search (debounced keystrokes) or submit-based? What happens when a result is selected (navigate to conversation? scroll to message?)?

- [AMBIGUOUS] Sidebar width behavior at different breakpoints -- the plan says sidebar is 240px on desktop and collapses to a drawer on mobile (<768px), but does not specify the drawer width on mobile. Is it full-screen? 80% width? 240px over the content? What is the backdrop style?

- [AMBIGUOUS] Right panel (member list) toggle behavior -- Section 3.3 says "toggled via button in ConversationHeader", but does not specify: the toggle button icon, its position in the header, whether the center panel resizes or the right panel overlays, and the responsive behavior (the plan says "hidden by default" below 1024px, but does not say whether it can be opened at all on tablet).

- [AMBIGUOUS] How reactions are displayed on messages -- the data model supports reactions and the hover toolbar has an emoji react button, but the message bubble spec never shows where reactions appear. Chat apps typically show a row of emoji pills below the message content (e.g., "thumbs-up 3, heart 2"). The layout, grouping, count display, and "click to add same reaction" behavior are all unspecified.

- [AMBIGUOUS] Unread message separator in message list -- many chat apps show a "New messages" divider line in the message list to mark where unread messages begin. The plan has `Divider` component with optional label and `ConversationMember.lastReadMessageId`, but never specifies whether this unread separator exists, where it appears, or its styling.

- [AMBIGUOUS] Context menu on conversation items -- Section 3.3 Screen 3 mentions "Right-click on conversation: context menu (mute, archive, leave, delete)" but there is no wireframe, no spec for the menu items, no spec for mute duration options, and no mention of what "archive" means in the data model (there is no `archived` field on conversations or conversation members).

- [AMBIGUOUS] "Do Not Disturb" and "Invisible" status behavior -- the status dropdown includes DND and Invisible options (mentioned in sidebar interactions), but the data model only has `'online' | 'idle' | 'dnd' | 'offline'`. "Invisible" is not in the status enum. Does "Invisible" map to `'offline'` in the database? What does DND actually suppress (notifications? typing indicators?)? None of this is specified.

- [AMBIGUOUS] Toast auto-dismiss timing varies by type -- Section 6.7 says "Auto-dismiss after 5 seconds" but does not distinguish between error toasts (which users may need more time to read) and success toasts (which can dismiss faster). Error toasts about network failures or rate limiting should likely persist longer or require manual dismiss.

- [AMBIGUOUS] How the "New messages" floating button works -- Section 6.10 says it "appears if scrolled up and new message arrives", but does not specify: how far up the user must scroll to trigger it (any amount? 1 screen height?), whether it shows a count ("3 new messages"), whether clicking it smooth-scrolls or instant-jumps, and whether it disappears once the user scrolls back to bottom.

---

### Verdict

This is a strong technical plan that covers architecture, data models, API contracts, and WebSocket events with commendable rigor. The design token system is more complete than most plans I have reviewed -- OKLCH colors with semantic names, a spacing scale, border radii, shadows, z-index scale, animation durations and easings, and typography tokens are all present and well-organized.

However, the UI/UX specification has a clear bias toward the "happy path, desktop, sighted user, first message" scenario. The plan documents what the screen looks like when everything works, but consistently under-specifies what happens in edge states (editing, replying, deleted messages, failed loads), at different viewports (mobile drawer dimensions, tablet behavior), and for non-mouse users (focus management, keyboard navigation, screen reader announcements).

The four showstopper gaps (no focus ring, no font weights, ambiguous own-message layout, no consecutive message grouping rules) would each independently cause a developer to pause implementation and make a design decision that should be in the plan. The missing states for reply-in-progress, edit-in-progress, and deleted messages are particularly concerning because the data model already supports these features -- the backend will be built, but the frontend developer has no spec to build against.

The accessibility section is the weakest part. What exists is correct (role="log", aria-live, WCAG AA mention), but it is scattered across Phase 6 tasks rather than being specified per-component, and critical patterns (focus management in modals and message list, keyboard-accessible hover toolbar, skip navigation, screen reader announcement format) are missing entirely.

A developer could build a visually impressive prototype from this plan. They could not ship an accessible, edge-case-resilient production application without significant follow-up specification work.
