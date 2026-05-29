import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function SignOutPage() {
  const cookieStore = await cookies()
  cookieStore.delete('peeka_session')
  
  redirect('/auth/login')
}