import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { 
  Filter, 
  X, 
  ChevronDown, 
  SlidersHorizontal, 
  RotateCcw,
  Search
} from 'lucide-react';

export default function CatalogPage({ onNavigate, initialFilters = {} }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Active filter state
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.categoria || '');
  const [selectedSize, setSelectedSize] = useState(initialFilters.tamanho || '');
  const [selectedColor, setSelectedColor] = useState(initialFilters.cor || '');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [isNewOnly, setIsNewOnly] = useState(initialFilters.novidades === '1');
  const [isSaleOnly, setIsSaleOnly] = useState(initialFilters.promocoes === '1');
  const [sortBy, setSortBy] = useState('destaque');

  const availableSizes = ['PP', 'P', 'M', 'G', 'GG', '36', '38', '40', '42'];
  const availableColors = [
    { name: 'Preto', hex: '#121212' },
    { name: 'Vinho', hex: '#581825' },
    { name: 'Bege', hex: '#E6DCcf' },
    { name: 'Terracota', hex: '#8B5A2B' },
    { name: 'Off-White', hex: '#F7F5F0' },
    { name: 'Champagne', hex: '#E8D8C4' },
    { name: 'Camel', hex: '#B5885C' },
    { name: 'Azul Médio', hex: '#415A77' }
  ];

  // Load categories
  useEffect(() => {
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  // Sync initialFilters when user clicks category from header
  useEffect(() => {
    if (initialFilters.categoria !== undefined) setSelectedCategory(initialFilters.categoria || '');
    if (initialFilters.search !== undefined) setSearchQuery(initialFilters.search || '');
    if (initialFilters.novidades !== undefined) setIsNewOnly(initialFilters.novidades === '1');
    if (initialFilters.promocoes !== undefined) setIsSaleOnly(initialFilters.promocoes === '1');
  }, [initialFilters]);

  // Fetch filtered products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('categoria', selectedCategory);
        if (selectedSize) params.append('tamanho', selectedSize);
        if (selectedColor) params.append('cor', selectedColor);
        if (searchQuery) params.append('busca', searchQuery);
        if (isNewOnly) params.append('novidades', '1');
        if (isSaleOnly) params.append('promocoes', '1');
        if (sortBy) params.append('ordenar', sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, selectedSize, selectedColor, searchQuery, isNewOnly, isSaleOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setSearchQuery('');
    setIsNewOnly(false);
    setIsSaleOnly(false);
    setSortBy('destaque');
  };

  const hasActiveFilters = selectedCategory || selectedSize || selectedColor || searchQuery || isNewOnly || isSaleOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header / Breadcrumbs */}
      <div>
        <nav className="text-xs text-brand-500 mb-2 flex items-center space-x-1.5">
          <button onClick={() => onNavigate('home')} className="hover:text-brand-900">Início</button>
          <span>/</span>
          <span className="text-brand-900 font-medium">Catálogo de Moda</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900">
              {selectedCategory 
                ? (categories.find(c => c.slug === selectedCategory)?.name || 'Coleção') 
                : isSaleOnly ? 'Promoções Especiais' : isNewOnly ? 'Novidades' : 'Coleção Completa'}
            </h1>
            <p className="text-xs text-brand-600 mt-1">
              Exibindo <strong>{products.length}</strong> {products.length === 1 ? 'peça encontrada' : 'peças encontradas'}
            </p>
          </div>

          {/* Sort & Mobile Filter Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2 bg-white border border-brand-300 rounded-lg text-xs font-semibold text-brand-900 flex items-center space-x-2 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-wine" />
              <span>Filtros {hasActiveFilters && '•'}</span>
            </button>

            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-brand-300 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-brand-900 focus:outline-none focus:border-brand-wine shadow-sm"
              >
                <option value="destaque">Destaques da Barbara</option>
                <option value="novidades">Lançamentos Recentes</option>
                <option value="mais_vendidos">Mais Vendidos</option>
                <option value="preco_asc">Menor Preço</option>
                <option value="preco_desc">Maior Preço</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-brand-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-brand-200 shadow-soft h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-brand-100">
            <h3 className="font-serif text-base font-bold text-brand-900 flex items-center space-x-2">
              <Filter className="w-4 h-4 text-brand-wine" />
              <span>Filtrar Peças</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-brand-wine hover:underline font-semibold flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs text-brand-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewOnly}
                onChange={(e) => setIsNewOnly(e.target.checked)}
                className="rounded border-brand-300 text-brand-wine focus:ring-brand-wine"
              />
              <span className="font-medium">Apenas Novidades</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-brand-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isSaleOnly}
                onChange={(e) => setIsSaleOnly(e.target.checked)}
                className="rounded border-brand-300 text-brand-wine focus:ring-brand-wine"
              />
              <span className="font-medium text-brand-wine font-semibold">Peças em Promoção</span>
            </label>
          </div>

          {/* Categories Filter */}
          <div className="pt-4 border-t border-brand-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-3">Categorias</h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === '' ? 'bg-brand-100 text-brand-wine font-bold' : 'text-brand-700 hover:bg-brand-50'
                }`}
              >
                <span>Todas as Categorias</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug ? 'bg-brand-100 text-brand-wine font-bold' : 'text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-brand-400">({cat.product_count || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sizes Filter */}
          <div className="pt-4 border-t border-brand-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-3">Tamanhos</h4>
            <div className="grid grid-cols-4 gap-1.5">
              {availableSizes.map(sz => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    selectedSize === sz 
                      ? 'bg-brand-900 text-white border-brand-900 shadow-sm' 
                      : 'bg-brand-50 text-brand-800 border-brand-200 hover:border-brand-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Filter */}
          <div className="pt-4 border-t border-brand-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900 mb-3">Cores</h4>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    selectedColor === c.name 
                      ? 'ring-2 ring-brand-wine ring-offset-2 scale-110' 
                      : 'border-brand-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-[11px] text-brand-wine font-medium mt-2">
                Filtrando por cor: <strong>{selectedColor}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-brand-200 p-4 space-y-3 shimmer h-80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-200 p-12 text-center space-y-4 shadow-soft">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto text-brand-500">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-900">
                Nenhuma peça encontrada com esses filtros
              </h3>
              <p className="text-xs text-brand-600 max-w-sm mx-auto">
                Tente remover os filtros de cor, tamanho ou termo de busca para visualizar outras opções da nossa coleção.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine-dark transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
