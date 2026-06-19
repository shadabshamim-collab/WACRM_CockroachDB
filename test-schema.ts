import { query } from './src/lib/cockroachdb/server'

async function test() {
  console.log('Checking profiles table schema...\n')
  
  try {
    // Get column info for profiles table
    const result = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'profiles'
       ORDER BY ordinal_position`
    )
    
    console.log('Profiles table columns:')
    result.rows?.forEach((row: any) => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`)
    })

    console.log('\nChecking accounts table schema...\n')
    const accountsResult = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'accounts'
       ORDER BY ordinal_position`
    )
    
    console.log('Accounts table columns:')
    accountsResult.rows?.forEach((row: any) => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`)
    })

    console.log('\nFetching first profile...\n')
    const profileResult = await query('SELECT * FROM profiles LIMIT 1')
    console.log('First profile:')
    console.log(JSON.stringify(profileResult.rows?.[0], null, 2))

  } catch (error) {
    console.error('Error:', error)
  }
}

test()
