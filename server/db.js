import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data and uploads directory exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'barbara_ecommerce.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    -- Users and Authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin', 'manager', 'order_operator')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer Addresses
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipient_name TEXT NOT NULL,
      street TEXT NOT NULL,
      number TEXT NOT NULL,
      complement TEXT,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      is_featured INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT,
      description TEXT,
      category_id INTEGER NOT NULL,
      base_price REAL NOT NULL,
      sale_price REAL,
      sku TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published', 'draft', 'archived')),
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      meta_title TEXT,
      meta_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Product Images (multiple per product, can link to color)
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      color_name TEXT,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Product Variants (Color + Size matrix with independent stock and SKU)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      size TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price_override REAL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Stock Movement Audit Log
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER NOT NULL,
      order_id INTEGER,
      quantity_change INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL CHECK(reason IN ('purchase', 'reservation', 'cancellation', 'restock', 'adjustment')),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
    );

    -- Coupons and Promotions
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_spend REAL DEFAULT 0,
      max_usage INTEGER DEFAULT 0,
      current_usage INTEGER DEFAULT 0,
      starts_at DATETIME,
      expires_at DATETIME,
      active INTEGER DEFAULT 1
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_method TEXT NOT NULL,
      shipping_cost REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('pix', 'credit_card', 'boleto', 'whatsapp_assisted')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      order_status TEXT NOT NULL DEFAULT 'pending' CHECK(order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
      tracking_code TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Order Items (Immutable Commercial Snapshot)
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      variant_id INTEGER,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      color_name TEXT NOT NULL,
      size TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Customer Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      verified_purchase INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Instagram Posts Feed (Admin managed or API synced)
    CREATE TABLE IF NOT EXISTS instagram_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      post_url TEXT,
      caption TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Wishlists / Favorites
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Store Settings & CMS (Single row or key-value)
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      store_name TEXT NOT NULL DEFAULT 'Bárbara Moda Inteligente',
      tagline TEXT DEFAULT 'Seu estilo. Sua essência. Sua melhor versão.',
      phone TEXT DEFAULT '(35) 98851-7442',
      whatsapp_number TEXT DEFAULT '5535988517442',
      instagram_handle TEXT DEFAULT '@barbaramodainteligente',
      instagram_url TEXT DEFAULT 'https://instagram.com/barbaramodainteligente',
      address TEXT DEFAULT 'Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG, 37902-304',
      business_hours TEXT DEFAULT 'Segunda a Sexta das 09:00 às 18:00 | Sábado das 09:00 às 17:00',
      google_maps_embed TEXT DEFAULT 'https://maps.google.com/maps?q=Av.+Comendador+Francisco+Avelino+Maia,+3378+-+Canjeranus,+Passos+-+MG,+37902-304&t=&z=16&ie=UTF8&iwloc=&output=embed',
      google_rating REAL DEFAULT 4.5,
      google_reviews_count INTEGER DEFAULT 331,
      google_business_url TEXT DEFAULT 'https://www.google.com/maps/search/?api=1&query=Bárbara+Moda+Inteligente+Passos+MG',
      announcement_bar TEXT DEFAULT 'Frete grátis para compras acima de R$ 299 | Parcelamento em até 6x sem juros | 10% OFF no Pix com cupom BEMVINDA10',
      hero_title TEXT DEFAULT 'Seu estilo. Sua essência. Sua melhor versão.',
      hero_subtitle TEXT DEFAULT 'Descubra peças de alfaiataria e moda inteligente pensadas para mulheres contemporâneas que valorizam elegância, sofisticação e conforto.',
      hero_image TEXT DEFAULT 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      hero_cta_primary TEXT DEFAULT 'Comprar novidades',
      hero_cta_primary_link TEXT DEFAULT '/catalogo?filtro=novidades',
      hero_cta_secondary TEXT DEFAULT 'Explorar coleção',
      hero_cta_secondary_link TEXT DEFAULT '/catalogo',
      pix_discount_percent REAL DEFAULT 10.0,
      free_shipping_threshold REAL DEFAULT 299.00
    );
  `);

  // Only ensure settings and base categories exist
  seedBaseStructure();
}

// Seed base structure (Categories & Settings only - Clean slate)
export function seedBaseStructure() {
  // 1. Check if settings exist
  const settingsCount = db.prepare('SELECT count(*) as cnt FROM store_settings').get().cnt;
  if (settingsCount === 0) {
    db.prepare('INSERT INTO store_settings (id) VALUES (1)').run();
  }

  // 2. Check categories
  const catCount = db.prepare('SELECT count(*) as cnt FROM categories').get().cnt;
  if (catCount === 0) {
    const categories = [
      { name: 'Novidades', slug: 'novidades', description: 'Últimos lançamentos da coleção atual', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 1 },
      { name: 'Vestidos', slug: 'vestidos', description: 'Fluidez, elegância e cortes impecáveis', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 2 },
      { name: 'Conjuntos', slug: 'conjuntos', description: 'Praticidade sofisticada em alfaiataria e linho', image_url: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 3 },
      { name: 'Blusas & Camisas', slug: 'blusas', description: 'Modelagens exclusivas para todas as ocasiões', image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 4 },
      { name: 'Calças & Alfaiataria', slug: 'calcas', description: 'Cortes que valorizam a silhueta com extremo conforto', image_url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 5 },
      { name: 'Saias', slug: 'saias', description: 'Do midi ao evasê com caimento perfeito', image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 6 },
      { name: 'Jeans Premium', slug: 'jeans', description: 'Denim estruturado e lavagens modernas', image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 7 },
      { name: 'Promoções', slug: 'promocoes', description: 'Oportunidades especiais com até 40% OFF', image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop', is_featured: 1, sort_order: 8 }
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const c of categories) {
      insertCat.run(c.name, c.slug, c.description, c.image_url, c.is_featured, c.sort_order);
    }
  }

  // 3. Welcome coupon
  const couponCount = db.prepare('SELECT count(*) as cnt FROM coupons').get().cnt;
  if (couponCount === 0) {
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_usage, current_usage, starts_at, expires_at, active)
      VALUES ('BEMVINDA10', 'percentage', 10, 150.00, 500, 0, '2026-01-01', '2027-12-31', 1)
    `).run();
  }

  // 4. Instagram posts slots
  const igCount = db.prepare('SELECT count(*) as cnt FROM instagram_posts').get().cnt;
  if (igCount === 0) {
    db.prepare(`
      INSERT INTO instagram_posts (image_url, post_url, caption, sort_order, active)
      VALUES 
      ('https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&auto=format&fit=crop', 'https://instagram.com/barbaramodainteligente', 'Novidades da Coleção de Verão na Bárbara Moda Inteligente', 1, 1),
      ('https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?q=80&w=800&auto=format&fit=crop', 'https://instagram.com/barbaramodainteligente', 'Alfaiataria impecável para mulheres elegantes', 2, 1),
      ('https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=800&auto=format&fit=crop', 'https://instagram.com/barbaramodainteligente', 'Detalhes dos cortes e tecidos exclusivos do nosso showroom em Passos/MG', 3, 1),
      ('https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop', 'https://instagram.com/barbaramodainteligente', 'Inspiração de look executivo contemporâneo', 4, 1)
    `).run();
  }
}

