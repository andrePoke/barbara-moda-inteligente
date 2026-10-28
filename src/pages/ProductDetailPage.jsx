import React, { useState, useEffect } from 'react';
import { useCart, formatBRL } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import SizeGuideModal from '../components/SizeGuideModal';
import ProductCard from '../components/ProductCard';
import { 
  Heart, 
  ShoppingBag, 
  Share2, 
  Ruler, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Star, 
  MessageCircle, 
  Check, 
  AlertCircle,
  Plus, 
  Minus,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { formatSizeDisplay } from '../utils/sizeFormatter';

export default function ProductDetailPage({ slug, onNavigate }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { settings } = useSettings();

  const [productData, setProductData] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [cep, setCep] = useState('');
  const [shippingResult, setShippingResult] = useState(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Review submission state
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Produto não encontrado');
        const data = await res.json();
        const p = data.product;
        setProductData(data);

        // Pick initial color
        const firstColor = p.available_colors?.[0]?.name || null;
        setSelectedColor(firstColor);

        // Pick initial size with stock
        const variantsForColor = p.variants?.filter(v => v.color_name === firstColor);
        const availableVariant = variantsForColor?.find(v => v.stock_quantity > 0) || variantsForColor?.[0];
        setSelectedSize(availableVariant?.size || null);

        setSelectedImage(p.primary_image);
        setQuantity(1);

        // Load related
        const relRes = await fetch(`/api/products/${p.id}/related`);
        if (relRes.ok) {
          const relData = await relRes.json();
          setRelated(relData.related || []);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-white rounded-2xl border border-brand-200 shimmer" />
          <div className="space-y-6">
            <div className="h-6 w-1/3 bg-brand-200 rounded shimmer" />
            <div className="h-10 w-3/4 bg-brand-200 rounded shimmer" />
            <div className="h-8 w-1/4 bg-brand-200 rounded shimmer" />
            <div className="h-32 bg-brand-200 rounded shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!productData || !productData.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Produto não encontrado</h2>
        <p className="text-xs text-brand-600">O produto pode ter sido arquivado ou o link está incorreto.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const { product, reviews = [], rating_stats } = productData;

  // Active Variant lookup
  const currentVariant = product.variants?.find(
    v => v.color_name === selectedColor && v.size === selectedSize
  );

  const availableStock = currentVariant?.stock_quantity || 0;
  const isVariantInStock = availableStock > 0;
  const unitPrice = currentVariant?.price_override || product.sale_price || product.base_price;

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    const matchingImg = product.available_colors?.find(c => c.name === colorName)?.image_url
      || product.variants?.find(v => v.color_name === colorName && v.image_url)?.image_url
      || product.images?.find(i => i.color_name === colorName)?.image_url;
    if (matchingImg) {
      setSelectedImage(matchingImg);
    }

    // Auto switch to in-stock size if current size is out of stock in new color
    const variantsForNewColor = product.variants?.filter(v => v.color_name === colorName);
    const sameSize = variantsForNewColor?.find(v => v.size === selectedSize);
    if (!sameSize || sameSize.stock_quantity === 0) {
      const firstWithStock = variantsForNewColor?.find(v => v.stock_quantity > 0) || variantsForNewColor?.[0];
      if (firstWithStock) setSelectedSize(firstWithStock.size);
    }
  };

  const handleAddToCart = (directToCheckout = false) => {
    if (!currentVariant) {
      setFeedback({ type: 'error', text: 'Selecione uma cor e um tamanho para continuar.' });
      return;
    }
    if (!isVariantInStock) {
      setFeedback({ type: 'error', text: 'Esta variação está esgotada no momento.' });
      return;
    }

    try {
      addToCart(product, currentVariant, quantity);
      if (directToCheckout) {
        onNavigate('checkout');
      } else {
        setFeedback({ type: 'success', text: 'Produto adicionado à sacola com sucesso!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCalculateShipping = async (e) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      alert('Digite um CEP válido com 8 dígitos.');
      return;
    }

    setIsCalculatingShipping(true);
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cleanCep, subtotal: unitPrice * quantity })
      });

      if (res.ok) {
        const data = await res.json();
        const pac = data.options.find(o => o.id === 'pac');
        const sedex = data.options.find(o => o.id === 'sedex');
        const showroom = data.options.find(o => o.id === 'showroom');

        setShippingResult({
          pac: { name: pac.name, cost: pac.cost, days: pac.deadline, isFree: pac.isFree },
          sedex: { name: sedex.name, cost: sedex.cost, days: sedex.deadline },
          showroom: { name: showroom.name, cost: 0, days: showroom.deadline },
          address: data.address ? `${data.address.city}/${data.address.state}` : null
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/settings/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          author_name: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        reviews.unshift(data.review);
        setReviewName('');
        setReviewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const favorited = isWishlisted(product.id);
  const waProductUrl = `https://wa.me/${settings?.whatsapp_number || '5511987654321'}?text=${encodeURIComponent(`Olá! Estou com dúvida sobre a peça *${product.name}* (Ref: ${currentVariant?.sku || product.sku}). Gostaria de orientações sobre tamanhos e caimento.`)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-brand-500 flex items-center space-x-2">
        <button onClick={() => onNavigate('home')} className="hover:text-brand-900">Início</button>
        <span>/</span>
        <button onClick={() => onNavigate('catalog', { categoria: product.category_slug })} className="hover:text-brand-900">
          {product.category_name}
        </button>
        <span>/</span>
        <span className="text-brand-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Section: Gallery + Commercial Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Gallery (Left: 7 columns on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden border border-brand-200/80 shadow-soft fashion-zoom-container relative">
            <img 
              src={selectedImage || product.primary_image} 
              alt={product.name} 
              className="w-full h-full object-cover object-top fashion-zoom-image"
            />
            {product.sale_price && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-brand-wine text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-sm">
                Promoção Especial
              </span>
            )}
          </div>

          {/* Thumbnails Strip */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.image_url 
                      ? 'border-brand-wine shadow-md scale-105' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Commercial Details (Right: 5 columns on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-brand-wine font-bold">
                {product.category_name}
              </span>
              <span className="text-xs text-brand-500 font-mono">
                SKU: {currentVariant?.sku || product.sku}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900 mt-2 leading-tight">
              {product.name}
            </h1>

            {/* Ratings summary */}
            <div className="flex items-center space-x-2 mt-3">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-900">{rating_stats?.average || '4.9'}</span>
              <span className="text-xs text-brand-500">({reviews.length} avaliações)</span>
            </div>

            {/* Pricing Section */}
            <div className="mt-5 p-4 bg-brand-50 rounded-xl border border-brand-200/80">
              <div className="flex items-baseline space-x-3">
                {product.sale_price ? (
                  <>
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-wine">
                      {formatBRL(product.sale_price)}
                    </span>
                    <span className="text-sm text-brand-400 line-through">
                      {formatBRL(product.base_price)}
                    </span>
                  </>
                ) : (
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
                    {formatBRL(product.base_price)}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-700 font-medium mt-1">
                em até <strong>6x de {formatBRL(unitPrice / 6)}</strong> sem juros no cartão ou <strong>10% OFF no Pix</strong>
              </p>
            </div>

            {/* 1. SELETOR DE COR COM MINIATURAS DE FOTOS REAIS (DESIGN PROFISSIONAL) */}
            <div className="mt-6">
              <div className="flex items-center space-x-2 text-sm mb-3">
                <span className="text-brand-900 font-semibold">Cor:</span>
                <span className="font-bold text-brand-900">{selectedColor || 'Selecione'}</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {product.available_colors?.map(c => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleColorSelect(c.name)}
                      title={`Cor: ${c.name}`}
                      className={`relative rounded-xl p-1 transition-all flex flex-col items-center group ${
                        isSelected 
                          ? 'ring-2 ring-blue-600 ring-offset-2 border border-blue-600 shadow-sm' 
                          : 'border border-brand-300 hover:border-brand-500 bg-white'
                      }`}
                    >
                      {c.image_url ? (
                        <div className="w-12 h-14 rounded-lg overflow-hidden bg-brand-100 flex items-center justify-center">
                          <img 
                            src={c.image_url} 
                            alt={c.name} 
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" 
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-14 rounded-lg bg-brand-50 flex flex-col items-center justify-center p-1 border border-brand-200">
                          <span 
                            className="w-5 h-5 rounded-full border border-black/10 shadow-inner" 
                            style={{ backgroundColor: c.hex }} 
                          />
                          <span className="text-[10px] text-brand-700 truncate w-full text-center mt-1 font-medium">{c.name}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SELETOR DE TAMANHO COM CARTOES NUMERO + LETRA (IGUAL A IMAGEM DE REFERENCIA) */}
            <div className="mt-6">
              <div className="flex items-center space-x-2 text-sm mb-3">
                <span className="text-brand-900 font-semibold">Tamanho:</span>
                <span className="font-bold text-brand-900">{selectedSize || 'Escolha'}</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.available_sizes?.map(sz => {
                  const variant = product.variants?.find(
                    v => v.color_name === selectedColor && v.size === sz.size
                  );
                  const inStock = variant && variant.stock_quantity > 0;
                  const isSelected = selectedSize === sz.size;
                  const { primary, secondary } = formatSizeDisplay(sz.size);

                  return (
                    <button
                      key={sz.size}
                      type="button"
                      disabled={!inStock}
                      onClick={() => setSelectedSize(sz.size)}
                      className={`min-w-[56px] px-3.5 py-2.5 rounded-xl text-center transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-sm'
                          : inStock
                          ? 'bg-white border border-brand-300 text-brand-900 hover:border-brand-500 hover:shadow-soft'
                          : 'bg-brand-50/60 border border-dashed border-brand-200 text-brand-300 cursor-not-allowed line-through opacity-50'
                      }`}
                    >
                      <span className="text-sm font-bold leading-none">{primary}</span>
                      {secondary && (
                        <span className={`text-[10px] font-semibold mt-1 leading-none ${isSelected ? 'text-blue-700' : 'text-brand-500'}`}>
                          {secondary}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Links de Apoio ao Cliente: Guia de Medidas e Perfeito para 92% */}
              <div className="flex flex-col space-y-1.5 mt-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  <Ruler className="w-4 h-4 text-blue-600" />
                  <span>Guia de tamanhos</span>
                </button>

                <div className="text-xs text-blue-600 font-medium flex items-center space-x-1">
                  <span>Perfeito para 92%</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Dynamic Stock Indicator */}
              <div className="mt-3">
                {isVariantInStock ? (
                  availableStock <= 3 ? (
                    <span className="inline-flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-md font-semibold border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Atenção: Apenas {availableStock} {availableStock === 1 ? 'unidade restante' : 'unidades restantes'} nesta combinação!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md font-medium border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Em estoque pronto para envio imediato</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center space-x-1.5 text-xs text-red-700 bg-red-50 px-3 py-1 rounded-md font-semibold border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Esta combinação de cor e tamanho está temporariamente esgotada</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="mt-8 space-y-3">
              <div className="flex space-x-3">
                {/* Quantity */}
                <div className="flex items-center border border-brand-300 rounded-xl bg-white px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || !isVariantInStock}
                    className="p-2 text-brand-700 hover:text-brand-900 disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-bold text-brand-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock || !isVariantInStock}
                    className="p-2 text-brand-700 hover:text-brand-900 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Bag */}
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={!isVariantInStock}
                  className="flex-1 py-3.5 px-6 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isVariantInStock ? 'Adicionar à Sacola' : 'Esgotado'}</span>
                </button>

                {/* Favorite */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Favoritar peça"
                  className={`p-3.5 rounded-xl border border-brand-300 transition-colors ${
                    favorited ? 'bg-brand-wine text-white border-brand-wine' : 'bg-white text-brand-700 hover:text-brand-wine'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Buy Now (Immediate Checkout) */}
              <button
                onClick={() => handleAddToCart(true)}
                disabled={!isVariantInStock}
                className="w-full py-3.5 px-6 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Comprar Agora
              </button>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* WhatsApp Assistance Button */}
            <div className="pt-2">
              <a
                href={waProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Dúvidas sobre esta peça? Fale com a consultora no WhatsApp</span>
              </a>
            </div>

            {/* Shipping Calculator */}
            <div className="pt-6 border-t border-brand-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-2 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-brand-wine" />
                <span>Simular Prazo e Frete</span>
              </h4>
              <form onSubmit={handleCalculateShipping} className="flex space-x-2">
                <input
                  type="text"
                  maxLength={9}
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="Digite seu CEP (Ex: 01310-200)"
                  className="flex-1 bg-white border border-brand-300 rounded-lg px-3 py-2 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
                <button
                  type="submit"
                  disabled={isCalculatingShipping}
                  className="px-4 py-2 bg-brand-800 text-white text-xs font-semibold rounded-lg hover:bg-brand-900 transition-colors"
                >
                  {isCalculatingShipping ? '...' : 'Calcular'}
                </button>
              </form>

              {shippingResult && (
                <div className="mt-3 p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong className="block text-brand-900">{shippingResult.pac.name}</strong>
                      <span className="text-[11px] text-brand-500">{shippingResult.pac.days}</span>
                    </div>
                    <span className="font-bold text-brand-900">
                      {shippingResult.pac.isFree ? (
                        <span className="text-emerald-700">GRÁTIS</span>
                      ) : (
                        formatBRL(shippingResult.pac.cost)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-brand-200/60">
                    <div>
                      <strong className="block text-brand-900">{shippingResult.sedex.name}</strong>
                      <span className="text-[11px] text-brand-500">{shippingResult.sedex.days}</span>
                    </div>
                    <span className="font-bold text-brand-900">{formatBRL(shippingResult.sedex.cost)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-brand-200/60">
                    <div>
                      <strong className="block text-brand-900">{shippingResult.showroom.name}</strong>
                      <span className="text-[11px] text-brand-500">{shippingResult.showroom.days}</span>
                    </div>
                    <span className="font-bold text-emerald-700">GRÁTIS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Share action */}
            <div className="pt-4 flex items-center justify-between text-xs text-brand-600">
              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 hover:text-brand-wine transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Link copiado!' : 'Compartilhar esta peça'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Technical Details Accordion */}
      <div className="border-t border-brand-200 pt-10">
        <div className="max-w-3xl space-y-6">
          <h3 className="font-serif text-xl font-bold text-brand-900">
            Detalhes e Composição da Peça
          </h3>
          <p className="text-sm text-brand-700 leading-relaxed font-light">
            {product.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-200/60 text-xs space-y-1">
              <strong className="text-brand-900 block font-serif">Modelagem e Caimento</strong>
              <p className="text-brand-600">Alfaiataria estruturada com caimento anatômico desenvolvido para valorizar a silhueta com total conforto.</p>
            </div>
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-200/60 text-xs space-y-1">
              <strong className="text-brand-900 block font-serif">Cuidados com a Peça</strong>
              <p className="text-brand-600">Lavar à mão ou em ciclo delicado. Secar à sombra. Não utilizar alvejante à base de cloro.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="border-t border-brand-200 pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl font-bold text-brand-900">
              Avaliações de Clientes
            </h3>
            <p className="text-xs text-brand-600 mt-1">
              Opiniões reais de quem já adquiriu peças da Barbara Moda Inteligente
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-bold text-brand-900">{rating_stats?.average || '4.9'} / 5.0</span>
          </div>
        </div>

        {/* Existing Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-brand-500 italic">Seja a primeira a avaliar este produto!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-5 bg-white rounded-xl border border-brand-200 shadow-soft space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900">{rev.author_name}</span>
                  <div className="flex text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-brand-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-brand-500">
                  <span>{new Date(rev.created_at).toLocaleDateString('pt-BR')}</span>
                  {rev.verified_purchase === 1 && (
                    <span className="text-emerald-700 font-semibold">Compra Verificada</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form to submit review */}
        <div className="p-6 bg-brand-50 rounded-2xl border border-brand-200/80 max-w-xl">
          <h4 className="font-serif text-base font-bold text-brand-900 mb-3">
            Deixe sua Avaliação
          </h4>

          {reviewSuccess ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Obrigado! Sua avaliação autêntica foi publicada com sucesso.</span>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Como você gostaria de ser chamada?"
                  className="w-full bg-white border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">Nota</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  className="bg-white border border-brand-300 rounded-lg p-2 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 estrelas - Excelente)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 estrelas - Muito bom)</option>
                  <option value={3}>⭐⭐⭐ (3 estrelas - Bom)</option>
                  <option value={2}>⭐⭐ (2 estrelas - Regular)</option>
                  <option value={1}>⭐ (1 estrela - Insatisfeito)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">Seu Comentário</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Conte o que achou do tecido, caimento e acabamento..."
                  className="w-full bg-white border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2.5 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine transition-colors"
              >
                {submittingReview ? 'Enviando...' : 'Publicar Avaliação'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Related Products Showcase */}
      {related.length > 0 && (
        <div className="border-t border-brand-200 pt-12 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
                Combine Com
              </span>
              <h3 className="font-serif text-2xl font-bold text-brand-900">
                Peças Relacionadas
              </h3>
            </div>
            <button
              onClick={() => onNavigate('catalog', { categoria: product.category_slug })}
              className="text-xs font-semibold text-brand-wine hover:underline"
            >
              Ver mais desta categoria
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(rel => (
              <ProductCard
                key={rel.id}
                product={rel}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </div>
  );
}
