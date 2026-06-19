#!/usr/bin/env node

/**
 * Run Database Migration
 * Reads the SQL file and executes it against CockroachDB
 */

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  console.log('🚀 Running CockroachDB migration...\n')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sslCertPath = path.join(process.env.HOME || '', '.postgresql', 'root.crt')
  const certExists = fs.existsSync(sslCertPath)

  const poolConfig: any = {
    connectionString: databaseUrl,
    max: 1,
  }

  if (certExists) {
    poolConfig.ssl = {
      ca: fs.readFileSync(sslCertPath).toString(),
      rejectUnauthorized: true,
    }
  }

  const pool = new Pool(poolConfig)

  try {
    console.log('📄 Reading migration file...')
    const migrationPath = path.join(process.cwd(), 'migrations', '001-cockroachdb-schema.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    console.log(`✅ Read ${sql.length} bytes\n`)

    console.log('⏳ Connecting to CockroachDB...')
    const client = await pool.connect()
    console.log('✅ Connected\n')

    console.log('⏳ Executing migration...')
    await client.query(sql)
    console.log('✅ Migration completed successfully!\n')

    client.release()

    // Verify tables
    console.log('⏳ Verifying tables...')
    const client2 = await pool.connect()
    const result = await client2.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `)
    client2.release()

    console.log(`✅ Found ${result.rows.length} tables:\n`)
    result.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`)
    })

    console.log('\n✅ Database migration complete!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Migration failed!\n')
    console.error('Error:', error.message)
    if (error.detail) console.error('Detail:', error.detail)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
