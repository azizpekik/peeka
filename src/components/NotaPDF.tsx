import {
  Document, Page, Text, View, StyleSheet, Image as PDFImage
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: '40px 50px',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },

  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#465fff',
  },
  logoImage: {
    objectFit: 'cover',
  },
  logoInitial: {
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitialText: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
  },
  headerInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  headerMetaLabel: {
    fontSize: 8,
    color: '#9ca3af',
  },
  headerMetaValue: {
    fontSize: 8,
    color: '#374151',
  },

  divider: {
    borderBottomWidth: 2,
    borderBottomColor: '#465fff',
    marginBottom: 24,
  },

  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoLeft: {
    flex: 1,
  },
  infoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  customerName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 6,
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 6,
  },
  statusText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoRowLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  infoRowValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },

  table: {
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  col1: { flex: 5 },
  col2: { flex: 1, textAlign: 'center' },
  col3: { flex: 2, textAlign: 'right' },
  col4: { flex: 2, textAlign: 'right' },

  totalSection: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#111827',
    minWidth: 200,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginRight: 16,
    flex: 1,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    minWidth: 80,
    textAlign: 'right',
  },

  plainText: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  plainTextLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  plainTextValue: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
  },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footerBrand: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerBrandLink: {
    fontSize: 8,
    color: '#465fff',
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
  const hasLogo = store.logo_url && store.logo_url.length > 0 && (store.logo_url.startsWith('http') || store.logo_url.startsWith('/'))

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoBox}>
              <View style={styles.logoInitial}>
                <Text style={styles.logoInitialText}>{initial}</Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.storeName}>{store.nama_toko}</Text>
              {store.nama_pemilik && (
                <Text style={styles.ownerName}>{store.nama_pemilik}</Text>
              )}
              <View style={styles.headerMeta}>
                {store.no_wa && (
                  <View style={styles.headerMetaItem}>
                    <Text style={styles.headerMetaLabel}>WA:</Text>
                    <Text style={styles.headerMetaValue}>{store.no_wa}</Text>
                  </View>
                )}
                {store.alamat_toko && (
                  <View style={styles.headerMetaItem}>
                    <Text style={styles.headerMetaLabel}>Alamat:</Text>
                    <Text style={styles.headerMetaValue}>{store.alamat_toko}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoSection}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoLabel}>Pelanggan</Text>
            <Text style={styles.customerName}>
              {transaksi.nama_pelanggan || 'Umum / Tamu'}
            </Text>
            <View style={[styles.statusBadge, {
              backgroundColor: isCash ? '#f0fdf4' : '#fffbeb',
            }]}>
              <Text style={[styles.statusText, {
                color: isCash ? '#15803d' : '#b45309',
              }]}>
                {isCash ? 'Lunas' : 'Piutang'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRight}>
            <Text style={[styles.infoLabel, { textAlign: 'right' }]}>
              Nota
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

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Harga</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Subtotal</Text>
          </View>

          {transaksi.transaksi_items.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[{ fontSize: 10, color: '#374151' }, styles.col1]}>
                {item.nama_item}
              </Text>
              <Text style={[{ fontSize: 10, color: '#64748b' }, styles.col2]}>
                {item.qty}
              </Text>
              <Text style={[{ fontSize: 10, color: '#64748b' }, styles.col3]}>
                {fmtRupiah(item.harga)}
              </Text>
              <Text style={[{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' }, styles.col4]}>
                {fmtRupiah(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {fmtRupiah(transaksi.total_nominal)}
            </Text>
          </View>
        </View>

        {store.keterangan_pembayaran && (
          <View style={styles.plainText}>
            <Text style={styles.plainTextLabel}>Info Pembayaran</Text>
            <Text style={styles.plainTextValue}>{store.keterangan_pembayaran}</Text>
          </View>
        )}

        {store.catatan_nota && (
          <View style={styles.plainText}>
            <Text style={styles.plainTextLabel}>Catatan</Text>
            <Text style={styles.plainTextValue}>{store.catatan_nota}</Text>
          </View>
        )}

        {transaksi.catatan && (
          <View style={styles.plainText}>
            <Text style={styles.plainTextLabel}>Catatan Transaksi</Text>
            <Text style={styles.plainTextValue}>{transaksi.catatan}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>
              {store.alamat_toko && `${store.alamat_toko}`}
              {store.no_wa && store.alamat_toko && ' | '}
              {store.no_wa && `WA: ${store.no_wa}`}
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