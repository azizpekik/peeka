import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PengeluaranClient from './PengeluaranClient'

export default async function PengeluaranPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('peeka_session')?.value

  if (!userId) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  let user = null
  if (userId) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    user = data
  }

  if (!user) {
    redirect('/auth/login')
  }

  return <PengeluaranClient telegramId={user.telegram_id} />
}