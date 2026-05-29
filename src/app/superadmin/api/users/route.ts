import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi database tidak lengkap',
      }, { status: 500 });
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
      }, { status: 500 });
    }

    // Build query
    let query = supabase.from('users').select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`nama_pemilik.ilike.%${search}%,nama_toko.ilike.%${search}%,telegram_id.ilike.%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('aktif', true);
    } else if (status === 'inactive') {
      query = query.eq('aktif', false);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data users' },
        { status: 500 }
      );
    }

    // Get statistics for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Count transactions
        const { count: transaksiCount } = await supabase
          .from('transaksi')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Sum total omset
        const { data: omsetData } = await supabase
          .from('transaksi')
          .select('total_nominal')
          .eq('user_id', user.id);

        const totalOmset = omsetData?.reduce((sum, t) => sum + (t.total_nominal || 0), 0) || 0;

        // Count active piutang
        const { count: piutangCount } = await supabase
          .from('piutang')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'aktif');

        return {
          ...user,
          stats: {
            totalTransaksi: transaksiCount || 0,
            totalOmset,
            piutangAktif: piutangCount || 0,
          },
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telegram_id, nama_toko, nama_pemilik, jenis_usaha } = body;

    // Validation
    if (!telegram_id || !nama_toko || !nama_pemilik) {
      return NextResponse.json(
        { success: false, error: 'telegram_id, nama_toko, dan nama_pemilik wajib diisi' },
        { status: 400 }
      );
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi database tidak lengkap',
      }, { status: 500 });
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
      }, { status: 500 });
    }

    // Check if telegram_id already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Telegram ID sudah terdaftar' },
        { status: 409 }
      );
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        telegram_id,
        nama_toko,
        nama_pemilik,
        jenis_usaha: jenis_usaha || null,
        aktif: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { success: false, error: 'Gagal membuat user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dibuat',
      data: user,
    });
  } catch (error) {
    console.error('Error in create user API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}