# OptiScale — Test Cases

โฟลเดอร์นี้ใช้เก็บ project ตัวอย่างสำหรับทดสอบ upload flow ของ OptiScale

## โครงสร้างที่แนะนำ

```
test-cases/
├── README.md
├── <project-name-1>/          ← แตก ZIP ออกมาไว้ที่นี่ (optional)
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── <project-name-1>.zip       ← ไฟล์ ZIP ที่จะใช้ upload จริง
├── <project-name-2>/
└── <project-name-2>.zip
```

## วิธีใช้

1. วาง `.zip` ของ project ที่ต้องการทดสอบไว้ในโฟลเดอร์นี้
2. เปิด `app.html` แล้วลาก ZIP ไปวางในช่อง upload หรือกด **SELECT FILE**
3. เลือกไฟล์จากโฟลเดอร์นี้

## Format ที่รองรับ (MVP)

| Stack       | รายละเอียด                      |
|-------------|----------------------------------|
| Python      | 3.10 / 3.11                      |
| Framework   | FastAPI                          |
| Database    | PostgreSQL                       |

## ข้อกำหนดไฟล์ ZIP

- นามสกุลต้องเป็น `.zip` เท่านั้น
- ไม่มีขีดจำกัดขนาดไฟล์ (no maximum file size)
- ควรมี `requirements.txt` หรือ `pyproject.toml` อยู่ใน root หรือ subfolder

---

> โฟลเดอร์นี้ถูก ignore โดย git (ดู `.gitignore`) — ไม่มีไฟล์ใดถูก commit ขึ้น repo
