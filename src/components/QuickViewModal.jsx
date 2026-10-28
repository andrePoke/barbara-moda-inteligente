import React, { useState, useEffect } from 'react';
import { useCart, formatBRL } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { X, Heart, ShoppingBag, Check, AlertCircle, ArrowRight, Ruler, ChevronDown } from 'lucide-react';
import { formatSizeDisplay } from '../utils/sizeFormatter';

export default function QuickViewModal({ product, onClose, onNavigate }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Initialize selected color & size
  useEffect(() => {
    if (product) {
      const initialColor = product.available_colors?.[0]?.name || null;
      setSelectedColor(initialColor);

      // Find first size that has stock in that color
      const variantsForColor = product.variants?.filter(v => v.color_name === initialColor);
      const availableVariant = variantsForColor?.find(v => v.stock_quantity > 0) || variantsForColor?.[0];
      setSelectedSize(availableVariant?.size || null);

      setSelectedImage(product.primary_image);
      setQuantity(1);
      setFeedbackMsg(null);
    }
  }, [product]);

  if (!product) return null;

  // Selected variant lookup
  const currentVariant = product.variants?.find(
    v => v.color_name === selectedColor && v.size === selectedSize
  );

  const availableStock = currentVariant?.stock_quantity || 0;
  const isVariantInStock = availableStock > 0;

  // Handle color change
  const handleColorChange = (colorName) => {
    setSelectedColor(colorName);
    const colorImg = product.available_colors?.find(c => c.name === colorName)?.image_url
      || product.variants?.find(v => v.color_name === colorName && v.image_url)?.image_url
      || product.images?.find(img => img.color_name === colorName)?.image_url;
    if (colorImg) {
      setSelectedImage(colorImg);
    }

    // Adjust size if current selected size is out of stock in this new color
    const variantsForNewColor = product.variants?.filter(v => v.color_name === colorName);
    const sameSizeVariant = variantsForNewColor?.find(v => v.size === selectedSize);
    if (!sameSizeVariant || sameSizeVariant.stock_quantity === 0) {
      const firstAvailable = variantsForNewColor?.find(v => v.stock_quantity > 0) || variantsForNewColor?.[0];
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size);
      }
    }
  };

  const handleAddToCart = () => {
    try {
      if (!currentVariant) {
        setFeedbackMsg({ type: 'error', text: 'Selecione uma cor e tamanho válidos.' });
        return;
      }
      addToCart(product, currentVariant, quantity);
      setFeedbackMsg({ type: 'success', text: 'Adicionado à sacola!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const favorited = isWishlisted(product.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-elevated border border-brand-200 overflow-hidden z-50 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-brand-500 hover:text-brand-900 bg-white/80 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Gallery Section */}
            <div className="bg-brand-100 p-6 flex flex-col items-center justify-center">
              <div className="w-full aspect-[3/4] rounded-xl overflow-hidden shadow-soft mb-3 bg-white">
                <img 
                  src={selectedImage || product.primary_image} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto py-1 max-w-full">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`w-12 h-14 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImage === img.image_url ? 'border-brand-wine shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Options Section */}
            <div className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-brand-600 font-bold block mb-1">
                  {product.category_name} • SKU: {currentVariant?.sku || product.sku}
                </span>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-900 leading-tight">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="mt-3 flex items-baseline space-x-3">
                  {product.sale_price ? (
                    <>
                      <span className="text-xl sm:text-2xl font-bold text-brand-wine">
                        {formatBRL(product.sale_price)}
                      </span>
                      <span className="text-sm text-brand-400 line-through">
                        {formatBRL(product.base_price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl sm:text-2xl font-bold text-brand-900">
                      {formatBRL(product.base_price)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-brand-700 leading-relaxed line-clamp-3">
                  {product.short_description || product.description}
                </p>

                {/* 1. SELETOR DE COR COM MINIATURAS DE FOTOS REAIS */}
                <div className="mt-5">
                  <div className="flex items-center space-x-2 text-xs mb-2.5">
                    <span className="font-semibold text-brand-900">Cor:</span>
                    <span className="font-bold text-brand-900">{selectedColor || 'Selecione'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.available_colors?.map(c => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleColorChange(c.name)}
                          title={`Cor: ${c.name}`}
                          className={`relative rounded-xl p-0.5 transition-all flex flex-col items-center group ${
                            isSelected 
                              ? 'ring-2 ring-blue-600 ring-offset-2 border border-blue-600 shadow-sm' 
                              : 'border border-brand-300 hover:border-brand-500 bg-white'
                          }`}
                        >
                          {c.image_url ? (
                            <div className="w-11 h-13 rounded-lg overflow-hidden bg-brand-100 flex items-center justify-center">
                              <img 
                                src={c.image_url} 
                                alt={c.name} 
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" 
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-13 rounded-lg bg-brand-50 flex flex-col items-center justify-center p-1 border border-brand-200">
                              <span 
                                className="w-4 h-4 rounded-full border border-black/10 shadow-inner" 
                                style={{ backgroundColor: c.hex }} 
                              />
                              <span className="text-[9px] text-brand-700 truncate w-full text-center mt-1">{c.name}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SELETOR DE TAMANHO COM CARTOES NUMERO + LETRA (ESTILO IMAGEM 2) */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-brand-900">Tamanho:</span>
                      <span className="font-bold text-brand-900">{selectedSize || 'Escolha'}</span>
                    </div>
                    {availableStock > 0 && availableStock <= 3 && (
                      <span className="text-amber-700 font-semibold text-[11px] flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Restam apenas {availableStock} un.!</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes?.map(sz => {
                      const sizeVariant = product.variants?.find(
                        v => v.color_name === selectedColor && v.size === sz.size
                      );
                      const inStock = sizeVariant && sizeVariant.stock_quantity > 0;
                      const isSelected = selectedSize === sz.size;
                      const { primary, secondary } = formatSizeDisplay(sz.size);

                      return (
                        <button
                          key={sz.size}
                          type="button"
                          disabled={!inStock}
                          onClick={() => setSelectedSize(sz.size)}
                          className={`min-w-[48px] px-2.5 py-1.5 rounded-lg text-center transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-sm'
                              : inStock
                              ? 'border border-brand-300 text-brand-900 hover:border-brand-500 bg-white'
                              : 'border border-dashed border-brand-200 text-brand-300 bg-brand-50/60 cursor-not-allowed line-through opacity-50'
                          }`}
                        >
                          <span className="text-xs font-bold leading-none">{primary}</span>
                          {secondary && (
                            <span className={`text-[9px] font-semibold mt-0.5 leading-none ${isSelected ? 'text-blue-700' : 'text-brand-500'}`}>
                              {secondary}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-blue-600 font-medium flex items-center space-x-1 mt-2.5">
                    <span>Perfeito para 92%</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>

                {/* Feedback */}
                {feedbackMsg && (
                  <div className={`mt-4 p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                    feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                  }`}>
                    {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{feedbackMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Actions Area */}
              <div className="mt-6 pt-4 border-t border-brand-200 space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isVariantInStock}
                    className="flex-1 py-3 px-4 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isVariantInStock ? 'Adicionar à Sacola' : 'Esgotado nesta combinação'}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3 rounded-lg border border-brand-300 transition-colors ${
                      favorited ? 'bg-brand-wine text-white border-brand-wine' : 'text-brand-700 hover:text-brand-wine'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigate('product', { slug: product.slug });
                  }}
                  className="w-full text-center text-xs text-brand-600 hover:text-brand-900 font-medium flex items-center justify-center space-x-1"
                >
                  <span>Ver página completa do produto e guia de medidas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
