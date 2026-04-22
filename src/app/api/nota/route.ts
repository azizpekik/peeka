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

    let query = supabaseAdmin
      .from('transaksi')
      .select(`
        *,
        transaksi_items (*),
        users (nama_toko, nama_pemilik, no_wa, alamat_toko, keterangan_pembayaran, catatan_nota, logo_url)
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

    const users = transaksi.users as any
    const logoUrl = users?.logo_url || ''

    const pdfBuffer = await renderToBuffer(
      // @ts-expect-error - react-pdf types are incompatible with createElement
      createElement(NotaPDF, {
        transaksi: {
          nomor_nota: transaksi.nomor_nota,
          tanggal: transaksi.tanggal,
          waktu: transaksi.waktu,
          total_nominal: transaksi.total_nominal,
          status_bayar: transaksi.status_bayar,
          nama_pelanggan: transaksi.nama_pelanggan,
          catatan: transaksi.catatan,
          transaksi_items: transaksi.transaksi_items
        },
        store: {
          nama_toko: users?.nama_toko || 'Toko',
          nama_pemilik: users?.nama_pemilik || '',
          no_wa: users?.no_wa || '',
          alamat_toko: users?.alamat_toko || '',
          keterangan_pembayaran: users?.keterangan_pembayaran || '',
          catatan_nota: users?.catatan_nota || '',
          logo_url: logoUrl
        }
      })
    )

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