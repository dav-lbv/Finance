import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Nombre de lignes d'historique affichées par page, partout dans l'app. */
export const PAGE_SIZE = 5;

/** Découpe une liste en pages de 5 lignes ; revient à la page 1 quand `resetKey` change. */
export function usePager<T>(items: T[], resetKey?: unknown, size: number = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => setPage(1), [resetKey]);
  const current = Math.min(page, pageCount);
  return {
    page: current,
    setPage,
    pageCount,
    pageItems: items.slice((current - 1) * size, current * size),
  };
}

interface PagerProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Boutons « Précédent / Suivant » : n'apparaissent que s'il y a plus d'une page. */
export const Pager: React.FC<PagerProps> = ({ page, pageCount, onChange, className = '' }) => {
  if (pageCount <= 1) return null;
  const btn =
    'h-9 px-3.5 rounded-full bg-surface-2 border border-line-strong text-fg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition';
  return (
    <div className={`flex items-center justify-between gap-2 pt-3 ${className}`}>
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente">
        <ChevronLeft className="w-4 h-4" />
        Retour
      </button>
      <span className="text-[11px] font-semibold text-fg-muted tabular-nums">
        {page} / {pageCount}
      </span>
      <button type="button" className={btn} disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Page suivante">
        Suivant
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Liste paginée prête à l'emploi (5 lignes par vue, boutons Retour / Suivant). */
export function PagedList<T>({
  items,
  render,
  className = 'space-y-2',
  as: Tag = 'div',
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  className?: string;
  as?: 'div' | 'ul';
}) {
  const { page, setPage, pageCount, pageItems } = usePager(items, items.length);
  return (
    <>
      <Tag className={className}>{pageItems.map(render)}</Tag>
      <Pager page={page} pageCount={pageCount} onChange={setPage} />
    </>
  );
}
