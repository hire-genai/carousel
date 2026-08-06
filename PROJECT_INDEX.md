# PROJECT_INDEX.md
# Always consult this file first. Do not search the repo if the file is listed here.

## Authentication
- lib/auth.ts — getCurrentUser, getCurrentSession, JWT helpers
- middleware.ts — route protection
- app/api/auth/send-otp/route.ts
- app/api/auth/verify-otp/route.ts
- app/api/auth/me/route.ts

## LinkedIn
- lib/linkedin-carousel.ts — postCarouselToLinkedIn(), image upload, SVG renderer
- app/api/linkedin/connect/route.ts — OAuth initiation
- app/api/linkedin/callback/route.ts — OAuth callback, token save
- app/api/linkedin/post/route.ts — direct post (from CarouselResult)
- app/api/linkedin/disconnect/route.ts

## Scheduler / Worker
- scripts/publish-worker.js — polling loop (npm run worker)
- app/api/cron/publish-scheduled/route.ts — finds due posts, calls postCarouselToLinkedIn
- app/api/schedule/route.ts — POST to create ScheduledPost
- app/api/schedule/[id]/route.ts — DELETE to cancel

## Carousel
- app/api/carousels/route.ts — GET list (for SchedulePickerModal)
- app/api/carousels/[id]/route.ts — GET/PUT/DELETE single carousel
- app/api/generate/route.ts — OpenAI generation
- components/CarouselResult.tsx — full editor UI (undo/redo, export, post, schedule)

## Templates
- lib/templates.ts — TEMPLATES array
- app/dashboard/templates/page.tsx

## Brand Kit
- app/api/brand/route.ts — GET/POST brand kit
- app/dashboard/brand/page.tsx

## Billing
- app/api/billing/checkout/route.ts
- app/api/billing/portal/route.ts
- app/api/billing/webhook/route.ts
- app/dashboard/billing/page.tsx

## Teams
- app/api/teams/invite/route.ts
- app/api/teams/invite/[token]/route.ts
- app/invite/[token]/page.tsx

## Database
- prisma/schema.prisma — all models
- lib/prisma.ts — Prisma client singleton

## UI Components
- components/SchedulePickerModal.tsx — 2-step: pick carousel → date/time
- components/ScheduleModal.tsx — schedule from carousel editor
- components/auth/OtpForm.tsx
- app/dashboard/CarouselGrid.tsx — My Carousels grid with Schedule buttons
- app/dashboard/scheduled/ScheduleButton.tsx
- components/dashboard/Sidebar.tsx
