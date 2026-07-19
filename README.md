# Halaqa Academy

A full school-operations platform: public registration with admin approval, student/teacher/board/finance/admin
portals, live-classroom attendance, homework (text/video/audio) with a task-based access lock, Quran-curriculum
milestone tracking, exams, chat, finance (fees/deposits/budgets/salaries), campaign leads, and growth analytics.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui, backed by Supabase (Postgres, Auth, Storage,
Realtime).

## 1. Prerequisites

- Node.js 20+
- A Supabase project — either:
  - **Local**: install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then run `npx supabase start`
    in this directory (spins up Postgres/Auth/Storage locally and prints your local URL/keys), or
  - **Cloud**: create a free project at [supabase.com](https://supabase.com).

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your
Supabase project settings (or the output of `supabase start` for local dev). Set `NEXT_PUBLIC_APP_URL` to whatever
this app will be reachable at (used to build the login link sent in approval notifications).

## 3. Apply the database schema

All tables, RLS policies, and RPC functions live in `supabase/migrations/`, applied in filename order.

```bash
# Local Supabase (via Docker):
npx supabase start

# Cloud Supabase: link the project once, then push migrations
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## 4. Install dependencies and bootstrap the first admin

Every account — student, teacher, even future admins — starts `pending` and needs an *existing active admin* to
approve it, so the very first admin can't be created through the app itself:

```bash
npm install

ADMIN_NAME="Your Name" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="a-strong-password" \
  npm run bootstrap:admin
```

## 5. Run it

```bash
npm run dev
```

Visit `/login` and sign in as the admin you just bootstrapped. From there:
- Register a test student at `/register/student` and a test teacher at `/register/teacher`.
- Approve both from the admin dashboard's Student Reg / Teacher Reg tabs.
- Log in as each to exercise the student/teacher portals (classrooms, homework, chat, academics).
- Create a `board` or `finance` profile the same way (register as a student/teacher isn't required — you can also
  insert a profile row directly via the Supabase SQL editor with `role='board'` or `role='finance'` and
  `status='active'`, pointed at an existing `auth.users` row, since there's no public registration form for those
  two roles by design).

## What's real vs. mocked right now

These are built behind stable interfaces so swapping in the real thing later doesn't touch call sites:

| Feature | Current state | To go live |
|---|---|---|
| WhatsApp / email / SMS | Mocked — every send is logged to the `notifications_log` table (`lib/notify/`) instead of actually sending | Get a WhatsApp Business Cloud API (or Twilio) account, an email provider (Resend/SendGrid), and an SMS provider (Twilio/Unifonic); swap the provider in `lib/notify/index.ts` |
| Online fee payment | Manual — finance staff mark invoices paid by hand | Register with a Saudi payment gateway (Moyasar/PayTabs/HyperPay/Tap) and add a checkout flow to `fee_invoices` |
| Classroom attendance | Click-to-join logs attendance and redirects to the Google Meet/Zoom link | Real Zoom/Google Workspace API credentials would let you verify actual meeting participation instead of just the click |

## Project structure

- `supabase/migrations/` — full schema, RLS policies, and RPC functions (`join_classroom`, `approve_profile`,
  `start_conversation`, etc.) — read these to understand the data model and authorization rules.
- `app/(auth)/` — public login and registration.
- `app/(portal)/{student,teacher,admin,board,finance}/` — the five role-gated portals; each has its own
  `layout.tsx` that enforces role + active status (`middleware`/`proxy.ts` re-checks this on every request too).
- `lib/notify/` — the swappable WhatsApp/email/SMS notification seam.
- `lib/supabase/` — browser/server/admin Supabase clients and hand-written database types.
- `scripts/bootstrap-admin.ts` — one-time first-admin creation script.

## Scope notes

A few items from the original spec were deliberately left out of this pass to keep it shippable — flag if you want
them added next: an in-app realtime notification bell (distinct from the WhatsApp/email/SMS log), a calendar view of
classes/homework/exams, a Cmd+K command palette, and Arabic/RTL localization.
# thartheel
