// This module is server-only and should only be imported in server contexts
// (API routes, server components, middleware, etc.)

import { CockroachDBClient, PostgrestError, query as dbQuery } from './client'

// Server-side client - can use service role key and environment variables
let serverClient: CockroachDBClient | undefined

export function createClient(): CockroachDBClient {
  if (serverClient) return serverClient
  serverClient = new CockroachDBClient()
  return serverClient
}

export async function getServerClient(): Promise<CockroachDBClient> {
  return createClient()
}

// Export query helper for direct SQL execution
export const query = dbQuery

// Re-export for convenience
export { CockroachDBClient, PostgrestError }
