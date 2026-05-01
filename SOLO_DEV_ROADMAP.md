# FamilyHub Solo Developer Roadmap

**Version:** 1.02
**Status:** Sprint 1.1 Complete + Security Hardening
**Date:** April 30, 2026
**Based on:** FamilyHub Implementation Plan v1.0, Requirements Plan v1.2

---

## Version History

| Version | Date | Changes |
|---|---|---|
| **1.02** | 2026-04-30 | Security hardening: secret key validator, non-root containers, .dockerignore files, connection pool limits, security headers (nginx+Caddy), network segmentation, resource limits, rate limiting, gzip compression, dev/prod dependency split, 7 tests passing. |
| **1.01** | 2026-04-30 | Sprint 1.1 complete: Dockerized infrastructure scaffold with FastAPI backend, nginx frontend, Caddy reverse proxy. All Alpine base images. 3/3 smoke tests passing. Alembic migrations auto-run on startup. |
| **1.0** | 2026-04-29 | Initial solo developer roadmap. ~50-week timeline, scope priorities (Must/Should/Nice/Maybe), deferred features list, solo dev survival guide, and weekly/monthly rhythm. |

---

## Overview

The original 56-week plan assumes 2-3 developers working in parallel streams. As a solo developer, this roadmap adjusts the timeline, removes unnecessary overhead, and prioritizes features for maximum value.

**Realistic timeline:** ~50 weeks (12-13 months) for a solid Phase 3 release. Phase 4-5 are optional enrichment.

---

## Key Adjustments for Solo Development

### Removed Overhead
- **No overlap sprints (Phase N.5):** You retain context between phases. Saves ~4 weeks.
- **No pair programming:** Substitute with TDD on complex modules + AI code review.
- **No knowledge transfer sprints:** You're the only dev.

### Scope Priorities

| Priority | Features | Rationale |
|----------|----------|-----------|
| **Must Build** | Auth, PWA, Wall Display, Internal Calendar, Tasks, Google Calendar | Core MVP — family can use this |
| **Should Build** | Microsoft Calendar, Lists, Family Board, Push Notifications | Completes the daily workflow |
| **Nice to Build** | Routines, Meal Planning, Homework Tracker, Pet Care | Quality of life, can wait |
| **Maybe Later** | Apple CalDAV, PostgreSQL, Home Assistant, Alexa | Complex or low-value for solo dev |

### Deferred Features (Cut from Initial Plan)

| Feature | Original Phase | New Target | Reason |
|---------|---------------|------------|--------|
| Apple CalDAV | Phase 2 | Phase 3 | Most complex calendar integration |
| WebAuthn/Passkeys | Phase 1 | Phase 3 | PIN + password sufficient |
| Remote Access (Tailscale) | Phase 1 | Phase 2 | Local-only is simpler |
| Pet Care Tracker | Phase 3 | Backlog | Low value vs effort |
| Homework Tracker | Phase 3 | Backlog | Can use Lists instead |
| Allowance Tracker | Phase 3 | Backlog | Can use Points system instead |
| PostgreSQL Migration | Phase 4 | Optional | SQLite is fine for household scale |
| Home Assistant Integration | Phase 5 | Backlog | Nice-to-have |
| Alexa/Google Home | Phase 5 | Backlog | Nice-to-have |

---

## Phase Timeline (Solo Dev)

### Phase 1 — Foundation (Weeks 1-10)
**Goal:** Working MVP — family can log in, see calendar, complete tasks, use wall display

**Sprint Breakdown:**
- Sprint 1.1 (Weeks 1-2): Project scaffold, Docker, DB, CI
- Sprint 1.2 (Weeks 3-4): Auth, family profiles, PIN/password, establish Python venv
- Sprint 1.3 (Weeks 5-6): Internal calendar, Google Calendar sync
- Sprint 1.4 (Weeks 7-8): Tasks, dashboard, wall display
- Sprint 1.5 (Weeks 9-10): Photos, slideshow, PWA polish, testing

**Exit Criteria:**
- [ ] `docker compose up -d` works on fresh Pi
- [ ] Family can log in via PWA on phones
- [ ] Wall screen shows events + chores
- [ ] Google Calendar events sync within 15 minutes
- [ ] All backend tests pass (80%+ coverage)

### Phase 2 — Full Calendars + Lists (Weeks 10-22)
**Goal:** Complete calendar ecosystem, custom lists, enhanced wall board

