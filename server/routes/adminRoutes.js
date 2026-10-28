import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { requireAdmin, requireStaff } from '../auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `barbara-prod-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (JPG, PNG, WEBP) de até 5MB são permitidas.'));
  }
});

// All routes in this file require at least staff privileges, and settings require admin
router.use(requireStaff);

// ==========================================
// 1. DASHBOARD METRICS (Real database data)
// ==========================================
router.get('/dashboard', (req, res) => {
  try {
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE date(created_at) = date('now') AND payment_status = 'paid'
    `).get().total;

    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND payment_status = 'paid'
    `).get().total;

    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE order_status IN ('pending', 'processing') OR payment_status = 'pending'
    `).get().count;

    const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status != 'archived'`).get().count;

    const lowStockVariants = db.prepare(`
      SELECT COUNT(*) as count FROM product_variants
      WHERE stock_quantity > 0 AND stock_quantity <= 2 AND active = 1
    `).get().count;

    const outOfStockVariants = db.prepare(`
      SELECT COUNT(*) as count FROM product_variants
      WHERE stock_quantity = 0 AND active = 1
    `).get().count;

    const avgTicket = db.prepare(`
      SELECT COALESCE(AVG(total_amount), 0) as avg
      FROM orders
      WHERE payment_status = 'paid'
    `).get().avg;

    // Top selling products based on order_items
    const topProducts = db.prepare(`
      SELECT 
        oi.product_name,
        oi.sku,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
      GROUP BY oi.product_id, oi.product_name, oi.sku
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    // Low stock items list for prompt alert
    const lowStockList = db.prepare(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        pv.id as variant_id,
        pv.color_name,
        pv.size,
        pv.sku,
        pv.stock_quantity
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock_quantity <= 2 AND pv.active = 1
      ORDER BY pv.stock_quantity ASC
      LIMIT 10
    `).all();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, total_amount, payment_status, order_status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 7-day sales breakdown
    const dailyChart = db.prepare(`
      SELECT 
        date(created_at) as sale_date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY sale_date ASC
    `).all();

    return res.json({
      metrics: {
        today_sales: todaySales,
        month_sales: monthSales,
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        total_products: totalProducts,
        low_stock_variants: lowStockVariants,
        out_of_stock_variants: outOfStockVariants,
        average_ticket: Math.round(avgTicket * 100) / 100
      },
      top_products: topProducts,
      low_stock_list: lowStockList,
      recent_orders: recentOrders,
      daily_chart: dailyChart
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ error: 'Erro ao calcular métricas do dashboard.' });
  }
});

// ==========================================
// 2. PRODUCTS & VARIANTS MANAGEMENT
// ==========================================
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) as variants_count,
        (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants pv WHERE pv.product_id = p.id) as total_stock,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `).all();

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar produtos para administração.' });
  }
});

// GET single product with full variants and images for editing
router.get('/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC').all(product.id);
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY color_name ASC, size ASC').all(product.id);

    return res.json({ product, images, variants });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar produto.' });
  }
});

// POST Create new product with variants and images
router.post('/products', requireAdmin, (req, res) => {
  const {
    name,
    category_id,
    short_description,
    description,
    base_price,
    sale_price,
    sku,
    status,
    is_featured,
    is_new,
    is_bestseller,
    images = [],
    variants = []
  } = req.body;

  if (!name || !category_id || !base_price || !sku) {
    return res.status(400).json({ error: 'Nome, categoria, preço e SKU são obrigatórios.' });
  }

  // Generate unique slug
  let slug = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (existingSlug) {
    slug += `-${Date.now().toString().slice(-4)}`;
  }

  db.exec('BEGIN IMMEDIATE');

  try {
    const insertProd = db.prepare(`
      INSERT INTO products (
        name, slug, short_description, description, category_id,
        base_price, sale_price, sku, status, is_featured, is_new, is_bestseller,
        meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      slug,
      short_description || null,
      description || null,
      category_id,
      parseFloat(base_price),
      sale_price ? parseFloat(sale_price) : null,
      sku.trim().toUpperCase(),
      status || 'published',
      is_featured ? 1 : 0,
      is_new ? 1 : 0,
      is_bestseller ? 1 : 0,
      `${name} | Barbara Moda Inteligente`,
      short_description || name
    );

    const productId = Number(insertProd.lastInsertRowid);

    // Insert Images
    const insertImg = db.prepare(`
      INSERT INTO product_images (product_id, image_url, color_name, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Collect all images from direct images list AND from color variants
    const allImagesToSave = [...images];
    for (const v of variants) {
      if (v.image_url && !allImagesToSave.some(img => img.image_url === v.image_url)) {
        allImagesToSave.push({
          image_url: v.image_url,
          color_name: v.color_name,
          is_primary: allImagesToSave.length === 0
        });
      }
    }

    let imgOrder = 1;
    let hasPrimary = false;
    for (const img of allImagesToSave) {
      if (img.image_url) {
        const isPrimary = (img.is_primary && !hasPrimary) || (imgOrder === 1 && !hasPrimary) ? 1 : 0;
        if (isPrimary) hasPrimary = true;
        insertImg.run(productId, img.image_url, img.color_name || null, isPrimary, imgOrder++);
      }
    }

    // Insert Variants
    const insertVar = db.prepare(`
      INSERT INTO product_variants (product_id, color_name, color_hex, size, sku, price_override, stock_quantity, image_url, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStockLog = db.prepare(`
      INSERT INTO stock_movements (variant_id, quantity_change, balance_after, reason, note)
      VALUES (?, ?, ?, 'restock', 'Estoque inicial de cadastro do produto')
    `);

    for (const v of variants) {
      if (v.color_name && v.size) {
        const vSku = v.sku || `${sku}-${v.color_name.slice(0,3).toUpperCase()}-${v.size}`;
        const stock = parseInt(v.stock_quantity) || 0;
        const resVar = insertVar.run(
          productId,
          v.color_name.trim(),
          v.color_hex || '#121212',
          v.size.trim().toUpperCase(),
          vSku,
          v.price_override ? parseFloat(v.price_override) : null,
          stock,
          v.image_url || null,
          v.active !== false ? 1 : 0
        );

        const variantId = Number(resVar.lastInsertRowid);
        insertStockLog.run(variantId, stock, stock);
      }
    }

    db.exec('COMMIT');

    return res.status(201).json({
      message: 'Produto cadastrado com sucesso!',
      product_id: productId,
      slug
    });
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Product create error:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar produto. Verifique se o SKU já existe.' });
  }
});

