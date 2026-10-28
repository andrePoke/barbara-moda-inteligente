import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { Sparkles, Truck, ShieldCheck } from 'lucide-react';

export default function AnnouncementBar() {
  const { settings } = useSettings();

  if (!settings?.announcement_bar) return null;

  return (
    <div className="bg-brand-900 text-brand-100 text-xs py-2 px-4 transition-all tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center space-x-2 text-brand-300">
          <Truck className="w-3.5 h-3.5 text-brand-gold" />
          <span>Envio seguro para todo o Brasil</span>
        </div>

        <div className="mx-auto text-center font-medium flex items-center space-x-2 text-[11px] sm:text-xs">
          <Sparkles className="w-3 h-3 text-brand-gold shrink-0 hidden sm:inline" />
          <span>{settings.announcement_bar}</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-brand-300">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
          <span>Compra 100% Protegida</span>
        </div>
      </div>
    </div>
  );
}
