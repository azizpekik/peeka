import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('peeka_session')?.value

  if (!userId) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Ambil profil user untuk mendapatkan Telegram ID
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) redirect('/auth/login')

  const TODAY = new Date().toISOString().split('T')[0]
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Fetch data awal di server (SSR)
  const [lRes, pRes] = await Promise.all([
    fetch(`${baseUrl}/api/laporan?telegram_id=${user.telegram_id}&tanggal=${TODAY}`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/piutang?telegram_id=${user.telegram_id}&status=aktif`, { cache: 'no-store' })
  ])

  const lData = await lRes.json()
  const pData = await pRes.json()

  return (
    <DashboardClient 
      initialData={lData.data} 
      initialPiutang={pData.data || []} 
      telegramId={user.telegram_id} 
    />
  )
}