// PUT Update product
router.put('/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    name,
    category_id,
    short_description,
    description,
    base_price,
    sale_price,
    sku,
    status,
    is_featured,
    is_new,
    is_bestseller
  } = req.body;

  try {
    db.prepare(`
      UPDATE products SET
        name = ?,
        category_id = ?,
        short_description = ?,
        description = ?,
        base_price = ?,
        sale_price = ?,
        sku = ?,
        status = ?,
        is_featured = ?,
        is_new = ?,
        is_bestseller = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      category_id,
      short_description || null,
      description || null,
      parseFloat(base_price),
      sale_price ? parseFloat(sale_price) : null,
      sku.trim().toUpperCase(),
      status,
      is_featured ? 1 : 0,
      is_new ? 1 : 0,
      is_bestseller ? 1 : 0,
      id
    );

    return res.json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// Update or create variant
router.post('/products/:id/variants', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { color_name, color_hex, size, sku, price_override, stock_quantity } = req.body;

  if (!color_name || !size) {
    return res.status(400).json({ error: 'Cor e tamanho são obrigatórios.' });
  }

  try {
    const parent = db.prepare('SELECT sku FROM products WHERE id = ?').get(id);
    const vSku = sku || `${parent.sku}-${color_name.slice(0,3).toUpperCase()}-${size.toUpperCase()}`;
    const stock = parseInt(stock_quantity) || 0;

    const result = db.prepare(`
      INSERT INTO product_variants (product_id, color_name, color_hex, size, sku, price_override, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      color_name.trim(),
      color_hex || '#121212',
      size.trim().toUpperCase(),
      vSku,
      price_override ? parseFloat(price_override) : null,
      stock
    );

    const variantId = Number(result.lastInsertRowid);
    db.prepare(`
      INSERT INTO stock_movements (variant_id, quantity_change, balance_after, reason, note)
      VALUES (?, ?, ?, 'restock', 'Inclusão de nova variante')
    `).run(variantId, stock, stock);

    return res.status(201).json({ message: 'Variante adicionada com sucesso!', variant_id: variantId });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao adicionar variante. SKU pode estar duplicado.' });
  }
});

// Update single variant (stock adjustment)
router.put('/variants/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { stock_quantity, price_override, active, reason = 'Ajuste manual administrativo' } = req.body;

  try {
    const current = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Variante não encontrada.' });

    const newStock = parseInt(stock_quantity);
    const diff = newStock - current.stock_quantity;

    db.prepare(`
      UPDATE product_variants
      SET stock_quantity = ?,
          price_override = ?,
          active = ?
      WHERE id = ?
    `).run(
      newStock,
      price_override ? parseFloat(price_override) : null,
      active !== false ? 1 : 0,
      id
    );

    if (diff !== 0) {
      db.prepare(`
        INSERT INTO stock_movements (variant_id, quantity_change, balance_after, reason, note)
        VALUES (?, ?, ?, 'adjustment', ?)
      `).run(id, diff, newStock, reason);
    }

    return res.json({ message: 'Estoque da variante atualizado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar variante.' });
  }
});

