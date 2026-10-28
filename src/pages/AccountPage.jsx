import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatBRL } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Lock, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';

export default function AccountPage({ initialTab = 'pedidos', onNavigate }) {
  const { user, token, logout, updateProfile, changePassword } = useAuth();
  const { wishlistIds } = useWishlist();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState(null);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState(null);

  // New address state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipient_name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zip_code: '',
    is_default: true
  });

  // Sync initial tab
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load orders and addresses
  useEffect(() => {
    if (!token) return;

    async function loadAccountData() {
      setLoading(true);
      try {
        // Load orders
        const ordersRes = await fetch('/api/orders/my-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (ordersRes.ok) {
          const oData = await ordersRes.json();
          setOrders(oData.orders || []);
        }

        // Load addresses
        const addrRes = await fetch('/api/auth/addresses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (addrRes.ok) {
          const aData = await addrRes.json();
          setAddresses(aData.addresses || []);
        }

        // Load wishlist
        const wishRes = await fetch('/api/products/user/wishlist', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (wishRes.ok) {
          const wData = await wishRes.json();
          setWishlistProducts(wData.wishlist || []);
        }
      } catch (err) {
        console.error('Account data load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Faça login para acessar sua conta</h2>
        <p className="text-xs text-brand-600">Acompanhe seus pedidos, gerencie endereços e salve suas peças favoritas.</p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
        >
          Entrar na Conta
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile(profileName, profilePhone);
      setProfileMsg({ type: 'success', text: 'Dados cadastrais atualizados!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    try {
      await changePassword(currentPass, newPass);
      setPassMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPass('');
      setNewPass('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAddr)
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses([data.address, ...addresses]);
        setShowAddressModal(false);
        setNewAddr({
          recipient_name: '', street: '', number: '', complement: '',
          neighborhood: '', city: '', state: 'SP', zip_code: '', is_default: true
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const res = await fetch(`/api/auth/addresses/${addrId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAddresses(addresses.filter(a => a.id !== addrId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusLabels = {
    pending: { label: 'Aguardando Pagamento', color: 'bg-amber-100 text-amber-800' },
    processing: { label: 'Em Separação', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Enviado / A Caminho', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-brand-wine text-white rounded-full flex items-center justify-center font-serif text-2xl font-bold uppercase shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-brand-900">
              Olá, {user.name}
            </h1>
            <p className="text-xs text-brand-500 mt-0.5">{user.email} • {user.phone || 'Telefone não informado'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 border border-brand-300 text-brand-700 hover:text-red-600 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-brand-200 shadow-soft h-fit">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${
              activeTab === 'pedidos' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Meus Pedidos ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dados')}
            className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${
              activeTab === 'dados' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dados Cadastrais</span>
          </button>

          <button
            onClick={() => setActiveTab('enderecos')}
            className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${
              activeTab === 'enderecos' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Endereços Salvos ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favoritos')}
            className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${
              activeTab === 'favoritos' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favoritos ({wishlistProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seguranca')}
            className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${
              activeTab === 'seguranca' ? 'bg-brand-900 text-white shadow-sm' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Segurança e Senha</span>
          </button>
        </div>

        {/* Tab Content Pane (3 columns) */}
        <div className="lg:col-span-3">
          
          {/* TAB: MEUS PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">Histórico de Pedidos</h2>

              {orders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-brand-200 text-center space-y-4 shadow-soft">
                  <Package className="w-12 h-12 text-brand-300 mx-auto" />
                  <h3 className="font-serif text-base font-bold text-brand-900">Você ainda não realizou nenhum pedido</h3>
                  <button
                    onClick={() => onNavigate('catalog')}
                    className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
                  >
                    Começar a Comprar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const st = statusLabels[order.order_status] || statusLabels.pending;
                    return (
                      <div key={order.id} className="bg-white rounded-2xl border border-brand-200 p-6 shadow-soft space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-brand-100 gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-brand-wine">
                              #{order.order_number}
                            </span>
                            <span className="text-xs text-brand-500 ml-3">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${st.color}`}>
                              {st.label}
                            </span>
                            <span className="text-xs font-bold text-brand-900">
                              {formatBRL(order.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-brand-100">
                          {order.items?.map(it => (
                            <div key={it.id} className="py-2.5 flex space-x-3 items-center text-xs">
                              <img src={it.image_url} alt="" className="w-10 h-12 object-cover rounded bg-brand-100 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-brand-900 truncate">{it.product_name}</p>
                                <p className="text-[11px] text-brand-500">
                                  {it.color_name} • Tam: {it.size} • Qtd: {it.quantity}
                                </p>
                              </div>
                              <span className="font-bold text-brand-900">{formatBRL(it.total_price)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Tracking code if available */}
                        {order.tracking_code && (
                          <div className="p-3 bg-brand-50 rounded-lg text-xs flex items-center justify-between text-brand-800">
                            <span className="flex items-center space-x-1.5">
                              <Truck className="w-4 h-4 text-brand-wine" />
                              <span>Código de Rastreio: <strong>{order.tracking_code}</strong></span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DADOS CADASTRAIS */}
          {activeTab === 'dados' && (
            <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-soft space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">Dados Pessoais</h2>

              {profileMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                  profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail (Login)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-brand-100 border border-brand-200 rounded-lg p-2.5 text-xs text-brand-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine-dark transition-colors"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>
          )}

          {/* TAB: ENDEREÇOS */}
          {activeTab === 'enderecos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-brand-900">Endereços Cadastrados</h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 bg-brand-900 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 hover:bg-brand-wine transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Endereço</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-brand-200 text-center space-y-3">
                  <MapPin className="w-8 h-8 text-brand-400 mx-auto" />
                  <p className="text-xs text-brand-600">Nenhum endereço cadastrado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className="bg-white p-5 rounded-2xl border border-brand-200 shadow-soft space-y-2 relative">
                      <div className="flex justify-between items-start">
                        <strong className="text-xs font-bold text-brand-900">{addr.recipient_name}</strong>
                        {addr.is_default === 1 && (
                          <span className="text-[10px] bg-brand-wine/10 text-brand-wine font-bold px-2 py-0.5 rounded">
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-700">
                        {addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}
                      </p>
                      <p className="text-xs text-brand-500">
                        {addr.neighborhood} • {addr.city} - {addr.state}
                      </p>
                      <p className="text-xs font-mono text-brand-600">CEP: {addr.zip_code}</p>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-red-600 hover:underline pt-2 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover endereço</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FAVORITOS */}
          {activeTab === 'favoritos' && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">Minhas Peças Favoritas</h2>
              {wishlistProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-brand-200 text-center space-y-3 shadow-soft">
                  <Heart className="w-8 h-8 text-brand-300 mx-auto" />
                  <p className="text-xs text-brand-600">Você ainda não favoritou nenhuma peça.</p>
                  <button
                    onClick={() => onNavigate('catalog')}
                    className="px-6 py-2 bg-brand-wine text-white text-xs font-semibold rounded-lg"
                  >
                    Explorar Coleção
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {wishlistProducts.map(prod => (
                    <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-soft space-y-6">
              <h2 className="font-serif text-xl font-bold text-brand-900">Alterar Senha</h2>

              {passMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                  passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}>
                  {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Senha Atual *</label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Nova Senha (mínimo 6 caracteres) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine-dark transition-colors"
                >
                  Atualizar Senha
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* New Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddressModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-elevated z-50 space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-900">Cadastrar Novo Endereço</h3>
              <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nome do Destinatário</label>
                  <input
                    type="text"
                    required
                    value={newAddr.recipient_name}
                    onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                    className="w-full border border-brand-300 rounded-lg p-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">CEP</label>
                    <input
                      type="text"
                      required
                      value={newAddr.zip_code}
                      onChange={(e) => setNewAddr({ ...newAddr, zip_code: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold mb-1">Logradouro / Rua</label>
                    <input
                      type="text"
                      required
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Número</label>
                    <input
                      type="text"
                      required
                      value={newAddr.number}
                      onChange={(e) => setNewAddr({ ...newAddr, number: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-semibold mb-1">Complemento</label>
                    <input
                      type="text"
                      value={newAddr.complement}
                      onChange={(e) => setNewAddr({ ...newAddr, complement: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold mb-1">Bairro</label>
                    <input
                      type="text"
                      required
                      value={newAddr.neighborhood}
                      onChange={(e) => setNewAddr({ ...newAddr, neighborhood: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Cidade</label>
                    <input
                      type="text"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full border border-brand-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">UF</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value.toUpperCase() })}
                      className="w-full border border-brand-300 rounded-lg p-2 text-center"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-wine text-white rounded-lg font-semibold"
                  >
                    Salvar
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
