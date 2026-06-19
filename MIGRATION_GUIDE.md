# Supabase → CockroachDB Migration Guide

This guide documents the complete migration from Supabase to CockroachDB.

## Progress Tracking

- [x] **Phase 1**: Infrastructure Setup (CockroachDB provisioned)
- [x] **Phase 2**: Database Schema Created
- [x] **Phase 3**: Client Library Created
- [ ] **Phase 4**: Code Migration
- [ ] **Phase 5**: Authentication Setup
- [ ] **Phase 6**: Testing & Verification

---

## Environment Variables Setup

Create/update your `.env.local` file:

```bash
# CockroachDB Connection
DATABASE_URL=postgresql://shadb_pilot:qx2fuDg01oYIgf-OOpLDpQ@aware-oribi-27794.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# SSL Configuration
DATABASE_SSL_MODE=verify-full

# Authentication (new)
JWT_SECRET=your-256-bit-hex-key-here  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_EXPIRY=7d

# Keep existing variables
ENCRYPTION_KEY=your-existing-key
META_APP_SECRET=your-existing-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 1: Download SSL Certificate

Run this command to download the CockroachDB SSL certificate:

```bash
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
```

---

## Step 2: Initialize CockroachDB Schema

```bash
# Connect to CockroachDB and run the schema migration
psql "postgresql://shadb_pilot:qx2fuDg01oYIgf-OOpLDpQ@aware-oribi-27794.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full" < migrations/001-cockroachdb-schema.sql
```

Or use a Node.js script:
```bash
npm run migrate:cockroachdb
```

---

## Step 3: Migrate Data from Supabase

Export from Supabase and import to CockroachDB:

```bash
# Export from Supabase
pg_dump "postgres://postgres:[PASSWORD]@[SUPABASE_URL]:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges > supabase_data.sql

# Import to CockroachDB
psql "$DATABASE_URL" < supabase_data.sql
```

---

## Step 4: Code Migration - Import Changes

### Before (Supabase):
```typescript
import { createClient } from '@/lib/supabase/server'

const client = createClient()
const { data, error } = await client.from('contacts').select().eq('id', contactId)
```

### After (CockroachDB):
```typescript
import { createClient } from '@/lib/cockroachdb/server'

const client = createClient()
const { data, error } = await client.from('contacts').select().eq('id', contactId).single()
```

**All other query syntax remains the same!**

---

## Step 5: Update All Imports

Replace all imports throughout the codebase:

```bash
# Find all Supabase imports
grep -r "from '@/lib/supabase" src/

# Files to update:
# - src/hooks/use-auth.tsx → src/lib/cockroachdb/server
# - src/lib/auth/*.ts → use CockroachDB client
# - src/app/api/**/*.ts → use CockroachDB client
# - src/lib/dashboard/queries.ts
# - src/middleware.ts
```

### Key files to update:

1. **src/middleware.ts** - Replace Supabase session handling
2. **src/hooks/use-auth.tsx** - Replace profile loading and auth context
3. **src/lib/auth/account.ts** - Account management queries
4. **src/lib/auth/invitations.ts** - Invitation queries
5. **src/lib/auth/roles.ts** - Role queries
6. **All API routes in src/app/api/** - Database queries

---

## Step 6: Authentication Migration

### Current: Supabase Auth

Remove Supabase Auth dependency. Instead use:

#### Option A: Custom JWT (Recommended for quick migration)

Create `src/lib/auth/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

export function generateToken(userId: string, accountId: string) {
  return jwt.sign(
    { userId, accountId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  )
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string
      accountId: string
    }
  } catch (error) {
    return null
  }
}
```

Create `src/lib/auth/sessions.ts` for session management:

```typescript
import { createClient } from '@/lib/cockroachdb/server'

export async function createSession(userId: string, accountId: string) {
  const token = generateToken(userId, accountId)
  const client = createClient()

  await client
    .from('sessions')
    .insert({
      user_id: userId,
      account_id: accountId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

  return token
}
```

#### Option B: Auth0 (Recommended for production)

1. Sign up at https://auth0.com
2. Create an application
3. Install `auth0` package
4. Follow their Next.js integration guide

#### Option C: SuperTokens (Self-hosted, open-source)

1. Deploy SuperTokens backend
2. Install `supertokens-web-js` and `supertokens-node`
3. Follow their Next.js integration

---

## Step 7: Handle Real-time Features

Current real-time subscriptions on `messages` and `conversations` tables.

### Option A: Polling (Simple, recommended for MVP)

Replace `src/hooks/use-realtime.ts`:

```typescript
export function useRealtime({ enabled }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      // Fetch fresh data every 2 seconds
      refetchMessages()
      refetchConversations()
    }, 2000)

    return () => clearInterval(interval)
  }, [enabled])
}
```

### Option B: WebSocket (Performant)

Create a custom WebSocket server to broadcast Postgres LISTEN/NOTIFY events.

---

## Step 8: RPC Functions Replacement

Original Supabase RPC functions need to be replaced with:

### Option 1: Database Functions (Keep same)
Most PostgreSQL functions work in CockroachDB. Test all 8 RPC functions.

### Option 2: API Routes
Convert RPCs to REST endpoints in `src/app/api/rpc/`:

```typescript
// Before: client.rpc('transfer_account_ownership', {...})
// After: POST /api/rpc/transfer-account-ownership
```

---

## Step 9: Test & Verify

### Unit Tests
```bash
npm run test
```

### Type Checking
```bash
npm run typecheck
```

### Manual Testing
1. Sign up new user
2. Create a contact
3. Send/receive messages
4. Test automations
5. Test broadcasts
6. Verify invitations work

---

## Troubleshooting

### SSL Certificate Errors
```
Error: self signed certificate
```
Solution: Ensure `DATABASE_SSL_MODE=verify-full` and certificate is downloaded to `~/.postgresql/root.crt`

### Connection Pool Exhaustion
```
Error: remaining connection slots are reserved
```
Solution: Reduce max pool connections in `src/lib/cockroachdb/client.ts`

### Query Syntax Errors
```
Error: column "..." does not exist
```
Solution: Check column names match the schema migration

---

## Migration Checklist

- [ ] CockroachDB cluster created
- [ ] SSL certificate downloaded
- [ ] Schema migrated with `001-cockroachdb-schema.sql`
- [ ] Data imported from Supabase
- [ ] `DATABASE_URL` added to `.env.local`
- [ ] `npm install` run to install pg dependency
- [ ] All Supabase imports replaced with CockroachDB
- [ ] Authentication system updated
- [ ] Real-time subscriptions replaced
- [ ] Unit tests passing
- [ ] Type checking passing
- [ ] Manual testing completed
- [ ] Supabase dependency removed from package.json

---

## Rollback Plan

If issues occur:

1. Keep Supabase running in parallel
2. Use environment variable to switch databases
3. Revert to Supabase by changing `DATABASE_URL`
4. Redeploy application

---

## Performance Considerations

- CockroachDB handles concurrent writes better than Supabase
- Connection pooling is critical (max 20 connections recommended)
- Polling interval for real-time should be tuned based on latency needs
- Indexes on `account_id`, `created_at`, `status` are important

---

## Next Steps

1. Run: `npm install`
2. Download SSL certificate: `curl --create-dirs ...`
3. Initialize database: Run schema SQL
4. Update environment variables
5. Start code migration by updating imports
6. Test thoroughly before deploying

