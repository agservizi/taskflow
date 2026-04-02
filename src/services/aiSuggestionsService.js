/**
 * aiSuggestionsService.js – Suggerimenti locali basati su pattern (no cloud AI)
 * Analizza titoli e storico per suggerire priorità, categoria e orari migliori.
 */

const PRIORITY_KEYWORDS = {
  high: ['urgente', 'importante', 'critico', 'scadenza', 'deadline', 'asap', 'subito', 'emergenza'],
  medium: ['medio', 'normale', 'seguire', 'revisione', 'review'],
  low: ['opzionale', 'quando puoi', 'eventuale', 'idea', 'forse', 'nota'],
};

const CATEGORY_KEYWORDS = {
  lavoro: ['meeting', 'riunione', 'mail', 'email', 'report', 'progetto', 'cliente', 'call', 'presentazione', 'budget', 'fattura', 'ufficio'],
  casa: ['spesa', 'pulizia', 'bolletta', 'riparazione', 'cucina', 'giardino', 'bucato', 'lavatrice'],
  salute: ['palestra', 'dottore', 'medico', 'farmacia', 'allenamento', 'corsa', 'yoga', 'dieta', 'vitamina'],
  studio: ['esame', 'lezione', 'compiti', 'studiare', 'libro', 'corso', 'appunti', 'tesi'],
  personale: ['compleanno', 'regalo', 'vacanza', 'viaggio', 'cinema', 'ristorante', 'hobby'],
};

/**
 * Suggerisci priorità basata sul titolo
 */
export function suggestPriority(title) {
  const lower = (title || '').toLowerCase();
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return priority;
  }
  return null;
}

/**
 * Suggerisci categoria basata sul titolo
 */
export function suggestCategory(title, categories = []) {
  const lower = (title || '').toLowerCase();
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const match = categories.find(c => c.name.toLowerCase().includes(catName));
      if (match) return match;
    }
  }
  return null;
}

/**
 * Suggerisci tempo stimato basato su pattern storici
 */
export function suggestEstimatedMinutes(title, historicalTasks = []) {
  const lower = (title || '').toLowerCase();
  const similar = historicalTasks.filter(t =>
    t.estimated_minutes && t.title && t.title.toLowerCase().split(' ').some(w => w.length > 3 && lower.includes(w))
  );
  if (similar.length >= 2) {
    const avg = similar.reduce((sum, t) => sum + t.estimated_minutes, 0) / similar.length;
    return Math.round(avg / 5) * 5; // arrotonda a 5 min
  }
  return null;
}

/**
 * Suggerisci orario migliore basato su completamenti storici
 */
export function suggestBestTime(historicalTasks = []) {
  const completed = historicalTasks.filter(t => t.status === 'completed' && t.updated_at);
  if (completed.length < 5) return null;

  const hourCounts = {};
  completed.forEach(t => {
    const hour = new Date(t.updated_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (!bestHour) return null;

  const h = parseInt(bestHour[0]);
  if (h < 12) return { period: 'mattina', hour: h, label: `Sei più produttivo di mattina (${h}:00)` };
  if (h < 18) return { period: 'pomeriggio', hour: h, label: `Sei più produttivo di pomeriggio (${h}:00)` };
  return { period: 'sera', hour: h, label: `Sei più produttivo di sera (${h}:00)` };
}

/**
 * Genera tutti i suggerimenti per un nuovo task
 */
export function getTaskSuggestions(title, categories = [], historicalTasks = []) {
  const suggestions = {};

  const priority = suggestPriority(title);
  if (priority) suggestions.priority = { value: priority, reason: 'Basato su parole chiave nel titolo' };

  const category = suggestCategory(title, categories);
  if (category) suggestions.category = { value: category, reason: `Sembra un task di "${category.name}"` };

  const minutes = suggestEstimatedMinutes(title, historicalTasks);
  if (minutes) suggestions.estimatedMinutes = { value: minutes, reason: 'Basato su task simili precedenti' };

  const bestTime = suggestBestTime(historicalTasks);
  if (bestTime) suggestions.bestTime = bestTime;

  return suggestions;
}
