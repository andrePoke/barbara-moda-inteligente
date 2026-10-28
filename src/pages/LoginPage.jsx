import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      if (['admin', 'manager'].includes(data.user.role)) {
        onNavigate('admin');
      } else {
        onNavigate('account');
      }
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
          <h1 className="font-serif text-xl font-bold text-brand-900 pt-3">Acessar sua Conta</h1>
          <p className="text-xs text-brand-500">Entre para gerenciar seus pedidos e preferências</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail</label>
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-brand-900">Senha</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-[11px] text-brand-wine hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Lock className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Entrando...' : 'Entrar na Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-brand-100 text-center space-y-3">
          <p className="text-xs text-brand-600">
            Ainda não tem conta na Barbara?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-brand-wine font-bold hover:underline"
            >
              Criar Cadastro
            </button>
          </p>

          <div className="p-3 bg-brand-50 rounded-xl text-[11px] text-brand-700 space-y-1 text-left border border-brand-200/60">
            <span className="font-bold block">Acesso de Demonstração:</span>
            <div className="flex justify-between text-brand-600">
              <span>Admin: <code>admin@barbaramoda.com.br</code> / <code>admin123</code></span>
            </div>
            <div className="flex justify-between text-brand-600">
              <span>Cliente: <code>cliente@exemplo.com.br</code> / <code>cliente123</code></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
