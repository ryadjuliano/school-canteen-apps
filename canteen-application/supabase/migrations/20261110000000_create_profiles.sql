-- =====================================================================
-- KantinKu: tabel user untuk login & registrasi
--
-- Login/registrasi memakai Supabase Auth (tabel auth.users yang sudah
-- disediakan Supabase: email, password hash, sesi). Tabel public.profiles
-- menyimpan data tambahan tiap user dan dibuat otomatis saat user daftar.
-- =====================================================================

-- Peran user di aplikasi kantin
create type public.user_role as enum ('admin', 'penjual', 'siswa');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 100),
  email       text not null unique,
  role        public.user_role not null default 'siswa',
  class_name  text,             -- kelas siswa, mis. "XI IPA-1"
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Data profil user KantinKu, 1:1 dengan auth.users';

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Buat profil otomatis saat user registrasi (supabase.auth.signUp)
-- Data diambil dari options.data (raw_user_meta_data).
-- Peran SELALU 'siswa' saat daftar; admin/penjual diangkat manual oleh admin
-- supaya orang tidak bisa mendaftar sendiri sebagai admin.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
begin
  -- Nama kosong/terlalu pendek → pakai email (selalu ≥ 3 karakter)
  if char_length(v_name) < 2 then
    v_name := left(new.email, 100);
  end if;

  insert into public.profiles (id, full_name, email, class_name)
  values (
    new.id,
    v_name,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'class_name'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sinkronkan email jika user mengganti email di Auth
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------
-- Helper: apakah user yang sedang login adalah admin?
-- security definer agar tidak rekursif terhadap RLS profiles.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "User bisa melihat profilnya sendiri"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Admin bisa melihat semua profil"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

create policy "User bisa mengubah profilnya sendiri"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Admin bisa mengubah semua profil"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- User biasa hanya boleh mengubah kolom ini (bukan role/email/id).
-- Perubahan role dilakukan admin lewat SQL editor / service role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, class_name, phone, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Cara menjadikan user sebagai admin (jalankan di SQL Editor):
--   update public.profiles set role = 'admin' where email = 'email@sekolah.sch.id';
-- ---------------------------------------------------------------------
