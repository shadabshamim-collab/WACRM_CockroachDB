# Migration Status: Supabase → CockroachDB

**Status**: Phase 3 Complete ✅  
**Date**: 2026-06-17  
**India Compliance**: ✅ CockroachDB in AWS ap-south-1 (India region)

---

## What's Been Done ✅

### 1. Infrastructure Setup
- ✅ CockroachDB cluster provisioned (aware-oribi-27794)
- ✅ Connection details obtained
- ✅ Cluster in AWS ap-south-1 (India) - compliant

**Connection String**:
```
postgresql://shadb_pilot:qx2fuDg01oYIgf-OOpLDpQ@aware-oribi-27794.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb
```

### 2. Database Schema Created
- ✅ All 26 tables migrated to SQL
- ✅ Schema file: `migrations/001-cockroachdb-schema.sql`
- ✅ Includes:
  - 26 tables (accounts, profiles, contacts, messages, conversations, etc.)
  - All foreign keys and constraints
  - All indexes (performance optimized)
  - Trigger functions for `updated_at` timestamps
  - Generated columns for phone normalization

### 3. Client Library Created
- ✅ `src/lib/cockroachdb/client.ts` - Core PostgreSQL client
- ✅ `src/lib/cockroachdb/server.ts` - Server-side wrapper
- ✅ `src/lib/cockroachdb/browser.ts` - Browser-safe wrapper (API-based)
- ✅ `src/lib/cockroachdb/index.ts` - Unified exports

**Key Features**:
- Drop-in replacement for Supabase client
- Same query API (`.from().select().eq()` etc.)
- Connection pooling with 20 max connections
- Error handling and type safety

### 4. Dependencies Updated
- ✅ Added `pg` (node-postgres)
- ✅ Added `jsonwebtoken` (for custom auth)
- ✅ Added `@types/pg` and `@types/jsonwebtoken`
- ✅ Removed `@supabase/ssr` and `@supabase/supabase-js`
- ✅ Updated `package.json`

### 5. Documentation Created
- ✅ `MIGRATION_PLAN.md` - Overall migration strategy
- ✅ `MIGRATION_GUIDE.md` - Step-by-step implementation
- ✅ `.env.cockroachdb.example` - Environment template
- ✅ `MIGRATION_STATUS.md` - This file

---

## What Needs to Be Done 📋

### Phase 4: Code Migration (NEXT)

#### 4.1 Download SSL Certificate
```bash
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
```

#### 4.2 Install Dependencies
```bash
npm install
```

#### 4.3 Update Environment Variables
Copy `.env.cockroachdb.example` to `.env.local`:
```bash
DATABASE_URL=postgresql://shadb_pilot:qx2fuDg01oYIgf-OOpLDpQ@aware-oribi-27794.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
JWT_SECRET=<generate-with-openssl-rand-hex-32>
```

#### 4.4 Initialize Database
```bash
psql "$DATABASE_URL" < migrations/001-cockroachdb-schema.sql
```

Or (simpler):
```bash
npm run migrate
```

#### 4.5 Code Changes - Replace Imports

**Files to update (priority order)**:

1. **Authentication Layer** (HIGH PRIORITY)
   - `src/hooks/use-auth.tsx` - Auth context, profile loading
   - `src/lib/auth/account.ts` - Account queries
   - `src/lib/auth/invitations.ts` - Invitation handling
   - `src/lib/auth/roles.ts` - Role management
   - `src/middleware.ts` - Session management

2. **API Routes** (HIGH PRIORITY)
   - All files in `src/app/api/**/*.ts` (29 routes)
   - Replace imports from `@/lib/supabase/server` → `@/lib/cockroachdb/server`
   - Syntax stays 95% the same

3. **React Components** (MEDIUM PRIORITY)
   - Components using real-time subscriptions
   - Replace `.on('*', ...)` with polling or WebSocket

4. **Helper Libraries** (MEDIUM PRIORITY)
   - `src/lib/dashboard/queries.ts`
   - `src/lib/contacts/dedupe.ts`
   - `src/lib/automations/admin-client.ts`
   - `src/lib/flows/admin-client.ts`

#### 4.6 Authentication System Replacement

Choose one:

**Option A: Custom JWT (Fastest, recommended)**
- Already have JWT dependencies added
- Create `src/lib/auth/jwt.ts` (token generation)
- Create `src/lib/auth/sessions.ts` (session storage in DB)
- Update login/signup endpoints

**Option B: Auth0**
- Sign up at auth0.com
- Install @auth0 packages
- Update middleware with Auth0 verification

