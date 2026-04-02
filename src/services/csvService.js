/**
 * csvService.js – Import / Export di task in formato CSV
 */

const CSV_HEADERS = ['title', 'description', 'notes', 'priority', 'status', 'due_date', 'recurrence', 'category'];

/**
 * Escape CSV value (RFC 4180)
 */
function escapeCSV(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Esporta task come stringa CSV
 */
export function exportTasksToCSV(tasks) {
  const rows = [CSV_HEADERS.join(',')];
  tasks.forEach(t => {
    rows.push(CSV_HEADERS.map(h => {
      if (h === 'category') return escapeCSV(t.categories?.name || '');
      return escapeCSV(t[h]);
    }).join(','));
  });
  return rows.join('\n');
}

/**
 * Scarica una stringa CSV come file
 */
export function downloadCSV(csvString, filename = 'taskflow_tasks.csv') {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse una stringa CSV in array di oggetti
 */
export function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values.length) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim().toLowerCase()] = values[idx] || '';
    });
    results.push(obj);
  }
  return results;
}

/**
 * Parse una singola riga CSV rispettando quote
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/**
 * Importa: converte array CSV parsed in payload per createTask
 */
export function csvRowsToTaskPayloads(rows, userId) {
  const validPriorities = ['low', 'medium', 'high'];
  return rows
    .filter(r => r.title && r.title.trim())
    .map(r => ({
      user_id: userId,
      title: r.title.trim(),
      description: (r.description || '').trim(),
      notes: (r.notes || '').trim(),
      priority: validPriorities.includes(r.priority) ? r.priority : 'medium',
      status: 'pending',
      due_date: r.due_date && !isNaN(Date.parse(r.due_date)) ? r.due_date : null,
      recurrence: ['daily', 'weekly', 'monthly'].includes(r.recurrence) ? r.recurrence : 'none',
    }));
}
