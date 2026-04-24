# Phase 1.2 — Authentication & First-Run Setup

**Duration:** Weeks 2–3 (10 business days)  
**Goal:** Family can create accounts, log in, and set up the household  
**Status:** Ready for Development  
**Start Date:** 2026-04-28 (after Phase 1.1 exits)

---

## Overview

Phase 1.2 adds the complete authentication flow:
- First-time setup wizard (family creation)
- User login/logout with JWT
- PIN-based quick login
- User management (admin panel)
- Rate limiting and session management
- 38 tests (22 backend, 16 frontend)

---

## Task Breakdown & Execution Order

### Task 1.2.1 `[BE]` *BLOCKER* — Auth API Endpoints

**What to build:**

Core auth router: `backend/app/routers/auth.py`
- `POST /api/auth/setup`: Create family + admin user
  - Input: `{family_name, timezone, admin_email, admin_password}`
  - Output: JWT access + refresh tokens, user object
  - Sets `is_setup = True` in family
  
- `POST /api/auth/login`: Email/password login
  - Input: `{email, password}`
  - Output: JWT tokens + user object
  - Rate limit: 5 failures → 60-second lockout
  - Updates `last_login_at`
  
- `POST /api/auth/login/pin`: Quick PIN login
  - Input: `{user_id, pin}`
  - Rate limit: 5 failures → 60-second lockout (per user_id + IP)
  - Output: JWT tokens
  
- `POST /api/auth/logout`: Invalidate session
  - Input: None (uses auth token)
  - Output: 204 No Content
  
- `GET /api/auth/me`: Current user
  - Input: None (requires auth)
  - Output: User object with family context
  
- `GET /api/auth/setup/status`: Check if setup complete
  - Input: None
  - Output: `{setup_complete: boolean}`
  - Accessible without auth

Security additions to `app/core/security.py`:
- `get_current_user` dependency: Extract user from JWT token
- `require_role` dependency factory: Enforce role-based access
  - Usage: `@require_role(["admin"])`
- Rate limiting helper: Track failures by key (IP + endpoint)

**Acceptance Criteria:**
- [ ] `POST /api/auth/setup` creates family + admin, returns JWT
- [ ] `POST /api/auth/login` returns 200 + JWT on valid credentials
- [ ] `POST /api/auth/login` returns 401 on invalid credentials
- [ ] `POST /api/auth/login/pin` rate-limited: 6th attempt in 60s → 429
- [ ] `POST /api/auth/logout` returns 204, invalidates session
- [ ] `GET /api/auth/me` returns user when authenticated, 401 when not
- [ ] `GET /api/auth/setup/status` returns boolean without auth
- [ ] JWT tokens stored in HTTP-only cookies
- [ ] Refresh token endpoint for token renewal
- [ ] Password hashing verified with bcrypt

**Testing AC:**
- Unit tests: `tests/test_auth.py` (12+ tests)
  - Setup: create family, admin user, JWT returned
  - Login: valid credentials, invalid credentials, rate limiting
  - PIN login: success, rate limiting, user lookup
  - Logout: invalidates session
  - Me endpoint: authenticated, unauthenticated
  - Setup status: true after setup, false on fresh DB
  - JWT validation: valid token, expired token, malformed token
- Coverage: 90%+
- All tests pass: `pytest tests/test_auth.py -v`

**Dependencies:** Task 1.1.3, 1.1.5 (FastAPI skeleton, database schema)  
**Duration:** 2 days  
**Owner:** Backend developer

**Files to Create/Modify:**
- `backend/app/routers/auth.py` (new)
- `backend/app/core/security.py` (enhance with rate limiting, dependencies)
- `backend/app/main.py` (include auth router)
- `backend/tests/test_auth.py` (new)

---

### Task 1.2.2 `[BE]` — User Management API

**What to build:**

User management router: `backend/app/routers/users.py`
- `GET /api/users`: List all family members
  - Query params: `skip, limit, role` (filter)
  - Output: Array of user objects
  - Accessible to any authenticated user
  
- `POST /api/users`: Create new user (admin only)
  - Input: `{display_name, email, role, pin}`
  - Output: User object with ID
  - Role options: admin, member, viewer
  
