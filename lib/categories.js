// lib/categories.js
export const CATEGORIES = {
  casa: {
    label: 'Casa',
    color: '#fb923c',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
  },
  universita: {
    label: 'Università',
    color: '#fbbf24',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  lavoro: {
    label: 'Lavoro',
    color: '#818cf8',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
  },
  personale: {
    label: 'Personale',
    color: '#34d399',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  salute: {
    label: 'Salute',
    color: '#f472b6',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
  },
  finanze: {
    label: 'Finanze',
    color: '#c084fc',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
  },
  generico: {
    label: 'Cose da fare',
    color: '#94a3b8',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  },
};

export function getCategoryConfig(key) {
  return CATEGORIES[key] || CATEGORIES.generico;
}