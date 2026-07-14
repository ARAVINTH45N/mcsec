
# Microsoft Club SEC — Build Plan

A production-quality, real-time community platform for Microsoft Club SEC, powered by Lovable Cloud (auth, Postgres, storage, realtime).

## 1. Backend (Lovable Cloud)

**Enable Lovable Cloud** for auth, database, storage, and realtime.

**Tables (with RLS + grants):**
- `profiles` — id (FK auth.users), full_name, college_email, phone, department, year, member_id (unique, `MCSEC-2026-XXXX`), avatar_url, created_at. Auto-created by trigger on signup from metadata.
- `user_roles` — id, user_id, role (`enum: admin | student`). Separate table + `has_role()` security-definer function (per user-roles rule).
- `activities` — id, title, description, category, deadline, resource_links (jsonb), attachments, created_by, created_at.
- `activity_assignments` — id, activity_id, user_id, status (`not_started|in_progress|completed|overdue`), completed_at, admin_verified.
- `notifications` — id, user_id, title, body, link, activity_id, read, created_at.
- `chat_messages` — id, user_id, content, created_at (7-day retention view/query filter).
- `gallery_posts` — id, title, caption, event_date, activity_id (nullable), created_by.
- `gallery_images` — id, post_id, image_url, sort_order.
- `membership_applications` — id, name, register_no, department, year, email, phone, reason, interests (text[]), status (`pending|approved|rejected`), created_at.
- `site_settings` — singleton row: whatsapp_url, linkedin_url, contact_email, hero_title, hero_subtitle, hero_bg_url, global_bg_url.
- `notifications_log` — mirrors sent notifications for admin history.

**Storage buckets:** `avatars`, `gallery`, `activity-attachments`, `site-assets`.

**Realtime enabled on:** `notifications`, `chat_messages`, `activity_assignments`.

**Seed admin:** migration inserts `user_roles` row for `aravinth.vnagarajan@gmail.com` when that auth user is first created (via trigger that checks email on signup); we also provide instructions to sign up once with `admin@mcSEC` and the role is auto-assigned.

**Member ID generator:** Postgres sequence + trigger produces `MCSEC-<year>-<0001>`.

## 2. Frontend Architecture (TanStack Start)

**Design system** (`src/styles.css`):
- Colors: Microsoft blue `#0078D4`, dark navy `#0B1F3A`, white; four accent tokens for red/green/yellow/blue squares.
- Fluent-style: rounded 2xl cards, soft shadows, Segoe UI stack.
- Gradient overlay tokens + `--bg-image` variable driven from `site_settings`.
- Reusable `<PageBackground />` component: fixed, dimmed, gradient overlay.

**Routes:**
- `/` — Home (hero, about, highlights, connect buttons)
- `/activities` — public preview + auth-gated details
- `/gallery` — public grid + lightbox
- `/community` — public marketing → real chat under `_authenticated`
- `/membership` — join form
- `/auth` — login/register/forgot-password (tabbed)
- `/reset-password`
- `/_authenticated/dashboard` — student profile + progress + assigned activities
- `/_authenticated/profile` — editable details
- `/_authenticated/chat` — real-time club chat
- `/_authenticated/notifications`
- `/_authenticated/admin/*` — role-gated: overview, members, activities, applications, gallery, chat-moderation, settings, notifications-log

**Route protection:** integration-managed `_authenticated` layout; admin subtree adds `has_role('admin')` check via server fn.

**Server functions (`*.functions.ts`):**
- `activities.functions.ts` — create/assign/update-status/list-for-user
- `notifications.functions.ts` — mark-read, list
- `membership.functions.ts` — submit, approve/reject (admin)
- `admin.functions.ts` — stats, members management
- `settings.functions.ts` — read/update site settings
- `chat.functions.ts` — post message, delete (admin), 7-day list

## 3. Real-Time
- Notifications: `supabase.channel('notifications:{userId}')` subscribed in root; bell in navbar shows unread count with badge.
- Chat: `supabase.channel('chat')` INSERT/DELETE subscription with auto-scroll.
- Progress: assignments channel invalidates dashboard queries.

## 4. Key UX Details
- Skeleton loaders on all data views.
- Empty states with Fluent-style illustrations.
- Progress ring (SVG) + linear bar on dashboard.
- Leaderboard with Microsoft-color rank badges.
- Lightbox gallery with keyboard nav.
- Toasts for actions.
- Sticky navbar, mobile drawer.
- Footer with WhatsApp / LinkedIn / Email buttons pulled from `site_settings`.

## 5. Logo
Upload provided logo to Lovable Assets and use in navbar + footer + favicon.

## 6. Build Order
1. Enable Cloud, create migrations, seed admin trigger, upload logo asset.
2. Design system + layout shell (navbar, footer, page background).
3. Auth flow (register with member ID, login, forgot password).
4. Home + Membership + Gallery (public).
5. Student dashboard + profile + activities module.
6. Real-time notifications.
7. Real-time community chat.
8. Admin dashboard (all tabs).
9. Site settings editor.
10. Polish: skeletons, empty states, responsive pass, SEO metadata, sitemap.

## Technical Notes
- All colors via semantic tokens in `src/styles.css` — no hardcoded hex in components.
- Zod validation on every form + server fn `inputValidator`.
- RLS on every table; admin operations use `has_role()` check.
- `has_role()` security-definer function to prevent recursion.
- Grants explicit for `authenticated`/`anon`/`service_role` per table.

## Assets I'll Need Later (non-blocking — placeholders used until provided)
- Campus background photos (I'll use gradient + subtle pattern until you upload them via admin Site Settings).
- WhatsApp group link, LinkedIn URL, contact email (editable in admin Site Settings; sensible defaults for now).

Ready to proceed? On approval I'll enable Cloud and start building.
