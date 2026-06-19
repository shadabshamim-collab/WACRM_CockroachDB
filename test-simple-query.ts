import { createClient, query } from './src/lib/cockroachdb/server'

async function test() {
  console.log('Testing simple raw SQL query...')
  
  try {
    const result = await query('SELECT id, full_name FROM profiles LIMIT 1')
    console.log('✅ Raw query works')
    console.log('Profiles found:', result.rows?.length || 0)
    if (result.rows?.[0]) {
      console.log('Sample:', result.rows[0])
    }
  } catch (error) {
    console.error('❌ Raw query failed:', error)
  }

  console.log('\nTesting TableQueryBuilder...')
  try {
    const db = createClient()
    const result = await db
      .from('profiles')
      .select('*')
      .select_all()
    
    console.log('✅ Builder query works')
    console.log('Profiles found:', result.data?.length || 0)
    if (result.data?.[0]) {
      console.log('Sample:', Object.keys(result.data[0]).slice(0, 5))
    }
  } catch (error) {
    console.error('❌ Builder query failed:', error)
  }
}

test()
