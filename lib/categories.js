// lib/categories.js
export const CATEGORIES = {
  casa: {
    label: 'Casa',
    color: '#f97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
  },
  universita: {
    label: 'Università',
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-200',
    dot: 'bg-amber-400',
  },
  lavoro: {
    label: 'Lavoro',
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-300',
    dot: 'bg-blue-400',
  },
  personale: {
    label: 'Personale',
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  salute: {
    label: 'Salute',
    color: '#f43f5e',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  finanze: {
    label: 'Finanze',
    color: '#6366f1',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
  },
  generico: {
    label: 'Cose da fare',
    color: '#94a3b8',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  },
};

export function getCategoryConfig(key) {
  return CATEGORIES[key] || CATEGORIES.generico;
}