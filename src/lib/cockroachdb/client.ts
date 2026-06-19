let Pool: any, PoolClient: any, QueryResult: any
let fs: any, path: any

// Only import Node.js modules on the server
if (typeof window === 'undefined') {
  const pgModule = require('pg')
  Pool = pgModule.Pool
  PoolClient = pgModule.PoolClient
  QueryResult = pgModule.QueryResult
  fs = require('fs')
  path = require('path')
}

export class PostgrestError extends Error {
  constructor(public message: string, public code?: string, public details?: string, public hint?: string) {
    super(message)
    this.name = 'PostgrestError'
  }
}

let pool: Pool | null = null

// Initialize connection pool to CockroachDB
function initializePool(): Pool {
  if (pool) return pool

  const sslCertPath = path.join(process.env.HOME || '', '.postgresql', 'root.crt')
  const sslMode = process.env.DATABASE_SSL_MODE || 'verify-full'

  const connectionString = process.env.DATABASE_URL || ''

  const poolConfig: any = {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }

  // Add SSL config if certificate exists
  if (fs.existsSync(sslCertPath)) {
    poolConfig.ssl = {
      ca: fs.readFileSync(sslCertPath).toString(),
      rejectUnauthorized: sslMode === 'verify-full',
    }
  } else if (sslMode === 'verify-full') {
    poolConfig.ssl = {
      rejectUnauthorized: true,
    }
  }

  pool = new Pool(poolConfig)

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  return pool
}

// Query helper with proper error handling
export async function query(sql: string, values?: any[]): Promise<QueryResult> {
  const pool = initializePool()
  const client = await pool.connect()

  try {
    return await client.query(sql, values)
  } finally {
    client.release()
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = initializePool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Adapter class to provide Supabase-like API
export class CockroachDBClient {
  private pool: Pool

  constructor() {
    if (typeof window !== 'undefined') {
      throw new Error('CockroachDBClient cannot be used in browser context. Use API endpoints instead.')
    }
    this.pool = initializePool()
  }

  // from() - creates a query builder for a table
  from(table: string): TableQueryBuilder {
    return new TableQueryBuilder(this.pool, table)
  }

  // auth - placeholder for auth methods (Supabase compatibility stubs)
  auth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async (...args: any[]) => ({ data: null, error: { message: 'Auth not implemented' } as any }),
    signUp: async (...args: any[]) => ({ data: null, error: { message: 'Auth not implemented' } as any }),
    signInWithPassword: async (...args: any[]) => ({ data: null, error: { message: 'Auth not implemented' } as any }),
    onAuthStateChange: (...args: any[]) => ({ data: { subscription: { unsubscribe: () => {} } } } as any),
  }

  // rpc - placeholder for RPC calls (Supabase compatibility)
  rpc(name: string, params?: any) {
    return {
      then: async (callback: any) => {
        console.warn(`[CockroachDB] RPC call '${name}' not yet implemented, returning null`)
        return callback({ data: null, error: null })
      }
    }
  }

  // Close the pool
  async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }
}

// Table query builder - similar to Supabase's
export class TableQueryBuilder {
  private pool: Pool
  private table: string
  private selectFields: string[] = []
  private whereConditions: Array<{ field: string; operator: string; value: any }> = []
  private orderByFields: Array<{ field: string; direction: 'ASC' | 'DESC' }> = []
  private limitValue: number | null = null
  private offsetValue: number | null = null

  constructor(pool: Pool, table: string) {
    this.pool = pool
    this.table = table
  }

  select(fields: string = '*'): this {
    if (fields === '*') {
      this.selectFields = ['*']
    } else {
      this.selectFields = fields.split(',').map((f) => f.trim())
    }
    return this
  }

