# Migration Checklist

Track your progress through the Supabase → CockroachDB migration.

## Phase 0: Prerequisites ✅

- [x] CockroachDB cluster created (aware-oribi-27794)
- [x] Connection credentials obtained
- [x] Schema SQL file created
- [x] Client library created
- [x] Documentation completed

## Phase 1: Environment Setup 🔄 START HERE

### Step 1.1: Download SSL Certificate
```bash
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
```

- [ ] Certificate downloaded
- [ ] Verified with: `ls -la $HOME/.postgresql/root.crt`

### Step 1.2: Create Environment File
```bash
cp .env.cockroachdb.example .env.local
```

Edit `.env.local`:
- [ ] `DATABASE_URL` set (already filled)
- [ ] `JWT_SECRET` generated: `openssl rand -hex 32`
- [ ] `JWT_EXPIRY` set (e.g., "7d")
- [ ] Existing variables preserved (ENCRYPTION_KEY, META_APP_SECRET, etc.)
- [ ] `NEXT_PUBLIC_SITE_URL` set

### Step 1.3: Install Dependencies
```bash
npm install
```

- [ ] Dependencies installed without errors
- [ ] `pg` and `jsonwebtoken` in node_modules
- [ ] No peer dependency warnings

**Completion**: All 3 steps done? Move to Phase 2.

---

## Phase 2: Database Setup ⏳

### Step 2.1: Test Connection
```bash
npm run db:test
```

Expected output:
```
✅ Connection successful!
✅ Server Info: CockroachDB ...
✅ Found 0 tables
```

- [ ] Connection test passes
- [ ] Output shows CockroachDB version

### Step 2.2: Create Schema
```bash
npm run db:migrate
```

Or manually:
```bash
psql "$DATABASE_URL" < migrations/001-cockroachdb-schema.sql
```

- [ ] Migration runs without errors
- [ ] No SQL syntax errors

### Step 2.3: Verify Schema
```bash
npm run db:test
```

Expected output:
```
✅ Connection successful!
✅ Found 26 tables
```

- [ ] All 26 tables created
- [ ] No missing tables

### Step 2.4: Verify Types
```bash
npm run typecheck
```

- [ ] No type errors
- [ ] All ts files compile

**Completion**: Database ready? Move to Phase 3.

---

## Phase 3: Code Migration 🔄 MAIN WORK

### Step 3.1: Update Imports - Auth Layer

Files to update (in order):

#### 3.1.1: src/hooks/use-auth.tsx
```bash
# Find
grep -n "@/lib/supabase" src/hooks/use-auth.tsx

# Replace
# @/lib/supabase/server → @/lib/cockroachdb/server
# @/lib/supabase/client → @/lib/cockroachdb/server
```

- [ ] Imports updated
- [ ] File compiles: `npm run typecheck`

#### 3.1.2: src/lib/auth/account.ts
- [ ] Imports updated
- [ ] File compiles

#### 3.1.3: src/lib/auth/invitations.ts
- [ ] Imports updated
- [ ] File compiles

#### 3.1.4: src/lib/auth/roles.ts
- [ ] Imports updated
- [ ] File compiles

#### 3.1.5: src/middleware.ts
```typescript
// Session handling may need updates
// See MIGRATION_GUIDE.md for details
```

- [ ] Imports updated
- [ ] Session handling works
- [ ] File compiles

### Step 3.2: Update Imports - API Routes

Count remaining Supabase imports:
```bash
grep -r "@/lib/supabase" src/app/api | wc -l
```

Expected: ~29 files

Files to update:

#### 3.2.1: src/app/api/automations/**
```bash
grep -r "@/lib/supabase" src/app/api/automations/
```

Number of files: ___

- [ ] All automations files updated
- [ ] Imports changed
- [ ] Syntax validated

#### 3.2.2: src/app/api/flows/**
- [ ] All flows files updated
- [ ] Imports changed
- [ ] Syntax validated

#### 3.2.3: src/app/api/account/**
- [ ] All account files updated
- [ ] Imports changed
- [ ] Syntax validated

#### 3.2.4: src/app/api/whatsapp/**
- [ ] All WhatsApp files updated
- [ ] Imports changed
- [ ] Syntax validated

