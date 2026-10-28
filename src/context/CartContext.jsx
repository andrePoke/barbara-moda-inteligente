import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bmi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [validatedCart, setValidatedCart] = useState({
    items: [],
    subtotal: 0,
    canCheckout: false,
    warnings: []
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('bmi_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponError, setCouponError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Save raw items to localStorage
  useEffect(() => {
    localStorage.setItem('bmi_cart', JSON.stringify(items));
    validateCartWithServer(items);
  }, [items]);

  // Save coupon to localStorage
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('bmi_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('bmi_coupon');
    }
  }, [appliedCoupon]);

  // Server sync & live validation
  const validateCartWithServer = useCallback(async (currentItems) => {
    if (!currentItems || currentItems.length === 0) {
      setValidatedCart({ items: [], subtotal: 0, canCheckout: false, warnings: [] });
      return;
    }

    try {
      setIsSyncing(true);
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: currentItems.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setValidatedCart(data);

        // If coupon is active, re-verify minimum spend against current subtotal
        if (appliedCoupon && data.subtotal < (appliedCoupon.min_spend || 0)) {
          setCouponError(`Cupom ${appliedCoupon.code} removido pois o valor mínimo é de R$ ${appliedCoupon.min_spend.toFixed(2).replace('.', ',')}.`);
          setAppliedCoupon(null);
        }
      }
    } catch (err) {
      console.error('Cart sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [appliedCoupon]);

  const addToCart = (product, variant, quantity = 1) => {
    if (!variant || !variant.id) {
      throw new Error('Por favor, selecione uma cor e um tamanho válidos.');
    }

    if (variant.stock_quantity <= 0) {
      throw new Error('Esta variação está esgotada no momento.');
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.variantId === variant.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = Math.min(newQty, variant.stock_quantity);
        return updated;
      } else {
        return [
          ...prev,
          {
            variantId: variant.id,
            productId: product.id,
            quantity: Math.min(quantity, variant.stock_quantity)
          }
        ];
      }
    });

    setIsDrawerOpen(true);
  };

  const updateQuantity = (variantId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems(prev =>
      prev.map(i => (i.variantId === variantId ? { ...i, quantity: newQuantity } : i))
    );
  };

  const removeFromCart = (variantId) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setValidatedCart({ items: [], subtotal: 0, canCheckout: false, warnings: [] });
  };

  const applyCoupon = async (code) => {
    setCouponError(null);
    if (!code || !code.trim()) {
      setCouponError('Digite um código de cupom.');
      return false;
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          subtotal: validatedCart.subtotal
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Cupom inválido.');
        return false;
      }

      setAppliedCoupon(data);
      return true;
    } catch (err) {
      setCouponError('Erro ao validar cupom.');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Subtotal from server
  const subtotal = validatedCart.subtotal;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      discountAmount = Math.min(appliedCoupon.discount_value, subtotal);
    }
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: validatedCart.items,
      rawItemsCount: totalCount,
      subtotal,
      discountAmount,
      appliedCoupon,
      couponError,
      canCheckout: validatedCart.canCheckout,
      warnings: validatedCart.warnings,
      isDrawerOpen,
      isSyncing,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      refreshCart: () => validateCartWithServer(items)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

// Utility to format BRL
export function formatBRL(value) {
  if (value === undefined || value === null) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
