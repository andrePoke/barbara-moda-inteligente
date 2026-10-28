import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { MessageCircle, X, HelpCircle, Ruler, Package, Sparkles } from 'lucide-react';

export default function WhatsAppFloat() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const phone = settings?.whatsapp_number || '5511987654321';

  const channels = [
    {
      title: 'Consultoria de Estilo e Produtos',
      desc: 'Dúvidas sobre combinações, tecidos e cores',
      icon: Sparkles,
      msg: 'Olá! Gostaria de uma consultoria sobre os produtos da Barbara Moda Inteligente.'
    },
    {
      title: 'Guia de Medidas e Tamanhos',
      desc: 'Ajuda para acertar o caimento ideal',
      icon: Ruler,
      msg: 'Olá! Preciso de ajuda para escolher o tamanho correto para o meu corpo.'
    },
    {
      title: 'Acompanhar Meu Pedido',
      desc: 'Status de entrega e rastreamento',
      icon: Package,
      msg: 'Olá! Gostaria de consultar o andamento e o envio do meu pedido.'
    },
    {
      title: 'Dúvidas Gerais / Outros Assuntos',
      desc: 'Fale com nossa equipe de suporte',
      icon: HelpCircle,
      msg: 'Olá! Estou no site da Barbara Moda Inteligente e gostaria de tirar uma dúvida.'
    }
  ];

  const handleOpenWhatsApp = (message) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Popover Menu */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-brand-200 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-brand-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-semibold">Atendimento Barbara</h4>
                <p className="text-[11px] text-brand-300">Resposta ágil em horário comercial</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-300 hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options */}
          <div className="p-3 divide-y divide-brand-100 max-h-80 overflow-y-auto">
            {channels.map((ch, idx) => {
              const Icon = ch.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleOpenWhatsApp(ch.msg)}
                  className="w-full p-3 text-left hover:bg-brand-50 rounded-xl transition-all flex items-start space-x-3 group"
                >
                  <div className="p-2 bg-brand-100 text-brand-900 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-900 group-hover:text-emerald-700 transition-colors">
                      {ch.title}
                    </p>
                    <p className="text-[11px] text-brand-500 line-clamp-1 mt-0.5">
                      {ch.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-brand-50 border-t border-brand-200 text-center">
            <p className="text-[10px] text-brand-600">
              Horário: {settings?.business_hours || 'Seg a Sáb, das 09h às 19h'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Atendimento pelo WhatsApp"
        className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-elevated hover:scale-105 transition-all group relative"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-7 h-7 fill-current" />
        )}
      </button>
    </div>
  );
}
