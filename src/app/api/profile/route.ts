import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      user_id, 
      nama_toko, 
      nama_pemilik, 
      jenis_usaha,
      no_wa,
      alamat_toko,
      keterangan_pembayaran,
      catatan_nota,
      logo_url
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        nama_toko: nama_toko || null,
        nama_pemilik: nama_pemilik || null,
        jenis_usaha: jenis_usaha || null,
        no_wa: no_wa || null,
        alamat_toko: alamat_toko || null,
        keterangan_pembayaran: keterangan_pembayaran || null,
        catatan_nota: catatan_nota || null,
        logo_url: logo_url || null
      })
      .eq('id', user_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        nama_toko: data.nama_toko,
        nama_pemilik: data.nama_pemilik,
        jenis_usaha: data.jenis_usaha,
        no_wa: data.no_wa,
        alamat_toko: data.alamat_toko,
        keterangan_pembayaran: data.keterangan_pembayaran,
        catatan_nota: data.catatan_nota,
        logo_url: data.logo_url
      }
    })
  } catch (error: any) {
    console.error('API Profile Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('API Profile GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}