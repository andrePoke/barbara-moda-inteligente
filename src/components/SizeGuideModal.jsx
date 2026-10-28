import React from 'react';
import { X, Ruler, CheckCircle2 } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tableData = [
    { size: 'PP (34)', bust: '82 - 86 cm', waist: '64 - 68 cm', hip: '90 - 94 cm' },
    { size: 'P (36 - 38)', bust: '86 - 92 cm', waist: '68 - 74 cm', hip: '94 - 100 cm' },
    { size: 'M (40 - 42)', bust: '92 - 98 cm', waist: '74 - 80 cm', hip: '100 - 106 cm' },
    { size: 'G (44)', bust: '98 - 104 cm', waist: '80 - 86 cm', hip: '106 - 112 cm' },
    { size: 'GG (46)', bust: '104 - 110 cm', waist: '86 - 94 cm', hip: '112 - 120 cm' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-elevated border border-brand-200 p-6 sm:p-8 z-50 animate-fadeIn">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-brand-500 hover:text-brand-900 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-wine">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-brand-900">Tabela e Guia de Medidas</h3>
              <p className="text-xs text-brand-600">Encontre o caimento perfeito para a sua silhueta</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-brand-200 rounded-xl mb-6">
            <table className="w-full text-xs text-left">
              <thead className="bg-brand-100 text-brand-900 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tamanho</th>
                  <th className="py-3 px-4">Busto</th>
                  <th className="py-3 px-4">Cintura</th>
                  <th className="py-3 px-4">Quadril</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-brand-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-brand-900">{row.size}</td>
                    <td className="py-3 px-4 text-brand-700">{row.bust}</td>
                    <td className="py-3 px-4 text-brand-700">{row.waist}</td>
                    <td className="py-3 px-4 text-brand-700">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tips */}
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-200/60 space-y-2 text-xs text-brand-700">
            <h4 className="font-bold text-brand-900 uppercase tracking-wider text-[11px]">Como tirar suas medidas:</h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong>Busto:</strong> Meça ao redor da parte mais saliente do busto mantendo a fita reta nas costas.</li>
              <li><strong>Cintura:</strong> Meça ao redor da menor circunferência da cintura, cerca de 2 dedos acima do umbigo.</li>
              <li><strong>Quadril:</strong> Fique de pé com os pés juntos e meça na parte mais larga dos quadris e glúteos.</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-brand-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-wine transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
