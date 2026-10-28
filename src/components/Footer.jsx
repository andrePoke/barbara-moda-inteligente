import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { 
  Instagram, 
  Phone, 
  MapPin, 
  Clock, 
  Mail, 
  ShieldCheck, 
  CreditCard, 
  RotateCcw, 
  Lock,
  ArrowRight
} from 'lucide-react';

export default function Footer({ onNavigate }) {
  const { settings } = useSettings();

  return (
    <footer className="bg-brand-900 text-brand-300 pt-16 pb-8 border-t border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-brand-800/80 text-xs">
          <div className="flex items-center space-x-3 p-4 bg-brand-800/30 rounded-xl border border-brand-700/30">
            <ShieldCheck className="w-6 h-6 text-brand-gold shrink-0" />
            <div>
              <h5 className="font-semibold text-white">Compra 100% Segura</h5>
              <p className="text-brand-400 text-[11px]">Criptografia SSL de ponta a ponta</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-brand-800/30 rounded-xl border border-brand-700/30">
            <RotateCcw className="w-6 h-6 text-brand-gold shrink-0" />
            <div>
              <h5 className="font-semibold text-white">Troca Fácil e Descomplicada</h5>
              <p className="text-brand-400 text-[11px]">Até 7 dias após o recebimento</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-brand-800/30 rounded-xl border border-brand-700/30">
            <CreditCard className="w-6 h-6 text-brand-gold shrink-0" />
            <div>
              <h5 className="font-semibold text-white">Parcele em até 6x</h5>
              <p className="text-brand-400 text-[11px]">Sem juros no cartão ou 10% no Pix</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-brand-800/30 rounded-xl border border-brand-700/30">
            <Lock className="w-6 h-6 text-brand-gold shrink-0" />
            <div>
              <h5 className="font-semibold text-white">Privacidade e LGPD</h5>
              <p className="text-brand-400 text-[11px]">Seus dados sempre protegidos</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          
          {/* Brand Presentation */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <span className="font-serif text-2xl tracking-[0.16em] font-bold text-white uppercase">Barbara</span>
              <span className="block text-[10px] tracking-[0.3em] text-brand-gold uppercase font-medium mt-0.5">Moda Inteligente</span>
            </div>
            <p className="text-xs text-brand-400 leading-relaxed max-w-sm">
              Peças de alfaiataria e moda inteligente pensadas para mulheres que buscam versatilidade, sofisticação e conforto no dia a dia.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-brand-800 hover:bg-brand-wine text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="Instagram Barbara Moda Inteligente"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-brand-800 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="WhatsApp de Atendimento"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wider uppercase">Coleções</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('catalog', { novidades: '1' })} className="hover:text-white transition-colors">
                  Novidades
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoria: 'vestidos' })} className="hover:text-white transition-colors">
                  Vestidos Midi & Longos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoria: 'conjuntos' })} className="hover:text-white transition-colors">
                  Conjuntos de Alfaiataria
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoria: 'blusas' })} className="hover:text-white transition-colors">
                  Camisas & Blusas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { categoria: 'calcas' })} className="hover:text-white transition-colors">
                  Calças Wide Leg
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog', { promocoes: '1' })} className="text-brand-gold hover:text-white transition-colors font-medium">
                  Ofertas Especiais
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care / Institutional */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wider uppercase">Ajuda & Suporte</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-white transition-colors">
                  Meus Pedidos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                  Termos de Uso
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exchange')} className="hover:text-white transition-colors">
                  Trocas e Devoluções
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping')} className="hover:text-white transition-colors">
                  Prazos e Entregas
                </button>
              </li>
            </ul>
          </div>

          {/* Contact and Location */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wider uppercase">Atendimento</h4>
            <div className="space-y-2 text-xs text-brand-400">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span>{settings?.address || 'Av. Comendador Francisco Avelino Maia, 3378 - Passos/MG'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{settings?.business_hours || 'Seg a Sex: 09h às 18h | Sáb: 09h às 17h'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{settings?.phone || '(35) 98851-7442'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <span>atendimento@barbaramoda.com.br</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods and Bottom Bar */}
        <div className="pt-8 border-t border-brand-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-brand-500 gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-[11px] uppercase tracking-wider text-brand-400">Formas de Pagamento:</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-brand-800 text-white font-bold text-[10px] rounded">PIX</span>
              <span className="px-2 py-1 bg-brand-800 text-white font-bold text-[10px] rounded">VISA</span>
              <span className="px-2 py-1 bg-brand-800 text-white font-bold text-[10px] rounded">MASTERCARD</span>
              <span className="px-2 py-1 bg-brand-800 text-white font-bold text-[10px] rounded">ELO</span>
              <span className="px-2 py-1 bg-brand-800 text-white font-bold text-[10px] rounded">BOLETO</span>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[11px]">
              © {new Date().getFullYear()} Bárbara Moda Inteligente. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-brand-400 mt-0.5">
              CNPJ: 17.031.053/0002-53 • Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG, 37902-304
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
