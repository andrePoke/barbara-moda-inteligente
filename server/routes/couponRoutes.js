import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código de cupom inválido.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = db.prepare(`
      SELECT * FROM coupons
      WHERE UPPER(code) = ? AND active = 1
    `).get(cleanCode);

    if (!coupon) {
      return res.status(404).json({ error: 'Cupom não encontrado ou expirado.' });
    }

    // Check dates
    const now = new Date().toISOString();
    if (coupon.starts_at && coupon.starts_at > now) {
      return res.status(400).json({ error: 'Este cupom ainda não é válido.' });
    }
    if (coupon.expires_at && coupon.expires_at < now) {
      return res.status(400).json({ error: 'Este cupom expirou.' });
    }

    // Check usage limit
    if (coupon.max_usage > 0 && coupon.current_usage >= coupon.max_usage) {
      return res.status(400).json({ error: 'O limite de utilizações deste cupom foi atingido.' });
    }

    // Check min spend
    const currentSubtotal = parseFloat(subtotal) || 0;
    if (coupon.min_spend > 0 && currentSubtotal < coupon.min_spend) {
      return res.status(400).json({
        error: `O valor mínimo de compra para este cupom é de R$ ${coupon.min_spend.toFixed(2).replace('.', ',')}.`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (currentSubtotal * coupon.discount_value) / 100;
    } else {
      discount = Math.min(coupon.discount_value, currentSubtotal);
    }

    discount = Math.round(discount * 100) / 100;

    return res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discount,
      message: `Cupom ${coupon.code} aplicado com sucesso!`
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ error: 'Erro ao validar cupom.' });
  }
});

export default router;
