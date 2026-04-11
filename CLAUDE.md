# GlideGo — Active Development Brain
_Project: Next.js 15 + TypeScript + Supabase + Stripe + Tailwind CSS_
_Live URL: https://glidego.vercel.app_
_GitHub: github.com/GlidegoCarRentals/Website_
_Local: C:\Glidego Website Project\_
_Supabase Project ID: rtbmmuhsisccrxmndivx_

---

# ⚙️ AUTO-UPDATE RULE — ANY AI MUST FOLLOW
After EVERY task completion, automatically:
1. Update "CURRENT TASK" section below with exact next step
2. Move completed task to "COMPLETED" list
3. Run this command: Copy-Item "CLAUDE.md" "GEMINI.md" -Force
Do this without user asking every time.

---

# 🔴 CURRENT TASK — ANY AI START HERE
**Status:** IN PROGRESS
**Module:** 4 — Host/Car Management
**Exact Next Step:** Fix host role redirect loop on /host/add-vehicle
**Root Cause:** Main account has role='guest' in DB — needs 'host'

**Fix — Run this SQL in Supabase Dashboard → SQL Editor:**
```sql
UPDATE profiles 
SET role = 'host' 
WHERE email = 'MelbourneMotoRent@outlook.com';
```

**After SQL fix, test these 3 pages in order:**
- [ ] /host/add-vehicle → should open without redirect loop
- [ ] /fleet → should show real car data from Supabase
- [ ] /account → should show real user profile data

---

# ✅ COMPLETED — DO NOT REDO ANYTHING BELOW

## Module 1 — Authentication ✅ FULLY WORKING — DO NOT TOUCH
- Email/password login + signup working
- Google OAuth working (implicit token flow)
- PKCE token handling in auth callback
  (uses verifyOtp() + exchangeCodeForSession() as fallback)
- Gmail SMTP configured — bypasses Supabase free tier email limits
- Protected routes working via middleware.ts
- Password reset working
- Email verification badge working
- Account deletion working
- useSearchParams() wrapped in Suspense (Next.js 15 requirement)
- Sessions use cookies via @supabase/ssr — NOT localStorage

## Module 2 — Database ✅ PARTIALLY COMPLETE
- Cars seeded in Supabase
- Storage buckets created
- Trust/earnings/ratings functions added
- Melbourne surge pricing configured
- Homepage, fleet, car detail pages fetch from Supabase
- Static fallback data exists

## Module 3 — Design System ✅ PARTIALLY COMPLETE
- globals.css with CSS custom properties done
- Plus Jakarta Sans + Inter fonts loaded
- Components built: button, card, form, skeleton, toast, modal
- Responsive breakpoints configured

## Module 4 — Host/Car Management 🔴 IN PROGRESS
- /host/add-vehicle page created — redirect loop bug exists
- /fleet page — needs live data verification
- /account page — not tested with real Supabase data

---

# 🚨 CRITICAL RULES — ANY AI MUST FOLLOW ALWAYS

1. NEVER touch Module 1 auth system — it works, dont break it
2. ALWAYS use @supabase/ssr package — NEVER localStorage for sessions
3. ALWAYS wrap useSearchParams() inside Suspense boundary
4. Run npm run build after every file change — check for errors
5. English only in all UI code — no Hindi or Hinglish text anywhere
6. Use &apos; instead of apostrophe in JSX — prevents build failure
7. Never track node_modules in git
8. Stripe redirect must go to /payment-success page only
9. Dark premium aesthetic throughout the UI
10. Windows/PowerShell only — no Linux commands

---

# 📁 KEY FILES — DO NOT MOVE OR RENAME

| File | Purpose |
|------|---------|
| middleware.ts | Route protection — auth guard |
| src/app/host/add-vehicle/page.tsx | Host car listing page |
| src/lib/supabase/server.ts | Server-side DB client |
| src/components/profile/GuestProfileDashboard.tsx | Guest dashboard |
| src/components/profile/HostProfileDashboard.tsx | Host dashboard |
| src/app/account/profile/page.tsx | Account page |
| src/app/host/dashboard/page.tsx | Host dashboard page |
| .env.local | Secrets — never commit to git |
| CLAUDE.md | This file — always update after tasks |

---

# 🗄️ DATABASE SCHEMA SUMMARY

Core tables in Supabase:
- users — identity for guests, hosts, admins
- guest_profiles — guest data, emergency contact, spend, behavior
- host_profiles — host performance, superhost, earnings
- bookings — full booking lifecycle with Stripe refs
- booking_status_history — immutable audit trail
- payments — Stripe charge lifecycle
- payouts — Stripe Connect payout lifecycle
- reviews — guest/host/car reviews
- conversations + messages — real-time chat
- favourites — saved cars
- user_wallets + wallet_transactions — wallet engine
- verification_documents + fraud_signals — trust layer
- host_vehicle_analytics_daily — per-car analytics

RLS: Users can only read/update their own data.
Guests/hosts can only see bookings/messages they are part of.

---

# 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + @supabase/ssr |
| Payments | Stripe |
| Hosting | Vercel |
| Email | Gmail SMTP |
| Testing | Playwright |
| Monitoring | Sentry |
| CI/CD | GitHub Actions |

---

# 📝 UPDATE LOG — AI Updates This After Every Task

| Date | Task Completed | Next Task |
|------|---------------|-----------|
| 2026-04-10 | CLAUDE.md created | Fix host role in Supabase SQL |