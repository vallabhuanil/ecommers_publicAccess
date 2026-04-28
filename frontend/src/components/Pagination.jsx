import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);
  const visible = pages.filter(p => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="p-2 rounded-xl border border-surface-border hover:border-primary-500 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {visible.reduce((acc, p, idx, arr) => {
        if (idx > 0 && arr[idx - 1] !== p - 1) {
          acc.push(<span key={`dot-${p}`} className="text-gray-600 px-1">…</span>);
        }
        acc.push(
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
              p === page
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                : 'border border-surface-border hover:border-primary-500 text-gray-400 hover:text-white'
            }`}
          >
            {p + 1}
          </button>
        );
        return acc;
      }, [])}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="p-2 rounded-xl border border-surface-border hover:border-primary-500 disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
