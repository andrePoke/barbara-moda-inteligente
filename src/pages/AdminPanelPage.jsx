import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatBRL } from '../context/CartContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Tag, 
  Settings, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  X, 
  Upload, 
  ChevronRight,
  Truck,
  RotateCcw,
  ExternalLink,
  Layers,
  Instagram,
  Grid,
  Image as ImageIcon,
  Copy,
  Check
} from 'lucide-react';

export default function AdminPanelPage({ onNavigate }) {
  const { user, token, isAdmin } = useAuth();
  const { settings, refreshSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState(null);

  // Products Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: 1,
    short_description: '',
    description: '',
    base_price: '',
    sale_price: '',
    sku: '',
    status: 'published',
    is_featured: false,
    is_new: true,
    is_bestseller: false
  });

  const [productColors, setProductColors] = useState([
    {
      id: 1,
      name: 'Azul',
      hex: '#1e3a8a',
      image_url: '',
      isUploading: false,
      newSizeInput: '',
      sizes: [
        { size: '38 - P', stock: 5 },
        { size: '40 - M', stock: 8 },
        { size: '42 - G', stock: 4 },
        { size: '44 - GG', stock: 2 }
      ]
    }
  ]);

  // Variant adjustment modal
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [variantAdjustmentStock, setVariantAdjustmentStock] = useState({});

  // Orders Data
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Customers Data
  const [customers, setCustomers] = useState([]);

  // Coupons Data
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_spend: 150,
    max_usage: 100
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState(settings || {});
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Categories & Photos Management
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState('');

  // Instagram Feed Management
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [igForm, setIgForm] = useState({ image_url: '', post_url: '', caption: '' });

  // Check admin authorization
  if (!user || !['admin', 'manager', 'order_operator'].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">Acesso Restrito ao Painel</h2>
        <p className="text-xs text-brand-600">
          Esta área é de acesso restrito à equipe autorizada da Barbara Moda Inteligente.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
        >
          Fazer Login Administrativo
        </button>
      </div>
    );
  }

  // Load initial tab data
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, token]);

  const fetchTabData = async (tab) => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (tab === 'dashboard') {
        const res = await fetch('/api/admin/dashboard', { headers });
        if (res.ok) setDashboardData(await res.json());
      } else if (tab === 'produtos') {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/admin/products', { headers }),
          fetch('/api/products/categories')
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          setProducts(pData.products || []);
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          setCategories(cData.categories || []);
        }
      } else if (tab === 'pedidos') {
        const query = new URLSearchParams();
        if (orderStatusFilter) query.append('status', orderStatusFilter);
        if (orderSearch) query.append('search', orderSearch);

        const res = await fetch(`/api/admin/orders?${query.toString()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } else if (tab === 'clientes') {
        const res = await fetch('/api/admin/customers', { headers });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } else if (tab === 'cupons') {
        const res = await fetch('/api/admin/coupons', { headers });
        if (res.ok) {
          const data = await res.json();
          setCoupons(data.coupons || []);
        }
      } else if (tab === 'categorias') {
        const res = await fetch('/api/admin/categories', { headers });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } else if (tab === 'instagram') {
        const res = await fetch('/api/admin/instagram', { headers });
        if (res.ok) {
          const data = await res.json();
          setInstagramPosts(data.posts || []);
        }
      } else if (tab === 'configuracoes') {
        setSettingsForm(settings);
      }
    } catch (err) {
      console.error('Error fetching admin tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // PRODUCT HANDLERS COM MATRIZ INTELIGENTE DE CORES E FOTOS
  // ----------------------------------------------------
  const POPULAR_COLORS = [
    { name: 'Azul', hex: '#1e3a8a' },
    { name: 'Cinza', hex: '#64748b' },
    { name: 'Preto', hex: '#171717' },
    { name: 'Off-White', hex: '#f8fafc' },
    { name: 'Bege', hex: '#d4b996' },
    { name: 'Vinho', hex: '#581825' },
    { name: 'Terracota', hex: '#c2410c' },
    { name: 'Verde Militar', hex: '#3f6212' },
    { name: 'Rosa Seco', hex: '#be185d' }
  ];

  const SIZE_PRESETS = {
    standard_women: ['38 - P', '40 - M', '42 - G', '44 - GG'],
    letters: ['PP', 'P', 'M', 'G', 'GG'],
    numbers: ['36', '38', '40', '42', '44', '46'],
    single: ['Único']
  };

  const handleAddColor = (name = 'Nova Cor', hex = '#171717') => {
    const lastColor = productColors[productColors.length - 1];
    const initialSizes = lastColor?.sizes?.length 
      ? lastColor.sizes.map(s => ({ size: s.size, stock: 0 }))
      : [
          { size: '38 - P', stock: 0 },
          { size: '40 - M', stock: 0 },
          { size: '42 - G', stock: 0 },
          { size: '44 - GG', stock: 0 }
        ];

    setProductColors(prev => [
      ...prev,
      {
        id: Date.now(),
        name,
        hex,
        image_url: '',
        isUploading: false,
        newSizeInput: '',
        sizes: initialSizes
      }
    ]);
  };

  const handleRemoveColor = (colorId) => {
    if (productColors.length <= 1) {
      alert('O produto precisa ter pelo menos 1 cor cadastrada.');
      return;
    }
    setProductColors(prev => prev.filter(c => c.id !== colorId));
  };

  const handleUpdateColorField = (colorId, field, value) => {
    setProductColors(prev => prev.map(c => c.id === colorId ? { ...c, [field]: value } : c));
  };

  const handleUploadColorImage = async (colorId, file) => {
    if (!file) return;
    setProductColors(prev => prev.map(c => c.id === colorId ? { ...c, isUploading: true } : c));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProductColors(prev => prev.map(c => c.id === colorId ? { ...c, image_url: data.url, isUploading: false } : c));
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao enviar imagem.');
        setProductColors(prev => prev.map(c => c.id === colorId ? { ...c, isUploading: false } : c));
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao enviar arquivo.');
      setProductColors(prev => prev.map(c => c.id === colorId ? { ...c, isUploading: false } : c));
    }
  };

  const handleApplySizePreset = (colorId, presetKey) => {
    const preset = SIZE_PRESETS[presetKey] || [];
    setProductColors(prev => prev.map(c => {
      if (c.id === colorId) {
        return {
          ...c,
          sizes: preset.map(sz => ({ size: sz, stock: 0 }))
        };
      }
      return c;
    }));
  };

  const handleAddCustomSize = (colorId) => {
    setProductColors(prev => prev.map(c => {
      if (c.id === colorId && c.newSizeInput && c.newSizeInput.trim()) {
        const sz = c.newSizeInput.trim().toUpperCase();
        if (c.sizes.some(s => s.size === sz)) {
          alert('Este tamanho já foi adicionado para esta cor.');
          return c;
        }
        return {
          ...c,
          sizes: [...c.sizes, { size: sz, stock: 0 }],
          newSizeInput: ''
        };
      }
      return c;
    }));
  };

  const handleRemoveSize = (colorId, sizeIndex) => {
    setProductColors(prev => prev.map(c => {
      if (c.id === colorId) {
        return {
          ...c,
          sizes: c.sizes.filter((_, idx) => idx !== sizeIndex)
        };
      }
      return c;
    }));
  };

  const handleUpdateStock = (colorId, sizeIndex, stockVal) => {
    setProductColors(prev => prev.map(c => {
      if (c.id === colorId) {
        const updatedSizes = [...c.sizes];
        updatedSizes[sizeIndex] = {
          ...updatedSizes[sizeIndex],
          stock: Math.max(0, parseInt(stockVal) || 0)
        };
        return { ...c, sizes: updatedSizes };
      }
      return c;
    }));
  };

  const handleOpenNewProduct = () => {
    setProductForm({
      name: '',
      category_id: categories[0]?.id || 1,
      short_description: '',
      description: '',
      base_price: '',
      sale_price: '',
      sku: `BMI-PROD-${Date.now().toString().slice(-4)}`,
      status: 'published',
      is_featured: false,
      is_new: true,
      is_bestseller: false
    });
    setProductColors([
      {
        id: Date.now(),
        name: 'Azul',
        hex: '#1e3a8a',
        image_url: '',
        isUploading: false,
        newSizeInput: '',
        sizes: [
          { size: '38 - P', stock: 5 },
          { size: '40 - M', stock: 8 },
          { size: '42 - G', stock: 4 },
          { size: '44 - GG', stock: 2 }
        ]
      }
    ]);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.base_price || !productForm.sku) {
      alert('Preencha os campos obrigatórios (Nome, Preço e SKU).');
      return;
    }

    if (productColors.length === 0) {
      alert('Adicione pelo menos uma cor com seus tamanhos para o produto.');
      return;
    }

    for (const c of productColors) {
      if (!c.name || !c.name.trim()) {
        alert('Dê um nome para todas as cores cadastradas (ex: Azul, Cinza).');
        return;
      }
      if (!c.sizes || c.sizes.length === 0) {
        alert(`A cor "${c.name}" precisa ter pelo menos um tamanho cadastrado.`);
        return;
      }
    }

    // Compile images: first color image is primary
    const images = [];
    productColors.forEach((c, idx) => {
      if (c.image_url) {
        images.push({
          image_url: c.image_url,
          color_name: c.name.trim(),
          is_primary: idx === 0
        });
      }
    });

    // Compile variants
    const variants = [];
    productColors.forEach(c => {
      c.sizes.forEach(s => {
        const cleanSize = s.size.replace(/[^A-Za-z0-9]/g, '');
        variants.push({
          color_name: c.name.trim(),
          color_hex: c.hex || '#171717',
          size: s.size.trim(),
          sku: `${productForm.sku}-${c.name.trim().slice(0, 3).toUpperCase()}-${cleanSize}`,
          stock_quantity: parseInt(s.stock) || 0,
          image_url: c.image_url || null
        });
      });
    });

    try {
      const payload = {
        ...productForm,
        images,
        variants
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowProductModal(false);
        fetchTabData('produtos');
        alert('Produto com foto por cor e matriz de tamanhos cadastrado com sucesso!');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao cadastrar produto.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor.');
    }
  };

  // Open variant matrix editor
  const handleOpenVariantEditor = async (product) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVariantModalProduct(data);
        const stockMap = {};
        data.variants.forEach(v => { stockMap[v.id] = v.stock_quantity; });
        setVariantAdjustmentStock(stockMap);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateVariantStock = async (variantId) => {
    try {
      const newStock = variantAdjustmentStock[variantId];
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock_quantity: newStock })
      });
      if (res.ok) {
        alert('Estoque da variante atualizado!');
        fetchTabData('produtos');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // ORDER STATUS HANDLERS
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          order_status: newStatus,
          payment_status: newPaymentStatus,
          tracking_code: trackingInput || undefined
        })
      });
      if (res.ok) {
        fetchTabData('pedidos');
        if (selectedOrder) {
          const updatedRes = await fetch(`/api/admin/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (updatedRes.ok) {
            const data = await updatedRes.json();
            setSelectedOrder(data.order);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // COUPON HANDLERS
  // ----------------------------------------------------
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setShowCouponModal(false);
        fetchTabData('cupons');
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar cupom.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTabData('cupons');
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // CATEGORIES HANDLERS (Update Photo & Featured)
  // ----------------------------------------------------
  const handleSaveCategoryPhoto = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: categoryImageUrl,
          name: editingCategory.name,
          is_featured: editingCategory.is_featured
        })
      });

      if (res.ok) {
        setEditingCategory(null);
        fetchTabData('categorias');
      } else {
        alert('Erro ao atualizar foto da categoria.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // INSTAGRAM POSTS HANDLERS
  // ----------------------------------------------------
  const handleCreateInstagramPost = async (e) => {
    e.preventDefault();
    if (!igForm.image_url) return;

    try {
      const res = await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(igForm)
      });

      if (res.ok) {
        setShowInstagramModal(false);
        setIgForm({ image_url: '', post_url: '', caption: '' });
        fetchTabData('instagram');
      } else {
        alert('Erro ao salvar post do Instagram.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInstagramPost = async (id) => {
    if (!confirm('Deseja remover esta foto do feed do Instagram?')) return;
    try {
      const res = await fetch(`/api/admin/instagram/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTabData('instagram');
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // SETTINGS HANDLER
  // ----------------------------------------------------
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setSettingsSavedMsg(true);
        refreshSettings();
        setTimeout(() => setSettingsSavedMsg(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 pb-20">
      
      {/* Top Admin Header Bar */}
      <div className="bg-brand-900 text-white border-b border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-serif text-xl tracking-wider font-bold">BARBARA</span>
            <span className="px-2.5 py-0.5 bg-brand-wine text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              Painel Administrativo
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-brand-300 hidden sm:inline">
              Operador: <strong>{user.name}</strong> ({user.role})
            </span>
            <button
              onClick={() => onNavigate('home')}
              className="px-3 py-1.5 bg-brand-800 hover:bg-brand-700 text-brand-200 text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Loja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-brand-200 sticky top-20 z-30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 overflow-x-auto py-2 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'produtos', label: 'Produtos & Variantes', icon: ShoppingBag },
              { id: 'categorias', label: 'Categorias em Foco', icon: Grid },
              { id: 'instagram', label: 'Feed do Instagram', icon: Instagram },
              { id: 'pedidos', label: 'Pedidos', icon: Package },
              { id: 'clientes', label: 'Clientes (LGPD)', icon: Users },
              { id: 'cupons', label: 'Cupons', icon: Tag },
              { id: 'configuracoes', label: 'Configurações da Loja', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3 rounded-lg flex items-center space-x-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-brand-wine text-white shadow-sm' 
                      : 'text-brand-700 hover:bg-brand-100/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================================================== */}
        {/* TAB 1: DASHBOARD                                     */}
        {/* ==================================================== */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-500 font-semibold uppercase tracking-wider">Vendas do Mês</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-900 mt-0.5">
                    {formatBRL(dashboardData.metrics.month_sales)}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-500 font-semibold uppercase tracking-wider">Total de Pedidos</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-900 mt-0.5">
                    {dashboardData.metrics.total_orders}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-500 font-semibold uppercase tracking-wider">Pedidos Pendentes</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">
                    {dashboardData.metrics.pending_orders}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft flex items-center space-x-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-brand-500 font-semibold uppercase tracking-wider">Ticket Médio</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-900 mt-0.5">
                    {formatBRL(dashboardData.metrics.average_ticket)}
                  </h3>
                </div>
              </div>

            </div>

            {/* Inventory Alerts (Low stock & Out of stock) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-100">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-serif text-base font-bold">Alertas de Estoque Baixo (≤ 2 un.)</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                    {dashboardData.metrics.low_stock_variants} variantes
                  </span>
                </div>

                <div className="divide-y divide-brand-100 max-h-56 overflow-y-auto">
                  {dashboardData.low_stock_list.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-brand-900 block">{item.product_name}</strong>
                        <span className="text-[11px] text-brand-500">{item.color_name} • Tam: <strong>{item.size}</strong> • SKU: {item.sku}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                        item.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {item.stock_quantity === 0 ? 'Esgotado' : `${item.stock_quantity} un.`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-100">
                  <div className="flex items-center space-x-2 text-brand-900">
                    <TrendingUp className="w-5 h-5 text-brand-wine" />
                    <h4 className="font-serif text-base font-bold">Produtos Mais Vendidos</h4>
                  </div>
                </div>

                <div className="divide-y divide-brand-100 max-h-56 overflow-y-auto">
                  {dashboardData.top_products.length === 0 ? (
                    <p className="text-xs text-brand-500 py-4 text-center">Nenhuma venda registrada ainda.</p>
                  ) : (
                    dashboardData.top_products.map((p, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-brand-900 block">{p.product_name}</strong>
                          <span className="text-[11px] text-brand-500">SKU: {p.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-brand-wine">{p.total_sold} un. vendidas</span>
                          <span className="block text-[11px] text-brand-600">{formatBRL(p.total_revenue)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Recent Orders table */}
            <div className="bg-white rounded-2xl border border-brand-200 p-6 shadow-soft space-y-4">
              <h4 className="font-serif text-base font-bold text-brand-900">Últimos Pedidos Recebidos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-50 text-brand-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">Pedido</th>
                      <th className="py-2.5 px-4">Cliente</th>
                      <th className="py-2.5 px-4">Data</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {dashboardData.recent_orders.map(o => (
                      <tr key={o.id} className="hover:bg-brand-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-brand-wine">{o.order_number}</td>
                        <td className="py-2.5 px-4 font-medium text-brand-900">{o.customer_name}</td>
                        <td className="py-2.5 px-4 text-brand-500">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded font-semibold text-[10px]">
                            {o.order_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-brand-900">{formatBRL(o.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: PRODUTOS & MATRIZ DE VARIANTES                */}
        {/* ==================================================== */}
        {activeTab === 'produtos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-900">Catálogo de Produtos</h2>
                <p className="text-xs text-brand-500">Gerencie fotos, preços, variantes de cores/tamanhos e estoque unitário</p>
              </div>

              <button
                onClick={handleOpenNewProduct}
                className="px-4 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-sm hover:bg-brand-wine-dark transition-colors flex items-center space-x-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto com Variantes</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-brand-200 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-100 text-brand-900 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Imagem</th>
                      <th className="py-3 px-4">Produto & SKU</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Preço</th>
                      <th className="py-3 px-4">Variantes</th>
                      <th className="py-3 px-4">Estoque Total</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-brand-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <img src={prod.primary_image} alt="" className="w-10 h-12 object-cover rounded bg-brand-100 border border-brand-200" />
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-brand-900 block">{prod.name}</strong>
                          <span className="text-[11px] font-mono text-brand-500">{prod.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-brand-700">{prod.category_name}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-brand-900">{formatBRL(prod.sale_price || prod.base_price)}</span>
                          {prod.sale_price && (
                            <span className="block text-[10px] text-brand-400 line-through">{formatBRL(prod.base_price)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-brand-100 text-brand-800 font-semibold rounded text-[11px]">
                            {prod.variants_count} combinações
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${prod.total_stock === 0 ? 'text-red-600' : 'text-brand-900'}`}>
                            {prod.total_stock} un.
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenVariantEditor(prod)}
                            className="px-3 py-1.5 bg-brand-50 hover:bg-brand-wine hover:text-white border border-brand-300 text-brand-800 font-semibold rounded-lg text-xs transition-colors inline-flex items-center space-x-1"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Gerenciar Estoque / Variantes</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: CATEGORIAS EM FOCO (HOMEPAGE)                   */}
        {/* ==================================================== */}
        {activeTab === 'categorias' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-900">Categorias em Foco (Homepage & Navegação)</h2>
              <p className="text-xs text-brand-500">Altere as fotos dos cards, a ordem e o destaque das categorias que aparecem na página inicial</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-soft flex flex-col justify-between">
                  <div className="aspect-[4/5] bg-brand-100 relative overflow-hidden group">
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cat.is_featured ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cat.is_featured ? 'Em Destaque na Home' : 'Apenas no Menu'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-brand-900">{cat.name}</h4>
                      <p className="text-[11px] text-brand-500 line-clamp-1">{cat.description || 'Sem descrição'}</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryImageUrl(cat.image_url);
                      }}
                      className="w-full py-2 bg-brand-50 hover:bg-brand-wine hover:text-white border border-brand-300 text-brand-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Trocar Foto / Editar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB: FEED DO INSTAGRAM (@barbaramodainteligente)     */}
        {/* ==================================================== */}
        {activeTab === 'instagram' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-900">Feed Oficial do Instagram</h2>
                <p className="text-xs text-brand-500">Adicione as fotos reais mais recentes postadas no @barbaramodainteligente para atualizar a vitrine</p>
              </div>

              <button
                onClick={() => {
                  setIgForm({ image_url: '', post_url: 'https://instagram.com/barbaramodainteligente', caption: '' });
                  setShowInstagramModal(true);
                }}
                className="px-4 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-sm hover:bg-brand-wine-dark transition-colors flex items-center space-x-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Foto do Instagram</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {instagramPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-soft flex flex-col justify-between">
                  <div className="aspect-square bg-brand-100 relative group overflow-hidden">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-brand-wine/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <ExternalLink className="w-6 h-6" />
                    </a>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-[11px] text-brand-700 line-clamp-2 leading-relaxed">
                      {post.caption || 'Sem legenda'}
                    </p>

                    <div className="pt-2 border-t border-brand-100 flex items-center justify-between">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand-wine font-semibold hover:underline flex items-center space-x-1"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>Ver Post</span>
                      </a>

                      <button
                        onClick={() => handleDeleteInstagramPost(post.id)}
                        className="text-brand-400 hover:text-red-600 transition-colors p-1"
                        title="Remover do feed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: PEDIDOS                                       */}
        {/* ==================================================== */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-900">Gestão de Pedidos</h2>
                <p className="text-xs text-brand-500">Consulte, atualize status de expedição e registre rastreios</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-white border border-brand-300 rounded-lg p-2 text-xs text-brand-900"
                >
                  <option value="">Todos os status</option>
                  <option value="pending">Aguardando Pagamento</option>
                  <option value="processing">Em Separação</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>

                <button
                  onClick={() => fetchTabData('pedidos')}
                  className="px-3 py-2 bg-brand-800 text-white rounded-lg text-xs"
                >
                  Atualizar
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-brand-200 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-100 text-brand-900 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Nº Pedido</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Pagamento</th>
                      <th className="py-3 px-4">Status Operacional</th>
                      <th className="py-3 px-4">Valor Total</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-brand-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-wine">{order.order_number}</td>
                        <td className="py-3 px-4">
                          <strong className="text-brand-900 block">{order.customer_name}</strong>
                          <span className="text-[11px] text-brand-500">{order.customer_email}</span>
                        </td>
                        <td className="py-3 px-4 text-brand-500">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.payment_status === 'paid' ? 'Pago' : 'Pendente'} ({order.payment_method})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded font-semibold text-[11px]">
                            {order.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-900">{formatBRL(order.total_amount)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/admin/orders/${order.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                const d = await res.json();
                                setSelectedOrder(d.order);
                                setTrackingInput(d.order.tracking_code || '');
                              }
                            }}
                            className="px-3 py-1.5 bg-brand-900 text-white font-semibold rounded-lg text-xs hover:bg-brand-wine transition-colors"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: CLIENTES (LGPD)                               */}
        {/* ==================================================== */}
        {activeTab === 'clientes' && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-brand-900">Base de Clientes (LGPD)</h2>
            <div className="bg-white rounded-2xl border border-brand-200 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-brand-100 text-brand-900 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Nome do Cliente</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Telefone</th>
                      <th className="py-3 px-4">Pedidos Realizados</th>
                      <th className="py-3 px-4">Total Gasto</th>
                      <th className="py-3 px-4">Data Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-100">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-brand-50/60">
                        <td className="py-3 px-4 font-bold text-brand-900">{c.name}</td>
                        <td className="py-3 px-4 text-brand-700">{c.email}</td>
                        <td className="py-3 px-4 text-brand-600">{c.phone || '-'}</td>
                        <td className="py-3 px-4 font-bold text-brand-900">{c.total_orders}</td>
                        <td className="py-3 px-4 font-bold text-brand-wine">{formatBRL(c.total_spent)}</td>
                        <td className="py-3 px-4 text-brand-500">{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: CUPONS & PROMOÇÕES                            */}
        {/* ==================================================== */}
        {activeTab === 'cupons' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-900">Cupons de Desconto</h2>
                <p className="text-xs text-brand-500">Crie regras de desconto percentual ou fixo</p>
              </div>
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2 bg-brand-wine text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 hover:bg-brand-wine-dark"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cupom</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-brand-wine px-2 py-0.5 bg-brand-wine/10 rounded">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>

                  <p className="text-xs text-brand-800 font-semibold">
                    Desconto: {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatBRL(c.discount_value)}
                  </p>
                  <p className="text-[11px] text-brand-500">
                    Compra mínima: {c.min_spend > 0 ? formatBRL(c.min_spend) : 'Sem valor mínimo'}
                  </p>
                  <p className="text-[11px] text-brand-500">
                    Utilizações: {c.current_usage} {c.max_usage > 0 ? `/ ${c.max_usage}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: CONFIGURAÇÕES DA LOJA & HOMEPAGE              */}
        {/* ==================================================== */}
        {activeTab === 'configuracoes' && (
          <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-soft space-y-6 animate-fadeIn max-w-4xl">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-900">Configurações Gerais da Loja</h2>
              <p className="text-xs text-brand-500">Edite dados de atendimento, WhatsApp, banners e endereço sem alterar código</p>
            </div>

            {settingsSavedMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Configurações salvas com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              
              {/* Canais de Atendimento */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px] pb-2 border-b">
                  Canais de Atendimento & Redes Sociais
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">WhatsApp para Atendimento (DDI+DDD+Número)</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp_number || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Telefone Exibido</label>
                    <input
                      type="text"
                      value={settingsForm.phone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Instagram (@usuario)</label>
                    <input
                      type="text"
                      value={settingsForm.instagram_handle || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagram_handle: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Link do Perfil no Instagram</label>
                    <input
                      type="url"
                      value={settingsForm.instagram_url || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagram_url: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Localização & Google */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px] pb-2 border-b">
                  Endereço & Google Meu Negócio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={settingsForm.address || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Horário de Funcionamento</label>
                    <input
                      type="text"
                      value={settingsForm.business_hours || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, business_hours: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">URL de Incorporação do Google Maps (iframe src)</label>
                    <input
                      type="text"
                      value={settingsForm.google_maps_embed || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, google_maps_embed: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Faixa Superior e Hero Banner */}
              <div className="space-y-4">
                <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px] pb-2 border-b">
                  Faixa Superior & Banner Principal
                </h4>
                <div>
                  <label className="block font-semibold mb-1">Texto da Faixa Superior de Benefícios</label>
                  <input
                    type="text"
                    value={settingsForm.announcement_bar || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement_bar: e.target.value })}
                    className="w-full border border-brand-300 rounded-lg p-2.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">Título do Hero Banner</label>
                    <input
                      type="text"
                      value={settingsForm.hero_title || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">Subtítulo do Hero Banner</label>
                    <textarea
                      rows={2}
                      value={settingsForm.hero_subtitle || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">URL da Imagem do Hero Banner</label>
                    <input
                      type="url"
                      value={settingsForm.hero_image || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_image: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2.5"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-brand-wine text-white font-bold uppercase tracking-wider rounded-xl hover:bg-brand-wine-dark"
              >
                Salvar Configurações
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* MODAL 1: CRIAR NOVO PRODUTO COM FOTO POR COR E VARIANTES */}
      {/* ==================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProductModal(false)} />
          <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
            <div className="relative w-full max-w-5xl bg-white rounded-3xl p-6 sm:p-8 shadow-elevated z-50 space-y-6">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-200">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-900">
                    Novo Produto: Cores, Fotos & Matriz de Tamanhos
                  </h3>
                  <p className="text-xs text-brand-600 mt-1">
                    Cadastre a peça com fotos reais de cada cor e estoque individual por tamanho (38/P, 40/M, etc.).
                  </p>
                </div>
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="p-2 text-brand-400 hover:text-brand-900 rounded-full hover:bg-brand-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-2">
                
                {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS DA PEÇA */}
                <div className="bg-brand-50/40 p-5 rounded-2xl border border-brand-200 space-y-4">
                  <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-brand-wine text-white inline-flex items-center justify-center text-[10px]">1</span>
                    <span>Informações Gerais da Peça</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-brand-900">Nome do Produto *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Vestido Midi Canelado Aurora"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-brand-900">Categoria *</label>
                      <select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: parseInt(e.target.value) })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-brand-wine"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-brand-900">Preço Normal (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Ex: 289.90"
                        value={productForm.base_price}
                        onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white font-mono focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-brand-900">Preço Promocional (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Opcional (Ex: 249.90)"
                        value={productForm.sale_price}
                        onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white font-mono focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-brand-900">SKU Base *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: BMI-VEST-01"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white font-mono uppercase focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold mb-1 text-brand-900">Descrição Curta</label>
                      <input
                        type="text"
                        placeholder="Ex: Vestido midi em malha canelada premium com caimento fluido e toque suave."
                        value={productForm.short_description}
                        onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold mb-1 text-brand-900">Descrição Detalhada e Caimento</label>
                      <textarea
                        rows={2}
                        placeholder="Detalhes de composição, caimento, dicas de looks e cuidados com a lavagem..."
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full border border-brand-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-brand-wine"
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 2: CORES, FOTOS REAIS & GRADE DE ESTOQUE POR TAMANHO */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px] flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-brand-wine text-white inline-flex items-center justify-center text-[10px]">2</span>
                        <span>Cores, Fotos & Grade de Estoque</span>
                      </h4>
                      <p className="text-[11px] text-brand-500 mt-0.5">
                        Para cada cor, adicione a foto da peça e defina as quantidades por tamanho.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddColor('Nova Cor', '#1e3a8a')}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-wine text-white rounded-lg font-semibold text-xs hover:bg-brand-wine-dark transition-colors self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Mais Uma Cor</span>
                    </button>
                  </div>

                  {/* CARDS DE COR */}
                  <div className="space-y-4">
                    {productColors.map((color, colorIdx) => (
                      <div 
                        key={color.id} 
                        className="bg-white border-2 border-brand-200 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
                      >
                        {/* CABEÇALHO DO CARD DE COR */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-3">
                          <div className="flex items-center space-x-3">
                            <span 
                              className="w-6 h-6 rounded-full border border-black/20 shadow-inner shrink-0" 
                              style={{ backgroundColor: color.hex }}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-brand-900 text-sm">Cor #{colorIdx + 1}:</span>
                                <input
                                  type="text"
                                  value={color.name}
                                  onChange={(e) => handleUpdateColorField(color.id, 'name', e.target.value)}
                                  placeholder="Ex: Azul Marinho"
                                  className="font-bold text-brand-900 border border-brand-300 rounded-lg px-2.5 py-1 text-xs w-36 focus:ring-1 focus:ring-brand-wine"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sugestões de Cores Rápidas */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-brand-500 font-semibold mr-1">Sugestões:</span>
                            {POPULAR_COLORS.slice(0, 7).map(pop => (
                              <button
                                key={pop.name}
                                type="button"
                                onClick={() => {
                                  handleUpdateColorField(color.id, 'name', pop.name);
                                  handleUpdateColorField(color.id, 'hex', pop.hex);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] border border-brand-200 hover:border-brand-900 bg-brand-50/60 font-medium flex items-center space-x-1"
                              >
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pop.hex }} />
                                <span>{pop.name}</span>
                              </button>
                            ))}

                            {productColors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColor(color.id)}
                                className="ml-2 text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                title="Excluir esta cor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* CORPO DO CARD DE COR (2 COLUNAS: FOTO & GRADE) */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          
                          {/* COLUNA 1: FOTO DA PEÇA NESSA COR */}
                          <div className="md:col-span-4 bg-brand-50/50 p-4 rounded-xl border border-brand-200 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="font-semibold text-brand-900 text-xs flex items-center space-x-1.5">
                                  <ImageIcon className="w-4 h-4 text-brand-wine" />
                                  <span>Foto da Peça ({color.name})</span>
                                </label>
                              </div>

                              {color.image_url ? (
                                <div className="space-y-2">
                                  <div className="w-full aspect-[3/4] max-h-52 bg-white rounded-xl overflow-hidden border border-brand-200 shadow-sm relative group">
                                    <img 
                                      src={color.image_url} 
                                      alt={color.name} 
                                      className="w-full h-full object-cover object-top" 
                                    />
                                    <div className="absolute top-2 left-2 bg-brand-wine text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                      Foto: {color.name}
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <label className="flex-1 text-center px-2 py-1.5 bg-white border border-brand-300 hover:border-brand-900 rounded-lg font-semibold text-[11px] cursor-pointer text-brand-800">
                                      Trocar Foto
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUploadColorImage(color.id, e.target.files[0])}
                                        className="hidden"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateColorField(color.id, 'image_url', '')}
                                      className="px-2 py-1.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-[11px] font-semibold"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Upload Button */}
                                  <label className="w-full aspect-[3/4] max-h-48 border-2 border-dashed border-brand-300 hover:border-brand-wine rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer bg-white transition-colors text-center group">
                                    <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-wine mb-2 group-hover:scale-110 transition-transform">
                                      <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-brand-900 text-xs">
                                      {color.isUploading ? 'Enviando imagem...' : 'Enviar Foto do Dispositivo'}
                                    </span>
                                    <span className="text-[10px] text-brand-500 mt-1">
                                      JPG, PNG ou WEBP da cor {color.name}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={color.isUploading}
                                      onChange={(e) => handleUploadColorImage(color.id, e.target.files[0])}
                                      className="hidden"
                                    />
                                  </label>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-brand-600 mb-1">Ou cole a URL direta da foto:</label>
                                    <input
                                      type="url"
                                      placeholder="https://..."
                                      value={color.image_url}
                                      onChange={(e) => handleUpdateColorField(color.id, 'image_url', e.target.value)}
                                      className="w-full border border-brand-300 rounded-lg p-2 text-[11px] font-mono bg-white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* COLUNA 2: GRADE DE TAMANHOS E ESTOQUE INDIVIDUAL */}
                          <div className="md:col-span-8 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="font-semibold text-brand-900 text-xs">
                                  Grade de Tamanhos & Estoque ({color.name})
                                </label>
                                <p className="text-[10px] text-brand-500">
                                  Defina as unidades disponíveis para cada tamanho nesta cor:
                                </p>
                              </div>

                              {/* Atalhos de Preset de Tamanho */}
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleApplySizePreset(color.id, 'standard_women')}
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-[10px] font-bold text-brand-900"
                                  title="38 - P, 40 - M, 42 - G, 44 - GG"
                                >
                                  + 38/P ao 44/GG
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplySizePreset(color.id, 'letters')}
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-[10px] font-bold text-brand-900"
                                  title="PP, P, M, G, GG"
                                >
                                  + PP ao GG
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplySizePreset(color.id, 'numbers')}
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-[10px] font-bold text-brand-900"
                                  title="36, 38, 40, 42, 44, 46"
                                >
                                  + Numeração
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplySizePreset(color.id, 'single')}
                                  className="px-2 py-1 rounded bg-brand-100 hover:bg-brand-200 text-[10px] font-bold text-brand-900"
                                  title="Tamanho Único"
                                >
                                  + Único
                                </button>
                              </div>
                            </div>

                            {/* Campo para Adicionar Tamanho Personalizado */}
                            <div className="flex items-center space-x-2 pt-1">
                              <input
                                type="text"
                                placeholder="Digite outro tamanho (ex: 46 - XG ou 36)"
                                value={color.newSizeInput || ''}
                                onChange={(e) => handleUpdateColorField(color.id, 'newSizeInput', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(color.id); } }}
                                className="flex-1 border border-brand-300 rounded-lg px-3 py-1.5 text-xs bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddCustomSize(color.id)}
                                className="px-3 py-1.5 bg-brand-800 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 shrink-0"
                              >
                                + Adicionar Tamanho
                              </button>
                            </div>

                            {/* GRID DE TAMANHOS COM ESTOQUE INDIVIDUAL */}
                            {color.sizes.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                                {color.sizes.map((s, sIdx) => (
                                  <div 
                                    key={sIdx} 
                                    className="p-3 bg-white border border-brand-200 rounded-xl shadow-soft flex flex-col justify-between hover:border-brand-400 transition-colors"
                                  >
                                    <div className="flex items-center justify-between pb-1.5 border-b border-brand-100">
                                      <span className="font-bold text-brand-900 text-xs bg-brand-100 px-2 py-0.5 rounded">
                                        {s.size}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSize(color.id, sIdx)}
                                        className="text-brand-400 hover:text-red-600 p-0.5"
                                        title="Remover este tamanho"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-1.5">
                                      <label className="text-[10px] text-brand-600 font-semibold shrink-0">Estoque:</label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={s.stock}
                                        onChange={(e) => handleUpdateStock(color.id, sIdx, e.target.value)}
                                        className="w-full border border-brand-300 rounded p-1 text-center font-bold text-xs focus:ring-1 focus:ring-brand-wine"
                                      />
                                      <span className="text-[10px] text-brand-400">un.</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-brand-50 rounded-xl text-center text-xs text-brand-500 border border-dashed border-brand-200">
                                Nenhum tamanho cadastrado para a cor {color.name}. Use os atalhos acima ou digite um tamanho.
                              </div>
                            )}

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-brand-200 gap-3">
                  <div className="text-xs text-brand-600">
                    Resumo: <strong>{productColors.length} {productColors.length === 1 ? 'cor' : 'cores'}</strong> •{' '}
                    <strong>{productColors.reduce((acc, c) => acc + c.sizes.length, 0)} variações</strong> •{' '}
                    Estoque total:{' '}
                    <strong>
                      {productColors.reduce((acc, c) => acc + c.sizes.reduce((sAcc, s) => sAcc + (parseInt(s.stock) || 0), 0), 0)} unidades
                    </strong>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-5 py-2.5 border border-brand-300 rounded-xl hover:bg-brand-50 text-xs font-semibold text-brand-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-2.5 bg-brand-wine hover:bg-brand-wine-dark text-white font-bold rounded-xl text-xs shadow-md transition-all"
                    >
                      Salvar Produto Completo
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: GESTÃO DE ESTOQUE POR VARIANTE              */}
      {/* ==================================================== */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setVariantModalProduct(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-elevated z-50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900">{variantModalProduct.product.name}</h3>
                  <p className="text-xs text-brand-500">Ajuste individual de estoque de cada variante (Cor + Tamanho)</p>
                </div>
                <button onClick={() => setVariantModalProduct(null)}><X className="w-5 h-5" /></button>
              </div>

              <div className="divide-y divide-brand-100 max-h-96 overflow-y-auto pr-1">
                {variantModalProduct.variants.map(v => (
                  <div key={v.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.color_hex }} />
                      <div>
                        <strong className="text-brand-900 block">{v.color_name} • Tam: {v.size}</strong>
                        <span className="text-[10px] text-brand-500 font-mono">SKU: {v.sku}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={variantAdjustmentStock[v.id] ?? v.stock_quantity}
                        onChange={(e) => setVariantAdjustmentStock({
                          ...variantAdjustmentStock,
                          [v.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-16 border border-brand-300 rounded p-1 text-center font-bold"
                      />
                      <button
                        onClick={() => handleUpdateVariantStock(v.id)}
                        className="px-3 py-1 bg-brand-900 hover:bg-brand-wine text-white rounded text-xs font-semibold"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: DETALHES E STATUS DO PEDIDO                 */}
      {/* ==================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-elevated z-50 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-wine">Pedido #{selectedOrder.order_number}</h3>
                  <p className="text-[11px] text-brand-500">{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)}><X className="w-5 h-5" /></button>
              </div>

              {/* Customer info */}
              <div className="p-3 bg-brand-50 rounded-xl space-y-1">
                <p><strong>Cliente:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_email})</p>
                <p><strong>Telefone:</strong> {selectedOrder.customer_phone}</p>
                <p><strong>Endereço:</strong> {JSON.stringify(selectedOrder.shipping_address)}</p>
              </div>

              {/* Items snapshot */}
              <div className="divide-y divide-brand-100 max-h-48 overflow-y-auto">
                {selectedOrder.items?.map(it => (
                  <div key={it.id} className="py-2 flex items-center justify-between">
                    <div>
                      <strong className="text-brand-900 block">{it.product_name}</strong>
                      <span className="text-[11px] text-brand-500">
                        {it.color_name} • Tam: {it.size} • Qtd: {it.quantity}
                      </span>
                    </div>
                    <span className="font-bold">{formatBRL(it.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Tracking code input */}
              <div className="space-y-1 pt-2 border-t">
                <label className="font-semibold block">Código de Rastreamento (Correios / Transportadora)</label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="BR123456789SP"
                  className="w-full border border-brand-300 rounded p-2 font-mono uppercase"
                />
              </div>

              {/* Status Update Actions */}
              <div className="pt-3 border-t flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing', 'paid')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded font-semibold"
                >
                  Confirmar Pagamento & Em Separação
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped', 'paid')}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded font-semibold"
                >
                  Marcar como Enviado
                </button>
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered', 'paid')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded font-semibold"
                >
                  Marcar como Entregue
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deseja cancelar o pedido? O estoque será devolvido automaticamente às variantes.')) {
                      handleUpdateOrderStatus(selectedOrder.id, 'cancelled', 'refunded');
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded font-semibold"
                >
                  Cancelar Pedido & Estornar Estoque
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: NOVO CUPOM                                  */}
      {/* ==================================================== */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCouponModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-elevated z-50 space-y-4 text-xs">
              <h3 className="font-serif text-lg font-bold text-brand-900">Criar Novo Cupom</h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1">Código do Cupom *</label>
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="EX: PROMO15"
                    className="w-full border border-brand-300 rounded p-2 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tipo de Desconto</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full border border-brand-300 rounded p-2"
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Valor do Desconto *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) })}
                    className="w-full border border-brand-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Valor Mínimo de Compra (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={couponForm.min_spend}
                    onChange={(e) => setCouponForm({ ...couponForm, min_spend: parseFloat(e.target.value) })}
                    className="w-full border border-brand-300 rounded p-2"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button type="button" onClick={() => setShowCouponModal(false)} className="px-4 py-2 border rounded">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-brand-wine text-white font-semibold rounded">
                    Criar Cupom
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: EDITAR FOTO DA CATEGORIA                    */}
      {/* ==================================================== */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-elevated z-50 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900">Editar Categoria: {editingCategory.name}</h3>
                  <p className="text-[11px] text-brand-500">Altere a foto que aparece no card da vitrine</p>
                </div>
                <button onClick={() => setEditingCategory(null)}><X className="w-5 h-5 text-brand-400" /></button>
              </div>

              <form onSubmit={handleSaveCategoryPhoto} className="space-y-4">
                {/* Image Preview */}
                <div className="aspect-[4/3] bg-brand-100 rounded-xl overflow-hidden border border-brand-200">
                  <img src={categoryImageUrl} alt="" className="w-full h-full object-cover" />
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL da Imagem de Capa da Categoria *</label>
                  <input
                    type="url"
                    required
                    value={categoryImageUrl}
                    onChange={(e) => setCategoryImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-brand-300 rounded-lg p-2.5 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full border border-brand-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.is_featured === 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, is_featured: e.target.checked ? 1 : 0 })}
                    className="rounded border-brand-300 text-brand-wine"
                  />
                  <span className="font-semibold text-brand-900">Exibir em destaque nos cards da Homepage</span>
                </label>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 border rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-brand-wine text-white font-semibold rounded-lg">
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 6: ADICIONAR FOTO DO INSTAGRAM                 */}
      {/* ==================================================== */}
      {showInstagramModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInstagramModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-elevated z-50 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900">Nova Foto do Instagram</h3>
                  <p className="text-[11px] text-brand-500">Adicione uma publicação real do @barbaramodainteligente</p>
                </div>
                <button onClick={() => setShowInstagramModal(false)}><X className="w-5 h-5 text-brand-400" /></button>
              </div>

              <form onSubmit={handleCreateInstagramPost} className="space-y-4">
                {igForm.image_url && (
                  <div className="aspect-square w-32 mx-auto bg-brand-100 rounded-xl overflow-hidden border border-brand-200">
                    <img src={igForm.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">URL da Imagem da Postagem *</label>
                  <input
                    type="url"
                    required
                    value={igForm.image_url}
                    onChange={(e) => setIgForm({ ...igForm, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-brand-300 rounded-lg p-2.5 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Link Direto da Publicação no Instagram</label>
                  <input
                    type="url"
                    value={igForm.post_url}
                    onChange={(e) => setIgForm({ ...igForm, post_url: e.target.value })}
                    placeholder="https://instagram.com/p/..."
                    className="w-full border border-brand-300 rounded-lg p-2.5 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Legenda Curta / Inspiração do Look</label>
                  <input
                    type="text"
                    value={igForm.caption}
                    onChange={(e) => setIgForm({ ...igForm, caption: e.target.value })}
                    placeholder="Ex: Vestido Chemise linho puro no showroom"
                    className="w-full border border-brand-300 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowInstagramModal(false)} className="px-4 py-2 border rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" className="px-5 py-2 bg-brand-wine text-white font-semibold rounded-lg">
                    Adicionar ao Feed
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
