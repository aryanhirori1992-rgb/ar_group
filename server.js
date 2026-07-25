const express = require('express');
const multer  = require('multer');
const path    = require('path');
const sharp   = require('sharp'); // 💡 لێرە Sharp هاتیە زێدەکرن
const { Pool } = require('pg');

const app = express();

// 1. گرێدانا داتابێسێ ب پارامێتەرێن ژینگەیی (Environment Variables)
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
  port: process.env.DB_PORT || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.hvyvqkcnehwgimyezfjv',
  password: process.env.DB_PASSWORD || 'ARYAN77772007@',
  ssl: {
    rejectUnauthorized: false
  }
});

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 3. ڕێکخستنا Multer بۆ گرتنا فایلی د Memory (RAM) دا
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. Route-ا وەرگرتنا پڕۆژەیان (GET)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. Route-ا زێدەکرنا پڕۆژەی (POST) — بۆ Vercel (تۆمارکرنا بفر و وێنەی لە buffer)
app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
    const category = req.body.category || req.body.cat || '';
    const title = req.body.title || '';
    const description = req.body.description || req.body.desc || '';
    const url = req.body.url || '';
    
    let image_url = null;

    // ئەگەر فایل هاتبێتە هەڵبژاردن، Sharp ل سەر RAM دەیکاتە .webp
    if (req.file) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
      
      // ل سەر Vercel فۆڵدەرا local ناهێتە خواندن، لێ بۆ پاراستنێ دەتوانین ب buffer بهێلین یان Base64
      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 85 })
        .toBuffer();

      // لێرە دەتوانین ناڤی بینین (ئەگەر فایلەکی سێیەم وەک Cloudinary نەبێت، تەنێ ناڤی دەینە داتابێسێ)
      image_url = filename;
    }

    if (!title) {
      return res.status(400).json({ error: 'ناو فەرە' });
    }

    const queryText = `
      INSERT INTO projects (category, title, description, url, image_url) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const values = [category, title, description, url, image_url];

    const result = await pool.query(queryText, values);

    console.log("Image processed and project added successfully!");
    return res.status(200).json({ 
      success: true, 
      project: result.rows[0] 
    });

  } catch (err) {
    console.error('SERVER ERROR:', err.message);
    return res.status(500).json({ error: 'Server internal error', details: err.message });
  }
});

// 6. Route-ا سڕینەوەیێ (DELETE)
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// بۆ Vercel پێدڤییە ئەڤە بهێتە کرن ل شوێنا app.listen
module.exports = app;
