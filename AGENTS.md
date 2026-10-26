<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Advanced per-canvas tools persist frames, inbox, walkthrough references, branch bases and personal graph-fingerprint sign-offs in the explicit workspace projection; never include transient ink, cursors, audio or inquiry history.
- Decision branching uses three-way comparisons with explicit conflict choices and always creates a separate merged canvas, preserving source and branch to prevent silent loss.
- Monte Carlo and critical-path calculations use explicit prerequisite edges and user estimates, sample shared nodes once per trial, and reject cycle-dependent graphs; epistemic labels are not probabilities.
- Live presence and WebRTC signaling use workshop-authorized public tables with RLS, effect-scoped Realtime cleanup and per-client identities; audio is opt-in peer-to-peer and restricted networks require a TURN relay.
- Red-team reviews reuse authenticated streaming AI transport, durable access pauses and strict card-cited output; suggested challenges never alter beliefs until the user adds them.
- Layered auto-layout loads ELK in browser events; layout changes positions only and respects read-only replay.
- Planning uses optional per-canvas records for conclusions and guided workflows, and node metadata for execution dates/owners; the explicit cloud projection retains these without inquiry history.
- Workshops use separate Cloud sessions with host-scoped controls, invitation membership, private silent ideas, and locked vote RPCs; polling only reads participant-authorized records.
- Sync resolves empty acknowledgments against a fresh owner-scoped read, preserves conflict copies, and queues a follow-up pass; guest import deduplicates by canvas identity.
- Threadwise data model (node types, epistemic status, lenses, relations, per-type metadata fields) lives in src/lib/threadwise/model.ts; UI reads field definitions from it so new metadata needs no UI changes.
- The working graph remains in useThread; useWorkspaces captures per-canvas graphs and history, synchronizes owner-scoped documents with revision checks, and retains offline edits or conflict copies to avoid loss. React Flow is lazy and ClientOnly for SSR safety.
- AI Explore: createServerFn in src/lib/threadwise/explore.functions.ts calls Lovable AI (server-only explore.server.ts, structured output); suggestions live in the store as `ghosts` and render as non-persistent-looking ghost nodes/edges until accepted.
- Semantic graph traversal and audit live in graph.ts; depends_on and needs_evidence_from reverse direction for reasoning so downstream risk and upstream graduation share consistent semantics.
- Physics uses d3-force on position copies; optional movement never changes graph meaning.
- Store snapshots capture coalesced graph changes, excluding transient selection; replay renders immutable snapshots and disables mutations to protect the current canvas.
- Experiment completion is an atomic store operation gated by an outcome dialog; only explicitly chosen upstream beliefs graduate and invalidation adds a lessons note.
- Socratic inquiries use dedicated parameterized page URLs and an independent browser store; the explicit cloudDocument projection excludes any chat history for privacy.
- AI tools stream through an authenticated server route, with durable access-pause records and server-side credentials; document text extraction is dynamically loaded only in browser events for runtime compatibility.
- Optional sounds use a browser Web Audio service, never render-time effects, so editing stays silent unless enabled.
- Drafts (draft.ts) store only card references per canvas; transcluded blocks read/write the canvas store directly so there is one source of truth.
- Card depth and zoom detail are continuous CSS variables (--lift, --z, --full, --unfold) set per card; never reintroduce discrete LOD switches.
- Organizing colors use the shared paper palette and optional fields on cards, canvases, and workspace documents; the cloud projection explicitly retains them without including inquiry history.
- Workspace creation always immediately selects a locally persisted new file; only an untouched starter may be replaced by initial cloud hydration.
- Note cards use bounded scrollable text and an anchored compact zoom layer; a manual bottom grip converts screen delta to canvas height once and writes dimensions through onNodesChange (setAttributes), preserving local/history/cloud heights; never reintroduce NodeResizer/NodeResizeControl because their pointer handling conflicts with dragging.
- Strategy tools (scenario, runway) persist their inputs as optional Suite fields; pure maths lives in strategy.ts with tests, and the dossier is derived on demand, never stored.
- Presentation renders a fixed full-screen stage with a centred slide card over a dimmed canvas; never overlay captions directly on the canvas.
