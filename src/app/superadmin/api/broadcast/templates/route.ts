import { NextResponse } from 'next/server';

// GET /superadmin/api/broadcast/templates - Get all templates
export async function GET() {
  try {
    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('broadcast_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil template' },
      { status: 500 }
    );
  }
}

// POST /superadmin/api/broadcast/templates - Create new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content } = body;

    // Validasi
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama template tidak boleh kosong' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Konten template tidak boleh kosong' },
        { status: 400 }
      );
    }

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    // Get current admin from cookie
    const cookieStore = request.headers.get('cookie');
    let adminId = null;
    if (cookieStore) {
      const match = cookieStore.match(/peeka_admin_session=([^;]+)/);
      if (match) adminId = match[1];
    }

    const { data, error } = await supabase
      .from('broadcast_templates')
      .insert({
        name: name.trim(),
        content: content.trim(),
        created_by: adminId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Template berhasil disimpan',
      data,
    });

  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan template' },
      { status: 500 }
    );
  }
}

// DELETE /superadmin/api/broadcast/templates?id=[id] - Delete template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID template diperlukan' },
        { status: 400 }
      );
    }

    const { createServiceClient } = await import('@/lib/supabase/service');
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('broadcast_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Template berhasil dihapus',
    });

  } catch (error: any) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus template' },
      { status: 500 }
    );
  }
}