- `GET /api/users/{user_id}`: Get user details
  - Input: user_id (UUID)
  - Output: User object
  - Users can view themselves; admins view anyone
  
- `PATCH /api/users/{user_id}`: Update user
  - Input: `{display_name?, email?, role?, color?, ui_mode?}`
  - Output: Updated user object
  - Users can only update themselves; admins can update anyone
  
- `DELETE /api/users/{user_id}`: Soft delete user
  - Input: user_id
  - Output: 204 No Content
  - Sets `is_active = False` (soft delete)
  - Admins only
  
- `POST /api/users/{user_id}/avatar`: Upload avatar
  - Input: multipart file (image)
  - Output: User object with new avatar_url
  - Saves: original + 200x200 thumbnail
  - Max 5MB file size

User service: `backend/app/services/users.py`
- `create_user()`: Generate UUID, hash PIN, create DB entry
- `get_user()`: Fetch by ID with family context
- `list_users()`: Filter by family_id, role, active status
- `update_user()`: Partial update with validation
- `delete_user()`: Soft delete + session cleanup
- `upload_avatar()`: Save image, generate thumbnail, update DB

Image handling (Pillow):
- Validate MIME type (JPEG, PNG only)
- Resize to 200×200 for thumbnail
- Save to `/data/photos/{family_id}/{user_id}/avatar.jpg`
- Store URL in avatar_url field

**Acceptance Criteria:**
- [ ] Admin can create users with roles
- [ ] Non-admin cannot create users (403)
- [ ] Avatar upload saves original + thumbnail
- [ ] User list filters by family
- [ ] User update respects role permissions
- [ ] Soft delete doesn't remove from DB
- [ ] Avatar URL stored correctly

**Testing AC:**
- Unit tests: `tests/test_users.py` (10+ tests)
  - Create user (admin), create user (non-admin → 403)
  - List users, filter by role
  - Get user, update user
  - Delete user (soft delete)
  - Avatar upload, thumbnail generation
  - Permission checks (RBAC)
- Coverage: 85%+
- All tests pass: `pytest tests/test_users.py -v`

**Dependencies:** Task 1.2.1 (auth endpoints, role-based access)  
**Duration:** 1.5 days  
**Owner:** Backend developer

**Files to Create/Modify:**
- `backend/app/routers/users.py` (new)
- `backend/app/services/users.py` (new)
- `backend/app/main.py` (include users router)
- `backend/tests/test_users.py` (new)
- `backend/requirements.txt` (add Pillow if not present)

---

### Task 1.2.3 `[FE]` *BLOCKER* — Setup Wizard (First-Run Flow)

**What to build:**

SetupWizard component: `frontend/src/pages/SetupWizard.tsx`
- Multi-step form:
  1. Welcome screen
  2. Household name + timezone selection
  3. Admin account (email, password, PIN)
  4. Summary + confirm
  
- Form behavior:
  - Step 1 → Step 2 (no validation)
  - Step 2 → Step 3 (validate: name required, timezone selected)
  - Step 3 → Step 4 (validate: email valid, password 8+ chars, PIN 4-6 digits)
  - Step 4: Submit to `/api/auth/setup`
  - On success: store tokens, navigate to `/dashboard`
  - On error: display message, allow retry
  
- Visual design:
  - Progress bar showing step (1/2/3/4)
  - Back/Next buttons
  - Submit button on final step
  - Error messages inline

App.tsx updates:
- On mount: call `GET /api/auth/setup/status`
- If `setup_complete === false`: redirect to `/setup`
- If `setup_complete === true`: show normal app
- Handle loading state during check

**Acceptance Criteria:**
- [ ] Fresh install redirects to `/setup` automatically
- [ ] All 4 steps render correctly
- [ ] Step validation works (required fields, password length, email format)
- [ ] Completing wizard creates family + admin user
- [ ] On success: tokens stored, dashboard loads
- [ ] On error: shows message, can retry
- [ ] Back button works
- [ ] Progress bar updates

