# FamilyHub — Product Requirements Document
**Version:** 1.1
**Status:** Draft — Decisions Incorporated
**Date:** April 2026
**Target Platform:** Self-hosted Web Application + PWA (Docker, Raspberry Pi)

---

## Changelog from v1.0

| # | Decision | Impact |
|---|---|---|
| 1 | Dedicated wall-mounted touchscreen confirmed | Wall/Touch UI elevated to Phase 1 core requirement |
| 2 | PWA required from Day 1 | Service worker, manifest, installability are Phase 1 deliverables |
| 3 | Microsoft (Outlook/Exchange) calendar added | Three calendar providers: Google, Microsoft, Apple |
| 4 | Calendar sync direction is user-configurable per calendar source | Each synced calendar can be set independently: read-only, write-only, or two-way |
| 5 | No data migration required | Import utilities deferred to backlog; not blocking any phase |
| 6 | Self-hosted Docker deployment is the primary delivery mechanism | Docker Compose is the canonical install method, not bare-metal scripts |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Goals](#2-vision--goals)
3. [User Personas](#3-user-personas)
4. [Technical Architecture](#4-technical-architecture)
5. [Deployment Architecture](#5-deployment-architecture)
6. [UI Surface Requirements](#6-ui-surface-requirements)
7. [Feature Requirements by Module](#7-feature-requirements-by-module)
8. [Suggested Additional Features](#8-suggested-additional-features)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Development Phases](#10-development-phases)
11. [Risk & Mitigation](#11-risk--mitigation)
12. [Open Questions](#12-open-questions)
13. [Appendix A: Tech Stack](#appendix-a-tech-stack-summary)
14. [Appendix B: Docker Compose Topology](#appendix-b-docker-compose-topology)
15. [Appendix C: Core Database Entities](#appendix-c-core-database-entities)

---

## 1. Executive Summary

FamilyHub is a self-hosted, Docker-deployed web application that serves as the organizational hub for a household. It runs on a Raspberry Pi 4 (or any Docker-capable Linux host) and is accessed via three surfaces: a dedicated wall-mounted touchscreen, a Progressive Web App installed on family members' phones and tablets, and a standard desktop browser. It unifies calendaring (Google, Microsoft, Apple), chore and task management, custom reusable lists, routines, meal planning, and photo slideshows under a single role-aware system where every family member sees and interacts with exactly what they need.

---

## 2. Vision & Goals

**Vision:** Replace the scattered combination of whiteboards, sticky notes, competing apps, and verbal reminders with a single household platform that the whole family actively uses — because it's always visible on the wall and always in their pocket.

**Primary Goals:**

- A wall-mounted touchscreen is always on, always useful — the family's physical command center
- Every family member has the app installed on their device for on-the-go access and task completion
- The primary organizer can manage the entire household from any surface
- Calendar integrations reduce double-entry without forcing a calendar migration
- The system runs indefinitely on a Pi with zero cloud dependencies and minimal maintenance

**Design Principles:**

- **Touch-first:** All interactive elements sized and spaced for finger input (minimum 44×44px tap targets)
- **Three-screen aware:** Every view is designed for wall display, phone, and tablet simultaneously
- **Role-appropriate:** Complexity scales with the user's role — a 7-year-old sees big icons and their three chores
- **Privacy-first:** All data lives locally; no telemetry; external services are opt-in per feature
- **Resilient:** A Pi reboot should result in zero data loss and automatic service recovery

---

## 3. User Personas

| Persona | Role | Primary Access Surface | Primary Needs |
|---|---|---|---|
| **The Organizer** | Parent / admin | Phone PWA + desktop browser | Full control, planning, assignment, calendar sync config |
| **The Co-Organizer** | Second parent / co-admin | Phone PWA | Shared management, task assignment, meal planning |
| **The Teen** | Older child (13–17) | Phone PWA | Own schedule, task list, routines, meal suggestions |
| **The Kid** | Child (6–12) | Wall touchscreen + tablet PWA | Chore list, routine runner, reward balance |
| **The Young Child** | Child (3–5) | Wall touchscreen (with parent) | Icon-only view, star rewards, visual routine |
| **The Guest / Caregiver** | Babysitter, grandparent | Phone PWA (limited) | Today's schedule, specific list access, emergency contacts |

---

## 4. Technical Architecture

### Core Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend API** | Python 3.12 + FastAPI | Async, lightweight, ARM64-native, fast development |
| **Frontend** | React 18 + Vite (PWA) | Component ecosystem, PWA/service worker support, Tailwind CSS |
| **Database (Phase 1–3)** | SQLite via SQLAlchemy + Alembic | Zero-config, no extra process, perfectly adequate for household scale |
| **Database (Phase 4+)** | PostgreSQL (optional upgrade path) | For heavy usage, NAS deployment, or multi-household |
| **Background Jobs** | APScheduler (in-process, Python) | No Redis/Celery dependency; adequate for calendar sync and scheduled tasks |
| **Reverse Proxy / HTTPS** | Caddy | Automatic HTTPS, trivial config, low memory, handles local self-signed + Let's Encrypt |
| **Calendar: Google** | Google Calendar API v3 (OAuth2) | Official API, supports full CRUD and push notifications |
| **Calendar: Microsoft** | Microsoft Graph API (OAuth2 / MSAL) | Covers Outlook, Office 365, Hotmail, Exchange Online |
| **Calendar: Apple** | CalDAV protocol (radicale or direct) | Apple does not provide a public REST API; CalDAV is the standard |
| **Photo Processing** | Pillow (Python) | Thumbnail generation, EXIF stripping, ARM-compatible |
| **Push Notifications** | Web Push API (VAPID) | Standard, no third-party service required |
| **Auth** | JWT in httpOnly cookies + bcrypt | No external auth service dependency |
| **Local Discovery** | mDNS / Avahi (`familyhub.local`) | Zero-config LAN access |
| **PWA** | Vite PWA plugin + Workbox | Service worker, app manifest, install prompt |

### Architecture Diagram (Logical)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Raspberry Pi / Docker Host                    │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│  │    Caddy    │───▶│  FastAPI Backend  │───▶│  SQLite / PG   │  │
│  │  (HTTPS /   │    │   (Port 8000)    │    │   (Database)   │  │
│  │   Port 443) │    └────────┬─────────┘    └────────────────┘  │
│  └──────┬──────┘             │                                   │
│         │              ┌─────▼──────┐    ┌────────────────────┐ │
│         │              │  APScheduler│    │  /data/photos      │ │
│         │              │  (Sync jobs)│    │  (local volume)    │ │
│  ┌──────▼──────┐        └────────────┘    └────────────────────┘ │
│  │ React PWA   │                                                  │
│  │ (Port 3000) │                                                  │
│  └─────────────┘                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  Local Network (mDNS / familyhub.local)
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
   │  Wall Touch  │  │  iPhone PWA  │  │  iPad PWA   │
   │  (Chromium  │  │  (installed) │  │  (installed)│
   │   kiosk)    │  └─────────────┘  └─────────────┘
   └─────────────┘
          │ (optional remote access)
   ┌──────▼──────────────────────────────────────────┐
   │  Cloudflare Tunnel / Tailscale (user-configured) │
   └──────────────────────────────────────────────────┘

          │ (external OAuth2 / CalDAV — outbound only)
   ┌──────▼──────┐  ┌──────────────┐  ┌─────────────┐
   │   Google     │  │  Microsoft   │  │    Apple    │
   │  Calendar    │  │  Graph API   │  │   CalDAV    │
   └─────────────┘  └──────────────┘  └─────────────┘
```

---

## 5. Deployment Architecture

### Docker Compose Services

The canonical deployment is a single `docker-compose.yml` file with these services:

| Service | Image | Purpose |
|---|---|---|
| `familyhub-api` | Custom Python/FastAPI | Backend REST API + background jobs |
| `familyhub-web` | Custom React/Nginx | Frontend static assets served via Nginx |
| `caddy` | `caddy:alpine` | Reverse proxy, HTTPS termination, routes `/api` to backend and `/` to frontend |
| `db` (Phase 4+) | `postgres:16-alpine` | Optional PostgreSQL upgrade; SQLite runs inside `familyhub-api` |

**Volumes:**
- `./data/db/` → SQLite database file (bind mount, survives container updates)
- `./data/photos/` → Photo storage (bind mount, configurable to NAS/USB)
- `./data/backups/` → Automated backup snapshots
- `./config/` → `.env` + Caddy config (bind mount)

### Installation Flow

1. `git clone https://github.com/[org]/familyhub && cd familyhub`
2. `cp .env.example .env` and edit household name, timezone, first admin account
3. `docker compose up -d`
4. Navigate to `http://familyhub.local` — setup wizard completes configuration
5. Add calendar OAuth credentials via the admin Settings UI (no .env editing required post-install)

### Updates

```bash
git pull
docker compose pull
docker compose up -d --build
```
Alembic migrations run automatically on container start. Database is preserved via bind mount.

### Wall Screen Setup

The wall touchscreen runs Raspberry Pi OS in desktop mode with Chromium launched in kiosk mode:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --touch-events=enabled http://familyhub.local/wall
```

This is documented and optionally scripted as part of the install documentation. The `/wall` route loads the Family Board / Morning Briefing view in full-screen touch-optimized mode.

---

## 6. UI Surface Requirements

FamilyHub has three explicitly designed UI surfaces. Every feature must be designed with all three in mind.

### 6.1 Wall Display (Touch)

**Context:** Always-on, mounted in a common area (kitchen, hallway). Primary interaction is quick touch — checking off a chore, swiping through the slideshow, tapping an event for details. No keyboard.

**Requirements:**

- **REQ-WALL-001** — The `/wall` route shall present a dedicated full-screen layout optimized for 1080p or 1280×800 landscape display.
- **REQ-WALL-002** — All tap targets shall be a minimum of 56×56px with adequate spacing.
- **REQ-WALL-003** — The wall layout shall be configurable by admin into display panels: clock/date, today's calendar, chore status per person, meal plan, photo slideshow, weather, announcements.
- **REQ-WALL-004** — Panels shall be arrangeable in a grid layout by the admin.
- **REQ-WALL-005** — The wall screen shall support an idle mode: after a configurable duration of no interaction, it enters photo slideshow / screensaver mode and returns to the dashboard on any touch.
- **REQ-WALL-006** — Quick-action buttons shall be present for: "Mark my chore done", "What's for dinner", "Show my tasks" — these shall open a family member selection (large avatar buttons) before taking action.
- **REQ-WALL-007** — The wall screen shall not require login for viewing; completing tasks shall require selecting a family member (and optionally entering their PIN).
- **REQ-WALL-008** — Font sizes on the wall display shall be independently configurable from other surfaces (base size 18–24px body text, up to 48px for key display values like clock and date).
- **REQ-WALL-009** — The wall display shall support both light and dark themes independently from the user theme preference (e.g., dark theme for evening ambiance).

### 6.2 Mobile PWA (Phone)

**Context:** Primary interaction surface for completing tasks on-the-go, checking the schedule, and grocery shopping. Installed on iOS and Android home screens.

**Requirements:**

- **REQ-PWA-001** — The application shall ship with a complete Web App Manifest: name, icons (all required sizes), theme color, background color, display mode `standalone`.
- **REQ-PWA-002** — A Workbox-powered service worker shall cache the app shell, static assets, and the user's last-known data for offline read access.
- **REQ-PWA-003** — The app shall display an appropriate "you're offline" indicator and disable write operations gracefully when the Pi is unreachable, without crashing.
- **REQ-PWA-004** — The mobile layout shall use bottom navigation (max 5 tabs): Home, Calendar, Tasks, Lists, More.
- **REQ-PWA-005** — Task completion, list item checking, and chore marking shall be operable with one thumb in portrait mode.
- **REQ-PWA-006** — The app shall prompt installability on first visit via the browser's native install prompt.
- **REQ-PWA-007** — Push notifications shall be requestable at install time and deliverable when the app is in the background.
- **REQ-PWA-008** — The iOS Safari installation flow (Add to Home Screen) shall be documented and prompted with an in-app guide on first visit from Safari.

### 6.3 Tablet / Desktop Browser

**Context:** Admin configuration, meal planning, routine building, detailed calendar management. More screen real estate allows multi-panel layouts.

**Requirements:**

- **REQ-TAB-001** — Breakpoints: mobile (< 640px), tablet (640–1024px), desktop (> 1024px). Layouts adjust meaningfully at each.
- **REQ-TAB-002** — Tablet layout shall show a persistent side navigation drawer.
- **REQ-TAB-003** — Desktop layout shall support multi-column views (e.g., calendar + task panel side-by-side).
- **REQ-TAB-004** — Admin configuration screens (calendar sync, user management, wall layout editor) are primarily designed for tablet/desktop and may be simplified on mobile.

---

## 7. Feature Requirements by Module

---

### Module 1: Authentication & Family Profiles

**REQ-AUTH-001** — The system shall support multiple named family member accounts under a single household instance.

**REQ-AUTH-002** — Account roles: `admin`, `co-admin`, `teen`, `child`, `guest`. Permissions are role-based.

**REQ-AUTH-003** — Admin and co-admin: full CRUD and assignment permissions across all modules.

**REQ-AUTH-004** — Teen: read/complete own tasks; create items in shared lists; suggest meals; view full family calendar.

**REQ-AUTH-005** — Child: read/complete own assigned tasks and routines; view own calendar events.

**REQ-AUTH-006** — Guest: admin-configurable read-only access to specific lists, calendars, or the wall view only.

**REQ-AUTH-007** — Each profile shall support: display name, avatar (uploaded photo or emoji/icon picker), color accent, age-appropriate UI mode, and notification preferences.

**REQ-AUTH-008** — Login methods: 4–8 digit PIN (all roles), password (admin/co-admin/teen), passkey/WebAuthn (all roles on supporting devices).

**REQ-AUTH-009** — The wall screen shall support one-tap family member selection for completing tasks without a full login session. Optional PIN confirmation per family member is configurable by admin.

**REQ-AUTH-010** — A first-run setup wizard shall guide creation of the first admin account, household name, and timezone on initial deployment.

---

### Module 2: Calendar & Scheduling

#### 2.1 Internal Calendar

**REQ-CAL-001** — The system shall provide a native internal calendar for creating and managing household events.

**REQ-CAL-002** — Events shall support: title, date/time (all-day supported), location, description, color label, recurrence (RRULE), assignees (family members), and calendar category.

**REQ-CAL-003** — Calendar views: Day, Week, Month, and Agenda list. View preference persisted per user per surface.

**REQ-CAL-004** — Events shall be filterable by family member and by calendar category.

**REQ-CAL-005** — A Family Countdown widget shall display days remaining to upcoming flagged events (birthdays, vacations, holidays).

#### 2.2 Google Calendar Integration

**REQ-CAL-006** — The system shall integrate with Google Calendar via OAuth2 and the Google Calendar API v3.

**REQ-CAL-007** — Multiple Google accounts may be connected (e.g., one per adult family member).

**REQ-CAL-008** — Each connected Google Calendar shall have an independently configurable sync direction: `read-only` (import events to FamilyHub), `write-only` (push FamilyHub events to Google), or `two-way` (bidirectional sync).

**REQ-CAL-009** — Sync shall run on a configurable interval (default: every 15 minutes) via the background job scheduler.

**REQ-CAL-010** — Google OAuth tokens shall be stored securely (encrypted at rest in the database) and refreshed automatically.

#### 2.3 Microsoft Calendar Integration (Outlook / Office 365 / Exchange Online)

**REQ-CAL-011** — The system shall integrate with Microsoft Calendar via OAuth2 and the Microsoft Graph API (`/me/calendars`, `/me/events`).

**REQ-CAL-012** — Supports: personal Outlook.com accounts, Microsoft 365 accounts, and Exchange Online organizational accounts.

**REQ-CAL-013** — Multiple Microsoft accounts may be connected.

**REQ-CAL-014** — Each connected Microsoft Calendar shall have an independently configurable sync direction: `read-only`, `write-only`, or `two-way` (same model as Google).

**REQ-CAL-015** — Microsoft OAuth2 tokens (MSAL) shall be stored securely and refreshed automatically.

#### 2.4 Apple Calendar Integration

**REQ-CAL-016** — The system shall integrate with Apple Calendar via CalDAV protocol.

**REQ-CAL-017** — Connection shall require the user's Apple ID email and an app-specific password (Apple does not support OAuth2 for CalDAV; this limitation shall be clearly documented in the UI).

**REQ-CAL-018** — The system shall discover the user's CalDAV endpoint automatically via Apple's standard well-known URL (`https://caldav.icloud.com`).

**REQ-CAL-019** — Each connected Apple calendar shall have an independently configurable sync direction: `read-only`, `write-only`, or `two-way`.

**REQ-CAL-020** — Apple app-specific passwords shall be stored encrypted at rest.

#### 2.5 Sync Conflict Handling

**REQ-CAL-021** — When a two-way sync detects a conflict (same event modified in both systems since last sync), the system shall flag it as a conflict rather than silently overwriting.

**REQ-CAL-022** — Conflicts shall appear in an admin notification panel with options: keep FamilyHub version, keep external version, or keep both.

**REQ-CAL-023** — A sync log shall be accessible by admins showing last sync time, events synced, and any errors or conflicts per calendar source.

#### 2.6 External iCal Feeds (Read-Only)

**REQ-CAL-024** — The system shall support subscription to read-only iCal (.ics) URL feeds (school calendars, sports leagues, public holidays, etc.).

**REQ-CAL-025** — iCal feeds shall refresh on a configurable interval (default: every 6 hours).

---

### Module 3: Dashboard & Personalized Views

**REQ-DASH-001** — Each family member shall have a personalized home dashboard assembled from configurable widgets.

**REQ-DASH-002** — Available widgets: Today's Events, My Tasks Due Today, Active Routine Progress, Meal Plan Today, Family Announcements, Photo of the Day, Weather, Points Balance, Upcoming Birthdays/Countdowns.

**REQ-DASH-003** — Admin dashboard shall additionally show: household-wide task completion status, pending task verifications, sync status indicators, and storage usage.

**REQ-DASH-004** — Each user shall be able to toggle and reorder their own dashboard widgets.

**REQ-DASH-005** — The Family Board wall view shall have its own independent widget layout configured by admin.

**REQ-DASH-006** — A "Today at a Glance" morning card shall summarize: date, weather, meal plan, top tasks per person, and any flagged events.

**REQ-DASH-007** — Child dashboards shall support a simplified "big icon" mode with illustrated task cards and a star/reward display.

---

### Module 4: Chores & Task Management

**REQ-TASK-001** — Tasks shall support: title, description, assignee(s), due date, priority (low/medium/high/urgent), recurrence, estimated duration (minutes), point value, room/area tag, and photo attachment.

**REQ-TASK-002** — Task states: `pending` → `in-progress` → `completed` → `verified` (or `rejected` by admin) → `archived`. Plus `overdue` and `skipped`.

**REQ-TASK-003** — Recurrence options: daily, specific weekdays, weekly, bi-weekly, monthly, first/last weekday of month, custom interval.

**REQ-TASK-004** — Any permitted family member may mark a task complete, optionally attach a completion photo, and add a note.

**REQ-TASK-005** — Admin and co-admin may verify or reject completed tasks (useful for quality-check chores). Rejection returns the task to `pending` with a required reason note.

**REQ-TASK-006** — Tasks shall support sub-tasks (inline checklist items). Parent task auto-completes when all sub-tasks are complete (configurable).

**REQ-TASK-007** — Tasks shall be organizable by: assignee, area/room, category tag, due date, and priority.

**REQ-TASK-008** — Views: My Tasks (personal), Household Board (Kanban by status), By Person, By Area.

**REQ-TASK-009** — Bulk operations: bulk assign, bulk reschedule, bulk complete (admin only).

**REQ-TASK-010** — Task history shall be maintained per task and per person (completion date, completor, notes, photos).

**REQ-TASK-011** — Point/reward system: each task carries an optional point value; points accumulate per family member; admin defines reward tiers and tracks redemptions.

**REQ-TASK-012** — Overdue tasks shall surface as a priority alert on the assignee's dashboard and the admin's household overview.

---

### Module 5: Custom Lists

**REQ-LIST-001** — The system shall support creation of reusable named List Templates with a defined set of items.

**REQ-LIST-002** — A List Instance is an active copy of a template, created for a specific purpose/trip/event. Modifying an instance does not affect the template.

**REQ-LIST-003** — Built-in template categories (admin can add more): Packing Lists, Pre-Sleepover Checklist, Cleaning Tasks, Grocery / Shopping, School Supplies, Birthday Party, Road Trip, Emergency Preparedness, Pet Care, Medication Tracking.

**REQ-LIST-004** — Each list item shall support: title, notes, assignee, due/complete status, priority flag, and quantity (for shopping lists).

**REQ-LIST-005** — Lists shall be shareable with specific family members or the whole household.

**REQ-LIST-006** — Active list instances display real-time progress (e.g., "9/14 items packed").

**REQ-LIST-007** — Completed instances are archivable with a timestamp. Archived instances are browseable.

**REQ-LIST-008** — Items shall be reorderable via drag-and-drop (touch-optimized: long-press to initiate drag on mobile/touch).

**REQ-LIST-009** — Admins may lock a template to prevent modification by non-admin users.

**REQ-LIST-010** — Shopping Mode: groups items by aisle/category (Produce, Dairy, Frozen, etc.); category is settable per item; checked items move to a "Done" section without being deleted.

**REQ-LIST-011** — Lists shall be accessible on the wall touchscreen: swipe to complete items, large checkboxes.

---

### Module 6: Routines

**REQ-ROUT-001** — A Routine is an ordered sequence of steps (each step may reference a task, a list item, or be a standalone instruction) with optional per-step timing guidance.

**REQ-ROUT-002** — Routines shall be assignable to one or more family members and scheduled to appear on specific days/times.

**REQ-ROUT-003** — Built-in routine templates: Morning Routine, After-School Routine, Bedtime Routine, Weekend Cleaning Routine, Weekly Reset, Homework Block.

**REQ-ROUT-004** — Routine steps support: title, description, estimated duration, optional linked task or list item, and optional illustration/icon.

**REQ-ROUT-005** — Routine Runner Mode: a guided full-screen step-by-step view with a countdown timer per step, large touch targets, visual progress bar, and celebratory completion animation. Designed to work on wall screen or tablet.

**REQ-ROUT-006** — Routine completion is tracked: streak counter (consecutive days completed), weekly completion rate, and historical log.

**REQ-ROUT-007** — Admin may clone a routine to create a variant (e.g., "School Night Bedtime" vs "Weekend Bedtime").

**REQ-ROUT-008** — Admin may convert any existing set of recurring tasks into a Routine via a builder workflow ("group these tasks into a routine").

**REQ-ROUT-009** — Incomplete routines shall show a progress indicator on the assigned member's dashboard and the wall Family Board.

---

### Module 7: Meal Planning

**REQ-MEAL-001** — A weekly meal planner shall provide slots for Breakfast, Lunch, Dinner, and Snack for each day of the week.

**REQ-MEAL-002** — Meals shall be drawn from a personal recipe library, external recipe URL (with manual entry), or free-text.

**REQ-MEAL-003** — Recipe library entries: name, description, ingredients (quantity + unit + ingredient name), instructions (step-by-step), prep time, cook time, servings, dietary tags (vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.), and an optional photo.

**REQ-MEAL-004** — Family members (teen role and above) may suggest meals for specific slots; admin approves or replaces.

**REQ-MEAL-005** — The system shall auto-generate a Shopping List from the active week's meal plan, consolidating duplicate ingredients and summing quantities.

**REQ-MEAL-006** — A basic pantry tracker shall allow marking ingredients as on-hand to reduce the auto-generated shopping list.

**REQ-MEAL-007** — Meal plan templates (e.g., "Default Week", "Summer", "Holiday") may be saved and reapplied as a starting point.

**REQ-MEAL-008** — Meal prep tasks (e.g., "Thaw chicken by 5pm") can be created from a recipe and auto-added to the task manager with the appropriate date.

**REQ-MEAL-009** — A "recently served" tracker prevents the same meal from appearing in suggestions within a configurable window (default: 2 weeks).

**REQ-MEAL-010** — The meal plan for the day shall appear as a widget on the wall display and personal dashboards.

**REQ-MEAL-011** — Recipes shall be printable in a clean, ink-friendly format.

---

### Module 8: Photo Albums & Slideshow

**REQ-PHOTO-001** — Photos shall be uploadable via the web UI (drag-and-drop on desktop, file picker on mobile/touch).

**REQ-PHOTO-002** — Photos shall be organizable into named Albums.

**REQ-PHOTO-003** — A photo may belong to multiple albums.

**REQ-PHOTO-004** — Each photo supports: caption, date taken (auto-read from EXIF when available), tagged family members, and album membership.

**REQ-PHOTO-005** — Slideshow settings per album: transition style (fade, slide, zoom-out), duration per photo (5–60s), order (sequential, random, by date), and whether to show captions.

**REQ-PHOTO-006** — Admin shall designate one or more albums as "wall slideshow" sources. These cycle on the wall display.

**REQ-PHOTO-007** — The wall screen idle mode shall display the slideshow full-screen and return to the dashboard on any touch.

**REQ-PHOTO-008** — Thumbnails shall be generated on import (background job) to ensure fast display on Pi hardware.

**REQ-PHOTO-009** — Bulk import shall be supported from a configured local directory path (useful for Synology Photos sync folders, USB drive drops).

**REQ-PHOTO-010** — The admin settings shall show total photo storage usage and provide a deletion/archive workflow.

**REQ-PHOTO-011** — Photos shall be browseable by album, by tagged family member, and by date range.

---

### Module 9: Family Board (Wall Display)

**REQ-BOARD-001** — The `/wall` route shall render a full-screen Family Board designed for the dedicated touch display.

**REQ-BOARD-002** — The Family Board layout shall be configurable by admin via a drag-and-drop panel editor (available on tablet/desktop admin settings).

**REQ-BOARD-003** — Available panels for the Family Board: Digital Clock + Date, Today's Calendar Events (all family), Today's Chores (grouped by person with completion status), Meal Plan Today, Photo Slideshow, Weather, Family Announcements, Upcoming Events/Countdowns, Routine Progress per person.

**REQ-BOARD-004** — The Family Board shall support a two-column and three-column layout mode.

**REQ-BOARD-005** — Touching a chore card on the Family Board shall open a quick-action overlay: select family member (avatar buttons) → optionally enter PIN → mark complete.

**REQ-BOARD-006** — The Family Board shall support dark mode (configurable independently of individual user themes), suitable for evening display.

**REQ-BOARD-007** — The board shall auto-refresh data every 60 seconds without a visible page reload (background polling or WebSocket).

**REQ-BOARD-008** — A "Family Member Focus" mode: tapping a family member's avatar on the board expands to show only their tasks, events, and routine for the day — full screen. Tap anywhere to return.

---

### Module 10: Notifications & Alerts

**REQ-NOTIF-001** — In-app notifications shall surface on the dashboard for: overdue tasks, upcoming events (configurable lead time), task verification requests, calendar sync errors, and storage warnings.

**REQ-NOTIF-002** — Web push notifications shall be deliverable to PWA-installed instances for: task reminders, routine start times, and meal prep reminders.

**REQ-NOTIF-003** — Push notification opt-in shall be per family member and per notification category.

**REQ-NOTIF-004** — Optional SMTP email notifications shall be configurable for admin-level alerts (sync failures, daily summary).

**REQ-NOTIF-005** — The wall screen shall display a persistent notification badge when there are unverified completed tasks awaiting admin review.

---

## 8. Suggested Additional Features

The following are not in the initial phase plan but are strong candidates for later phases or community contribution.

| Feature | Value | Suggested Phase |
|---|---|---|
| **Morning Briefing Auto-Cycle Mode** | Wall screen cycles panels automatically, no interaction needed, ideal for busy mornings | Phase 3 |
| **Family Announcements / Message Board** | Post household notes, reminders, and kudos; replaces fridge sticky notes | Phase 2 |
| **Homework & School Tracker** | Subjects, assignments, due dates; integrates with calendar and dashboard | Phase 3 |
| **Allowance & Chore Economy** | Monetary allowance tied to task completion; balance, payment log, savings goal per child | Phase 3 |
| **Family Goals & Habit Tracker** | Household or individual goals with progress bars and streaks | Phase 4 |
| **Weather Widget** | Open-Meteo (no API key); daily forecast on wall and dashboard | Phase 2 |
| **Family Wiki / Reference Page** | Emergency contacts, doctors, insurance, school schedules, WiFi passwords, pet info | Phase 3 |
| **Vehicle Maintenance Tracker** | Service history, upcoming maintenance, registration renewal alerts | Phase 4 |
| **Pet Care Tracker** | Feeding schedules, vet appointments, medications; integrates with chore assignments | Phase 3 |
| **Collaborative Notes Scratchpad** | Quick shared notes before converting to formal lists | Phase 3 |
| **Recipe Import from URL** | Paste a recipe URL and auto-parse ingredients/steps via scraper library | Phase 3 |
| **Home Assistant Integration** | Display sensor data on wall, trigger automations from routine completion | Phase 5 |
| **Guest / Caregiver Access Link** | Temporary time-limited access link for babysitters; shows schedule + emergency contacts | Phase 4 |
| **Family Budget Snapshot** | Read-only monthly spend vs budget display; manual entry or CSV import | Phase 5 |
| **Alexa / Google Home Webhook** | Voice query: "What are my chores today?" / "What's for dinner?" | Phase 5 |

---

## 9. Non-Functional Requirements

### Performance
- Dashboard initial load (PWA, cached): < 1 second
- Dashboard initial load (cold, local network): < 3 seconds on Pi 4
- API response time for task/calendar operations: < 500ms (p95)
- Photo thumbnail generation shall be a background job that does not block the UI
- Family Board shall update without full page reload (WebSocket or polling ≤ 60s)

### Reliability
- The application shall auto-restart after Pi reboot via Docker restart policy (`restart: unless-stopped`)
- Database (SQLite) shall be snapshotted daily to `./data/backups/` with configurable retention (default: 30 days)
- Calendar sync failures shall log to the sync log and surface an admin notification; they shall not crash the application
- Service worker shall cache the app shell and last-known data for resilient offline read access

### Security
- All traffic served over HTTPS (Caddy handles cert provisioning)
- Passwords hashed with bcrypt (cost ≥ 12)
- PINs hashed with bcrypt; rate-limited to 5 attempts before 60-second lockout
- Session tokens: JWT in httpOnly, SameSite=Strict cookies; 30-day expiry on trusted devices, 1-day on guest
- All OAuth tokens (Google, Microsoft, Apple) encrypted at rest using AES-256 with a key derived from the instance's `SECRET_KEY`
- Guest accounts have no access to admin settings, family wiki, calendar config, or financial modules
- All external API calls are outbound-only; no inbound webhooks exposed by default (Google Calendar push notifications are optional and require port forwarding documentation)
- CORS restricted to the application's own origin

### Accessibility
- All interactive elements keyboard navigable
- WCAG 2.1 AA color contrast compliance
- Font sizes adjustable per user profile (small / medium / large / extra-large)
- Reduced motion preference respected (no animations if prefers-reduced-motion)
- Child mode: large touch targets (minimum 64×64px), high contrast, minimal text

### Raspberry Pi Constraints
- Tested on Raspberry Pi 4 (2GB RAM minimum), ARM64
- Docker images built multi-arch: `linux/arm64` and `linux/amd64`
- Application container memory budget: API ≤ 150MB, Web ≤ 80MB, Caddy ≤ 30MB idle
- Photo storage uses configurable external mount; SD card storage (excluding photos) < 2GB
- CPU-intensive operations (thumbnail gen, meal plan shopping list build) run as low-priority background jobs

---

## 10. Development Phases

---

### Phase 1 — Foundation + Wall Screen + PWA (Weeks 1–8)
*Ship a working, installable app that the family can start using on Day 1.*

**Scope:**

- Docker Compose project scaffold: `familyhub-api` (FastAPI), `familyhub-web` (React/Vite), `caddy`
- ARM64 multi-arch Docker build (GitHub Actions CI)
- SQLite database + Alembic migration framework
- First-run setup wizard (household name, timezone, first admin account)
- Authentication: family profiles, role system, PIN + password login, JWT sessions
- **PWA:** Web App Manifest, Workbox service worker (app shell + data cache), install prompt, offline indicator
- Internal calendar: create/edit/delete/recur events, Day/Week/Month/Agenda views
- **Google Calendar:** OAuth2 connect, configurable sync direction (read-only / two-way), 15-min background sync
- Task Manager v1: create, assign, due date, recurrence, mark complete, sub-tasks
- Basic per-user dashboard with Today's Events and Today's Tasks widgets
- **Wall Display layout** (`/wall` route): clock/date, today's events, today's chores per person, one-tap task completion with PIN confirm
- Photo Albums v1: upload, create albums, wall slideshow with idle mode transition
- Responsive design system: mobile, tablet, desktop breakpoints; touch-optimized tap targets throughout
- mDNS setup (`familyhub.local`), documented wall screen kiosk boot instructions
- `README.md` + `docker-compose.yml` with all documented environment variables

**Phase 1 Exit Criteria:**
- Family can log in on phones via PWA and mark chores complete
- Wall screen shows today's events and chores; idle slideshow activates after 5 minutes
- Google Calendar events appear in FamilyHub within 15 minutes of creation
- `docker compose up -d` on a fresh Pi results in a working application

---

### Phase 2 — Full Calendars + Lists + Family Board (Weeks 8–18)
*Complete the calendar ecosystem; make lists and the wall board primary household tools.*

**Scope:**

- **Microsoft Calendar:** Graph API OAuth2, configurable sync direction, multi-account
- **Apple Calendar:** CalDAV connection, configurable sync direction, app-specific password guidance
- Calendar conflict detection and admin resolution UI
- Sync log viewer in admin settings
- iCal feed subscriptions (read-only, school calendars, etc.)
- **Custom Lists module:** templates, instances, item assignment, progress tracking, archive
- Shopping Mode for grocery lists (aisle grouping, check-off flow)
- Chore board: Kanban view (To Do / In Progress / Done / Verified), photo evidence on completion, admin verify/reject
- Point/reward system v1: point values per task, accumulation per member, admin-defined reward tiers
- **Family Board (wall) enhancements:** full panel editor (admin drag-and-drop), dark mode, per-person focus mode, 60-second auto-refresh via WebSocket
- Child dashboard: big-icon simplified mode, star reward display
- Dashboard widget customization: toggle, reorder
- Weather widget (Open-Meteo, no API key required)
- Family Announcements / Message Board (post, pin, react)
- Push notification infrastructure (VAPID setup, opt-in per user)
- Task + routine notifications (overdue alerts, reminder push)
- Automated daily SQLite backup to `./data/backups/`

**Phase 2 Exit Criteria:**
- All three calendar providers (Google, Microsoft, Apple) sync correctly with configurable direction
- A packing list template can be instantiated for a trip, shared with the family, and items checked off from the wall and from phones
- Family Board wall layout is customizable by admin and displays live household status

---

### Phase 3 — Routines + Meal Planning + Enrichment (Weeks 18–30)
*Proactive household management: structured routines, meal planning, and quality-of-life features.*

**Scope:**

- **Routines module:** builder, step editor, scheduling, Routine Runner (full-screen guided mode), streak tracking
- Built-in routine templates: Morning, After-School, Bedtime, Weekend Cleaning, Homework Block
- Routine progress indicators on dashboard and wall board
- **Meal Planner:** weekly grid, recipe library with dietary tags, meal suggestion with vote
- Meal plan → shopping list auto-generation (integrated with Lists module)
- Basic pantry/inventory tracker
- Meal history and repeat-avoidance suggestions
- Recipe print view
- **Morning Briefing auto-cycle mode:** wall screen cycles through panels automatically on a timer, no interaction needed
- Homework & school tracker (child/teen view, integrates with calendar)
- Allowance tracker (monetary extension of reward system)
- Pet care tracker (feeding schedule, vet appointments — integrates with task assignment)
- Family Wiki / Reference Page (contacts, insurance, school schedule, WiFi — permission-controlled)
- Collaborative notes scratchpad (shared household notepad)
- Recipe import from URL (scraper library)
- Guest / Caregiver temporary access link

**Phase 3 Exit Criteria:**
- A bedtime routine is assigned to a child and runs step-by-step on the wall touchscreen in Routine Runner
- Weekly meal plan generates a consolidated shopping list that auto-populates a List instance
- Morning Briefing mode cycles the wall screen without any interaction required

---

### Phase 4 — Intelligence + Advanced Admin + Polish (Weeks 30–44)
*Reduce admin toil with smarter features; complete the admin experience.*

**Scope:**

- Family Goals & Habit Tracker (household and individual, with streaks and progress bars)
- Vehicle maintenance tracker (service log, upcoming maintenance alerts)
- Advanced reporting: chore completion by person over 30/60/90 days, task trends, streak leaderboard
- Full admin settings UI: all configuration accessible without editing `.env` (calendar OAuth setup, storage paths, backup schedule, sync intervals, notification settings)
- PostgreSQL migration path: documented migration script + updated `docker-compose.yml` variant
- Enhanced PWA offline: write-queue for task completions made offline, sync when connection restores
- Bulk operations across all modules (bulk assign, bulk reschedule, bulk archive)
- Localization: i18n string extraction (English base), community translation framework
- Accessibility audit and remediation (keyboard navigation, ARIA, contrast check)
- Performance profiling on Pi 4; optimize thumbnail generation pipeline
- Full API documentation (OpenAPI / Swagger UI via FastAPI)

**Phase 4 Exit Criteria:**
- All application settings are configurable from the UI — no direct file editing required post-install
- Admin can view a 60-day chore completion report per family member
- Task completions made while the Pi is unreachable sync when connectivity restores

---

### Phase 5 — Ecosystem & Extensibility (Weeks 44–56)
*Connect FamilyHub to the broader home and make it extensible.*

**Scope:**

- Home Assistant integration (display sensor values on wall, trigger HA automations from routine steps)
- Alexa / Google Home webhook (read-only voice queries for tasks, calendar, dinner)
- Family budget snapshot (manual entry or CSV import, monthly spend vs. budget)
- Multi-household support (co-parenting, extended family — separate data, shared calendar view option)
- Mobile app wrappers (Capacitor) for native iOS and Android distribution
- Community-contributed list templates (JSON import/export, shareable template library)
- Setup wizard UI improvements (guided OAuth2 flow, wall screen pairing assistant)
- Automated update mechanism with changelog display
- Backup restore UI (restore from snapshot via admin panel, not just CLI)

---

## 11. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google / Microsoft API changes break calendar sync | Medium | High | Abstract each provider behind a `CalendarProvider` interface; monitor deprecation notices; version-pin API calls |
| Apple CalDAV reliability / rate limiting | Medium | Medium | Implement exponential backoff; cache last successful sync; clearly communicate Apple's limitations in UI |
| SD card corruption causes data loss | Medium | High | Daily automated backup to external path; documented restore procedure; recommend USB SSD boot for production use |
| Scope creep delays Phase 1 PWA + wall delivery | High | High | Hard phase gates; wall display and PWA are Phase 1 non-negotiables; everything else deferred |
| Pi 4 (2GB) insufficient under full feature load | Low | Medium | Memory budgets per container; async background jobs; profile before each phase release |
| WebSocket connection drops cause stale wall display | Low | Medium | Fallback to 60-second polling if WebSocket fails; visual staleness indicator |
| OAuth token revocation breaks calendar sync silently | Medium | Medium | Token validation on each sync cycle; surface auth errors to admin immediately |
| Touch UX feels clunky on wall screen | Medium | High | Prototype wall layout on actual hardware in Phase 1 sprint 1; conduct usability test with family before Phase 1 exit |

---

## 12. Open Questions

1. **Wall screen hardware:** What is the specific display model and resolution? This affects the wall layout grid dimensions and font scaling defaults.
2. **Remote access:** Is access from outside the home network a requirement? If yes, Tailscale (recommended) or Cloudflare Tunnel should be documented in Phase 1.
3. **Multiple homes / co-parenting:** Single household only, or does the system need to handle shared custody / two-home schedules?
4. **Photo source:** Is automatic ingestion from a phone camera roll (e.g., via Syncthing to a watched folder) in scope, or is manual upload sufficient for Phase 1?
5. **Microsoft account type:** Personal Outlook.com, Microsoft 365 Family, or organizational (work/school) Exchange? OAuth2 app registration differs for each. If organizational, tenant configuration is needed.
6. **Notification delivery while away from home:** Push notifications to PWA require the Pi to be reachable from the internet (or via a tunnel). Is this a Phase 1 requirement or can it wait?

---

## Appendix A: Tech Stack Summary

| Layer | Choice | Notes |
|---|---|---|
| Container orchestration | Docker Compose v2 | Single `compose.yml`; no Kubernetes needed at this scale |
| Backend | Python 3.12 + FastAPI | `uvicorn` ASGI server; async endpoints; auto-generates OpenAPI docs |
| ORM / migrations | SQLAlchemy 2.0 + Alembic | Async SQLAlchemy for SQLite; migration scripts auto-run on startup |
| Frontend | React 18 + Vite + TypeScript | PWA via `vite-plugin-pwa` + Workbox |
| Styling | Tailwind CSS + shadcn/ui | Design system with accessible components; custom family theme tokens |
| State management | TanStack Query (React Query) | Server state, cache, background refetch — ideal for this data model |
| Reverse proxy | Caddy 2 | One-line HTTPS; handles Let's Encrypt + self-signed; very low memory |
| Calendar: Google | `google-auth` + `googleapiclient` Python libs | Official Google client library |
| Calendar: Microsoft | `msal` Python library + `httpx` | MSAL handles token refresh; Graph API via direct HTTP |
| Calendar: Apple | `caldav` Python library | Open-source CalDAV client; battle-tested with iCloud |
| Background jobs | APScheduler 3.x (in-process) | No Redis/Celery; adequate for sync intervals and scheduled tasks at this scale |
| Push notifications | `pywebpush` Python library | VAPID-based Web Push; no third-party service |
| Photo processing | Pillow + `python-magic` | Thumbnails, EXIF extraction, format validation |
| Real-time updates | WebSocket (FastAPI native) with polling fallback | Wall board live updates |
| Auth | PyJWT + `passlib[bcrypt]` | httpOnly cookies, no external auth service |

---

## Appendix B: Docker Compose Topology

```yaml
# docker-compose.yml (representative structure)
services:

  api:
    build: ./backend
    image: familyhub-api:latest
    restart: unless-stopped
    environment:
      - DATABASE_URL=sqlite+aiosqlite:////data/db/familyhub.db
      - SECRET_KEY=${SECRET_KEY}
      - VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
    volumes:
      - ./data/db:/data/db
      - ./data/photos:/data/photos
      - ./data/backups:/data/backups
    expose:
      - "8000"

  web:
    build: ./frontend
    image: familyhub-web:latest
    restart: unless-stopped
    expose:
      - "3000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

**Caddyfile (local network, self-signed):**
```
familyhub.local {
  tls internal
  handle /api/* {
    reverse_proxy api:8000
  }
  handle {
    reverse_proxy web:3000
  }
}
```

---

## Appendix C: Core Database Entities (Phase 1–2)

```
families          id, name, timezone, settings_json
users             id, family_id, display_name, role, avatar, color, ui_mode,
                  pin_hash, password_hash, created_at
sessions          id, user_id, token_hash, device_hint, expires_at, created_at
calendar_sources  id, family_id, provider (google|microsoft|apple|ical),
                  display_name, color, sync_direction (read|write|bidirectional),
                  credentials_encrypted, last_synced_at, enabled
calendar_events   id, source_id, external_id, title, start_dt, end_dt, all_day,
                  location, description, recurrence_rule, color_label, created_by,
                  assignee_ids[], category_tag
tasks             id, family_id, title, description, assignee_id, due_date,
                  recurrence_rule, status, priority, area_tag, points,
                  parent_task_id, estimated_minutes, created_by
task_completions  id, task_id, completed_by, completed_at, notes, photo_path,
                  verified_by, verified_at, verification_status
list_templates    id, family_id, name, category, locked, created_by, created_at
list_items_tmpl   id, template_id, title, notes, assignee_default, order_index
list_instances    id, template_id, name, context_note, created_by, created_at,
                  archived_at
list_items_inst   id, instance_id, title, notes, assignee_id, quantity, unit,
                  aisle_category, completed, completed_by, order_index
photos            id, family_id, file_path, thumbnail_path, caption, taken_at,
                  uploaded_by, uploaded_at, tagged_user_ids[]
albums            id, family_id, name, cover_photo_id, slideshow_eligible,
                  slideshow_transition, slideshow_duration_s, slideshow_order,
                  created_by
album_photos      album_id, photo_id, order_index
push_subscriptions id, user_id, endpoint, p256dh, auth, created_at
```

---

*Document owner: [Project Owner]*
*Architecture review: Phase 1 kickoff*
*Next update trigger: Phase 1 sprint 3 retrospective*
