import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!acceptTerms) {
      setErrorMsg('Você precisa aceitar os termos de uso e política de privacidade.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, phone);
      onNavigate('account');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl border border-brand-200 p-8 shadow-card space-y-6">
        
        <div className="text-center space-y-1">
          <span className="font-serif text-2xl tracking-[0.16em] font-bold text-brand-900 uppercase">Barbara</span>
          <span className="block text-[9px] tracking-[0.3em] text-brand-600 uppercase font-medium">Moda Inteligente</span>
          <h1 className="font-serif text-xl font-bold text-brand-900 pt-3">Criar sua Conta</h1>
          <p className="text-xs text-brand-500">Cadastre-se para aproveitar benefícios e pedidos simplificados</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">Nome Completo *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <User className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com.br"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Mail className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">Telefone / WhatsApp (Opcional)</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Phone className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">Crie uma Senha Segura (mínimo 6 dígitos) *</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Lock className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <label className="flex items-start space-x-2 text-xs text-brand-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded border-brand-300 text-brand-wine focus:ring-brand-wine"
            />
            <span>
              Li e concordo com os{' '}
              <button type="button" onClick={() => onNavigate('terms')} className="text-brand-wine underline">
                Termos de Uso
              </button>{' '}
              e a{' '}
              <button type="button" onClick={() => onNavigate('privacy')} className="text-brand-wine underline">
                Política de Privacidade
              </button>.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Cadastrando...' : 'Criar Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-brand-100 text-center">
          <p className="text-xs text-brand-600">
            Já possui uma conta?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-brand-wine font-bold hover:underline"
            >
              Fazer Login
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
