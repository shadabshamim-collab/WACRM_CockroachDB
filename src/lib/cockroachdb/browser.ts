// Browser-safe client - does NOT connect to database directly
// Instead makes requests to API routes
// This is a facade that mimics Supabase client API

type QueryOptions = {
  headers?: Record<string, string>
}

class BrowserQueryBuilder {
  private table: string
  private selectFields: string = '*'
  private whereConditions: Map<string, any> = new Map()
  private orderByFields: string[] = []
  private limitValue: number | null = null
  private offsetValue: number | null = null

  constructor(table: string) {
    this.table = table
  }

  select(fields: string = '*'): this {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any): this {
    this.whereConditions.set(`${field}__eq`, value)
    return this
  }

  neq(field: string, value: any): this {
    this.whereConditions.set(`${field}__neq`, value)
    return this
  }

  gt(field: string, value: any): this {
    this.whereConditions.set(`${field}__gt`, value)
    return this
  }

  gte(field: string, value: any): this {
    this.whereConditions.set(`${field}__gte`, value)
    return this
  }

  lt(field: string, value: any): this {
    this.whereConditions.set(`${field}__lt`, value)
    return this
  }

  lte(field: string, value: any): this {
    this.whereConditions.set(`${field}__lte`, value)
    return this
  }

  in(field: string, values: any[]): this {
    this.whereConditions.set(`${field}__in`, values)
    return this
  }

  order(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByFields.push(`${field}:${direction}`)
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

  private buildQueryString(): string {
    const params = new URLSearchParams()

    if (this.selectFields !== '*') {
      params.append('select', this.selectFields)
    }

    this.whereConditions.forEach((value, key) => {
      if (Array.isArray(value)) {
        params.append(key, JSON.stringify(value))
      } else {
        params.append(key, String(value))
      }
    })

    if (this.orderByFields.length > 0) {
      params.append('order', this.orderByFields.join(','))
    }

    if (this.limitValue !== null) {
      params.append('limit', String(this.limitValue))
    }

    if (this.offsetValue !== null) {
      params.append('offset', String(this.offsetValue))
    }

    return params.toString()
  }

  async select_all(): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const queryString = this.buildQueryString()
      const url = `/api/db/query?table=${this.table}&${queryString}`

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async insert(data: Record<string, any>): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const response = await fetch(`/api/db/query?table=${this.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(data: Record<string, any>): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const queryString = this.buildQueryString()
      const url = `/api/db/query?table=${this.table}&${queryString}`

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      return { data: result.data || [], error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete(): Promise<{ data: any[]; error: null } | { data: null; error: any }> {
    try {
      const queryString = this.buildQueryString()
      const url = `/api/db/query?table=${this.table}&${queryString}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      return { data: result.data || [], error: null }
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
}

export class BrowserCockroachDBClient {
  from(table: string): BrowserQueryBuilder {
    return new BrowserQueryBuilder(table)
  }

  auth = {
    getUser: async () => {
      try {
        const response = await fetch('/api/auth/user')
        const result = await response.json()
        return { data: { user: result.user }, error: null }
      } catch (error) {
        return { data: { user: null }, error }
      }
    },

    getSession: async () => {
      try {
        const response = await fetch('/api/auth/session')
        const result = await response.json()
        return { data: { session: result.session }, error: null }
      } catch (error) {
        return { data: { session: null }, error }
      }
    },

    signOut: async () => {
      try {
        await fetch('/api/auth/signout', { method: 'POST' })
        return { error: null }
      } catch (error) {
        return { error }
      }
    },
  }
}

// Browser client singleton
let browserClient: BrowserCockroachDBClient | undefined

export function createBrowserClient(): BrowserCockroachDBClient {
  if (typeof window === 'undefined') {
    throw new Error('Browser client should only be used in browser environment')
  }

  if (!browserClient) {
    browserClient = new BrowserCockroachDBClient()
  }

  return browserClient
}

export default createBrowserClient()
