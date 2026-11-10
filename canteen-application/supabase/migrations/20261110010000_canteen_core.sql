-- =====================================================================
-- KantinKu: stan, menu, pesanan, dan saldo jajan
-- Jalankan SETELAH 20261110000000_create_profiles.sql
--
-- Tugas tiap peran:
--   admin   : kelola stan, menu semua stan, pengguna (ubah peran), top up saldo,
--             pantau & ubah status semua pesanan
--   penjual : kelola menu & stok stannya, buka/tutup stan, proses pesanan masuk
--   siswa   : pesan jajan (bayar pakai saldo), lihat/batalkan pesanan, lihat saldo
--
-- Perubahan penting (pesan, ubah status, batal, top up, ubah peran) hanya lewat
-- fungsi RPC di bawah supaya saldo & stok selalu konsisten.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Saldo jajan siswa (hanya bisa diubah lewat RPC, bukan oleh user)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column balance integer not null default 0 check (balance >= 0);

-- ---------------------------------------------------------------------
-- Stan kantin
-- ---------------------------------------------------------------------
create table public.stalls (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 60),
  emoji       text not null default '🏪',
  description text,
  owner_id    uuid references public.profiles (id) on delete set null,
  is_open     boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index stalls_owner_unique on public.stalls (owner_id) where owner_id is not null;

