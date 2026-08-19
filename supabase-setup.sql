-- ============================================================
--  BW Training — ตั้งค่าฐานข้อมูล Supabase
--  วิธีใช้: เปิด https://supabase.com/dashboard/project/ysizedrlzcskezxpyvzg/sql/new
--          วางทั้งไฟล์นี้แล้วกด Run  (รันครั้งเดียวพอ)
-- ============================================================

-- ---------- 1) ตารางเก็บใบขอเสนอราคา / ข้อความติดต่อ ----------
create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  form        text        not null default 'quote',   -- quote | contact | quick
  page        text,                                   -- หน้าที่ส่งมา
  name        text,
  phone       text,
  email       text,
  company     text,
  activity    text,
  payload     jsonb       not null default '{}'::jsonb, -- ข้อมูลทุกช่องแบบเต็ม
  status      text        not null default 'new'       -- new | contacted | quoted | closed
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- ให้เว็บไซต์ (คีย์สาธารณะ) ส่งข้อมูลเข้ามาได้อย่างเดียว อ่านไม่ได้
drop policy if exists "anon can submit leads" on public.leads;
create policy "anon can submit leads"
  on public.leads for insert to anon with check (true);

-- ผู้ที่ล็อกอินระบบ Supabase แล้วเท่านั้นจึงจะอ่านได้
drop policy if exists "authenticated can read leads" on public.leads;
create policy "authenticated can read leads"
  on public.leads for select to authenticated using (true);


-- ---------- 2) ตารางเก็บเนื้อหาเว็บไซต์ (ระบบหลังบ้าน) ----------
create table if not exists public.site_content (
  id          int primary key default 1,
  content     jsonb       not null,
  updated_at  timestamptz not null default now(),
  constraint  site_content_single_row check (id = 1)
);

alter table public.site_content enable row level security;

-- ใครก็อ่านเนื้อหาได้ (เพราะเว็บไซต์ต้องใช้แสดงผล)
drop policy if exists "anyone can read content" on public.site_content;
create policy "anyone can read content"
  on public.site_content for select to anon, authenticated using (true);

-- แต่ห้ามแก้ผ่านคีย์สาธารณะโดยตรง — ต้องผ่านฟังก์ชันที่ตรวจรหัสผ่านด้านล่าง


-- ---------- 3) ตารางเก็บรหัสผ่านหลังบ้าน ----------
create table if not exists public.admin_secret (
  id   int primary key default 1,
  pass text not null,
  constraint admin_secret_single_row check (id = 1)
);

alter table public.admin_secret enable row level security;
-- ไม่สร้าง policy ใดๆ = คีย์สาธารณะอ่านไม่ได้เลย

-- ตั้งรหัสผ่านเริ่มต้น (เปลี่ยนได้ที่นี่)
insert into public.admin_secret (id, pass) values (1, 'bwtraining2026')
on conflict (id) do nothing;


-- ---------- 4) ฟังก์ชันบันทึกเนื้อหา (ตรวจรหัสผ่านก่อน) ----------
create or replace function public.save_site_content(p_content jsonb, p_pass text)
returns void
language plpgsql
security definer          -- ทำงานด้วยสิทธิ์เจ้าของ จึงข้าม RLS ได้
set search_path = public
as $$
begin
  if not exists (select 1 from public.admin_secret where id = 1 and pass = p_pass) then
    raise exception 'รหัสผ่านไม่ถูกต้อง';
  end if;

  insert into public.site_content (id, content, updated_at)
  values (1, p_content, now())
  on conflict (id) do update
    set content = excluded.content, updated_at = now();
end;
$$;

revoke all on function public.save_site_content(jsonb, text) from public;
grant execute on function public.save_site_content(jsonb, text) to anon, authenticated;


-- ---------- เสร็จแล้ว ----------
-- ตรวจผล:
--   select * from public.leads order by created_at desc limit 10;
--   select updated_at from public.site_content;
