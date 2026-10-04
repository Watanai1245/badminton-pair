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
