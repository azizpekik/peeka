import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import NotaPDF from '@/components/NotaPDF'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const transaksi_id = searchParams.get('transaksi_id')
    const nomor_nota = searchParams.get('nomor_nota')

    if (!transaksi_id && !nomor_nota) {
      return NextResponse.json(
        { error: 'transaksi_id atau nomor_nota wajib diisi' },
        { status: 400 }
      )
    }

    // Fetch transaksi
    let query = supabaseAdmin
      .from('transaksi')
      .select(`
        *,
        transaksi_items (*),
        users (nama_toko)
      `)

    if (transaksi_id) {
      query = query.eq('id', transaksi_id)
    } else {
      query = query.eq('nomor_nota', nomor_nota)
    }

    const { data: transaksi, error } = await query.single()

    if (error || !transaksi) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Generate PDF
    const { users, ...transaksiData } = transaksi
    const pdfBuffer = await renderToBuffer(
    createElement(NotaPDF, {
        transaksi: transaksiData as any,
        namaToko: (users as any)?.nama_toko || 'Warung'
    })
    )

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="nota-${transaksi.nomor_nota}.pdf"`,
        'Cache-Control': 'no-store',
      }
    })

  } catch (error) {
    console.error('Error generate nota:', error)
    return NextResponse.json(
      { error: 'Gagal generate nota' },
      { status: 500 }
    )
  }
}