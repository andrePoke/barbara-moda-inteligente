import db from './db.js';

console.log('Atualizando informações oficiais com dados reais do Google Meu Negócio e CNPJ...');

db.prepare(`
  UPDATE store_settings SET
    store_name = 'Bárbara Moda Inteligente',
    phone = '(35) 98851-7442',
    whatsapp_number = '5535988517442',
    address = 'Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG, 37902-304',
    business_hours = 'Segunda a Sexta das 09:00 às 18:00 | Sábado das 09:00 às 17:00',
    google_rating = 4.5,
    google_reviews_count = 331,
    google_maps_embed = 'https://maps.google.com/maps?q=Av.+Comendador+Francisco+Avelino+Maia,+3378+-+Canjeranus,+Passos+-+MG,+37902-304&t=&z=16&ie=UTF8&iwloc=&output=embed',
    google_business_url = 'https://www.google.com/maps/search/?api=1&query=Bárbara+Moda+Inteligente+Passos+MG'
  WHERE id = 1
`).run();

console.log('✔ Dados atualizados no banco de dados com sucesso!');
const updated = db.prepare('SELECT * FROM store_settings WHERE id = 1').get();
console.log(updated);
