import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin() {
  try {
    console.log('Checking admin_users table...')
    console.log('URL:', supabaseUrl)
    
    // Cek data admin
    const { data, error, count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
    
    console.log('\n=== Query Result ===')
    console.log('Error:', error)
    console.log('Count:', count)
    console.log('Data:', data)
    
    if (data && data.length > 0) {
      console.log('\n=== Admin Data ===')
      data.forEach((admin, i) => {
        console.log(`Admin ${i + 1}:`)
        console.log('  ID:', admin.id)
        console.log('  Email:', admin.email)
        console.log('  Nama:', admin.nama)
        console.log('  Aktif:', admin.aktif)
        console.log('  Created:', admin.created_at)
      })
    } else {
      console.log('\n⚠️  Tidak ada data admin ditemukan!')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkAdmin()
