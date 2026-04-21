import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // URL tujuan jika berhasil
  const redirectTo = new URL('/dashboard', request.url);

  if (!token) {
    // Arahkan ke halaman error jika tidak ada token
    return NextResponse.redirect(new URL('/auth/login?error=no-token', request.url));
  }

  const supabase = await createClient();

  // 1. Ambil data token dari tabel login_tokens
  const { data: loginData, error } = await supabase
    .from('login_tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .single();

  // 2. Validasi: Apakah ada error, token tidak ditemukan, atau sudah expired?
  if (error || !loginData) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url));
  }

  const isExpired = new Date(loginData.expires_at) < new Date();
  if (isExpired) {
    return NextResponse.redirect(new URL('/auth/login?error=expired-token', request.url));
  }

  // 3. Hapus token agar tidak bisa dipakai lagi (Single Use Security)
  await supabase.from('login_tokens').delete().eq('token', token);

  // 4. Buat Session Cookie
  // Kita simpan user_id ke dalam cookie 'peeka_session'
  const cookieStore = await cookies();
  cookieStore.set('peeka_session', loginData.user_id, {
    httpOnly: true, // Tidak bisa dicuri via JS di browser
    secure: process.env.NODE_ENV === 'production', // Hanya lewat HTTPS di production
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // Berlaku 7 hari
    path: '/',
  });

  // 5. Berhasil! Kirim user ke Dashboard
  return NextResponse.redirect(redirectTo);
}