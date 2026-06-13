# Golf Analysis Application

Aplikasi analisis swing golf terintegrasi dengan AI, Frontend berbasis React + Vite, Backend Node.js, dan Python Engine untuk Computer Vision (YOLOv8 Pose).

## Fitur Utama
- AI Swing Analysis: Menganalisa video swing golf.
- Leaderboard & Statistics: Sistem ranking dan statistik performa pemain.
- AI Coach Assistant: Asisten virtual berbasis Gemini untuk menjawab pertanyaan seputar golf.

## Struktur Project
- `src/` : Frontend React (Vite).
- `server/` : Backend Node.js (menyediakan API dan sinkronisasi data via WebSocket, menyimpan data di `db.json`).
- `python_backend/` : Script Python untuk memproses video dengan machine learning (YOLOv8).

---

## 🚀 Cara Menjalankan Secara Lokal (Local Development)

### Persyaratan
- Node.js (v18+)
- Python 3.10+ (untuk backend Python)

### 1. Setup Backend Python (AI Analysis)
Masuk ke folder `python_backend` (atau jalankan di terminal terpisah dari root jika virtual environment sudah di setup di `.venv` root):
```bash
python -m venv .venv
# Aktifkan virtual environment (Windows)
.venv\Scripts\activate
# Install requirements
pip install -r python_backend/requirements.txt
```

### 2. Setup Node.js (Frontend & Node Backend)
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` menjadi `.env` di root project.
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```
Untuk backend Node, masuk ke folder `server` dan buat file `.env`:
```env
PORT=5000
JWT_SECRET=super-secret-swing-key-9988
GEMINI_API_KEY=your_gemini_key_here
```

### 4. Menjalankan Aplikasi
Kami telah menyediakan script praktis untuk menjalankan frontend (Vite) dan backend (Node) secara bersamaan:

```bash
npm run dev:full
```

Aplikasi web dapat diakses di `http://localhost:8080` (tergantung port Vite) dan Backend di `http://localhost:5000`.

---

### 2. Deploy Frontend ke Vercel
1. Pastikan project di-push ke GitHub.
2. Login ke Vercel dan buat Project baru, arahkan ke repo GitHub ini.
3. Pada saat setup project di Vercel:
   - **Framework Preset**: Vite
   - **Environment Variables**: Tambahkan `VITE_API_URL` dan `VITE_WS_URL` yang mengarah ke URL public Backend yang telah di-deploy (misal: `https://my-golf-backend.onrender.com`).
4. Klik **Deploy**.

## Catatan Tambahan (File Model)
- Jika ukuran model machine learning (seperti file `.pkl` atau `.pt`) cukup besar (>5MB), file tersebut mungkin menyebabkan timeout atau melebihi limit memori jika dideploy di Edge Functions atau platform Serverless. Selalu deploy di instance Server (VPS / Docker container).
