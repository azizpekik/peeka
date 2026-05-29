import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Login API called');
  
  try {
    const { email, password } = await request.json();
    console.log('Email received:', email);

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Use service role client for admin operations
    let supabase;
    try {
      const { createServiceClient } = await import('@/lib/supabase/service');
      supabase = createServiceClient();
    } catch (importError) {
      console.error('Failed to create service client:', importError);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat database client' },
        { status: 500 }
      );
    }
    
    console.log('Supabase client created');

    // Cari admin berdasarkan email
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    console.log('Query result:', { admin: admin ? 'found' : 'not found', error });

    if (error || !admin) {
      console.log('Admin not found or error:', error);
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Cek apakah akun aktif
    if (!admin.aktif) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak aktif' },
        { status: 403 }
      );
    }

    // Verifikasi password
    console.log('Verifying password...');
    let isValidPassword;
    try {
      const bcrypt = await import('bcrypt');
      isValidPassword = await bcrypt.compare(password, admin.password_hash);
      console.log('Password valid:', isValidPassword);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return NextResponse.json(
        { success: false, error: 'Error verifikasi password' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Update last_login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Set cookie session
    const cookieStore = await cookies();
    cookieStore.set('peeka_admin_session', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: admin.id,
        email: admin.email,
        nama: admin.nama,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}