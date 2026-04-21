// src/app/dashboard/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('peeka_session')?.value

  // 1. Keamanan: Cek apakah user sudah login
  if (!userId) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // 2. Ambil data profil user berdasarkan ID sesi (UUID)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    // Jika user tidak ditemukan di DB, hapus sesi dan login ulang
    redirect('/auth/login')
  }

  // 3. Logic penentuan URL otomatis (Dinamis)
  // Ini akan otomatis memilih https://pekik.vercel.app atau http://localhost:3000
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? process.env.NEXT_PUBLIC_SITE_URL 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

  const TODAY = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0];

  try {
    // 4. Ambil data laporan dan piutang dari API Route kamu
    const [lRes, pRes] = await Promise.all([
      fetch(`${baseUrl}/api/laporan?telegram_id=${user.telegram_id}&tanggal=${TODAY}`, { 
        cache: 'no-store' 
      }),
      fetch(`${baseUrl}/api/piutang?telegram_id=${user.telegram_id}&status=aktif`, { 
        cache: 'no-store' 
      })
    ]);

    // Cek jika API gagal merespon
    if (!lRes.ok || !pRes.ok) {
        throw new Error(`Gagal fetch API. Status: Laporan(${lRes.status}), Piutang(${pRes.status})`);
    }

    const lData = await lRes.json();
    const pData = await pRes.json();

    // 5. Kirim data ke tampilan (Client Component)
    return (
      <DashboardClient 
        initialData={lData.data} 
        initialPiutang={pData.data || []} 
        telegramId={user.telegram_id} 
      />
    );

  } catch (error) {
    console.error('Dashboard Fetch Error:', error);
    
    // Tampilan fallback sederhana jika API bermasalah
    return (
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-red-500 font-bold text-lg">Gagal Memuat Data Dashboard</h1>
            <p className="text-gray-500 mt-2">Pastikan API Route tersedia di: {baseUrl}</p>
            <a href="/dashboard" className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg">Coba Lagi</a>
        </div>
    );
  }
}