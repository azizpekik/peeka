import { NextResponse } from 'next/server';

async function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Konfigurasi database tidak lengkap');
  }

  const { createServiceClient } = await import('@/lib/supabase/service');
  return createServiceClient();
}

// GET - Get user detail with statistics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let supabase;
    try {
      supabase = await getSupabaseClient();
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get user detail
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get statistics
    const { count: totalTransaksi } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { data: transaksiData } = await supabase
      .from('transaksi')
      .select('total_nominal, status_bayar')
      .eq('user_id', id);

    const totalOmset = transaksiData?.reduce((sum, t) => sum + (t.total_nominal || 0), 0) || 0;
    const totalCash = transaksiData
      ?.filter(t => t.status_bayar === 'cash')
      .reduce((sum, t) => sum + (t.total_nominal || 0), 0) || 0;

    const { data: piutangData } = await supabase
      .from('piutang')
      .select('total_hutang, sisa_hutang, status')
      .eq('user_id', id);

    const totalPiutang = piutangData?.reduce((sum, p) => sum + (p.total_hutang || 0), 0) || 0;
    const sisaPiutang = piutangData
      ?.filter(p => p.status === 'aktif')
      .reduce((sum, p) => sum + (p.sisa_hutang || 0), 0) || 0;

    const { count: piutangAktif } = await supabase
      .from('piutang')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'aktif');

    // Get recent transactions
    const { data: recentTransaksi } = await supabase
      .from('transaksi')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: {
          totalTransaksi: totalTransaksi || 0,
          totalOmset,
          totalCash,
          totalPiutang,
          sisaPiutang,
          piutangAktif: piutangAktif || 0,
        },
        recentTransaksi: recentTransaksi || [],
      },
    });
  } catch (error) {
    console.error('Error in get user detail API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama_toko, nama_pemilik, jenis_usaha, aktif, telegram_id } = body;

    let supabase;
    try {
      supabase = await getSupabaseClient();
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (nama_toko !== undefined) updateData.nama_toko = nama_toko;
    if (nama_pemilik !== undefined) updateData.nama_pemilik = nama_pemilik;
    if (jenis_usaha !== undefined) updateData.jenis_usaha = jenis_usaha;
    if (aktif !== undefined) updateData.aktif = aktif;
    if (telegram_id !== undefined) updateData.telegram_id = telegram_id;

    // Update user
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil diupdate',
      data: user,
    });
  } catch (error) {
    console.error('Error in update user API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft delete by setting aktif = false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    let supabase;
    try {
      supabase = await getSupabaseClient();
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete - remove from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { success: false, error: 'Gagal menghapus user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User berhasil dihapus permanen',
      });
    } else {
      // Soft delete - set aktif = false
      const { error } = await supabase
        .from('users')
        .update({ aktif: false })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating user:', error);
        return NextResponse.json(
          { success: false, error: 'Gagal menonaktifkan user' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User berhasil dinonaktifkan',
      });
    }
  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}