#### 3.2.5: src/app/api/invitations/**
- [ ] All invitation files updated
- [ ] Imports changed
- [ ] Syntax validated

### Step 3.3: Update Other Files

```bash
grep -r "@/lib/supabase" src/ | grep -v node_modules
```

Files typically affected:
- [ ] `src/lib/dashboard/queries.ts`
- [ ] `src/lib/contacts/dedupe.ts`
- [ ] `src/lib/automations/admin-client.ts`
- [ ] `src/lib/flows/admin-client.ts`
- [ ] `src/lib/whatsapp/template-webhook.ts`

### Step 3.4: Verify All Imports Replaced

```bash
grep -r "@supabase" src/ | grep -v node_modules | wc -l
grep -r "@/lib/supabase" src/ | grep -v node_modules | wc -l
```

Both should return **0**

- [ ] No @supabase imports found
- [ ] No @/lib/supabase imports found

### Step 3.5: Type Check
```bash
npm run typecheck
```

- [ ] No type errors
- [ ] All files compile successfully
- [ ] Note any errors for fixing

**Completion**: All imports updated? Move to Phase 4.

---

## Phase 4: Authentication Setup 🔄

### Choose Your Auth Strategy

- [ ] Option A: Custom JWT (recommended for speed)
- [ ] Option B: Auth0 (recommended for production)
- [ ] Option C: SuperTokens (recommended for self-hosted)

### If Using Custom JWT (Option A):

Create `src/lib/auth/jwt.ts`:
- [ ] JWT generation function implemented
- [ ] JWT verification function implemented
- [ ] Expiry time handling correct

Create `src/lib/auth/sessions.ts`:
- [ ] Session creation function
- [ ] Session retrieval function
- [ ] Session validation function

Update `src/app/api/auth/login` endpoint:
- [ ] Login endpoint updated
- [ ] Session created on successful login
- [ ] JWT token returned

Update `src/app/api/auth/signup` endpoint:
- [ ] Signup endpoint updated
- [ ] Profile created automatically
- [ ] Session created
- [ ] JWT token returned

Update middleware:
- [ ] JWT verification added
- [ ] User context set
- [ ] Protected routes work

### If Using Auth0 (Option B):

- [ ] Auth0 account created
- [ ] Application configured
- [ ] Redirect URIs set
- [ ] Environment variables added
- [ ] Auth0 SDK integrated

### If Using SuperTokens (Option C):

- [ ] SuperTokens backend deployed
- [ ] Backend URL configured
- [ ] Frontend SDK integrated
- [ ] User recipes set up

### Testing Authentication

```bash
npm run dev
```

- [ ] Sign up works
- [ ] User created in database
- [ ] Login works
- [ ] Sessions persist
- [ ] Logout works
- [ ] Auth state maintained

**Completion**: Authentication working? Move to Phase 5.

---

## Phase 5: Real-time Features 🔄

Current real-time tables: `messages`, `conversations`

### Choose Real-time Strategy

- [ ] Option A: Polling (recommended for MVP)
- [ ] Option B: WebSocket (recommended for production)

### If Using Polling (Option A):

Replace in `src/hooks/use-realtime.ts`:
- [ ] Remove Supabase `.on()` subscriptions
- [ ] Implement polling interval (1-2 seconds)
- [ ] Fetch fresh data in interval
- [ ] Clean up interval on unmount

Test:
- [ ] Messages update in real-time
- [ ] Conversations update in real-time
- [ ] CPU usage reasonable
- [ ] No memory leaks

### If Using WebSocket (Option B):

Create custom WebSocket server:
- [ ] Server created for real-time events
- [ ] PostgreSQL LISTEN/NOTIFY integrated
- [ ] Client connects to WebSocket

Test:
- [ ] WebSocket connects
- [ ] Events broadcast correctly
- [ ] Performance acceptable
- [ ] Fallback to polling on disconnect

**Completion**: Real-time working? Move to Phase 6.

---

## Phase 6: Testing & Verification ✅

### Type & Lint Checking

```bash
npm run typecheck
```
- [ ] No type errors
- [ ] All files compile

```bash
npm run lint
```
- [ ] No lint errors
- [ ] Code style consistent

### Build Verification

```bash
npm run build
```
- [ ] Build succeeds
- [ ] No warnings (except expected ones)
- [ ] Output size reasonable

