import { requireRole } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, context: any) {
  const { id } = await context.params;
  const auth = await requireRole(['admin'])
  if (!auth.ok) return (auth as { response: ReturnType<typeof NextResponse.json> }).response

  const { role } = await req.json()

  if (!['guest', 'host', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const { supabase } = auth

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
