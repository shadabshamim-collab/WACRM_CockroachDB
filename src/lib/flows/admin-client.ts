import { createClient, type CockroachDBClient } from '@/lib/cockroachdb/server'

// Lazy, shared client for the Flows engine.
// Mirrors src/lib/automations/admin-client.ts — same shape so anyone
// reading either file picks up the convention immediately.
let _adminClient: CockroachDBClient | null = null

export function supabaseAdmin(): CockroachDBClient {
  if (!_adminClient) {
    _adminClient = createClient()
  }
  return _adminClient
}
