import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Mail, Lock, Phone, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function InitialSetupPage({ onComplete }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar administrador.');

      localStorage.setItem('bmi_token', data.token);
      localStorage.setItem('bmi_user', JSON.stringify(data.user));
      window.location.reload();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-brand-200 p-8 sm:p-10 shadow-elevated space-y-6 animate-fadeIn">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-wine text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="font-serif text-2xl tracking-[0.16em] font-bold text-brand-900 uppercase block">Barbara</span>
          <span className="text-[10px] tracking-[0.3em] text-brand-600 uppercase font-semibold block">Moda Inteligente</span>
          <h1 className="font-serif text-xl font-bold text-brand-900 pt-2">
            Configuração Inicial do Sistema
          </h1>
          <p className="text-xs text-brand-500 max-w-xs mx-auto">
            Sua loja virtual está pronta em ambiente limpo (começando do zero). Cadastre agora a conta de <strong>Administrador Master</strong>.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">Nome do(a) Administrador(a) *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Barbara Oliveira"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <User className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail Administrativo *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@barbaramoda.com.br"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Mail className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-900 mb-1">Telefone / WhatsApp</label>
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
            <label className="block text-xs font-semibold text-brand-900 mb-1">Senha Master de Acesso *</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 dígitos"
                className="w-full bg-brand-50/50 border border-brand-300 rounded-lg py-2.5 pl-9 pr-3 text-xs text-brand-900 focus:outline-none focus:border-brand-wine"
              />
              <Lock className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Inicializando Loja...' : 'Criar Conta Master e Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-brand-50 rounded-xl border border-brand-200/60 text-[11px] text-brand-600 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-brand-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>O que acontece a seguir:</span>
          </div>
          <p>Você terá acesso ao Painel Administrativo para cadastrar seus produtos reais com fotos, cores, tamanhos e estoque.</p>
        </div>

      </div>
    </div>
  );
}