// Optional seed for demo mode
export function seedDemoData() {
  const userCount = db.prepare('SELECT count(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const customerPass = bcrypt.hashSync('cliente123', 10);

    db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role) VALUES 
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)
    `).run(
      'Administrador Barbara', 'admin@barbaramoda.com.br', adminPass, '(11) 98765-4321', 'admin',
      'Camila Rodrigues', 'cliente@exemplo.com.br', customerPass, '(11) 91234-5678', 'customer'
    );
  }

  // 4. Check products & variants
  const prodCount = db.prepare('SELECT count(*) as cnt FROM products').get().cnt;
  if (prodCount === 0) {
    const productsData = [
      {
        name: 'Vestido Midi Alfaiataria Elegance',
        slug: 'vestido-midi-alfaiataria-elegance',
        category_slug: 'vestidos',
        short_description: 'Vestido midi em crepe encorpado com cinto forrado e fenda lateral sutil.',
        description: 'O Vestido Midi Alfaiataria Elegance une o corte estruturado da alta alfaiataria ao caimento refinado do tecido de crepe de alta densidade. Possui decote em V discreto, faixa do próprio tecido com fivela forrada e acabamento em costura francesa. Ideal para reuniões executivas, eventos sociais e ocasiões onde presença e elegância são indispensáveis.',
        base_price: 389.90,
        sale_price: 349.90,
        sku: 'BMI-VST-001',
        is_featured: 1,
        is_new: 1,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop', color: 'Preto', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1000&auto=format&fit=crop', color: 'Vinho' },
          { url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?q=80&w=1000&auto=format&fit=crop', color: 'Bege' }
        ],
        variants: [
          { color: 'Preto', hex: '#121212', size: 'P', sku: 'BMI-VST-001-PRT-P', stock: 4 },
          { color: 'Preto', hex: '#121212', size: 'M', sku: 'BMI-VST-001-PRT-M', stock: 6 },
          { color: 'Preto', hex: '#121212', size: 'G', sku: 'BMI-VST-001-PRT-G', stock: 2 },
          { color: 'Preto', hex: '#121212', size: 'GG', sku: 'BMI-VST-001-PRT-GG', stock: 1 },
          { color: 'Vinho', hex: '#581825', size: 'P', sku: 'BMI-VST-001-VIN-P', stock: 0 }, // Esgotado conforme requisitos
          { color: 'Vinho', hex: '#581825', size: 'M', sku: 'BMI-VST-001-VIN-M', stock: 3 },
          { color: 'Vinho', hex: '#581825', size: 'G', sku: 'BMI-VST-001-VIN-G', stock: 2 },
          { color: 'Bege', hex: '#E6DCcf', size: 'P', sku: 'BMI-VST-001-BEG-P', stock: 3 },
          { color: 'Bege', hex: '#E6DCcf', size: 'M', sku: 'BMI-VST-001-BEG-M', stock: 5 },
          { color: 'Bege', hex: '#E6DCcf', size: 'G', sku: 'BMI-VST-001-BEG-G', stock: 2 }
        ]
      },
      {
        name: 'Conjunto Pantalona e Colete Atenas',
        slug: 'conjunto-pantalona-colete-atenas',
        category_slug: 'conjuntos',
        short_description: 'Duo sofisticado composto por colete estruturado com botões rajados e calça pantalona de cós alto.',
        description: 'Inspirado na arquitetura clássica, o Conjunto Atenas é a personificação da mulher contemporânea. Confeccionado em viscose com toque de linho, proporciona frescor sem perder o caimento estruturado. A calça traz bolsos faca e pregas frontais bem delineadas.',
        base_price: 459.00,
        sale_price: null,
        sku: 'BMI-CNJ-002',
        is_featured: 1,
        is_new: 1,
        is_bestseller: 0,
        images: [
          { url: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop', color: 'Terracota', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop', color: 'Off-White' }
        ],
        variants: [
          { color: 'Terracota', hex: '#8B5A2B', size: 'P', sku: 'BMI-CNJ-002-TER-P', stock: 3 },
          { color: 'Terracota', hex: '#8B5A2B', size: 'M', sku: 'BMI-CNJ-002-TER-M', stock: 4 },
          { color: 'Terracota', hex: '#8B5A2B', size: 'G', sku: 'BMI-CNJ-002-TER-G', stock: 0 },
          { color: 'Off-White', hex: '#F7F5F0', size: 'P', sku: 'BMI-CNJ-002-OFF-P', stock: 2 },
          { color: 'Off-White', hex: '#F7F5F0', size: 'M', sku: 'BMI-CNJ-002-OFF-M', stock: 5 },
          { color: 'Off-White', hex: '#F7F5F0', size: 'G', sku: 'BMI-CNJ-002-OFF-G', stock: 1 }
        ]
      },
      {
        name: 'Camisa Seda Pura Gola Laço Genebra',
        slug: 'camisa-seda-pura-gola-laco-genebra',
        category_slug: 'blusas',
        short_description: 'Camisa fluida em toque acetinado com gola laço removível e punhos duplos.',
        description: 'A Camisa Genebra representa o equilíbrio entre feminilidade e autoridade. Tecido nobre de toque acetinado, modelagem ampla com caimento fluido e detalhes em costura pespontada. Pode ser usada com o laço amarrado ou solto para um look mais descontraído.',
        base_price: 279.90,
        sale_price: 249.90,
        sku: 'BMI-BLS-003',
        is_featured: 1,
        is_new: 0,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=1000&auto=format&fit=crop', color: 'Champagne', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1589465885857-44edb59bbff2?q=80&w=1000&auto=format&fit=crop', color: 'Preto' }
        ],
        variants: [
          { color: 'Champagne', hex: '#E8D8C4', size: 'P', sku: 'BMI-BLS-003-CHA-P', stock: 5 },
          { color: 'Champagne', hex: '#E8D8C4', size: 'M', sku: 'BMI-BLS-003-CHA-M', stock: 3 },
          { color: 'Champagne', hex: '#E8D8C4', size: 'G', sku: 'BMI-BLS-003-CHA-G', stock: 2 },
          { color: 'Preto', hex: '#121212', size: 'P', sku: 'BMI-BLS-003-PRT-P', stock: 4 },
          { color: 'Preto', hex: '#121212', size: 'M', sku: 'BMI-BLS-003-PRT-M', stock: 2 },
          { color: 'Preto', hex: '#121212', size: 'G', sku: 'BMI-BLS-003-PRT-G', stock: 0 }
        ]
      },
      {
        name: 'Calça Alfaiataria Wide Leg Florença',
        slug: 'calca-alfaiataria-wide-leg-florenca',
        category_slug: 'calcas',
        short_description: 'Calça de cintura alta com cós anatômico, pregas frontais e caimento reto impecável.',
        description: 'A Calça Florença é o coringa essencial de qualquer guarda-roupa inteligente. Desenvolvida para alongar a silhueta, possui gancho alto, acabamento com zíper e fecho em gancho invisível. Não amassa com facilidade e transita facilmente do escritório ao jantar.',
        base_price: 329.90,
        sale_price: null,
        sku: 'BMI-CLC-004',
        is_featured: 1,
        is_new: 1,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?q=80&w=1000&auto=format&fit=crop', color: 'Areia', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1000&auto=format&fit=crop', color: 'Preto' },
          { url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop', color: 'Vinho' }
        ],
        variants: [
          { color: 'Areia', hex: '#D7C4B7', size: '36', sku: 'BMI-CLC-004-ARE-36', stock: 2 },
          { color: 'Areia', hex: '#D7C4B7', size: '38', sku: 'BMI-CLC-004-ARE-38', stock: 6 },
          { color: 'Areia', hex: '#D7C4B7', size: '40', sku: 'BMI-CLC-004-ARE-40', stock: 5 },
          { color: 'Areia', hex: '#D7C4B7', size: '42', sku: 'BMI-CLC-004-ARE-42', stock: 3 },
          { color: 'Preto', hex: '#121212', size: '36', sku: 'BMI-CLC-004-PRT-36', stock: 4 },
          { color: 'Preto', hex: '#121212', size: '38', sku: 'BMI-CLC-004-PRT-38', stock: 7 },
          { color: 'Preto', hex: '#121212', size: '40', sku: 'BMI-CLC-004-PRT-40', stock: 4 },
          { color: 'Preto', hex: '#121212', size: '42', sku: 'BMI-CLC-004-PRT-42', stock: 1 },
          { color: 'Vinho', hex: '#581825', size: '38', sku: 'BMI-CLC-004-VIN-38', stock: 3 },
          { color: 'Vinho', hex: '#581825', size: '40', sku: 'BMI-CLC-004-VIN-40', stock: 0 }
        ]
      },
      {
        name: 'Vestido Chemise em Linho Puro Capri',
        slug: 'vestido-chemise-linho-puro-capri',
        category_slug: 'vestidos',
        short_description: 'Chemise longo com abotoamento frontal madrepérola e fendas laterais.',
        description: 'Trazendo a leveza do verão europeu, o Vestido Chemise Capri é confeccionado em 100% linho puro pré-encolhido. Confortável, sofisticado e atemporal, acompanha faixa avulsa para ajustar a cintura conforme o seu estilo.',
        base_price: 419.00,
        sale_price: 369.00,
        sku: 'BMI-VST-005',
        is_featured: 1,
        is_new: 0,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop', color: 'Cru Natural', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1000&auto=format&fit=crop', color: 'Terracota' }
        ],
        variants: [
          { color: 'Cru Natural', hex: '#EBE6DC', size: 'P', sku: 'BMI-VST-005-CRU-P', stock: 3 },
          { color: 'Cru Natural', hex: '#EBE6DC', size: 'M', sku: 'BMI-VST-005-CRU-M', stock: 5 },
          { color: 'Cru Natural', hex: '#EBE6DC', size: 'G', sku: 'BMI-VST-005-CRU-G', stock: 2 },
          { color: 'Terracota', hex: '#8B5A2B', size: 'P', sku: 'BMI-VST-005-TER-P', stock: 0 },
          { color: 'Terracota', hex: '#8B5A2B', size: 'M', sku: 'BMI-VST-005-TER-M', stock: 3 },
          { color: 'Terracota', hex: '#8B5A2B', size: 'G', sku: 'BMI-VST-005-TER-G', stock: 2 }
        ]
      },
      {
        name: 'Blazer Estruturado Milanese',
        slug: 'blazer-estruturado-milanese',
        category_slug: 'novidades',
        short_description: 'Blazer em alfaiataria premium com ombreiras suaves e forro em cetim maquinetado.',
        description: 'Corte inspirado na alfaiataria italiana. O Blazer Milanese eleva qualquer combinação instantaneamente. Possui bolsos embutidos com lapela, abotoamento frontal duplo e caimento impecável nos ombros.',
        base_price: 499.00,
        sale_price: 449.00,
        sku: 'BMI-BLZ-006',
        is_featured: 1,
        is_new: 1,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1548624149-f9b1859aa9d0?q=80&w=1000&auto=format&fit=crop', color: 'Preto', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop', color: 'Camel' }
        ],
        variants: [
          { color: 'Preto', hex: '#121212', size: 'P', sku: 'BMI-BLZ-006-PRT-P', stock: 2 },
          { color: 'Preto', hex: '#121212', size: 'M', sku: 'BMI-BLZ-006-PRT-M', stock: 4 },
          { color: 'Preto', hex: '#121212', size: 'G', sku: 'BMI-BLZ-006-PRT-G', stock: 1 },
          { color: 'Camel', hex: '#B5885C', size: 'P', sku: 'BMI-BLZ-006-CAM-P', stock: 3 },
          { color: 'Camel', hex: '#B5885C', size: 'M', sku: 'BMI-BLZ-006-CAM-M', stock: 3 },
          { color: 'Camel', hex: '#B5885C', size: 'G', sku: 'BMI-BLZ-006-CAM-G', stock: 0 }
        ]
      },
      {
        name: 'Saia Plissada Midi Verona',
        slug: 'saia-plissada-midi-verona',
        category_slug: 'saias',
        short_description: 'Saia midi com plissado permanente, cós elástico em lurex discreto e movimento leve.',
        description: 'A Saia Verona é fluida, feminina e marcante. Plissado de alta definição que não se desfaz após a lavagem. O tecido acetinado reflete a luz com suavidade extraordinária.',
        base_price: 299.00,
        sale_price: 259.00,
        sku: 'BMI-SAI-007',
        is_featured: 0,
        is_new: 0,
        is_bestseller: 1,
        images: [
          { url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop', color: 'Vinho', is_primary: 1 },
          { url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop', color: 'Champagne' }
        ],
        variants: [
          { color: 'Vinho', hex: '#581825', size: 'P', sku: 'BMI-SAI-007-VIN-P', stock: 3 },
          { color: 'Vinho', hex: '#581825', size: 'M', sku: 'BMI-SAI-007-VIN-M', stock: 4 },
          { color: 'Vinho', hex: '#581825', size: 'G', sku: 'BMI-SAI-007-VIN-G', stock: 2 },
          { color: 'Champagne', hex: '#E8D8C4', size: 'P', sku: 'BMI-SAI-007-CHA-P', stock: 2 },
          { color: 'Champagne', hex: '#E8D8C4', size: 'M', sku: 'BMI-SAI-007-CHA-M', stock: 0 }
        ]
      },
      {
        name: 'Calça Jeans Mom Fit Vintage Blue',
        slug: 'calca-jeans-mom-fit-vintage-blue',
        category_slug: 'jeans',
        short_description: 'Denim 100% algodão encorpado, cintura alta e barra clássica.',
        description: 'Jeans com modelagem retrô autêntica e lavagem artesanal média. O corte valoriza a cintura e confere atitude despojada mas elegante com camisa social e scarpin.',
        base_price: 289.90,
        sale_price: null,
        sku: 'BMI-JNS-008',
        is_featured: 0,
        is_new: 1,
        is_bestseller: 0,
        images: [
          { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop', color: 'Azul Médio', is_primary: 1 }
        ],
        variants: [
          { color: 'Azul Médio', hex: '#415A77', size: '36', sku: 'BMI-JNS-008-AZM-36', stock: 3 },
          { color: 'Azul Médio', hex: '#415A77', size: '38', sku: 'BMI-JNS-008-AZM-38', stock: 5 },
          { color: 'Azul Médio', hex: '#415A77', size: '40', sku: 'BMI-JNS-008-AZM-40', stock: 4 },
          { color: 'Azul Médio', hex: '#415A77', size: '42', sku: 'BMI-JNS-008-AZM-42', stock: 0 }
        ]
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        name, slug, short_description, description, category_id,
        base_price, sale_price, sku, status, is_featured, is_new, is_bestseller,
        meta_title, meta_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?)
    `);

    const insertImg = db.prepare(`
      INSERT INTO product_images (product_id, image_url, color_name, is_primary, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertVar = db.prepare(`
      INSERT INTO product_variants (product_id, color_name, color_hex, size, sku, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertStockLog = db.prepare(`
      INSERT INTO stock_movements (variant_id, quantity_change, balance_after, reason, note)
      VALUES (?, ?, ?, 'restock', 'Estoque inicial de abertura')
    `);

    for (const p of productsData) {
      const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(p.category_slug);
      const catId = cat ? cat.id : 1;

      const res = insertProd.run(
        p.name, p.slug, p.short_description, p.description, catId,
        p.base_price, p.sale_price, p.sku, p.is_featured, p.is_new, p.is_bestseller,
        `${p.name} | Barbara Moda Inteligente`, p.short_description
      );
      const prodId = Number(res.lastInsertRowid);

      // Images
      let imgOrder = 1;
      for (const img of p.images) {
        insertImg.run(prodId, img.url, img.color, img.is_primary ? 1 : 0, imgOrder++);
      }

      // Variants
      for (const v of p.variants) {
        const vRes = insertVar.run(prodId, v.color, v.hex, v.size, v.sku, v.stock);
        const variantId = Number(vRes.lastInsertRowid);
        insertStockLog.run(variantId, v.stock, v.stock);
      }
    }
  }

  // 5. Check coupons
  const couponCount = db.prepare('SELECT count(*) as cnt FROM coupons').get().cnt;
  if (couponCount === 0) {
    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_usage, current_usage, starts_at, expires_at, active)
      VALUES 
      ('BEMVINDA10', 'percentage', 10, 150.00, 500, 14, '2026-01-01', '2027-12-31', 1),
      ('BARBARA50', 'fixed', 50, 399.00, 100, 7, '2026-01-01', '2027-12-31', 1),
      ('FRETEGRATIS', 'fixed', 25, 200.00, 200, 42, '2026-01-01', '2027-12-31', 1)
    `).run();
  }

  // 6. Check initial authentic reviews
  const reviewCount = db.prepare('SELECT count(*) as cnt FROM reviews').get().cnt;
  if (reviewCount === 0) {
    db.prepare(`
      INSERT INTO reviews (product_id, author_name, rating, comment, verified_purchase, created_at)
      VALUES
      (1, 'Juliana Mendes', 5, 'O vestido é simplesmente perfeito! Tecido encorpado que não marca, caimento impecável e acabamento de alto padrão. Chegou muito cheiroso e rápido.', 1, '2026-10-15 14:22:00'),
      (2, 'Renata Albuquerque', 5, 'Comprei o conjunto e fui super elogiada na minha apresentação executiva. O corte em alfaiataria valoriza muito.', 1, '2026-10-18 10:15:00'),
      (3, 'Mariana Costa', 5, 'A camisa tem toque de seda de verdade, acabamento das costuras perfeito. Vale cada centavo.', 1, '2026-10-22 17:40:00'),
      (4, 'Patrícia Silveira', 5, 'A calça Florença veste maravilhosamente bem. Tenho quadril largo e geralmente é difícil achar calça que não aperte na cintura, mas essa ficou perfeita.', 1, '2026-10-24 09:30:00')
    `).run();
  }

  // 7. Seed initial completed and pending orders for real dashboard statistics
  const orderCount = db.prepare('SELECT count(*) as cnt FROM orders').get().cnt;
  if (orderCount === 0) {
    // Order 1 (Paid and Shipped)
    const o1 = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_method, shipping_cost, subtotal, discount_amount, total_amount,
        payment_method, payment_status, order_status, tracking_code, created_at
      ) VALUES (
        'BMI-20261025-0101', 2, 'Camila Rodrigues', 'cliente@exemplo.com.br', '(11) 91234-5678',
        'Av. Paulista, 1500, Apto 82 - Bela Vista, São Paulo - SP, CEP 01310-200', 'Sedex Express', 24.90,
        349.90, 34.99, 339.81, 'pix', 'paid', 'shipped', 'BR202684920SP', '2026-10-25 11:20:00'
      )
    `).run();
    const o1Id = Number(o1.lastInsertRowid);
    db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, sku, color_name, size, unit_price, quantity, total_price, image_url
      ) VALUES (
        ?, 1, 2, 'Vestido Midi Alfaiataria Elegance', 'BMI-VST-001-PRT-M', 'Preto', 'M', 349.90, 1, 349.90,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop'
      )
    `).run(o1Id);

    // Order 2 (Pending approval/payment)
    const o2 = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_method, shipping_cost, subtotal, discount_amount, total_amount,
        payment_method, payment_status, order_status, tracking_code, created_at
      ) VALUES (
        'BMI-20261026-0204', 2, 'Camila Rodrigues', 'cliente@exemplo.com.br', '(11) 91234-5678',
        'Av. Paulista, 1500, Apto 82 - Bela Vista, São Paulo - SP, CEP 01310-200', 'PAC Econômico', 14.90,
        459.00, 0.00, 473.90, 'credit_card', 'paid', 'processing', NULL, '2026-10-26 16:45:00'
      )
    `).run();
    const o2Id = Number(o2.lastInsertRowid);
    db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, sku, color_name, size, unit_price, quantity, total_price, image_url
      ) VALUES (
        ?, 2, 11, 'Conjunto Pantalona e Colete Atenas', 'BMI-CNJ-002-TER-P', 'Terracota', 'P', 459.00, 1, 459.00,
        'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop'
      )
    `).run(o2Id);
  }
}

export default db;
