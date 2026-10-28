import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    store_name: 'Barbara Moda Inteligente',
    tagline: 'Seu estilo. Sua essência. Sua melhor versão.',
    phone: '(11) 98765-4321',
    whatsapp_number: '5511987654321',
    instagram_handle: '@barbaramodainteligente',
    instagram_url: 'https://instagram.com/barbaramodainteligente',
    address: 'Rua Oscar Freire, 1284 - Cerqueira César, São Paulo - SP',
    business_hours: 'Segunda a Sábado, das 09h às 19h',
    google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.197361848529!2d-46.66989472391038!3d-23.561349578800185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59d3e8e11a2f%3A0xb36ef554a9386b0!2sRua%20Oscar%20Freire%20-%20Cerqueira%20C%C3%A9sar%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr',
    google_rating: 4.9,
    google_reviews_count: 128,
    google_business_url: 'https://maps.google.com',
    announcement_bar: 'Frete grátis para compras acima de R$ 299 | Parcelamento em até 6x sem juros | 10% OFF no Pix com cupom BEMVINDA10',
    hero_title: 'Seu estilo. Sua essência. Sua melhor versão.',
    hero_subtitle: 'Descubra peças que combinam com você e transforme a maneira de se vestir.',
    hero_image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    hero_cta_primary: 'Comprar novidades',
    hero_cta_primary_link: '/catalogo?filtro=novidades',
    hero_cta_secondary: 'Explorar coleção',
    hero_cta_secondary_link: '/catalogo',
    free_shipping_threshold: 299.00
  });

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      refreshSettings: fetchSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
