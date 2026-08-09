// lib/categories.js
export const CATEGORIES = {
  casa: {
    label: 'Casa',
    color: '#FF9500', // Apple Orange
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  universita: {
    label: 'Università',
    color: '#AF52DE', // Apple Purple
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    dot: 'bg-purple-500',
  },
  lavoro: {
    label: 'Lavoro',
    color: '#007AFF', // Apple Blue
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  personale: {
    label: 'Personale',
    color: '#34C759', // Apple Green
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  salute: {
    label: 'Salute',
    color: '#FF2D55', // Apple Pink/Red
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
  },
  finanze: {
    label: 'Finanze',
    color: '#5856D6', // Apple Indigo
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    text: 'text-indigo-300',
    dot: 'bg-indigo-500',
  },
  generico: {
    label: 'Cose da fare',
    color: '#8E8E93', // Apple Gray
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
  },
};

export function getCategoryConfig(key) {
  return CATEGORIES[key] || CATEGORIES.generico;
}