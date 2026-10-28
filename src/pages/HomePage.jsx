import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  MessageCircle, 
  Instagram, 
  Star, 
  MapPin, 
  Clock, 
  Phone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const { settings } = useSettings();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        // Load categories
        const catRes = await fetch('/api/products/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        // Load Instagram feed
        const igRes = await fetch('/api/settings/instagram');
        if (igRes.ok) {
          const igData = await igRes.json();
          setInstagramPosts(igData.posts || []);
        }

        // Load featured products
        const featRes = await fetch('/api/products?destaque=1&limit=8');
        if (featRes.ok) {
          const featData = await featRes.json();
          setFeaturedProducts(featData.products || []);
        }

        // Load new arrivals
        const newRes = await fetch('/api/products?novidades=1&limit=4');
        if (newRes.ok) {
          const newData = await newRes.json();
          setNewArrivals(newData.products || []);
        }

        // Load bestsellers
        const bestRes = await fetch('/api/products?ordenar=mais_vendidos&limit=4');
        if (bestRes.ok) {
          const bestData = await bestRes.json();
          setBestsellers(bestData.products || []);
        }

        // Load authentic reviews
        const revRes = await fetch('/api/settings/reviews');
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.reviews || []);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO BANNER */}
      <section className="relative bg-brand-200 overflow-hidden min-h-[540px] sm:min-h-[620px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={settings?.hero_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop'} 
            alt="Moda Feminina Barbara" 
            className="w-full h-full object-cover object-center filter brightness-[0.92]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl text-white space-y-6 animate-fadeIn">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-brand-gold text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coleção Primavera/Verão 2026</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15]">
              {settings?.hero_title || 'Seu estilo. Sua essência. Sua melhor versão.'}
            </h1>

            <p className="text-sm sm:text-base text-brand-200 font-light leading-relaxed max-w-lg">
              {settings?.hero_subtitle || 'Descubra peças de alfaiataria e moda inteligente pensadas para mulheres contemporâneas que valorizam elegância, sofisticação e conforto.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate('catalog', { novidades: '1' })}
                className="px-7 py-3.5 bg-brand-wine text-white text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-lg shadow-lg hover:bg-brand-wine-dark transition-all flex items-center space-x-2"
              >
                <span>{settings?.hero_cta_primary || 'Comprar novidades'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('catalog')}
                className="px-7 py-3.5 bg-white/20 hover:bg-white text-white hover:text-brand-900 backdrop-blur-md border border-white/30 text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-lg transition-all"
              >
                {settings?.hero_cta_secondary || 'Explorar coleção'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIAS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
            Categorias em Foco
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
            Navegue por Categoria
          </h2>
          <p className="text-xs sm:text-sm text-brand-600 mt-2">
            Peças versáteis desenhadas para compor produções inteligentes em qualquer momento do seu dia.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('catalog', { categoria: cat.slug })}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer shadow-soft hover:shadow-card transition-all duration-300"
            >
              <img 
                src={cat.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop'} 
                alt={cat.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <h3 className="font-serif text-base sm:text-lg font-bold">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-brand-300 flex items-center space-x-1 group-hover:text-brand-gold transition-colors mt-0.5">
                  <span>Ver peças</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. VITRINE DE MAIS VENDIDOS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
              Preferidos das Clientes
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
              Mais Vendidos
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog', { ordenar: 'mais_vendidos' })}
            className="text-xs font-semibold text-brand-wine hover:text-brand-wine-dark uppercase tracking-wider flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <span>Ver toda a seleção</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestsellers.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      </section>

      {/* 4. BANNER PROMOCIONAL / EDITORIAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-brand-900 text-white rounded-2xl overflow-hidden shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
            <div className="p-8 sm:p-12 lg:p-16 space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] text-brand-gold font-semibold">
                Especial de Alfaiataria
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
                Cortes estruturados que transmitem autoridade e elegância.
              </h2>
              <p className="text-xs sm:text-sm text-brand-300 leading-relaxed font-light">
                Do escritório a eventos sociais. Nossas peças foram projetadas com modelagens anatômicas e tecidos encorpados que não amassam com facilidade, perfeitos para a rotina dinâmica.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('catalog', { categoria: 'conjuntos' })}
                  className="px-6 py-3 bg-white text-brand-900 text-xs font-bold uppercase tracking-wider rounded-lg shadow hover:bg-brand-gold hover:text-white transition-colors"
                >
                  Conhecer Alfaiataria
                </button>
              </div>
            </div>

            <div className="aspect-[4/3] lg:aspect-auto lg:h-full relative overflow-hidden bg-brand-800">
              <img 
                src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop" 
                alt="Alfaiataria Feminina Barbara" 
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. NOVIDADES DA SEMANA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
              Acabaram de Chegar
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
              Novidades da Coleção
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog', { novidades: '1' })}
            className="text-xs font-semibold text-brand-wine hover:text-brand-wine-dark uppercase tracking-wider flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <span>Ver todas as novidades</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={onNavigate}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      </section>

      {/* 6. BENEFÍCIOS REAIS DA LOJA */}
      <section className="bg-brand-100/70 py-12 border-y border-brand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white text-brand-wine rounded-xl shadow-sm border border-brand-200 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-900">Frete Grátis</h4>
                <p className="text-xs text-brand-600 mt-1">
                  Válido para compras acima de R$ 299 para regiões atendidas.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white text-brand-wine rounded-xl shadow-sm border border-brand-200 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-900">10% OFF no Pix</h4>
                <p className="text-xs text-brand-600 mt-1">
                  Desconto imediato à vista ou parcele em até 6x sem juros no cartão.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white text-brand-wine rounded-xl shadow-sm border border-brand-200 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-900">Compra Segura</h4>
                <p className="text-xs text-brand-600 mt-1">
                  Ambiente protegido com criptografia de ponta a ponta e total conformidade LGPD.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white text-brand-wine rounded-xl shadow-sm border border-brand-200 shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-900">Atendimento Humanizado</h4>
                <p className="text-xs text-brand-600 mt-1">
                  Nossa equipe de consultoria está pronta para orientar seu tamanho e estilo pelo WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSTAGRAM OFICIAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-2 text-brand-wine text-xs font-semibold uppercase tracking-widest mb-1">
            <Instagram className="w-4 h-4" />
            <span>Siga Nosso Instagram</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
            {settings?.instagram_handle || '@barbaramodainteligente'}
          </h2>
          <p className="text-xs sm:text-sm text-brand-600 mt-2">
            Acompanhe lançamentos, bastidores da nossa curadoria e inspirações reais de looks diários.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href={post.post_url || settings?.instagram_url || 'https://instagram.com/barbaramodainteligente'}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden shadow-soft block"
            >
              <img src={post.image_url} alt={post.caption || "Look Bárbara Moda Inteligente"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-brand-wine/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
                <Instagram className="w-7 h-7 mb-1" />
                {post.caption && <span className="text-[10px] line-clamp-2 leading-tight">{post.caption}</span>}
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-6">
          <a
            href={settings?.instagram_url || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-900 hover:text-brand-wine border border-brand-300 px-5 py-2.5 rounded-lg transition-colors"
          >
            <span>Ver perfil no Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* 8. AVALIAÇÕES REAIS DE CLIENTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-brand-200 p-8 sm:p-12 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-brand-100 gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
                Depoimentos Autênticos
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
                O que nossas clientes dizem
              </h2>
            </div>

            <div className="flex items-center space-x-4 bg-brand-50 p-4 rounded-xl border border-brand-200">
              <div className="text-3xl font-serif font-bold text-brand-900">
                {settings?.google_rating || '4.9'}
              </div>
              <div>
                <div className="flex text-amber-500 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-[11px] text-brand-600">
                  Baseado em <strong>{settings?.google_reviews_count || 128} avaliações</strong> no Google
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {reviews.slice(0, 4).map((rev) => (
              <div key={rev.id} className="p-5 bg-brand-50/60 rounded-xl border border-brand-100 flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-500 mb-2">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-brand-800 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-200/60 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-brand-900">{rev.author_name}</span>
                  {rev.verified_purchase === 1 && (
                    <span className="text-emerald-700 font-medium">Compra Verificada</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={settings?.google_business_url || 'https://maps.google.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-wine hover:text-brand-wine-dark"
            >
              <span>Visualizar todas as avaliações no Google Meu Negócio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 9. LOCALIZAÇÃO E CONTATO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 bg-white rounded-2xl border border-brand-200 overflow-hidden shadow-card">
          {/* Info */}
          <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-wine block mb-1">
                Showroom Físico
              </span>
              <h2 className="font-serif text-2xl font-bold text-brand-900">
                Venha nos Visitar
              </h2>
              <p className="text-xs text-brand-600 mt-2">
                Experimente nossas peças com atendimento personalizado e café cortesia em nosso espaço exclusivo.
              </p>

              <div className="mt-6 space-y-4 text-xs text-brand-800">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-900">Endereço</strong>
                    <span>{settings?.address || 'Rua Oscar Freire, 1284 - Cerqueira César, São Paulo - SP'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-900">Horário de Funcionamento</strong>
                    <span>{settings?.business_hours || 'Segunda a Sábado, das 09h às 19h'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-brand-wine shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-brand-900">Telefone / WhatsApp</strong>
                    <span>{settings?.phone || '(11) 98765-4321'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-100 flex flex-col gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.address || 'Rua Oscar Freire 1284 Sao Paulo')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg text-center hover:bg-brand-wine transition-colors flex items-center justify-center space-x-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Como Chegar (Google Maps)</span>
              </a>

              <a
                href={`https://wa.me/${settings?.whatsapp_number || '5511987654321'}?text=${encodeURIComponent('Olá! Gostaria de agendar um atendimento exclusivo no showroom da Barbara Moda Inteligente.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg text-center hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Agendar Atendimento no Showroom</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Map Embed */}
          <div className="lg:col-span-2 min-h-[360px] bg-brand-100 relative">
            <iframe
              title="Localização Barbara Moda Inteligente"
              src={settings?.google_maps_embed || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.197361848529!2d-46.66989472391038!3d-23.561349578800185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59d3e8e11a2f%3A0xb36ef554a9386b0!2sRua%20Oscar%20Freire%20-%20Cerqueira%20C%C3%A9sar%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr'}
              className="w-full h-full border-0 absolute inset-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
