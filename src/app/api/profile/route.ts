import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/cockroachdb/server'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'
import type { Profile } from '@/types'

const MAX_NAME_LEN = 256
const MAX_EMAIL_LEN = 255
const MAX_AVATAR_URL_LEN = 2048

export async function GET() {
  try {
    const ctx = await getCurrentAccount()
    const db = createClient()

    const { data, error } = await db
      .from('profiles')
      .select('id, user_id, full_name, email, avatar_url, role, account_id, account_role, created_at, updated_at')
      .eq('user_id', ctx.userId)
      .single()

    if (error) {
      console.error('[GET /api/profile] fetch error:', error)
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: data as Profile })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getCurrentAccount()
    const db = createClient()

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    // Validate and add full_name if provided
    if ('full_name' in body) {
      const rawName = body.full_name
      if (typeof rawName !== 'string') {
        return NextResponse.json({ error: "'full_name' must be a string" }, { status: 400 })
      }
      const name = rawName.trim()
      if (name.length === 0) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 })
      }
      if (name.length > MAX_NAME_LEN) {
        return NextResponse.json(
          { error: `Full name must be ${MAX_NAME_LEN} characters or fewer` },
          { status: 400 },
        )
      }
      updateData.full_name = name
    }

    // Validate and add email if provided
    if ('email' in body) {
      const rawEmail = body.email
      if (typeof rawEmail !== 'string') {
        return NextResponse.json({ error: "'email' must be a string" }, { status: 400 })
      }
      const email = rawEmail.trim().toLowerCase()
      if (email.length === 0) {
        return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 })
      }
      if (email.length > MAX_EMAIL_LEN) {
        return NextResponse.json(
          { error: `Email must be ${MAX_EMAIL_LEN} characters or fewer` },
          { status: 400 },
        )
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      updateData.email = email
    }

    // Validate and add avatar_url if provided
    if ('avatar_url' in body) {
      const rawUrl = body.avatar_url
      if (rawUrl !== null && typeof rawUrl !== 'string') {
        return NextResponse.json({ error: "'avatar_url' must be a string or null" }, { status: 400 })
      }
      if (rawUrl !== null) {
        const url = rawUrl.trim()
        if (url.length === 0) {
          return NextResponse.json({ error: 'Avatar URL cannot be empty' }, { status: 400 })
        }
        if (url.length > MAX_AVATAR_URL_LEN) {
          return NextResponse.json(
            { error: `Avatar URL must be ${MAX_AVATAR_URL_LEN} characters or fewer` },
            { status: 400 },
          )
        }
        try {
          new URL(url)
        } catch {
          return NextResponse.json({ error: 'Invalid URL format for avatar_url' }, { status: 400 })
        }
        updateData.avatar_url = url
      } else {
        updateData.avatar_url = null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Request must include at least one of: full_name, email, avatar_url' },
        { status: 400 },
      )
    }

    const { data, error } = await db
      .from('profiles')
      .update(updateData)
      .eq('user_id', ctx.userId)
      .select('id, user_id, full_name, email, avatar_url, role, account_id, account_role, created_at, updated_at')
      .single()

    if (error) {
      console.error('[PATCH /api/profile] update error:', error)
      if ((error as any).code === '23505') {
        return NextResponse.json({ error: 'Email address is already in use' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: data as Profile })
  } catch (err) {
    return toErrorResponse(err)
  }
}
