import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.headers.get('x-session-id')
    if (!sessionId) {
      return NextResponse.json({ error: 'Session required' }, { status: 401 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('nama_toko, username, jenis_usaha')
      .eq('id', sessionId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error: any) {
    console.error('API /user/me Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}