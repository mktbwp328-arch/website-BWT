/* ============================================================
   BW Training — เชื่อมต่อ Supabase
   ใช้ REST API ตรงๆ ไม่ต้องโหลดไลบรารีเพิ่ม เว็บจึงยังเบาเหมือนเดิม

   ทำอะไรบ้าง
   1) ส่งใบขอเสนอราคา / ข้อความติดต่อ เข้าตาราง leads
   2) ดึงเนื้อหาเว็บไซต์จากตาราง site_content (ให้ทุกเครื่องเห็นตรงกัน)
   3) บันทึกเนื้อหาจากโหมดแก้ไขกลับขึ้น Supabase

   หมายเหตุ: คีย์ด้านล่างเป็น "publishable key" ออกแบบมาให้ใช้ฝั่งหน้าเว็บได้
   สิทธิ์ถูกจำกัดด้วย Row Level Security ในฐานข้อมูล (ดูไฟล์ supabase-setup.sql)
   ============================================================ */
(function () {
  "use strict";

  const URL = "https://ysizedrlzcskezxpyvzg.supabase.co";
  const KEY = "sb_publishable_cOJ84dbKF10hEh6Tfj8xRQ_A6CvWR_L";

  const headers = (extra) => Object.assign({
    "apikey": KEY,
    "Authorization": "Bearer " + KEY,
    "Content-Type": "application/json"
  }, extra || {});

  const api = URL + "/rest/v1";

  /* ---------- ส่งข้อมูลจากฟอร์ม ---------- */
  async function saveLead(data, formType) {
    const row = {
      form: formType || "quote",
      page: (location.pathname.split("/").pop() || "index.html"),
      name: data["ชื่อผู้ติดต่อ"] || null,
      phone: data["เบอร์โทรศัพท์"] || null,
      email: data["อีเมล"] || null,
      company: data["ชื่อบริษัท"] || null,
      activity: data["ประเภทกิจกรรม"] || null,
      payload: data
    };
    const res = await fetch(api + "/leads", {
      method: "POST",
      headers: headers({ "Prefer": "return=minimal" }),
      body: JSON.stringify(row)
    });
    if (!res.ok) throw new Error("supabase " + res.status + " " + (await res.text()).slice(0, 200));
    return true;
  }

  /* ---------- ถามแค่ "แก้ล่าสุดเมื่อไหร่" ----------
     ข้อมูลไม่กี่สิบไบต์ ใช้เช็คก่อนว่าต้องโหลดเนื้อหาก้อนใหญ่ใหม่หรือไม่
     ถ้าไม่มีอะไรเปลี่ยน ก็ไม่ต้องโหลดซ้ำ หน้าเว็บจึงไม่กระพริบ */
  async function fetchStamp() {
    const res = await fetch(api + "/site_content?id=eq.1&select=updated_at", {
      headers: headers(), cache: "no-store"
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows[0] ? rows[0].updated_at : null;
  }

  /* ---------- ดึงเนื้อหาเว็บไซต์ ---------- */
  async function fetchContent() {
    const res = await fetch(api + "/site_content?id=eq.1&select=content,updated_at", {
      headers: headers(), cache: "no-store"
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows[0] ? rows[0] : null;
  }

  /* ---------- บันทึกเนื้อหากลับขึ้น Supabase (ต้องใส่รหัสผ่าน) ---------- */
  async function saveContent(content, pass) {
    const res = await fetch(api + "/rpc/save_site_content", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ p_content: content, p_pass: pass })
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 200));
    return true;
  }

  /* ---------- อัปโหลดรูปขึ้นคลังรูป (Supabase Storage) ----------
     เก็บรูปเป็น "ไฟล์" แทนการฝังเป็นข้อความยาวๆ ในเนื้อหา
     ข้อดี: เนื้อหาเว็บเล็กลงมาก โหลดเร็ว และเบราว์เซอร์เก็บรูปไว้ใช้ซ้ำได้
     ถ้ายังไม่ได้สร้างถังเก็บรูป ฟังก์ชันนี้จะโยน error ออกไป
     แล้วระบบจะกลับไปฝังรูปแบบเดิมให้อัตโนมัติ (ใช้งานได้ไม่สะดุด) */
  const BUCKET = "site-images";

  async function uploadImage(blob, hintName) {
    const safe = (hintName || "img").replace(/[^a-z0-9]+/gi, "-").slice(0, 40).toLowerCase();
    const file = `${safe}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${file}`, {
      method: "POST",
      headers: {
        "apikey": KEY,
        "Authorization": "Bearer " + KEY,
        "Content-Type": blob.type || "image/jpeg",
        "x-upsert": "true"
      },
      body: blob
    });
    if (!res.ok) throw new Error("storage " + res.status + " " + (await res.text()).slice(0, 160));
    return `${URL}/storage/v1/object/public/${BUCKET}/${file}`;
  }

  /* ตรวจว่าถังเก็บรูปพร้อมใช้หรือยัง (ใช้ตัดสินใจว่าจะอัปโหลดหรือฝังรูป) */
  async function storageReady() {
    try {
      const res = await fetch(`${URL}/storage/v1/object/list/${BUCKET}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ prefix: "", limit: 1 })
      });
      if (!res.ok) return false;
      // ถังที่ยังไม่ถูกสร้าง จะตอบ 200 พร้อมข้อความ NoSuchBucket จึงต้องอ่านเนื้อหาด้วย
      const body = await res.text();
      return !body.includes("NoSuchBucket") && !body.includes("Bucket not found");
    } catch (e) { return false; }
  }

  /* แปลงรูปที่ฝังไว้เป็นไฟล์ (ใช้ตอนย้ายรูปเก่าขึ้นคลัง) */
  function dataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(",");
    const mime = (head.match(/:(.*?);/) || [])[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* ---------- ตรวจว่าเชื่อมต่อได้ไหม ---------- */
  async function ping() {
    try {
      const res = await fetch(api + "/site_content?select=id&limit=1", { headers: headers() });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, status: 0, error: String(e) };
    }
  }

  window.BWT_DB = {
    url: URL, saveLead, fetchStamp, fetchContent, saveContent, ping,
    uploadImage, storageReady, dataUrlToBlob, BUCKET
  };
})();
