/**
 * Formata tamanhos femininos para exibição estruturada:
 * Linha superior: Numeração (ex: 38, 40, 42, 44)
 * Linha inferior: Letra (ex: P, M, G, GG)
 */
export function formatSizeDisplay(sizeStr) {
  if (!sizeStr) return { primary: 'U', secondary: '' };
  const s = String(sizeStr).trim();

  // Caso 1: Já veio no formato composto "38 / P", "38 - P", "38(P)"
  const matchDual = s.match(/^(\d{2})\s*[-/() ]\s*([A-Za-z]+)\)?$/);
  if (matchDual) {
    return { primary: matchDual[1], secondary: matchDual[2].toUpperCase() };
  }

  // Caso 2: Mapeamento padrão brasileiro de moda feminina
  const brMap = {
    'PP': { primary: '36', secondary: 'PP' },
    'P': { primary: '38', secondary: 'P' },
    'M': { primary: '40', secondary: 'M' },
    'G': { primary: '42', secondary: 'G' },
    'GG': { primary: '44', secondary: 'GG' },
    'XG': { primary: '46', secondary: 'XG' },
    '34': { primary: '34', secondary: 'XPP' },
    '36': { primary: '36', secondary: 'PP' },
    '38': { primary: '38', secondary: 'P' },
    '40': { primary: '40', secondary: 'M' },
    '42': { primary: '42', secondary: 'G' },
    '44': { primary: '44', secondary: 'GG' },
    '46': { primary: '46', secondary: 'XG' },
    '48': { primary: '48', secondary: 'G1' },
    '50': { primary: '50', secondary: 'G2' },
    'U': { primary: 'U', secondary: 'Único' },
    'ÚNICO': { primary: 'U', secondary: 'Único' },
    'UNICO': { primary: 'U', secondary: 'Único' }
  };

  const upper = s.toUpperCase();
  if (brMap[upper]) {
    return brMap[upper];
  }

  // Caso 3: Apenas numérico (ex: 38)
  if (/^\d+$/.test(s)) {
    return { primary: s, secondary: '' };
  }

  // Caso 4: Texto livre (ex: P, M)
  return { primary: s, secondary: '' };
}
