import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get('peeka_session')

  // Jika sudah login, ke dashboard. Jika belum, ke landing page/login
  if (session) {
    redirect('/dashboard')
  } else {
    // Di sini kamu bisa buat halaman landing page keren, 
    // atau untuk sementara arahkan ke info login
    redirect('/dashboard') 
  }
}