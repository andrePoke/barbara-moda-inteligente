import express from 'express';
import db from '../db.js';

const router = express.Router();

// Origin store CEP (Passos - MG)
const ORIGIN_CEP = '37902-304';

// POST /api/shipping/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { cep, subtotal = 0 } = req.body;

    if (!cep) {
      return res.status(400).json({ error: 'Informe um CEP válido.' });
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'O CEP deve conter 8 dígitos.' });
    }

    // 1. Query ViaCEP API for location
    let addressData = null;
    try {
      const viacepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viacepRes.ok) {
        const json = await viacepRes.json();
        if (!json.erro) {
          addressData = {
            street: json.logradouro || '',
            neighborhood: json.bairro || '',
            city: json.localidade || '',
            state: json.uf || '',
            cep: json.cep || cleanCep
          };
        }
      }
    } catch (e) {
      console.warn('ViaCEP lookup warning:', e.message);
    }

    // 2. Load free shipping threshold from settings
    const settings = db.prepare('SELECT free_shipping_threshold, address FROM store_settings WHERE id = 1').get();
    const threshold = settings?.free_shipping_threshold || 299.00;
    const numSubtotal = parseFloat(subtotal) || 0;
    const isFree = numSubtotal >= threshold;

    const uf = addressData?.state || 'MG';

    // 3. Dynamic pricing based on regional proximity to Passos/MG
    let pacCost = 16.90;
    let pacDays = '4 a 6 dias úteis';
    let sedexCost = 25.90;
    let sedexDays = '1 a 3 dias úteis';

    if (uf === 'MG') {
      // Local Minas Gerais (origin state)
      pacCost = 12.90;
      pacDays = '2 a 4 dias úteis';
      sedexCost = 19.90;
      sedexDays = '1 a 2 dias úteis';
    } else if (['SP', 'RJ', 'ES'].includes(uf)) {
      // Região Sudeste
      pacCost = 15.90;
      pacDays = '3 a 5 dias úteis';
      sedexCost = 24.90;
      sedexDays = '1 a 3 dias úteis';
    } else if (['PR', 'SC', 'RS', 'DF', 'GO', 'MS', 'MT'].includes(uf)) {
      // Sul e Centro-Oeste
      pacCost = 21.90;
      pacDays = '5 a 8 dias úteis';
      sedexCost = 34.90;
      sedexDays = '2 a 4 dias úteis';
    } else {
      // Norte e Nordeste
      pacCost = 28.90;
      pacDays = '7 a 12 dias úteis';
      sedexCost = 48.90;
      sedexDays = '3 a 6 dias úteis';
    }

    const options = [
      {
        id: 'pac',
        name: 'PAC Econômico (Correios)',
        cost: isFree ? 0 : pacCost,
        originalCost: pacCost,
        isFree,
        deadline: pacDays,
        description: isFree ? 'Frete Grátis com cupom ou compra acima de R$ 299' : 'Entrega econômica rastreada'
      },
      {
        id: 'sedex',
        name: 'Sedex Expresso (Correios)',
        cost: sedexCost,
        originalCost: sedexCost,
        isFree: false,
        deadline: sedexDays,
        description: 'Entrega rápida prioritária'
      },
      {
        id: 'showroom',
        name: 'Retirada no Showroom (Passos - MG)',
        cost: 0,
        originalCost: 0,
        isFree: true,
        deadline: 'Disponível em até 2 horas',
        description: 'Retire diretamente na Av. Comendador Francisco Avelino Maia, 3378'
      }
    ];

    return res.json({
      success: true,
      cep: cleanCep,
      address: addressData,
      isFreeShipping: isFree,
      freeShippingThreshold: threshold,
      options
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return res.status(500).json({ error: 'Erro ao calcular frete.' });
  }
});

export default router;
