import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
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
          <h1 className="font-serif text-xl font-bold text-brand-900 pt-3">Recuperação de Senha</h1>
          <p className="text-xs text-brand-500">Informe seu e-mail para receber as instruções de recuperação</p>
        </div>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold">E-mail Enviado com Sucesso</p>
            <p className="text-[11px] text-emerald-700">
              Se este e-mail estiver cadastrado em nossa base, enviamos um link seguro para você redefinir sua senha.
            </p>
            <div className="pt-3">
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-emerald-700 text-white font-semibold rounded-lg text-xs"
              >
                Voltar para o Login
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1">E-mail Cadastrado</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-wine text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md hover:bg-brand-wine-dark transition-all disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-brand-100 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-xs text-brand-700 hover:text-brand-wine flex items-center justify-center space-x-1 mx-auto font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao login</span>
          </button>
        </div>

      </div>
    </div>
  );
}
