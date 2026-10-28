import React, { useState } from 'react';
import { formatBRL } from '../context/CartContext';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  MessageCircle, 
  Package, 
  Calendar, 
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

export default function OrderConfirmationPage({ order, paymentDetails, onNavigate }) {
  const [copiedPix, setCopiedPix] = useState(false);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Nenhum pedido recente</h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const handleCopyPix = () => {
    if (paymentDetails?.pixCode) {
      navigator.clipboard.writeText(paymentDetails.pixCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-10 text-center shadow-card space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] text-brand-wine font-bold">
          Pedido Registrado com Sucesso
        </span>

        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900">
          Obrigada pela sua compra, {order.customerName.split(' ')[0]}!
        </h1>

        <p className="text-xs sm:text-sm text-brand-600 max-w-lg mx-auto">
          Seu pedido foi registrado em nossa base com estoque reservado. Enviamos todos os detalhes para o e-mail <strong>{order.customerEmail}</strong>.
        </p>

        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-50 border border-brand-200 rounded-lg text-xs font-mono font-bold text-brand-900 mt-2">
          <span>NÚMERO DO PEDIDO:</span>
          <span className="text-brand-wine">{order.orderNumber}</span>
        </div>
      </div>

      {/* Payment Instructions Box */}
      {paymentDetails?.type === 'pix' && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
            <QrCode className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-900">Pagamento via Pix</h3>
              <p className="text-xs text-brand-500">Pague agora para confirmação imediata da sua compra</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="w-36 h-36 bg-white p-2 rounded-lg border border-brand-300 flex items-center justify-center shrink-0 shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(paymentDetails.pixCode)}`} 
                alt="QR Code Pix"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <p className="text-xs text-brand-700">
                Abra o app do seu banco, escolha <strong>Pix</strong> e selecione <strong>Pagar com QR Code</strong> ou use o código Copia e Cola abaixo:
              </p>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={paymentDetails.pixCode}
                  className="flex-1 bg-white border border-brand-300 rounded-lg p-2 text-xs font-mono text-brand-800 truncate"
                />
                <button
                  onClick={handleCopyPix}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1 shrink-0"
                >
                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <p className="text-[11px] text-brand-500">
                Valor total com desconto: <strong>{formatBRL(order.totalAmount)}</strong> • Válido por 30 minutos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Assisted Mode */}
      {paymentDetails?.type === 'whatsapp_assisted' && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-brand-100">
            <MessageCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-900">Modo de Pedido Assistido</h3>
              <p className="text-xs text-brand-500">Conclua o atendimento com a nossa equipe</p>
            </div>
          </div>

          <p className="text-xs text-brand-700 leading-relaxed">
            {paymentDetails.instructions}
          </p>

          <a
            href={paymentDetails.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3.5 bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-emerald-700 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar Pedido no WhatsApp da Loja</span>
          </a>
        </div>
      )}

      {/* Order Items Table Snapshot */}
      <div className="bg-white rounded-2xl border border-brand-200 p-6 sm:p-8 shadow-soft space-y-6">
        <h3 className="font-serif text-lg font-bold text-brand-900 pb-3 border-b border-brand-100">
          Itens Comprados
        </h3>

        <div className="divide-y divide-brand-100">
          {order.items?.map((item, idx) => (
            <div key={idx} className="py-4 flex space-x-4 items-center">
              <img src={item.imageUrl} alt="" className="w-16 h-20 object-cover rounded-lg bg-brand-100 border border-brand-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-brand-900 truncate">{item.productName}</h4>
                <p className="text-xs text-brand-500 mt-0.5">
                  Ref: <span className="font-mono">{item.sku}</span> • Cor: <strong>{item.colorName}</strong> • Tam: <strong>{item.size}</strong>
                </p>
                <p className="text-xs text-brand-700 mt-1">
                  {item.quantity}x {formatBRL(item.unitPrice)} = <strong>{formatBRL(item.totalPrice)}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-brand-200 space-y-2 text-xs text-brand-700 max-w-sm ml-auto">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-brand-900">{formatBRL(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Desconto</span>
              <span>-{formatBRL(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Frete</span>
            <span className="font-semibold text-brand-900">{order.shippingCost === 0 ? 'GRÁTIS' : formatBRL(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-brand-200 text-sm font-bold text-brand-900">
            <span>Total</span>
            <span className="font-serif text-brand-wine text-base">{formatBRL(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => onNavigate('account', { tab: 'pedidos' })}
          className="w-full sm:w-auto px-6 py-3 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-black transition-colors"
        >
          Acompanhar Meus Pedidos
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto px-6 py-3 bg-white border border-brand-300 text-brand-900 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-brand-50 transition-colors"
        >
          Voltar para a Página Inicial
        </button>
      </div>

    </div>
  );
}
