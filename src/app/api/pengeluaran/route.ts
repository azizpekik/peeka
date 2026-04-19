import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateWebhookSecret } from '@/lib/utils'
import { ApiResponse, Pengeluaran } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await req.json()
    const { telegram_id, kategori, nominal, catatan } = body

    // Validasi input
    if (!telegram_id || !nominal || nominal <= 0) {
      return NextResponse.json(
        { error: 'telegram_id dan nominal wajib diisi' } as ApiResponse<null>,
        { status: 400 }
      )
    }

    // Cari user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' } as ApiResponse<null>,
        { status: 404 }
      )
    }

    // Insert pengeluaran
    const { data: pengeluaran, error } = await supabaseAdmin
      .from('pengeluaran')
      .insert({
        user_id: user.id,
        kategori: kategori || 'lain_lain',
        nominal: parseInt(nominal),
        catatan: catatan || null
      })
      .select()
      .single()

    if (error || !pengeluaran) {
      throw new Error(error?.message || 'Gagal simpan pengeluaran')
    }

    return NextResponse.json({
      data: pengeluaran,
      message: 'Pengeluaran berhasil disimpan'
    } as ApiResponse<Pengeluaran>)

  } catch (error) {
    console.error('Error pengeluaran:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const telegram_id = searchParams.get('telegram_id')
  const tanggal = searchParams.get('tanggal')

  if (!telegram_id) {
    return NextResponse.json(
      { error: 'telegram_id required' },
      { status: 400 }
    )
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_id', telegram_id)
    .single()

  if (!user) {
    return NextResponse.json(
      { error: 'User tidak ditemukan' },
      { status: 404 }
    )
  }

  let query = supabaseAdmin
    .from('pengeluaran')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (tanggal) {
    query = query.eq('tanggal', tanggal)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pengeluaran_id, kategori, nominal, catatan } = body

    if (!pengeluaran_id || !nominal || nominal <= 0) {
      return NextResponse.json(
        { error: 'pengeluaran_id dan nominal wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('pengeluaran')
      .update({
        kategori: kategori || 'lain_lain',
        nominal: parseInt(nominal),
        catatan: catatan || null,
      })
      .eq('id', pengeluaran_id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Gagal update pengeluaran')
    }

    return NextResponse.json({
      data,
      message: 'Pengeluaran berhasil diupdate'
    })

  } catch (error) {
    console.error('Error update pengeluaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret') || ''
    if (!validateWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pengeluaran_id = searchParams.get('pengeluaran_id')

    if (!pengeluaran_id) {
      return NextResponse.json(
        { error: 'pengeluaran_id wajib diisi' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('pengeluaran')
      .delete()
      .eq('id', pengeluaran_id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ message: 'Pengeluaran berhasil dihapus' })

  } catch (error) {
    console.error('Error delete pengeluaran:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}