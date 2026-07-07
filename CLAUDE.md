# Mythweaver

An AI-assisted campaign management tool for tabletop RPG game masters: generates a campaign
bible (world, regions, locations, factions, NPCs, plot threads), preps individual sessions
grounded in that bible, turns post-session recaps into proposed (never auto-applied) canon
updates, and gives GMs a set of live-play tools (random tables, initiative/combat tracker,
timeline) plus read-only co-GM sharing.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, React 19
- Prisma 7 with the `prisma-client` generator (not `prisma-client-js`) + `@prisma/adapter-pg` driver
  adapter — `src/lib/prisma.ts` constructs `PrismaClient` with an explicit `PrismaPg` adapter, this
  is required in Prisma 7, not optional
- PostgreSQL — Neon in production (via Vercel's Postgres integration), local Postgres via
  `docker-compose.yml` for `npm run dev`
- Vercel Blob for all file storage (portraits, faction crests, maps/documents, character sheets)
- Anthropic and OpenAI SDKs, interchangeable via `LLM_PROVIDER` — image generation always uses
  OpenAI regardless (Anthropic has no image API)
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

## Architecture conventions

**Authorization** (`src/lib/campaign/authorize.ts`) — two helpers, used consistently everywhere:
- `requireCampaignOwnership(campaignId)` — owner-only, every write path (create/update/delete/
  generate/regenerate). Returns the full `Campaign` row.
- `requireCampaignAccess(campaignId)` — owner OR read-only collaborator (`CampaignCollaborator`
  model). Returns `{ campaign, isOwner }`. Used by read-only pages (main campaign page, timeline,
  session view, exports, the file-serving route).

Both throw `notFound()` (404, not 403) on failure by design, so a stranger can't tell a campaign
exists. When adding a new server action or route under `src/app/campaigns/[id]/**`, it must call
one of these before touching any campaign-scoped data.

**Read-only collaborator UI gating**: `campaign-bible-view.tsx` uses a `ReadOnlyContext` (React
context, not prop drilling) so `Section`/`ItemActions` can hide edit/lock/add affordances without
threading a `readOnly` prop through every call site. The campaign page passes
`readOnly={!isOwner}`.

**Prisma scoping pattern**: queries use Prisma's "extended where" — e.g.
`prisma.nPC.update({ where: { id, campaignId }, data })`. This combines the unique `id` with a
non-unique `campaignId` filter; Prisma throws if the row's `campaignId` doesn't match. This is the
established way every entity is scoped to its campaign — not a bug, don't "fix" it to a compound
unique constraint.

**Server actions** — plain `"use server"` functions taking `FormData`, ending in `redirect()` or
`revalidatePath()`. No client-side fetch/JSON API layer exists by design. Enum values and numbers
pulled from `FormData` must be validated (`src/lib/campaign/enum-validation.ts`'s
`parseRequiredEnum`, or an explicit `Number.isFinite` check) — a raw `as SomeEnum` cast on
attacker-controlled input either lets Prisma throw an unhandled DB error or, worse, silently
corrupts data (this happened once: an unchecked `Number(formData.get("delta"))` in the combat
tracker could write `NaN` to a PV column).

**LLM provider abstraction** (`src/lib/llm/`) — `getLLMProvider(name?)` returns an
`AnthropicProvider` or `OpenAIProvider` implementing a shared `LLMProvider` interface, plus a
generic `generateStructured<T>(toolName, zodSchema, systemPrompt, userPrompt)` escape hatch used
for anything that doesn't have its own named interface method (entity regeneration, random
tables). `buildCampaignContextLines()` (`src/lib/llm/campaign-context.ts`) is the shared "describe
the whole bible" block reused by every prompt that needs canon consistency; `campaignBibleInclude`
/ `campaignGeographyInclude` (`src/lib/campaign/campaign-include.ts`) are the matching Prisma
`include` shapes — don't re-inline either.

**Quota** (`src/lib/llm/quota.ts`) — `checkGenerationQuota(userId)` (check only) called *before*
the LLM/image call, `recordGeneration(userId, kind)` (record only) called *after* it succeeds. This
ordering matters: recording before the call would burn a user's monthly quota on a failed
generation (this was a real bug, fixed once already — don't reintroduce a combined
check-and-record-before-calling helper).

**Locking / canon protection** — `World`, `Region`, `Location`, `Faction`, `NPC`, `PlotThread` all
have a `locked` boolean. Locked entities can't be edited/regenerated/deleted until unlocked
(`src/lib/campaign/lockable.ts`), and every LLM prompt that includes existing entities marks locked
ones as `(canon, locked)` so generation doesn't contradict them.

**Shared UI primitives** worth reusing rather than re-inlining: `<BackLink>`
(`src/components/back-link.tsx`), `<GeneratingOverlay>` (`src/components/generating-overlay.tsx`,
`useFormStatus`-based full-screen blocking spinner shown during AI generation forms),
`buildPreviewUrl()` (`src/lib/campaign/preview-url.ts`, large-image preview page links), and the
class-name constants in `src/components/form-styles.ts`.

## Testing convention

Vitest, colocated `*.test.ts` next to the source file. **Only pure functions are unit tested** —
prompt/markdown builders, quota math, turn-order logic, enum/path validation. Anything that
touches Prisma or an external API is verified manually in the browser instead; don't add a test
file for a DB-touching server action, that's not this project's convention (would need a real or
mocked DB, which doesn't exist here).

## Deliberately out of scope for now

Password reset / forgot-password flow — explicitly deferred by the project owner, needs an email
provider decision first. Don't implement it unless asked again.
