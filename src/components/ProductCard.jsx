import React, { useState } from 'react';
import { formatBRL } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Heart, Eye, ShoppingBag } from 'lucide-react';

export default function ProductCard({ product, onNavigate, onQuickView }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [selectedColor, setSelectedColor] = useState(product.available_colors?.[0]?.name || null);

  const favorited = isWishlisted(product.id);

  // If color selected, find image for that color if available
  const activeImage = (selectedColor && (
    product.images?.find(i => i.color_name === selectedColor)?.image_url
    || product.available_colors?.find(c => c.name === selectedColor)?.image_url
    || product.variants?.find(v => v.color_name === selectedColor && v.image_url)?.image_url
  )) 
  || product.primary_image 
  || product.images?.[0]?.image_url;

  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.base_price - product.sale_price) / product.base_price) * 100) 
    : 0;

  const isOutOfStock = !product.is_in_stock;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-brand-200/80 overflow-hidden shadow-soft hover:shadow-card transition-all duration-300">
      {/* Image & Badges Container */}
      <div className="relative aspect-[3/4] bg-brand-100 overflow-hidden fashion-zoom-container cursor-pointer"
        onClick={() => onNavigate('product', { slug: product.slug })}
      >
        <img 
          src={activeImage} 
          alt={product.name} 
          loading="lazy"
          className="w-full h-full object-cover object-top fashion-zoom-image"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-brand-900/85 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
              Esgotado
            </span>
          ) : (
            <>
              {hasDiscount && (
                <span className="px-2.5 py-1 bg-brand-wine text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                  -{discountPercent}% OFF
                </span>
              )}
              {product.is_new === 1 && (
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-brand-900 text-[10px] font-bold uppercase tracking-wider rounded-md border border-brand-200">
                  Novo
                </span>
              )}
              {product.is_bestseller === 1 && !hasDiscount && (
                <span className="px-2.5 py-1 bg-brand-gold/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Mais Vendido
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            favorited 
              ? 'bg-brand-wine text-white shadow-md' 
              : 'bg-white/80 text-brand-700 hover:bg-white hover:text-brand-wine shadow-sm'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Button (Desktop Hover) */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex space-x-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView(product);
            }}
            className="flex-1 py-2 px-3 bg-white/95 backdrop-blur-md text-brand-900 text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:bg-brand-wine hover:text-white transition-all flex items-center justify-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visualização rápida</span>
          </button>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <span className="text-[10px] uppercase tracking-widest text-brand-600 font-semibold mb-1 block">
            {product.category_name}
          </span>

          {/* Title */}
          <h3 
            onClick={() => onNavigate('product', { slug: product.slug })}
            className="font-serif text-sm font-semibold text-brand-900 line-clamp-2 hover:text-brand-wine transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Color Swatches */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="flex items-center space-x-1.5 mt-2.5">
              {product.available_colors.map((c) => (
                <button
                  key={c.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.name);
                  }}
                  title={c.name}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    selectedColor === c.name 
                      ? 'ring-2 ring-brand-wine ring-offset-1 border-transparent scale-110' 
                      : 'border-brand-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.available_colors.length > 4 && (
                <span className="text-[10px] text-brand-500 font-medium">
                  +{product.available_colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-3 pt-3 border-t border-brand-100 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            {hasDiscount ? (
              <>
                <span className="text-sm sm:text-base font-bold text-brand-wine">
                  {formatBRL(product.sale_price)}
                </span>
                <span className="text-xs text-brand-400 line-through">
                  {formatBRL(product.base_price)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-bold text-brand-900">
                {formatBRL(product.base_price)}
              </span>
            )}
          </div>

          <span className="text-[10px] text-brand-500 uppercase tracking-wider font-medium">
            até 6x s/ juros
          </span>
        </div>
      </div>
    </div>
  );
}
