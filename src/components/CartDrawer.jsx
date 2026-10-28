import React, { useState } from 'react';
import { useCart, formatBRL } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  Truck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function CartDrawer({ onNavigate }) {
  const { 
    items, 
    subtotal, 
    discountAmount, 
    appliedCoupon, 
    couponError, 
    canCheckout, 
    warnings,
    isDrawerOpen, 
    closeDrawer, 
    updateQuantity, 
    removeFromCart, 
    applyCoupon, 
    removeCoupon,
    isSyncing 
  } = useCart();

  const { settings } = useSettings();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isDrawerOpen) return null;

  const freeShippingThreshold = settings?.free_shipping_threshold || 299.00;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponCode);
    setIsApplyingCoupon(false);
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-brand-200 flex items-center justify-between bg-brand-50/60">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-brand-900" />
            <h2 className="font-serif text-lg font-semibold text-brand-900">Sua Sacola</h2>
            <span className="text-xs bg-brand-200 text-brand-900 font-bold px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <button 
            onClick={closeDrawer}
            className="p-1.5 text-brand-500 hover:text-brand-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-5 py-3 bg-brand-100/70 border-b border-brand-200">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="flex items-center space-x-1.5 text-brand-800">
              <Truck className="w-3.5 h-3.5 text-brand-wine" />
              {remainingForFreeShipping > 0 ? (
                <span>Faltam <strong>{formatBRL(remainingForFreeShipping)}</strong> para <strong>Frete Grátis</strong></span>
              ) : (
                <span className="text-emerald-700 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Parabéns! Você ganhou Frete Grátis!</span>
                </span>
              )}
            </span>
            <span className="text-brand-600 font-bold">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full bg-brand-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand-wine h-full transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Warnings Alert */}
        {warnings.length > 0 && (
          <div className="mx-5 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-brand-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-brand-500">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="font-serif text-lg text-brand-900 font-medium mb-1">Sua sacola está vazia</h3>
              <p className="text-xs max-w-xs text-brand-600 mb-6">
                Explore nossa coleção inteligente e escolha peças que combinam com você.
              </p>
              <button
                onClick={() => { closeDrawer(); onNavigate('catalog'); }}
                className="px-6 py-2.5 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine transition-colors"
              >
                Explorar Coleção
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.variantId} className="py-4 flex space-x-4 first:pt-0">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-20 h-24 object-cover rounded-lg bg-brand-100 shrink-0 border border-brand-200" 
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs sm:text-sm font-medium text-brand-900 line-clamp-2">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-brand-400 hover:text-red-600 p-1 transition-colors"
                        title="Remover produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center space-x-2 text-xs text-brand-600">
                      <span className="flex items-center space-x-1">
                        <span 
                          className="w-3 h-3 rounded-full border border-brand-300 inline-block" 
                          style={{ backgroundColor: item.colorHex }} 
                        />
                        <span>{item.color}</span>
                      </span>
                      <span>•</span>
                      <span>Tam: <strong>{item.size}</strong></span>
                    </div>

                    {item.warning && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{item.warning}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-brand-300 rounded-md">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-1 hover:bg-brand-100 text-brand-700 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-brand-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-1 hover:bg-brand-100 text-brand-700 transition-colors"
                        disabled={item.quantity >= item.availableStock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-brand-900">
                        {formatBRL(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Area */}
        {items.length > 0 && (
          <div className="p-5 border-t border-brand-200 bg-brand-50/70 space-y-4">
            {/* Coupon Code Section */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cupom <strong>{appliedCoupon.code}</strong> aplicado</span>
                  <span className="text-emerald-700 font-bold">(-{formatBRL(discountAmount)})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-emerald-700 hover:text-red-600 text-xs font-medium underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Possui cupom? Ex: BEMVINDA10"
                    className="w-full bg-white border border-brand-300 rounded-lg py-2 pl-8 pr-3 text-xs uppercase placeholder-normal text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                  <Tag className="w-3.5 h-3.5 text-brand-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-brand-800 text-white text-xs font-semibold rounded-lg hover:bg-brand-900 transition-colors disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : 'Aplicar'}
                </button>
              </form>
            )}

            {couponError && (
              <p className="text-[11px] text-red-600">{couponError}</p>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-brand-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-brand-900">{formatBRL(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Desconto cupom</span>
                  <span>-{formatBRL(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-600 text-[11px]">
                <span>Frete</span>
                <span>Calculado na próxima etapa</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-brand-900 pt-2 border-t border-brand-200">
                <span>Total Estimado</span>
                <span className="font-serif text-brand-wine">{formatBRL(finalTotal)}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => {
                closeDrawer();
                onNavigate('checkout');
              }}
              disabled={!canCheckout || isSyncing}
              className="w-full py-3.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Finalizar Compra</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={closeDrawer}
              className="w-full text-center text-xs text-brand-600 hover:text-brand-900 font-medium underline"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
