import { NextResponse } from 'next/server';

// GET /superadmin/api/broadcast/[id] - Get broadcast detail with recipients
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { success: false, error: 'ID broadcast tidak valid' },
        { status: 400 }
      );
    }

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    // Get broadcast detail
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcast_history')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      return NextResponse.json(
        { success: false, error: 'Broadcast tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .select(`
        *,
        user:user_id (nama_pemilik, nama_toko)
      `)
      .eq('broadcast_id', broadcastId)
      .order('created_at', { ascending: true });

    if (recipientsError) throw recipientsError;

    return NextResponse.json({
      success: true,
      data: {
        broadcast,
        recipients: recipients || [],
      },
    });

  } catch (error: any) {
    console.error('Get broadcast detail error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil detail broadcast' },
      { status: 500 }
    );
  }
}

// DELETE /superadmin/api/broadcast/[id] - Cancel/delete broadcast
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { success: false, error: 'ID broadcast tidak valid' },
        { status: 400 }
      );
    }

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    // Check if broadcast exists and is pending/sending
    const { data: broadcast, error: checkError } = await supabase
      .from('broadcast_history')
      .select('status')
      .eq('id', broadcastId)
      .single();

    if (checkError || !broadcast) {
      return NextResponse.json(
        { success: false, error: 'Broadcast tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete broadcast (cascade will delete recipients)
    const { error: deleteError } = await supabase
      .from('broadcast_history')
      .delete()
      .eq('id', broadcastId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Broadcast berhasil dihapus',
    });

  } catch (error: any) {
    console.error('Delete broadcast error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus broadcast' },
      { status: 500 }
    );
  }
}
