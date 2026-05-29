import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get admin ID from cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('peeka_admin_session')?.value;

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client
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

    // Get admin profile
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, nama, aktif, last_login, created_at')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { success: false, error: 'Profil tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get admin ID from cookie
    const cookieStore = await cookies();
    const adminId = cookieStore.get('peeka_admin_session')?.value;

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { nama, email } = await request.json();

    // Validation
    if (!nama || !email) {
      return NextResponse.json(
        { success: false, error: 'Nama dan email wajib diisi' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Use service role client
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

    // Check if email is already used by another admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .neq('id', adminId)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan oleh admin lain' },
        { status: 400 }
      );
    }

    // Update profile
    const { error } = await supabase
      .from('admin_users')
      .update({ nama, email })
      .eq('id', adminId);

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui profil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