**Sprint Breakdown:**
- Sprint 2.1 (Weeks 10-12): Microsoft Calendar integration
- Sprint 2.2 (Weeks 13-14): Calendar conflict handling, sync log
- Sprint 2.3 (Weeks 15-17): Custom Lists module (templates, instances, shopping)
- Sprint 2.4 (Weeks 18-19): Family Board enhancements, push notifications
- Sprint 2.5 (Weeks 20-22): iCal feeds, security review, performance validation, E2E tests

**Exit Criteria:**
- [ ] Google + Microsoft calendars sync correctly
- [ ] Lists can be created, shared, and checked off
- [ ] Family Board is customizable
- [ ] Push notifications work on home network
- [ ] E2E test suite passes

### Phase 3 — Routines + Meals + Enrichment (Weeks 22-36)
**Goal:** Proactive household management

**Sprint Breakdown:**
- Sprint 3.1 (Weeks 22-24): Routines module + Routine Runner
- Sprint 3.2 (Weeks 25-27): Meal planner + recipe library
- Sprint 3.3 (Weeks 28-30): Meal → shopping list integration
- Sprint 3.4 (Weeks 31-33): Apple CalDAV (if needed), Family Wiki
- Sprint 3.5 (Weeks 34-36): Morning Briefing mode, WebAuthn, polish, testing

**Exit Criteria:**
- [ ] Routines run step-by-step on wall touchscreen
- [ ] Weekly meal plan generates shopping list
- [ ] Morning Briefing cycles wall screen automatically
- [ ] All three calendar providers working
- [ ] Performance baseline met on Pi hardware

### Phase 4 — Intelligence + Admin (Weeks 36-46) *(Optional)*
**Goal:** Reduce admin toil, complete admin experience

- Advanced reporting (chore trends, streaks)
- Full admin settings UI (no .env editing needed)
- Enhanced PWA offline (write-queue)
- Accessibility audit
- Performance optimization

### Phase 5 — Ecosystem (Weeks 46-52) *(Optional)*
**Goal:** Connect to broader home ecosystem

- Home Assistant integration
- Community list templates
- Automated updates
- Backup restore UI

---

## Solo Dev Survival Guide

### TDD for Complex Modules

For OAuth flows, encryption, and sync logic:
1. Write the test first (describe expected behavior)
2. Watch it fail
3. Write minimal code to pass
4. Refactor, tests still pass
5. Repeat

This is your "pair programmer" — the test tells you when you break something.

### Decision Records

When making architectural decisions, write a short ADR:

```markdown
## ADR-001: Use SQLite for Phase 1-3

**Context:** Need a database for household-scale data
**Decision:** SQLite via async SQLAlchemy
**Consequences:** Zero-config, no extra container. Can migrate to PostgreSQL later if needed.
**Date:** 2026-04-29
```

Store these in a `docs/adr/` directory.

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Losing context between sprints | Write detailed commit messages, update docs as you go |
| Burnout on 52-week project | Phase 1 is a complete product. Take breaks between phases. |
| Bugs in complex sync logic | TDD + thorough logging + test on real hardware |
| Scope creep | Hard phase gates. If it's not in the sprint, it waits. |
| Docker/Pi issues | Test on actual Pi hardware early (end of Sprint 1.1) |

### Weekly Rhythm

```
Monday-Wednesday: Feature development
Thursday: Testing + bug fixes
Friday: Documentation + cleanup + planning next week
Weekend: Rest (or optional feature work if inspired)
```

### Monthly Rhythm

- **First Monday:** Dependency security audit (`pip-audit`, `npm audit`)
- **Last Friday:** Phase progress review, update this roadmap if needed

---

## Quick Reference

### Commands

```bash
# Backend
cd backend && pip install -r requirements.txt && pytest --cov=app

# Frontend
cd frontend && npm install && npm test

# Docker
docker compose up -d --build

# Migrations
cd backend && alembic upgrade head
```

### Key Files

| File | Purpose |
|------|---------|
| `RequirementsPlan` | Product requirements, decisions log |
| `FamilyHub_Implementation_Plan_v1.0.md` | Sprint-level task breakdown |
| `FamilyHub_DevGuide_Phase1.md` | Phase 1 developer guide |
| `TESTING.md` | Testing framework, coverage targets |
| `SOLO_DEV_ROADMAP.md` | This file — solo dev timeline |
| `.env.example` | Environment variables reference |

---

*Updated: April 2026*
