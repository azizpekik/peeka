'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowLeftRight,
  Calendar,
  FileSpreadsheet,
  FileText,
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'

const fmt = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtFull = (n: number) => 'Rp ' + (n || 0).toLocaleString('id-ID')
const fmtDateShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

interface LaporanClientProps {
  telegramId: string
  userName: string
}

type TabType = 'laba-rugi' | 'pengeluaran' | 'transaksi'
type TimeRange = '1' | '7' | '30' | '365' | 'all'

const timeRangeOptions = [
  { value: '1', label: 'Hari Ini' },
  { value: '7', label: '7 Hari' },
  { value: '30', label: '30 Hari' },
  { value: '365', label: '1 Tahun' },
  { value: 'all', label: 'Semua' },
]

const ROWS_OPTIONS = [10, 25, 50, 100]

// PDF Document Component
const PDFDocument = ({ data, type, periode, userName }: { 
  data: any; 
  type: TabType; 
  periode: string; 
  userName: string;
}) => {
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  
  const getTitle = () => {
    switch (type) {
      case 'laba-rugi': return 'LAPORAN LABA RUGI'
      case 'pengeluaran': return 'LAPORAN PENGELUARAN'
      case 'transaksi': return 'LAPORAN TRANSAKSI'
      default: return 'LAPORAN'
    }
  }

  // Calculate laba rugi data
  const calculateLabaRugiData = () => {
    let saldo = 0
    const transaksiItems = (data?.transaksi_list || []).map((t: any) => ({
      ...t,
      tipe: t.status_bayar === 'pengeluaran' ? 'pengeluaran' : 'transaksi'
    }))
    
    const pengeluaranItems = (data?.pengeluaran_list || []).map((p: any) => ({
      ...p,
      status_bayar: 'pengeluaran',
      total_nominal: p.nominal,
      tipe: 'pengeluaran'
    }))
    
    const combinedData = [...transaksiItems, ...pengeluaranItems]
    const sortedData = combinedData.sort((a: any, b: any) => {
      return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    })
    
    return sortedData.map((t: any, index: number) => {
      const kredit = t.status_bayar !== 'pengeluaran' ? (t.total_nominal || 0) : 0
      const debet = t.status_bayar === 'pengeluaran' ? (t.total_nominal || 0) : 0
      saldo = saldo + kredit - debet
      return {
        ...t,
        no: index + 1,
        kredit,
        debet,
        saldo
      }
    })
  }

  const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Helvetica' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#60B4F7',
    },
    logo: {
      width: 40,
      height: 40,
      backgroundColor: '#60B4F7',
      borderRadius: 8,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
    headerText: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#141210' },
    subtitle: { fontSize: 10, color: '#6B6560', marginTop: 2 },
    periode: { fontSize: 9, color: '#A8A39D', marginTop: 4 },
    section: { marginBottom: 15 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#141210',
      marginBottom: 8,
      backgroundColor: '#F2F1EE',
      padding: 6,
    },
    table: { width: '100%' },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#F8F7F4',
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#E8E5DF',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E8E5DF',
    },
    tableCell: { fontSize: 8, color: '#141210' },
    tableCellRight: { fontSize: 8, color: '#141210', textAlign: 'right' },
    tableCellCenter: { fontSize: 8, color: '#141210', textAlign: 'center' },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 30,
      right: 30,
      fontSize: 8,
      color: '#A8A39D',
      textAlign: 'center',
    },
  })

  // Laba Rugi Content
  const LabaRugiContent = () => {
    const labaRugiData = calculateLabaRugiData()
    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total Penjualan</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{fmtFull(data?.total_pemasukan || 0)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total Pengeluaran</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>
                {fmtFull((data?.total_pengeluaran || 0) + (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0))}
              </Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: '#EDF6FF' }]}>
              <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>Laba/Rugi Bersih</Text>
              <Text style={[styles.tableCellRight, { flex: 1, fontWeight: 'bold' }]}>
                {fmtFull((data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Laba Rugi (Format UMKM)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>No</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Tanggal</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Keterangan</Text>
              <Text style={[styles.tableCellRight, { flex: 1.5 }]}>Kredit</Text>
              <Text style={[styles.tableCellRight, { flex: 1.5 }]}>Debet</Text>
              <Text style={[styles.tableCellRight, { flex: 1.5 }]}>Saldo</Text>
            </View>
            {labaRugiData.map((t: any) => (
              <View key={t.no} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{t.no}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{fmtDateShort(t.tanggal)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {t.tipe === 'pengeluaran' ? (t.kategori?.toUpperCase() || 'PENGELUARAN') : 'PENJUALAN'}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>
                  {t.kredit > 0 ? fmtFull(t.kredit) : '-'}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>
                  {t.debet > 0 ? fmtFull(t.debet) : '-'}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1.5, fontWeight: 'bold' }]}>
                  {fmtFull(t.saldo)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </>
    )
  }

  // Pengeluaran Content
  const PengeluaranContent = () => {
    const pengeluaranData = (data?.pengeluaran_list || []).map((p: any, index: number) => ({
      ...p,
      no: index + 1
    }))
    
    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Pengeluaran</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total Pengeluaran</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>
                {fmtFull(data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Jumlah Transaksi</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{pengeluaranData.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Pengeluaran</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>No</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Tanggal</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Kategori</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Catatan</Text>
              <Text style={[styles.tableCellRight, { flex: 1.5 }]}>Nominal</Text>
            </View>
            {pengeluaranData.map((p: any) => (
              <View key={p.no} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{p.no}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{fmtDateShort(p.tanggal)}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{p.kategori || 'Lainnya'}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{p.catatan || '-'}</Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>{fmtFull(p.nominal || 0)}</Text>
              </View>
            ))}
          </View>
        </View>
      </>
    )
  }

  // Transaksi Content
  const TransaksiContent = () => {
    const transaksiData = (data?.transaksi_list || [])
      .filter((t: any) => t.status_bayar !== 'pengeluaran')
      .map((t: any, index: number) => ({
        ...t,
        no: index + 1
      }))
    
    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Transaksi</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total Transaksi</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{transaksiData.length}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Total Penjualan</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{fmtFull(data?.total_pemasukan || 0)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Cash Masuk</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{fmtFull(data?.total_cash || 0)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Piutang</Text>
              <Text style={[styles.tableCellRight, { flex: 1 }]}>{fmtFull(data?.total_piutang || 0)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail Transaksi</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>No</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Tanggal</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Nota</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Pelanggan</Text>
              <Text style={[styles.tableCellCenter, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableCellRight, { flex: 1.5 }]}>Nominal</Text>
            </View>
            {transaksiData.map((t: any) => (
              <View key={t.no} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{t.no}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{fmtDateShort(t.tanggal)}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{t.nomor_nota || '-'}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{t.nama_pelanggan || '-'}</Text>
                <Text style={[styles.tableCellCenter, { flex: 1 }]}>
                  {t.status_bayar?.toUpperCase()}
                </Text>
                <Text style={[styles.tableCellRight, { flex: 1.5 }]}>{fmtFull(t.total_nominal || 0)}</Text>
              </View>
            ))}
          </View>
        </View>
      </>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{userName}</Text>
            <Text style={styles.periode}>Periode: {periode} | Dicetak: {today}</Text>
          </View>
        </View>

        {type === 'laba-rugi' && <LabaRugiContent />}
        {type === 'pengeluaran' && <PengeluaranContent />}
        {type === 'transaksi' && <TransaksiContent />}

        <Text style={styles.footer}>
          🪲 Peeka - Intip bisnismu, tiap malam | Generated by Peeka Dashboard
        </Text>
      </Page>
    </Document>
  )
}

export default function LaporanClient({ telegramId, userName }: LaporanClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('laba-rugi')
  const [timeRange, setTimeRange] = useState<TimeRange>('7')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  
  // Pagination states for each tab
  const [labaRugiLimit, setLabaRugiLimit] = useState(25)
  const [labaRugiShowAll, setLabaRugiShowAll] = useState(false)
  
  const [pengeluaranLimit, setPengeluaranLimit] = useState(25)
  const [pengeluaranShowAll, setPengeluaranShowAll] = useState(false)
  
  const [transaksiLimit, setTransaksiLimit] = useState(25)
  const [transaksiShowAll, setTransaksiShowAll] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load laporan data and pengeluaran data
      const [laporanRes, pengeluaranRes] = await Promise.all([
        fetch(`/api/laporan?telegram_id=${telegramId}&range=${timeRange}`, { cache: 'no-store' }),
        fetch(`/api/pengeluaran?telegram_id=${telegramId}&range=${timeRange}`, { cache: 'no-store' })
      ])
      
      const laporanJson = await laporanRes.json()
      const pengeluaranJson = await pengeluaranRes.json()
      
      if (laporanJson.success) {
        setData({
          ...laporanJson.data,
          pengeluaran_list: pengeluaranJson.data || []
        })
      }
    } catch (e) {
      console.error('Error loading laporan:', e)
    } finally {
      setLoading(false)
    }
  }, [telegramId, timeRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
    // Reset all pagination
    setLabaRugiShowAll(false)
    setLabaRugiLimit(25)
    setPengeluaranShowAll(false)
    setPengeluaranLimit(25)
    setTransaksiShowAll(false)
    setTransaksiLimit(25)
  }

  // Calculate laba rugi data with running balance
  const calculateLabaRugiData = () => {
    let saldo = 0
    
    // Combine transaksi and pengeluaran data
    const transaksiItems = (data?.transaksi_list || []).map((t: any) => ({
      ...t,
      tipe: t.status_bayar === 'pengeluaran' ? 'pengeluaran' : 'transaksi'
    }))
    
    // Convert pengeluaran_list to same format as transaksi
    const pengeluaranItems = (data?.pengeluaran_list || []).map((p: any) => ({
      ...p,
      status_bayar: 'pengeluaran',
      total_nominal: p.nominal,
      tipe: 'pengeluaran'
    }))
    
    // Combine both arrays
    const combinedData = [...transaksiItems, ...pengeluaranItems]
    
    // Sort by tanggal ascending (dari tanggal paling lama ke terbaru)
    const sortedData = combinedData.sort((a: any, b: any) => {
      return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    })
    
    return sortedData.map((t: any, index: number) => {
      const kredit = t.status_bayar !== 'pengeluaran' ? (t.total_nominal || 0) : 0
      const debet = t.status_bayar === 'pengeluaran' ? (t.total_nominal || 0) : 0
      saldo = saldo + kredit - debet
      return {
        ...t,
        no: index + 1,
        kredit,
        debet,
        saldo
      }
    })
  }

  // Get paginated laba rugi data
  const getLabaRugiData = () => {
    const allData = calculateLabaRugiData()
    if (labaRugiShowAll) return allData
    return allData.slice(0, labaRugiLimit)
  }

  // Get paginated pengeluaran data
  const getPengeluaranData = () => {
    const allData = (data?.pengeluaran_list || []).map((p: any, index: number) => ({
      ...p,
      no: index + 1
    }))
    if (pengeluaranShowAll) return allData
    return allData.slice(0, pengeluaranLimit)
  }

  // Get paginated transaksi data
  const getTransaksiData = () => {
    const allData = (data?.transaksi_list || [])
      .filter((t: any) => t.status_bayar !== 'pengeluaran')
      .map((t: any, index: number) => ({
        ...t,
        no: index + 1
      }))
    if (transaksiShowAll) return allData
    return allData.slice(0, transaksiLimit)
  }

  const labaRugiData = getLabaRugiData()
  const totalLabaRugi = calculateLabaRugiData().length
  const labaRugiHasMore = !labaRugiShowAll && totalLabaRugi > labaRugiLimit

  const pengeluaranData = getPengeluaranData()
  const totalPengeluaran = (data?.pengeluaran_list || []).length
  const pengeluaranHasMore = !pengeluaranShowAll && totalPengeluaran > pengeluaranLimit

  const transaksiData = getTransaksiData()
  const totalTransaksi = (data?.transaksi_list || []).filter((t: any) => t.status_bayar !== 'pengeluaran').length
  const transaksiHasMore = !transaksiShowAll && totalTransaksi > transaksiLimit

  // Export Excel
  const exportToExcel = () => {
    setExporting('excel')
    try {
      const periodeStr = timeRange === '1' ? 'Hari-Ini' : timeRange === '7' ? '7-Hari' : timeRange === '30' ? '30-Hari' : timeRange === '365' ? '1-Tahun' : 'Semua'
      
      if (activeTab === 'laba-rugi') {
        const labaRugiData = calculateLabaRugiData()
        const summaryData = [
          ['Laporan Laba Rugi', '', '', '', '', ''],
          ['Toko:', userName, '', '', '', ''],
          ['Periode:', timeRangeOptions.find(o => o.value === timeRange)?.label, '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Ringkasan', '', '', '', '', ''],
          ['Total Penjualan', data?.total_pemasukan || 0, '', '', '', ''],
          ['Total Pengeluaran', (data?.total_pengeluaran || 0) + (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0), '', '', '', ''],
          ['Laba/Rugi Bersih', (data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0), '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Detail Laba Rugi (Format UMKM)', '', '', '', '', ''],
          ['No', 'Tanggal', 'Keterangan', 'Kredit (Masuk)', 'Debet (Keluar)', 'Sisa Saldo'],
          ...labaRugiData.map((t: any) => [
            t.no,
            fmtDateShort(t.tanggal),
            t.tipe === 'pengeluaran' ? (t.kategori?.toUpperCase() || 'PENGELUARAN') : 'PENJUALAN',
            t.kredit || 0,
            t.debet || 0,
            t.saldo
          ]),
        ]

        const ws = XLSX.utils.aoa_to_sheet(summaryData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi')
        XLSX.writeFile(wb, `Laporan-Laba-Rugi-${periodeStr}-${new Date().toISOString().split('T')[0]}.xlsx`)
      } else if (activeTab === 'pengeluaran') {
        const pengeluaranData = data?.pengeluaran_list || []
        const summaryData = [
          ['Laporan Pengeluaran', '', '', '', ''],
          ['Toko:', userName, '', '', ''],
          ['Periode:', timeRangeOptions.find(o => o.value === timeRange)?.label, '', '', ''],
          ['', '', '', '', ''],
          ['Ringkasan', '', '', '', ''],
          ['Total Pengeluaran', data?.total_pengeluaran || 0, '', '', ''],
          ['Jumlah Transaksi', pengeluaranData.length, '', '', ''],
          ['', '', '', '', ''],
          ['Detail Pengeluaran', '', '', '', ''],
          ['No', 'Tanggal', 'Kategori', 'Catatan', 'Nominal'],
          ...pengeluaranData.map((p: any, index: number) => [
            index + 1,
            fmtDateShort(p.tanggal),
            p.kategori || 'Lainnya',
            p.catatan || '-',
            p.nominal || 0
          ]),
        ]

        const ws = XLSX.utils.aoa_to_sheet(summaryData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Pengeluaran')
        XLSX.writeFile(wb, `Laporan-Pengeluaran-${periodeStr}-${new Date().toISOString().split('T')[0]}.xlsx`)
      } else if (activeTab === 'transaksi') {
        const transaksiData = data?.transaksi_list?.filter((t: any) => t.status_bayar !== 'pengeluaran') || []
        const summaryData = [
          ['Laporan Transaksi', '', '', '', '', ''],
          ['Toko:', userName, '', '', '', ''],
          ['Periode:', timeRangeOptions.find(o => o.value === timeRange)?.label, '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Ringkasan', '', '', '', '', ''],
          ['Total Transaksi', data?.meta?.total_transaksi || 0, '', '', '', ''],
          ['Total Penjualan', data?.total_pemasukan || 0, '', '', '', ''],
          ['Cash Masuk', data?.total_cash || 0, '', '', '', ''],
          ['Piutang', data?.total_piutang || 0, '', '', '', ''],
          ['', '', '', '', '', ''],
          ['Detail Transaksi', '', '', '', '', ''],
          ['No', 'Tanggal', 'Nomor Nota', 'Pelanggan', 'Status', 'Nominal'],
          ...transaksiData.map((t: any, index: number) => [
            index + 1,
            fmtDateShort(t.tanggal),
            t.nomor_nota || '-',
            t.nama_pelanggan || '-',
            t.status_bayar?.toUpperCase() || '-',
            t.total_nominal || 0
          ]),
        ]

        const ws = XLSX.utils.aoa_to_sheet(summaryData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
        XLSX.writeFile(wb, `Laporan-Transaksi-${periodeStr}-${new Date().toISOString().split('T')[0]}.xlsx`)
      }
    } catch (e) {
      console.error('Export Excel error:', e)
    } finally {
      setExporting(null)
    }
  }

  const getPeriodeStr = () => {
    return timeRange === '1' ? 'Hari-Ini' : timeRange === '7' ? '7-Hari' : timeRange === '30' ? '30-Hari' : timeRange === '365' ? '1-Tahun' : 'Semua'
  }

  const StatCard = ({ label, value, sub, icon: Icon, color, bg }: any) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className="text-xl font-bold text-gray-800 dark:text-white/90">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  )

  // Pagination Controls Component
  const PaginationControls = ({ 
    currentCount, 
    totalCount, 
    hasMore, 
    showAll, 
    limit, 
    onShowAll, 
    onShowLess, 
    onLimitChange 
  }: any) => (
    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-500">
        Menampilkan {currentCount} dari {totalCount} data
      </p>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Show:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          {ROWS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        
        {hasMore && (
          <button
            onClick={onShowAll}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-brand-500 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            Load More
            <ChevronDown size={16} />
          </button>
        )}
        
        {showAll && totalCount > 25 && (
          <button
            onClick={onShowLess}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Show Less
            <ChevronUp size={16} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Laporan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Export laporan keuangan bisnis</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={exporting === 'excel' || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {exporting === 'excel' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            Export Excel
          </button>
          
          {data && (
            <PDFDownloadLink
              document={
                <PDFDocument 
                  data={data} 
                  type={activeTab} 
                  periode={timeRangeOptions.find(o => o.value === timeRange)?.label || ''} 
                  userName={userName} 
                />
              }
              fileName={`Laporan-${activeTab === 'laba-rugi' ? 'Laba-Rugi' : activeTab === 'pengeluaran' ? 'Pengeluaran' : 'Transaksi'}-${new Date().toISOString().split('T')[0]}.pdf`}
            >
              {({ loading: pdfLoading }) => (
                <button
                  disabled={pdfLoading || loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {pdfLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  Export PDF
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
        {[
          { key: 'laba-rugi', label: 'Laba Rugi', icon: TrendingUp },
          { key: 'pengeluaran', label: 'Pengeluaran', icon: TrendingDown },
          { key: 'transaksi', label: 'Transaksi', icon: ArrowLeftRight },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-brand-500 text-white'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Time Range Filter */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 w-fit">
        <Calendar size={16} className="text-gray-400 ml-2" />
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleTimeRangeChange(option.value as TimeRange)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              timeRange === option.value
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Image src="/logo/logo-peeka.png" alt="Loading" width={56} height={56} className="animate-bounce rounded-xl mb-3" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <BarChart3 size={48} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada data</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab: Laba Rugi */}
          {activeTab === 'laba-rugi' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Penjualan"
                  value={fmt(data?.total_pemasukan || 0)}
                  icon={Wallet}
                  color="text-brand-500"
                  bg="bg-brand-50 dark:bg-brand-500/10"
                />
                <StatCard
                  label="Total Pengeluaran"
                  value={fmt((data?.total_pengeluaran || 0) + (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0))}
                  icon={TrendingDown}
                  color="text-red-500"
                  bg="bg-red-50 dark:bg-red-500/10"
                />
                <StatCard
                  label="Laba/Rugi Bersih"
                  value={fmt((data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0))}
                  sub={(data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0) >= 0 ? 'Untung' : 'Rugi'}
                  icon={(data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0) >= 0 ? TrendingUp : TrendingDown}
                  color={(data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
                  bg={(data?.total_pemasukan || 0) - (data?.total_pengeluaran || 0) - (data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0) >= 0 ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}
                />
              </div>

              {/* Table UMKM Format with Pagination */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">Detail Laba Rugi (Format UMKM)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-green-600">Kredit (Masuk)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-red-600">Debet (Keluar)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sisa Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {labaRugiData.map((t: any) => (
                        <tr key={t.no} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">{t.no}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{fmtDateShort(t.tanggal)}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {t.tipe === 'pengeluaran' ? (t.kategori?.toUpperCase() || 'PENGELUARAN') : 'PENJUALAN'}
                          </td>
                          <td className="px-6 py-3 text-sm text-green-600 dark:text-green-400 text-right font-medium">
                            {t.kredit > 0 ? fmt(t.kredit) : '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                            {t.debet > 0 ? fmt(t.debet) : '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-800 dark:text-white/90 text-right font-bold">
                            {fmt(t.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentCount={labaRugiData.length}
                  totalCount={totalLabaRugi}
                  hasMore={labaRugiHasMore}
                  showAll={labaRugiShowAll}
                  limit={labaRugiLimit}
                  onShowAll={() => setLabaRugiShowAll(true)}
                  onShowLess={() => {
                    setLabaRugiShowAll(false)
                    setLabaRugiLimit(25)
                  }}
                  onLimitChange={(val: number) => {
                    setLabaRugiLimit(val)
                    setLabaRugiShowAll(false)
                  }}
                />
              </div>
            </>
          )}

          {/* Tab: Pengeluaran */}
          {activeTab === 'pengeluaran' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Total Pengeluaran"
                  value={fmt(data?.pengeluaran_list?.reduce((sum: number, p: any) => sum + (p.nominal || 0), 0) || 0)}
                  icon={TrendingDown}
                  color="text-red-500"
                  bg="bg-red-50 dark:bg-red-500/10"
                />
                <StatCard
                  label="Jumlah Transaksi"
                  value={totalPengeluaran}
                  sub="pengeluaran"
                  icon={Receipt}
                  color="text-orange-500"
                  bg="bg-orange-50 dark:bg-orange-500/10"
                />
              </div>

              {/* Table with Pagination */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">Detail Pengeluaran</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Catatan</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {pengeluaranData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            Tidak ada data pengeluaran
                          </td>
                        </tr>
                      ) : (
                        pengeluaranData.map((p: any) => (
                          <tr key={p.no} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">{p.no}</td>
                            <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{fmtDateShort(p.tanggal)}</td>
                            <td className="px-6 py-3 text-sm">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                                {p.kategori || 'Lainnya'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{p.catatan || '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-800 dark:text-white/90 text-right font-medium">{fmt(p.nominal || 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentCount={pengeluaranData.length}
                  totalCount={totalPengeluaran}
                  hasMore={pengeluaranHasMore}
                  showAll={pengeluaranShowAll}
                  limit={pengeluaranLimit}
                  onShowAll={() => setPengeluaranShowAll(true)}
                  onShowLess={() => {
                    setPengeluaranShowAll(false)
                    setPengeluaranLimit(25)
                  }}
                  onLimitChange={(val: number) => {
                    setPengeluaranLimit(val)
                    setPengeluaranShowAll(false)
                  }}
                />
              </div>
            </>
          )}

          {/* Tab: Transaksi */}
          {activeTab === 'transaksi' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Transaksi"
                  value={totalTransaksi}
                  icon={ArrowLeftRight}
                  color="text-brand-500"
                  bg="bg-brand-50 dark:bg-brand-500/10"
                />
                <StatCard
                  label="Total Penjualan"
                  value={fmt(data?.total_pemasukan || 0)}
                  icon={Wallet}
                  color="text-green-500"
                  bg="bg-green-50 dark:bg-green-500/10"
                />
                <StatCard
                  label="Cash Masuk"
                  value={fmt(data?.total_cash || 0)}
                  icon={TrendingUp}
                  color="text-blue-500"
                  bg="bg-blue-50 dark:bg-blue-500/10"
                />
                <StatCard
                  label="Piutang"
                  value={fmt(data?.total_piutang || 0)}
                  icon={Receipt}
                  color="text-amber-500"
                  bg="bg-amber-50 dark:bg-amber-500/10"
                />
              </div>

              {/* Table with Pagination */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">Detail Transaksi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pelanggan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {transaksiData.map((t: any) => (
                        <tr key={t.no} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">{t.no}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{fmtDateShort(t.tanggal)}</td>
                          <td className="px-6 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">{t.nomor_nota || '-'}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{t.nama_pelanggan || '-'}</td>
                          <td className="px-6 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              t.status_bayar === 'cash'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {t.status_bayar?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-800 dark:text-white/90 text-right font-medium">{fmt(t.total_nominal || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  currentCount={transaksiData.length}
                  totalCount={totalTransaksi}
                  hasMore={transaksiHasMore}
                  showAll={transaksiShowAll}
                  limit={transaksiLimit}
                  onShowAll={() => setTransaksiShowAll(true)}
                  onShowLess={() => {
                    setTransaksiShowAll(false)
                    setTransaksiLimit(25)
                  }}
                  onLimitChange={(val: number) => {
                    setTransaksiLimit(val)
                    setTransaksiShowAll(false)
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}