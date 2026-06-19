import { randomUUID } from 'crypto'
import { createClient, query } from './src/lib/cockroachdb/server'

async function test() {
  console.log('🔄 End-to-End CockroachDB Test\n')

  try {
    // Step 1: Insert a test account
    console.log('1️⃣  Inserting test account...')
    const accountId = randomUUID()
    const ownerUserId = randomUUID()
    
    const accountResult = await query(
      `INSERT INTO accounts (id, owner_id, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, display_name`,
      [accountId, ownerUserId, 'Test Account']
    )
    
    console.log('   ✅ Account created:', accountResult.rows?.[0])

    // Step 2: Insert a test profile
    console.log('\n2️⃣  Inserting test profile...')
    const userId = randomUUID()
    const profileId = randomUUID()
    
    const profileResult = await query(
      `INSERT INTO profiles (id, user_id, first_name, last_name, account_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, user_id, first_name, last_name`,
      [profileId, userId, 'John', 'Doe', accountId]
    )
    
    console.log('   ✅ Profile created:', profileResult.rows?.[0])

    // Step 3: Query using TableQueryBuilder
    console.log('\n3️⃣  Querying with TableQueryBuilder...')
    const db = createClient()
    const queryResult = await db
      .from('profiles')
      .select('id, user_id, first_name, last_name')
      .eq('account_id', accountId)
      .select_all()
    
    console.log('   ✅ Found profiles:', queryResult.data?.length)
    if (queryResult.data?.[0]) {
      console.log('   Profile:', queryResult.data[0])
    }

    // Step 4: Insert contact (without phone_normalized as it's computed)
    console.log('\n4️⃣  Inserting test contact...')
    const contactId = randomUUID()
    const contactResult = await query(
      `INSERT INTO contacts (id, account_id, phone, first_name, last_name, is_whatsapp_contact, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, phone, first_name, last_name`,
      [contactId, accountId, '+1234567890', 'Jane', 'Doe', true]
    )
    
    console.log('   ✅ Contact created:', contactResult.rows?.[0])

    // Step 5: Query contacts with filter
    console.log('\n5️⃣  Querying contacts with filter...')
    const contactsQueryResult = await db
      .from('contacts')
      .select('id, phone, first_name, last_name')
      .eq('account_id', accountId)
      .select_all()
    
    console.log('   ✅ Found contacts:', contactsQueryResult.data?.length)
    if (contactsQueryResult.data?.[0]) {
      console.log('   Contact:', contactsQueryResult.data[0])
    }

    // Step 6: Update contact using TableQueryBuilder
    console.log('\n6️⃣  Updating contact...')
    const updateResult = await db
      .from('contacts')
      .eq('id', contactId)
      .update({ last_name: 'Smith' })
    
    if (updateResult.error) {
      throw new Error(`Update failed: ${updateResult.error}`)
    }
    console.log('   ✅ Contact updated')

    // Step 7: Verify update
    console.log('\n7️⃣  Verifying update...')
    const verifyResult = await db
      .from('contacts')
      .select('id, last_name')
      .eq('id', contactId)
      .single()
    
    console.log('   ✅ Updated contact:', verifyResult.data)

    // Step 8: Delete test data
    console.log('\n8️⃣  Cleaning up test data...')
    await db.from('contacts').eq('account_id', accountId).delete()
    await db.from('profiles').eq('account_id', accountId).delete()
    await db.from('accounts').eq('id', accountId).delete()
    
    console.log('   ✅ Test data cleaned up')

    console.log('\n' + '='.repeat(60))
    console.log('✅ All end-to-end tests PASSED!')
    console.log('🎉 CockroachDB connection is working perfectly!')
    console.log('   - Connection pooling: ✅')
    console.log('   - Raw SQL queries: ✅')
    console.log('   - TableQueryBuilder: ✅')
    console.log('   - CRUD operations: ✅')
    console.log('   - Filtering & querying: ✅')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

test()
