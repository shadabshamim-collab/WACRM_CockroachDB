import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/cockroachdb/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '0')
  const search = searchParams.get('search') || ''
  const PAGE_SIZE = 25

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},phone.ilike.${term},email.ilike.${term}`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      contacts: [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    })
  }

  // Fetch tags for these contacts
  const contactIds = data.map((c) => c.id)
  const { data: contactTags } = await supabase
    .from('contact_tags')
    .select('contact_id, tag_id')
    .in('contact_id', contactIds)

  // Fetch all tags
  const { data: allTags } = await supabase.from('tags').select('*')

  const tagsMap: Record<string, any> = {}
  allTags?.forEach((t) => (tagsMap[t.id] = t))

  const tagsByContact: Record<string, string[]> = {}
  contactTags?.forEach((ct) => {
    if (!tagsByContact[ct.contact_id]) tagsByContact[ct.contact_id] = []
    tagsByContact[ct.contact_id].push(ct.tag_id)
  })

  const enriched = data.map((c) => ({
    ...c,
    tags: (tagsByContact[c.id] ?? [])
      .map((tid) => tagsMap[tid])
      .filter(Boolean),
  }))

  return NextResponse.json({
    contacts: enriched,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
