import { NextResponse } from 'next/server';

// GET /superadmin/api/broadcast/users - Get users for broadcast target selection
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    // Build query - only users with telegram_id
    let query = supabase
      .from('users')
      .select('id, telegram_id, nama_pemilik, nama_toko, aktif, created_at')
      .not('telegram_id', 'is', null);

    // Apply status filter
    if (status === 'active') {
      query = query.eq('aktif', true);
    } else if (status === 'inactive') {
      query = query.eq('aktif', false);
    }

    // Apply search
    if (search) {
      query = query.or(`nama_pemilik.ilike.%${search}%,nama_toko.ilike.%${search}%,telegram_id.ilike.%${search}%`);
    }

    // Apply limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Get stats for response
    const { count: totalWithTelegram } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('telegram_id', 'is', null);

    const { count: activeWithTelegram } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('telegram_id', 'is', null)
      .eq('aktif', true);

    return NextResponse.json({
      success: true,
      data: data || [],
      stats: {
        totalWithTelegram: totalWithTelegram || 0,
        activeWithTelegram: activeWithTelegram || 0,
        returned: data?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('Get broadcast users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data users' },
      { status: 500 }
    );
  }
}
