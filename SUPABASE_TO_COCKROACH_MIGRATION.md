# Supabase to CockroachDB Migration Guide

## Current Status

- **Total Supabase References**: 505 lines across 65+ files
- **TypeScript Errors**: 361 (after partial migration)
- **Completed**: Profile API route, Account management routes
- **In Progress**: WhatsApp API routes

## Migration Patterns

### 1. Database Client Replacement

**Old (Supabase)**:
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

**New (CockroachDB)**:
```typescript
import { createClient } from '@/lib/cockroachdb/server'
const db = createClient()  // Note: synchronous, no await
```

### 2. Query Builder Pattern

**Critical**: Filter methods (`.eq()`, `.gt()`, etc) MUST come BEFORE async terminal methods.

**Wrong**:
```typescript
const { data, error } = await db
  .from('table')
  .update(data)      // ❌ async method first
  .eq('id', id)      // ❌ can't chain on promise
```

**Correct**:
```typescript
const { data, error } = await db
  .from('table')
  .eq('id', id)
  .update(data)      // ✅ async method last
```

### 3. Select Queries

**Pattern**:
```typescript
const { data, error } = await db
  .from('table')
  .select('col1, col2')
  .eq('id', id)
  .select_all()      // ✅ Terminal async method to execute
```

Or for single row:
```typescript
const { data, error } = await db
  .from('table')
  .select('col1, col2')
  .eq('id', id)
  .single()          // Returns single object, not array
  // or .maybeSingle() // Returns null if not found
```

### 4. Insert/Update/Delete

All follow the same pattern - filters first, then operation:

```typescript
// Insert
const { data, error } = await db
  .from('table')
  .insert({ field: value })
  // No filter needed, returns array of inserted rows

// Update
const { data, error } = await db
  .from('table')
  .eq('id', id)
  .update({ field: value })
  // Returns array of updated rows

// Delete
const { data, error } = await db
  .from('table')
  .eq('id', id)
  .delete()
  // Returns array of deleted rows
```

### 5. Authentication Migration

**Old (Supabase)**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

**New (JWT-based)**:
```typescript
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'

try {
  const ctx = await getCurrentAccount()  // Gets userId, accountId, role
  // Use ctx.userId for database queries
} catch (err) {
  return toErrorResponse(err)  // Handles auth errors properly
}
```

## Files to Migrate (by priority)

### Tier 1 (Critical - API Routes)
- [ ] `src/app/api/whatsapp/webhook/route.ts` (25 refs) - **In Progress**
- [ ] `src/app/api/whatsapp/config/route.ts` (15 refs) - **Partial**
- [ ] `src/app/api/whatsapp/templates/[id]/route.ts` (14 refs)
- [ ] `src/app/api/whatsapp/send/route.ts` (14 refs)
- [ ] `src/app/api/flows/[id]/route.ts` (11 refs)
- [ ] `src/app/api/flows/route.ts` (10 refs)
- [ ] `src/app/api/automations/route.ts` (8 refs)

### Tier 2 (High Priority - Hooks)
- [ ] `src/hooks/use-broadcast-sending.ts` (29 refs) - **Needs API endpoint refactoring**
- [ ] `src/hooks/use-realtime.ts` (6 refs) - **Needs polling/WebSocket replacement**

### Tier 3 (UI Components)
- [ ] `src/components/contacts/contact-detail-view.tsx` (21 refs)
- [ ] `src/app/(dashboard)/pipelines/page.tsx` (16 refs)
- [ ] `src/components/inbox/message-thread.tsx` (15 refs)
- [ ] And 20+ other component files

## Common Migration Tasks

### Task 1: Replace `supabaseAdmin()` calls

In API routes using the lazy-loaded client pattern:

```typescript
// Old
function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(url, key)
  }
  return _adminClient
}

// New  
function getDb() {
  return createClient()
}

// Then replace all: supabaseAdmin() → getDb()
```

### Task 2: Fix Query Chain Errors

For each error like "Property 'eq' does not exist on type Promise":
1. Find the `.from()` call
2. Move all filter methods (`.eq()`, `.gt()`, `.select()`) BEFORE the terminal method (`.update()`, `.delete()`, `.select_all()`, `.single()`)
3. Add `.select_all()` if accessing `.data` on a select query

### Task 3: Handle Result Type Changes

| Operation | Returns | Handle As |
|-----------|---------|-----------|
| `.select().select_all()` | Array | `data` is array, may be empty |
| `.select().single()` | Object | `data` is single object or null |
| `.insert()` | Array | `data[0]` for first row |
| `.update()` | Array | `data.length` for affected rows |
| `.delete()` | Array | `data.length` for deleted rows |

### Task 4: Remove Unsupported Methods

These don't exist in CockroachDBClient:
- `.rpc()` - Use raw `query()` for stored procedures
- `.range()` - Use `.limit()` and `.offset()` instead
- `.upsert()` - Use conditional insert/update logic
- Realtime subscriptions - Use polling or webhooks instead

**Replacement for `.rpc('function', params)`**:
```typescript
import { query } from '@/lib/cockroachdb/server'
const result = await query('SELECT function_name($1, $2)', [param1, param2])
```

## Testing After Migration

For each file fixed:

```bash
# Check TypeScript errors for that file
npx tsc --noEmit 2>&1 | grep "your-file-name"

# Run the endpoint/component manually
npm run dev
# Test the feature in browser or via API
```

## Notes

- **Authorization**: The CockroachDBClient doesn't have RLS enforcement. Implement authorization checks in application code.
- **Transactions**: Use `withTransaction()` helper from `@/lib/cockroachdb/client`
- **Performance**: Connection pooling is handled automatically (max 20 connections)
- **SSL**: Configured automatically if certificate exists at `~/.postgresql/root.crt`

## References

- CockroachDB Client: `src/lib/cockroachdb/client.ts`
- TableQueryBuilder API: Lines 138-338 in `client.ts`
- Auth helpers: `src/lib/auth/account.ts`