**Testing AC:**
- Integration tests: `frontend/src/__tests__/pages/SetupWizard.test.tsx` (5+ tests)
  - Render setup wizard
  - Complete all steps with valid input
  - Error: invalid email, short password, missing name
  - Navigate back/forward
  - Submit and navigate to dashboard
- Coverage: 75%+
- All tests pass: `npm test SetupWizard.test.tsx`

**Dependencies:** Task 1.2.1 (auth API)  
**Duration:** 1.5 days  
**Owner:** Frontend developer

**Files to Create/Modify:**
- `frontend/src/pages/SetupWizard.tsx` (new)
- `frontend/src/App.tsx` (add setup check)
- `frontend/src/__tests__/pages/SetupWizard.test.tsx` (new)

---

### Task 1.2.4 `[FE]` — Login Page

**What to build:**

Login component: `frontend/src/pages/Login.tsx`
- Display family members as avatar cards
  - Avatar image (or initials)
  - Display name below
  - Tap to select user
  
- After selection, show login form:
  - For users with PIN: PIN pad (56×56px buttons, 1-9, 0, ✓, ✗)
  - For users without PIN: Password field
  - 5 failed attempts → lockout message ("Try again in 60 seconds")
  
- API calls:
  - `GET /api/users` to load family members (no auth)
  - `POST /api/auth/login/pin` or `POST /api/auth/login`
  - On success: store token, navigate to `/dashboard`
  - On error: show message, reset form
  
- Visual design:
  - Large avatar cards (100×100px min)
  - PIN pad with tactile feedback
  - Clear lockout counter
  - "Forgot password?" link → password reset (future)

**Acceptance Criteria:**
- [ ] Family member avatars display without auth
- [ ] Selecting user shows appropriate form (PIN or password)
- [ ] PIN pad buttons are 56×56px min (mobile-friendly)
- [ ] Successful login navigates to `/dashboard`
- [ ] 5 failed attempts shows lockout message
- [ ] Lockout counter counts down
- [ ] Error messages are clear
- [ ] Responsive on 375px phone

**Testing AC:**
- Component tests: `frontend/src/__tests__/pages/Login.test.tsx` (6+ tests)
  - Render avatar list
  - Select user, show PIN pad
  - Select user without PIN, show password field
  - PIN entry: valid, invalid, rate limiting (6+ attempts)
  - Password login: valid, invalid
  - Navigate to dashboard on success
- Coverage: 75%+
- All tests pass: `npm test Login.test.tsx`

**Dependencies:** Task 1.2.1 (auth API), Task 1.2.2 (users API)  
**Duration:** 1.5 days  
**Owner:** Frontend developer

**Files to Create/Modify:**
- `frontend/src/pages/Login.tsx` (enhance from placeholder)
- `frontend/src/__tests__/pages/Login.test.tsx` (new)
- `frontend/src/components/PINPad.tsx` (reusable component)

---

### Task 1.2.5 `[FE]` — User Management (Admin Panel)

**What to build:**

User management page: `frontend/src/pages/admin/ManageUsers.tsx`
- Display:
  - Table/list of all family members
  - Columns: Avatar, Name, Email, Role, Actions
  - Filter by role (dropdown)
  
- Add user form (modal/sheet):
  - Display name (required)
  - Email (optional)
  - Role (dropdown: admin, member, viewer)
  - PIN (auto-generate or custom)
  - Submit button
  
- Edit user (modal/sheet):
  - Same fields as add, pre-populated
  - Submit button
  
- Delete user:
  - Confirmation dialog
  - "Delete" button deletes user (soft delete)
  
- Avatar upload:
  - Drag-drop or file picker
  - Instant upload + display

Admin-only checks:
- Only admins see this page
- Non-admins redirected to profile page

API calls:
- `GET /api/users` (list)
- `POST /api/users` (create)
- `PATCH /api/users/{id}` (update)
- `DELETE /api/users/{id}` (delete)
- `POST /api/users/{id}/avatar` (upload)