**Option C: SuperTokens**
- Deploy self-hosted SuperTokens
- Integrate with Next.js

#### 4.7 Replace Real-time Features

Current: Supabase real-time on `messages` and `conversations`

**Option A: Polling (MVP)**
- Simplest implementation
- 1-2 second refresh interval
- Good enough for most use cases

**Option B: WebSocket**
- More performant
- Requires custom server
- PostgreSQL LISTEN/NOTIFY events

#### 4.8 RPC Functions

8 RPC functions need replacement:
1. `transfer_account_ownership()` → API endpoint
2. `set_member_role()` → API endpoint
3. `remove_account_member()` → API endpoint
4. `redeem_invitation()` → API endpoint
5. `peek_invitation()` → API endpoint
6. `increment_automation_execution_count()` → Simple UPDATE
7. `increment_flow_execution_count()` → Simple UPDATE
8. `merge_duplicate_contacts()` → Business logic function

Most can be replaced with simple SQL UPDATE or business logic in API routes.

---

## Estimated Timeline

- **SSL + Environment**: 10 minutes
- **Database Setup**: 15 minutes
- **Dependencies**: 5 minutes
- **Authentication**: 1-2 hours
- **Import replacements**: 2-3 hours
- **Real-time replacement**: 1 hour
- **Testing**: 2 hours
- **Debugging**: 1-2 hours

**Total**: ~8-11 hours of focused work

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  React Components ─┐                                     │
│  API Routes ───────┼──→ CockroachDB Client Library       │
│  Middleware ───────┘     ├─ Server: Direct DB queries    │
│                          ├─ Browser: API endpoints       │
│                          └─ Pooled Connections (20)      │
│                                    │                      │
│                                    ↓                      │
│                    ┌───────────────────────────────┐     │
│                    │  CockroachDB (AWS ap-south-1) │     │
│                    │  26 Tables, Full ACID         │     │
│                    └───────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## Query Syntax Comparison

**Before (Supabase)**:
```typescript
import { createClient } from '@/lib/supabase/server'

const client = createClient()
const { data, error } = await client
  .from('contacts')
  .select('id, first_name, phone')
  .eq('account_id', accountId)
  .order('created_at', { ascending: false })
  .limit(10)
```

**After (CockroachDB)**:
```typescript
import { createClient } from '@/lib/cockroachdb/server'

const client = createClient()
const { data, error } = await client
  .from('contacts')
  .select('id, first_name, phone')
  .eq('account_id', accountId)
  .order('created_at', 'desc')
  .limit(10)
  .select_all()  // Changed: need to call method to execute
```

**Minor differences**:
- `.order()` syntax: `{ ascending: false }` → `'desc'`
- Must call `.select_all()` or `.single()` or `.insert()` to execute
- Error handling is same: `{ data, error }` pattern

---

## Testing Checklist

- [ ] npm run typecheck (no errors)
- [ ] npm run lint (no errors)
- [ ] npm run test (all tests pass)
- [ ] npm run build (builds successfully)
- [ ] Manual: Sign up new user
- [ ] Manual: Create contact
- [ ] Manual: Send message
- [ ] Manual: Create broadcast
- [ ] Manual: Test automation trigger
- [ ] Manual: Test flow
- [ ] Performance: Page load times
- [ ] Performance: Query latency

---

## Rollback Plan

If critical issues found:

1. **Keep Supabase running** during migration
2. **Use environment variable to switch**:
   ```env
   USE_SUPABASE=true  # Revert to Supabase
   USE_SUPABASE=false # Use CockroachDB
   ```
3. **Create adapter layer** that routes to appropriate client
4. **Redeploy** with `USE_SUPABASE=true`

---

## Next Immediate Steps

1. **Run**: `npm install`
2. **Download certificate**:
   ```bash
   curl --create-dirs -o $HOME/.postgresql/root.crt \
     'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
   ```
3. **Set environment**: Copy `.env.cockroachdb.example` → `.env.local`
4. **Initialize DB**: `psql "$DATABASE_URL" < migrations/001-cockroachdb-schema.sql`
5. **Test connection**: `npm run db:test` (create this script)
6. **Start code migration**: Update imports in `src/hooks/use-auth.tsx`

---

## Support

- **CockroachDB Docs**: https://www.cockroachlabs.com/docs/stable/
- **node-postgres Docs**: https://node-postgres.com/
- **Migration Guides**: See MIGRATION_GUIDE.md

---

## Questions?

Refer to:
- `MIGRATION_GUIDE.md` for detailed steps
- `MIGRATION_PLAN.md` for overview
- CockroachDB console for cluster status

