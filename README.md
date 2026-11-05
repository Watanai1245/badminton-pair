# 🏸 Badminton Pair

เว็บจับคู่แบดมินตันประเภทคู่ (2 vs 2) ออกแบบสำหรับใช้บนมือถือ เป็น static site (HTML/CSS/JS ล้วน ไม่ต้อง build)

## ฟีเจอร์
- เลือกจำนวนคอร์ด, เวลาที่ตีทั้งหมด และเวลาต่อรอบ → คำนวณจำนวนรอบอัตโนมัติ
- เพิ่ม/ลบผู้เล่น ระบุเพศ (กดที่ป้ายเพศเพื่อสลับ) หรือวางหลายชื่อพร้อมกัน
- เงื่อนไขการจับคู่ (เปิด/ปิดได้)
  - ห้ามหญิง+หญิง / ห้ามชาย+ชาย เป็นคู่กัน
  - เน้นคู่ผสม
  - ไม่จับคู่ซ้ำจนกว่าจะวนครบทุกคน
  - หลีกเลี่ยงเจอคู่แข่งซ้ำ
  - ผลัดกันพักอย่างยุติธรรม
- แสดงผลบนคอร์ดพร้อม animation สุ่มชื่อ → ลงคอร์ด, ปัดซ้าย/ขวาเพื่อเปลี่ยนรอบ
- สรุปจำนวนเกมของแต่ละคน และคัดลอกตารางทั้งหมดไปแชร์ในไลน์
- จำข้อมูลไว้ในเครื่อง (localStorage)

## รันในเครื่อง
```bash
npx serve .
# หรือ python3 -m http.server 8000
```

## Deploy ขึ้น GitHub
```bash
git init
git add .
git commit -m "Badminton pair app"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## Deploy ขึ้น Vercel
1. เข้า [vercel.com/new](https://vercel.com/new) แล้ว Import repo จาก GitHub
2. Framework Preset: **Other**, ปล่อย Build Command และ Output Directory ว่างไว้ แล้วกด Deploy

หรือใช้ CLI: `npx vercel --prod`

หลังเชื่อมแล้ว ทุกครั้งที่ push ขึ้น `main` Vercel จะ deploy ให้อัตโนมัติ

## Image credits
รูปในแท็บวอร์มอัพและเทคนิค (โฟลเดอร์ `img/`) มาจาก [Wikimedia Commons](https://commons.wikimedia.org) ใช้ตามใบอนุญาตของแต่ละภาพ (ภาพ CC BY-SA ต้องระบุที่มาและเผยแพร่ต่อภายใต้ใบอนุญาตเดียวกัน) รายการเดียวกันแสดงในแอปที่หัวข้อ "แหล่งที่มารูปภาพ"

- `img/smash-seq.gif` — Smashsequence.gif · Asif Ahamed Jishan · CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Smashsequence.gif)
- `img/serve-double.png` — Badminton Serve Double.png · ไม่ระบุผู้สร้าง · CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:Badminton_Serve_Double.png)
- `img/split-step.gif` — Badminton-Umsprung.gif · David Bettencourt da Cruz · CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Badminton-Umsprung.gif)
- `img/home-t.png` — 2006 09 04-Cruz-162x308-Das T.png · David Bettencourt da Cruz · CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:2006_09_04-Cruz-162x308-Das_T.png)
- `img/footwork-v.gif` — Badminton-Footwork-V-Slow.gif · David Bettencourt da Cruz · CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Badminton-Footwork-V-Slow.gif)
- `img/doubles-defence-anim.gif` — 2006-10-03 Cruz 162x308 Badminton Verteidigung im Doppel.gif · David Bettencourt da Cruz · CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:2006-10-03_Cruz_162x308_Badminton_Verteidigung_im_Doppel.gif)
- `img/cdc-lunge.gif` — Lunge-CDC strength training for older adults.gif · Centers for Disease Control and Prevention (CDC) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Lunge-CDC_strength_training_for_older_adults.gif)
- `img/cdc-hamstring.gif` — Hamstring stretch-CDC strength training for older adults.gif · Centers for Disease Control and Prevention (CDC) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Hamstring_stretch-CDC_strength_training_for_older_adults.gif)
- `img/cdc-quad.gif` — Quad stretch-CDC strength training for older adults.gif · Centers for Disease Control and Prevention (CDC) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Quad_stretch-CDC_strength_training_for_older_adults.gif)
- `img/cdc-chest.gif` — Chest stretch-CDC strength training for older adults.gif · Centers for Disease Control and Prevention (CDC) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Chest_stretch-CDC_strength_training_for_older_adults.gif)
