const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars. But trying with anon key...')
  // Fallback ke anon key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    console.error('Missing all keys')
    process.exit(1)
  }
}

// Gunakan service role key
const supabase = createClient(supabaseUrl, serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkAdmin() {
  try {
    console.log('Checking admin_users table with SERVICE ROLE...')
    console.log('URL:', supabaseUrl)
    console.log('Using Service Role:', !!serviceRoleKey)
    
    // Cek struktur tabel
    console.log('\n=== Checking Table Structure ===')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'admin_users' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (tableError) {
      console.log('Cannot check structure via RPC:', tableError.message)
    } else {
      console.log('Table columns:', tableInfo)
    }
    
    // Cek data admin dengan service role
    console.log('\n=== Querying Data (Service Role) ===')
    const { data, error, count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
    
    console.log('Error:', error)
    console.log('Count:', count)
    console.log('Data Length:', data ? data.length : 0)
    console.log('Data:', JSON.stringify(data, null, 2))
    
    if (data && data.length > 0) {
      console.log('\n=== Admin Data Found ===')
      data.forEach((admin, i) => {
        console.log(`\nAdmin ${i + 1}:`)
        console.log('  ID:', admin.id)
        console.log('  Email:', admin.email)
        console.log('  Nama:', admin.nama)
        console.log('  Aktif:', admin.aktif)
        console.log('  Has Password:', !!admin.password_hash)
        console.log('  Created:', admin.created_at)
      })
    } else {
      console.log('\n⚠️  Tabel ada tapi KOSONG!')
      console.log('Data admin belum diinsert ke tabel ini.')
    }
    
    // Cek semua tabel di schema public
    console.log('\n=== All Tables in Public Schema ===')
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
      })
    
    if (!tablesError && tables) {
      const adminTable = tables.find(t => t.table_name === 'admin_users')
      if (adminTable) {
        console.log('✓ admin_users table EXISTS')
      } else {
        console.log('✗ admin_users table NOT FOUND')
      }
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkAdmin()
