# ARCHITECTURE.md

# Purpose

This document explains the project architecture.

Claude MUST read this document before implementing any feature.

Never assume architecture.

Always verify using the existing codebase.

---

# Stack

- Next.js 14 App Router (server + client components)
- TypeScript
- Tailwind CSS dark theme (bg-[#0f0f13])
- Prisma 5 ORM + SQLite (file:./dev.db)
- OpenAI gpt-4o for carousel generation
- JWT sessions via jose (cookie: skygen_session, 30-day expiry)
- OTP authentication (6-digit, SHA-256 hashed, 10-min TTL)
- LinkedIn OAuth 2.0 (scopes: openid profile email w_member_social)
- Stripe billing (placeholder keys locally)
- sharp for server-side SVG→PNG
- html2canvas + jsPDF + JSZip for client-side export

---

# Development Philosophy

The project follows an

Integration First

approach.

New features should integrate into the existing architecture.

Never replace existing systems.

---

# General Flow

User

↓

UI (Next.js client components)

↓

API Routes (app/api/*)

↓

Business Logic (lib/*)

↓

Database (Prisma + SQLite)

↓

Worker (scripts/publish-worker.js)

↓

External APIs (LinkedIn, OpenAI, Stripe)

↓

Database Update

↓

UI Refresh

---

# Auth Flow

OTP email → send-otp → verify-otp → JWT cookie (skygen_session)

No Google OAuth. No passwords. OTP only.

getCurrentUser() and getCurrentSession() in lib/auth.ts.

middleware.ts protects /dashboard/* routes.

---

# Carousel Generation Flow

User input (topic/URL/YouTube/text)

↓ POST /api/generate

OpenAI gpt-4o

↓

CarouselData { title, slides[] }

↓

CarouselResult.tsx (editor: undo/redo, design, export, post, schedule)

↓

POST /api/carousels/[id] (save)

---

# Scheduling Flow

Save carousel first

↓

SchedulePickerModal (Step 1: pick carousel, Step 2: date/time/comment)

↓

POST /api/schedule (creates ScheduledPost in DB)

↓

scripts/publish-worker.js polls every 30s

↓

POST /api/cron/publish-scheduled

↓

postCarouselToLinkedIn() in lib/linkedin-carousel.ts

↓

SVG slides → PNG via sharp → LinkedIn registerUpload → asset URNs

↓

POST /v2/ugcPosts with shareMediaCategory: IMAGE

↓

DB update: status = "posted"

---

# LinkedIn Publishing (lib/linkedin-carousel.ts)

postCarouselToLinkedIn() — main entry point

1. buildSlideSvg() — SVG per slide (gradient from design, word-wrapped text)
2. sharp().png() — SVG Buffer → PNG Buffer
3. registerAndUpload() — LinkedIn asset upload → URN
4. postImageCarousel() — ugcPosts with IMAGE media array
5. Fallback: postTextOnly() if image upload fails
6. postComment() — auto-comment after publish

---

# Feature Flow

For every feature identify:

1. Entry Point (UI component)
2. API route (app/api/*)
3. Business Logic (lib/*)
4. Database (Prisma model)
5. Background Worker (if async)
6. External Service (LinkedIn, OpenAI, Stripe)
7. Response / DB update

Never skip any layer.

---

# File Modification Rules

Priority:

1. Modify existing file
2. Extend existing service
3. Extend helper
4. Create new file (last option)

---

# Database Models (prisma/schema.prisma)

- User
- OtpCode
- LinkedInAccount
- Carousel
- ScheduledPost
- BrandKit
- Subscription
- Workspace
- WorkspaceMember
- TeamInvite

Never add duplicate models.

---

# API Rules

Never create duplicate endpoints.

Always extend existing endpoints first.

Key APIs:
- /api/auth/* — authentication
- /api/linkedin/* — OAuth + post
- /api/carousels/* — CRUD
- /api/schedule/* — scheduling
- /api/cron/* — worker endpoints
- /api/generate — OpenAI
- /api/brand — brand kit
- /api/billing/* — Stripe
- /api/teams/* — team invites

---

# UI Rules

Never duplicate components.

Key components:
- CarouselResult.tsx — main carousel editor
- SchedulePickerModal.tsx — schedule from anywhere
- ScheduleModal.tsx — schedule from carousel editor
- CarouselGrid.tsx — My Carousels grid
- Sidebar.tsx — dashboard nav

---

# Worker Rules

Do not replace the worker (scripts/publish-worker.js).

Do not replace the cron endpoint.

Integrate with them.

---

# Final Checklist

Before every implementation:

✓ Architecture preserved

✓ Existing code reused

✓ Minimal implementation

✓ No duplicate logic

✓ No unnecessary files

✓ No unnecessary APIs

✓ Production ready
