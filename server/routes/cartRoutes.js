import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /api/cart/validate
// Recalculates cart server-side against live stock and prices
router.post('/validate', (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        items: [],
        subtotal: 0,
        isValid: true,
        canCheckout: false,
        warnings: []
      });
    }

    const validatedItems = [];
    const warnings = [];
    let subtotal = 0;
    let canCheckout = true;

    for (const item of items) {
      const variant = db.prepare(`
        SELECT 
          pv.id as variant_id,
          pv.color_name,
          pv.color_hex,
          pv.size,
          pv.sku as variant_sku,
          pv.stock_quantity,
          pv.price_override,
          p.id as product_id,
          p.name as product_name,
          p.slug as product_slug,
          p.base_price,
          p.sale_price,
          p.status as product_status
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ?
      `).get(item.variantId);

      if (!variant || variant.product_status !== 'published') {
        warnings.push(`Um item no seu carrinho não está mais disponível e foi removido.`);
        canCheckout = false;
        continue;
      }

      // Fetch primary or matching color image
      const image = db.prepare(`
        SELECT image_url FROM product_images
        WHERE product_id = ? AND (color_name = ? OR is_primary = 1)
        ORDER BY (color_name = ?) DESC, is_primary DESC
        LIMIT 1
      `).get(variant.product_id, variant.color_name, variant.color_name);

      const unitPrice = variant.price_override || variant.sale_price || variant.base_price;
      const requestedQty = Math.max(1, parseInt(item.quantity) || 1);
      const availableStock = variant.stock_quantity;

      let effectiveQty = requestedQty;
      let itemWarning = null;

      if (availableStock <= 0) {
        canCheckout = false;
        itemWarning = `Esgotado: ${variant.product_name} (${variant.color_name} - Tam ${variant.size}) não possui estoque.`;
        warnings.push(itemWarning);
        effectiveQty = 0;
      } else if (requestedQty > availableStock) {
        canCheckout = false;
        itemWarning = `Estoque insuficiente: Apenas ${availableStock} un. disponíveis de ${variant.product_name} (${variant.color_name} - Tam ${variant.size}).`;
        warnings.push(itemWarning);
        effectiveQty = availableStock;
      }

      const itemTotal = effectiveQty * unitPrice;
      subtotal += itemTotal;

      validatedItems.push({
        variantId: variant.variant_id,
        productId: variant.product_id,
        name: variant.product_name,
        slug: variant.product_slug,
        color: variant.color_name,
        colorHex: variant.color_hex,
        size: variant.size,
        sku: variant.variant_sku,
        unitPrice,
        originalPrice: variant.base_price,
        quantity: requestedQty,
        effectiveQuantity: effectiveQty,
        availableStock,
        totalPrice: itemTotal,
        imageUrl: image?.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop',
        warning: itemWarning,
        inStock: availableStock > 0
      });
    }

    return res.json({
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      isValid: warnings.length === 0,
      canCheckout: canCheckout && validatedItems.length > 0 && subtotal > 0,
      warnings
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    return res.status(500).json({ error: 'Erro ao validar sacola de compras.' });
  }
});

export default router;
