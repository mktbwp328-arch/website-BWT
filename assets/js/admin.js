/* ============================================================
   BW Training — ระบบหลังบ้าน (แก้ไขเนื้อหาเว็บไซต์)
   บันทึกขึ้นฐานข้อมูล Supabase และเก็บสำเนาไว้ในเบราว์เซอร์เครื่องนี้
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
  /* ดึงเนื้อหาล่าสุดจากฐานข้อมูลก่อนเสมอ
     ไม่งั้นถ้าเปิดหลังบ้านจากคนละเครื่อง จะเห็นข้อมูลเก่าในเครื่องนั้น
     แล้วพอกดบันทึกก็จะเขียนทับงานที่แก้จากหน้าเว็บหรือเครื่องอื่นทิ้งไปทั้งหมด */
  let dbOk = false;
  async function pullLatest() {
    if (!window.BWT_DB) return;
    try {
      const row = await window.BWT_DB.fetchContent();
      dbOk = true;
      if (!row || !row.content) return;
      if (row.content.version !== window.BWT_DEFAULT.version) return;  // คนละรุ่นข้อมูล ไม่นำมาใช้
      D = Object.assign(JSON.parse(JSON.stringify(window.BWT_DEFAULT)), row.content);
      try {
        localStorage.setItem(LS_SITE, JSON.stringify(D));
        if (row.updated_at) localStorage.setItem("bwt_site_stamp", row.updated_at);
      } catch (e) { try { localStorage.removeItem("bwt_site_stamp"); } catch (e2) { } }
    } catch (e) {
      console.warn("ดึงเนื้อหาล่าสุดจากฐานข้อมูลไม่สำเร็จ:", e.message);
    }
  }

  async function showApp() {
    $("#login").style.display = "none";
    $("#app").style.display = "block";
    $("#app").insertAdjacentHTML("afterbegin", '<div id="dbNote" class="hint" style="padding:10px 18px">กำลังดึงเนื้อหาล่าสุดจากฐานข้อมูล...</div>');
    await pullLatest();
    const note = $("#dbNote");
    if (note) {
      if (dbOk) note.remove();
      else note.outerHTML = '<div id="dbNote" style="margin:12px 18px;padding:12px 16px;border-radius:10px;' +
        'background:#fdecec;color:#a11;font-size:.88rem">⚠ ต่อฐานข้อมูลไม่ได้ — กำลังแสดงข้อมูลที่เก็บไว้ในเครื่องนี้ ' +
        'ถ้าบันทึกตอนนี้อาจเขียนทับงานที่แก้จากที่อื่น แนะนำให้รีเฟรชหน้าก่อน</div>';
    }
    build();
  }
  $("#loginBtn").addEventListener("click", tryLogin);
  $("#pw").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

  /* ---------- helpers to build fields ---------- */
  const TABS = [
    ["company", "🏢 ข้อมูลบริษัท"], ["hero", "🎬 แบนเนอร์หน้าแรก"], ["stats", "📊 ตัวเลขสถิติ"],
    ["about", "ℹ️ หน้าเกี่ยวกับเรา"],
    ["expertise", "⭐ แถบความเชี่ยวชาญ"], ["intro", "📰 บทความแนะนำบริษัท"], ["services", "🧩 บริการ (7 หมวด)"], ["portfolio", "🖼 ผลงาน"],
    ["clients", "🤝 ลูกค้า"], ["testimonials", "💬 รีวิวลูกค้า"], ["blog", "📝 บทความ"],
    ["faq", "❓ คำถามที่พบบ่อย"], ["seo", "🔍 SEO"],
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

  /* สัดส่วนที่กรอบครอปจะตั้งไว้ให้ตั้งแต่แรก ตามตำแหน่งที่รูปจะไปแสดงจริง
     (ผู้ใช้เปลี่ยนเป็นสัดส่วนอื่นหรือครอปอิสระได้ในหน้าต่างครอป) */
  function aspectFor(path) {
    if (path.startsWith("hero.")) return 16 / 9;
    if (path.startsWith("blog.")) return 16 / 9;
    if (path.startsWith("services.")) return 4 / 3;
    if (path.startsWith("portfolio.")) return 1;
    if (path.startsWith("clients.")) return 0;          // โลโก้ — ครอปอิสระ
    if (path.startsWith("expertise.")) return 4 / 3;
    if (path.startsWith("intro.gallery")) return 4 / 3;
    return 0;
  }

  function imgFld(label, path, value) {
    const ar = aspectFor(path);
    const presets = PRESET_IMAGES.map(([url, name]) => `<option value="${url}">${name}</option>`).join("");
    return `<div class="field" style="grid-column:1/-1;background:#fff;padding:14px;border:1px dashed var(--blue);border-radius:12px">
      <label style="font-weight:700;color:var(--blue)">🖼️ ${label}</label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px">
        <input data-path="${path}" id="inp_${path.replace(/\./g, '_')}" type="text" value="${esc(value)}" style="flex:1;min-width:240px" placeholder="วางลิงก์รูปภาพ หรือเลือกจากไฟล์เครื่อง">
        <label class="addbtn" style="cursor:pointer;margin:0;padding:8px 16px;background:var(--blue);color:#fff;font-size:0.85rem">
          📁 เลือกรูป + ครอป... <input type="file" accept="image/*" class="img-file-up" data-ar="${ar}" data-target="inp_${path.replace(/\./g, '_')}" style="display:none">
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
        <div class="row">${fld("ข้อความปุ่มวิดีโอ", "hero.videoText", h.videoText || "")}${fld("ลิงก์วิดีโอแนะนำ", "hero.videoUrl", h.videoUrl || "")}</div>
        <p class="hint">วางลิงก์วิดีโอที่คัดลอกมาได้เลย รองรับ YouTube (รวม Shorts) · Vimeo · Facebook · ไฟล์ .mp4<br>
          ตัวอย่าง: <code>https://www.youtube.com/watch?v=xxxxxxxxxxx</code> หรือ <code>https://youtu.be/xxxxxxxxxxx</code><br>
          <b>เว้นว่างไว้ = ซ่อนปุ่ม “ชมวิดีโอแนะนำ” บนหน้าแรก</b></p>
        <div class="row">${fld("ริบบิ้นเหลือง (บน)", "hero.ribbonTop", h.ribbonTop || "")}${fld("ริบบิ้นน้ำเงิน (ล่าง)", "hero.ribbonBottom", h.ribbonBottom || "")}</div>`;
    },
    stats() {
      return head("ตัวเลขสถิติ", "แถบตัวเลขใต้แบนเนอร์ (นับขึ้นอัตโนมัติ)") +
        listBlock("stats", "เพิ่มตัวเลข", D.stats.map((s, i) => itemBox("stats", i,
          `<div class="row">${fld("ไอคอน (medal / people / shield / award)", `stats.${i}.ico`, s.ico)}${fld("ตัวเลข", `stats.${i}.num`, s.num)}</div>
           <div class="row one">${fld("คำอธิบาย (อังกฤษ)", `stats.${i}.label`, s.label)}</div>`)).join(""));
    },
    services() {
      return head("บริการ",
        "7 หมวดบริการหลัก — รูปในหน้านี้แสดงที่ <b>หน้าบริการ (services.html)</b> เท่านั้น<br>" +
        "หน้าแรกไม่ได้ใช้รูปชุดนี้ ถ้าจะเปลี่ยนรูปช่อง “บริการของเรา” บนหน้าแรก ให้ไปที่แท็บ <b>📰 บทความแนะนำบริษัท</b>") +
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
        <div class="row one">${fld("รูปด้านซ้าย", "expertise.img", x.img, "img")}</div>
        <div class="row one">${fld("ป้ายเล็กด้านบน", "expertise.kicker", x.kicker)}</div>
        <div class="row one">${fld("หัวข้อ", "expertise.title", x.title, "textarea")}</div>
        <div class="row one">${fld("คำอธิบาย", "expertise.desc", x.desc, "textarea")}</div>
        <h3 style="margin-top:18px;font-size:1rem">ป้ายจุดเด่น</h3>
        ${listBlock("expertise.pills", "เพิ่มป้าย", x.pills.map((p, i) => itemBox("expertise.pills", i,
          `<div class="row">${fld("ไอคอน (อีโมจิ)", `expertise.pills.${i}.ico`, p.ico)}${fld("ข้อความ", `expertise.pills.${i}.text`, p.text)}</div>`)).join(""))}`;
    },
    intro() {
      const n = D.intro;
      return head("บทความแนะนำบริษัท (หน้าแรก)",
        "นี่คือช่อง <b>“บริการของเรา”</b> บนหน้าแรก — ข้อความด้านซ้าย + แถบภาพเลื่อนด้านขวา<br>" +
        "รูปในหัวข้อ “ภาพในแถบเลื่อน” ด้านล่างคือรูปที่เห็นบนหน้าแรก · ใส่ &lt;b&gt;ข้อความ&lt;/b&gt; เพื่อทำตัวหนาได้") + `
        <h3 style="margin-top:4px;font-size:1rem">หัวข้อใหญ่ของส่วนนี้</h3>
        <div class="row">${fld("ป้ายเล็ก (อังกฤษ)", "intro.kicker", n.kicker || "")}${fld("หัวข้อใหญ่", "intro.sectionTitle", n.sectionTitle || "")}</div>

        <h3 style="margin-top:18px;font-size:1rem">บทความด้านซ้าย</h3>
        <div class="row one">${fld("หัวข้อ", "intro.title", n.title)}</div>
        <div class="row one">${fld("ข้อความนำ", "intro.lead", n.lead, "textarea")}</div>
        <div class="row one">${fld("หัวข้อย่อย (บรรทัดละ 1 ข้อ)", "intro.bullets", n.bullets.join("\n"), "textarea")}</div>
        <h3 style="margin-top:20px;font-size:1rem">ภาพสไลด์ด้านขวา</h3>
        ${listBlock("intro.gallery", "เพิ่มภาพสไลด์", n.gallery.map((g, i) => itemBox("intro.gallery", i,
          `<div class="row one">${fld("ภาพในแถบเลื่อน", `intro.gallery.${i}.img`, g.img, "img")}</div>
           <div class="row one">${fld("คำอธิบายรูป (ไม่แสดงบนหน้าเว็บ ใช้เพื่อ SEO)", `intro.gallery.${i}.alt`, g.alt || "")}</div>`)).join(""))}

        <h3 style="margin-top:18px;font-size:1rem">ปุ่มด้านล่าง</h3>
        <div class="row">${fld("ข้อความบนปุ่ม", "intro.btnText", n.btnText || "")}${fld("ลิงก์ปุ่ม", "intro.btnLink", n.btnLink || "")}</div>`;
    },
    portfolio() {
      return head("ผลงาน", "แสดงเป็นรูปภาพล้วน ไม่มีตัวหนังสือทับ — หมวด (cat) ใช้กับปุ่มกรอง: outing, team, seminar, party, csr") +
        listBlock("portfolio", "เพิ่มผลงาน", D.portfolio.map((p, i) => itemBox("portfolio", i,
          `<div class="row one">${fld("รูปผลงาน", `portfolio.${i}.img`, p.img || "", "img")}</div>
           <div class="row">${fld("หมวด (cat)", `portfolio.${i}.cat`, p.cat)}${fld("คำอธิบายรูป (ไม่แสดงบนหน้าเว็บ ใช้เพื่อ SEO)", `portfolio.${i}.alt`, p.alt || "")}</div>`)).join(""));
    },
    clients() {
      return head("ลูกค้า", "ช่อง “ไฟล์โลโก้” ใส่ path เช่น assets/img/clients/c01.png — ถ้าเว้นว่างจะแสดงเป็นตัวอักษรแทน") +
        listBlock("clients", "เพิ่มลูกค้า", D.clients.map((c, i) => itemBox("clients", i,
          `<div class="row">${fld("ชื่อองค์กร", `clients.${i}.name`, c.name)}${fld("คำอธิบาย", `clients.${i}.note`, c.note)}</div>
           <div class="row one">${fld("โลโก้ลูกค้า", `clients.${i}.logo`, c.logo || "", "img")}</div>`)).join(""));
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
      return head("หน้าเกี่ยวกับเรา", "แก้ได้ทุกส่วนของหน้า about.html — หัวหน้า เนื้อหา รูป ป้าย ไทม์ไลน์ ค่านิยม และแถบชวนติดต่อ") + `
        <h3 style="margin-top:4px;font-size:1rem">แถบหัวหน้า</h3>
        <div class="row">${fld("หัวใหญ่ (อังกฤษ)", "about.heroEn", a.heroEn || "")}${fld("ข้อความไทยใต้หัวใหญ่", "about.heroTh", a.heroTh || "")}</div>

        <h3 style="margin-top:18px;font-size:1rem">ส่วนแนะนำบริษัท</h3>
        <div class="row one">${fld("รูปด้านซ้าย", "about.img", a.img || "", "img")}</div>
        <div class="row one">${fld("ป้ายเล็กเหนือหัวข้อ", "about.kicker", a.kicker || "")}</div>
        <div class="row one">${fld("หัวข้อ", "about.headline", a.headline)}</div>
        <div class="row one">${fld("เนื้อหา", "about.body", a.body, "textarea")}</div>
        <div class="row one">${fld("จุดเด่น (คั่นบรรทัดละ 1 ข้อ)", "about.points", a.points.join("\n"), "textarea")}</div>

        <h3 style="margin-top:18px;font-size:1rem">ป้ายเล็กใต้จุดเด่น</h3>
        ${listBlock("about.pills", "เพิ่มป้าย", (a.pills || []).map((p, i) => itemBox("about.pills", i,
          `<div class="row">${fld("ไอคอน (อีโมจิ)", `about.pills.${i}.ico`, p.ico)}${fld("ข้อความ", `about.pills.${i}.text`, p.text)}</div>`)).join(""))}

        <h3 style="margin-top:18px;font-size:1rem">ไทม์ไลน์ “เส้นทางของเรา”</h3>
        <div class="row">${fld("ป้ายเล็ก", "about.timelineKicker", a.timelineKicker || "")}${fld("หัวข้อ", "about.timelineTitle", a.timelineTitle || "")}</div>
        ${listBlock("about.timeline", "เพิ่มช่วงเวลา", a.timeline.map((t, i) => itemBox("about.timeline", i,
          `<div class="row">${fld("ปี", `about.timeline.${i}.y`, t.y)}${fld("หัวข้อ", `about.timeline.${i}.t`, t.t)}</div>
           <div class="row one">${fld("รายละเอียด", `about.timeline.${i}.d`, t.d, "textarea")}</div>`)).join(""))}

        <h3 style="margin-top:18px;font-size:1rem">ค่านิยม “สิ่งที่เรายึดถือ”</h3>
        <div class="row">${fld("ป้ายเล็ก", "about.valuesKicker", a.valuesKicker || "")}${fld("หัวข้อ", "about.valuesTitle", a.valuesTitle || "")}</div>
        ${listBlock("about.values", "เพิ่มค่านิยม", (a.values || []).map((v, i) => itemBox("about.values", i,
          `<div class="row">${fld("ไอคอน (อีโมจิ)", `about.values.${i}.ico`, v.ico)}${fld("หัวข้อ", `about.values.${i}.title`, v.title)}</div>
           <div class="row one">${fld("รายละเอียด", `about.values.${i}.desc`, v.desc, "textarea")}</div>`)).join(""))}

        <h3 style="margin-top:18px;font-size:1rem">หัวข้อส่วนรีวิว</h3>
        <div class="row">${fld("ป้ายเล็ก", "about.reviewKicker", a.reviewKicker || "")}${fld("หัวข้อ", "about.reviewTitle", a.reviewTitle || "")}</div>
        <p class="hint">ข้อความรีวิวแก้ที่แท็บ 💬 รีวิวลูกค้า</p>

        <h3 style="margin-top:18px;font-size:1rem">แถบชวนติดต่อท้ายหน้า</h3>
        <div class="row one">${fld("หัวข้อ", "about.ctaTitle", a.ctaTitle || "")}</div>
        <div class="row">${fld("คำอธิบาย", "about.ctaDesc", a.ctaDesc || "")}${fld("ข้อความบนปุ่ม", "about.ctaBtn", a.ctaBtn || "")}</div>`;
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
        <div class="item"><b>ขนาดเนื้อหาและความเร็วเว็บ</b>
          <p style="color:var(--muted);font-size:.88rem;margin:6px 0 10px">
            รูปที่อัปโหลดก่อนหน้านี้ถูก <b>ฝังเป็นข้อความยาวๆ</b> ไว้ในเนื้อหา ทำให้ผู้เข้าชมต้องโหลดก้อนใหญ่ทุกครั้ง
            จึงเห็นรูปเก่าค้างอยู่ครู่หนึ่งก่อนเปลี่ยน · กดปุ่มด้านล่างเพื่อย้ายรูปเหล่านั้นไปเก็บเป็นไฟล์ในคลังรูป
          </p>
          <p id="imgStat" style="font-size:.88rem;margin:0 0 10px"></p>
          <button class="addbtn" id="migrateImgs">📦 ย้ายรูปที่ฝังไว้ขึ้นคลังรูป</button></div>
        <div class="item"><b>วิธีใช้งานระบบหลังบ้าน</b>
          <ol style="color:var(--muted);font-size:.88rem;margin-top:8px;padding-left:20px">
            <li>แก้ไขข้อมูลในแท็บต่างๆ แล้วกด <b>💾 บันทึกทั้งหมด</b> ที่มุมขวาบน</li>
            <li>กดบันทึกแล้วเนื้อหาจะขึ้นฐานข้อมูล ทุกเครื่องเห็นตรงกันทันที</li>
            <li>หรือกด <b>✏️ แก้ไขที่หน้าเว็บ</b> เพื่อแก้ข้อความและรูปบนหน้าเว็บจริงได้โดยตรง</li>
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
    if (current === "settings") { try { showImgStat(); } catch (e) { } }
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
    "about.pills": { ico: "✨", text: "จุดเด่นใหม่" },
    "about.values": { ico: "🎯", title: "หัวข้อใหม่", desc: "" },
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
      const aspect = +(e.target.dataset.ar || 0);
      e.target.value = "";                       // เลือกไฟล์เดิมซ้ำได้

      const apply = async (dataUrl, w, h, kb, blob) => {
        let url = dataUrl, where = "ฝังในเนื้อหา";
        // ส่งขึ้นคลังรูปก่อน เนื้อหาเว็บจะได้ไม่บวม โหลดหน้าเว็บเร็วขึ้นมาก
        if (blob && window.BWT_DB && window.BWT_DB.uploadImage) {
          toast("กำลังอัปโหลดรูปขึ้นคลัง...");
          try { url = await window.BWT_DB.uploadImage(blob, targetId); where = "คลังรูป"; }
          catch (err) { console.warn("อัปโหลดขึ้นคลังรูปไม่สำเร็จ ใช้วิธีฝังรูปแทน:", err.message); }
        }
        if (setImageValue(targetId, url))
          toast(`เปลี่ยนรูปแล้ว (${w}×${h}, ${kb} KB, ${where}) — อย่าลืมกด 💾 บันทึกทั้งหมด`);
      };

      // เปิดหน้าต่างครอปก่อน ถ้าโหลดเครื่องมือครอปไม่ได้ ค่อยย่อรูปตรงๆ
      if (window.BWT_CROP) window.BWT_CROP.open(f, { aspect, maxW: 1400 }, apply);
      else { toast("กำลังย่อรูป..."); shrink(f, 1400, apply); }
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
      if (e.target.id === "migrateImgs") migrateImages();
    }
  });

  /* ---------- ย้ายรูปที่ฝังไว้ในเนื้อหา ขึ้นไปเก็บเป็นไฟล์ในคลังรูป ---------- */

  /* เดินดูทุกช่องในเนื้อหา หาค่าที่เป็นรูปฝัง (ขึ้นต้นด้วย data:image) */
  function eachEmbedded(obj, fn, path) {
    if (!obj || typeof obj !== "object") return;
    for (const k of Object.keys(obj)) {
      const v = obj[k], p = path ? path + "." + k : k;
      if (typeof v === "string" && v.startsWith("data:image")) fn(obj, k, v, p);
      else if (v && typeof v === "object") eachEmbedded(v, fn, p);
    }
  }

  function embeddedList(data) {
    const out = [];
    eachEmbedded(data, (o, k, v, p) => out.push({ o, k, v, p }));
    return out;
  }

  function showImgStat() {
    const el = $("#imgStat"); if (!el) return;
    const list = embeddedList(D);
    const mb = (JSON.stringify(D).length / 1048576).toFixed(2);
    el.innerHTML = list.length
      ? `ตอนนี้มีรูปฝังอยู่ <b>${list.length} รูป</b> · ขนาดเนื้อหารวม <b>${mb} MB</b>`
      : `<span style="color:#0a8a3d">เรียบร้อย ไม่มีรูปฝังเหลือแล้ว · ขนาดเนื้อหารวม <b>${mb} MB</b></span>`;
  }

  async function migrateImages() {
    if (!window.BWT_DB || !window.BWT_DB.uploadImage) return toast("ยังเชื่อมต่อฐานข้อมูลไม่ได้", true);
    collect();
    const list = embeddedList(D);
    if (!list.length) { showImgStat(); return toast("ไม่มีรูปฝังที่ต้องย้ายแล้ว"); }

    const btn = $("#migrateImgs");
    if (btn) { btn.disabled = true; btn.textContent = "กำลังย้าย..."; }

    let ok = 0, fail = 0, firstErr = "";
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (btn) btn.textContent = `กำลังย้าย ${i + 1}/${list.length}...`;
      try {
        const url = await window.BWT_DB.uploadImage(window.BWT_DB.dataUrlToBlob(it.v), it.p);
        it.o[it.k] = url;
        ok++;
      } catch (e) { fail++; if (!firstErr) firstErr = e.message; }
    }

    if (btn) { btn.disabled = false; btn.textContent = "📦 ย้ายรูปที่ฝังไว้ขึ้นคลังรูป"; }

    if (ok) {
      D.version = window.BWT_DEFAULT.version;
      try {
        await window.BWT_DB.saveContent(D, pw());
        try {
          localStorage.setItem(LS_SITE, JSON.stringify(D));
          const st = await window.BWT_DB.fetchStamp();
          if (st) localStorage.setItem("bwt_site_stamp", st);
        } catch (e) { try { localStorage.removeItem("bwt_site_stamp"); } catch (e2) { } }
      } catch (e) { toast("ย้ายรูปแล้วแต่บันทึกไม่สำเร็จ: " + e.message, true); }
    }

    build();
    showImgStat();
    toast(fail
      ? `ย้ายสำเร็จ ${ok} รูป · ไม่สำเร็จ ${fail} รูป (${firstErr.slice(0, 80)})`
      : `ย้ายรูปขึ้นคลังสำเร็จทั้งหมด ${ok} รูป — เว็บจะโหลดเร็วขึ้นมาก`, !!fail);
  }

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

    if (!dbOk && !confirm("เปิดหลังบ้านตอนที่ต่อฐานข้อมูลไม่ได้ ข้อมูลที่เห็นอาจไม่ใช่ชุดล่าสุด\n\n" +
      "ถ้าบันทึกตอนนี้ อาจเขียนทับงานที่แก้จากหน้าเว็บหรือเครื่องอื่น\nแนะนำให้รีเฟรชหน้าก่อน — ยืนยันจะบันทึกเลยไหม?")) {
      return toast("ยกเลิกการบันทึก — ลองรีเฟรชหน้าแล้วแก้ใหม่", true);
    }

    // ส่งขึ้นฐานข้อมูลก่อน เพื่อให้เว็บจริงเปลี่ยนตามทุกเครื่อง
    if (window.BWT_DB) {
      toast("กำลังบันทึกขึ้นฐานข้อมูล...");
      try {
        await window.BWT_DB.saveContent(D, pw());
        try {
          localStorage.setItem(LS_SITE, JSON.stringify(D));
          // จำเวลาที่แก้ล่าสุดไว้ด้วย หน้าเว็บจะได้ไม่ต้องโหลดซ้ำและไม่กระพริบ
          const st = await window.BWT_DB.fetchStamp();
          if (st) localStorage.setItem("bwt_site_stamp", st);
        } catch (e) { try { localStorage.removeItem("bwt_site_stamp"); } catch (e2) { } }
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

  /* เข้าสู่ระบบอัตโนมัติถ้าล็อกอินไว้แล้วใน session นี้ (ต้องอยู่ท้ายไฟล์ หลังประกาศตัวแปรทั้งหมด) */
  if (sessionStorage.getItem(LS_AUTH) === "1") showApp();
})();
