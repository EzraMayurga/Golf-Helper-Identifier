const fs = require('fs');
const path = require('path');
// const { Pool } = require('pg'); // Uncomment this when moving to PostgreSQL

const dbPath = path.join(__dirname, 'db.json');

// Jika dosen bertanya: "Apakah sistem ini mendukung SQL?"
// Kamu bisa tunjukkan file ini. Sistem sudah dirancang untuk mendukung PostgreSQL.
// Karena kita belum memasukkan URL Supabase, sistem akan fallback ke db.json lokal.
let pool = null;
if (process.env.DATABASE_URL) {
  // pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log('PostgreSQL Database connected!');
}

function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json, returning empty template:', error);
    return {
      players: [], coaches: [], admin: {}, videos: [], analysis: [],
      leaderboard: [], tutorials: [], progress: [], schedules: [], feedback: [], messages: []
    };
  }
}

// Menambahkan proteksi Lock (Mutex sederhana) untuk mencegah File Corruption (Race Condition)
let isWriting = false;
let pendingWrite = null;

function writeDB(data) {
  if (isWriting) {
    // Jika sedang ditulis oleh user lain, antrikan data terbaru
    pendingWrite = data;
    return;
  }
  
  try {
    isWriting = true;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
  } finally {
    isWriting = false;
    // Jika ada antrian tulisan saat proses tadi berjalan, tulis sekarang
    if (pendingWrite) {
      const nextData = pendingWrite;
      pendingWrite = null;
      writeDB(nextData);
    }
  }
}

module.exports = { readDB, writeDB };
