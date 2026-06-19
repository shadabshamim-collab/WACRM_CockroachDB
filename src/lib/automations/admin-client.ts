import { createClient, type CockroachDBClient } from '@/lib/cockroachdb/server'

// Lazy, shared client for automation engine work.
let _adminClient: CockroachDBClient | null = null

export function supabaseAdmin(): CockroachDBClient {
  if (!_adminClient) {
    _adminClient = createClient()
  }
  return _adminClient
}