### Unit Tests

```bash
npm run test
```
- [ ] All tests pass
- [ ] No skipped tests
- [ ] Coverage acceptable

### Development Server

```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] No console errors
- [ ] API routes respond
- [ ] Database queries work

### Manual Feature Testing

#### Authentication
- [ ] Sign up creates user
- [ ] Sign up creates profile
- [ ] Sign up creates personal account
- [ ] Login works
- [ ] Session persists across page reload
- [ ] Logout clears session
- [ ] Invitations work

#### Contacts
- [ ] Create contact
- [ ] View contacts list
- [ ] Update contact
- [ ] Delete contact
- [ ] Search contacts
- [ ] Filter by tag
- [ ] Deduplicate contacts

#### Messages
- [ ] Send message
- [ ] Receive message
- [ ] Messages appear in real-time
- [ ] Message history loads
- [ ] Message status updates

#### Automations
- [ ] Create automation
- [ ] List automations
- [ ] Activate automation
- [ ] Automation triggers
- [ ] View automation logs

#### Broadcasts
- [ ] Create broadcast
- [ ] Schedule broadcast
- [ ] Send broadcast
- [ ] Track broadcast status
- [ ] View broadcast analytics

#### Flows
- [ ] Create flow
- [ ] View flow canvas
- [ ] Activate flow
- [ ] Test flow execution
- [ ] View flow runs

#### Pipelines & Deals
- [ ] Create pipeline
- [ ] Create deal
- [ ] Move deal between stages
- [ ] View pipeline analytics

### Performance Testing

```bash
npm run dev
```

- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Database query time < 200ms
- [ ] Memory usage stable
- [ ] No memory leaks

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast acceptable
- [ ] Touch targets sufficient

### Browser Testing

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

**Completion**: All manual tests passed? Move to Phase 7.

---

## Phase 7: Deployment Preparation ✅

### Final Checks

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

- [ ] All checks pass
- [ ] No errors
- [ ] No warnings

### Environment Variables

Verify production `.env` has:
- [ ] `DATABASE_URL` set correctly
- [ ] `JWT_SECRET` set (different from dev)
- [ ] `DATABASE_SSL_MODE=verify-full`
- [ ] All other required variables

### Data Migration (if needed)

Export from old Supabase:
```bash
pg_dump "postgres://user:pass@host:5432/db" --data-only > data.sql
```

- [ ] Data exported successfully
- [ ] Data validated

Import to CockroachDB:
```bash
psql "$DATABASE_URL" < data.sql
```

- [ ] Data imported successfully
- [ ] Record counts match
- [ ] Referential integrity intact

### Backup

- [ ] Supabase backups created
- [ ] Production environment backed up
- [ ] Rollback plan documented

### Deployment

- [ ] Deploy to staging first
- [ ] Run through test suite
- [ ] Manual testing in staging
- [ ] Get sign-off
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify all features work

**Completion**: Live in production? ✅ Migration complete!

---

## Summary

| Phase | Status | Date |
|-------|--------|------|
| 0: Prerequisites | ✅ Done | June 16-17 |
| 1: Environment | ⏳ Now | June 17 |
| 2: Database | ⏳ Now | June 17 |
| 3: Code Migration | ⏳ Next | 4-6 hours |
| 4: Authentication | ⏳ Next | 1-2 hours |
| 5: Real-time | ⏳ Next | 30 mins |
| 6: Testing | ⏳ Next | 1-2 hours |
| 7: Deployment | ⏳ Final | 1 hour |

**Total Effort**: ~8-11 hours

**Current Status**: Ready to start Phase 1 ✅

---

## Troubleshooting During Migration

### Error: "Cannot find module 'pg'"
```bash
npm install
npm ls pg
```

### Error: "SSL certificate error"
```bash
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
```

### Error: "Type errors after import change"
```bash
npm run typecheck
# Fix the reported errors
```

### Error: "Connection refused"
```bash
npm run db:test
# Check DATABASE_URL and SSL settings
```

---

## Support

- Questions? See `MIGRATION_GUIDE.md`
- Need help? See `QUICKSTART_MIGRATION.md`
- Stuck? See `MIGRATION_STATUS.md`

---

**Ready to start?** Begin with Phase 1 above! 🚀

