import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/cockroachdb/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const contactId = searchParams.get('contactId')

  if (!contactId) {
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('contact_tags')
    .select('*')
    .eq('contact_id', contactId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tags: data ?? [] })
}