-- ---------------------------------------------------------------------
-- Menu makanan / minuman
-- ---------------------------------------------------------------------
create table public.menu_items (
  id           bigint generated always as identity primary key,
  stall_id     bigint not null references public.stalls (id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 80),
  emoji        text not null default '🍱',
  price        integer not null check (price > 0),
  stock        integer not null default 0 check (stock >= 0),
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index menu_items_stall_idx on public.menu_items (stall_id);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Pesanan (1 pesanan = 1 stan; checkout multi-stan dipecah per stan)
-- ---------------------------------------------------------------------
create type public.order_status as enum
  ('menunggu', 'disiapkan', 'siap_diambil', 'selesai', 'dibatalkan');

create table public.orders (
  id           bigint generated always as identity (start with 1001) primary key,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  stall_id     bigint not null references public.stalls (id) on delete restrict,
  -- snapshot agar penjual bisa melihat nama pemesan tanpa akses tabel profiles
  student_name text not null,
  class_name   text,
  status       public.order_status not null default 'menunggu',
  total        integer not null check (total >= 0),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index orders_student_idx on public.orders (student_id, created_at desc);
create index orders_stall_idx on public.orders (stall_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id           bigint generated always as identity primary key,
  order_id     bigint not null references public.orders (id) on delete cascade,
  menu_item_id bigint references public.menu_items (id) on delete set null,
  name         text not null,
  emoji        text not null,
  price        integer not null,
  qty          integer not null check (qty > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- Riwayat top up saldo
-- ---------------------------------------------------------------------
create table public.balance_topups (
  id         bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  admin_id   uuid references public.profiles (id) on delete set null,
  amount     integer not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index balance_topups_student_idx on public.balance_topups (student_id, created_at desc);

-- ---------------------------------------------------------------------
-- Helper peran
-- ---------------------------------------------------------------------
create or replace function public.current_role_name()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

-- Apakah user yang login pemilik stan ini?
create or replace function public.owns_stall(p_stall_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.stalls
    where id = p_stall_id and owner_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.stalls         enable row level security;
alter table public.menu_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.balance_topups enable row level security;

-- stalls: semua user login boleh lihat; admin kelola; penjual ubah stannya
create policy "stalls_select" on public.stalls for select to authenticated using (true);
create policy "stalls_admin_insert" on public.stalls for insert to authenticated
  with check ((select public.is_admin()));
create policy "stalls_admin_delete" on public.stalls for delete to authenticated
  using ((select public.is_admin()));
create policy "stalls_update" on public.stalls for update to authenticated
  using ((select public.is_admin()) or owner_id = (select auth.uid()))
  with check ((select public.is_admin()) or owner_id = (select auth.uid()));

-- menu_items: semua user login boleh lihat; admin / pemilik stan kelola
create policy "menu_select" on public.menu_items for select to authenticated using (true);
create policy "menu_insert" on public.menu_items for insert to authenticated
  with check ((select public.is_admin()) or public.owns_stall(stall_id));
create policy "menu_update" on public.menu_items for update to authenticated
  using ((select public.is_admin()) or public.owns_stall(stall_id))
  with check ((select public.is_admin()) or public.owns_stall(stall_id));
create policy "menu_delete" on public.menu_items for delete to authenticated
  using ((select public.is_admin()) or public.owns_stall(stall_id));

-- orders: siswa lihat miliknya, penjual lihat stannya, admin lihat semua.
-- Tidak ada insert/update langsung: wajib lewat RPC.
create policy "orders_select" on public.orders for select to authenticated
  using (
    student_id = (select auth.uid())
    or public.owns_stall(stall_id)
    or (select public.is_admin())
  );

create policy "order_items_select" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- topups: siswa lihat miliknya, admin lihat semua
create policy "topups_select" on public.balance_topups for select to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

-- Hak kolom: penjual tidak boleh memindahkan pemilik stan
revoke insert, update, delete on public.orders, public.order_items, public.balance_topups
  from authenticated, anon;
revoke update on public.stalls from authenticated, anon;
grant update (name, emoji, description, is_open) on public.stalls to authenticated;
-- owner_id stan diubah lewat RPC assign_stall_owner (admin)

-- ---------------------------------------------------------------------
-- RPC: siswa memesan.  p_items = [{"menu_item_id": 1, "qty": 2}, ...]
-- Mengurangi stok & saldo, membuat 1 pesanan per stan. Mengembalikan id pesanan.
-- ---------------------------------------------------------------------
create or replace function public.place_order(p_items jsonb, p_note text default null)
returns bigint[]
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles;
  v_total    integer := 0;
  v_order_id bigint;
  v_ids      bigint[] := '{}';
  r          record;
  s          record;
begin
  select * into v_profile from public.profiles where id = v_uid for update;
  if v_profile.id is null or v_profile.role <> 'siswa' then
    raise exception 'Hanya siswa yang bisa memesan.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong.';
  end if;

  -- Gabungkan item yang sama lalu kunci baris menu
  drop table if exists pg_temp._cart;
  create temp table _cart on commit drop as
    select (x ->> 'menu_item_id')::bigint as menu_item_id, sum((x ->> 'qty')::int)::int as qty
    from jsonb_array_elements(p_items) x
    group by 1;

  if exists (select 1 from pg_temp._cart where qty is null or qty <= 0 or qty > 20) then
    raise exception 'Jumlah pesanan tidak valid.';
  end if;

  for r in
    select c.qty, m.*, st.is_open, st.name as stall_name
    from pg_temp._cart c
    join public.menu_items m on m.id = c.menu_item_id
    join public.stalls st on st.id = m.stall_id
    order by m.id
    for update of m
  loop
    if not r.is_open then
      raise exception 'Stan % sedang tutup.', r.stall_name;
    end if;
    if not r.is_available or r.stock < r.qty then
      raise exception 'Stok % tidak cukup (sisa %).', r.name, r.stock;
    end if;
    v_total := v_total + r.price * r.qty;
  end loop;

  if (select count(*) from pg_temp._cart) <> (
    select count(*) from pg_temp._cart c join public.menu_items m on m.id = c.menu_item_id
  ) then
    raise exception 'Ada menu yang sudah tidak tersedia.';
  end if;

  if v_profile.balance < v_total then
    raise exception 'Saldo tidak cukup. Saldo kamu Rp%, total Rp%.', v_profile.balance, v_total;
  end if;

  for s in
    select m.stall_id, sum(m.price * c.qty)::int as total
    from pg_temp._cart c join public.menu_items m on m.id = c.menu_item_id
    group by m.stall_id
  loop
    insert into public.orders (student_id, stall_id, student_name, class_name, total, note)
    values (v_uid, s.stall_id, v_profile.full_name, v_profile.class_name, s.total, nullif(trim(p_note), ''))
    returning id into v_order_id;

    insert into public.order_items (order_id, menu_item_id, name, emoji, price, qty)
    select v_order_id, m.id, m.name, m.emoji, m.price, c.qty
    from pg_temp._cart c join public.menu_items m on m.id = c.menu_item_id
    where m.stall_id = s.stall_id;

    v_ids := v_ids || v_order_id;
  end loop;

  update public.menu_items m set stock = m.stock - c.qty
  from pg_temp._cart c where m.id = c.menu_item_id;

  update public.profiles set balance = balance - v_total where id = v_uid;

  return v_ids;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: penjual/admin memajukan status pesanan
-- menunggu → disiapkan → siap_diambil → selesai
-- ---------------------------------------------------------------------
create or replace function public.advance_order_status(p_order_id bigint)
returns public.order_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
  v_next  public.order_status;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if not (public.is_admin() or public.owns_stall(v_order.stall_id)) then
    raise exception 'Kamu tidak berhak mengubah pesanan ini.';
  end if;

  v_next := case v_order.status
    when 'menunggu'     then 'disiapkan'
    when 'disiapkan'    then 'siap_diambil'
    when 'siap_diambil' then 'selesai'
  end;
  if v_next is null then
    raise exception 'Pesanan sudah %.', v_order.status;
  end if;

  update public.orders set status = v_next where id = p_order_id;
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: batalkan pesanan (status masih 'menunggu')
-- Boleh oleh siswa pemesan, penjual stan, atau admin. Saldo & stok dikembalikan.
-- ---------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if not (v_order.student_id = auth.uid() or public.is_admin() or public.owns_stall(v_order.stall_id)) then
    raise exception 'Kamu tidak berhak membatalkan pesanan ini.';
  end if;
  if v_order.status <> 'menunggu' then
    raise exception 'Pesanan yang sudah diproses tidak bisa dibatalkan.';
  end if;

  update public.orders set status = 'dibatalkan' where id = p_order_id;
  update public.profiles set balance = balance + v_order.total where id = v_order.student_id;
  update public.menu_items m set stock = m.stock + oi.qty
  from public.order_items oi
  where oi.order_id = p_order_id and m.id = oi.menu_item_id;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin top up saldo siswa
-- ---------------------------------------------------------------------
create or replace function public.top_up_balance(p_student_id uuid, p_amount integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_balance integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang bisa top up saldo.';
  end if;
  if p_amount is null or p_amount < 1000 or p_amount > 1000000 then
    raise exception 'Nominal top up harus Rp1.000 – Rp1.000.000.';
  end if;

  update public.profiles set balance = balance + p_amount
  where id = p_student_id and role = 'siswa'
  returning balance into v_balance;
  if v_balance is null then
    raise exception 'Siswa tidak ditemukan.';
  end if;

  insert into public.balance_topups (student_id, admin_id, amount)
  values (p_student_id, auth.uid(), p_amount);
  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin mengubah peran user
-- ---------------------------------------------------------------------
create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang bisa mengubah peran.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Kamu tidak bisa mengubah peranmu sendiri.';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  -- Bukan penjual lagi → lepas dari stan
  if p_role <> 'penjual' then
    update public.stalls set owner_id = null where owner_id = p_user_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- RPC: admin menetapkan penjual sebagai pemilik stan (null = kosongkan)
-- ---------------------------------------------------------------------
create or replace function public.assign_stall_owner(p_stall_id bigint, p_owner_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang bisa mengatur pemilik stan.';
  end if;
  if p_owner_id is not null and not exists (
    select 1 from public.profiles where id = p_owner_id and role = 'penjual'
  ) then
    raise exception 'Pemilik stan harus ber-peran penjual.';
  end if;

  -- 1 penjual = 1 stan
  update public.stalls set owner_id = null where owner_id = p_owner_id and id <> p_stall_id;
  update public.stalls set owner_id = p_owner_id where id = p_stall_id;
end;
$$;

-- Hanya user login yang boleh memanggil RPC
revoke execute on function
  public.place_order(jsonb, text),
  public.advance_order_status(bigint),
  public.cancel_order(bigint),
  public.top_up_balance(uuid, integer),
  public.set_user_role(uuid, public.user_role),
  public.assign_stall_owner(bigint, uuid)
from public, anon;
grant execute on function
  public.place_order(jsonb, text),
  public.advance_order_status(bigint),
  public.cancel_order(bigint),
  public.top_up_balance(uuid, integer),
  public.set_user_role(uuid, public.user_role),
  public.assign_stall_owner(bigint, uuid)
to authenticated;

-- ---------------------------------------------------------------------
-- Data awal: stan & menu contoh (pemilik stan diatur admin dari aplikasi)
-- ---------------------------------------------------------------------
insert into public.stalls (name, emoji, description) values
  ('Dapur Bu Ani',          '🍱', 'Nasi & lauk rumahan'),
  ('Mie & Bakso Pak Joko',  '🍜', 'Mie ayam, bakso, minuman segar'),
  ('Sehat Segar',           '🥗', 'Buah, salad, susu'),
  ('Roti & Snack',          '🥪', 'Roti isi dan camilan');

insert into public.menu_items (stall_id, name, emoji, price, stock)
select s.id, m.name, m.emoji, m.price, m.stock
from (values
  ('Dapur Bu Ani',         'Nasi Ayam Teriyaki', '🍱', 15000, 40),
  ('Dapur Bu Ani',         'Nasi Goreng Telur',  '🍳', 13000, 30),
  ('Dapur Bu Ani',         'Es Teh Manis',       '🧋',  4000, 80),
  ('Mie & Bakso Pak Joko', 'Mie Ayam',           '🍜', 12000, 35),
  ('Mie & Bakso Pak Joko', 'Bakso Kuah',         '🍲', 13000, 30),
  ('Mie & Bakso Pak Joko', 'Es Jeruk',           '🍊',  5000, 50),
  ('Sehat Segar',          'Salad Buah',         '🥗', 10000, 20),
  ('Sehat Segar',          'Susu UHT',           '🥛',  6000,  4),
  ('Sehat Segar',          'Jus Jambu',          '🧃',  8000, 25),
  ('Roti & Snack',         'Roti Isi Coklat',    '🥪',  5000, 30),
  ('Roti & Snack',         'Roti Isi Keju',      '🧀',  5000,  6)
) as m(stall, name, emoji, price, stock)
join public.stalls s on s.name = m.stall;
