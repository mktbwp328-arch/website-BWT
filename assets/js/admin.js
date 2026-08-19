/* ============================================================
   BW Training — ระบบหลังบ้าน (แก้ไขเนื้อหาเว็บไซต์)
   เก็บข้อมูลใน localStorage ของเบราว์เซอร์ + ส่งออก/นำเข้าไฟล์ JSON
   ============================================================ */
(function () {
  "use strict";

  const LS_SITE = "bwt_site_v1", LS_LEADS = "bwt_leads_v1", LS_PW = "bwt_pw", LS_AUTH = "bwt_auth";
  const DEFAULT_PW = "bwtraining2026";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  let D = load();

  function load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS_SITE) || "null"); } catch (e) {}
    const base = JSON.parse(JSON.stringify(window.BWT_DEFAULT));
    // ข้อมูลเก่าคนละรุ่นกับไฟล์ data.js → ทิ้ง ใช้ของใหม่จากไฟล์
    if (saved && saved.version !== base.version) { localStorage.removeItem(LS_SITE); saved = null; }
    const out = saved ? Object.assign(base, saved) : base;
    out.version = base.version;
    return out;
  }
  function toast(t, bad) {
    const el = $("#toast"); el.textContent = t; el.style.background = bad ? "#b02a2a" : "#146c3a";
    el.classList.add("on"); setTimeout(() => el.classList.remove("on"), 2200);
  }

  /* ---------- login ---------- */
  function pw() { return localStorage.getItem(LS_PW) || DEFAULT_PW; }
  function tryLogin() {
    if ($("#pw").value === pw()) {
      sessionStorage.setItem(LS_AUTH, "1"); showApp();
    } else toast("รหัสผ่านไม่ถูกต้อง", true);
  }
  function showApp() { $("#login").style.display = "none"; $("#app").style.display = "block"; build(); }
  $("#loginBtn").addEventListener("click", tryLogin);
  $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

  /* ---------- helpers to build fields ---------- */
  const TABS = [
    ["company", "🏢 ข้อมูลบริษัท"], ["hero", "🎬 แบนเนอร์หน้าแรก"], ["stats", "📊 ตัวเลขสถิติ"],
    ["expertise", "⭐ แถบความเชี่ยวชาญ"], ["intro", "📰 บทความแนะนำบริษัท"], ["services", "🧩 บริการ (7 หมวด)"], ["portfolio", "🖼 ผลงาน"],
    ["clients", "🤝 ลูกค้า"], ["testimonials", "💬 รีวิวลูกค้า"], ["blog", "📝 บทความ"],
    ["faq", "❓ คำถามที่พบบ่อย"], ["about", "ℹ️ เกี่ยวกับเรา"], ["seo", "🔍 SEO"],
    ["leads", "📥 ใบขอเสนอราคา"], ["settings", "⚙️ ตั้งค่า"]
  ];

  const PRESET_IMAGES = [
    ["assets/img/hero-outing.jpg", "🖼 Outing ทะเล"],
    ["assets/img/svc-outing.jpg", "🏝️ บริการ Outing"],
    ["assets/img/svc-seminar.jpg", "🎤 กิจกรรมสัมมนา"],
    ["assets/img/svc-team.jpg", "🤝 Team Building"],
    ["assets/img/svc-travel.jpg", "✈️ ท่องเที่ยวองค์กร"],
    ["assets/img/svc-workshop.jpg", "🎨 Workshop"],
    ["assets/img/svc-party.jpg", "🎉 Night Party"],
    ["assets/img/scene-csr.svg", "🌱 กิจกรรม CSR"]
  ];

  function imgFld(label, path, value) {
    const presets = PRESET_IMAGES.map(([url, name]) => `<option value="${url}">${name}</option>`).join("");
    return `<div class="field" style="grid-column:1/-1;background:#fff;padding:14px;border:1px dashed var(--blue);border-radius:12px">
      <label style="font-weight:700;color:var(--blue)">🖼️ ${label}</label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px">
        <input data-path="${path}" id="inp_${path.replace(/\./g, '_')}" type="text" value="${esc(value)}" style="flex:1;min-width:240px" placeholder="วางลิงก์รูปภาพ หรือเลือกจากไฟล์เครื่อง">
        <label class="addbtn" style="cursor:pointer;margin:0;padding:8px 16px;background:var(--blue);color:#fff;font-size:0.85rem">
          📁 เลือกรูปจากคอม... <input type="file" accept="image/*" class="img-file-up" data-target="inp_${path.replace(/\./g, '_')}" style="display:none">
        </label>
        <select class="img-preset-sel" data-target="inp_${path.replace(/\./g, '_')}" style="width:auto;padding:8px 12px;font-size:0.85rem">
          <option value="">-- หรือเลือกรูปตัวอย่าง --</option>
          ${presets}
        </select>
      </div>
      <div class="img-prev" data-for="inp_${path.replace(/\./g, '_')}" style="margin-top:8px">
        ${value ? `<img src="${esc(value)}" style="max-height:80px;border-radius:8px;border:1px solid #ddd" alt="ตัวอย่างรูป">` : ""}
      </div>
    </div>`;
  }

  function fld(label, path, value, type) {
    if (type === "img") return imgFld(label, path, value);
    const t = type || "text";
    const input = t === "textarea"
      ? `<textarea data-path="${path}" rows="3">${esc(value)}</textarea>`
      : `<input data-path="${path}" type="${t}" value="${esc(value)}">`;
    return `<div class="field"><label>${label}</label>${input}</div>`;
  }
  function head(title, hint) { return `<h2>${title}</h2><p class="hint">${hint}</p>`; }
  function listBlock(key, addLabel, itemsHtml) {
    return `<div id="list-${key}">${itemsHtml}</div>
      <button class="addbtn" data-add="${key}">+ ${addLabel}</button>`;
  }
  function itemBox(key, i, inner) {
    return `<div class="item"><button class="del" data-del="${key}" data-i="${i}">ลบ</button>
      <div class="idx">รายการที่ ${i + 1}</div>${inner}</div>`;
  }

  /* ---------- panel renderers ---------- */
  const P = {
    company() {
      const c = D.company;
      return head("ข้อมูลบริษัท / ติดต่อ", "ข้อมูลนี้แสดงบนหัวเว็บ ท้ายเว็บ และหน้าติดต่อเราทุกหน้า") + `
        <div class="row">${fld("ชื่อบริษัท (ไทย)", "company.nameTh", c.nameTh)}${fld("ชื่อบริษัท (อังกฤษ)", "company.nameEn", c.nameEn)}</div>
        <div class="row one">${fld("คำโปรย (Tagline)", "company.tagline", c.tagline)}</div>
        <div class="row one">${fld("ที่อยู่", "company.address", c.address, "textarea")}</div>
        <div class="row">${fld("เบอร์โทร (คั่นด้วยจุลภาค ,)", "company.phones", c.phones.join(", "))}${fld("อีเมลรับใบเสนอราคา", "company.email", c.email)}</div>
        <div class="row">${fld("LINE ID", "company.line", c.line)}${fld("ลิงก์ LINE", "company.lineUrl", c.lineUrl)}</div>
        <div class="row">${fld("เวลาทำการ", "company.hours", c.hours)}${fld("ลิงก์ Google Maps", "company.mapUrl", c.mapUrl)}</div>
        <div class="row">${fld("ลิงก์ Facebook", "company.facebook", c.facebook)}${fld("ลิงก์ TikTok", "company.tiktok", c.tiktok)}</div>
        <div class="row">${fld("ลิงก์ YouTube", "company.youtube", c.youtube)}${fld("ลิงก์ Instagram (เว้นว่างถ้าไม่มี)", "company.instagram", c.instagram)}</div>
        <p class="hint">ไอคอนโซเชียลท้ายเว็บมี 4 อัน: Facebook · LINE · TikTok · YouTube (LINE ใช้ลิงก์ในช่องด้านบน)</p>
        <p class="hint">หมายเหตุ: ถ้าเปลี่ยน LINE ID ต้องสร้าง QR Code ใหม่แล้วแทนที่ไฟล์ assets/img/line-qr.svg</p>`;
    },
    hero() {
      const h = D.hero;
      return head("แบนเนอร์หน้าแรก (ปก)", "รูปปก ข้อความ ปุ่ม และริบบิ้นบนหน้าแรก") + `
        <div class="row one">${fld("รูปพื้นหลังปก", "hero.coverImg", h.coverImg, "img")}</div>
        <div class="row">${fld("บรรทัดที่ 1 (น้ำเงิน)", "hero.l1", h.l1)}${fld("บรรทัดที่ 2 (เหลือง)", "hero.l2", h.l2)}</div>
        <div class="row one">${fld("บรรทัดที่ 3 (น้ำเงิน)", "hero.l3", h.l3)}</div>
        <div class="row">${fld("ข้อความรอง บรรทัดบน", "hero.sub", h.sub)}${fld("ข้อความรอง บรรทัดล่าง", "hero.sub2", h.sub2 || "")}</div>
        <div class="row">${fld("ข้อความปุ่มหลัก", "hero.ctaText", h.ctaText)}${fld("ลิงก์ปุ่มหลัก", "hero.ctaLink", h.ctaLink)}</div>
        <div class="row">${fld("ข้อความปุ่มวิดีโอ", "hero.videoText", h.videoText || "")}${fld("ลิงก์วิดีโอแนะนำ (ถ้ามี)", "hero.videoUrl", h.videoUrl || "")}</div>
        <div class="row">${fld("ริบบิ้นเหลือง (บน)", "hero.ribbonTop", h.ribbonTop || "")}${fld("ริบบิ้นน้ำเงิน (ล่าง)", "hero.ribbonBottom", h.ribbonBottom || "")}</div>`;
    },
    stats() {
      return head("ตัวเลขสถิติ", "แถบตัวเลขใต้แบนเนอร์ (นับขึ้นอัตโนมัติ)") +
        listBlock("stats", "เพิ่มตัวเลข", D.stats.map((s, i) => itemBox("stats", i,
          `<div class="row">${fld("ไอคอน (medal / people / shield / award)", `stats.${i}.ico`, s.ico)}${fld("ตัวเลข", `stats.${i}.num`, s.num)}</div>
           <div class="row one">${fld("คำอธิบาย (อังกฤษ)", `stats.${i}.label`, s.label)}</div>`)).join(""));
    },
    services() {
      return head("บริการ", "7 หมวดบริการหลักที่แสดงในหน้าแรกและหน้าบริการ") +
        listBlock("services", "เพิ่มบริการ", D.services.map((s, i) => itemBox("services", i,
          `<div class="row">${fld("รหัส (id — ใช้ทำลิงก์)", `services.${i}.id`, s.id)}${fld("ไอคอน (อีโมจิ)", `services.${i}.ico`, s.ico)}</div>
           <div class="row">${fld("ชื่อบริการ", `services.${i}.title`, s.title)}</div>
           <div class="row one">${fld("รูปภาพบริการ", `services.${i}.img`, s.img || "", "img")}</div>
           <div class="row one">${fld("คำอธิบายสั้น", `services.${i}.desc`, s.desc, "textarea")}</div>
           <div class="row one">${fld("รายละเอียดเต็ม", `services.${i}.detail`, s.detail || "", "textarea")}</div>`)).join(""));
    },
    expertise() {
      const x = D.expertise;
      return head("แถบความเชี่ยวชาญ (หน้าแรก)", "รูปด้านซ้าย + ข้อความด้านขวา") + `
        <div class="row">${fld("ไฟล์รูปภาพ (path)", "expertise.img", x.img)}${fld("ป้ายเล็กด้านบน", "expertise.kicker", x.kicker)}</div>
        ${x.img ? `<img src="${esc(x.img)}" alt="" style="max-height:110px;border-radius:10px;margin-bottom:12px">` : ""}
        <div class="row one">${fld("หัวข้อ", "expertise.title", x.title, "textarea")}</div>
        <div class="row one">${fld("คำอธิบาย", "expertise.desc", x.desc, "textarea")}</div>
        <h3 style="margin-top:18px;font-size:1rem">ป้ายจุดเด่น</h3>
        ${listBlock("expertise.pills", "เพิ่มป้าย", x.pills.map((p, i) => itemBox("expertise.pills", i,
          `<div class="row">${fld("ไอคอน (อีโมจิ)", `expertise.pills.${i}.ico`, p.ico)}${fld("ข้อความ", `expertise.pills.${i}.text`, p.text)}</div>`)).join(""))}`;
    },
    intro() {
      const n = D.intro;
      return head("บทความแนะนำบริษัท (หน้าแรก)", "ข้อความด้านซ้าย + สไลด์ภาพด้านขวา — ใส่ &lt;b&gt;ข้อความ&lt;/b&gt; เพื่อทำตัวหนาได้") + `
        <div class="row one">${fld("หัวข้อ", "intro.title", n.title)}</div>
        <div class="row one">${fld("ข้อความนำ", "intro.lead", n.lead, "textarea")}</div>
        <div class="row one">${fld("หัวข้อย่อย (บรรทัดละ 1 ข้อ)", "intro.bullets", n.bullets.join("\n"), "textarea")}</div>
        <h3 style="margin-top:20px;font-size:1rem">ภาพสไลด์ด้านขวา</h3>
        ${listBlock("intro.gallery", "เพิ่มภาพสไลด์", n.gallery.map((g, i) => itemBox("intro.gallery", i,
          `<div class="row">${fld("ไฟล์รูปภาพ (path)", `intro.gallery.${i}.img`, g.img)}${fld("คำอธิบายรูป (SEO)", `intro.gallery.${i}.alt`, g.alt || "")}</div>
           ${g.img ? `<img src="${esc(g.img)}" alt="" style="max-height:90px;border-radius:8px;margin-top:8px">` : ""}`)).join(""))}`;
    },
    portfolio() {
      return head("ผลงาน", "แสดงเป็นรูปภาพล้วน ไม่มีตัวหนังสือทับ — หมวด (cat) ใช้กับปุ่มกรอง: outing, team, seminar, party, csr") +
        listBlock("portfolio", "เพิ่มผลงาน", D.portfolio.map((p, i) => itemBox("portfolio", i,
          `<div class="row">${fld("ไฟล์รูปภาพ (path)", `portfolio.${i}.img`, p.img || "")}${fld("หมวด (cat)", `portfolio.${i}.cat`, p.cat)}</div>
           <div class="row one">${fld("คำอธิบายรูป (ไม่แสดงบนหน้าเว็บ ใช้เพื่อ SEO)", `portfolio.${i}.alt`, p.alt || "")}</div>
           ${p.img ? `<img src="${esc(p.img)}" alt="" style="max-height:90px;border-radius:8px;margin-top:8px">` : ""}`)).join(""));
    },
    clients() {
      return head("ลูกค้า", "ช่อง “ไฟล์โลโก้” ใส่ path เช่น assets/img/clients/c01.png — ถ้าเว้นว่างจะแสดงเป็นตัวอักษรแทน") +
        listBlock("clients", "เพิ่มลูกค้า", D.clients.map((c, i) => itemBox("clients", i,
          `<div class="row">${fld("ชื่อองค์กร", `clients.${i}.name`, c.name)}${fld("คำอธิบาย", `clients.${i}.note`, c.note)}</div>
           <div class="row one">${fld("ไฟล์โลโก้ (path)", `clients.${i}.logo`, c.logo || "")}</div>
           ${c.logo ? `<img src="${esc(c.logo)}" alt="" style="max-height:56px;margin-top:8px;background:#fff;padding:4px;border-radius:8px">` : ""}`)).join(""));
    },
    testimonials() {
      return head("รีวิวลูกค้า", "ข้อความรีวิวที่แสดงบนหน้าเว็บ") +
        listBlock("testimonials", "เพิ่มรีวิว", D.testimonials.map((t, i) => itemBox("testimonials", i,
          `<div class="row one">${fld("ข้อความรีวิว", `testimonials.${i}.text`, t.text, "textarea")}</div>
           <div class="row">${fld("ชื่อผู้รีวิว", `testimonials.${i}.name`, t.name)}${fld("องค์กร", `testimonials.${i}.org`, t.org)}</div>`)).join(""));
    },
    blog() {
      return head("บทความ", "บทความช่วยเรื่อง SEO/AEO — เขียนให้ตอบคำถามที่ลูกค้าค้นหาจริง") +
        listBlock("blog", "เพิ่มบทความ", D.blog.map((b, i) => itemBox("blog", i,
          `<div class="row">${fld("รหัส (id)", `blog.${i}.id`, b.id)}${fld("วันที่", `blog.${i}.date`, b.date)}</div>
           <div class="row">${fld("หมวด", `blog.${i}.cat`, b.cat)}</div>
           <div class="row one">${fld("รูปภาพบทความ", `blog.${i}.img`, b.img || "", "img")}</div>
           <div class="row one">${fld("หัวข้อ", `blog.${i}.title`, b.title)}</div>
           <div class="row one">${fld("คำโปรย", `blog.${i}.excerpt`, b.excerpt, "textarea")}</div>
           <div class="row one">${fld("เนื้อหา", `blog.${i}.body`, b.body, "textarea")}</div>`)).join(""));
    },
    faq() {
      return head("คำถามที่พบบ่อย (FAQ)", "สำคัญมากต่อ AEO/GEO — เขียนคำตอบให้ตรงคำถาม กระชับ และมีตัวเลขจริง") +
        listBlock("faq", "เพิ่มคำถาม", D.faq.map((f, i) => itemBox("faq", i,
          `<div class="row one">${fld("คำถาม", `faq.${i}.q`, f.q)}</div>
           <div class="row one">${fld("คำตอบ", `faq.${i}.a`, f.a, "textarea")}</div>`)).join(""));
    },
    about() {
      const a = D.about;
      return head("เกี่ยวกับเรา", "ข้อความและไทม์ไลน์ในหน้าเกี่ยวกับเรา") + `
        <div class="row one">${fld("หัวข้อ", "about.headline", a.headline)}</div>
        <div class="row one">${fld("เนื้อหา", "about.body", a.body, "textarea")}</div>
        <div class="row one">${fld("จุดเด่น (คั่นบรรทัดละ 1 ข้อ)", "about.points", a.points.join("\n"), "textarea")}</div>
        <h3 style="margin-top:18px;font-size:1rem">ไทม์ไลน์</h3>
        ${listBlock("about.timeline", "เพิ่มช่วงเวลา", a.timeline.map((t, i) => itemBox("about.timeline", i,
          `<div class="row">${fld("ปี", `about.timeline.${i}.y`, t.y)}${fld("หัวข้อ", `about.timeline.${i}.t`, t.t)}</div>
           <div class="row one">${fld("รายละเอียด", `about.timeline.${i}.d`, t.d, "textarea")}</div>`)).join(""))}`;
    },
    seo() {
      const s = D.seo;
      return head("SEO / AEO / GEO", "ค่าพื้นฐานสำหรับเครื่องมือค้นหาและ AI (ส่วน meta ในแต่ละหน้าแก้ในไฟล์ HTML ได้โดยตรง)") + `
        <div class="row one">${fld("URL เว็บไซต์", "seo.siteUrl", s.siteUrl)}</div>
        <div class="row one">${fld("คำอธิบายเว็บไซต์ (Meta Description)", "seo.defaultDesc", s.defaultDesc, "textarea")}</div>
        <div class="row one">${fld("คีย์เวิร์ด", "seo.keywords", s.keywords, "textarea")}</div>
        <div class="item"><b>เช็กลิสต์หลังนำเว็บขึ้นโฮสต์จริง</b>
          <ul style="color:var(--muted);font-size:.88rem;margin-top:8px;list-style:disc;padding-left:20px">
            <li>แก้ URL ใน sitemap.xml, robots.txt และแท็ก canonical ทุกหน้าให้เป็นโดเมนจริง</li>
            <li>ยืนยันเว็บไซต์ใน Google Search Console แล้วส่ง sitemap.xml</li>
            <li>สร้าง Google Business Profile ที่อยู่บางบ่อ สมุทรปราการ (สำคัญมากต่อ GEO / Local SEO)</li>
            <li>ยืนยันอีเมล bw_training@hotmail.com ใน formsubmit.co ครั้งแรกครั้งเดียว</li>
          </ul></div>`;
    },
    leads() {
      const L = (() => { try { return JSON.parse(localStorage.getItem(LS_LEADS) || "[]"); } catch (e) { return []; } })();
      if (!L.length) return head("ใบขอเสนอราคาที่ได้รับ", "ยังไม่มีข้อมูล") +
        `<p class="hint">เมื่อมีลูกค้ากรอกฟอร์มบนเครื่องนี้ ข้อมูลจะแสดงที่นี่ และถูกส่งไปยังอีเมล ${esc(D.company.email)} ด้วย</p>`;
      const cols = [...new Set(L.flatMap(o => Object.keys(o)))];
      return head("ใบขอเสนอราคาที่ได้รับ", `ทั้งหมด ${L.length} รายการ (สำเนาที่บันทึกในเบราว์เซอร์เครื่องนี้)`) + `
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="addbtn" id="csvBtn">⬇ ดาวน์โหลด CSV</button>
          <button class="addbtn" id="clearLeads" style="background:#e04848">ลบทั้งหมด</button>
        </div>
        <div style="overflow-x:auto"><table class="lead-tb"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${L.map(r => `<tr>${cols.map(c => `<td>${esc(r[c] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    },
    settings() {
      return head("ตั้งค่าระบบหลังบ้าน", "เปลี่ยนรหัสผ่านและจัดการข้อมูล") + `
        <div class="row">${fld("รหัสผ่านใหม่", "__newpw", "", "password")}<div class="field"><label>&nbsp;</label>
          <button class="addbtn" id="pwBtn">เปลี่ยนรหัสผ่าน</button></div></div>
        <div class="item"><b>วิธีใช้งานระบบหลังบ้าน</b>
          <ol style="color:var(--muted);font-size:.88rem;margin-top:8px;padding-left:20px">
            <li>แก้ไขข้อมูลในแท็บต่างๆ แล้วกด <b>💾 บันทึกทั้งหมด</b> ที่มุมขวาบน</li>
            <li>ข้อมูลถูกเก็บในเบราว์เซอร์เครื่องนี้ (localStorage) — เห็นผลทันทีเมื่อเปิดเว็บไซต์บนเครื่องเดียวกัน</li>
            <li>ต้องการให้ผู้เข้าชมทุกคนเห็นเนื้อหาใหม่: กด <b>⬇ ส่งออก JSON</b> แล้วนำค่าที่ได้ไปแทนใน
              <code>assets/js/data.js</code> (ตัวแปร <code>window.BWT_DEFAULT</code>) แล้วอัปโหลดขึ้นโฮสต์</li>
            <li><b>⬆ นำเข้า JSON</b> ใช้กู้คืนข้อมูลจากไฟล์สำรอง</li>
          </ol></div>
        <div class="item"><b>ความปลอดภัย</b>
          <p style="color:var(--muted);font-size:.88rem;margin:6px 0 0">รหัสผ่านนี้เป็นการป้องกันเบื้องต้นฝั่งหน้าเว็บเท่านั้น
          เมื่อนำขึ้นเซิร์ฟเวอร์จริง ควรตั้งรหัสผ่านระดับโฮสติ้ง (.htpasswd หรือ Basic Auth) ให้กับไฟล์ admin.html เพิ่มด้วย</p></div>`;
    }
  };

  /* ---------- build UI ---------- */
  let current = "company";
  function build() {
    $("#side").innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === current ? "on" : ""}">${l}</button>`).join("");
    TABS.forEach(([k]) => {
      const el = $("#p-" + k); if (!el) return;
      // แยก try/catch รายแท็บ — ถ้าแท็บใดพัง แท็บอื่นต้องยังใช้งานได้ตามปกติ
      try {
        el.innerHTML = P[k] ? P[k]() : "";
      } catch (err) {
        console.error("แผง '" + k + "' มีปัญหา:", err);
        el.innerHTML = `<h2>เกิดข้อผิดพลาดในแท็บนี้</h2>
          <p class="hint">ข้อมูลบางส่วนอาจไม่ตรงกับรุ่นปัจจุบัน — แท็บอื่นยังใช้งานได้ตามปกติ</p>
          <div class="item"><b>รายละเอียด</b>
            <p style="color:var(--muted);font-size:.86rem;margin:6px 0 0">${esc(err.message)}</p></div>
          <p class="hint" style="margin-top:14px">วิธีแก้: กด “↺ คืนค่าเริ่มต้น” ด้านบน
            (จะล้างเฉพาะข้อมูลที่ค้างในเบราว์เซอร์ ไม่กระทบเนื้อหาบนเว็บจริง)</p>`;
      }
      el.classList.toggle("on", k === current);
    });
    /* ปุ่มต่างๆ ในแผงถูกดักจับด้วย event delegation ที่ระดับ document (ผูกครั้งเดียว)
       จึงไม่ต้องผูก event ใหม่ทุกครั้งที่ render */
  }

  $("#side").addEventListener("click", e => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    current = b.dataset.tab; build();
  });

  function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, val) {
    const ks = path.split("."), last = ks.pop();
    let o = obj; ks.forEach(k => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[last] = val;
  }

  function collect() {
    document.querySelectorAll("[data-path]").forEach(inp => {
      const p = inp.dataset.path; if (p.startsWith("__")) return;
      let v = inp.value;
      if (p === "company.phones") v = v.split(",").map(s => s.trim()).filter(Boolean);
      if (p === "about.points" || p === "intro.bullets") v = v.split("\n").map(s => s.trim()).filter(Boolean);
      setPath(D, p, v);
    });
  }

  const NEW = {
    "hero.slides": { img: "", css: "g1" },
    stats: { ico: "⭐", num: "0", label: "LABEL" },
    services: { id: "new-service", ico: "✨", css: "g1", title: "บริการใหม่", desc: "", detail: "" },
    portfolio: { id: "new", cat: "outing", img: "", alt: "" },
    clients: { name: "CLIENT", note: "", logo: "" },
    testimonials: { text: "", name: "", org: "" },
    blog: { id: "b" + Date.now(), css: "g1", date: new Date().toISOString().slice(0, 10), cat: "ทั่วไป", title: "บทความใหม่", excerpt: "", body: "" },
    faq: { q: "คำถามใหม่", a: "" },
    "about.timeline": { y: "2569", t: "", d: "" },
    "intro.gallery": { img: "", alt: "" },
    "expertise.pills": { ico: "✨", text: "จุดเด่นใหม่" }
  };

  /* ย่อรูปก่อนเก็บ — รูปจากกล้อง/มือถือใหญ่หลายเมกะไบต์
     ถ้าเก็บเต็มขนาด พื้นที่ในเบราว์เซอร์จะเต็ม แล้วบันทึกไม่ผ่านโดยไม่ฟ้อง */
  function shrink(file, maxW, cb) {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / im.naturalWidth);
      const w = Math.round(im.naturalWidth * scale), h = Math.round(im.naturalHeight * scale);
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(im, 0, 0, w, h);
      let q = 0.82, out = cv.toDataURL("image/jpeg", q);
      while (out.length > 900 * 1024 && q > 0.4) { q -= 0.12; out = cv.toDataURL("image/jpeg", q); }
      cb(out, w, h, Math.round(out.length / 1024));
    };
    im.onerror = () => { URL.revokeObjectURL(url); toast("เปิดไฟล์รูปไม่สำเร็จ กรุณาลองไฟล์อื่น", true); };
    im.src = url;
  }

  /* อัปเดตช่องที่อยู่รูป + ภาพตัวอย่างใต้ช่อง ให้เห็นผลทันที */
  function setImageValue(targetId, url) {
    const inp = document.getElementById(targetId);
    if (!inp) return false;
    inp.value = url;
    const box = document.querySelector(`.img-prev[data-for="${targetId}"]`);
    if (box) box.innerHTML = `<img src="${esc(url)}" style="max-height:80px;border-radius:8px;border:1px solid #ddd" alt="ตัวอย่างรูป">`;
    collect();
    return true;
  }

  document.addEventListener("change", e => {
    if (e.target.classList.contains("img-file-up")) {
      const f = e.target.files[0];
      if (!f) return;
      const targetId = e.target.dataset.target;
      e.target.value = "";                       // เลือกไฟล์เดิมซ้ำได้
      toast("กำลังย่อรูป...");
      shrink(f, 1600, (dataUrl, w, h, kb) => {
        if (setImageValue(targetId, dataUrl))
          toast(`เปลี่ยนรูปแล้ว (${w}×${h}, ${kb} KB) — อย่าลืมกด 💾 บันทึกทั้งหมด`);
      });
    }
    if (e.target.classList.contains("img-preset-sel")) {
      const val = e.target.value;
      if (!val) return;
      if (setImageValue(e.target.dataset.target, val)) toast("เลือกรูปภาพแล้ว");
    }
  });

  /* พิมพ์/วางลิงก์รูปเองก็ให้ภาพตัวอย่างเปลี่ยนตาม */
  document.addEventListener("input", e => {
    const inp = e.target;
    if (!inp.id || !inp.id.startsWith("inp_")) return;
    const box = document.querySelector(`.img-prev[data-for="${inp.id}"]`);
    if (!box) return;
    box.innerHTML = inp.value ? `<img src="${esc(inp.value)}" style="max-height:80px;border-radius:8px;border:1px solid #ddd" alt="ตัวอย่างรูป">` : "";
  });

  document.addEventListener("click", e => {
    const panel = $("#p-" + current);
    if (!panel || !panel.contains(e.target)) return;
    {
      const add = e.target.closest("[data-add]");
      if (add) {
        collect();
        const key = add.dataset.add;
        const arr = getPath(D, key);
        arr.push(JSON.parse(JSON.stringify(NEW[key] || {})));
        build(); return;
      }
      const del = e.target.closest("[data-del]");
      if (del) {
        collect();
        getPath(D, del.dataset.del).splice(+del.dataset.i, 1);
        build(); return;
      }
      if (e.target.id === "pwBtn") {
        const v = panel.querySelector('[data-path="__newpw"]').value.trim();
        if (v.length < 6) return toast("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร", true);
        localStorage.setItem(LS_PW, v); toast("เปลี่ยนรหัสผ่านเรียบร้อย");
      }
      if (e.target.id === "clearLeads") {
        if (confirm("ลบข้อมูลใบขอเสนอราคาทั้งหมดในเครื่องนี้?")) { localStorage.removeItem(LS_LEADS); build(); toast("ลบเรียบร้อย"); }
      }
      if (e.target.id === "csvBtn") downloadCSV();
    }
  });

  function downloadCSV() {
    const L = JSON.parse(localStorage.getItem(LS_LEADS) || "[]");
    const cols = [...new Set(L.flatMap(o => Object.keys(o)))];
    const csv = "﻿" + [cols.join(",")].concat(
      L.map(r => cols.map(c => `"${String(r[c] || "").replace(/"/g, '""')}"`).join(","))).join("\r\n");
    dl(new Blob([csv], { type: "text/csv;charset=utf-8" }), "bwt-leads.csv");
  }
  function dl(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  /* ---------- toolbar ---------- */
  $("#saveBtn").addEventListener("click", async () => {
    collect();
    D.version = window.BWT_DEFAULT.version;

    // ส่งขึ้นฐานข้อมูลก่อน เพื่อให้เว็บจริงเปลี่ยนตามทุกเครื่อง
    if (window.BWT_DB) {
      toast("กำลังบันทึกขึ้นฐานข้อมูล...");
      try {
        await window.BWT_DB.saveContent(D, pw());
        try { localStorage.setItem(LS_SITE, JSON.stringify(D)); } catch (e) { }
        toast("บันทึกขึ้นฐานข้อมูลแล้ว — ทุกเครื่องจะเห็นเนื้อหานี้");
        return;
      } catch (err) {
        console.warn("บันทึกขึ้น Supabase ไม่สำเร็จ:", err.message);
      }
    }

    try {
      localStorage.setItem(LS_SITE, JSON.stringify(D));
      toast("บันทึกในเครื่องนี้แล้ว — เปิดหน้าเว็บไซต์เพื่อดูผล");
    } catch (err) {
      toast("บันทึกไม่สำเร็จ: พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม ลองลดจำนวนรูปที่อัปโหลด", true);
    }
  });
  $("#exportBtn").addEventListener("click", () => {
    collect(); dl(new Blob([JSON.stringify(D, null, 2)], { type: "application/json" }), "bwt-content.json");
  });
  $("#importBtn").addEventListener("click", () => $("#fileIn").click());
  $("#fileIn").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        D = Object.assign(JSON.parse(JSON.stringify(window.BWT_DEFAULT)), JSON.parse(r.result));
        localStorage.setItem(LS_SITE, JSON.stringify(D)); build(); toast("นำเข้าข้อมูลเรียบร้อย");
      } catch (err) { toast("ไฟล์ไม่ถูกต้อง", true); }
    };
    r.readAsText(f);
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("คืนค่าเนื้อหาทั้งหมดกลับเป็นค่าเริ่มต้น?")) return;
    localStorage.removeItem(LS_SITE); D = load(); build(); toast("คืนค่าเริ่มต้นแล้ว");
  });

  /* เข้าสู่ระบบอัตโนมัติถ้าล็อกอินไว้แล้วใน session นี้ (ต้องอยู่ท้ายไฟล์ หลังประกาศตัวแปรทั้งหมด) */
  if (sessionStorage.getItem(LS_AUTH) === "1") showApp();
})();
