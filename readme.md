# A Ramesh Kumaran — Portfolio & Blog

Personal portfolio and blog for **A Ramesh Kumaran**, Backend & Data Engineer at Simpplr.

- **Live:** https://arameshkumaran.vercel.app (the earlier `rameshkumaran.vercel.app` permanently redirects here)
- **Stack:** Next.js 16 (App Router, React Server Components, Server Actions, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Auth.js v5 · Drizzle ORM · PostgreSQL (Aiven) · Nodemailer / Resend · Vercel

This README is the operations manual for the project: what every file does, how the pieces fit together, how to run it locally, how it behaves in production, and how to connect each external service.

---

## Table of contents

1. [Features at a glance](#1-features-at-a-glance)
2. [Architecture](#2-architecture)
3. [Project structure — every file explained](#3-project-structure--every-file-explained)
4. [Running locally](#4-running-locally)
5. [Environment variables](#5-environment-variables)
6. [Connecting external services](#6-connecting-external-services)
   - [Aiven PostgreSQL](#61-aiven-postgresql)
   - [Email (Resend or SMTP / Gmail)](#62-email-resend-or-smtp--gmail)
   - [Google sign-in](#63-google-sign-in)
   - [GitHub token](#64-github-token)
7. [How it works in production](#7-how-it-works-in-production)
8. [Deploying — Vercel + GitHub auto-deploy](#8-deploying--vercel--github-auto-deploy)
9. [Making a change and getting it live](#9-making-a-change-and-getting-it-live)
10. [Data model](#10-data-model)
11. [Key flows in detail](#11-key-flows-in-detail)
12. [Admin guide](#12-admin-guide)
13. [Editing portfolio content](#13-editing-portfolio-content)
14. [Scripts](#14-scripts)
15. [Testing & quality checks](#15-testing--quality-checks)
16. [Troubleshooting](#16-troubleshooting)
17. [Security notes](#17-security-notes)

---

## 1. Features at a glance

| Area | What you get |
| --- | --- |
| **Portfolio** | Left sidebar navigation (Home, Experience, Projects, Skills, About me, Contact, Blog), hero with photo, interactive terminal (`help`, `whoami`, `skills`, `goto blog`…), live GitHub activity widget, animated data-pipeline background, dark / light / system theme, printable résumé at `/resume` |
| **Navigation** | `Ctrl/⌘ + K` command palette, number-key shortcuts `1`–`7`, mobile drawer |
| **Blog** | Markdown posts (GFM, syntax highlighting, table of contents, reading progress), reactions (like / love / insightful / fire), comments, share links, view counts, per-post Open Graph images, JSON-LD, RSS at `/feed.xml` (kept for feed readers, not linked in the UI) |
| **Auth** | Google sign-in (optional) and email + password registration via Auth.js v5. Guests read everything; reacting, commenting, subscribing and the contact form require sign-in. The account whose email equals `ADMIN_EMAIL` is the administrator. |
| **Newsletter** | Signed-in readers get a "subscribe" prompt (banner + sidebar card + bell in the user chip). Subscribing sends a **one-time welcome email** with the latest posts. **Publishing a post emails all active subscribers once.** Every email carries an unsubscribe link and RFC 8058 one-click `List-Unsubscribe` headers; readers can also unsubscribe from the bell / card. Anonymous visitors can still subscribe with just an email. |
| **Contact** | Login-gated contact form (verified sender address, honeypot, per-user rate limit). Messages are stored in Postgres and forwarded to your inbox by email. |
| **Admin `/admin`** | Overview stats, Markdown editor with live split preview (`Ctrl/⌘ + S`), publish / feature / delete, contact inbox, comment moderation, subscriber CSV export, profile & password settings, environment health (DB connectivity, mail provider) |
| **Platform** | ISR for public pages, graceful degradation when the DB is down, sitemap & robots, Vercel Analytics & Speed Insights, GitHub Actions CI, automatic deploys |

---

## 2. Architecture

```
                         ┌──────────────────────────────────────────────────────────────┐
                         │                        Vercel (Edge + Node)                  │
                         │                                                              │
   Browser ──HTTPS──────►│  proxy.ts (edge)  ──►  Next.js App Router                    │
                         │   • guards /admin       ┌─────────────────────────────────┐  │
                         │                         │ Server Components (RSC)         │  │
                         │                         │  pages under src/app/**         │  │
                         │                         │  static / ISR / dynamic         │  │
                         │                         ├─────────────────────────────────┤  │
                         │                         │ Server Actions  src/actions/**  │  │
                         │                         │  auth · blog · contact · admin  │  │
                         │                         │  newsletter                     │  │
                         │                         ├─────────────────────────────────┤  │
                         │                         │ Route Handlers  src/app/api/**  │  │
                         │                         │  auth · newsletter · posts      │  │
                         │                         └───────┬─────────────┬───────────┘  │
                         │                                 │             │              │
                         │            after() background   │             │              │
                         │            jobs (emails)  ◄─────┘             │              │
                         └──────────────┬──────────────────────────────── ┼─────────────┘
                                        │ Drizzle ORM + pg (TLS)          │ Nodemailer / Resend SDK
                                        ▼                                 ▼
                           ┌───────────────────────┐          ┌──────────────────────┐
                           │  Aiven PostgreSQL     │          │  SMTP (Gmail, …)     │
                           │  user · account ·     │          │  or Resend API       │
                           │  post · comment ·     │          └──────────────────────┘
                           │  reaction · subscriber│
                           │  contact_message      │          ┌──────────────────────┐
                           └───────────────────────┘          │  Google OAuth        │
                                                              │  GitHub REST API     │
                                                              └──────────────────────┘
```

### Layers

| Layer | Where | Responsibility |
| --- | --- | --- |
| **Edge proxy** | `src/proxy.ts` | Runs before every request. Redirects unauthenticated users away from `/admin/*` to `/login?callbackUrl=…` using a lightweight JWT check (`auth.config.ts`, no DB). |
| **Pages (RSC)** | `src/app/**/page.tsx` | Server Components fetch data directly through `src/db/queries.ts`. Public pages are static or ISR; admin pages are `force-dynamic`. |
| **Client islands** | `src/components/**` marked `"use client"` | Interactive bits only: terminal, palette, theme, forms, reactions, newsletter card, user chip. |
| **Server Actions** | `src/actions/*.ts` (`"use server"`) | All mutations (login, register, save post, comment, react, subscribe, contact). They validate with Zod, check the session, write via Drizzle, then `revalidatePath()`. |
| **Route Handlers** | `src/app/api/**/route.ts` | Endpoints that need plain HTTP: Auth.js, newsletter status (fetched by the client), one-click unsubscribe (mail clients POST here), post views/engagement, subscriber CSV. |
| **Background work** | `after()` from `next/server` | Emails are sent after the HTTP response is flushed, so the UI never waits on SMTP. |
| **Data access** | `src/db/*` | `index.ts` (pool), `schema.ts` (tables), `bootstrap.ts` (idempotent DDL + seed on first use), `safe.ts` (`safeQuery`/`withDb` wrappers), `queries.ts` (read models), `health.ts` (connectivity probe). |
| **Mail** | `src/lib/mail.ts`, `email-templates.ts`, `newsletter.ts` | Provider abstraction (Resend or SMTP, else log-only), HTML templates, subscription + announcement logic. |
| **Content** | `src/content/*.ts`, `src/lib/site.ts` | Portfolio copy as typed TypeScript — no CMS needed. |

### Rendering strategy

| Route | Mode | Why |
| --- | --- | --- |
| `/`, `/about`, `/experience`, `/projects`, `/skills`, `/resume`, `/contact` | Static (home revalidates every 5 min for GitHub activity + latest posts) | Content is code; fast and cacheable |
| `/blog` | Dynamic (search & tag filters via `searchParams`) | |
| `/blog/[slug]` | SSG + ISR (60 s) with `generateStaticParams` | Pages regenerate after edits; `revalidatePath` is also called on save |
| `/admin/**`, `/login`, `/register`, `/unsubscribe` | Dynamic | Session / token dependent |
| `/feed.xml`, `/sitemap.xml`, `/robots.txt`, OG images | Static / ISR | |

The contact page stays static even though the form is login-gated: the gate is a client component using `useSession()`, and the server action re-checks the session on submit.

---

## 3. Project structure — every file explained

```
Portfolio/
├── .github/workflows/ci.yml       GitHub Actions: typecheck + lint + build on every push/PR; optional Vercel deploy job
├── .env.example                   Template for all environment variables (copy to .env.local)
├── .env.local                     Your real secrets — git-ignored, never commit
├── AGENTS.md / CLAUDE.md          Notes for AI coding agents (auto-maintained by `next dev`)
├── drizzle.config.ts              drizzle-kit config (schema path, DATABASE_URL) for `db:push` / `db:studio`
├── eslint.config.mjs              ESLint (next/core-web-vitals + TypeScript + React Compiler rules)
├── next.config.ts                 Next.js config: allowed remote image hosts (Google avatars, GitHub, Unsplash, Vercel Blob), `pg` as server-external package
├── postcss.config.mjs             Tailwind v4 PostCSS plugin
├── tsconfig.json                  TS config with `@/*` → `src/*` alias
├── package.json                   Scripts & dependencies
├── public/images/ramesh.jpg       Profile photo used in the hero, OG image and sidebar
├── scripts/db-check.mjs           `npm run db:check` — verifies DATABASE_URL connectivity and prints table counts
└── src/
    ├── proxy.ts                   Edge middleware: protects /admin (redirect to /login)
    ├── auth.config.ts             Edge-safe Auth.js config (providers list, JWT callbacks, pages) — no DB imports
    ├── auth.ts                    Full Auth.js setup: Drizzle adapter, Google + Credentials providers, role injection, `googleEnabled`, `adminEmail`
    ├── types/next-auth.d.ts       Augments Session/JWT with `id` and `role`
    │
    ├── actions/                   Server Actions ("use server")
    │   ├── auth.ts                registerAction / loginAction (credentials, returns redirectTo for a hard reload) · googleSignIn
    │   ├── blog.ts                addComment · deleteComment · toggleReaction
    │   ├── contact.ts             submitContact — requires session, stores message, emails owner
    │   ├── newsletter.ts          subscribe (form) · subscribeMe · unsubscribeMe · mySubscriptionStatus · unsubscribeByToken · resubscribeByToken
    │   └── admin.ts               savePost · togglePublish · deletePost · message & comment moderation · changePassword · updateProfile
    │                              (savePost/togglePublish schedule `announcePost` via after())
    │
    ├── app/                       App Router
    │   ├── layout.tsx             Root layout: fonts, ThemeProvider, SessionProvider, Sidebar, MobileNav, CommandPalette, Toaster, analytics, metadata
    │   ├── globals.css            Tailwind v4 theme tokens (colours, radii), utilities (card, focus-ring, animations), prose & highlight.js styles
    │   ├── page.tsx               Home: hero + photo, terminal, GitHub activity, featured projects, latest posts
    │   ├── error.tsx / not-found.tsx
    │   ├── opengraph-image.tsx    Site-wide OG image (rendered with next/og)
    │   ├── robots.ts / sitemap.ts
    │   ├── about|experience|projects|skills|resume/page.tsx   Static portfolio pages driven by src/content
    │   ├── contact/page.tsx       Contact page (form + details card)
    │   ├── blog/page.tsx          Blog index: search, tags, newsletter banner/card, post grid
    │   ├── blog/[slug]/page.tsx   Post page: markdown, TOC, reading progress, share, reactions, comments, prev/next, JSON-LD
    │   ├── blog/[slug]/opengraph-image.tsx   Per-post OG image
    │   ├── feed.xml/route.ts      RSS 2.0 feed
    │   ├── login/page.tsx · register/page.tsx   Auth pages (redirect away when already signed in)
    │   ├── unsubscribe/page.tsx   Token-based unsubscribe confirmation page (linked from every email)
    │   ├── admin/
    │   │   ├── layout.tsx         Server-side admin guard (session + role) and admin nav
    │   │   ├── page.tsx           Dashboard: stats, recent posts, latest messages, subscriber count + CSV export
    │   │   ├── posts/page.tsx     Posts table (publish toggle, delete)
    │   │   ├── posts/new/page.tsx · posts/[id]/page.tsx   Create / edit with the editor
    │   │   ├── messages/page.tsx  Contact inbox (read / delete)
    │   │   ├── comments/page.tsx  Comment moderation
    │   │   └── settings/page.tsx  Profile, password, environment health (DB probe, mail provider)
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts   Auth.js handlers
    │       ├── newsletter/status/route.ts    GET → { signedIn, email, subscribed } for the current viewer
    │       ├── newsletter/unsubscribe/route.ts   POST (one-click, List-Unsubscribe) · GET → redirect to /unsubscribe
    │       ├── posts/[id]/view/route.ts      POST view counter (once per browser session)
    │       ├── posts/[id]/engagement/route.ts   GET reactions + comments for a post (client refresh)
    │       └── admin/subscribers/route.ts    CSV export (admin only)
    │
    ├── components/
    │   ├── layout/sidebar.tsx · mobile-nav.tsx · nav-icon.tsx   Navigation shell
    │   ├── ui/button.tsx · badge.tsx · field.tsx · page-header.tsx · toast.tsx   Design-system primitives
    │   ├── auth/auth-card.tsx · login-form.tsx · register-form.tsx · use-auth-redirect.ts
    │   ├── blog/markdown.tsx (react-markdown + GFM + highlight + slugs) · toc.tsx · reading-progress.tsx · share-buttons.tsx · engagement.tsx (reactions + comments)
    │   ├── newsletter/newsletter-card.tsx  Card & banner: guest email form / signed-in one-click subscribe & unsubscribe
    │   ├── newsletter/newsletter-store.ts  Tiny external store (useSyncExternalStore) sharing subscription state between card and bell
    │   ├── newsletter/unsubscribe-form.tsx Buttons for the /unsubscribe page
    │   ├── admin/post-editor.tsx (split-pane Markdown editor) · post-actions · message-actions · comment-delete · settings-forms · admin-nav
    │   ├── contact-form.tsx       Sign-in gate + message form (email read-only from the session)
    │   ├── user-chip.tsx          Sidebar account chip: avatar, role, newsletter bell, admin link, sign out
    │   ├── terminal.tsx           Interactive terminal on the home page
    │   ├── command-palette.tsx    Ctrl/⌘+K palette (cmdk) + number shortcuts
    │   ├── github-activity.tsx    Server component calling the GitHub API (cached 5 min)
    │   ├── hero-background.tsx · theme-provider.tsx · theme-toggle.tsx · site-footer.tsx
    │   ├── post-card.tsx · project-card.tsx · project-grid.tsx · copy-button.tsx · print-button.tsx · icons.tsx
    │
    ├── content/                   Portfolio copy (edit these, not the components)
    │   ├── experience.ts          Roles (Simpplr, …), education, achievements
    │   ├── projects.ts            Projects grid + featured flags
    │   ├── skills.ts              Skill groups and levels
    │   └── about.ts               Bio, values, "now"
    │
    ├── db/
    │   ├── index.ts               `pg` Pool from DATABASE_URL (TLS for Aiven), `db()` Drizzle instance, `isDbConfigured()`
    │   ├── schema.ts              Drizzle tables: user, account, session, verificationToken, post, comment, reaction, contact_message, subscriber
    │   ├── bootstrap.ts           `ensureSchema()` — CREATE TABLE IF NOT EXISTS + ALTER … ADD COLUMN IF NOT EXISTS + admin/first-post seed. Runs once per server instance.
    │   ├── safe.ts                `safeQuery(fn, fallback)` for pages (never throws) · `withDb(fn)` for actions (throws)
    │   ├── queries.ts             Read models: published posts, post by slug, adjacent posts, tags, comments, reactions, admin stats…
    │   └── health.ts              `getDbHealth()` — cached SELECT 1 probe with human-readable error hints
    │
    └── lib/
        ├── site.ts                Name, role, company, email, phone, location, socials, nav items, URL
        ├── utils.ts               cn(), slugify, readingTime, excerptFrom, formatDate, absoluteUrl, initialsOf…
        ├── mail.ts                sendMail / sendMany — Resend (batched) or SMTP via Nodemailer, or skip+log when unconfigured
        ├── email-templates.ts     welcomeEmail · newPostEmail · contactNotificationEmail (inline-styled HTML + text)
        ├── newsletter.ts          upsertSubscription · sendWelcomeEmail (once) · announcePost (once per post) · token helpers
        └── use-mounted.ts         Hydration-safe "mounted" hook
```

---

## 4. Running locally

### Prerequisites

- Node.js 20+ (22 recommended) and npm
- A PostgreSQL database — the Aiven service (see §6.1), or any local Postgres

### Steps

```bash
git clone git@github.com:ARamesh-tech/portfolio.git
cd portfolio
npm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
```

Open `.env.local` and fill in at least:

```
DATABASE_URL=postgres://avnadmin:REAL_PASSWORD@portfolio-…aivencloud.com:21193/defaultdb?sslmode=require
AUTH_SECRET=<openssl rand -base64 32>
AUTH_TRUST_HOST=true
ADMIN_EMAIL=rameshkumarana@gmail.com
ADMIN_PASSWORD=<pick a strong initial password>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then:

```bash
npm run db:check      # confirms the database is reachable (prints version + table counts)
npm run dev           # http://localhost:3000
```

The first request that touches the database runs `ensureSchema()`: it creates all tables (idempotent), inserts the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and seeds a welcome post. No migration step is required. `npm run db:push` (drizzle-kit) is available if you prefer explicit schema pushes.

Sign in at `/login` with `ADMIN_EMAIL` + `ADMIN_PASSWORD`, then open `/admin`.

### Without a database

The portfolio pages still render if `DATABASE_URL` is missing or invalid; the blog shows an empty state and auth/contact/newsletter actions return friendly errors. `isDbConfigured()` treats URLs that still contain `<redacted>` or `PASSWORD@` as "not configured".

### Without email

If neither Resend nor SMTP is configured, `sendMail` logs `[mail] skipped …` to the console and returns `{ ok: false, skipped: true }`. Everything else (subscriptions, announcements bookkeeping) still works; announcements are left "unannounced" so they can be sent later once mail is configured and the post is re-published.

---

## 5. Environment variables

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes* | `src/db/index.ts` | Aiven Service URI. Keep `?sslmode=require`; the pool uses TLS with `rejectUnauthorized: false` (Aiven's CA). `sslmode=disable` turns TLS off (local Postgres). |
| `AUTH_SECRET` | yes | Auth.js | 32+ random bytes, base64. Rotating it signs everyone out. |
| `AUTH_TRUST_HOST` | yes | Auth.js | `true` (required on Vercel / behind proxies) |
| `ADMIN_EMAIL` | yes | `auth.ts`, bootstrap | This email gets the `admin` role — via password **or** Google |
| `ADMIN_PASSWORD` | first run | bootstrap | Seeds the admin's password hash if the user doesn't exist yet. Change it later in `/admin/settings`. |
| `NEXT_PUBLIC_SITE_URL` | yes | metadata, sitemap, OG, **email links** | `https://arameshkumaran.vercel.app` in production |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Auth.js | Google button appears only when both are set |
| `RESEND_API_KEY` | optional (one mail provider) | `lib/mail.ts` | Resend API key |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | optional (one mail provider) | `lib/mail.ts` | Any SMTP server. Port 465 ⇒ implicit TLS; 587 ⇒ STARTTLS. |
| `MAIL_FROM` | recommended | `lib/mail.ts` | Sender, e.g. `Ramesh Kumaran <hello@yourdomain.com>`. Falls back to `CONTACT_FROM_EMAIL`, then `SMTP_USER`, then Resend's onboarding address. |
| `CONTACT_TO_EMAIL` | optional | contact action | Where contact messages are delivered (default: `site.email`) |
| `GITHUB_TOKEN` | optional | GitHub widget | Raises API rate limit from 60 to 5000 req/h |

\* Without it the site runs in "portfolio only" mode.

All secrets must be set in **both** places: `.env.local` for local development and Vercel → Project → Settings → Environment Variables for production/preview.

---

## 6. Connecting external services

### 6.1 Aiven PostgreSQL

1. Aiven Console → your service (`portfolio-rameshkumarana-…`) → **Overview → Connection information**.
2. Copy the **Service URI** (it looks like `postgres://avnadmin:AVNS_xxxxxxxx@portfolio-….j.aivencloud.com:21193/defaultdb?sslmode=require`). The password is shown there — the app cannot work with the `<redacted>` placeholder.
3. Paste it as `DATABASE_URL` in `.env.local` and run `npm run db:check`.
4. Add the same value on Vercel for **Production** and **Preview**, then redeploy (env changes need a new deployment).
5. Make sure the Aiven service is **powered on** and its IP allow-list either is empty (allow all) or includes `0.0.0.0/0` — Vercel functions have no fixed IP.

Tables are created automatically (`src/db/bootstrap.ts`). To inspect data: `npm run db:studio` (Drizzle Studio) or Aiven's query editor.

### 6.2 Email (Resend or SMTP / Gmail)

Email powers three things: contact-form notifications to you, the welcome email, and new-post announcements. Pick **one** provider:

**Option A — Resend (recommended for production)**
1. Create an account at resend.com, add and verify your domain (or use `onboarding@resend.dev` for testing — it can only send to your own address).
2. Resend dashboard → **API Keys → Create API Key** (permission: *Sending access*). Copy the `re_…` value; it is shown only once.
3. Put the key in **both** places the app reads env vars from:

   *Local development* — `.env.local` (git-ignored):
   ```
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
   MAIL_FROM="Ramesh Kumaran <blog@yourdomain.com>"
   ```
   *Production (Vercel)* — either in the dashboard: vercel.com → project **portfolio** → **Settings → Environment Variables → Add** (`RESEND_API_KEY`, tick *Production* and *Preview*, mark it *Sensitive*), or from the terminal:
   ```bash
   npx vercel env add RESEND_API_KEY production   # paste the key when prompted
   npx vercel env add RESEND_API_KEY preview
   npx vercel env add MAIL_FROM production
   npx vercel env add MAIL_FROM preview
   ```
   Then **redeploy** (push a commit, or Deployments → ⋯ → Redeploy) — env vars are read at build/deploy time.
4. `MAIL_FROM` must be an address on the domain you verified in Resend (for a first test, `MAIL_FROM="Ramesh Kumaran <onboarding@resend.dev>"` works but only delivers to your own inbox).
5. Verify: `/admin/settings` → Environment health should show *Email via Resend*. Subscribe with your own email on `/blog` to receive the welcome mail.

Never commit the key: `.env*` is git-ignored and `.env.example` must only contain the empty placeholder.

**Option B — Gmail SMTP (quick start)**
1. Google Account → Security → 2-Step Verification → **App passwords** → create one for "Mail".
2. Set:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=rameshkumarana@gmail.com
   SMTP_PASS=<16-character app password>
   MAIL_FROM="Ramesh Kumaran <rameshkumarana@gmail.com>"
   ```
   Gmail caps free accounts at roughly 500 recipients/day — fine for a personal blog.

The admin **Settings → Environment health** panel shows which provider is active.

### 6.3 Google sign-in

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web application).
2. Authorised JavaScript origins: `https://arameshkumaran.vercel.app` and `http://localhost:3000`.
3. Authorised redirect URIs: `https://arameshkumaran.vercel.app/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`.
4. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. The "Continue with Google" button appears automatically.

If you sign in with Google using `ADMIN_EMAIL`, that account is the admin too (accounts are linked by email).

### 6.4 GitHub token

Optional. Create a fine-grained token with no scopes (public read) at github.com/settings/tokens and set `GITHUB_TOKEN`. The home-page widget reads public repos and events for `ARamesh-tech`.

---

## 7. How it works in production

**Hosting.** The app runs on Vercel: static assets on the CDN, pages and actions as serverless functions (Node runtime), `proxy.ts` on the edge.

**Request path.**
1. Edge proxy checks `/admin/*` for a valid session JWT (no DB call) and redirects to `/login` if missing.
2. Static / ISR pages are served from the cache. `/blog/[slug]` regenerates at most every 60 s and immediately after `savePost` calls `revalidatePath`.
3. Dynamic pages and Server Actions run in a function, open (or reuse) the shared `pg` Pool (`max: 4`), and call `ensureSchema()` once per cold start (guarded by a global promise).

**Sessions.** Auth.js issues a signed JWT cookie (`AUTH_SECRET`). Server code reads it with `auth()`; client components read it with `useSession()`. After a credentials login the client does a full-page navigation so the session is fresh everywhere.

**Background email.** Server actions call `after(() => …)`. Vercel keeps the function alive until the callback settles, so emails go out after the response is already on its way — the admin editor never blocks on SMTP.

**Idempotency.**
- `announcePost()` first claims the post by setting `post.announced_at` (`UPDATE … WHERE announced_at IS NULL`). Concurrent publishes or later edits never re-send. If no mail provider is configured the claim is rolled back so the post can be announced later.
- `sendWelcomeEmail()` sets `subscriber.welcomed_at` — exactly one welcome per address, even after unsubscribe/resubscribe.

**Graceful degradation.** Public pages use `safeQuery` — if Postgres is unreachable they render with empty data instead of a 500. The blog's empty state explains the situation without leaking details; the admin Settings page shows the actual error.

**Caching.** Home revalidates every 5 min (GitHub activity + latest posts). `/feed.xml` hourly. The newsletter status endpoint is `no-store`.

**Observability.** Vercel Analytics + Speed Insights are included. Server logs (`[newsletter] …`, `[mail] …`, `[contact] …`) are visible in Vercel → Deployments → Functions / Logs.

---

## 8. Deploying — Vercel + GitHub auto-deploy

The Vercel project is `a-rameshs-projects/portfolio` with the production domain `arameshkumaran.vercel.app` (`rameshkumaran.vercel.app` is kept as a 308 redirect so old links keep working). To rename again: `npx vercel domains add <new>.vercel.app portfolio`, update `NEXT_PUBLIC_SITE_URL`, then set a redirect on the old name in Settings → Domains → Edit.

### Automatic deploys from GitHub (recommended)

Vercel's Git integration deploys **every push to `master`** to production and every other branch / PR to a preview URL.

1. Connect the repo (one-time):
   ```bash
   npx vercel link          # if not already linked
   npx vercel git connect   # links github.com/ARamesh-tech/portfolio
   ```
   or in the dashboard: Project → Settings → Git → **Connect Git Repository**. Install the Vercel GitHub App on the `ARamesh-tech` account when prompted.
2. Production branch: `master` (Settings → Git → Production Branch).
3. Push:
   ```bash
   git add -A && git commit -m "feat: …" && git push origin master
   ```
   Vercel builds and promotes automatically; the Deployments tab shows progress.

> **Commit author check.** Vercel only deploys commits whose author is linked to a GitHub account that has access to the project. Make sure the email you commit with is added to your GitHub account (GitHub → Settings → Emails), or configure git with your GitHub email / noreply address:
> `git config user.email "176018769+ARamesh-tech@users.noreply.github.com"`.
> Otherwise the deployment is created but marked *"Git author must have access to the project"*.

### GitHub Actions

`.github/workflows/ci.yml` runs on every push and PR:

- **check** — `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`. A red ✗ on the commit means the deploy will fail too.
- **deploy** (optional) — deploys to Vercel production from Actions instead of the Git integration. It only runs when these repository secrets exist (Settings → Secrets and variables → Actions):

  | Secret | Where to find it |
  | --- | --- |
  | `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
  | `VERCEL_ORG_ID` | `.vercel/project.json` after `npx vercel link` (`orgId`) — `team_PuAvN3gsqc1y56CoIABSgkk7` |
  | `VERCEL_PROJECT_ID` | `.vercel/project.json` (`projectId`) — `prj_OauOQ5rc5ajggYmQauFD68Z3iJb1` |

  Use either the Git integration **or** the Actions deploy, not both, to avoid double deployments. The Actions path strips `.git` before `vercel deploy`, so it is not subject to the commit-author check above.

### Manual deploy from your machine

```bash
npx vercel --prod
```

### Environment variables on Vercel

```bash
npx vercel env add DATABASE_URL production
npx vercel env add DATABASE_URL preview
# … repeat for AUTH_SECRET, AUTH_TRUST_HOST, ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL,
#   RESEND_API_KEY or SMTP_*, MAIL_FROM, CONTACT_TO_EMAIL, AUTH_GOOGLE_ID/SECRET, GITHUB_TOKEN
npx vercel env pull .env.local      # optional: sync back locally
```

Changing an env var does **not** rebuild automatically — trigger a redeploy (push a commit, or Deployments → ⋯ → Redeploy).

---

## 9. Making a change and getting it live

This is the day-to-day loop. Once the GitHub ↔ Vercel connection from §8 is in place, **a `git push` to `master` is the deploy** — there is no separate "publish" step.

### The pipeline, end to end

```
 you                    GitHub                         Vercel                         visitors
 ───                    ──────                         ──────                         ────────
 edit code
 npm run typecheck/lint/build   (optional local gate)
 git commit
 git push origin master ──────► master updated
                                ├─► GitHub Actions "CI & Deploy"
                                │     • npm ci
                                │     • typecheck · lint · build   ──► ✓ / ✗ shown on the commit
                                │
                                └─► Vercel Git integration (webhook)
                                      • clones the commit
                                      • npm ci  →  next build
                                      • creates a new immutable deployment
                                      • on success: promotes it to Production
                                        and points arameshkumaran.vercel.app at it ─────────────► live (~1–2 min)
```

Every push produces a **new deployment** with its own URL (`portfolio-<hash>-a-rameshs-projects.vercel.app`). Pushes to `master` are promoted to production; pushes to any other branch or a pull request get a **preview URL** and never touch production.

### Step by step

1. **Make the change** locally (component, page, content file, style…).
2. **Check it** — `npm run dev` for a live preview, then before committing:
   ```bash
   npm run typecheck && npm run lint && npm run build
   ```
   The same three commands run in CI, so if they pass here they pass there.
3. **Commit and push**
   ```bash
   git add -A
   git commit -m "feat: describe the change"
   git push origin master
   ```
4. **Watch it deploy** — GitHub → *Actions* tab shows the checks; Vercel → *Deployments* shows *Building → Ready*. You can also run `npx vercel ls` from the terminal.
5. **Verify** at https://arameshkumaran.vercel.app. Hard-refresh (`Ctrl+Shift+R`) if you still see the old page — the CDN can serve a cached copy of static pages for a moment.

If the build fails, production is **not** touched — the previous deployment keeps serving. Fix the error, commit, push again.

### What kind of change needs what

| You changed… | How it reaches production |
| --- | --- |
| Any file under `src/`, `public/`, config files | Commit + push → automatic build & deploy (steps above) |
| Portfolio copy in `src/content/*.ts` or `src/lib/site.ts` | Same — it's code. Push and it's live after the build. |
| A **blog post** (write, edit, publish) | No deploy at all. Posts live in Postgres and are edited in `/admin`; saving calls `revalidatePath`, so the public page updates within seconds. |
| Profile photo `public/images/ramesh.jpg` | Commit + push (same file name keeps every reference working) |
| An **environment variable** (`DATABASE_URL`, mail keys, …) | Change it in Vercel → Settings → Environment Variables (or `npx vercel env add … --force`), **then redeploy** — env values are baked in at build time. Either push a commit or Deployments → ⋯ → *Redeploy*. |
| **Database schema** (new column/table) | Edit `src/db/schema.ts` **and** add the matching idempotent DDL in `src/db/bootstrap.ts` (`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE … ADD COLUMN IF NOT EXISTS`). Push; on the first request after deploy `ensureSchema()` applies it to the live Aiven database automatically. No manual migration. |
| A dependency (`npm install <pkg>`) | Commit both `package.json` **and** `package-lock.json`; CI/Vercel use `npm ci`, which fails if they're out of sync. |
| The Node version or build command | `package.json` `engines` / Vercel → Settings → Build & Development Settings |

### Previewing before it goes live

Work on a branch and open a pull request:

```bash
git checkout -b feature/new-section
# …edit, commit…
git push -u origin feature/new-section
```

Vercel comments on the PR with a **preview URL** that uses the *Preview* environment variables (so it talks to the same database — be mindful when testing destructive admin actions). Merge the PR into `master` when happy; the merge commit deploys to production.

### Rolling back

Vercel → Deployments → pick the last good deployment → ⋯ → **Promote to Production** (or `npx vercel rollback`). This swaps the alias instantly, no rebuild. Then fix the code in git so the next push doesn't reintroduce the problem.

### If auto-deploy isn't connected yet

Until §8 is done (GitHub App installed, repo connected — or the three Actions secrets set), the fallback is a manual deploy from your machine after pushing:

```bash
npx vercel --prod
```

Everything else in this section still applies; only the trigger differs.

---

## 10. Data model

All tables live in `src/db/schema.ts`; DDL in `src/db/bootstrap.ts` is idempotent so new columns can be added with `ALTER TABLE … ADD COLUMN IF NOT EXISTS`.

| Table | Purpose | Notable columns |
| --- | --- | --- |
| `user` | Readers and the admin | `email` (unique), `password_hash` (null for Google-only), `role` (`user`/`admin`), `image` |
| `account`, `session`, `verificationToken` | Auth.js adapter tables (OAuth links) | |
| `post` | Blog posts | `slug` (unique), `content` (Markdown), `excerpt`, `tags[]`, `published`, `featured`, `published_at`, `announced_at` (newsletter sent), `views`, `reading_time` |
| `comment` | Comments on posts (one level of replies) | `post_id`, `user_id`, `content`, `parent_id` |
| `reaction` | One row per user × post × type | `type` ∈ like/love/insightful/fire |
| `contact_message` | Contact-form submissions | `name`, `email` (from session), `user_id`, `subject`, `message`, `read` |
| `subscriber` | Newsletter list | `email` (PK), `user_id` (if subscribed while signed in), `token` (unsubscribe secret, unique), `active`, `welcomed_at`, `unsubscribed_at` |

---

## 11. Key flows in detail

### Sign-in / registration
`register-form.tsx` → `registerAction` (Zod validate → bcrypt hash → insert user → `signIn("credentials", { redirect:false })`) → returns `redirectTo` → `useAuthRedirect` performs `window.location.assign()` so `useSession()` is fresh. Google uses the standard OAuth redirect. `ADMIN_EMAIL` always receives the `admin` role.

### Publishing a post → newsletter
1. Admin saves with **Published** checked → `savePost` writes the post, calls `revalidateBlog()`, then `after(() => announcePost(id))`.
2. `announcePost` claims `announced_at`, loads all `active` subscribers, ensures each has a `token`, renders `newPostEmail` with a personal unsubscribe link, and sends via `sendMany` (Resend batches of 100, or SMTP pooled).
3. Editing the post again does nothing (already announced). Unpublish → republish also does nothing.

### Subscribing
- **Signed-in reader**: banner on `/blog`, sidebar card, or the bell in the account chip → `subscribeMe()` → `upsertSubscription` → `after(sendWelcomeEmail)` (only if `welcomed_at` is null).
- **Anonymous visitor**: the email form → `subscribe()` (same path, `user_id` null).
- Status is served by `GET /api/newsletter/status` and shared client-side via `newsletter-store.ts`, so the bell and the cards update together.

### Unsubscribing
- Bell / card → `unsubscribeMe()` (confirm dialog) → `active=false`.
- Email footer link → `/unsubscribe?token=…` → confirmation page → `unsubscribeByToken` (a POST, so link scanners can't unsubscribe people by prefetching). The page also offers **Subscribe again**.
- Mail-client "Unsubscribe" button → `POST /api/newsletter/unsubscribe?token=…` (RFC 8058 one-click).

### Contact
`/contact` shows a sign-in gate to guests. Signed-in users see the form with their account email read-only. `submitContact` re-checks the session, validates, rate-limits per user+IP, stores the row, and emails `CONTACT_TO_EMAIL` with `Reply-To` set to the sender.

---

## 12. Admin guide

- **Sign in** at `/login` with `ADMIN_EMAIL` (password or Google). The shield icon in the sidebar chip opens `/admin`.
- **Write a post**: Admin → Posts → New. Markdown on the left, live preview on the right, `Ctrl/⌘+S` saves. Tick **Published** to go live (this triggers the subscriber email once). **Featured** pins it on the home page. **Save & view** opens the public page.
- **Edit / unpublish / delete**: Posts table actions. Editing never re-sends emails.
- **Inbox**: Admin → Messages — mark read, delete. Reply from your mail client (the notification email has Reply-To set).
- **Comments**: Admin → Comments — delete anything inappropriate.
- **Subscribers**: dashboard shows the active count; **Export CSV** includes status, dates and whether the address belongs to a registered account.
- **Settings**: change display name / avatar / password; the Environment health panel shows DB connectivity (with the real error if it fails) and the mail provider in use.

---

## 13. Editing portfolio content

Portfolio copy lives in plain TypeScript so it is easy to edit without touching components:

| File | Contents |
| --- | --- |
| `src/lib/site.ts` | Name, role, company, email, phone, **location**, socials, nav labels, site URL |
| `src/content/experience.ts` | Roles (Simpplr — Backend cum Data Engineer, Jul 2026 → present, etc.), education, achievements |
| `src/content/projects.ts` | Projects (title, description, stack, links, featured) |
| `src/content/skills.ts` | Skill groups and proficiency |
| `src/content/about.ts` | Bio paragraphs, values, "now" |
| `public/images/ramesh.jpg` | Profile photo (also used in OG images) |

Blog posts are written in the admin console and stored in Postgres.

---

## 14. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with Turbopack at http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (includes React Compiler rules) |
| `npm run typecheck` | Generate route types (`next typegen`) and run `tsc --noEmit` |
| `npm run db:check` | Verify `DATABASE_URL` connectivity, print server version and table counts |
| `npm run db:push` | Push the Drizzle schema with drizzle-kit (optional; bootstrap does this at runtime) |
| `npm run db:studio` | Browse the database with Drizzle Studio |

---

## 15. Testing & quality checks

- **CI**: `.github/workflows/ci.yml` runs typecheck, lint and a production build on every push/PR.
- **Local gate before pushing**: `npm run typecheck && npm run lint && npm run build`.
- **End-to-end**: the project was verified with a Playwright script against a throw-away Postgres (PGlite) and a local SMTP sink, covering admin login, post publish → announcement email, guest registration, subscribe/unsubscribe (card, bell, token page, one-click POST), contact gating and CSV export. To reproduce, run the app with `DATABASE_URL` pointing at any scratch Postgres and `SMTP_HOST` at a local sink (e.g. MailHog / smtp4dev), then exercise the flows in a browser.

---

## 16. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Blog says *"The blog database isn't connected yet"* | `DATABASE_URL` is missing or still contains `<redacted>` / `PASSWORD@`. Set the real Aiven URI (§6.1) locally **and** on Vercel, then redeploy. |
| Blog says *"temporarily unreachable"*; Settings shows *password authentication failed* | Wrong password in `DATABASE_URL`. Copy the Service URI from Aiven again (or reset the `avnadmin` password there). |
| `npm run db:check` times out | Aiven service powered off, or IP allow-list blocks you / Vercel. |
| No emails arrive | Settings → Environment health shows "currently logged only" → configure Resend or SMTP (§6.2). With Gmail, use an **App password**, not your account password. Check Vercel function logs for `[mail]`. |
| **Only my own address receives mail**; other subscribers get nothing | Resend **test mode**: without a verified domain the sender is `onboarding@resend.dev`, and Resend only delivers to the account owner's email (`You can only send testing emails to your own email address`). Fix: verify a domain in Resend and set `MAIL_FROM` to an address on it, or switch to Gmail SMTP (§6.2). Settings → Environment health shows *TEST MODE* while this applies. Welcome emails that failed are retried automatically the next time that reader subscribes. |
| Announcement not sent for a post | It was published while mail was unconfigured (claim rolled back) → configure mail, unpublish and publish again. Or it was already announced (`announced_at` set) — by design. |
| Google button missing | Both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` must be set; redirect URI must match exactly. |
| Deployment shows *"Git author must have access to the project"* | Link the commit email to your GitHub account or set `git config user.email` to your GitHub email (§8). |
| `/admin` redirects to login although I'm the admin | Your account email must equal `ADMIN_EMAIL` (case-insensitive). Sign out and in again after changing env vars. |
| Everyone got signed out | `AUTH_SECRET` changed — expected. |

---

## 17. Security notes

- Secrets live only in `.env.local` (git-ignored) and Vercel env vars. Never commit them; `.env.example` holds placeholders only.
- Passwords are hashed with bcrypt (cost 12). Sessions are signed JWTs in HttpOnly cookies.
- All mutations run in Server Actions that re-validate input (Zod) and re-check the session/role — client gates are UX only.
- Contact form: login required, honeypot field, per-user rate limit, sender address taken from the verified session.
- Unsubscribe tokens are random UUIDs per subscriber; the confirmation page requires a POST so email scanners cannot unsubscribe readers accidentally.
- Admin routes are protected twice: at the edge (`proxy.ts`) and in `admin/layout.tsx` (role check against the session).
