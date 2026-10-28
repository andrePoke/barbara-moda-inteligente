import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  User, 
  Menu, 
  X, 
  ChevronDown, 
  Shield, 
  LogOut,
  Package,
  ArrowRight
} from 'lucide-react';

export default function Header({ onNavigate, currentRoute }) {
  const { user, isAdmin, logout } = useAuth();
  const { openDrawer, rawItemsCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { settings } = useSettings();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Autocomplete search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/products?busca=${encodeURIComponent(searchQuery)}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.products || []);
          }
        } catch (err) {
          console.error(err);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', { search: searchQuery.trim() });
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const navCategories = [
    { label: 'Novidades', filter: { novidades: '1' } },
    { label: 'Vestidos', filter: { categoria: 'vestidos' } },
    { label: 'Conjuntos', filter: { categoria: 'conjuntos' } },
    { label: 'Blusas & Camisas', filter: { categoria: 'blusas' } },
    { label: 'Calças & Alfaiataria', filter: { categoria: 'calcas' } },
    { label: 'Saias', filter: { categoria: 'saias' } },
    { label: 'Jeans', filter: { categoria: 'jeans' } },
    { label: 'Promoções', filter: { promocoes: '1' }, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-200 transition-all">
      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="p-2 text-brand-900 hover:text-brand-wine transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setSearchOpen(true)}
              aria-label="Pesquisar"
              className="p-2 ml-1 text-brand-900 hover:text-brand-wine transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-1 lg:flex-none text-center lg:text-left">
            <button 
              onClick={() => onNavigate('home')} 
              className="inline-block group text-left focus:outline-none"
            >
              <div className="font-serif text-2xl sm:text-3xl tracking-[0.18em] font-semibold text-brand-900 uppercase group-hover:text-brand-wine transition-colors">
                Barbara
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.35em] text-brand-600 uppercase font-medium mt-0.5">
                Moda Inteligente
              </div>
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por vestido, blazer, calça ou cor..."
                className="w-full bg-brand-50 border border-brand-300 rounded-full py-2 pl-10 pr-10 text-xs sm:text-sm text-brand-900 placeholder-brand-500 focus:outline-none focus:border-brand-wine focus:ring-1 focus:ring-brand-wine transition-all"
              />
              <Search className="w-4 h-4 text-brand-500 absolute left-3.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-brand-500 hover:text-brand-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-brand-200 overflow-hidden z-50">
                <div className="p-2 divide-y divide-brand-100">
                  {searchResults.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        onNavigate('product', { slug: prod.slug });
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full p-2 flex items-center space-x-3 hover:bg-brand-50 text-left transition-colors rounded-lg"
                    >
                      <img 
                        src={prod.primary_image} 
                        alt={prod.name} 
                        className="w-10 h-12 object-cover rounded" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-brand-900 truncate">{prod.name}</p>
                        <p className="text-xs text-brand-wine font-semibold">
                          {prod.sale_price ? `R$ ${prod.sale_price.toFixed(2).replace('.', ',')}` : `R$ ${prod.base_price.toFixed(2).replace('.', ',')}`}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full py-2 px-3 text-xs text-center font-medium text-brand-wine hover:bg-brand-50 transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>Ver todos os resultados para "{searchQuery}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-5">
            {/* Admin Badge */}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-brand-wine text-white text-xs font-semibold rounded-full shadow-sm hover:bg-brand-wine-dark transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Painel Admin</span>
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('wishlist')}
              aria-label="Lista de Favoritos"
              className="p-2 text-brand-800 hover:text-brand-wine transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-wine text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* User Account / Dropdown */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-1.5 p-2 text-brand-900 hover:text-brand-wine transition-colors text-xs font-medium"
                  >
                    <div className="w-7 h-7 bg-brand-300 rounded-full flex items-center justify-center text-brand-900 font-bold uppercase text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline font-serif">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-brand-500" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-brand-200 py-2 z-50 animate-fadeIn"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-brand-100">
                        <p className="text-xs font-medium text-brand-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-brand-500 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { onNavigate('account'); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-brand-800 hover:bg-brand-50 flex items-center space-x-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Minha Conta</span>
                      </button>
                      <button
                        onClick={() => { onNavigate('account', { tab: 'pedidos' }); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-brand-800 hover:bg-brand-50 flex items-center space-x-2"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Meus Pedidos</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-brand-wine font-medium hover:bg-brand-50 flex items-center space-x-2"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Painel Administrativo</span>
                        </button>
                      )}
                      <button
                        onClick={() => { logout(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-brand-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  aria-label="Minha Conta"
                  className="p-2 text-brand-800 hover:text-brand-wine transition-colors flex items-center space-x-1"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs font-medium">Entrar</span>
                </button>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={openDrawer}
              aria-label="Sacola de Compras"
              className="p-2 bg-brand-900 text-white rounded-full hover:bg-brand-wine transition-all relative flex items-center justify-center shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              {rawItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-wine text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {rawItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden lg:block border-t border-brand-200 bg-brand-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-center space-x-8 py-3 text-xs tracking-[0.12em] font-medium uppercase text-brand-800">
            <li>
              <button 
                onClick={() => onNavigate('home')}
                className={`hover:text-brand-wine transition-colors pb-1 ${currentRoute === 'home' ? 'text-brand-wine border-b-2 border-brand-wine font-semibold' : ''}`}
              >
                Início
              </button>
            </li>
            {navCategories.map(cat => (
              <li key={cat.label}>
                <button
                  onClick={() => onNavigate('catalog', cat.filter)}
                  className={`hover:text-brand-wine transition-colors pb-1 ${cat.highlight ? 'text-brand-wine font-bold' : ''}`}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-slideRight">
            <div className="p-5 border-b border-brand-200 flex items-center justify-between">
              <div>
                <span className="font-serif text-xl tracking-wider font-semibold text-brand-900 uppercase">Barbara</span>
                <span className="block text-[9px] tracking-widest text-brand-600 uppercase font-medium">Moda Inteligente</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-brand-500 hover:text-brand-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-brand-100">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O que você procura?"
                  className="w-full bg-brand-50 border border-brand-300 rounded-lg py-2 pl-9 pr-4 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
                <Search className="w-4 h-4 text-brand-500 absolute left-3 top-2.5" />
              </form>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <button
                onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
                className="w-full text-left py-2.5 px-3 text-sm font-medium text-brand-900 hover:bg-brand-50 rounded-lg"
              >
                Início
              </button>
              {navCategories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => { onNavigate('catalog', cat.filter); setMobileMenuOpen(false); }}
                  className={`w-full text-left py-2.5 px-3 text-sm rounded-lg flex items-center justify-between ${
                    cat.highlight ? 'text-brand-wine font-semibold bg-brand-wine/5' : 'text-brand-800 hover:bg-brand-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ArrowRight className="w-4 h-4 text-brand-400" />
                </button>
              ))}
            </div>

            {/* Mobile Footer Area */}
            <div className="p-4 border-t border-brand-200 bg-brand-50 space-y-2">
              {isAdmin && (
                <button
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 bg-brand-wine text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Painel Administrativo</span>
                </button>
              )}

              {user ? (
                <button
                  onClick={() => { onNavigate('account'); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 bg-white border border-brand-300 text-brand-900 text-xs font-medium rounded-lg flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Minha Conta ({user.name.split(' ')[0]})</span>
                </button>
              ) : (
                <button
                  onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 bg-brand-900 text-white text-xs font-medium rounded-lg flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Entrar / Cadastrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
