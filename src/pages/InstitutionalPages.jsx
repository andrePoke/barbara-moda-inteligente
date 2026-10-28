import React from 'react';
import { ArrowLeft, ShieldCheck, RotateCcw, Truck, FileText } from 'lucide-react';

export function PrivacyPolicyPage({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      <button onClick={() => onNavigate('home')} className="text-xs text-brand-600 hover:text-brand-wine flex items-center space-x-1 font-semibold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar para o Início</span>
      </button>

      <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-12 shadow-card space-y-6">
        <div className="flex items-center space-x-3 text-brand-wine pb-4 border-b border-brand-100">
          <ShieldCheck className="w-8 h-8" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">Política de Privacidade & LGPD</h1>
            <p className="text-xs text-brand-500">Barbara Moda Inteligente • Atualizado em 2026</p>
          </div>
        </div>

        <div className="prose text-xs sm:text-sm text-brand-700 space-y-4 leading-relaxed">
          <p>
            A <strong>Barbara Moda Inteligente</strong> valoriza a sua privacidade e tem o compromisso de proteger os dados pessoais de todos os nossos clientes e visitantes, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">1. Coleta e Finalidade dos Dados</h3>
          <p>
            Coletamos apenas os dados estritamente necessários para viabilizar sua experiência de compra, faturamento e entrega segura de pedidos: nome completo, e-mail para confirmação e rastreamento, telefone para suporte e endereço de entrega.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">2. Segurança e Não Compartilhamento</h3>
          <p>
            Seus dados nunca serão comercializados ou cedidos a terceiros para fins publicitários. O compartilhamento ocorre exclusivamente com parceiros operacionais indispensáveis (operadoras de pagamento autorizadas e transportadoras para cumprimento da entrega).
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">3. Direitos do Titular</h3>
          <p>
            Você pode, a qualquer momento, solicitar a consulta, correção ou exclusão definitiva dos seus dados através do nosso canal oficial: <code>privacidade@barbaramoda.com.br</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TermsPage({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      <button onClick={() => onNavigate('home')} className="text-xs text-brand-600 hover:text-brand-wine flex items-center space-x-1 font-semibold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar para o Início</span>
      </button>

      <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-12 shadow-card space-y-6">
        <div className="flex items-center space-x-3 text-brand-wine pb-4 border-b border-brand-100">
          <FileText className="w-8 h-8" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">Termos de Uso</h1>
            <p className="text-xs text-brand-500">Condições gerais de navegação e compra</p>
          </div>
        </div>

        <div className="prose text-xs sm:text-sm text-brand-700 space-y-4 leading-relaxed">
          <p>
            Bem-vinda ao e-commerce oficial da <strong>Barbara Moda Inteligente</strong>. Ao navegar e realizar compras em nossa plataforma, você concorda com os termos e condições estipulados neste documento.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">1. Informações de Produtos e Estoque</h3>
          <p>
            Nos empenhamos para apresentar fotos reais de alta definição que retratam com fidelidade a cor e caimento das peças. O estoque é administrado em tempo real por variação específica (cor e tamanho), com reserva garantida durante a confirmação do pedido.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">2. Preços e Promoções</h3>
          <p>
            Os valores exibidos estão em moeda corrente nacional (Reais - R$). Cupons de desconto possuem regras individuais de compra mínima e prazo de validade estipulados em sua divulgação.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ExchangePage({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      <button onClick={() => onNavigate('home')} className="text-xs text-brand-600 hover:text-brand-wine flex items-center space-x-1 font-semibold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar para o Início</span>
      </button>

      <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-12 shadow-card space-y-6">
        <div className="flex items-center space-x-3 text-brand-wine pb-4 border-b border-brand-100">
          <RotateCcw className="w-8 h-8" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">Trocas e Devoluções</h1>
            <p className="text-xs text-brand-500">Transparência e respeito ao Código de Defesa do Consumidor</p>
          </div>
        </div>

        <div className="prose text-xs sm:text-sm text-brand-700 space-y-4 leading-relaxed">
          <p>
            Na <strong>Barbara Moda Inteligente</strong>, nosso desejo é que você se sinta confiante e realizada com cada escolha. Se por qualquer motivo precisar trocar o tamanho, cor ou devolver uma peça, nosso processo é descomplicado e seguro.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">1. Prazo de Arrependimento e Troca</h3>
          <p>
            Você tem até <strong>7 (sete) dias corridos</strong> após o recebimento do pedido para solicitar a devolução ou a primeira troca grátis, conforme o artigo 49 do Código de Defesa do Consumidor.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">2. Condições da Peça</h3>
          <p>
            A peça deve estar em perfeito estado, sem sinais de uso, lavagem ou odores, com a etiqueta e tags originais afixadas.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">3. Como Solicitar</h3>
          <p>
            Basta acionar nossa equipe de atendimento pelo WhatsApp ou e-mail <code>trocas@barbaramoda.com.br</code> com o número do seu pedido. Geramos a autorização de postagem reversa sem custo na primeira troca.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShippingInfoPage({ onNavigate }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fadeIn">
      <button onClick={() => onNavigate('home')} className="text-xs text-brand-600 hover:text-brand-wine flex items-center space-x-1 font-semibold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar para o Início</span>
      </button>

      <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-12 shadow-card space-y-6">
        <div className="flex items-center space-x-3 text-brand-wine pb-4 border-b border-brand-100">
          <Truck className="w-8 h-8" />
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">Prazos e Informações de Entrega</h1>
            <p className="text-xs text-brand-500">Envio cuidadoso e embalagem perfumada exclusiva</p>
          </div>
        </div>

        <div className="prose text-xs sm:text-sm text-brand-700 space-y-4 leading-relaxed">
          <p>
            Todas as encomendas da <strong>Barbara Moda Inteligente</strong> são embaladas com carinho, papel de seda e nosso aroma exclusivo, garantindo uma experiência inesquecível ao abrir sua caixa.
          </p>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">1. Modalidades de Envio</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Sedex Expresso:</strong> Prazo de 1 a 3 dias úteis para capitais e principais centros.</li>
            <li><strong>PAC Econômico:</strong> Prazo de 4 a 7 dias úteis.</li>
            <li><strong>Retirada no Showroom:</strong> Grátis, disponível no Showroom Oficial (Av. Comendador Francisco Avelino Maia, 3378 - Canjeranus, Passos - MG).</li>
          </ul>

          <h3 className="font-serif text-base font-bold text-brand-900 pt-2">2. Frete Grátis</h3>
          <p>
            Oferecemos frete grátis automático na modalidade PAC para compras com subtotal a partir de R$ 299,00.
          </p>
        </div>
      </div>
    </div>
  );
}
