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

  /* ---------- ตรวจว่าเชื่อมต่อได้ไหม ---------- */
  async function ping() {
    try {
      const res = await fetch(api + "/site_content?select=id&limit=1", { headers: headers() });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, status: 0, error: String(e) };
    }
  }

  window.BWT_DB = { url: URL, saveLead, fetchContent, saveContent, ping };
})();