**Acceptance Criteria:**
- [ ] Admin sees all users in list
- [ ] Add user form works, creates user
- [ ] Edit user form works, updates user
- [ ] Delete user asks for confirmation
- [ ] Avatar upload works (drag or click)
- [ ] Non-admin users cannot access page (403 or redirect)
- [ ] Role filter works
- [ ] Responsive on mobile

**Testing AC:**
- Component tests: `frontend/src/__tests__/pages/admin/ManageUsers.test.tsx` (5+ tests)
  - Render user list
  - Open add user form
  - Submit add user form
  - Edit user
  - Delete user with confirmation
  - Upload avatar
  - Role filter
- Coverage: 70%+
- All tests pass: `npm test admin/ManageUsers.test.tsx`

**Dependencies:** Task 1.2.2 (users API)  
**Duration:** 1.5 days  
**Owner:** Frontend developer

**Files to Create/Modify:**
- `frontend/src/pages/admin/ManageUsers.tsx` (new)
- `frontend/src/__tests__/pages/admin/ManageUsers.test.tsx` (new)
- `frontend/src/components/AvatarUpload.tsx` (reusable)

---

## Implementation Sequence

**Days 1–2:** Task 1.2.1 (Auth API - BLOCKER)  
**Days 2–3:** Task 1.2.2 (User mgmt API) - parallel with 1.2.3  
**Days 2–3:** Task 1.2.3 (Setup wizard - BLOCKER) - parallel with 1.2.2  
**Days 3–4:** Task 1.2.4 (Login page)  
**Days 4–5:** Task 1.2.5 (User admin)  
**Days 6–10:** Testing, integration, documentation, buffer

---

## Phase 1.2 Exit Checklist

**Backend:**
- [ ] All 6 auth endpoints working
- [ ] Rate limiting enforced (5 attempts → 60s lockout)
- [ ] JWT tokens stored in HTTP-only cookies
- [ ] User CRUD endpoints working
- [ ] Avatar upload saves file + thumbnail
- [ ] 22 backend tests passing
- [ ] 90%+ coverage on auth service
- [ ] `mypy app/` passes

**Frontend:**
- [ ] Setup wizard guides first-time setup
- [ ] Login page shows family members
- [ ] PIN pad and password login both work
- [ ] User management page (admin only)
- [ ] Avatar upload works
- [ ] 16 frontend tests passing
- [ ] 70%+ coverage on auth pages
- [ ] Responsive on mobile (375px)

**Integration:**
- [ ] Full flow: setup → login → dashboard works
- [ ] Tokens persist across page reloads
- [ ] Logout clears tokens
- [ ] Rate limiting works end-to-end

**CI/CD:**
- [ ] All tests pass on CI
- [ ] Coverage reports generated
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## Testing Summary

| Component | Tests | Coverage Target |
|-----------|-------|-----------------|
| Auth API | 12 | 90%+ |
| User API | 10 | 85%+ |
| Setup Wizard | 5 | 75%+ |
| Login page | 6 | 75%+ |
| User Admin | 5 | 70%+ |
| **Total** | **38** | **80%+** |

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Rate limiting complexity | Use simple dict-based counter with TTL (phase 2 upgrade to Redis) |
| JWT storage (XSS) | HTTP-only cookies + SameSite=Strict |
| PIN in logs | Hash pins before logging; never log plain PIN |
| Avatar file upload | Validate MIME type, size limit, scan for malware (future) |
| Database constraint issues | Test foreign keys on every insert/delete |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Setup flow time | <2 min | Manual test |
| Login latency | <500ms | Request timing |
| Test pass rate | 100% | CI/CD |
| Code coverage | 80%+ backend, 70%+ FE | Codecov report |
| Mobile responsiveness | All views at 375px | Manual + media query tests |

---

## Next Phase (Sprint 1.3)

Once Phase 1.2 exits:
- **Sprint 1.3 begins:** Calendar & Tasks Core
- Backend: Calendar CRUD, Google Calendar OAuth, Tasks CRUD
- Frontend: Calendar views (Month/Week/Day/Agenda), Tasks board
- 67 new tests (15 calendar, 12 integrations, 18 tasks, 22 UI)

---

**Ready to execute Phase 1.2. Begin with Task 1.2.1 (Auth API).**
