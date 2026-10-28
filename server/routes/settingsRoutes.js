import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/settings (Public store configuration)
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    return res.json({ settings });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar configurações da loja.' });
  }
});

// GET /api/settings/instagram (Public instagram feed)
router.get('/instagram', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM instagram_posts WHERE active = 1 ORDER BY sort_order ASC, id DESC LIMIT 8').all();
    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar publicações do Instagram.' });
  }
});

// GET /api/settings/reviews (Authentic reviews)
router.get('/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.slug as product_slug
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        ROUND(AVG(rating), 1) as average_rating
      FROM reviews
    `).get();

    return res.json({
      reviews,
      stats: {
        total: stats.total_count,
        average: stats.average_rating || 5.0
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar avaliações.' });
  }
});

// POST /api/settings/reviews (Customer submits authentic review)
router.post('/reviews', (req, res) => {
  try {
    const { author_name, rating, comment, product_id } = req.body;

    if (!author_name || !rating || !comment) {
      return res.status(400).json({ error: 'Nome, nota e comentário são obrigatórios.' });
    }

    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'A nota deve ser entre 1 e 5 estrelas.' });
    }

    const insert = db.prepare(`
      INSERT INTO reviews (product_id, author_name, rating, comment, verified_purchase)
      VALUES (?, ?, ?, ?, 1)
    `).run(product_id || null, author_name.trim(), numRating, comment.trim());

    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(insert.lastInsertRowid));
    return res.status(201).json({ message: 'Avaliação registrada com sucesso!', review: created });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao enviar avaliação.' });
  }
});

export default router;
