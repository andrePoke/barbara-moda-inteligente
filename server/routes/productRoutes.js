import express from 'express';
import db from '../db.js';
import { optionalAuth, requireAuth } from '../auth.js';

const router = express.Router();

// Helper to attach images and variants to product
function attachProductDetails(product) {
  if (!product) return null;

  const images = db.prepare(`
    SELECT id, image_url, color_name, is_primary, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY is_primary DESC, sort_order ASC
  `).all(product.id);

  const variants = db.prepare(`
    SELECT id, color_name, color_hex, size, sku, price_override, stock_quantity, active
    FROM product_variants
    WHERE product_id = ? AND active = 1
    ORDER BY color_name ASC, 
      CASE size 
        WHEN 'PP' THEN 1 
        WHEN 'P' THEN 2 
        WHEN 'M' THEN 3 
        WHEN 'G' THEN 4 
        WHEN 'GG' THEN 5 
        WHEN '34' THEN 6 
        WHEN '36' THEN 7 
        WHEN '38' THEN 8 
        WHEN '40' THEN 9 
        WHEN '42' THEN 10 
        WHEN '44' THEN 11 
        ELSE 99 
      END ASC
  `).all(product.id);

  // Group unique colors with their respective photo
  const colorMap = new Map();
  for (const v of variants) {
    if (!colorMap.has(v.color_name)) {
      const matchingImg = images.find(img => img.color_name && img.color_name.toLowerCase() === v.color_name.toLowerCase())?.image_url 
        || v.image_url 
        || (images.length > 0 ? images[0].image_url : null);

      colorMap.set(v.color_name, {
        name: v.color_name,
        hex: v.color_hex,
        image_url: matchingImg,
        hasStock: v.stock_quantity > 0
      });
    } else if (v.stock_quantity > 0) {
      colorMap.get(v.color_name).hasStock = true;
    }
  }

  // Unique sizes
  const sizeMap = new Map();
  for (const v of variants) {
    if (!sizeMap.has(v.size)) {
      sizeMap.set(v.size, {
        size: v.size,
        hasStock: v.stock_quantity > 0
      });
    } else if (v.stock_quantity > 0) {
      sizeMap.get(v.size).hasStock = true;
    }
  }

  const totalStock = variants.reduce((acc, v) => acc + v.stock_quantity, 0);

  return {
    ...product,
    primary_image: images.find(img => img.is_primary)?.image_url || images[0]?.image_url || null,
    images,
    variants,
    available_colors: Array.from(colorMap.values()),
    available_sizes: Array.from(sizeMap.values()),
    total_stock: totalStock,
    is_in_stock: totalStock > 0
  };
}

// GET /api/products (Catalog listing with search & filters)
router.get('/', (req, res) => {
  try {
    const {
      categoria,
      busca,
      tamanho,
      cor,
      min_preco,
      max_preco,
      ordenar,
      destaque,
      novidades,
      promocoes,
      limit,
      offset
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published'
    `;
    const params = [];

    if (categoria) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(categoria, categoria);
    }

    if (busca) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)`;
      const searchWild = `%${busca}%`;
      params.push(searchWild, searchWild, searchWild);
    }

    if (min_preco) {
      query += ` AND COALESCE(p.sale_price, p.base_price) >= ?`;
      params.push(parseFloat(min_preco));
    }

    if (max_preco) {
      query += ` AND COALESCE(p.sale_price, p.base_price) <= ?`;
      params.push(parseFloat(max_preco));
    }

    if (destaque === '1') {
      query += ` AND p.is_featured = 1`;
    }

    if (novidades === '1') {
      query += ` AND p.is_new = 1`;
    }

    if (promocoes === '1') {
      query += ` AND p.sale_price IS NOT NULL AND p.sale_price < p.base_price`;
    }

    if (tamanho) {
      query += ` AND EXISTS (
        SELECT 1 FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.size = ? AND pv.stock_quantity > 0
      )`;
      params.push(tamanho);
    }

    if (cor) {
      query += ` AND EXISTS (
        SELECT 1 FROM product_variants pv 
        WHERE pv.product_id = p.id AND LOWER(pv.color_name) = LOWER(?) AND pv.stock_quantity > 0
      )`;
      params.push(cor);
    }

    // Sorting
    switch (ordenar) {
      case 'preco_asc':
        query += ` ORDER BY COALESCE(p.sale_price, p.base_price) ASC`;
        break;
      case 'preco_desc':
        query += ` ORDER BY COALESCE(p.sale_price, p.base_price) DESC`;
        break;
      case 'novidades':
        query += ` ORDER BY p.is_new DESC, p.created_at DESC`;
        break;
      case 'mais_vendidos':
        query += ` ORDER BY p.is_bestseller DESC, p.created_at DESC`;
        break;
      default:
        query += ` ORDER BY p.is_featured DESC, p.created_at DESC`;
        break;
    }

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }

    const rawProducts = db.prepare(query).all(...params);
    const products = rawProducts.map(attachProductDetails);

    return res.json({ products, total: products.length });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Erro ao carregar catálogo de produtos.' });
  }
});

// GET /api/products/categories (All active categories)
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') as product_count
      FROM categories c
      WHERE c.active = 1
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();

    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar categorias.' });
  }
});

// GET /api/products/:slugOrId (Single product details)
router.get('/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;

    let product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE (p.slug = ? OR p.id = ?) AND p.status = 'published'
    `).get(slugOrId, slugOrId);

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const detailed = attachProductDetails(product);

    // Reviews for this product
    const reviews = db.prepare(`
      SELECT id, author_name, rating, comment, verified_purchase, created_at
      FROM reviews
      WHERE product_id = ?
      ORDER BY created_at DESC
    `).all(product.id);

    // Calculate rating stats
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return res.json({
      product: detailed,
      reviews,
      rating_stats: {
        average: avgRating ? parseFloat(avgRating) : 5.0,
        total_reviews: reviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return res.status(500).json({ error: 'Erro ao carregar detalhes do produto.' });
  }
});

// GET /api/products/:id/related (Related items)
router.get('/:id/related', (req, res) => {
  try {
    const product = db.prepare('SELECT category_id FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.json({ related: [] });

    const relatedRaw = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.status = 'published'
      ORDER BY p.is_bestseller DESC, p.created_at DESC
      LIMIT 4
    `).all(product.category_id, req.params.id);

    const related = relatedRaw.map(attachProductDetails);
    return res.json({ related });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar produtos relacionados.' });
  }
});

// Customer Wishlist
router.get('/user/wishlist', requireAuth, (req, res) => {
  try {
    const rawWishlist = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE w.user_id = ? AND p.status = 'published'
      ORDER BY w.created_at DESC
    `).all(req.user.id);

    const wishlist = rawWishlist.map(attachProductDetails);
    return res.json({ wishlist });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar favoritos.' });
  }
});

router.post('/:id/wishlist', requireAuth, (req, res) => {
  try {
    const productId = req.params.id;
    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);

    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
      return res.json({ message: 'Removido dos favoritos.', favorited: false });
    } else {
      db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
      return res.json({ message: 'Adicionado aos favoritos!', favorited: true });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar favoritos.' });
  }
});

export default router;
