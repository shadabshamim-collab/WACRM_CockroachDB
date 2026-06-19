// CockroachDB client exports
// Automatically chooses between server and browser implementations

export { createClient } from './server'
export { createBrowserClient } from './browser'
export { CockroachDBClient, TableQueryBuilder, query, withTransaction, PostgrestError } from './client'

// Default export
let defaultClient: InstanceType<typeof CockroachDBClient> | null = null
const getDefaultClient = () => {
  if (!defaultClient) {
    const { createClient: create } = require('./server')
    defaultClient = create()
  }
  return defaultClient
}

export default getDefaultClient()
