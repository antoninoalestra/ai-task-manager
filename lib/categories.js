// lib/categories.js
export const CATEGORIES = {
  casa: {
    label: 'Casa',
    color: '#f97316',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  universita: {
    label: 'Università',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  lavoro: {
    label: 'Lavoro',
    color: '#4f46e5',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    dot: 'bg-indigo-600',
  },
  personale: {
    label: 'Personale',
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-600',
  },
  salute: {
    label: 'Salute',
    color: '#f43f5e',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    dot: 'bg-rose-600',
  },
  finanze: {
    label: 'Finanze',
    color: '#9333ea',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    dot: 'bg-purple-600',
  },
  generico: {
    label: 'Cose da fare',
    color: '#64748b',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },
};

export function getCategoryConfig(key) {
  return CATEGORIES[key] || CATEGORIES.generico;
}