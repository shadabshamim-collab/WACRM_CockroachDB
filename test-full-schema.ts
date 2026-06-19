import { query } from './src/lib/cockroachdb/server'

async function test() {
  try {
    // Get all tables and row counts
    const tablesResult = await query(
      `SELECT table_name 
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    )
    
    const tables = tablesResult.rows?.map((r: any) => r.table_name) || []
    
    console.log(`📊 Database Schema (${tables.length} tables)\n`)
    
    for (const table of tables) {
      // Count rows
      const countResult = await query(`SELECT COUNT(*) as cnt FROM "${table}"`)
      const count = countResult.rows?.[0]?.cnt || 0
      
      // Get columns
      const colResult = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = '${table}'
         ORDER BY ordinal_position`
      )
      const columns = colResult.rows?.map((r: any) => r.column_name).join(', ') || ''
      
      console.log(`${table} (${count} rows)`)
      console.log(`  Columns: ${columns}\n`)
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

test()
