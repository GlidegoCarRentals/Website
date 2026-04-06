# GlideGo Guest + Host Profile System

## 1. System architecture

GlideGo uses a four-layer profile architecture:

- Presentation: Next.js App Router pages for `/account/profile` and `/host/dashboard`, rendered server-side and hydrated with client mutations for profile edits, notification toggles, favourites, and booking decisions.
- Domain/query layer: `src/lib/profile/queries.ts` centralizes guest and host dashboard reads so product logic is consistent across pages and future mobile/admin surfaces.
- Platform services: Supabase Auth provides identity, PostgreSQL stores profile and operational data, Stripe stores customer/payment/payout primitives, Resend handles outbound transactional messaging, and Vercel hosts the web app and scheduled jobs.
- Trust/risk layer: verification documents, trust events, behavior events, fraud signals, analytics, AI insights, and payout ledgers give GlideGo a deeper trust model than a basic marketplace account page.

## 2. Database schema

Core tables:

- `users`: single identity table for guests, hosts, and admins.
- `guest_profiles`: guest-specific profile data, emergency contact, spend, behavior flags.
- `host_profiles`: host-specific profile, performance, instant booking, superhost, earnings state.
- `bookings`: booking lifecycle, trip dates, pricing, deposits, payment references, dispute/no-show/cancellation metadata.
- `booking_status_history`: immutable audit trail for trip state changes.
- `booking_calendar_blocks`: host availability and manual blocking.
- `payments`: Stripe-backed charge lifecycle.
- `payouts`: Stripe Connect transfer/payout lifecycle for hosts.
- `reviews`: guest/host/car reviews with host responses.
- `conversations` and `messages`: real-time chat model between guest and host.
- `favourites`: persistent saved cars.
- `user_notification_preferences`, `user_security_settings`, `user_payment_profiles`, `saved_payment_methods`: account settings and billing controls.
- `user_wallets`, `wallet_transactions`, `referral_codes`, `referrals`: wallet, promo, and referral engine.
- `verification_documents`, `user_trust_events`, `user_behaviour_events`, `fraud_signals`: trust, fraud, and auditability.
- `host_vehicle_analytics_daily`, `host_ai_insights`: analytics and intelligent host guidance.

RLS strategy:

- Users can read/update only their own profile/settings/wallet/payment methods.
- Guests and hosts can only read bookings, payments, messages, and reviews if they are participants.
- Hosts can only manage booking decisions, calendar blocks, analytics, and payouts tied to themselves.
- Verification and fraud records are private to the affected user unless elevated internal service access is used.

Indexing:

- Composite indexes for guest/host booking timelines.
- Date-range indexes for bookings and calendar blocking.
- Conversation/message timeline indexes.
- Analytics, payout, wallet, trust, and fraud indexes for dashboard queries and operations review.

## 3. Feature breakdown

Guest profile:

- Personal identity, emergency contact, verification progress, trust score, session/security settings.
- Upcoming, active, past, and cancelled trips linked directly from `bookings`.
- Stripe payment methods and billing history.
- Wallet balances, referral conversion tracking, and trust event ledger.
- Persistent favourites and review history.
- Notification preferences across email, SMS, and push.

Host profile:

- Host profile, performance metrics, superhost state, instant booking control.
- Fleet and per-car analytics including views, requests, confirmed bookings, revenue, and conversion rate.
- Booking queue with accept/decline actions.
- Payout visibility for Stripe Connect workflows.
- Conversation summary and recent reviews.
- AI insight feed for pricing, utilization, and conversion improvements.

## 4. UX flows

Guest journey:

1. User signs up with Supabase Auth.
2. `handle_new_user()` provisions all profile/settings/wallet records automatically.
3. Guest verifies email and phone, uploads a driver licence, and builds trust score.
4. Guest books a car, pays through Stripe, and the booking enters pending/confirmed/active/completed states.
5. Wallet credits, reminders, and host messages stay visible in the profile dashboard.
6. After trip completion the guest leaves reviews and can rebook or save the vehicle.

Host journey:

1. User signs up as host and gets a host profile record automatically.
2. Host lists vehicles, configures pricing, availability, instant booking, and payouts.
3. Booking requests appear in the host dashboard with guest trust/licence context.
4. Host accepts or declines, monitors the calendar, messages the guest, and tracks payouts.
5. Analytics and AI insights identify low conversion, pricing gaps, or weak response performance.
6. Strong response/completion/on-time rates can graduate the host into superhost status.

Edge cases:

- Cancellation: store `cancelled_by`, `cancelled_at`, and `cancellation_reason`; drive refunds through `payments` and status history.
- Failed payments: set `payment_status = failed`, keep trust/fraud signals if suspicious, and move booking to `cancelled` or `awaiting_payment`.
- Disputes: set booking/payment dispute states, add `fraud_signals`, notify internal ops, and pause payouts.
- No-show: set `no_show_reported_at`, preserve evidence in timeline metadata, and feed trust score adjustments.

## 5. Code structure

Key implementation paths:

- `supabase/migrations/20260406_guest_host_profile_system.sql`
- `src/lib/supabase/server.ts`
- `src/lib/profile/types.ts`
- `src/lib/profile/queries.ts`
- `src/components/profile/GuestProfileDashboard.tsx`
- `src/components/profile/HostProfileDashboard.tsx`
- `src/app/account/profile/page.tsx`
- `src/app/host/dashboard/page.tsx`
- `src/app/api/account/profile/route.ts`
- `src/app/api/account/preferences/route.ts`
- `src/app/api/account/favourites/route.ts`
- `src/app/api/host/settings/route.ts`
- `src/app/api/host/bookings/[id]/decision/route.ts`

Recommended next production steps:

- Add Supabase Storage buckets + signed upload flows for licence verification and profile photos.
- Add Stripe SetupIntent flow to create/update `saved_payment_methods`.
- Add Supabase Realtime channels for messages and booking status changes.
- Add scheduled jobs for trust scoring, AI insights generation, payout reconciliation, and superhost promotion.
- Add internal admin moderation surfaces for document review, disputes, and fraud case handling.

## 6. Improvements over Turo

GlideGo goes beyond a standard car-sharing profile system by adding:

- A transparent trust-score ledger instead of opaque verification state.
- Behavior event tracking and fraud signal tables as first-class data models.
- AI host insights tied to actual per-car analytics.
- Wallet + referral + trust systems integrated into the account layer.
- Stronger operational auditability through booking status history and payout/payment ledgers.
- One profile domain that cleanly supports future mobile apps, admin operations, and automation jobs.
