import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart, formatBRL } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  MapPin, 
  Lock,
  MessageCircle,
  QrCode,
  FileText
} from 'lucide-react';

export default function CheckoutPage({ onNavigate, onOrderSuccess }) {
  const { user } = useAuth();
  const { items, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { settings } = useSettings();

  // Step 1: Customer identification
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Step 2: Shipping address
  const [deliveryType, setDeliveryType] = useState('shipping'); // 'shipping' or 'showroom'
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');

  // Step 3: Shipping method
  const [shippingMethod, setShippingMethod] = useState('pac'); // 'pac', 'sedex', 'showroom'

  // Step 4: Payment method
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix', 'credit_card', 'boleto', 'whatsapp_assisted'

  // Credit card form state
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);

  // Auto-fill address & calculate shipping via CEP
  const handleCepChange = async (value) => {
    const rawVal = value.replace(/\D/g, '');
    let formatted = rawVal;
    if (rawVal.length > 5) {
      formatted = `${rawVal.slice(0, 5)}-${rawVal.slice(5, 8)}`;
    }
    setCep(formatted);

    if (rawVal.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep: rawVal, subtotal })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.address) {
            if (data.address.street) setStreet(data.address.street);
            if (data.address.neighborhood) setNeighborhood(data.address.neighborhood);
            if (data.address.city) setCity(data.address.city);
            if (data.address.state) setState(data.address.state);
          }
          if (data.options) {
            setShippingOptions(data.options);
          }
        }
      } catch (err) {
        console.error('CEP lookup error:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Auto-fill customer if user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // If cart is empty, redirect to catalog
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Sua sacola está vazia</h2>
        <p className="text-xs text-brand-600">Adicione peças à sacola antes de acessar a finalização de compra.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
        >
          Explorar Peças
        </button>
      </div>
    );
  }

  // Shipping cost calculation
  const freeShippingThreshold = settings?.free_shipping_threshold || 299.00;
  const isFreeShipping = subtotal >= freeShippingThreshold;

  let shippingCost = 0;
  if (deliveryType === 'showroom') {
    shippingCost = 0;
  } else if (shippingMethod === 'sedex') {
    shippingCost = 24.90;
  } else if (shippingMethod === 'pac') {
    shippingCost = isFreeShipping ? 0 : 14.90;
  }

  // Pix additional discount (e.g. 10%)
  const pixDiscountPercent = settings?.pix_discount_percent || 10;
  let paymentDiscount = 0;
  if (paymentMethod === 'pix') {
    paymentDiscount = Math.round(((subtotal - discountAmount) * (pixDiscountPercent / 100)) * 100) / 100;
  }

  const finalTotal = Math.max(0, Math.round((subtotal - discountAmount - paymentDiscount + shippingCost) * 100) / 100);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMsg('Por favor, informe seu nome, e-mail e telefone para contato.');
      return;
    }

    if (deliveryType === 'shipping') {
      if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !cep.trim()) {
        setErrorMsg('Por favor, preencha o endereço completo de entrega.');
        return;
      }
    }

    if (paymentMethod === 'credit_card') {
      if (!cardHolder.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setErrorMsg('Preencha todos os dados do cartão de crédito.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const shippingAddressData = deliveryType === 'showroom' ? {
        type: 'retirada',
        address: `Retirada no Showroom Oficial - ${settings?.address || 'Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG'}`
      } : {
        type: 'entrega',
        cep: cep.trim(),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim()
      };

      const payload = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        shipping: {
          method: deliveryType === 'showroom' ? 'retirada' : shippingMethod,
          cost: shippingCost,
          address: shippingAddressData
        },
        items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
        notes: paymentMethod === 'credit_card' ? `Parcelado em ${installments}x de ${formatBRL(finalTotal / installments)}` : null
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${localStorage.getItem('bmi_token')}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar pedido.');
      }

      // Order created successfully!
      clearCart();
      if (onOrderSuccess) {
        onOrderSuccess(data.order, data.paymentDetails);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Checkout Title */}
      <div className="border-b border-brand-200 pb-5">
        <h1 className="font-serif text-3xl font-bold text-brand-900">
          Finalização de Compra
        </h1>
        <p className="text-xs text-brand-600 mt-1 flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ambiente Criptografado e Seguro SSL de 256 bits</span>
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-start space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Checkout Forms (8 columns) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* ETAPA 1: Identificação */}
          <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
              <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <h2 className="font-serif text-lg font-bold text-brand-900">Identificação do Cliente</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-900 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail para Confirmação *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com.br"
                  className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-900 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                />
              </div>
            </div>
          </div>

          {/* ETAPA 2: Endereço ou Retirada */}
          <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
              <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="font-serif text-lg font-bold text-brand-900">Modalidade de Recebimento</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDeliveryType('shipping')}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  deliveryType === 'shipping' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Entrega no Endereço</span>
              </button>

              <button
                type="button"
                onClick={() => { setDeliveryType('showroom'); setShippingMethod('retirada'); }}
                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  deliveryType === 'showroom' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Retirada no Showroom (Grátis)</span>
              </button>
            </div>

            {deliveryType === 'shipping' ? (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-brand-900">CEP *</label>
                    {isLoadingCep && <span className="text-[10px] text-brand-wine animate-pulse">Buscando endereço...</span>}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="37902-304"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 font-mono focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Rua / Logradouro *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Av. Paulista"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Complemento / Apto</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 82, Bloco B"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bela Vista"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Cidade *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-brand-900 mb-1">UF *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 text-center uppercase focus:outline-none focus:border-brand-wine"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 text-xs space-y-1">
                <strong className="text-brand-900 block font-serif">Endereço do Showroom para Retirada:</strong>
                <p className="text-brand-700">{settings?.address || 'Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG'}</p>
                <p className="text-[11px] text-brand-500">Horário: {settings?.business_hours || 'Seg a Sex: 09h às 18h | Sáb: 09h às 17h'}.</p>
              </div>
            )}
          </div>

          {/* ETAPA 3: Opções de Frete (se entrega) */}
          {deliveryType === 'shipping' && (
            <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
                <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="font-serif text-lg font-bold text-brand-900">Prazo e Modalidade de Envio</h2>
              </div>

              <div className="space-y-3">
                <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'pac' ? 'border-brand-wine bg-brand-wine/5 shadow-sm' : 'border-brand-200 hover:border-brand-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'pac'}
                      onChange={() => setShippingMethod('pac')}
                      className="text-brand-wine focus:ring-brand-wine"
                    />
                    <div>
                      <strong className="block text-xs text-brand-900">PAC Econômico</strong>
                      <span className="text-[11px] text-brand-500">Entrega prevista em 4 a 7 dias úteis</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-900">
                    {isFreeShipping ? <span className="text-emerald-700">GRÁTIS</span> : formatBRL(14.90)}
                  </span>
                </label>

                <label className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  shippingMethod === 'sedex' ? 'border-brand-wine bg-brand-wine/5 shadow-sm' : 'border-brand-200 hover:border-brand-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === 'sedex'}
                      onChange={() => setShippingMethod('sedex')}
                      className="text-brand-wine focus:ring-brand-wine"
                    />
                    <div>
                      <strong className="block text-xs text-brand-900">Sedex Expresso</strong>
                      <span className="text-[11px] text-brand-500">Entrega rápida em 1 a 3 dias úteis</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-brand-900">{formatBRL(24.90)}</span>
                </label>
              </div>
            </div>
          )}

          {/* ETAPA 4: Forma de Pagamento */}
          <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
              <span className="w-6 h-6 bg-brand-900 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="font-serif text-lg font-bold text-brand-900">Forma de Pagamento</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center text-center space-y-1 transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>Pix Instantâneo</span>
                <span className="text-[10px] text-emerald-700 font-bold">10% OFF</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center text-center space-y-1 transition-all ${
                  paymentMethod === 'credit_card' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cartão de Crédito</span>
                <span className="text-[10px] text-brand-500">Até 6x sem juros</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('whatsapp_assisted')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center text-center space-y-1 transition-all ${
                  paymentMethod === 'whatsapp_assisted' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Pedido Assistido</span>
                <span className="text-[10px] text-brand-500">Via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('boleto')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center text-center space-y-1 transition-all ${
                  paymentMethod === 'boleto' 
                    ? 'border-brand-wine bg-brand-wine/5 text-brand-wine font-bold shadow-sm' 
                    : 'border-brand-300 text-brand-700 hover:border-brand-400'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Boleto Bancário</span>
                <span className="text-[10px] text-brand-500">Venc. 3 dias</span>
              </button>
            </div>

            {/* Credit Card inputs */}
            {paymentMethod === 'credit_card' && (
              <div className="pt-4 border-t border-brand-100 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Nome Impresso no Cartão *</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="MARIA SILVA"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 uppercase focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Número do Cartão *</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 font-mono focus:outline-none focus:border-brand-wine"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-900 mb-1">Validade (MM/AA) *</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 font-mono focus:outline-none focus:border-brand-wine"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-900 mb-1">CVV / Código de Segurança *</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 font-mono focus:outline-none focus:border-brand-wine"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-900 mb-1">Parcelamento Sem Juros</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className="w-full bg-brand-50/50 border border-brand-300 rounded-lg p-2.5 text-xs text-brand-900 font-medium focus:outline-none focus:border-brand-wine"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num}x de {formatBRL(finalTotal / num)} sem juros
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Pix message */}
            {paymentMethod === 'pix' && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <strong className="block font-bold">Desconto Especial de 10% Aplicado!</strong>
                <p>O código Pix Copia e Cola e o QR Code serão gerados imediatamente na tela de confirmação.</p>
              </div>
            )}

            {/* WhatsApp assisted message */}
            {paymentMethod === 'whatsapp_assisted' && (
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-800 space-y-1">
                <strong className="block font-bold">Modo de Pedido Assistido por Consultora:</strong>
                <p>Seu pedido será registrado em nosso sistema e um link com o resumo de peças, tamanhos e cores será aberto no WhatsApp para atendimento direto com a nossa equipe.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-soft space-y-6 sticky top-28">
            <h3 className="font-serif text-lg font-bold text-brand-900 pb-3 border-b border-brand-100">
              Resumo da Compra
            </h3>

            {/* Items snapshot list */}
            <div className="divide-y divide-brand-100 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.variantId} className="py-3 flex space-x-3 text-xs">
                  <img src={item.imageUrl} alt="" className="w-12 h-14 object-cover rounded-md bg-brand-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-brand-500">
                      {item.color} • Tam: <strong>{item.size}</strong> • Qtd: {item.quantity}
                    </p>
                    <p className="font-bold text-brand-900 mt-0.5">{formatBRL(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="pt-3 border-t border-brand-100 space-y-2 text-xs text-brand-700">
              <div className="flex justify-between">
                <span>Subtotal dos Produtos</span>
                <span className="font-medium text-brand-900">{formatBRL(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Cupom ({appliedCoupon?.code})</span>
                  <span>-{formatBRL(discountAmount)}</span>
                </div>
              )}

              {paymentDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Desconto Pix (10%)</span>
                  <span>-{formatBRL(paymentDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Frete ({deliveryType === 'showroom' ? 'Retirada' : shippingMethod.toUpperCase()})</span>
                <span className="font-medium text-brand-900">
                  {shippingCost === 0 ? <span className="text-emerald-700 font-bold">GRÁTIS</span> : formatBRL(shippingCost)}
                </span>
              </div>

              <div className="pt-3 border-t border-brand-200 flex justify-between items-baseline text-base font-bold text-brand-900">
                <span>Total a Pagar</span>
                <span className="font-serif text-xl text-brand-wine">{formatBRL(finalTotal)}</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processando Pedido...' : 'Confirmar e Finalizar Pedido'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-brand-500 text-center">
              <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
              <span>Garantia de Satisfação e Estoque Reservado</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
