import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7'; // 7, 30, 90, 365 days
    const days = parseInt(range);

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

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('aktif', true);

    const { count: inactiveUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('aktif', false);

    // Get today's new users
    const today = new Date().toISOString().split('T')[0];
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Get transaction statistics for today
    const { data: todayTransactions } = await supabase
      .from('transaksi')
      .select('total_nominal')
      .gte('tanggal', today);

    const totalTransactionsToday = todayTransactions?.length || 0;
    const totalRevenueToday = todayTransactions?.reduce((sum, t) => sum + (t.total_nominal || 0), 0) || 0;

    // Get all-time statistics
    const { count: totalTransactions } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true });

    const { data: allTransactions } = await supabase
      .from('transaksi')
      .select('total_nominal');

    const totalRevenue = allTransactions?.reduce((sum, t) => sum + (t.total_nominal || 0), 0) || 0;

    // Get active piutang count
    const { count: activePiutang } = await supabase
      .from('piutang')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get users created in date range for chart
    const { data: recentUsers } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDateStr);

    // Group by date
    const usersByDate: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      usersByDate[dateStr] = 0;
    }

    recentUsers?.forEach((user) => {
      const dateStr = user.created_at.split('T')[0];
      if (usersByDate[dateStr] !== undefined) {
        usersByDate[dateStr]++;
      }
    });

    const userGrowthChart = Object.entries(usersByDate)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // Get revenue for date range
    const { data: recentTransactions } = await supabase
      .from('transaksi')
      .select('tanggal, total_nominal')
      .gte('tanggal', startDate.toISOString().split('T')[0]);

    const revenueByDate: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      revenueByDate[dateStr] = 0;
    }

    recentTransactions?.forEach((t) => {
      if (revenueByDate[t.tanggal] !== undefined) {
        revenueByDate[t.tanggal] += t.total_nominal || 0;
      }
    });

    const revenueChart = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .reverse();

    // Get user distribution by status for pie chart
    const userDistribution = [
      { name: 'Aktif', value: activeUsers || 0, color: '#22c55e' },
      { name: 'Non-aktif', value: inactiveUsers || 0, color: '#ef4444' },
    ];

    // Get weekly transaction comparison for bar chart
    const weeklyTransactions: { week: string; count: number; revenue: number }[] = [];
    const weeksToShow = Math.min(4, Math.ceil(days / 7));
    
    for (let i = 0; i < weeksToShow; i++) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const weekLabel = `Minggu ${weeksToShow - i}`;
      
      const weekTransactions = recentTransactions?.filter(t => {
        const tDate = new Date(t.tanggal);
        return tDate >= weekStart && tDate <= weekEnd;
      }) || [];
      
      weeklyTransactions.push({
        week: weekLabel,
        count: weekTransactions.length,
        revenue: weekTransactions.reduce((sum, t) => sum + (t.total_nominal || 0), 0),
      });
    }
    weeklyTransactions.reverse();

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          inactive: inactiveUsers || 0,
          newToday: newUsersToday || 0,
        },
        transactions: {
          total: totalTransactions || 0,
          today: totalTransactionsToday,
        },
        revenue: {
          total: totalRevenue,
          today: totalRevenueToday,
        },
        piutang: {
          active: activePiutang || 0,
        },
        charts: {
          userGrowth: userGrowthChart,
          revenue: revenueChart,
          userDistribution,
          weeklyTransactions,
        },
        meta: {
          range: days,
          startDate: startDate.toISOString().split('T')[0],
          endDate: today,
        },
      },
    });
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