// Delete variant
router.delete('/variants/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM product_variants WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Variante removida com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir variante.' });
  }
});

// Add image to product
router.post('/products/:id/images', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { image_url, color_name, is_primary } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'URL da imagem é obrigatória.' });
  }

  try {
    if (is_primary) {
      db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(id);
    }

    db.prepare(`
      INSERT INTO product_images (product_id, image_url, color_name, is_primary)
      VALUES (?, ?, ?, ?)
    `).run(id, image_url, color_name || null, is_primary ? 1 : 0);

    return res.status(201).json({ message: 'Foto adicionada à galeria!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao adicionar imagem.' });
  }
});

// Delete image
router.delete('/images/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Imagem removida com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover imagem.' });
  }
});

// Upload image file
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl, filename: req.file.filename });
});

// ==========================================
// 3. ORDER MANAGEMENT
// ==========================================
router.get('/orders', (req, res) => {
  try {
    const { status, payment_status, search } = req.query;

    let query = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.order_status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (search) {
      query += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);
    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
});

// Single order details
router.get('/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    return res.json({
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address || '{}'),
        items
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar detalhes do pedido.' });
  }
});

// Update order status & payment status
router.put('/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { order_status, payment_status, tracking_code, notes } = req.body;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    // If order is being cancelled, return stock to variants
    if (order_status === 'cancelled' && order.order_status !== 'cancelled') {
      const items = db.prepare('SELECT variant_id, quantity FROM order_items WHERE order_id = ?').all(id);
      for (const it of items) {
        if (it.variant_id) {
          db.prepare('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?').run(it.quantity, it.variant_id);
          const after = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(it.variant_id);
          db.prepare(`
            INSERT INTO stock_movements (variant_id, order_id, quantity_change, balance_after, reason, note)
            VALUES (?, ?, ?, ?, 'cancellation', 'Estorno de estoque por cancelamento do pedido')
          `).run(it.variant_id, id, it.quantity, after?.stock_quantity || 0);
        }
      }
    }

    db.prepare(`
      UPDATE orders SET
        order_status = COALESCE(?, order_status),
        payment_status = COALESCE(?, payment_status),
        tracking_code = COALESCE(?, tracking_code),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order_status || null, payment_status || null, tracking_code || null, notes || null, id);

    return res.json({ message: 'Status do pedido atualizado com sucesso.' });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar pedido.' });
  }
});

// ==========================================
// 4. CUSTOMERS LIST (LGPD Protected)
// ==========================================
router.get('/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    return res.json({ customers });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

// ==========================================
// 5. COUPONS MANAGEMENT
// ==========================================
router.get('/coupons', (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC, id DESC').all();
    return res.json({ coupons });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar cupons.' });
  }
});

router.post('/coupons', requireAdmin, (req, res) => {
  const { code, discount_type, discount_value, min_spend, max_usage, starts_at, expires_at } = req.body;

  if (!code || !discount_type || !discount_value) {
    return res.status(400).json({ error: 'Código, tipo e valor de desconto são obrigatórios.' });
  }

  try {
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_usage, starts_at, expires_at, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      code.trim().toUpperCase(),
      discount_type,
      parseFloat(discount_value),
      min_spend ? parseFloat(min_spend) : 0,
      max_usage ? parseInt(max_usage) : 0,
      starts_at || null,
      expires_at || null
    );

    return res.status(201).json({ message: 'Cupom criado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar cupom. Código já pode existir.' });
  }
});

router.put('/coupons/:id/toggle', requireAdmin, (req, res) => {
  try {
    const c = db.prepare('SELECT active FROM coupons WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Cupom não encontrado.' });

    const newActive = c.active === 1 ? 0 : 1;
    db.prepare('UPDATE coupons SET active = ? WHERE id = ?').run(newActive, req.params.id);

    return res.json({ message: `Cupom ${newActive ? 'ativado' : 'desativado'} com sucesso.`, active: newActive });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao alterar status do cupom.' });
  }
});

router.delete('/coupons/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Cupom removido com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover cupom.' });
  }
});

// ==========================================
// 6. STORE SETTINGS & HOMEPAGE CMS
// ==========================================

// CATEGORIES MANAGEMENT (Photos, names, featured flag)
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'published') as product_count
      FROM categories c
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();
    return res.json({ categories });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

router.put('/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, image_url, description, is_featured, sort_order } = req.body;

  try {
    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        image_url = COALESCE(?, image_url),
        description = COALESCE(?, description),
        is_featured = COALESCE(?, is_featured),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `).run(name, image_url, description, is_featured, sort_order, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return res.json({ message: 'Categoria atualizada com sucesso!', category: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
});

// INSTAGRAM POSTS MANAGEMENT
router.get('/instagram', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM instagram_posts ORDER BY sort_order ASC, id DESC').all();
    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar posts do Instagram.' });
  }
});

