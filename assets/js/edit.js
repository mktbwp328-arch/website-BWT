/* ============================================================
   BW Training — โหมดแก้ไขสดบนหน้าเว็บ (Live Edit)
   เปิดใช้: ต่อท้าย URL ด้วย ?edit=1  หรือกดปุ่ม ✏️ ในหน้าหลังบ้าน
   - คลิกที่ข้อความบนหน้าเว็บแล้วพิมพ์แก้ได้เลย เห็นผลทันที
   - คลิกที่รูปเพื่อเปลี่ยนรูป (เลือกไฟล์จากเครื่อง หรือพิมพ์ path)
   - กด "บันทึก" เพื่อเก็บลงเบราว์เซอร์  /  "ส่งออกไฟล์" เพื่อทำให้ถาวร
   ============================================================ */
(function () {
  "use strict";

  const LS_SITE = "bwt_site_v1", LS_PW = "bwt_pw", LS_AUTH = "bwt_auth";
  const DEFAULT_PW = "bwtraining2026";
  const $ = s => document.querySelector(s);

  const wantEdit = new URLSearchParams(location.search).get("edit") === "1";
  if (!wantEdit) return;

  /* ---------- ข้อมูล ---------- */
  let D = JSON.parse(JSON.stringify(window.BWT_DEFAULT));
  try {
    const saved = JSON.parse(localStorage.getItem(LS_SITE) || "null");
    if (saved && saved.version === D.version) D = Object.assign(D, saved);
  } catch (e) {}

  let dirty = false;

  const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split("."), last = ks.pop();
    let cur = o;
    ks.forEach(k => { if (cur[k] == null) cur[k] = {}; cur = cur[k]; });
    cur[last] = v;
  };

  /* ---------- เข้าสู่ระบบ ----------
     จำรหัสไว้ในเครื่อง — ใส่ครั้งแรกครั้งเดียว ครั้งต่อไปเข้าแก้ไขได้ทันที
     และใช้แถบล็อกอินในหน้าเว็บแทนป๊อปอัปของเบราว์เซอร์ */
  const LS_REMEMBER = "bwt_edit_pass";
  function pw() { return localStorage.getItem(LS_PW) || DEFAULT_PW; }

  function askPassword() {
    return new Promise(resolve => {
      const box = document.createElement("div");
      box.className = "ed-login";
      box.innerHTML = `
        <form class="ed-login-card">
          <img src="assets/img/logo.png" alt="" width="64">
          <h2>โหมดแก้ไขหน้าเว็บ</h2>
          <p>ใส่รหัสผ่านครั้งแรกครั้งเดียว ครั้งต่อไปเข้าได้ทันที</p>
          <input type="password" id="edPw" placeholder="รหัสผ่าน" autocomplete="current-password" autofocus>
          <div class="ed-login-err" id="edErr"></div>
          <div class="ed-login-btns">
            <button type="submit" class="ed-btn ed-save">เข้าโหมดแก้ไข</button>
            <button type="button" class="ed-btn" id="edCancel">ยกเลิก</button>
          </div>
        </form>`;
      document.body.appendChild(box);
      const input = box.querySelector("#edPw");
      setTimeout(() => input.focus(), 50);

      box.querySelector("form").addEventListener("submit", e => {
        e.preventDefault();
        if (input.value === pw()) {
          localStorage.setItem(LS_REMEMBER, input.value);   // จำไว้ ไม่ต้องถามอีก
          box.remove(); resolve(true);
        } else {
          box.querySelector("#edErr").textContent = "รหัสผ่านไม่ถูกต้อง";
          input.select();
        }
      });
      box.querySelector("#edCancel").addEventListener("click", () => { box.remove(); resolve(false); });
    });
  }

  async function auth() {
    // เคยใส่รหัสถูกไว้แล้ว → เข้าได้เลย ไม่ต้องถามซ้ำ
    if (localStorage.getItem(LS_REMEMBER) === pw()) return true;
    if (sessionStorage.getItem(LS_AUTH) === "1") return true;
    const ok = await askPassword();
    if (ok) sessionStorage.setItem(LS_AUTH, "1");
    return ok;
  }

  /* ---------- แถบเครื่องมือ ---------- */
  function toolbar() {
    const bar = document.createElement("div");
    bar.className = "ed-bar";
    bar.innerHTML = `
      <span class="ed-logo">✏️ โหมดแก้ไขหน้าเว็บ</span>
      <span class="ed-status" id="edStatus">คลิกที่ข้อความหรือรูปเพื่อแก้ไข</span>
      <span class="ed-sp"></span>
      <button class="ed-btn ed-save" id="edSave">💾 บันทึก</button>
      <button class="ed-btn" id="edExport">⬇ ส่งออกไฟล์</button>
      <button class="ed-btn" id="edUndo">↺ ยกเลิกที่แก้</button>
      <button class="ed-btn" id="edLogout" title="เลิกจำรหัสผ่านในเครื่องนี้">🔒 ล็อก</button>
      <button class="ed-btn ed-exit" id="edExit">✕ ออก</button>`;
    document.body.appendChild(bar);
    document.body.classList.add("ed-on");

    $("#edSave").onclick = save;
    $("#edExport").onclick = exportJson;
    $("#edUndo").onclick = () => {
      if (!confirm("ยกเลิกสิ่งที่แก้ทั้งหมด แล้วกลับไปใช้เนื้อหาเดิม?")) return;
      localStorage.removeItem(LS_SITE);
      location.reload();
    };
    $("#edExit").onclick = () => {
      if (dirty && !confirm("ยังไม่ได้บันทึก ต้องการออกจากโหมดแก้ไขเลยไหม?")) return;
      const u = new URL(location.href); u.searchParams.delete("edit"); location.href = u.toString();
    };
    $("#edLogout").onclick = () => {
      if (!confirm("เลิกจำรหัสผ่านในเครื่องนี้? ครั้งหน้าจะต้องใส่รหัสใหม่")) return;
      localStorage.removeItem(LS_REMEMBER); sessionStorage.removeItem(LS_AUTH);
      const u = new URL(location.href); u.searchParams.delete("edit"); location.href = u.toString();
    };
  }

  const status = (msg, ok) => {
    const el = $("#edStatus"); if (!el) return;
    el.textContent = msg;
    el.className = "ed-status" + (ok ? " ok" : "");
  };

  function markDirty() {
    dirty = true;
    document.body.classList.add("ed-dirty");
    status("มีการแก้ไขที่ยังไม่ได้บันทึก", false);
  }

  async function save() {
    D.version = window.BWT_DEFAULT.version;

    // ส่งขึ้น Supabase ด้วย เพื่อให้ทุกเครื่องเห็นเนื้อหาชุดเดียวกัน
    if (window.BWT_DB) {
      status("กำลังบันทึกขึ้นฐานข้อมูล...", false);
      try {
        await window.BWT_DB.saveContent(D, pw());
        dirty = false;
        document.body.classList.remove("ed-dirty");
        try { localStorage.setItem(LS_SITE, JSON.stringify(D)); } catch (e) {}
        status("✓ บันทึกขึ้นฐานข้อมูลแล้ว — ทุกเครื่องจะเห็นเนื้อหานี้", true);
        return;
      } catch (err) {
        console.warn("บันทึกขึ้น Supabase ไม่สำเร็จ:", err.message);
        status("⚠ บันทึกขึ้นฐานข้อมูลไม่ได้ — เก็บไว้ในเครื่องนี้แทน", false);
      }
    }

    try {
      localStorage.setItem(LS_SITE, JSON.stringify(D));
    } catch (err) {
      status("⚠ พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม", false);
      alert("บันทึกไม่สำเร็จ — พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม\n\n" +
        "เกิดจากอัปโหลดรูปเข้ามาหลายรูปเกินไป วิธีแก้:\n" +
        "1) กด “⬇ ส่งออกไฟล์” เก็บงานที่แก้ไว้ก่อน\n" +
        "2) นำรูปไปวางในโฟลเดอร์ assets/img แล้วคลิกขวาที่รูปเพื่อพิมพ์ที่อยู่ไฟล์แทนการอัปโหลด");
      return;
    }
    dirty = false;
    document.body.classList.remove("ed-dirty");
    status("✓ บันทึกแล้ว", true);
  }

  async function exportJson() {
    await save();
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bwt-content.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    status("ส่งออกไฟล์แล้ว — ส่งไฟล์นี้ให้ผู้ดูแลเว็บเพื่อทำให้ถาวร", true);
  }

  /* ---------- แก้ข้อความ ---------- */
  function wireText() {
    document.querySelectorAll("[data-edit],[data-edit-html]").forEach(el => {
      if (el.dataset.edWired) return;
      el.dataset.edWired = "1";
      const path = el.dataset.edit || el.dataset.editHtml;
      const isHtml = !!el.dataset.editHtml;
      el.classList.add("ed-text");
      el.setAttribute("contenteditable", "plaintext-only");
      el.setAttribute("spellcheck", "false");
      el.title = "คลิกเพื่อแก้ข้อความ (" + path + ")";

      // ไม่ให้ลิงก์/ปุ่มทำงานระหว่างแก้ไข
      el.addEventListener("click", e => e.preventDefault());
      el.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
        if (e.key === "Escape") { el.textContent = getPath(D, path) || ""; el.blur(); }
      });
      el.addEventListener("blur", () => {
        const val = isHtml ? el.innerHTML.trim() : el.textContent.trim();
        if (val === String(getPath(D, path) ?? "")) return;
        setPath(D, path, val);
        markDirty();
      });
    });
  }

  /* ---------- แก้รูปภาพ: คลิกที่รูป → เปิดหน้าต่างอัปโหลดทันที ---------- */

  /* ย่อรูปก่อนเก็บ เพื่อไม่ให้พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม */
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
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);   // กันพื้นดำในรูปโปร่งใส
      ctx.drawImage(im, 0, 0, w, h);
      let q = 0.82, out = cv.toDataURL("image/jpeg", q);
      while (out.length > 900 * 1024 && q > 0.4) { q -= 0.12; out = cv.toDataURL("image/jpeg", q); }
      cb(out, w, h, Math.round(out.length / 1024));
    };
    im.onerror = () => { URL.revokeObjectURL(url); alert("เปิดไฟล์รูปไม่สำเร็จ กรุณาลองไฟล์อื่น"); };
    im.src = url;
  }

  function pickImage(currentPath, cb) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.onchange = () => {
      const f = inp.files[0];
      inp.remove();
      if (!f) return;
      status("กำลังอัปโหลดรูป...", false);
      shrink(f, 1600, (dataUrl, w, h, kb) => {
        cb(dataUrl);
        status(`✓ เปลี่ยนรูปแล้ว (${w}×${h}, ${kb} KB) — อย่าลืมกดบันทึก`, true);
      });
    };
    inp.click();
  }

  /* คลิกขวาที่รูป = พิมพ์ที่อยู่ไฟล์เอง (สำหรับรูปที่วางไว้ในโฟลเดอร์แล้ว) */
  function typePath(currentPath, cb) {
    const v = prompt("พิมพ์ที่อยู่ไฟล์รูป เช่น assets/img/Picture45.jpg", currentPath || "");
    if (v && v.trim()) cb(v.trim());
  }

  function wireImageBox(el, path, apply) {
    if (el.dataset.edWired) return;
    el.dataset.edWired = "1";
    el.classList.add("ed-img");
    el.title = "คลิกเพื่ออัปโหลดรูปใหม่  (คลิกขวา = พิมพ์ที่อยู่ไฟล์เอง)";

    // ป้ายบอกให้กดอัปโหลด
    const wrap = el.parentElement;
    if (wrap && !wrap.querySelector(".ed-upload-tag")) {
      if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
      const tag = document.createElement("span");
      tag.className = "ed-upload-tag";
      tag.textContent = "📤 อัปโหลดรูป";
      wrap.appendChild(tag);
    }

    const change = v => { apply(v); setPath(D, path, v); markDirty(); };
    el.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      pickImage(getPath(D, path), change);
    }, true);
    el.addEventListener("contextmenu", e => {
      e.preventDefault(); e.stopPropagation();
      typePath(getPath(D, path), change);
    }, true);
  }

  function wireImages() {
    document.querySelectorAll("[data-edit-img]").forEach(img =>
      wireImageBox(img, img.dataset.editImg, v => { img.src = v; }));

    document.querySelectorAll("[data-edit-bg]").forEach(box =>
      wireImageBox(box, box.dataset.editBg, v => { box.style.backgroundImage = `url('${v}')`; }));
  }

  /* ---------- ข้อความคงที่ในไฟล์ HTML (ทุกหน้า ทุกจุด) ----------
     ไม่ต้องไปใส่โค้ดกำกับทีละจุด — ระบบจะหาข้อความที่แก้ได้เองอัตโนมัติ
     แล้วจำตำแหน่งไว้ใน pageText[<ชื่อหน้า>] */
  const SKIP_SEL = "#site-header,#site-footer,.floaters,.ed-bar,.ed-upload-tag," +
    ".lightbox,#videoModal,script,style,noscript";
  const SKIP_TAG = { SELECT: 1, OPTION: 1, INPUT: 1, TEXTAREA: 1, IFRAME: 1, IMG: 1, SVG: 1, CANVAS: 1, BR: 1, HR: 1 };

  function wireStatic() {
    const page = window.BWT.pageKey();
    D.pageText = D.pageText || {};
    D.pageText[page] = D.pageText[page] || {};

    document.querySelectorAll("body *").forEach(el => {
      if (el.dataset.edWired || el.dataset.edStatic) return;
      if (SKIP_TAG[el.tagName]) return;
      if (el.closest(SKIP_SEL)) return;
      if (el.hasAttribute("data-edit") || el.hasAttribute("data-edit-html")) return;
      if (el.closest("[data-edit],[data-edit-html]")) return;
      if (el.children.length) return;                 // เอาเฉพาะชั้นในสุดที่มีข้อความ
      const txt = el.textContent.trim();
      if (!txt || txt.length > 600) return;
      if (/^[\s→‹›✕✓★•–—+]+$/.test(txt)) return;      // ข้ามสัญลักษณ์ล้วน

      el.dataset.edStatic = "1";
      const key = window.BWT.nodePath(el);
      el.classList.add("ed-text");
      el.setAttribute("contenteditable", "plaintext-only");
      el.setAttribute("spellcheck", "false");
      el.title = "คลิกเพื่อแก้ข้อความ";
      const original = txt;

      el.addEventListener("click", e => e.preventDefault());
      el.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
        if (e.key === "Escape") { el.textContent = D.pageText[page][key] ?? original; el.blur(); }
      });
      el.addEventListener("blur", () => {
        const v = el.textContent.trim();
        if (v === (D.pageText[page][key] ?? original)) return;
        if (v === original) delete D.pageText[page][key];
        else D.pageText[page][key] = v;
        markDirty();
      });
    });
  }

  function wire() { wireText(); wireImages(); wireStatic(); }

  /* ---------- เริ่มทำงาน ---------- */
  async function start() {
    if (!(await auth())) {
      const u = new URL(location.href); u.searchParams.delete("edit");
      location.replace(u.toString());
      return;
    }
    toolbar();
    wire();
    // เนื้อหาบางส่วนถูกวาดทีหลัง (สไลด์/ตัวนับ) จึงคอยผูกเพิ่มให้อัตโนมัติ
    new MutationObserver(() => wire()).observe(document.body, { childList: true, subtree: true });

    addEventListener("beforeunload", e => {
      if (!dirty) return;
      e.preventDefault(); e.returnValue = "";
    });
  }

  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => setTimeout(start, 60));
  else setTimeout(start, 60);
})();
