import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST /superadmin/api/broadcast - Kirim broadcast message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, targetType = 'all', userIds = [], templateId } = body;

    // Validasi
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Pesan tidak boleh kosong' },
        { status: 400 }
      );
    }

    if (message.length > 4096) {
      return NextResponse.json(
        { success: false, error: 'Pesan terlalu panjang (maksimal 4096 karakter)' },
        { status: 400 }
      );
    }

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Telegram bot token tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    // Use service role client
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    // Get current admin from cookie
    const cookieStore = request.headers.get('cookie');
    let adminId = null;
    if (cookieStore) {
      const match = cookieStore.match(/peeka_admin_session=([^;]+)/);
      if (match) adminId = match[1];
    }

    // Get target users
    let targetUsers: any[] = [];
    
    if (targetType === 'specific' && userIds.length > 0) {
      // Get specific users
      const { data, error } = await supabase
        .from('users')
        .select('id, telegram_id, nama_pemilik, nama_toko')
        .in('id', userIds)
        .not('telegram_id', 'is', null);
      
      if (error) throw error;
      targetUsers = data || [];
    } else {
      // Get all active users or all users
      let query = supabase
        .from('users')
        .select('id, telegram_id, nama_pemilik, nama_toko')
        .not('telegram_id', 'is', null);
      
      if (targetType === 'active') {
        query = query.eq('aktif', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      targetUsers = data || [];
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada users yang valid untuk dikirimi pesan' },
        { status: 400 }
      );
    }

    // Create broadcast history record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcast_history')
      .insert({
        message_text: message,
        target_type: targetType,
        target_count: targetUsers.length,
        sent_count: 0,
        failed_count: 0,
        status: 'sending',
        created_by: adminId,
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    // Create recipient records
    const recipients = targetUsers.map(user => ({
      broadcast_id: broadcast.id,
      user_id: user.id,
      telegram_id: user.telegram_id,
      status: 'pending',
    }));

    const { error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .insert(recipients);

    if (recipientsError) throw recipientsError;

    // Send messages asynchronously (don't wait for all to complete)
    sendBroadcastMessages(broadcast.id, message, targetUsers);

    return NextResponse.json({
      success: true,
      message: 'Broadcast sedang diproses',
      data: {
        broadcastId: broadcast.id,
        totalTargets: targetUsers.length,
        status: 'sending',
      },
    });

  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat mengirim broadcast' },
      { status: 500 }
    );
  }
}

// GET /superadmin/api/broadcast - Get broadcast history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    let query = supabase
      .from('broadcast_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error('Get broadcast history error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil riwayat broadcast' },
      { status: 500 }
    );
  }
}

// Helper function to send messages asynchronously
async function sendBroadcastMessages(
  broadcastId: number,
  message: string,
  users: any[]
) {
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  let sentCount = 0;
  let failedCount = 0;

  for (const user of users) {
    try {
      // Personalize message
      let personalizedMessage = message
        .replace(/{{nama}}/g, user.nama_pemilik || 'User')
        .replace(/{{toko}}/g, user.nama_toko || 'Toko');

      // Send to Telegram
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: personalizedMessage,
            parse_mode: 'HTML',
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        sentCount++;
        // Update recipient status
        await supabase
          .from('broadcast_recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('broadcast_id', broadcastId)
          .eq('user_id', user.id);
      } else {
        failedCount++;
        // Update recipient status with error
        await supabase
          .from('broadcast_recipients')
          .update({ 
            status: 'failed', 
            error_message: result.description || 'Unknown error' 
          })
          .eq('broadcast_id', broadcastId)
          .eq('user_id', user.id);
      }

      // Update broadcast progress
      await supabase
        .from('broadcast_history')
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
        })
        .eq('id', broadcastId);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      failedCount++;
      console.error(`Failed to send to ${user.telegram_id}:`, error);
      
      await supabase
        .from('broadcast_recipients')
        .update({ 
          status: 'failed', 
          error_message: error.message 
        })
        .eq('broadcast_id', broadcastId)
        .eq('user_id', user.id);
    }
  }

  // Mark broadcast as completed
  await supabase
    .from('broadcast_history')
    .update({
      status: failedCount === users.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
    })
    .eq('id', broadcastId);
}
