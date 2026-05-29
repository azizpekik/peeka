#!/bin/bash

echo "=========================================="
echo "Peeka Superadmin Setup Helper"
echo "=========================================="
echo ""

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "This script will help you set up the superadmin table."
echo ""
echo "Please make sure you have:"
echo "1. Created the admin_users table in Supabase SQL Editor"
echo "2. Added the SQL from the login page"
echo ""
echo "SQL to run in Supabase SQL Editor:"
echo "----------------------------------------"
cat << 'EOF'
-- Create admin_users table
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

-- Create indexes
create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_admin_users_aktif on public.admin_users(aktif);

-- Enable RLS
alter table public.admin_users enable row level security;
EOF
echo "----------------------------------------"
echo ""
echo "After running the SQL above:"
echo "1. Go to /superadmin/login in your browser"
echo "2. Click 'Setup Admin Sekarang'"
echo "3. Login with: admin@peeka.id / admin123"
echo ""
