import React, { useState } from 'react';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { AppData } from '../types';
import { formatCurrency, formatMonthKey, getPreviousMonthKey } from '../utils/date';

interface ExpenseTrendChartProps {
  data: AppData;
  selectedMonth: string;
  currency?: string;
  onSelectMonth?: (monthKey: string) => void;
}

export const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  data,
  selectedMonth,
  currency = 'FCFA',
  onSelectMonth,
}) => {
  const [chartType, setChartType] = useState<'curve' | 'bars'>('curve');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Construire l'historique des 6 derniers mois jusqu'au mois sélectionné
  const monthsList: string[] = [];
  let curr = selectedMonth;
  for (let i = 0; i < 6; i++) {
    monthsList.unshift(curr);
    curr = getPreviousMonthKey(curr);
  }

  // Calculer le total dépensé pour chaque mois
  const monthData = monthsList.map((mKey) => {
    const expenses = data.expenses[mKey] || [];
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const [, month] = mKey.split('-');
    const shortNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    const shortLabel = shortNames[parseInt(month, 10) - 1] || month;
    return {
      monthKey: mKey,
      shortLabel: `${shortLabel}`,
      fullLabel: formatMonthKey(mKey),
      total,
      count: expenses.length,
    };
  });

  const totals = monthData.map((d) => d.total);
  const maxTotal = Math.max(...totals, 100000);
  const currentMonthTotal = data.expenses[selectedMonth]?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const prevMonthTotal = data.expenses[getPreviousMonthKey(selectedMonth)]?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const diffPercent = prevMonthTotal > 0 
    ? Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100) 
    : 0;

  // Calcul des coordonnées pour la courbe SVG (viewBox 0 0 560 220)
  const svgWidth = 560;
  const svgHeight = 220;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 48;
  const paddingBottom = 40;
  const usableWidth = svgWidth - paddingLeft - paddingRight;
  const usableHeight = svgHeight - paddingTop - paddingBottom;

  const points = monthData.map((d, index) => {
    const x = paddingLeft + (index / (monthData.length - 1)) * usableWidth;
    const ratio = maxTotal > 0 ? d.total / (maxTotal * 1.18) : 0;
    const y = paddingTop + usableHeight - ratio * usableHeight;
    return { x, y, data: d };
  });

  // Génération de la courbe de Bézier lisse (Cubic Spline)
  const buildSmoothPath = () => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = buildSmoothPath();
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  const activePointIndex = hoveredIndex !== null ? hoveredIndex : points.length - 1;
  const activePoint = points[activePointIndex] || points[points.length - 1];

  // Helper pour afficher les valeurs d'axe abrégées (ex: 500k)
  const formatScaleValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  };

  return (
    <div className="bg-[#121613] rounded-3xl p-5 sm:p-6 shadow-sm border border-[#232f26] space-y-4">
      
      {/* En-tête du graphique avec switcher Courbe / Barres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c241e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1c241e] text-[#ccff00] flex items-center justify-center border border-[#2c3a2f]">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                Tendance des dépenses mensuelles
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30">
                6 mois
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Courbe basée sur le montant total dépensé chaque mois
            </p>
          </div>
        </div>

        {/* Switcher Courbe / Barres */}
        <div className="flex items-center gap-1 bg-[#18201a] p-1 rounded-full border border-[#263529] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType('curve')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              chartType === 'curve'
                ? 'bg-[#ccff00] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Courbe</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bars')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              chartType === 'bars'
                ? 'bg-[#ccff00] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Barres</span>
          </button>
        </div>
      </div>

      {/* Résumé clair du montant et libellé de dépenses */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
        <div>
          <span className="text-xs font-medium text-slate-400 block">
            {activePoint?.data.fullLabel} :
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(activePoint?.data.total || 0, currency)}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({activePoint?.data.count || 0} dépense{(activePoint?.data.count || 0) > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        <div className="self-start sm:self-auto sm:text-right">
          <span className="text-[11px] text-slate-400 block">Évolution vs mois précédent</span>
          <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
            {diffPercent > 0 ? (
              <span className="inline-flex items-center text-xs font-black text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/25">
                +{diffPercent}%
              </span>
            ) : diffPercent < 0 ? (
              <span className="inline-flex items-center text-xs font-black text-[#ccff00] bg-[#ccff00]/15 px-2.5 py-0.5 rounded-full border border-[#ccff00]/25">
                {diffPercent}%
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">Stable (0%)</span>
            )}
          </div>
        </div>
      </div>

      {/* ZONE GRAPHIQUE SVG : Chiffres et Textes Ajustés Sans Débordement */}
      <div className="relative pt-2">
        {chartType === 'curve' ? (
          <div className="w-full overflow-hidden select-none">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-44 sm:h-56 overflow-visible"
            >
              <defs>
                {/* Dégradé sous la courbe néon */}
                <linearGradient id="neonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ccff00" stopOpacity="0.28" />
                  <stop offset="65%" stopColor="#10b981" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                {/* Filtre de glow néon pour la courbe */}
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Lignes de repère horizontales discrètes avec graduation des chiffres */}
              <g className="text-[10px] font-bold fill-slate-500">
                {/* Ligne Max */}
                <line 
                  x1={paddingLeft} 
                  y1={paddingTop} 
                  x2={svgWidth - paddingRight} 
                  y2={paddingTop} 
                  stroke="#1c251e" 
                  strokeDasharray="4 4" 
                />
                <text x={paddingLeft - 8} y={paddingTop + 3} textAnchor="end">
                  {formatScaleValue(maxTotal)}
                </text>

                {/* Ligne Milieu */}
                <line 
                  x1={paddingLeft} 
                  y1={paddingTop + usableHeight / 2} 
                  x2={svgWidth - paddingRight} 
                  y2={paddingTop + usableHeight / 2} 
                  stroke="#1c251e" 
                  strokeDasharray="4 4" 
                />
                <text x={paddingLeft - 8} y={paddingTop + usableHeight / 2 + 3} textAnchor="end">
                  {formatScaleValue(Math.round(maxTotal / 2))}
                </text>

                {/* Ligne Zéro (Base) */}
                <line 
                  x1={paddingLeft} 
                  y1={svgHeight - paddingBottom} 
                  x2={svgWidth - paddingRight} 
                  y2={svgHeight - paddingBottom} 
                  stroke="#232f26" 
                />
                <text x={paddingLeft - 8} y={svgHeight - paddingBottom + 3} textAnchor="end">
                  0
                </text>
              </g>

              {/* Remplissage dégradé sous la courbe */}
              <path d={areaPath} fill="url(#neonAreaGradient)" />

              {/* Ligne de courbe néon */}
              <path 
                d={linePath} 
                fill="none" 
                stroke="#ccff00" 
                strokeWidth="3.2" 
                strokeLinecap="round"
                filter="url(#neonGlow)"
              />

              {/* Ligne verticale indicatrice sur le point actif */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={activePoint.y}
                  x2={activePoint.x}
                  y2={svgHeight - paddingBottom}
                  stroke="#ccff00"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Points sur la courbe avec chiffres de dépenses ajustés */}
              {points.map((pt, idx) => {
                const isActive = idx === activePointIndex;
                return (
                  <g 
                    key={pt.data.monthKey} 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => {
                      setHoveredIndex(idx);
                      onSelectMonth?.(pt.data.monthKey);
                    }}
                  >
                    {/* Zone d'interaction tactile */}
                    <circle cx={pt.x} cy={pt.y} r="20" fill="transparent" />

                    {/* Point extérieur */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? "7" : "5"}
                      fill={isActive ? "#ccff00" : "#121613"}
                      stroke="#ccff00"
                      strokeWidth={isActive ? "2.5" : "2"}
                      className="transition-all duration-150"
                    />

                    {/* Point central */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? "3" : "2"}
                      fill={isActive ? "#000000" : "#ccff00"}
                    />

                    {/* Chiffre de dépense affiché au-dessus du point (quand inactif) */}
                    {!isActive && (
                      <text
                        x={pt.x}
                        y={Math.max(16, pt.y - 10)}
                        textAnchor="middle"
                        className="text-[9.5px] font-bold fill-slate-400"
                      >
                        {formatScaleValue(pt.data.total)}
                      </text>
                    )}

                    {/* Libellé du mois en dessous */}
                    <text
                      x={pt.x}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      className={`text-[11px] font-extrabold ${
                        isActive ? 'fill-[#ccff00]' : 'fill-slate-300'
                      }`}
                    >
                      {pt.data.shortLabel}
                    </text>
                  </g>
                );
              })}

              {/* Bulle / Tooltip au-dessus du point actif avec dimensions et positionnement ajustés */}
              {activePoint && (() => {
                const tooltipWidth = 116;
                const tooltipHeight = 24;
                // Clamping horizontal pour ne jamais déborder hors du SVG
                const clampedX = Math.max(
                  paddingLeft + tooltipWidth / 2 - 10,
                  Math.min(svgWidth - paddingRight - tooltipWidth / 2 + 10, activePoint.x)
                );
                // Positionnement vertical au-dessus du point, jamais tronqué en haut
                const clampedY = Math.max(tooltipHeight + 6, activePoint.y - 12);

                return (
                  <g transform={`translate(${clampedX}, ${clampedY})`}>
                    <rect
                      x={-tooltipWidth / 2}
                      y={-tooltipHeight}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx="12"
                      fill="#18221a"
                      stroke="#ccff00"
                      strokeWidth="1.2"
                      className="shadow-lg"
                    />
                    <text
                      x="0"
                      y={-tooltipHeight / 2 + 4}
                      textAnchor="middle"
                      fill="#ccff00"
                      className="text-[10px] font-black tracking-tight"
                    >
                      {formatCurrency(activePoint.data.total, currency)}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        ) : (
          /* VUE EN BARRES VERTICALES AVEC CHIFFRES ET TEXTES TOUJOURS VISIBLES */
          <div className="pt-3 pb-2">
            <div className="flex items-end justify-between h-44 gap-2 sm:gap-4 px-2 sm:px-4">
              {monthData.map((item, idx) => {
                const ratio = maxTotal > 0 ? item.total / maxTotal : 0;
                const heightPercent = Math.max(14, Math.round(ratio * 100));
                const isCurrent = item.monthKey === selectedMonth;

                return (
                  <div 
                    key={item.monthKey} 
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    onClick={() => {
                      setHoveredIndex(idx);
                      onSelectMonth?.(item.monthKey);
                    }}
                  >
                    {/* Chiffre toujours lisible au-dessus de la barre */}
                    <span className={`text-[10px] font-black mb-1.5 whitespace-nowrap ${
                      isCurrent ? 'text-[#ccff00]' : 'text-slate-300'
                    }`}>
                      {formatScaleValue(item.total)}
                    </span>

                    {/* Barre néon */}
                    <div className="w-full max-w-[42px] bg-[#161c17] rounded-2xl h-full flex items-end p-1 border border-[#232f26]">
                      <div 
                        className={`w-full rounded-xl transition-all duration-300 ${
                          isCurrent
                            ? 'bg-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.4)]'
                            : 'bg-[#2a3a2d] hover:bg-[#ccff00]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Libellé du mois */}
                    <span className={`text-[11px] font-bold mt-2 ${
                      isCurrent ? 'text-[#ccff00]' : 'text-slate-400'
                    }`}>
                      {item.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
