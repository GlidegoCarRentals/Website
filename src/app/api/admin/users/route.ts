import { requireRole } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireRole(['admin'])
  if (!auth.ok) return (auth as { response: ReturnType<typeof NextResponse.json> }).response

  const { supabase } = auth

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ users: data })
}
