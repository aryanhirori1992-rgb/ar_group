const express = require('express');
const multer  = require('multer');
const path    = require('path');
const sharp   = require('sharp');
const { Pool } = require('pg');

const app = express();

// 1. گرێدانا داتابێسێ (پشتیوانییا DATABASE_URL دکەت کاتێک ل سەر Vercelـێ هەیە)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
        port: process.env.DB_PORT || 6543,
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres.hvyvqkcnehwgimyezfjv',
        password: process.env.DB_PASSWORD || 'ARYAN77772007@',
        ssl: {
          rejectUnauthorized: false
        }
      }
);

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 3. ڕێکخستنا Multer بۆ گرتنا فایلی د Memory (RAM) دا
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. Route-ا وەرگرتنا پڕۆژەیان (GET) و نیشاندانا index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route-ا وەرگرتنا API یا پڕۆژەکان
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Route-ا زێدەکرنا پڕۆژەی (POST)
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
      
      const processedBuffer = await sharp(req.file.buffer)
        .webp({ quality: 85 })
        .toBuffer();

      // تێبینی: ئەگەر هێشتا وێنە نەهێنە پاشەکەوتکرن ل دەری، لێرە تەنها ناڤی دەینە داتابێسێ
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

// بۆ Vercel
module.exports = app;