router.post('/instagram', requireAdmin, (req, res) => {
  const { image_url, post_url, caption, sort_order } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: 'URL da imagem é obrigatória.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO instagram_posts (image_url, post_url, caption, sort_order, active)
      VALUES (?, ?, ?, ?, 1)
    `).run(image_url, post_url || 'https://instagram.com/barbaramodainteligente', caption || null, sort_order || 0);

    const created = db.prepare('SELECT * FROM instagram_posts WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json({ message: 'Foto do Instagram adicionada!', post: created });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao adicionar post do Instagram.' });
  }
});

router.put('/instagram/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { image_url, post_url, caption, sort_order, active } = req.body;

  try {
    db.prepare(`
      UPDATE instagram_posts SET
        image_url = COALESCE(?, image_url),
        post_url = COALESCE(?, post_url),
        caption = COALESCE(?, caption),
        sort_order = COALESCE(?, sort_order),
        active = COALESCE(?, active)
      WHERE id = ?
    `).run(image_url, post_url, caption, sort_order, active, id);

    const updated = db.prepare('SELECT * FROM instagram_posts WHERE id = ?').get(id);
    return res.json({ message: 'Post atualizado!', post: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar post do Instagram.' });
  }
});

router.delete('/instagram/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM instagram_posts WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Post removido com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover post.' });
  }
});

router.put('/settings', requireAdmin, (req, res) => {
  const {
    store_name,
    tagline,
    phone,
    whatsapp_number,
    instagram_handle,
    instagram_url,
    address,
    business_hours,
    google_maps_embed,
    google_rating,
    google_reviews_count,
    google_business_url,
    announcement_bar,
    hero_title,
    hero_subtitle,
    hero_image,
    hero_cta_primary,
    hero_cta_primary_link,
    hero_cta_secondary,
    hero_cta_secondary_link,
    pix_discount_percent,
    free_shipping_threshold
  } = req.body;

  try {
    db.prepare(`
      UPDATE store_settings SET
        store_name = COALESCE(?, store_name),
        tagline = COALESCE(?, tagline),
        phone = COALESCE(?, phone),
        whatsapp_number = COALESCE(?, whatsapp_number),
        instagram_handle = COALESCE(?, instagram_handle),
        instagram_url = COALESCE(?, instagram_url),
        address = COALESCE(?, address),
        business_hours = COALESCE(?, business_hours),
        google_maps_embed = COALESCE(?, google_maps_embed),
        google_rating = COALESCE(?, google_rating),
        google_reviews_count = COALESCE(?, google_reviews_count),
        google_business_url = COALESCE(?, google_business_url),
        announcement_bar = COALESCE(?, announcement_bar),
        hero_title = COALESCE(?, hero_title),
        hero_subtitle = COALESCE(?, hero_subtitle),
        hero_image = COALESCE(?, hero_image),
        hero_cta_primary = COALESCE(?, hero_cta_primary),
        hero_cta_primary_link = COALESCE(?, hero_cta_primary_link),
        hero_cta_secondary = COALESCE(?, hero_cta_secondary),
        hero_cta_secondary_link = COALESCE(?, hero_cta_secondary_link),
        pix_discount_percent = COALESCE(?, pix_discount_percent),
        free_shipping_threshold = COALESCE(?, free_shipping_threshold)
      WHERE id = 1
    `).run(
      store_name, tagline, phone, whatsapp_number, instagram_handle, instagram_url,
      address, business_hours, google_maps_embed, google_rating, google_reviews_count,
      google_business_url, announcement_bar, hero_title, hero_subtitle, hero_image,
      hero_cta_primary, hero_cta_primary_link, hero_cta_secondary, hero_cta_secondary_link,
      pix_discount_percent, free_shipping_threshold
    );

    const updated = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
    return res.json({ message: 'Configurações atualizadas com sucesso!', settings: updated });
  } catch (error) {
    console.error('Settings update error:', error);
    return res.status(500).json({ error: 'Erro ao atualizar configurações da loja.' });
  }
});

export default router;
