#!/usr/bin/env node

/**
 * Test CockroachDB Connection
 * Run with: npx ts-node scripts/test-db-connection.ts
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

async function testConnection() {
  console.log('🔍 Testing CockroachDB connection...\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in environment variables')
    process.exit(1)
  }

  console.log('📋 Connection Details:')
  console.log(`   URL: ${databaseUrl.replace(/:[^@]*@/, ':****@')}`)

  const sslCertPath = path.join(process.env.HOME || '', '.postgresql', 'root.crt')
  const certExists = fs.existsSync(sslCertPath)
  console.log(`   SSL Cert: ${certExists ? '✅ Found' : '❌ Not found'} (${sslCertPath})`)
  console.log()

  const poolConfig: any = {
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  }

  if (certExists) {
    poolConfig.ssl = {
      ca: fs.readFileSync(sslCertPath).toString(),
      rejectUnauthorized: true,
    }
  }

  const pool = new Pool(poolConfig)

  try {
    console.log('⏳ Connecting to CockroachDB...')
    const result = await pool.query('SELECT VERSION()')
    console.log('✅ Connection successful!\n')
    console.log('📊 Server Info:')
    console.log(`   ${result.rows[0].version}\n`)

    // Test table existence
    console.log('⏳ Checking tables...')
    const tableResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const tableCount = tableResult.rows.length
    console.log(`✅ Found ${tableCount} tables\n`)

    if (tableCount > 0) {
      console.log('📋 Tables:')
      tableResult.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`)
      })
    } else {
      console.log('⚠️  No tables found. Run migrations first:')
      console.log('   psql "$DATABASE_URL" < migrations/001-cockroachdb-schema.sql')
    }

    console.log('\n✅ All tests passed!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Connection failed!\n')
    console.error('Error Details:')
    console.error(`   ${error.message}\n`)

    if (error.code === 'ENOENT') {
      console.error('💡 SSL Certificate missing. Download it with:')
      console.error(
        '   curl --create-dirs -o $HOME/.postgresql/root.crt https://cockroachlabs.cloud/clusters/cded36cb-d04b-4de4-9670-524da4973fc8/cert'
      )
    } else if (error.message.includes('self signed certificate')) {
      console.error('💡 SSL certificate issue. Try:')
      console.error('   - Verify certificate is in ~/.postgresql/root.crt')
      console.error('   - Set DATABASE_SSL_MODE=require in .env.local')
    }

    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
