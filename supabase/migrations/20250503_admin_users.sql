-- Table: admin_users
-- Menyimpan data administrator superadmin

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

-- Index untuk query cepat
create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_admin_users_aktif on public.admin_users(aktif);

-- RLS Policy
alter table public.admin_users enable row level security;

-- Hanya service role yang bisa mengakses tabel ini
-- (RLS di-disable untuk service role by default)

-- Comment
comment on table public.admin_users is 'Tabel untuk menyimpan data administrator superadmin';
comment on column public.admin_users.password_hash is 'Password yang sudah di-hash dengan bcrypt';
comment on column public.admin_users.aktif is 'Status aktif/non-aktif akun admin';
