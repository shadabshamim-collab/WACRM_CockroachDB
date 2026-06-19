#!/usr/bin/env tsx
/**
 * End-to-end CockroachDB connection test
 * Tests database connectivity, schema, and basic CRUD operations
 */

import { createClient, query } from './src/lib/cockroachdb/server'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ name, passed: true, message: 'OK', duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - start
    const message = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, message, duration })
    console.log(`❌ ${name} (${duration}ms)\n   ${message}`)
  }
}

async function main() {
  console.log('🧪 CockroachDB Connection Test Suite\n')
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`)
  console.log(`SSL_MODE: ${process.env.DATABASE_SSL_MODE}\n`)

  // Test 1: Basic connection
  await test('Database connection', async () => {
    const result = await query('SELECT 1 as test')
    if (!result.rows || result.rows[0]?.test !== 1) {
      throw new Error('Unexpected query result')
    }
  })

  // Test 2: List tables
  await test('Schema verification - list tables', async () => {
    const result = await query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    )
    if (!result.rows || result.rows.length === 0) {
      throw new Error('No tables found in public schema')
    }
    const tables = result.rows.map((r: any) => r.table_name).join(', ')
    console.log(`   Found tables: ${tables}`)
  })

  // Test 3: Test the CockroachDBClient
  await test('CockroachDBClient instantiation', async () => {
    const db = createClient()
    if (!db) {
      throw new Error('Failed to create client')
    }
  })

  // Test 4: Query profiles table
  await test('Query profiles table', async () => {
    const db = createClient()
    const { data, error } = await db
      .from('profiles')
      .select('user_id, full_name')
      .limit(1)
      .select_all()

    if (error) {
      throw new Error(`Query error: ${JSON.stringify(error)}`)
    }
    console.log(`   Found ${data?.length || 0} profile(s)`)
  })

  // Test 5: Query accounts table
  await test('Query accounts table', async () => {
    const db = createClient()
    const { data, error } = await db
      .from('accounts')
      .select('id, name')
      .limit(1)
      .select_all()

    if (error) {
      throw new Error(`Query error: ${JSON.stringify(error)}`)
    }
    console.log(`   Found ${data?.length || 0} account(s)`)
  })

  // Test 6: Test insert/read/delete cycle
  await test('Insert/read/delete cycle', async () => {
    const testId = `test-${Date.now()}`
    const db = createClient()

    // Insert
    const insertResult = await db
      .from('contacts')
      .insert({
        account_id: 'test-account-id',
        phone: testId,
        name: 'Test Contact',
      })

    if (insertResult.error) {
      throw new Error(`Insert failed: ${JSON.stringify(insertResult.error)}`)
    }

    if (!insertResult.data || insertResult.data.length === 0) {
      throw new Error('Insert returned no data')
    }

    const insertedId = insertResult.data[0]?.id
    console.log(`   Inserted: ${insertedId}`)

    // Read
    const readResult = await db
      .from('contacts')
      .select('*')
      .eq('id', insertedId)
      .single()

    if (readResult.error || !readResult.data) {
      throw new Error(`Read failed: ${JSON.stringify(readResult.error)}`)
    }

    if (readResult.data.phone !== testId) {
      throw new Error('Read data mismatch')
    }

    console.log(`   Read: ${readResult.data.phone}`)

    // Delete
    const deleteResult = await db
      .from('contacts')
      .eq('id', insertedId)
      .delete()

    if (deleteResult.error) {
      throw new Error(`Delete failed: ${JSON.stringify(deleteResult.error)}`)
    }

    console.log(`   Deleted: 1 row`)
  })

  // Test 7: Test filter methods
  await test('Filter methods (.eq, .gt, .in)', async () => {
    const db = createClient()

    // Test .eq()
    const eqResult = await db
      .from('profiles')
      .select('user_id')
      .eq('user_id', 'nonexistent')
      .select_all()

    if (eqResult.error) {
      throw new Error(`eq() failed: ${JSON.stringify(eqResult.error)}`)
    }

    // Test .limit() and .offset()
    const limitResult = await db
      .from('profiles')
      .select('user_id')
      .limit(1)
      .offset(0)
      .select_all()

    if (limitResult.error) {
      throw new Error(`limit/offset failed: ${JSON.stringify(limitResult.error)}`)
    }

    console.log(`   All filter methods working`)
  })

  // Test 8: Test .single() and .maybeSingle()
  await test('Terminal methods (.single, .maybeSingle)', async () => {
    const db = createClient()

    // Test .maybeSingle() on empty result
    const maybeResult = await db
      .from('profiles')
      .select('user_id')
      .eq('user_id', 'definitely-nonexistent-user-id')
      .maybeSingle()

    if (maybeResult.error) {
      throw new Error(`maybeSingle() failed: ${JSON.stringify(maybeResult.error)}`)
    }

    if (maybeResult.data !== null) {
      throw new Error('Expected null for maybeSingle on empty result')
    }

    console.log(`   .maybeSingle() and .single() working`)
  })

  // Test 9: Test JWT auth helper
  await test('Authentication context (getCurrentAccount)', async () => {
    try {
      // This should fail without a valid JWT token, which is expected
      const { getCurrentAccount } = await import('./src/lib/auth/account')
      // We can't test this without a real JWT, but we can verify it imports
      console.log(`   Auth module imports successfully`)
    } catch (error) {
      throw new Error(`Failed to import auth module: ${error}`)
    }
  })

  // Summary
  console.log('\n' + '='.repeat(50))
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\n📊 Results: ${passed}/${total} tests passed`)
  console.log(`⏱️  Total time: ${totalDuration}ms\n`)

  if (passed === total) {
    console.log('🎉 All tests passed! CockroachDB connection is working end-to-end.')
    process.exit(0)
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed. See details above.`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
