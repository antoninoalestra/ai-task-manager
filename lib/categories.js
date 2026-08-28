// lib/categories.js
export const CATEGORIES = {
  casa: {
    label: 'Casa',
    color: '#ea580c',
    bg: 'bg-orange-100/80',
    border: 'border-orange-300',
    text: 'text-orange-950',
    dot: 'bg-orange-600',
  },
  universita: {
    label: 'Università',
    color: '#d97706',
    bg: 'bg-amber-100/80',
    border: 'border-amber-300',
    text: 'text-amber-950',
    dot: 'bg-amber-600',
  },
  lavoro: {
    label: 'Lavoro',
    color: '#4338ca',
    bg: 'bg-indigo-100/80',
    border: 'border-indigo-300',
    text: 'text-indigo-950',
    dot: 'bg-indigo-600',
  },
  personale: {
    label: 'Personale',
    color: '#059669',
    bg: 'bg-emerald-100/80',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    dot: 'bg-emerald-600',
  },
  salute: {
    label: 'Salute',
    color: '#e11d48',
    bg: 'bg-rose-100/80',
    border: 'border-rose-300',
    text: 'text-rose-950',
    dot: 'bg-rose-600',
  },
  finanze: {
    label: 'Finanze',
    color: '#7e22ce',
    bg: 'bg-purple-100/80',
    border: 'border-purple-300',
    text: 'text-purple-950',
    dot: 'bg-purple-600',
  },
  generico: {
    label: 'Cose da fare',
    color: '#475569',
    bg: 'bg-slate-200/80',
    border: 'border-slate-300',
    text: 'text-slate-900',
    dot: 'bg-slate-600',
  },
};

export function getCategoryConfig(key) {
  return CATEGORIES[key] || CATEGORIES.generico;
}