-- ============================================================
-- BW Training — สร้าง "คลังรูป" สำหรับเก็บรูปที่อัปโหลดจากหลังบ้าน
--
-- ทำไมต้องมี:
--   เดิมรูปที่อัปโหลดถูกฝังเป็นข้อความยาวๆ ปนอยู่กับเนื้อหาเว็บ
--   ทำให้เนื้อหาบวมเป็นหลายเมกะไบต์ ผู้เข้าชมต้องรอโหลดก้อนใหญ่ทุกครั้ง
--   จึงเห็นรูปเก่าค้างอยู่ครู่หนึ่งก่อนเปลี่ยนเป็นรูปใหม่
--   เก็บเป็นไฟล์แยกแบบนี้ เนื้อหาจะเหลือไม่กี่สิบกิโลไบต์ และเบราว์เซอร์เก็บรูปไว้ใช้ซ้ำได้
--
-- วิธีใช้: เปิด Supabase → SQL Editor → วางทั้งหมดนี้ → กด Run
--          รันซ้ำได้ ไม่มีผลเสีย
-- ============================================================

-- 1) สร้างถังเก็บรูปแบบเปิดอ่านสาธารณะ (รูปบนเว็บต้องให้ทุกคนเปิดดูได้อยู่แล้ว)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- 2) ใครก็เปิดดูรูปได้ (จำเป็น เพราะรูปต้องแสดงบนหน้าเว็บ)
drop policy if exists "อ่านรูปในคลังได้ทุกคน" on storage.objects;
create policy "อ่านรูปในคลังได้ทุกคน"
  on storage.objects for select
  using (bucket_id = 'site-images');

-- 3) อนุญาตให้หน้าเว็บอัปโหลดรูปเข้าถังนี้ได้
--    หมายเหตุด้านความปลอดภัย: คีย์ที่ฝังในหน้าเว็บเป็นคีย์สาธารณะ
--    จึงเท่ากับเปิดให้อัปโหลดไฟล์รูปเข้าถังนี้ได้ (จำกัดเฉพาะไฟล์รูป ไม่เกิน 5 MB
--    และเข้าถังนี้ถังเดียว แก้ไข/ลบเนื้อหาเว็บยังต้องใช้รหัสผ่านเหมือนเดิม)
--    ถ้าพบไฟล์แปลกปลอม ลบทิ้งได้ที่ Supabase → Storage → site-images
drop policy if exists "อัปโหลดรูปเข้าคลังได้" on storage.objects;
create policy "อัปโหลดรูปเข้าคลังได้"
  on storage.objects for insert
  with check (bucket_id = 'site-images');

-- 4) อนุญาตให้เขียนทับไฟล์เดิมได้ (ใช้ตอนอัปโหลดซ้ำชื่อเดิม)
drop policy if exists "เขียนทับรูปในคลังได้" on storage.objects;
create policy "เขียนทับรูปในคลังได้"
  on storage.objects for update
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');

-- เสร็จแล้ว — กลับไปที่หน้า admin แท็บ "⚙️ ตั้งค่า"
-- แล้วกดปุ่ม "📦 ย้ายรูปที่ฝังไว้ขึ้นคลังรูป" หนึ่งครั้ง
