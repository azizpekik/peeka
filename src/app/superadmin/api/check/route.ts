import { NextResponse } from 'next/server';

export async function GET() {
  console.log('API /superadmin/api/check called');

  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing env vars - returning setup needed');
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi database tidak lengkap',
        setupNeeded: true,
        adminCount: 0,
      });
    }

    // Use service role client for admin operations
    let supabase;
    try {
      const { createServiceClient } = await import('@/lib/supabase/service');
      supabase = createServiceClient();
    } catch (importError) {
      console.error('Failed to create service client:', importError);
      return NextResponse.json({
        success: false,
        error: 'Gagal memuat database client',
        setupNeeded: true,
        adminCount: 0,
      });
    }

    // Cek apakah tabel admin_users ada
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Query error:', error);

      // Jika error karena tabel tidak ada
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'Tabel admin_users belum dibuat di database',
          setupNeeded: true,
          adminCount: 0,
          tableMissing: true,
          detail: error.message,
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Error saat mengakses tabel admin_users',
        setupNeeded: true,
        adminCount: 0,
        detail: error.message,
      });
    }

    // Cek jumlah admin
    const { count, error: countError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({
        success: false,
        error: 'Gagal menghitung admin',
        setupNeeded: true,
        adminCount: 0,
        detail: countError.message,
      });
    }

    console.log('Check successful, admin count:', count);
    return NextResponse.json({
      success: true,
      message: 'Tabel admin_users ditemukan',
      adminCount: count || 0,
      setupNeeded: (count || 0) === 0,
    });
  } catch (error: any) {
    console.error('Check API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Terjadi kesalahan server',
      setupNeeded: true,
      adminCount: 0,
    });
  }
}