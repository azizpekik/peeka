import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password baru minimal 6 karakter' },
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

    // Get admin current password hash
    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify current password
    let isValidPassword;
    try {
      const bcrypt = await import('bcrypt');
      isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return NextResponse.json(
        { success: false, error: 'Error verifikasi password' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Password saat ini salah' },
        { status: 401 }
      );
    }

    // Hash new password
    let newPasswordHash;
    try {
      const bcrypt = await import('bcrypt');
      newPasswordHash = await bcrypt.hash(newPassword, 10);
    } catch (bcryptError) {
      console.error('Bcrypt hash error:', bcryptError);
      return NextResponse.json(
        { success: false, error: 'Error mengenkripsi password' },
        { status: 500 }
      );
    }

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: newPasswordHash })
      .eq('id', adminId);

    if (updateError) {
      console.error('Update password error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengubah password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
