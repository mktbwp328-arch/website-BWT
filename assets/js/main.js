/* ============================================================
   BW Training — main.js
   ============================================================ */
(function () {
  "use strict";

  /* ---------- ไอคอนโซเชียล (วาดเป็น SVG ไม่ต้องโหลดไฟล์ภายนอก) ---------- */
  const svg = p => `<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true" focusable="false">${p}</svg>`;
  const ICON = {
    facebook: svg('<path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z"/>'),
    line: svg('<path d="M12 2C6.48 2 2 5.65 2 10.13c0 4.02 3.55 7.38 8.35 8.02.32.07.77.21.88.49.1.25.07.65.03.91l-.14.85c-.04.25-.2.99.87.54s5.76-3.39 7.86-5.81C21.29 13.55 22 11.93 22 10.13 22 5.65 17.52 2 12 2ZM8.08 12.85H6.09a.53.53 0 0 1-.53-.53V8.35c0-.29.24-.53.53-.53s.53.24.53.53v3.44h1.46c.29 0 .53.24.53.53s-.24.53-.53.53Zm2.08-.53c0 .29-.24.53-.53.53a.53.53 0 0 1-.53-.53V8.35c0-.29.24-.53.53-.53s.53.24.53.53v3.97Zm4.78 0c0 .23-.15.43-.36.5a.6.6 0 0 1-.17.03.53.53 0 0 1-.43-.21l-2.04-2.77v2.45c0 .29-.24.53-.53.53a.53.53 0 0 1-.53-.53V8.35c0-.23.15-.43.36-.5a.5.5 0 0 1 .17-.03c.16 0 .32.08.42.21l2.05 2.78V8.35c0-.29.24-.53.53-.53s.53.24.53.53v3.97Zm3.21-2.51c.29 0 .53.24.53.53s-.24.53-.53.53h-1.46v.93h1.46c.29 0 .53.24.53.53s-.24.53-.53.53h-1.99a.53.53 0 0 1-.53-.53V8.35c0-.29.24-.53.53-.53h1.99c.29 0 .53.24.53.53s-.24.53-.53.53h-1.46v.93h1.46Z"/>'),
    tiktok: svg('<path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .76-5.06v-3.1a5.66 5.66 0 0 0-.76-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z"/>'),
    youtube: svg('<path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM10 15.11V8.89L15.2 12 10 15.11Z"/>')
  };

  /* ---------- data layer ---------- */
  const LS_SITE = "bwt_site_v1";
  const LS_LEADS = "bwt_leads_v1";
  const LS_STAMP = "bwt_site_stamp";   // เวลาที่แก้ล่าสุดของเนื้อหาชุดที่เก็บไว้ในเครื่อง

  function deepMerge(base, over) {
    if (Array.isArray(over)) return over.slice();
    if (over && typeof over === "object" && !Array.isArray(base)) {
      const out = Object.assign({}, base);
      for (const k in over) out[k] = deepMerge(base ? base[k] : undefined, over[k]);
      return out;
    }
    return over === undefined ? base : over;
  }

  function loadSite() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS_SITE) || "null"); } catch (e) { saved = null; }
    // ถ้าข้อมูลที่บันทึกไว้เป็นคนละรุ่นกับไฟล์ data.js ให้ทิ้งของเก่า แล้วใช้ข้อมูลใหม่จากไฟล์
    if (saved && saved.version !== window.BWT_DEFAULT.version) {
      localStorage.removeItem(LS_SITE);
      saved = null;
    }
    return saved ? deepMerge(window.BWT_DEFAULT, saved) : JSON.parse(JSON.stringify(window.BWT_DEFAULT));
  }

  const S = loadSite();
  /* สัญญาณบอกว่า "ดึงเนื้อหาล่าสุดจากฐานข้อมูลเสร็จแล้ว"
     โหมดแก้ไขต้องรอสัญญาณนี้ก่อน ไม่งั้นจะแก้ทับข้อมูลเก่าแล้วเขียนทับงานคนอื่น */
  let syncDone;
  const ready = new Promise(res => { syncDone = res; });

  window.BWT = {
    data: S,
    ready,
    dbOk: false,
    save(obj) { localStorage.setItem(LS_SITE, JSON.stringify(obj)); },
    reset() { localStorage.removeItem(LS_SITE); },
    leads() { try { return JSON.parse(localStorage.getItem(LS_LEADS) || "[]"); } catch (e) { return []; } },
    saveLeads(a) { localStorage.setItem(LS_LEADS, JSON.stringify(a)); },
    LS_SITE, LS_LEADS
  };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const bg = (item) => item && item.img ? `style="background-image:url('${esc(item.img)}')"` : "";
  const cls = (item, extra = "") => `${extra} ${item && !item.img && item.css ? item.css : ""}`.trim();

  /* ---------- header / footer ---------- */
  const NAV = [
    ["index.html", "หน้าแรก", "HOME"],
    ["about.html", "เกี่ยวกับเรา", "ABOUT"],
    ["services.html", "บริการของเรา", "SERVICES"],
    ["portfolio.html", "ผลงาน", "PORTFOLIO"],
    ["clients.html", "ลูกค้า", "CLIENTS"],
    ["blog.html", "บทความ", "BLOG"],
    ["contact.html", "ติดต่อเรา", "CONTACT"]
  ];

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const c = S.company;
    // หน้าแรก: หัวเว็บโปร่งใสวางทับปก ไม่มีแถบน้ำเงินบนสุด (ตามแบบปก)
    const isHome = page === "index.html" || page === "";
    if (isHome) document.body.classList.add("home");
    host.innerHTML = `
      ${isHome ? "" : `<div class="topbar">
        <div class="container">
          <span class="hide-sm">📍 บางบ่อ สมุทรปราการ — ให้บริการทั่วประเทศ</span>
          <div class="topbar-links">
            <a href="tel:${esc(c.phones[0].replace(/-/g, ""))}">📞 ${esc(c.phones[0])}</a>
            <a href="${esc(c.lineUrl)}" target="_blank" rel="noopener">💬 LINE: ${esc(c.line)}</a>
            <a href="mailto:${esc(c.email)}" class="hide-sm">✉️ ${esc(c.email)}</a>
          </div>
        </div>
      </div>`}
      <header class="site-header" id="stickyHead">
        <div class="container">
          <nav class="nav">
            <a class="brand" href="index.html" aria-label="BW Training หน้าแรก">
              <img src="assets/img/logo.png" alt="โลโก้ BW Training">
              <span>BW<br><small>TRAINING</small></span>
            </a>
            <ul class="nav-menu" id="navMenu">
              ${NAV.map(([h, th]) => `<li><a href="${h}" class="${h === page ? "active" : ""}">${th}</a></li>`).join("")}
            </ul>
            <div class="nav-cta">
              <a class="btn btn-yellow" href="quote.html">ขอใบเสนอราคา <span class="arw">→</span></a>
              <button class="burger" id="burger" aria-label="เปิดเมนู">☰</button>
            </div>
          </nav>
        </div>
      </header>`;

    const menu = document.getElementById("navMenu");
    const burger = document.getElementById("burger");
    burger.addEventListener("click", () => {
      menu.classList.toggle("open");
      burger.textContent = menu.classList.contains("open") ? "✕" : "☰";
    });
    menu.addEventListener("click", e => { if (e.target.tagName === "A") { menu.classList.remove("open"); burger.textContent = "☰"; } });
    const head = document.getElementById("stickyHead");
    addEventListener("scroll", () => head.classList.toggle("scrolled", scrollY > 12), { passive: true });
  }

  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    const c = S.company;
    host.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="foot-grid">
            <div>
              <div class="brand" style="color:#fff;margin-bottom:14px">
                <img src="assets/img/logo.png" alt="โลโก้ BW Training">
                <span>BW<br><small>TRAINING</small></span>
              </div>
              <p style="margin:0 0 6px">${esc(c.nameTh)}</p>
              <p style="margin:0;font-size:.85rem">${esc(c.tagline)}</p>
              <div class="socials">
                <a class="so-fb" href="${esc(c.facebook)}" aria-label="Facebook" title="Facebook" target="_blank" rel="noopener">${ICON.facebook}</a>
                <a class="so-line" href="${esc(c.lineUrl)}" aria-label="LINE" title="LINE" target="_blank" rel="noopener">${ICON.line}</a>
                <a class="so-tt" href="${esc(c.tiktok)}" aria-label="TikTok" title="TikTok" target="_blank" rel="noopener">${ICON.tiktok}</a>
                <a class="so-yt" href="${esc(c.youtube)}" aria-label="YouTube" title="YouTube" target="_blank" rel="noopener">${ICON.youtube}</a>
              </div>
            </div>
            <div>
              <h4>เมนูหลัก</h4>
              <ul class="foot-list">${NAV.map(([h, th]) => `<li><a href="${h}">${th}</a></li>`).join("")}
                <li><a href="quote.html">ขอใบเสนอราคา</a></li></ul>
            </div>
            <div>
              <h4>ติดต่อเรา</h4>
              <ul class="foot-contact">
                <li><span class="ic">📍</span><span>${esc(c.address)}</span></li>
                <li><span class="ic">📞</span><span>${c.phones.map(p => `<a href="tel:${esc(p.replace(/-/g, ""))}">${esc(p)}</a>`).join("<br>")}</span></li>
                <li><span class="ic">✉️</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
                <li><span class="ic">💬</span><a href="${esc(c.lineUrl)}" target="_blank" rel="noopener">LINE: ${esc(c.line)}</a></li>
                <li><span class="ic">🕒</span><span>${esc(c.hours)}</span></li>
              </ul>
            </div>
            <div>
              <h4>แอดไลน์รับโปรโมชั่น</h4>
              <div class="qr-box"><img src="assets/img/line-qr.svg" alt="QR Code LINE Official BW Training (@bwtraining)" width="108" height="108"></div>
              <p style="font-size:.82rem;margin-top:10px">สแกนเพื่อแอด LINE<br><b style="color:#fff">${esc(c.line)}</b></p>
              <a class="btn btn-yellow" style="margin-top:10px;padding:10px 20px" href="quote.html">ขอใบเสนอราคาฟรี</a>
            </div>
          </div>
          <div class="copyright">© ${new Date().getFullYear()} ${esc(c.nameEn)} — All Rights Reserved. |
            <a href="admin.html">ระบบหลังบ้าน</a></div>
        </div>
      </footer>`;
  }

  /* ---------- hero ---------- */
  function heroSlider() {
    const wrap = document.getElementById("heroSlides");
    if (!wrap) return;
    const h = S.hero;
    wrap.innerHTML = h.slides.map((s, i) =>
      `<div class="hero-slide ${cls(s)} ${i === 0 ? "active" : ""}" ${bg(s)}></div>`).join("");
    // ตัวเลือกสไลด์แบบตัวเลข 01 02 03 พร้อมปุ่มวงกลมย้อนกลับ (เอกลักษณ์ของงานนี้)
    const dots = document.getElementById("heroDots");
    if (dots) dots.innerHTML =
      `<button class="hn-num on" aria-label="สไลด์ 1">01</button>` +
      `<button class="hn-prev" aria-label="สไลด์ก่อนหน้า">‹</button>` +
      h.slides.slice(1).map((_, i) =>
        `<button class="hn-num" aria-label="สไลด์ ${i + 2}">${String(i + 2).padStart(2, "0")}</button>`).join("");

    const slides = [...wrap.children];
    const btns = dots ? [...dots.querySelectorAll(".hn-num")] : [];
    let i = 0, timer;
    const go = (n) => {
      slides[i].classList.remove("active"); btns[i] && btns[i].classList.remove("on");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("active"); btns[i] && btns[i].classList.add("on");
    };
    const start = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
    btns.forEach((b, n) => b.addEventListener("click", () => { go(n); start(); }));
    if (dots) dots.querySelector(".hn-prev").addEventListener("click", () => { go(i - 1); start(); });
    start();
  }

  function confetti() {
    const cv = document.getElementById("confetti");
    if (!cv || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    let w, h, parts = [];
    const colors = ["#FFC400", "#16CFE5", "#ffffff", "#7aa8ff"];
    function size() { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; }
    size(); addEventListener("resize", size);
    for (let n = 0; n < 55; n++) parts.push({
      x: Math.random() * w, y: Math.random() * h, r: 2 + Math.random() * 5,
      s: .3 + Math.random() * 1.1, d: Math.random() * 2 * Math.PI,
      c: colors[n % colors.length], o: .25 + Math.random() * .5
    });
    (function loop() {
      ctx.clearRect(0, 0, w, h);
      parts.forEach(p => {
        p.y += p.s; p.x += Math.sin(p.d += .01) * .6;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        ctx.globalAlpha = p.o; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- กล่องดูรูปขยาย (คลิกที่รูปผลงาน) ---------- */
  function lightbox(grid, list) {
    let box = document.getElementById("lightbox");
    if (!box) {
      box = document.createElement("div");
      box.id = "lightbox";
      box.className = "lightbox";
      box.innerHTML = `<img alt="">
        <button class="lb-close" aria-label="ปิด">✕</button>
        <button class="lb-prev" aria-label="รูปก่อนหน้า">‹</button>
        <button class="lb-next" aria-label="รูปถัดไป">›</button>
        <div class="lb-count"></div>`;
      document.body.appendChild(box);
    }
    const img = box.querySelector("img"), count = box.querySelector(".lb-count");
    let i = 0;
    const show = n => {
      i = (n + list.length) % list.length;
      img.src = list[i].img;
      img.alt = list[i].alt || "ผลงานกิจกรรมองค์กรโดย BW Training";
      count.textContent = `${i + 1} / ${list.length}`;
    };
    const open = n => { show(n); box.classList.add("on"); document.body.style.overflow = "hidden"; };
    const close = () => { box.classList.remove("on"); document.body.style.overflow = ""; };

    // ในโหมดแก้ไขหน้าเว็บ ไม่ต้องเปิดรูปขยาย เพราะคลิกคือการเปลี่ยนรูป
    const editing = new URLSearchParams(location.search).get("edit") === "1";
    grid.addEventListener("click", e => {
      if (editing) return;
      const f = e.target.closest(".port"); if (f) open(+f.dataset.i);
    });
    grid.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const f = e.target.closest(".port"); if (f) { e.preventDefault(); open(+f.dataset.i); }
    });
    box.onclick = e => {
      if (e.target.classList.contains("lb-next")) show(i + 1);
      else if (e.target.classList.contains("lb-prev")) show(i - 1);
      else if (e.target === box || e.target.classList.contains("lb-close")) close();
    };
    document.addEventListener("keydown", e => {
      if (!box.classList.contains("on")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(i + 1);
      else if (e.key === "ArrowLeft") show(i - 1);
    });
  }

  /* ---------- renderers ---------- */
  const R = {
    heroText() {
      const h = S.hero, q = id => document.getElementById(id);
      // รูปพื้นหลังปกหน้าแรก (อ่านจากข้อมูล เพื่อให้รูปที่เปลี่ยนไว้ยังอยู่หลังรีเฟรช)
      if (q("heroCover") && h.coverImg) q("heroCover").style.backgroundImage = `url('${h.coverImg}')`;
      if (q("hL1")) {
        q("hL1").textContent = h.l1; q("hL1").dataset.edit = "hero.l1";
        q("hL2").textContent = h.l2; q("hL2").dataset.edit = "hero.l2";
        q("hL3").textContent = h.l3; q("hL3").dataset.edit = "hero.l3";
      }
      if (q("hSub")) { q("hSub").innerHTML = h.sub; q("hSub").dataset.editHtml = "hero.sub"; }
      if (q("hSub2")) { q("hSub2").textContent = h.sub2 || ""; q("hSub2").dataset.edit = "hero.sub2"; }
      if (q("hCta")) { q("hCta").innerHTML = `<span data-edit="hero.ctaText">${esc(h.ctaText)}</span> <span class="arw">→</span>`; q("hCta").href = h.ctaLink; }
      if (q("hVideoText")) q("hVideoText").innerHTML = `<span data-edit="hero.videoText">${esc(h.videoText || "ชมวิดีโอแนะนำ")}</span>`;
      if (q("hRibbonTop")) q("hRibbonTop").innerHTML = `<span data-edit="hero.ribbonTop">${esc(h.ribbonTop || "")}</span>`;
      if (q("hRibbonBottom")) q("hRibbonBottom").innerHTML = `<span data-edit="hero.ribbonBottom">${esc(h.ribbonBottom || "")}</span>`;
    },
    stats(sel) {
      const el = document.querySelector(sel); if (!el) return;
      // ไอคอนเส้นสีเหลืองตามต้นแบบ: เหรียญ / กลุ่มคน / โล่ / ริบบิ้นรางวัล
      const ICON = {
        medal: `<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 22l5-2.6L17 22l-1.5-7.5"/>`,
        people: `<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/><circle cx="17.5" cy="9.5" r="2.6"/><path d="M17.5 14.4c2.6 0 4.5 1.9 4.5 4.4"/>`,
        shield: `<path d="M12 2.5 20 6v6.2c0 4.6-3.3 7.9-8 9.3-4.7-1.4-8-4.7-8-9.3V6z"/><path d="m9 12 2.2 2.2L15.4 10"/>`,
        award: `<circle cx="12" cy="10" r="5.2"/><path d="m12 7.4.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9 9.6l2-.3z"/><path d="M8.6 15.6 7.2 22l4.8-2.4L16.8 22l-1.4-6.4"/>`
      };
      el.innerHTML = S.stats.map((s, i) => {
        const p = ICON[s.ico];
        const ico = p
          ? `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`
          : `<span class="ico" data-edit="stats.${i}.ico">${esc(s.ico)}</span>`;
        return `<div class="stat">${ico}
          <div><b data-edit="stats.${i}.num">${esc(s.num)}</b><small data-edit="stats.${i}.label">${esc(s.label)}</small></div></div>`;
      }).join("");
    },
    services(sel, limit) {
      const el = document.querySelector(sel); if (!el) return;
      el.innerHTML = S.services.slice(0, limit || 99).map((s, i) => `
        <article class="svc reveal">
          <div class="svc-thumb ${cls(s)}" ${bg(s)} data-edit-bg="services.${i}.img"></div>
          <div class="svc-body">
            <h3 data-edit="services.${i}.title">${esc(s.title)}</h3><p data-edit="services.${i}.desc">${esc(s.desc)}</p>
            <a class="more" href="services.html#${esc(s.id)}">ดูรายละเอียด <span class="arw">→</span></a>
          </div>
        </article>`).join("");
    },
    /* แถบความเชี่ยวชาญ: รูปซ้าย + ข้อความขวา */
    expertise(sel) {
      const el = document.querySelector(sel); if (!el) return;
      const x = S.expertise;
      el.innerHTML = `
        <div class="about-card-img" style="background-image:url('${esc(x.img)}')" data-edit-bg="expertise.img"></div>
        <div class="about-card-content">
          <div class="section-kicker" style="color:var(--blue)" data-edit="expertise.kicker">${esc(x.kicker)}</div>
          <h2 style="color:var(--blue-deep);font-size:clamp(1.4rem,3vw,2.2rem);font-weight:800;margin-bottom:12px"
              data-edit="expertise.title">${esc(x.title)}</h2>
          <p style="color:var(--muted);margin-bottom:20px;font-size:.95rem" data-edit="expertise.desc">${esc(x.desc)}</p>
          <div class="feature-pills">
            ${x.pills.map((p, i) => `<div class="f-pill"><span data-edit="expertise.pills.${i}.ico">${esc(p.ico)}</span>
              <span data-edit="expertise.pills.${i}.text">${esc(p.text)}</span></div>`).join("")}
          </div>
        </div>`;
    },
    /* ส่วนแนะนำบริษัท: บทความซ้าย + สไลด์ภาพขวา */
    intro(sel) {
      const el = document.querySelector(sel); if (!el) return;
      const n = S.intro;

      // หัวข้อและปุ่มอยู่นอกกล่องนี้ จึงต้องใส่ค่าให้แยกต่างหาก
      const q = id => document.getElementById(id);
      if (q("introKicker")) q("introKicker").textContent = n.kicker || "";
      if (q("introTitle")) q("introTitle").textContent = n.sectionTitle || "";
      if (q("introBtnText")) q("introBtnText").textContent = n.btnText || "";
      if (q("introBtn") && n.btnLink) q("introBtn").setAttribute("href", n.btnLink);

      el.innerHTML = `
        <div class="intro-text">
          <h2 class="intro-title" data-edit="intro.title">${esc(n.title)}</h2>
          <p class="intro-lead" data-edit-html="intro.lead">${n.lead}</p>
          <ul class="intro-list">${n.bullets.map((b, i) => `<li data-edit-html="intro.bullets.${i}">${b}</li>`).join("")}</ul>
        </div>
        <div class="intro-marquee">
          <div class="im-track">${
            // วางภาพ 2 ชุดต่อกัน เพื่อให้เลื่อนวนต่อเนื่องไม่มีรอยต่อ (แบบเดียวกับแถบโลโก้ลูกค้า)
            [0, 1].map(pass => n.gallery.map((g, i) => `
              <figure class="im-item${pass ? " im-dup" : ""}"${pass === 0 ? ` data-slot="${i + 1}"` : ""}>
                <img src="${esc(g.img)}"${pass === 0 ? ` data-edit-img="intro.gallery.${i}.img"` : ""}
                     alt="${esc(g.alt || "ภาพกิจกรรมโดย BW Training")}" loading="lazy" decoding="async">
              </figure>`).join("")).join("")
          }</div>
        </div>`;

      // ความเร็วเลื่อน: ประมาณ 6 วินาทีต่อภาพ (ขนาดภาพจัดการด้วย CSS ทั้งหมด)
      const track = el.querySelector(".im-track");
      if (track) track.style.animationDuration = (n.gallery.length * 6) + "s";
    },
    servicesFull(sel) {
      const el = document.querySelector(sel); if (!el) return;
      el.innerHTML = S.services.map((s, i) => `
        <article class="split reveal" id="${esc(s.id)}" style="background:${i % 2 ? "var(--paper)" : "#fff"};border-radius:24px;overflow:hidden;margin-bottom:26px">
          <div class="split-media ${cls(s)}" ${bg(s)} style="${i % 2 ? "order:2;clip-path:polygon(12% 0,100% 0,100% 100%,0 100%)" : ""}"></div>
          <div class="split-body" style="padding:40px">
            <div class="section-kicker">${esc(s.ico)} SERVICE</div>
            <h2 class="section-title" style="font-size:1.6rem" data-edit="services.${i}.title">${esc(s.title)}</h2>
            <p class="lead" data-edit="services.${i}.detail">${esc(s.detail || s.desc)}</p>
            <a class="btn btn-outline" style="margin-top:16px" href="quote.html?service=${encodeURIComponent(s.title)}">ขอใบเสนอราคาบริการนี้ <span class="arw">→</span></a>
          </div>
        </article>`).join("");
    },
    portfolio(sel, limit) {
      const el = document.querySelector(sel); if (!el) return;
      // รูปภาพล้วน ขนาดเท่ากันทุกใบ ไม่มีตัวหนังสือทับ — คลิกเพื่อดูรูปขยาย
      const list = S.portfolio.slice(0, limit || 99);
      el.innerHTML = list.map((p, i) => `
        <figure class="port" tabindex="0" role="button" data-i="${i}"
                aria-label="ดูรูปขยาย: ${esc(p.alt || "ผลงานกิจกรรมองค์กร")}">
          <img src="${esc(p.img)}" data-edit-img="portfolio.${i}.img" alt="${esc(p.alt || "ผลงานกิจกรรมองค์กรโดย BW Training")}" loading="lazy" decoding="async">
        </figure>`).join("");
      lightbox(el, list);
    },
    clients(sel, marquee) {
      const el = document.querySelector(sel); if (!el) return;
      const card = (c, i) => c.logo
        ? `<div class="client"><img src="${esc(c.logo)}" data-edit-img="clients.${i}.logo" alt="โลโก้ ${esc(c.name)}" loading="lazy" title="${esc(c.name)}"
             onerror="this.closest('.client').style.display='none'"></div>`
        : `<div class="client"><div><b data-edit="clients.${i}.name">${esc(c.name)}</b><small data-edit="clients.${i}.note">${esc(c.note)}</small></div></div>`;
      el.innerHTML = marquee
        ? S.clients.map(card).join("") + S.clients.map((c, i) => card(c, i)).join("")
        : S.clients.map(card).join("");
    },
    testimonials(sel) {
      const el = document.querySelector(sel); if (!el) return;
      const avatar = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="12" fill="#fff"/>
        <path d="M32 40c-11 0-20 7.6-20 17v7h40v-7c0-9.4-9-17-20-17z" fill="#fff"/></svg>`;
      el.innerHTML = S.testimonials.map((t, i) => `
        <div class="tst reveal">
          <div class="tst-av">${avatar}</div>
          <div class="tst-body">
            <div class="stars">★★★★★</div>
            <p>“<span data-edit="testimonials.${i}.text">${esc(t.text)}</span>”</p>
            ${t.name ? `<div class="tst-who">${esc(t.name)}${t.org ? " — " + esc(t.org) : ""}</div>` : ""}
          </div>
        </div>`).join("");
    },
    blog(sel, limit) {
      const el = document.querySelector(sel); if (!el) return;
      el.innerHTML = S.blog.slice(0, limit || 99).map((b, i) => `
        <article class="prog reveal">
          <div class="prog-top ${cls(b)}" ${bg(b)} data-edit-bg="blog.${i}.img"><span class="prog-tag" data-edit="blog.${i}.cat">${esc(b.cat)}</span></div>
          <div class="prog-body">
            <small style="color:var(--muted)">🗓 <span data-edit="blog.${i}.date">${esc(b.date)}</span></small>
            <h3 style="font-family:var(--body-th);text-transform:none;font-size:1.05rem;color:var(--ink);margin:6px 0 8px" data-edit="blog.${i}.title">${esc(b.title)}</h3>
            <p style="color:var(--muted);font-size:.88rem;flex:1" data-edit="blog.${i}.excerpt">${esc(b.excerpt)}</p>
            <a class="more" href="blog.html#${esc(b.id)}">อ่านต่อ <span class="arw">→</span></a>
          </div>
        </article>`).join("");
    },
    blogFull(sel) {
      const el = document.querySelector(sel); if (!el) return;
      el.innerHTML = S.blog.map((b, i) => `
        <article class="reveal" id="${esc(b.id)}" style="background:#fff;border:1px solid var(--line);border-radius:24px;overflow:hidden;margin-bottom:28px;box-shadow:var(--shadow)">
          <div style="height:260px;background-image:url('${esc(b.img)}');background-size:cover;background-position:center;position:relative" data-edit-bg="blog.${i}.img">
            <span class="prog-tag" style="position:absolute;top:16px;left:16px" data-edit="blog.${i}.cat">${esc(b.cat)}</span>
          </div>
          <div style="padding:28px">
            <div class="section-kicker">🗓️ <span data-edit="blog.${i}.date">${esc(b.date)}</span></div>
            <h2 style="font-size:1.4rem;color:var(--blue-deep);margin-bottom:12px;font-weight:700" data-edit="blog.${i}.title">${esc(b.title)}</h2>
            <p class="lead" style="margin-bottom:14px;color:var(--ink);font-weight:500"><b data-edit="blog.${i}.excerpt">${esc(b.excerpt)}</b></p>
            <p style="color:var(--muted);line-height:1.8" data-edit="blog.${i}.body">${esc(b.body)}</p>
          </div>
        </article>`).join("");
    },
    faq(sel) {
      const el = document.querySelector(sel); if (!el) return;
      el.innerHTML = S.faq.map((f, i) => `
        <div class="accordion reveal"><button type="button"><span data-edit="faq.${i}.q">${esc(f.q)}</span><span class="pm">+</span></button>
          <div class="ac-body"><p data-edit="faq.${i}.a">${esc(f.a)}</p></div></div>`).join("");
      el.addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        const a = b.parentElement; a.classList.toggle("open");
        a.querySelector(".pm").textContent = a.classList.contains("open") ? "–" : "+";
      });
    }
  };
  window.BWT.render = R;

  /* ---------- ข้อความคงที่ในไฟล์ HTML ที่ถูกแก้จากโหมดแก้ไขหน้าเว็บ ----------
     เก็บเป็น S.pageText[<ชื่อไฟล์หน้า>][<ตำแหน่งใน DOM>] = ข้อความใหม่ */
  const pageKey = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();

  function nodePath(el) {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      const tag = el.tagName.toLowerCase();
      let n = 1, sib = el;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) n++;
      parts.unshift(tag + ":nth-of-type(" + n + ")");
      el = el.parentElement;
    }
    return "body>" + parts.join(">");
  }
  window.BWT.nodePath = nodePath;
  window.BWT.pageKey = pageKey;

  function applyPageText() {
    const map = (S.pageText || {})[pageKey()];
    if (!map) return;
    Object.keys(map).forEach(sel => {
      let el = null;
      try { el = document.querySelector(sel); } catch (e) { return; }
      if (el && !el.hasAttribute("data-edit")) el.textContent = map[sel];
    });
  }

  /* ---------- ดึงเนื้อหาล่าสุดจาก Supabase ----------
     ถ้าฐานข้อมูลมีเนื้อหาที่ใหม่กว่าในเครื่อง จะโหลดมาใช้แล้ววาดหน้าใหม่
     ทำให้ทุกเครื่อง/ทุกคนเห็นเนื้อหาชุดเดียวกัน */
  let dbSynced = false;
  async function syncFromDb() {
    if (dbSynced || !window.BWT_DB) return;
    dbSynced = true;
    try {
      /* ถามก่อนว่าเนื้อหาบนฐานข้อมูลถูกแก้ล่าสุดเมื่อไหร่ (ข้อมูลไม่กี่สิบไบต์)
         ถ้าตรงกับที่เครื่องนี้ใช้อยู่ ก็จบเลย ไม่ต้องโหลดใหม่ ไม่ต้องวาดใหม่
         — นี่คือสาเหตุที่รูปเคยกระพริบเป็นรูปเก่าแวบหนึ่งทุกครั้งที่เปิดหน้า */
      const stamp = await window.BWT_DB.fetchStamp();
      window.BWT.dbOk = true;   // ติดต่อฐานข้อมูลได้ — ข้อมูลที่ใช้อยู่เชื่อถือได้
      if (stamp && stamp === localStorage.getItem(LS_STAMP) && localStorage.getItem(LS_SITE)) return;

      const row = await window.BWT_DB.fetchContent();
      if (!row || !row.content) return;
      const remote = row.content;
      if (remote.version !== window.BWT_DEFAULT.version) return;   // คนละรุ่นข้อมูล ไม่นำมาใช้

      try {
        localStorage.setItem(LS_SITE, JSON.stringify(remote));
        localStorage.setItem(LS_STAMP, row.updated_at || stamp || "");
      } catch (e) {
        // พื้นที่เก็บเต็ม — ล้างตราเวลาทิ้ง เพื่อไม่ให้เข้าใจผิดว่าแคชตรงกับฐานข้อมูล
        try { localStorage.removeItem(LS_STAMP); } catch (e2) {}
      }
      Object.keys(remote).forEach(k => { S[k] = remote[k]; });
      renderHeader(); renderFooter(); R.heroText();
      if (typeof window.pageInit === "function") window.pageInit(R, S);
      applyPageText(); reveals(); counters();
    } catch (e) {
      // ออฟไลน์ / ยังไม่ได้ตั้งตาราง — ใช้เนื้อหาในเครื่องต่อไป
      console.warn("ซิงก์เนื้อหาจาก Supabase ไม่สำเร็จ:", e.message);
    }
  }

  /* ---------- interactions ---------- */
  function reveals() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
  }

  function counters() {
    document.querySelectorAll("[data-count]").forEach(el => {
      const raw = el.dataset.count, num = parseInt(raw.replace(/[^\d]/g, ""), 10);
      if (!num) { el.textContent = raw; return; }
      const suffix = raw.replace(/[\d,]/g, "");
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; io.disconnect();
        let v = 0, step = num / 45;
        const t = setInterval(() => {
          v += step;
          if (v >= num) { v = num; clearInterval(t); }
          el.textContent = Math.floor(v).toLocaleString("en-US") + suffix;
        }, 24);
      }), { threshold: .4 });
      io.observe(el);
    });
  }

  function filters() {
    document.querySelectorAll("[data-filter-for]").forEach(bar => {
      const target = document.querySelector(bar.dataset.filterFor);
      bar.addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b || !target) return;
        bar.querySelectorAll("button").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        const v = b.dataset.cat;
        target.querySelectorAll("[data-cat]").forEach(card => {
          card.style.display = (v === "all" || card.dataset.cat === v) ? "" : "none";
        });
      });
    });
  }

  function videoModal() {
    const m = document.getElementById("videoModal"); if (!m) return;
    document.querySelectorAll("[data-video]").forEach(b => b.addEventListener("click", () => m.classList.add("on")));
    m.addEventListener("click", e => { if (e.target === m || e.target.classList.contains("close")) m.classList.remove("on"); });
  }

  /* ---------- quote / contact form ---------- */
  function forms() {
    document.querySelectorAll("form[data-mailto]").forEach(form => {
      const msg = form.querySelector(".form-msg");
      const to = S.company.email;

      // prefill from ?service= / ?program=
      const qs = new URLSearchParams(location.search);
      const pre = qs.get("service") || qs.get("program");
      if (pre) {
        const sel = form.querySelector('[name="ประเภทกิจกรรม"]');
        if (sel) { const o = [...sel.options].find(o => o.value.includes(pre)); if (o) sel.value = o.value; else sel.insertAdjacentHTML("beforeend", `<option selected>${esc(pre)}</option>`); }
      }

      form.addEventListener("submit", async e => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = {};
        fd.forEach((v, k) => { if (!k.startsWith("_")) data[k] = v; });
        data["ส่งเมื่อ"] = new Date().toLocaleString("th-TH");
        data["ส่งจากหน้า"] = location.pathname.split("/").pop();

        // เก็บลง localStorage ให้หลังบ้านดูได้เสมอ
        const leads = window.BWT.leads(); leads.unshift(data); window.BWT.saveLeads(leads);

        const btn = form.querySelector('[type="submit"]');
        const old = btn.innerHTML; btn.innerHTML = "กำลังส่ง..."; btn.disabled = true;

        // บันทึกลงฐานข้อมูล Supabase (ไม่ให้ขัดขวางการส่งอีเมลถ้าล้มเหลว)
        let savedToDb = false;
        if (window.BWT_DB) {
          try {
            await window.BWT_DB.saveLead(data, form.dataset.formType || "quote");
            savedToDb = true;
          } catch (err) { console.warn("บันทึกลง Supabase ไม่สำเร็จ:", err.message); }
        }

        let sent = false;
        try {
          const res = await fetch("https://formsubmit.co/ajax/" + to, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(Object.assign({
              _subject: (form.dataset.subject || "ขอใบเสนอราคา") + " — BW Training",
              _template: "table", _captcha: "false"
            }, data))
          });
          sent = res.ok;
        } catch (err) { sent = false; }

        btn.innerHTML = old; btn.disabled = false;

        // ถ้าบันทึกลงฐานข้อมูลได้ ถือว่าข้อมูลไม่หายแล้ว แม้อีเมลจะส่งไม่ผ่าน
        if (sent || savedToDb) {
          msg.className = "form-msg ok";
          msg.innerHTML = "✅ ส่งข้อมูลเรียบร้อยแล้ว! ทีมงาน BW Training จะติดต่อกลับภายใน 24 ชั่วโมงทำการ";
          form.reset();
        } else {
          const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
          const link = `mailto:${to}?subject=${encodeURIComponent((form.dataset.subject || "ขอใบเสนอราคา") + " — BW Training")}&body=${encodeURIComponent(body)}`;
          msg.className = "form-msg err";
          msg.innerHTML = `⚠️ ส่งอัตโนมัติไม่สำเร็จ (อาจยังไม่ได้ยืนยันอีเมลผู้รับ) — บันทึกข้อมูลไว้ในระบบหลังบ้านแล้ว<br>
            <a href="${link}" style="color:#0645C5;font-weight:600">👉 คลิกที่นี่เพื่อส่งทางอีเมลของคุณ</a> หรือแอดไลน์ <a href="${esc(S.company.lineUrl)}" target="_blank" rel="noopener" style="color:#0645C5;font-weight:600">${esc(S.company.line)}</a>`;
        }
        msg.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    renderHeader(); renderFooter();
    heroSlider(); confetti(); R.heroText();
    if (typeof window.pageInit === "function") window.pageInit(R, S);
    applyPageText();
    syncFromDb().finally(() => syncDone());
    reveals(); counters(); filters(); videoModal(); forms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
