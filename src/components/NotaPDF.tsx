import {
  Document, Page, Text, View, StyleSheet, Line, Svg
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: '40px 48px',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },

  // Header 2 kolom
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 12,
  },
  namaToko: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  tokoDetail: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },

  // Info section (pelanggan + nomor nota)
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  infoName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    minWidth: 160,
  },
  infoRowLabel: {
    fontSize: 9,
    color: '#9ca3af',
    marginRight: 12,
  },
  infoRowValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  // Table
  table: {
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  col1: { flex: 4 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 2, textAlign: 'right' },
  col4: { flex: 2, textAlign: 'right' },

  // Total section
  totalSection: {
    marginTop: 0,
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginRight: 24,
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 9,
    color: '#374151',
    minWidth: 80,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#111827',
    minWidth: 200,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginRight: 24,
    flex: 1,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    minWidth: 80,
    textAlign: 'right',
  },

  // Status badge
  badge: {
    marginTop: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    marginTop: 48,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Catatan
  catatan: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
  },
  catatanText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
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
  namaToko: string
}

export default function NotaPDF({ transaksi, namaToko }: NotaPDFProps) {
  const isCash = transaksi.status_bayar === 'cash'

  return (
    <Document>
      <Page size="A5" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Kiri: Brand */}
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>Peeka</Text>
            <Text style={styles.tagline}>Kasir & Keuangan UMKM</Text>
          </View>

          {/* Kanan: Info toko */}
          <View style={styles.headerRight}>
            <Text style={styles.namaToko}>{namaToko}</Text>
            <Text style={styles.tokoDetail}>Dicatat via Peeka</Text>
            <Text style={styles.tokoDetail}>peeka.id</Text>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── INFO SECTION ── */}
        <View style={styles.infoSection}>
          {/* Kiri: Pelanggan */}
          <View style={styles.infoLeft}>
            <Text style={styles.infoLabel}>Kepada</Text>
            <Text style={styles.infoName}>
              {transaksi.nama_pelanggan || 'Umum'}
            </Text>
            {transaksi.nama_pelanggan && (
              <Text style={styles.infoText}>Pelanggan</Text>
            )}
          </View>

          {/* Kanan: Info nota */}
          <View style={styles.infoRight}>
            <Text style={[styles.infoLabel, { textAlign: 'right' }]}>
              Detail Nota
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>No. Nota</Text>
              <Text style={styles.infoRowValue}>{transaksi.nomor_nota}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Tanggal</Text>
              <Text style={styles.infoRowValue}>{fmtTanggal(transaksi.tanggal)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowLabel}>Waktu</Text>
              <Text style={styles.infoRowValue}>
                {transaksi.waktu?.substring(0, 5) || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── TABLE ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
          </View>

          {/* Rows */}
          {transaksi.transaksi_items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[{ fontSize: 10, color: '#374151' }, styles.col1]}>
                {item.nama_item}
              </Text>
              <Text style={[{ fontSize: 10, color: '#6b7280' }, styles.col2]}>
                {item.qty}
              </Text>
              <Text style={[{ fontSize: 10, color: '#6b7280' }, styles.col3]}>
                {fmtRupiah(item.harga)}
              </Text>
              <Text style={[{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' }, styles.col4]}>
                {fmtRupiah(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── TOTAL ── */}
        <View style={styles.totalSection}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {fmtRupiah(transaksi.total_nominal)}
            </Text>
          </View>
        </View>

        {/* ── STATUS BADGE ── */}
        <View style={[styles.badge, {
          backgroundColor: isCash ? '#f0fdf4' : '#fffbeb',
        }]}>
          <Text style={[styles.badgeText, {
            color: isCash ? '#15803d' : '#b45309',
          }]}>
            {isCash ? 'LUNAS - CASH' : 'PIUTANG - BELUM LUNAS'}
          </Text>
        </View>

        {/* ── CATATAN ── */}
        {transaksi.catatan && (
          <View style={styles.catatan}>
            <Text style={styles.catatanText}>
              Catatan: {transaksi.catatan}
            </Text>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Terima kasih telah berbelanja!</Text>
            <Text style={styles.footerBrand}>Dicetak oleh Peeka</Text>
          </View>
        </View>

      </Page>
    </Document>
  )
}