  eq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '=', value })
    return this
  }

  neq(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '!=', value })
    return this
  }

  gt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '>', value })
    return this
  }

  gte(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '>=', value })
    return this
  }

  lt(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '<', value })
    return this
  }

  lte(field: string, value: any): this {
    this.whereConditions.push({ field, operator: '<=', value })
    return this
  }

  in(field: string, values: any[]): this {
    this.whereConditions.push({ field, operator: 'IN', value: values })
    return this
  }

  order(field: string, options?: 'asc' | 'desc' | { ascending?: boolean }): this {
    let direction: 'ASC' | 'DESC' = 'ASC'

    if (typeof options === 'string') {
      direction = options.toUpperCase() as 'ASC' | 'DESC'
    } else if (typeof options === 'object' && options.ascending === false) {
      direction = 'DESC'
    }

    this.orderByFields.push({ field, direction })
    return this
  }

  limit(count: number): this {
    this.limitValue = count
    return this
  }

  offset(count: number): this {
    this.offsetValue = count
    return this
  }

  private buildWhereClause(): { sql: string; values: any[] } {
    if (this.whereConditions.length === 0) {
      return { sql: '', values: [] }
    }

    const values: any[] = []
    let paramIndex = 1
    const conditions = this.whereConditions
      .map(({ field, operator, value }) => {
        if (operator === 'IN') {
          const placeholders = value.map(() => `$${paramIndex++}`).join(',')
          values.push(...value)
          return `${field} ${operator} (${placeholders})`
        } else {
          values.push(value)
          return `${field} ${operator} $${paramIndex++}`
        }
      })
      .join(' AND ')

    return { sql: `WHERE ${conditions}`, values }
  }

  private buildOrderClause(): string {
    if (this.orderByFields.length === 0) return ''
    const clause = this.orderByFields
      .map(({ field, direction }) => `${field} ${direction}`)
      .join(', ')
    return `ORDER BY ${clause}`
  }

  private buildLimitClause(): string {
    let clause = ''
    if (this.limitValue !== null) clause += `LIMIT ${this.limitValue}`
    if (this.offsetValue !== null) clause += ` OFFSET ${this.offsetValue}`
    return clause
  }

  async select_all(): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const { sql: whereClause, values } = this.buildWhereClause()
      const orderClause = this.buildOrderClause()
      const limitClause = this.buildLimitClause()
      const selectFields = this.selectFields.length > 0 ? this.selectFields.join(', ') : '*'

      const sql = `SELECT ${selectFields} FROM ${this.table} ${whereClause} ${orderClause} ${limitClause}`.trim()

      const result = await this.pool.query(sql, values)
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async insert(data: Record<string, any>): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const keys = Object.keys(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const values = keys.map((k) => data[k])

      const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`

      const result = await this.pool.query(sql, values)
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(data: Record<string, any>): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const { sql: whereClause, values: whereValues } = this.buildWhereClause()
      const keys = Object.keys(data)
      const paramStart = whereValues.length + 1

      const setClause = keys
        .map((key, i) => `${key} = $${paramStart + i}`)
        .join(', ')
      const allValues = [...whereValues, ...keys.map((k) => data[k])]

      const sql = `UPDATE ${this.table} SET ${setClause} ${whereClause} RETURNING *`.trim()

      const result = await this.pool.query(sql, allValues)
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete(): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const { sql: whereClause, values } = this.buildWhereClause()

      if (whereClause === '') {
        throw new Error('DELETE requires WHERE clause for safety')
      }

      const sql = `DELETE FROM ${this.table} ${whereClause} RETURNING *`.trim()

      const result = await this.pool.query(sql, values)
      return { data: result.rows, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async single(): Promise<{ data: any; error: null } | { data: null; error: any }> {
    try {
      const { data, error } = await this.select_all()
      if (error) return { data: null, error }
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async maybeSingle(): Promise<{ data: any; error: null } | { data: null; error: any }> {
    return this.single()
  }
}

// Export singleton instance
export function createClient(): CockroachDBClient {
  return new CockroachDBClient()
}

export default createClient()
