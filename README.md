# เว็บไซต์ BW Training — คู่มือการใช้งาน

บริษัท บีดับบลิว เทรนนิ่ง จำกัด — เว็บไซต์หลายหน้า (Static HTML/CSS/JS ไม่ต้องใช้เซิร์ฟเวอร์พิเศษ)

## โครงสร้างไฟล์

```
index.html      หน้าแรก (แบนเนอร์เคลื่อนไหวแบบ ADS + ฟอร์มขอราคาด่วน)
about.html      เกี่ยวกับเรา
services.html   บริการ 7 หมวด
portfolio.html  ผลงาน (กรองตามหมวดได้)
clients.html    ลูกค้า
blog.html       บทความ (ช่วย SEO/AEO)
contact.html    ติดต่อเรา + แผนที่ + QR LINE
quote.html      ขอใบเสนอราคา (ฟอร์มเต็ม)
admin.html      ระบบหลังบ้าน (แก้ไขเนื้อหาทุกหน้า)
sitemap.xml / robots.txt
assets/css/style.css
assets/js/data.js    ← เนื้อหาทั้งหมดของเว็บไซต์อยู่ที่นี่
assets/js/main.js    ← ระบบแสดงผลหน้าเว็บ
assets/js/admin.js   ← ระบบหลังบ้าน
assets/img/logo.svg, line-qr.svg (QR โค้ด LINE: bwtraining)
assets/img/scene-*.svg  ภาพประกอบซีน 10 ภาพ (ทะเล ภูเขา ปาร์ตี้ สัมมนา ทีมบิวดิ้ง
                        เวิร์กช็อป CSR ท่องเที่ยว Outing กีฬาสี)
```

## การเปิดใช้งาน

เปิด `index.html` ด้วยเบราว์เซอร์ได้ทันที หรืออัปโหลดทั้งโฟลเดอร์ขึ้นโฮสติ้ง (ใช้ได้กับ Hosting ทั่วไป, Netlify, Vercel, GitHub Pages)

## ระบบหลังบ้าน (admin.html)

- รหัสผ่านเริ่มต้น: **bwtraining2026** (เปลี่ยนได้ในแท็บ “ตั้งค่า”)
- แก้ไขได้: ข้อมูลบริษัท, แบนเนอร์, สถิติ, บริการ, ผลงาน, ลูกค้า, รีวิว, บทความ, FAQ, เกี่ยวกับเรา, SEO
- ดูรายการ “ใบขอเสนอราคา” ที่ลูกค้ากรอก และดาวน์โหลดเป็น CSV ได้
- กด **💾 บันทึกทั้งหมด** → เนื้อหาใหม่แสดงผลทันทีบนเบราว์เซอร์เครื่องนั้น (เก็บใน localStorage)
- **ให้ผู้เข้าชมทุกคนเห็นเนื้อหาใหม่:** กด **⬇ ส่งออก JSON** แล้วนำค่าที่ได้ไปแทนที่ในไฟล์
  `assets/js/data.js` (ตัวแปร `window.BWT_DEFAULT`) จากนั้นอัปโหลดไฟล์ขึ้นโฮสต์
- รหัสผ่านนี้เป็นการป้องกันฝั่งหน้าเว็บ ควรตั้ง Basic Auth / .htpasswd ให้ `admin.html` เพิ่มบนโฮสต์จริง

## ฟอร์มขอใบเสนอราคา → bw_training@hotmail.com

ใช้บริการ **FormSubmit** (ไม่ต้องเขียนโค้ดฝั่งเซิร์ฟเวอร์)

**ต้องทำครั้งเดียวก่อนใช้งานจริง:** ส่งฟอร์มทดสอบ 1 ครั้งจากเว็บไซต์ที่อัปโหลดขึ้นโฮสต์แล้ว →
FormSubmit จะส่งอีเมลยืนยันไปที่ bw_training@hotmail.com → กดยืนยันในอีเมลนั้น
หลังจากนั้นฟอร์มทุกหน้าจะส่งเข้าอีเมลอัตโนมัติ

ถ้าส่งอัตโนมัติไม่สำเร็จ ระบบจะบันทึกข้อมูลไว้ในหลังบ้าน และแสดงลิงก์ให้ลูกค้าส่งทางอีเมลของตัวเองแทน

## SEO / AEO / GEO ที่ติดตั้งไว้แล้ว

- **SEO:** title / meta description / keywords / canonical / Open Graph / Twitter Card ครบทุกหน้า, sitemap.xml, robots.txt, โครงสร้าง heading ที่ถูกต้อง, alt ของรูปภาพ
- **AEO (Answer Engine):** Schema.org JSON-LD — Organization, LocalBusiness, TravelAgency, Service, Product+Offer (ราคา), FAQPage, BlogPosting, BreadcrumbList + ส่วน FAQ บนหน้าเว็บที่เขียนแบบตอบคำถามตรงๆ
- **GEO (Local + Generative Engine):** meta geo.region / geo.placename / geo.position / ICBM, ที่อยู่และพิกัดในโครงสร้างข้อมูล, areaServed, เวลาทำการ, และ robots.txt อนุญาต GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot / Google-Extended

**สิ่งที่ต้องทำหลังขึ้นโฮสต์จริง**
1. เปลี่ยน `https://www.bwtraining.co.th` เป็นโดเมนจริงในทุกไฟล์ (canonical, og:url, sitemap.xml, robots.txt)
2. ยืนยันเว็บไซต์ใน Google Search Console แล้วส่ง sitemap.xml
3. สร้าง Google Business Profile ที่อยู่บางบ่อ สมุทรปราการ (มีผลต่อ GEO/Local SEO มากที่สุด)
4. ยืนยันอีเมลกับ FormSubmit ตามหัวข้อด้านบน

## รูปภาพ

ตอนนี้ใช้ **ภาพประกอบเวกเตอร์ (SVG)** ที่วาดเป็นซีนจริง — ชายหาดชักเย่อ, ปีนเขา, ปาร์ตี้กลางคืน,
ห้องสัมมนา, ทีมบิวดิ้งกลางแจ้ง, เวิร์กช็อป, ปลูกป่า CSR, ทริปเกาะ, Outing หมู่คณะ, กีฬาสี
ไฟล์อยู่ใน `assets/img/scene-*.svg` (ขยายได้ไม่แตก ไฟล์เล็ก โหลดเร็ว)

**เมื่อมีรูปถ่ายจริง** ให้เปลี่ยนเป็นภาพถ่ายได้ทันที: วางไฟล์ .jpg ไว้ใน `assets/img/`
แล้วแก้ path ในช่อง “รูปภาพ (URL)” ของแต่ละรายการในหน้าหลังบ้าน
(แบนเนอร์หน้าแรกอยู่ในแท็บ “แบนเนอร์หน้าแรก” → ส่วนภาพสไลด์)
แนะนำขนาด: แบนเนอร์ 1920×1080 px, การ์ดบริการ/ผลงาน 800×600 px

## QR Code LINE

`assets/img/line-qr.svg` ชี้ไปที่ `https://line.me/R/ti/p/~bwtraining`
ถ้าเปลี่ยน LINE ID ต้องสร้าง QR ใหม่แล้วแทนที่ไฟล์นี้
