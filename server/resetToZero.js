import db, { initDatabase } from './db.js';

console.log('========================================================');
console.log('REDEFININDO BANCO DE DADOS PARA AMBIENTE DE PRODUÇÃO LIMPO (DO ZERO)');
console.log('BARBARA MODA INTELIGENTE');
console.log('========================================================\n');

initDatabase();

// 1. Wipe all orders & items
db.exec('DELETE FROM order_items;');
db.exec('DELETE FROM orders;');
console.log('✔ Pedidos e itens zerados.');

// 2. Wipe all products, images, variants & stock logs
db.exec('DELETE FROM stock_movements;');
db.exec('DELETE FROM product_variants;');
db.exec('DELETE FROM product_images;');
db.exec('DELETE FROM wishlists;');
db.exec('DELETE FROM products;');
console.log('✔ Catálogo de produtos, fotos e estoque zerados.');

// 3. Wipe all reviews
db.exec('DELETE FROM reviews;');
console.log('✔ Avaliações zeradas.');

// 4. Wipe all users
db.exec('DELETE FROM addresses;');
db.exec('DELETE FROM users;');
console.log('✔ Contas de usuários zeradas (Pronto para Onboarding do Administrador).');

// 5. Keep initial clean categories structure
const catCount = db.prepare('SELECT count(*) as cnt FROM categories').get().cnt;
console.log(`✔ Categorias prontas no catálogo (${catCount} categorias base).`);

// 6. Reset store settings
db.prepare(`
  UPDATE store_settings SET
    store_name = 'Barbara Moda Inteligente',
    tagline = 'Seu estilo. Sua essência. Sua melhor versão.',
    phone = '(11) 98765-4321',
    whatsapp_number = '5511987654321',
    instagram_handle = '@barbaramodainteligente',
    instagram_url = 'https://instagram.com/barbaramodainteligente',
    address = 'Rua Oscar Freire, 1284 - Cerqueira César, São Paulo - SP',
    business_hours = 'Segunda a Sábado, das 09h às 19h',
    google_rating = 5.0,
    google_reviews_count = 0,
    announcement_bar = 'Bem-vinda à Barbara Moda Inteligente | Frete grátis para compras acima de R$ 299 | 10% OFF no Pix',
    hero_title = 'Seu estilo. Sua essência. Sua melhor versão.',
    hero_subtitle = 'Descubra peças de alfaiataria e moda inteligente pensadas para mulheres contemporâneas que valorizam elegância, sofisticação e conforto.',
    hero_image = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'
  WHERE id = 1
`).run();
console.log('✔ Configurações da loja atualizadas para o padrão de abertura.');

console.log('\n========================================================');
console.log('BANCO DE DADOS ESTÁ 100% ZERADO E PRONTO PARA PRODUÇÃO!');
console.log('O primeiro acesso permitirá criar a conta Master da loja.');
console.log('========================================================\n');
