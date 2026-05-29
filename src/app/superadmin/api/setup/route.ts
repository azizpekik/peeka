import { NextResponse } from 'next/server';

export async function POST() {
  console.log('Setup API called');
  
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({
        success: false,
        error: 'Konfigurasi database tidak lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diatur.',
      });
    }

    // Use service role client to bypass RLS
    let supabase;
    try {
      const { createServiceClient } = await import('@/lib/supabase/service');
      supabase = createServiceClient();
    } catch (importError) {
      console.error('Failed to create service client:', importError);
      return NextResponse.json({
        success: false,
        error: 'Gagal membuat service client',
      });
    }

    // Cek apakah tabel admin_users sudah ada, jika belum buat tabelnya
    try {
      const { error: tableCheckError } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1);
      
      if (tableCheckError && tableCheckError.message.includes('does not exist')) {
        console.log('Tabel admin_users belum ada, membuat tabel...');
        
        // Buat tabel admin_users
        const { error: createTableError } = await supabase.rpc('exec_sql', {
          sql: `
            create table if not exists public.admin_users (
              id uuid default gen_random_uuid() primary key,
              email text not null unique,
              password_hash text not null,
              nama text not null default 'Admin',
              aktif boolean not null default true,
              created_at timestamp with time zone default now(),
              updated_at timestamp with time zone default now(),
              last_login timestamp with time zone
            );
            
            create index if not exists idx_admin_users_email on public.admin_users(email);
            create index if not exists idx_admin_users_aktif on public.admin_users(aktif);
            
            alter table public.admin_users enable row level security;
          `
        });
        
        if (createTableError) {
          console.error('Gagal membuat tabel:', createTableError);
          throw new Error('Gagal membuat tabel admin_users via RPC. Jalankan migrasi SQL manual di Supabase dashboard.');
        }
        
        console.log('Tabel admin_users berhasil dibuat');
      }
    } catch (tableError: any) {
      console.error('Error checking/creating table:', tableError);
      // Lanjutkan saja, mungkin tabel sudah ada
    }

    // Cek apakah sudah ada admin
    const { data: existingAdmins, error: countError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({
        success: false,
        error: 'Gagal memeriksa admin: ' + countError.message + '. Pastikan tabel admin_users sudah ada di database.',
      });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Admin sudah ada. Setup hanya bisa dilakukan sekali.',
      });
    }

    // Generate password hash
    let passwordHash;
    try {
      const bcrypt = await import('bcrypt');
      passwordHash = await bcrypt.hash('admin123', 10);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengenkripsi password',
      });
    }

    // Insert admin pertama menggunakan service role (bypass RLS)
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin@peeka.id',
        password_hash: passwordHash,
        nama: 'Super Admin',
        aktif: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Setup error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal membuat admin: ' + error.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin berhasil dibuat',
      data: {
        email: data.email,
        nama: data.nama,
      },
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Terjadi kesalahan server',
    });
  }
}