import express from 'express';
import db from '../db.js';
import { optionalAuth, requireAuth } from '../auth.js';

const router = express.Router();

// Helper to generate unique order number
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BMI-${dateStr}-${randomSuffix}`;
}

// POST /api/orders (Atomic Checkout)
router.post('/', optionalAuth, (req, res) => {
  const {
    customer,
    shipping,
    items,
    couponCode,
    paymentMethod,
    notes
  } = req.body;

  // 1. Basic payload validations
  if (!customer || !customer.name || !customer.email || !customer.phone) {
    return res.status(400).json({ error: 'Dados do cliente incompletos (nome, e-mail e telefone são obrigatórios).' });
  }

  if (!shipping || !shipping.address || !shipping.method) {
    return res.status(400).json({ error: 'Endereço e modalidade de entrega são obrigatórios.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sua sacola está vazia.' });
  }

  const validPaymentMethods = ['pix', 'credit_card', 'boleto', 'whatsapp_assisted'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Forma de pagamento inválida.' });
  }

  // 2. Start ACID Database Transaction
  db.exec('BEGIN IMMEDIATE');

  try {
    let subtotal = 0;
    const validatedOrderItems = [];

    // Check each variant in database with lock
    for (const item of items) {
      const variant = db.prepare(`
        SELECT 
          pv.id as variant_id,
          pv.color_name,
          pv.size,
          pv.sku as variant_sku,
          pv.stock_quantity,
          pv.price_override,
          p.id as product_id,
          p.name as product_name,
          p.base_price,
          p.sale_price,
          p.status as product_status
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.id = ?
      `).get(item.variantId);

      if (!variant || variant.product_status !== 'published') {
        db.exec('ROLLBACK');
        return res.status(400).json({
          error: `O produto selecionado não está mais disponível no catálogo.`
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (variant.stock_quantity < qty) {
        db.exec('ROLLBACK');
        return res.status(400).json({
          error: `Estoque insuficiente: ${variant.product_name} (${variant.color_name} / Tam ${variant.size}) possui apenas ${variant.stock_quantity} unidade(s) disponível(is). Ajuste sua sacola para prosseguir.`
        });
      }

      const unitPrice = variant.price_override || variant.sale_price || variant.base_price;
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      // Find best image
      const img = db.prepare(`
        SELECT image_url FROM product_images
        WHERE product_id = ? AND (color_name = ? OR is_primary = 1)
        ORDER BY (color_name = ?) DESC, is_primary DESC
        LIMIT 1
      `).get(variant.product_id, variant.color_name, variant.color_name);

      validatedOrderItems.push({
        productId: variant.product_id,
        variantId: variant.variant_id,
        productName: variant.product_name,
        sku: variant.variant_sku,
        colorName: variant.color_name,
        size: variant.size,
        unitPrice,
        quantity: qty,
        totalPrice: itemTotal,
        imageUrl: img?.image_url || null,
        currentStock: variant.stock_quantity
      });
    }

    // 3. Coupon validation under transaction
    let discountAmount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = db.prepare(`
        SELECT * FROM coupons
        WHERE UPPER(code) = ? AND active = 1
      `).get(couponCode.trim().toUpperCase());

      if (coupon) {
        const now = new Date().toISOString();
        const isValidDate = (!coupon.starts_at || coupon.starts_at <= now) && (!coupon.expires_at || coupon.expires_at >= now);
        const isValidUsage = (coupon.max_usage === 0 || coupon.current_usage < coupon.max_usage);
        const isValidMinSpend = (coupon.min_spend === 0 || subtotal >= coupon.min_spend);

        if (isValidDate && isValidUsage && isValidMinSpend) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
          } else {
            discountAmount = Math.min(coupon.discount_value, subtotal);
          }
          appliedCoupon = coupon;

          // Increment coupon usage
          db.prepare('UPDATE coupons SET current_usage = current_usage + 1 WHERE id = ?').run(coupon.id);
        }
      }
    }

    // 4. Calculate Shipping Cost
    const settings = db.prepare('SELECT free_shipping_threshold, whatsapp_number FROM store_settings WHERE id = 1').get();
    const freeShippingThreshold = settings?.free_shipping_threshold || 299.00;

    let shippingCost = parseFloat(shipping.cost) || 0;
    if (shipping.method === 'retirada') {
      shippingCost = 0;
    } else if (subtotal >= freeShippingThreshold) {
      shippingCost = 0;
    }

    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount + shippingCost) * 100) / 100);
    const orderNumber = generateOrderNumber();
    const userId = req.user ? req.user.id : null;

    // 5. Insert Order
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_method, shipping_cost, subtotal, discount_amount, total_amount,
        payment_method, payment_status, order_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
    `).run(
      orderNumber,
      userId,
      customer.name.trim(),
      customer.email.trim().toLowerCase(),
      customer.phone.trim(),
      JSON.stringify(shipping.address),
      shipping.method,
      shippingCost,
      subtotal,
      discountAmount,
      totalAmount,
      paymentMethod,
      notes || null
    );

    const orderId = Number(insertOrder.lastInsertRowid);

    // 6. Deduct Stock & Insert Order Items & Audit Log
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, sku,
        color_name, size, unit_price, quantity, total_price, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE product_variants
      SET stock_quantity = stock_quantity - ?
      WHERE id = ?
    `);

    const insertStockLog = db.prepare(`
      INSERT INTO stock_movements (
        variant_id, order_id, quantity_change, balance_after, reason, note
      ) VALUES (?, ?, ?, ?, 'purchase', ?)
    `);

    for (const item of validatedOrderItems) {
      // Snapshot item in order
      insertItem.run(
        orderId, item.productId, item.variantId, item.productName, item.sku,
        item.colorName, item.size, item.unitPrice, item.quantity, item.totalPrice, item.imageUrl
      );

      // Decrement stock
      updateStock.run(item.quantity, item.variantId);

      // Audit movement
      const newBalance = item.currentStock - item.quantity;
      insertStockLog.run(
        item.variantId,
        orderId,
        -item.quantity,
        newBalance,
        `Venda efetuada Pedido #${orderNumber}`
      );
    }

    // Commit Transaction
    db.exec('COMMIT');

    // 7. Prepare response based on payment method
    let paymentDetails = null;

    if (paymentMethod === 'pix') {
      // Generate Pix payload representation
      paymentDetails = {
        type: 'pix',
        pixKey: 'financeiro@barbaramoda.com.br',
        pixCode: `00020126580014BR.GOV.BCB.PIX0136financeiro@barbaramoda.com.br520400005303986540${totalAmount.toFixed(2)}5802BR5924BARBARA MODA INTELIGENTE6009SAO PAULO62070503***6304${Math.floor(1000 + Math.random() * 9000)}`,
        expiresInMinutes: 30
      };
    } else if (paymentMethod === 'whatsapp_assisted') {
      const waNumber = settings?.whatsapp_number || '5511987654321';
      const itemSummary = validatedOrderItems.map(i => `• ${i.productName} (${i.colorName} / ${i.size}) x${i.quantity} - R$ ${i.totalPrice.toFixed(2).replace('.', ',')}`).join('%0A');
      const waText = `Olá, Barbara Moda Inteligente!%0A%0AGostaria de dar andamento ao meu pedido *%23${orderNumber}*:%0A${itemSummary}%0A%0A*Total:* R$ ${totalAmount.toFixed(2).replace('.', ',')}%0A*Cliente:* ${encodeURIComponent(customer.name)}%0A*Telefone:* ${encodeURIComponent(customer.phone)}`;
      const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

      paymentDetails = {
        type: 'whatsapp_assisted',
        whatsappUrl: waUrl,
        instructions: 'Seu pedido foi registrado em nosso sistema. Para concluir o atendimento assistido com a nossa equipe, clique no botão e envie a mensagem pré-formatada no WhatsApp.'
      };
    } else if (paymentMethod === 'credit_card') {
      paymentDetails = {
        type: 'credit_card',
        message: 'A transação com cartão foi encaminhada para a adquirente segura.'
      };
    } else if (paymentMethod === 'boleto') {
      paymentDetails = {
        type: 'boleto',
        barcode: '34191.79001 01043.510047 91020.150008 8 987600000' + Math.floor(10000 + Math.random() * 90000),
        message: 'Boleto bancário gerado com vencimento em 3 dias úteis.'
      };
    }

    return res.status(201).json({
      message: 'Pedido realizado com sucesso!',
      order: {
        id: orderId,
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        subtotal,
        discountAmount,
        shippingCost,
        totalAmount,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        itemsCount: validatedOrderItems.length,
        items: validatedOrderItems
      },
      paymentDetails
    });

  } catch (error) {
    db.exec('ROLLBACK');
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Erro interno ao processar pedido. Tente novamente.' });
  }
});

// GET /api/orders/my-orders (Customer's personal order history)
router.get('/my-orders', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const detailedOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        ...order,
        shipping_address: JSON.parse(order.shipping_address || '{}'),
        items
      };
    });

    return res.json({ orders: detailedOrders });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar histórico de pedidos.' });
  }
});

// GET /api/orders/track/:orderNumber (Single order lookup with privacy protection)
router.get('/track/:orderNumber', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { email } = req.query;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado com este número.' });
    }

    // Security check: Must belong to authenticated user OR match provided email
    if (order.user_id && req.user && req.user.id === order.user_id) {
      // Authorized by session
    } else if (email && order.customer_email.toLowerCase() === email.trim().toLowerCase()) {
      // Authorized by email verification
    } else if (req.user && ['admin', 'manager', 'order_operator'].includes(req.user.role)) {
      // Authorized staff
    } else {
      return res.status(403).json({
        error: 'Para visualizar os detalhes deste pedido, faça login na sua conta ou informe o e-mail utilizado na compra.'
      });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    return res.json({
      order: {
        ...order,
        shipping_address: JSON.parse(order.shipping_address || '{}'),
        items
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    return res.status(500).json({ error: 'Erro ao consultar pedido.' });
  }
});

export default router;
