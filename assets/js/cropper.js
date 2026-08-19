/* ============================================================
   BW Training — เครื่องมือครอปรูป (ใช้ร่วมกันทั้งหลังบ้านและโหมดแก้ไขหน้าเว็บ)

   วิธีเรียกใช้:
     BWT_CROP.open(ไฟล์รูป, { aspect: 16/9, maxW: 1600 }, function (dataUrl, w, h, kb) { ... });

   - aspect  = สัดส่วนที่ต้องการ (ปล่อยว่าง = ครอปอิสระ)
   - maxW    = ความกว้างสูงสุดของรูปที่ได้ (ย่อให้อัตโนมัติ ไม่ให้ไฟล์ใหญ่เกิน)
   - ถ้าผู้ใช้กด "ใช้รูปเต็ม" จะได้รูปทั้งใบโดยไม่ครอป
   ============================================================ */
(function () {
  "use strict";

  const RATIOS = [
    ["อิสระ", 0],
    ["16:9 แนวนอน", 16 / 9],
    ["4:3", 4 / 3],
    ["1:1 จัตุรัส", 1],
    ["3:4 แนวตั้ง", 3 / 4]
  ];

  let box = null;      // กรอบครอป (พิกัดบนภาพที่แสดง หน่วยพิกเซล)
  let stageW = 0, stageH = 0;
  let aspect = 0;
  let img = null, els = null, done = null, opts = null;

  /* ---------- สร้างหน้าต่าง ---------- */
  function build() {
    const mask = document.createElement("div");
    mask.className = "cr-mask";
    mask.innerHTML = `
      <div class="cr-card" role="dialog" aria-label="ครอปรูปภาพ">
        <div class="cr-head">
          <b>✂️ ครอปรูปภาพ</b>
          <span class="cr-hint">ลากกรอบเพื่อเลือกส่วนที่ต้องการ · ลากมุมเพื่อย่อ–ขยาย</span>
        </div>
        <div class="cr-ratios">
          ${RATIOS.map((r, i) => `<button type="button" data-ar="${r[1]}"${i === 0 ? ' class="on"' : ""}>${r[0]}</button>`).join("")}
        </div>
        <div class="cr-stage">
          <img alt="รูปที่กำลังครอป" draggable="false">
          <div class="cr-box">
            ${["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(d => `<i class="cr-h cr-${d}" data-dir="${d}"></i>`).join("")}
          </div>
        </div>
        <div class="cr-foot">
          <span class="cr-size"></span>
          <span style="flex:1"></span>
          <button type="button" class="cr-btn cr-full">ใช้รูปเต็ม</button>
          <button type="button" class="cr-btn cr-cancel">ยกเลิก</button>
          <button type="button" class="cr-btn cr-ok">ใช้รูปนี้</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    return {
      mask,
      img: mask.querySelector("img"),
      stage: mask.querySelector(".cr-stage"),
      cbox: mask.querySelector(".cr-box"),
      size: mask.querySelector(".cr-size"),
      ratios: mask.querySelector(".cr-ratios")
    };
  }

  /* ---------- วาดกรอบ ---------- */
  function paint() {
    els.cbox.style.left = box.x + "px";
    els.cbox.style.top = box.y + "px";
    els.cbox.style.width = box.w + "px";
    els.cbox.style.height = box.h + "px";
    const s = img.naturalWidth / stageW;
    els.size.textContent = `พื้นที่ที่เลือก ${Math.round(box.w * s)} × ${Math.round(box.h * s)} จุด`;
  }

  function clampBox() {
    box.w = Math.max(40, Math.min(box.w, stageW));
    box.h = Math.max(40, Math.min(box.h, stageH));
    box.x = Math.max(0, Math.min(box.x, stageW - box.w));
    box.y = Math.max(0, Math.min(box.y, stageH - box.h));
  }

  /* วางกรอบเริ่มต้นให้ใหญ่ที่สุดเท่าที่สัดส่วนอนุญาต แล้วจัดกึ่งกลาง */
  function resetBox() {
    if (!aspect) {
      box = { x: 0, y: 0, w: stageW, h: stageH };
    } else {
      let w = stageW, h = w / aspect;
      if (h > stageH) { h = stageH; w = h * aspect; }
      box = { x: (stageW - w) / 2, y: (stageH - h) / 2, w, h };
    }
    paint();
  }

  /* ---------- ลากย้าย / ลากปรับขนาด ---------- */
  function drag(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const handle = e.target.closest(".cr-h");
    const inBox = e.target.closest(".cr-box");
    if (!handle && !inBox) return;
    e.preventDefault();

    const dir = handle ? handle.dataset.dir : "move";
    const p0 = point(e), b0 = Object.assign({}, box);

    function move(ev) {
      const p = point(ev), dx = p.x - p0.x, dy = p.y - p0.y;

      if (dir === "move") {
        box.x = b0.x + dx; box.y = b0.y + dy;
        box.x = Math.max(0, Math.min(box.x, stageW - box.w));
        box.y = Math.max(0, Math.min(box.y, stageH - box.h));
        paint(); return;
      }

      let { x, y, w, h } = b0;
      if (dir.includes("e")) w = b0.w + dx;
      if (dir.includes("s")) h = b0.h + dy;
      if (dir.includes("w")) { w = b0.w - dx; x = b0.x + dx; }
      if (dir.includes("n")) { h = b0.h - dy; y = b0.y + dy; }

      if (aspect) {
        // ด้านบน–ล่างคุมด้วยความสูง ที่เหลือคุมด้วยความกว้าง
        if (dir === "n" || dir === "s") w = h * aspect; else h = w / aspect;
        if (dir.includes("w")) x = b0.x + b0.w - w;
        if (dir.includes("n")) y = b0.y + b0.h - h;
      }

      if (w < 40 || h < 40) return;
      if (x < 0 || y < 0 || x + w > stageW + .5 || y + h > stageH + .5) return;
      box = { x, y, w, h };
      paint();
    }
    function up() {
      removeEventListener("mousemove", move); removeEventListener("mouseup", up);
      removeEventListener("touchmove", move); removeEventListener("touchend", up);
    }
    addEventListener("mousemove", move); addEventListener("mouseup", up);
    addEventListener("touchmove", move, { passive: false }); addEventListener("touchend", up);
  }

  function point(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  /* ---------- ตัดรูปออกมาเป็นไฟล์ ---------- */
  function output(useFull) {
    const s = img.naturalWidth / stageW;
    const sx = useFull ? 0 : Math.round(box.x * s);
    const sy = useFull ? 0 : Math.round(box.y * s);
    const sw = useFull ? img.naturalWidth : Math.round(box.w * s);
    const sh = useFull ? img.naturalHeight : Math.round(box.h * s);

    const maxW = opts.maxW || 1600;
    const scale = Math.min(1, maxW / sw);
    const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));

    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);   // กันพื้นดำในรูปโปร่งใส
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    let q = 0.82, out = cv.toDataURL("image/jpeg", q);
    while (out.length > 900 * 1024 && q > 0.4) { q -= 0.12; out = cv.toDataURL("image/jpeg", q); }

    const cb = done;          // เก็บไว้ก่อน เพราะ close() จะล้างค่านี้ทิ้ง
    close();
    cb(out, w, h, Math.round(out.length / 1024));
  }

  function close() {
    if (!els) return;
    removeEventListener("keydown", onKey);
    removeEventListener("resize", onResize);
    els.mask.remove();
    els = null; img = null; box = null; done = null;
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  function onResize() {
    if (!els) return;
    const r = els.img.getBoundingClientRect();
    if (!r.width) return;
    const fx = r.width / stageW, fy = r.height / stageH;
    stageW = r.width; stageH = r.height;
    box = { x: box.x * fx, y: box.y * fy, w: box.w * fx, h: box.h * fy };
    clampBox(); paint();
  }

  /* ---------- เปิดใช้งาน ---------- */
  function open(file, options, cb) {
    opts = options || {};
    done = cb;
    aspect = opts.aspect || 0;

    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      img = probe;
      els = build();
      els.img.src = url;

      els.img.onload = () => {
        URL.revokeObjectURL(url);
        const r = els.img.getBoundingClientRect();
        stageW = r.width; stageH = r.height;
        // ถ้าสัดส่วนที่ขอมาไม่ตรงปุ่มไหนเลย (เช่น ครอปให้พอดีช่องบนหน้าเว็บ)
        // ให้เพิ่มปุ่มของมันเองไว้หน้าสุด จะได้กดกลับมาได้หลังลองสัดส่วนอื่น
        let btn = [...els.ratios.children].find(b => Math.abs(+b.dataset.ar - aspect) < 0.001);
        if (!btn && aspect) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.dataset.ar = aspect;
          btn.textContent = "พอดีกับช่องบนเว็บ";
          els.ratios.prepend(btn);
        }
        if (btn) { [...els.ratios.children].forEach(b => b.classList.remove("on")); btn.classList.add("on"); }
        resetBox();
      };

      els.stage.addEventListener("mousedown", drag);
      els.stage.addEventListener("touchstart", drag, { passive: false });
      els.ratios.addEventListener("click", e => {
        const b = e.target.closest("button[data-ar]"); if (!b) return;
        [...els.ratios.children].forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        aspect = +b.dataset.ar;
        resetBox();
      });
      els.mask.querySelector(".cr-ok").addEventListener("click", () => output(false));
      els.mask.querySelector(".cr-full").addEventListener("click", () => output(true));
      els.mask.querySelector(".cr-cancel").addEventListener("click", close);
      els.mask.addEventListener("mousedown", e => { if (e.target === els.mask) close(); });
      addEventListener("keydown", onKey);
      addEventListener("resize", onResize);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      alert("เปิดไฟล์รูปไม่สำเร็จ กรุณาลองไฟล์อื่น");
    };
    probe.src = url;
  }

  window.BWT_CROP = { open };
})();
