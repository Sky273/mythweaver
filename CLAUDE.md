# Mythweaver

An AI-assisted campaign management tool for tabletop RPG game masters: generates a campaign
bible (world, regions, locations, factions, NPCs, plot threads), preps individual sessions
grounded in that bible, turns post-session recaps into proposed (never auto-applied) canon
updates, and gives GMs a set of live-play tools (an in-play GM run screen, random tables,
initiative/combat tracker, timeline, interactive maps with pins). It also generates imagery
(NPC portraits, faction crests, location art, maps/documents), answers free-form questions about
the campaign ("Interroger la campagne"), exports the bible to PDF/Markdown, draws a relationship
graph of the bible, and shares a spoiler-free **player view** with collaborators (co-GM or player)
via a progressive reveal system.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, React 19
- Prisma 7 with the `prisma-client` generator (not `prisma-client-js`) + `@prisma/adapter-pg` driver
  adapter — `src/lib/prisma.ts` constructs `PrismaClient` with an explicit `PrismaPg` adapter, this
  is required in Prisma 7, not optional
- PostgreSQL — Neon in production (via Vercel's Postgres integration), local Postgres via
  `docker-compose.yml` for `npm run dev`
- Vercel Blob for all file storage (portraits, faction crests, maps/documents, character sheets)
- Anthropic and OpenAI SDKs, interchangeable via `LLM_PROVIDER` (currently `openai`). Text model
  via `OPENAI_MODEL` (currently `gpt-5.6`) / `ANTHROPIC_MODEL`. Image generation always uses OpenAI
  regardless of `LLM_PROVIDER` (Anthropic has no image API), model via `OPENAI_IMAGE_MODEL`
  (`gpt-image-1`). The OpenAI provider sends `service_tier: "priority"` (the fast serving tier) on
  every call for lower latency.
- NextAuth v5 (beta), Credentials provider, JWT sessions
- Zod v4, Vitest

## Commands

```
npm run dev       # next dev (needs local Postgres — see docker-compose.yml)
npm run build     # next build
npm run lint      # eslint
npm run test      # vitest run
npx prisma migrate dev --name <name>   # create + apply a migration locally
npx prisma generate                     # regenerate the client into src/generated/prisma
```

**After any Prisma schema change**: run `migrate dev` + `generate`, then restart the dev server —
a running `next dev` process caches the old generated client and throws `Unknown argument` errors
otherwise. This has bitten every schema change so far; always restart.

`src/generated/prisma` is gitignored and rebuilt by `postinstall: prisma generate` — Vercel runs
this automatically on every install/build.

## Deployment

Hosted on **Vercel**, not Docker/self-hosted (migrated away from an earlier Docker Compose +
Caddy setup). `docker-compose.yml` today only runs a local Postgres for `npm run dev` — it is
dev-only, not a deployment artifact.

- **Database**: Neon Postgres via Vercel's Postgres integration (Storage tab). Use the pooled
  connection string for `DATABASE_URL`.
- **File storage**: Vercel Blob, provisioned as a **private-access store**. `src/lib/storage.ts`
  uploads with `access: "private"` and reads back with the SDK's authenticated `get(pathname, {
  access: "private" })` — never a bare `fetch(url)`. If the store were public instead, `put()`
  would need `access: "public"`; the two must match or every upload throws `Cannot use public
  access on a private store`. Access is a store-level setting, not per-blob.
- **Migrations against production**: `vercel env pull` cannot retrieve values for env vars marked
  "Sensitive" (the default for anything added via `vercel env add` or a storage integration) — the
  pulled `.env.production.local` will show `""` for `DATABASE_URL`, `AUTH_SECRET`, etc. even though
  they're set correctly server-side. To run `prisma migrate deploy` against prod, get the real
  connection string from the Vercel dashboard's Storage tab (or Neon console) directly.
- **Env vars set with an empty value** (not absent — an empty string saved in the dashboard) are a
  real trap: code like `process.env.X ?? "default"` does **not** fall back on `""`, only on
  `undefined`/`null`. This has actually broken `LLM_PROVIDER` and `MONTHLY_GENERATION_LIMIT` in
  production before (empty `MONTHLY_GENERATION_LIMIT` → `Number("")` → `0` → quota blocked for
  everyone). Check `vercel env ls` after adding vars, not just that they exist.
- **Env var changes require a redeploy** to take effect — an already-built deployment doesn't
  pick up new values. `vercel deploy --prod` after any env var change.
- Check `vercel logs <url> --environment=production --level=error --expand` first when something
  is broken in prod — this surfaces real stack traces, not just request status codes.

## Long-running generation & the 60s timeout

`src/app/campaigns/layout.tsx` sets `export const maxDuration = 60` for the whole `/campaigns`
subtree — the Hobby-plan ceiling (Pro allows up to 300). AI text/image generation runs inside
server actions and must finish under this. Two consequences baked into the design:

- Image generation uses `gpt-image-1` at `quality: "medium"` (not `high`) to stay under the limit.
- Session prep is generated **concise** in one quick call; the detailed per-scene "beats"
  (read-aloud, stakes, player approaches, checks, exits) are filled **one scene at a time on
  demand** ("Approfondir") rather than in a single big call — a full detailed prep measured
  18s–150s on `gpt-5.x` and blew the timeout. See `detailScene` and `scene-detail-buttons.tsx`.

Image errors are translated to friendly French (`translateImageGenerationError` in
`src/lib/llm/image.ts`) and surfaced via a `?imageError=` query param + `<ImageErrorBanner>` — prod
strips thrown error messages, so the channel must be the URL, not the thrown error.

## Architecture conventions

**Authorization** (`src/lib/campaign/authorize.ts`) — three helpers, used consistently everywhere:
- `requireCampaignOwnership(campaignId)` — owner-only, every write path (create/update/delete/
  generate/regenerate). Returns the full `Campaign` row.
- `requireCampaignAccess(campaignId)` — owner OR a **CO_GM** collaborator (read-only access to the
  full GM bible). Returns `{ campaign, isOwner }`. Used by GM-facing read-only pages (main campaign
  page, timeline, run screen, session view, exports, graph, the GM file-serving route). **PLAYER
  collaborators are deliberately excluded** — they must never reach GM fields (secrets,
  motivations, unrevealed content).
- `requirePlayerAccess(campaignId)` — owner OR **any** collaborator (CO_GM or PLAYER). Used by the
  spoiler-free player view and its file route.

All three throw `notFound()` (404, not 403) on failure by design, so a stranger can't tell a
campaign exists. When adding a new server action or route under `src/app/campaigns/[id]/**`, it
must call the right one of these before touching any campaign-scoped data.

**Player view & progressive reveal** — every bible entity (`World`, `Region`, `Location`,
`Faction`, `NPC`, `PlotThread`) carries a `publicDescription` (player-facing copy) and a `revealed`
boolean, distinct from its GM fields. The player view (`/campaigns/[id]/play`) renders **only**
`revealed` entities and **only** their public copy, plus diffused player recaps
(`Session.playerRecap` + `playerRecapRevealed`) and revealed map pins. `toggleReveal`
(`src/lib/campaign/revealable.ts`) flips the flag per entity. Player-visible images are served by a
separate route (`/campaigns/[id]/play/files/[...path]`, `requirePlayerAccess`) distinct from the GM
file route (`/campaigns/[id]/files/[...path]`, `requireCampaignAccess`). Map pins reveal
per-pin, and the player view shows a revealed pin's position + label but never its linked location
name (anti-spoiler).

**Read-only collaborator UI gating**: `campaign-bible-view.tsx` uses a `ReadOnlyContext` (React
context, not prop drilling) so `Section`/`ItemActions` can hide edit/lock/add affordances without
threading a `readOnly` prop through every call site. The campaign page passes
`readOnly={!isOwner}`.

**Prisma scoping pattern**: queries use Prisma's "extended where" — e.g.
`prisma.nPC.update({ where: { id, campaignId }, data })`. This combines the unique `id` with a
non-unique `campaignId` filter; Prisma throws if the row's `campaignId` doesn't match. This is the
established way every entity is scoped to its campaign — not a bug, don't "fix" it to a compound
unique constraint. (`findUnique` can't take the extra filter — there, look up by `id` then check
`campaignId` explicitly, as the session view does.)

**Server actions** — plain `"use server"` functions taking `FormData`. Most end in `redirect()` or
`revalidatePath()`; no client-side fetch/JSON API layer exists by design. The one deliberate
exception is `detailScene`, which **returns a `{ ok, error }` result** (no redirect) so it can be
invoked programmatically per scene and fired in parallel from the client ("Tout approfondir").
Enum values and numbers pulled from `FormData` must be validated
(`src/lib/campaign/enum-validation.ts`'s `parseRequiredEnum`, or an explicit `Number.isFinite`
check) — a raw `as SomeEnum` cast on attacker-controlled input either lets Prisma throw an
unhandled DB error or, worse, silently corrupts data (this happened once: an unchecked
`Number(formData.get("delta"))` in the combat tracker could write `NaN` to a PV column).

**LLM provider abstraction** (`src/lib/llm/`) — `getLLMProvider(name?)` returns an
`AnthropicProvider` or `OpenAIProvider` implementing a shared `LLMProvider` interface, plus a
generic `generateStructured<T>(toolName, zodSchema, systemPrompt, userPrompt)` escape hatch used
for anything that doesn't have its own named interface method (entity regeneration, random tables,
scene detailing, campaign Q&A). OpenAI uses `response_format: json_schema` with `strict: true` by
default; schemas with genuinely optional fields (e.g. the session prep's per-scene beat fields)
pass `strict: false` and rely on Zod to validate. `buildCampaignContextLines()`
(`src/lib/llm/campaign-context.ts`) is the shared "describe the whole bible" block reused by every
prompt that needs canon consistency; `campaignBibleInclude` / `campaignGeographyInclude`
(`src/lib/campaign/campaign-include.ts`) are the matching Prisma `include` shapes — don't re-inline
either.

**Quota** (`src/lib/llm/quota.ts`) — a single **per-user** monthly counter (`GenerationLog` rows,
`MONTHLY_GENERATION_LIMIT` defaults to 200, shared across text and image). `checkGenerationQuota(userId)`
(check only) is called *before* the LLM/image call, `recordGeneration(userId, kind)` (record only)
*after* it succeeds. This ordering matters: recording before the call would burn a user's monthly
quota on a failed generation (this was a real bug, fixed once already — don't reintroduce a combined
check-and-record-before-calling helper). `kind` is a union covering every generation type
(`campaign_bible`, `session_prep`, `scene_detail`, `recap_analysis`, `campaign_image`,
`entity_generation`, `entity_regeneration`, `plot_briefing`, `campaign_qa`, `random_table`).

**Locking & reveal are separate axes** — `World`, `Region`, `Location`, `Faction`, `NPC`,
`PlotThread` each have a `locked` boolean (canon protection) *and* a `revealed` boolean (player
visibility). Locked entities can't be edited/regenerated/deleted until unlocked
(`src/lib/campaign/lockable.ts`), and every LLM prompt that includes existing entities marks locked
ones as `(canon, locked)` so generation doesn't contradict them. Revealing (`revealable.ts`) is
independent — an entity can be locked-but-hidden, revealed-but-editable, etc.

**Exports** — the bible exports to Markdown (`/campaigns/[id]/export`, `bible-markdown.ts`) and to
print-optimised PDF pages that the browser saves as PDF: a **GM** version
(`/export/pdf`, full bible incl. secrets + all sessions) and a **player** version
(`/export/pdf/player`, revealed + public only). Shared print primitives live in
`src/components/print-document.tsx` and `print-toolbar.tsx`.

**Shared UI primitives** worth reusing rather than re-inlining: `<BackLink>`
(`src/components/back-link.tsx`), `<GeneratingOverlay>` (`src/components/generating-overlay.tsx`,
`useFormStatus`-based full-screen blocking spinner shown during AI generation forms),
`buildPreviewUrl()` (`src/lib/campaign/preview-url.ts`, large-image preview page links), and the
class-name constants in `src/components/form-styles.ts`.

## Testing convention

Vitest, colocated `*.test.ts` next to the source file. **Only pure functions are unit tested** —
prompt/markdown builders, quota math, turn-order logic, enum/path validation, the
relationship-graph builder. Anything that touches Prisma or an external API is verified manually in
the browser instead; don't add a test file for a DB-touching server action, that's not this
project's convention (would need a real or mocked DB, which doesn't exist here).

## Deliberately out of scope for now

Password reset / forgot-password flow — explicitly deferred by the project owner, needs an email
provider decision first. Don't implement it unless asked again.
