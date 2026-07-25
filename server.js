const express = require('express');
const multer  = require('multer');
const path    = require('path');
const sharp   = require('sharp'); // 💡 لێرە Sharp هاتیە زێدەکرن
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. گرێدانا داتابێسێ
// گرێدانا داتابێسێ ب پارامێتەرێن جودا
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com', // یان ئەو هۆستەی د Pooler دا هەیە
  port: process.env.DB_PORT || 6543, // د Pooler دا پۆرت 6543 بکاردهێت ل شوێنا 5432
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.hvyvqkcnehwgimyezfjv', // د Pooler دا ناڤێ user ب ڤی شێوەیێ درێژە
  password: process.env.DB_PASSWORD || 'ARYAN77772007@',
  ssl: {
    rejectUnauthorized: false
  }
});

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 3. ڕێکخستنا Multer بۆ گرتنا فایلی د Memory (RAM) دا تا Sharp بیگۆڕێت
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. Route-ا وەرگرتنا پڕۆژەیان (GET)
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Route-ا زێدەکرنا پڕۆژەی (POST) — ب فۆرماتا ئۆتۆماتیک .webp
app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
    const category = req.body.category || req.body.cat || '';
    const title = req.body.title || '';
    const description = req.body.description || req.body.desc || '';
    const url = req.body.url || '';
    
    let image_url = null;

    // ئەگەر فایل هاتبێتە هەڵبژاردن، Sharp ڕاستەوخۆ دەیکاتە .webp
    if (req.file) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
      const outputPath = path.join(__dirname, 'uploads', filename);

      await sharp(req.file.buffer)
        .webp({ quality: 85 }) // ڕێژەی کوالیتیێ (85٪ کوالیتییا بەرز و قەبارەی بچووک)
        .toFile(outputPath);

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

    console.log("Image converted to WEBP and saved successfully!");
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

// 7. دەستپێکرنا سێرڤەری
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});