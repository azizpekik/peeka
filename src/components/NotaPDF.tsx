import {
  Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: '35px 40px',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  logoImg: {
    width: 100,
    height: 100,
    borderRadius: 8,
    objectFit: 'cover',
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  brandInfo: {
    gap: 3,
  },
  storeName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  storeMeta: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },

  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  refTable: {
    marginTop: 4,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  refLabel: {
    fontSize: 8,
    color: '#9ca3af',
  },
  refValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },

  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e7eb',
    marginBottom: 20,
  },

  infoSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  infoCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
  },
  infoCardHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoCardName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    textTransform: 'uppercase',
  },

  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#fffbeb',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  colProduct: { flex: 4 },
  colDesc: { flex: 2 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colDisc: { flex: 1, textAlign: 'right' },
  colTax: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 2, textAlign: 'right' },

  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  summaryCard: {
    width: 260,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'right',
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 6,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#f59e0b',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  summaryTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  summaryDpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 6,
    borderTopWidth: 0,
    borderTopColor: '#f59e0b',
  },
  summaryDpLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  summaryDpValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  summarySisaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summarySisaLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },
  summarySisaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
  },

  footer: {
    position: 'absolute',
    bottom: 35,
    left: 40,
    right: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerSection: {
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  footerBank: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerBrand: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerBrandLink: {
    fontSize: 8,
    color: '#f59e0b',
    fontFamily: 'Helvetica-Bold',
  },
})

const fmtRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

interface NotaPDFProps {
  transaksi: {
    nomor_nota: string
    tanggal: string
    waktu: string
    total_nominal: number
    status_bayar: string
    nama_pelanggan: string | null
    catatan: string | null
    transaksi_items: {
      nama_item: string
      harga: number
      qty: number
      subtotal: number
    }[]
  }
  store: {
    nama_toko: string
    nama_pemilik: string
    no_wa: string
    alamat_toko: string
    keterangan_pembayaran: string
    catatan_nota: string
    logo_url: string
  }
}

export default function NotaPDF({ transaksi, store }: NotaPDFProps) {
  const isCash = transaksi.status_bayar === 'cash'
  const initial = store.nama_toko?.charAt(0).toUpperCase() || 'T'

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const logoSrc = `${baseUrl}/logo/logo-peeka-invoice.png`

  const subtotal = transaksi.transaksi_items?.reduce((s: number, i: any) => s + i.subtotal, 0) || 0
  const totalDiscount = 0
  const totalTax = 0
  const shippingCost = 0
  const dpAmount = isCash ? subtotal : 0
  const sisaTagihan = isCash ? 0 : subtotal

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Image src={logoSrc} style={styles.logoImg} />
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.refTable}>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>No. Referensi</Text>
                <Text style={styles.refValue}>{transaksi.nomor_nota}</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>Tanggal</Text>
                <Text style={styles.refValue}>{fmtTanggal(transaksi.tanggal)}</Text>
              </View>
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>Jatuh Tempo</Text>
                <Text style={styles.refValue}>-</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Info Perusahaan</Text>
            <Text style={styles.infoCardName}>{store.nama_toko}</Text>
            <Text style={styles.infoCardText}>{store.no_wa || '-'} - {store.alamat_toko || '-'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Tagihan Untuk</Text>
            <Text style={styles.infoCardName}>
              {transaksi.nama_pelanggan || 'Umum / Tamu'}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isCash ? 'Lunas' : 'Piutang'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Produk</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Harga</Text>
            <Text style={[styles.tableHeaderCell, styles.colDisc]}>Diskon</Text>
            <Text style={[styles.tableHeaderCell, styles.colTax]}>Pajak</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Jumlah</Text>
          </View>

          {transaksi.transaksi_items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, styles.colProduct]}>
                {item.nama_item}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.qty}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {fmtRupiah(item.harga)}
              </Text>
              <Text style={[styles.tableCell, styles.colDisc]}>
                Rp 0
              </Text>
              <Text style={[styles.tableCell, styles.colTax]}>
                0%
              </Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>
                {fmtRupiah(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{fmtRupiah(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diskon Tambahan</Text>
              <Text style={styles.summaryValue}>{fmtRupiah(totalDiscount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak</Text>
              <Text style={styles.summaryValue}>{fmtRupiah(totalTax)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Kirim</Text>
              <Text style={styles.summaryValue}>{fmtRupiah(shippingCost)}</Text>
            </View>

            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>TOTAL</Text>
              <Text style={styles.summaryTotalValue}>{fmtRupiah(subtotal)}</Text>
            </View>

            <View style={styles.summaryDpRow}>
              <Text style={styles.summaryDpLabel}>Jumlah Lunas (DP)</Text>
              <Text style={styles.summaryDpValue}>{fmtRupiah(dpAmount)}</Text>
            </View>

            <View style={styles.summarySisaRow}>
              <Text style={styles.summarySisaLabel}>Sisa Tagihan</Text>
              <Text style={styles.summarySisaValue}>{fmtRupiah(sisaTagihan)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>Catatan</Text>
            <Text style={styles.footerBank}>{store.catatan_nota || 'Terima kasih atas kepercayaan Anda'}</Text>
          </View>

          {store.keterangan_pembayaran && (
            <View style={styles.footerSection}>
              <Text style={styles.footerLabel}>Informasi Pembayaran</Text>
              <Text style={styles.footerBank}>{store.keterangan_pembayaran}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              
            </Text>
            <Text style={styles.footerBrand}>
              Powered by <Text style={styles.footerBrandLink}>Peeka.ID</Text>
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}