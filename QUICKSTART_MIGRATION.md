# Quick Start: Supabase → CockroachDB Migration

Get up and running in 5 minutes.

## Prerequisites

- Node.js 20+
- `psql` command-line tool installed
- CockroachDB cluster created (✅ done: aware-oribi-27794)

## Quick Steps (Copy & Paste)

### 1️⃣ Download SSL Certificate

```bash
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
```

### 2️⃣ Set Environment Variables

```bash
# Create .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://shadb_pilot:qx2fuDg01oYIgf-OOpLDpQ@aware-oribi-27794.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full
DATABASE_SSL_MODE=verify-full
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRY=7d

# Keep existing variables from your current .env.local:
ENCRYPTION_KEY=your-existing-key
META_APP_SECRET=your-existing-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

Or manually: `cp .env.cockroachdb.example .env.local` and update values.

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Test Database Connection

```bash
npm run db:test
```

Expected output:
```
✅ Connection successful!
✅ Found 26 tables
```

### 5️⃣ Create Database Schema

```bash
npm run db:migrate
```

Or manually:
```bash
psql "$DATABASE_URL" < migrations/001-cockroachdb-schema.sql
```

### 6️⃣ Verify Setup

```bash
npm run typecheck
npm run build
```

## That's It! ✅

Your CockroachDB is now ready. Next: [Update Code Imports](#code-migration)

---

## Code Migration

### Before (Supabase)
```typescript
import { createClient } from '@/lib/supabase/server'
```

### After (CockroachDB)
```typescript
import { createClient } from '@/lib/cockroachdb/server'
```

**The rest of the code stays the same!**

### Files to Update (in order):

1. `src/hooks/use-auth.tsx` - Profile loading
2. `src/middleware.ts` - Session handling
3. `src/app/api/**/*.ts` - All API routes (29 files)
4. `src/lib/auth/*.ts` - Auth helpers

Find and replace:
```bash
# Find all files using Supabase
grep -r "@/lib/supabase" src/

# Replace in each file:
# @/lib/supabase/server → @/lib/cockroachdb/server
# @/lib/supabase/client → @/lib/cockroachdb/server (on server)
```

---

## Troubleshooting

### ❌ "SSL certificate error"
```
Error: self signed certificate
```
**Solution:**
```bash
# Re-download certificate
curl --create-dirs -o $HOME/.postgresql/root.crt \
  'https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'

# Verify it exists
ls -la $HOME/.postgresql/root.crt
```

### ❌ "Connection refused"
```
Error: connect ECONNREFUSED
```
**Solution:**
- Verify DATABASE_URL is correct: `echo $DATABASE_URL`
- Check internet connection to CockroachDB Cloud
- Verify cluster is running in CockroachDB console

### ❌ "No tables found"
```
⚠️  No tables found
```
**Solution:**
```bash
npm run db:migrate
```

### ❌ "npm install fails"
```
npm ERR! code ERESOLVE
```
**Solution:**
```bash
npm install --legacy-peer-deps
```

---

## Next Steps

1. ✅ Database ready
2. 📝 Update imports (2-3 hours)
3. 🔐 Set up authentication (1-2 hours)
4. ⚡ Replace real-time (30 mins)
5. 🧪 Test (1-2 hours)
6. 🚀 Deploy

See `MIGRATION_GUIDE.md` for detailed steps.

---

## Commands Reference

```bash
# Test connection
npm run db:test

# Create schema
npm run db:migrate

# Type check
npm run typecheck

# Build
npm run build

# Run dev server
npm run dev

# Find Supabase imports
grep -r "@supabase" src/
grep -r "@/lib/supabase" src/
```

---

## Need Help?

- **Connection Issues**: Run `npm run db:test`
- **Schema Questions**: See `MIGRATION_GUIDE.md`
- **CockroachDB Docs**: https://www.cockroachlabs.com/docs/stable/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

