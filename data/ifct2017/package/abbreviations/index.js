// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import { setupTable } from "@nodef/extra-sql";
//#endregion
//#region GLOBALS
let corpus = null;
let match = null;
//#endregion
//#region FUNCTIONS
/**
 * Create a regex to match the abbreviations in the corpus.
 * @param lst list of abbreviations to match
 * @returns a regex to match the abbreviations
 */ function createRegex(lst) {
  let a = '\\b(';
  for (const v of lst)a += v.length > 1 ? `${v}|` : `${v}\\.|`;
  a = a.substring(0, a.length - 1);
  a += `)\\b`;
  return new RegExp(a, 'i');
}
/**
 * Load the abbreviations corpus from CSV file.
 * @param file CSV file path
 * @returns abbreviations corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const abbr = (r.abbr || "").toLowerCase().replace(/\W/g, "");
    map.set(abbr, r);
  }
  return map;
}
/**
 * Load the abbreviations corpus from the file.
 * @returns abbreviations corpus {key ⇒ {abbr, full}}
 */ export async function loadAbbreviations() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(abbreviationsCsv());
  match = createRegex(corpus.keys());
  return corpus;
}
/**
 * Get the path to the abbreviations CSV file.
 * @returns CSV file URL
 */ export function abbreviationsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the abbreviations table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function abbreviationsSql(tab = "abbreviations", opt = {}) {
  return setupTable(tab, {
    abbr: "TEXT",
    full: "TEXT"
  }, (await loadAbbreviations()).values(), Object.assign({
    pk: "abbr",
    index: true,
    tsvector: {
      abbr: "A",
      full: "B"
    }
  }, opt));
}
/**
 * Find matching full form of an abbreviation query.
 * @param txt abbreviation query
 * @returns `{abbr, full}` if found, null otherwise
 * @example
 * ```javascript
 * abbreviations('GLV');
 * abbreviations('g l v');
 * // { abbr: 'GLV', full: 'Green Leafy Vegetables' }
 *
 * abbreviations('what is D.R.I.');
 * abbreviations('d. r. i. stands for?');
 * // { abbr: 'DRI', full: 'Dietary reference intake' }
 *
 *
 * // Note:
 * // for single character abbreviations, full stop is mandatory
 * // full stops must immediately follow character, if present
 * ```
 */ export function abbreviations(txt) {
  const re = /((\w\s+|\w\.\s*|\w\-\s*|\w$)+)|\w+/g;
  if (match == null) return null;
  txt = txt.replace(re, (m)=>{
    const v = m.replace(/\W/g, '');
    return v.length === 1 ? `${m.trim()} ` : `${v} `;
  }).toLowerCase();
  const m = txt.match(match) || txt.replace(/\b(\w+)s\b/g, '$1').match(match);
  if (m == null) return null;
  return corpus?.get(m[1].replace('.', '')) || null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9hYmJyZXZpYXRpb25zL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIEZ1bGwgZm9ybSBvZiBhYmJyZXZpYXRpb24gdXNlZCBpbiB0aGUgb3JpZ2luYWwgYm9vay4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWJicmV2aWF0aW9uIHtcbiAgLyoqIEFiYnJldmlhdGlvbiwgZS5nLiwgQlJNLiAqL1xuICBhYmJyOiBzdHJpbmc7XG4gIC8qKiBGdWxsIGZvcm0gb2YgdGhlIGFiYnJldmlhdGlvbiwgZS5nLiwgXCJCYXNhbCBtZXRhYm9saWMgcmF0ZVwiLiAqL1xuICBmdWxsOiBzdHJpbmc7XG59O1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBBYmJyZXZpYXRpb24+IHwgbnVsbCA9IG51bGw7XG5sZXQgbWF0Y2g6IFJlZ0V4cCB8IG51bGwgPSBudWxsO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBGVU5DVElPTlNcbi8qKlxuICogQ3JlYXRlIGEgcmVnZXggdG8gbWF0Y2ggdGhlIGFiYnJldmlhdGlvbnMgaW4gdGhlIGNvcnB1cy5cbiAqIEBwYXJhbSBsc3QgbGlzdCBvZiBhYmJyZXZpYXRpb25zIHRvIG1hdGNoXG4gKiBAcmV0dXJucyBhIHJlZ2V4IHRvIG1hdGNoIHRoZSBhYmJyZXZpYXRpb25zXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVJlZ2V4KGxzdDogSXRlcmFibGU8c3RyaW5nPik6IFJlZ0V4cCB7XG4gIGxldCBhID0gJ1xcXFxiKCc7XG4gIGZvciAoY29uc3QgdiBvZiBsc3QpXG4gICAgYSArPSB2Lmxlbmd0aD4xPyBgJHt2fXxgIDogYCR7dn1cXFxcLnxgO1xuICBhID0gYS5zdWJzdHJpbmcoMCwgYS5sZW5ndGgtMSk7XG4gIGEgKz0gYClcXFxcYmA7XG4gIHJldHVybiBuZXcgUmVnRXhwKGEsICdpJyk7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBhYmJyZXZpYXRpb25zIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgYWJicmV2aWF0aW9ucyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBBYmJyZXZpYXRpb24+PiB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgQWJicmV2aWF0aW9uPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBhYmJyID0gKHIuYWJiciB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcVy9nLCBcIlwiKTtcbiAgICBtYXAuc2V0KGFiYnIsIHIgYXMgdW5rbm93biBhcyBBYmJyZXZpYXRpb24pO1xuICB9XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBhYmJyZXZpYXRpb25zIGNvcnB1cyBmcm9tIHRoZSBmaWxlLlxuICogQHJldHVybnMgYWJicmV2aWF0aW9ucyBjb3JwdXMge2tleSDih5Ige2FiYnIsIGZ1bGx9fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEFiYnJldmlhdGlvbnMoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBBYmJyZXZpYXRpb24+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGFiYnJldmlhdGlvbnNDc3YoKSk7XG4gIG1hdGNoICA9IGNyZWF0ZVJlZ2V4KGNvcnB1cy5rZXlzKCkpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBhYmJyZXZpYXRpb25zIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhYmJyZXZpYXRpb25zQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGFiYnJldmlhdGlvbnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhYmJyZXZpYXRpb25zU3FsKHRhYjogc3RyaW5nPVwiYWJicmV2aWF0aW9uc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7YWJicjogXCJURVhUXCIsIGZ1bGw6IFwiVEVYVFwifSwgKGF3YWl0IGxvYWRBYmJyZXZpYXRpb25zKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcImFiYnJcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7YWJicjogXCJBXCIsIGZ1bGw6IFwiQlwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBmdWxsIGZvcm0gb2YgYW4gYWJicmV2aWF0aW9uIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBhYmJyZXZpYXRpb24gcXVlcnlcbiAqIEByZXR1cm5zIGB7YWJiciwgZnVsbH1gIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZVxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGFiYnJldmlhdGlvbnMoJ0dMVicpO1xuICogYWJicmV2aWF0aW9ucygnZyBsIHYnKTtcbiAqIC8vIHsgYWJicjogJ0dMVicsIGZ1bGw6ICdHcmVlbiBMZWFmeSBWZWdldGFibGVzJyB9XG4gKlxuICogYWJicmV2aWF0aW9ucygnd2hhdCBpcyBELlIuSS4nKTtcbiAqIGFiYnJldmlhdGlvbnMoJ2QuIHIuIGkuIHN0YW5kcyBmb3I/Jyk7XG4gKiAvLyB7IGFiYnI6ICdEUkknLCBmdWxsOiAnRGlldGFyeSByZWZlcmVuY2UgaW50YWtlJyB9XG4gKlxuICpcbiAqIC8vIE5vdGU6XG4gKiAvLyBmb3Igc2luZ2xlIGNoYXJhY3RlciBhYmJyZXZpYXRpb25zLCBmdWxsIHN0b3AgaXMgbWFuZGF0b3J5XG4gKiAvLyBmdWxsIHN0b3BzIG11c3QgaW1tZWRpYXRlbHkgZm9sbG93IGNoYXJhY3RlciwgaWYgcHJlc2VudFxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhYmJyZXZpYXRpb25zKHR4dDogc3RyaW5nKTogQWJicmV2aWF0aW9uIHwgbnVsbCB7XG4gIGNvbnN0IHJlID0gLygoXFx3XFxzK3xcXHdcXC5cXHMqfFxcd1xcLVxccyp8XFx3JCkrKXxcXHcrL2c7XG4gIGlmIChtYXRjaCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgdHh0ID0gdHh0LnJlcGxhY2UocmUsIChtKSA9PiB7XG4gICAgY29uc3QgdiA9IG0ucmVwbGFjZSgvXFxXL2csICcnKTtcbiAgICByZXR1cm4gdi5sZW5ndGggPT09IDE/IGAke20udHJpbSgpfSBgIDogYCR7dn0gYFxuICB9KS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBtID0gdHh0Lm1hdGNoKG1hdGNoKSB8fCB0eHQucmVwbGFjZSgvXFxiKFxcdyspc1xcYi9nLCAnJDEnKS5tYXRjaChtYXRjaCk7XG4gIGlmIChtID09IG51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4gY29ycHVzPy5nZXQobVsxXS5yZXBsYWNlKCcuJywgJycpKSB8fCBudWxsO1xufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFDakMsU0FBOEMsVUFBVSxRQUFPLG1CQUFtQjtBQWFsRixZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBMkM7QUFDL0MsSUFBSSxRQUF1QjtBQUMzQixZQUFZO0FBS1osbUJBQW1CO0FBQ25COzs7O0NBSUMsR0FDRCxTQUFTLFlBQVksR0FBcUI7RUFDeEMsSUFBSSxJQUFJO0VBQ1IsS0FBSyxNQUFNLEtBQUssSUFDZCxLQUFLLEVBQUUsTUFBTSxHQUFDLElBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUM7RUFDdkMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxHQUFDO0VBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUM7RUFDWCxPQUFPLElBQUksT0FBTyxHQUFHO0FBQ3ZCO0FBR0E7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUFTO0lBQ3ZCLE1BQU0sT0FBTyxDQUFDLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU87SUFDekQsSUFBSSxHQUFHLENBQUMsTUFBTTtFQUNoQjtFQUNBLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sZUFBZTtFQUNwQixJQUFJLFFBQVEsT0FBTztFQUNuQixTQUFTLE1BQU0sWUFBWTtFQUMzQixRQUFTLFlBQVksT0FBTyxJQUFJO0VBQ2hDLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSxpQkFBaUIsTUFBWSxlQUFlLEVBQUUsTUFBdUIsQ0FBQyxDQUFDO0VBQzNGLE9BQU8sV0FBVyxLQUFLO0lBQUMsTUFBTTtJQUFRLE1BQU07RUFBTSxHQUFHLENBQUMsTUFBTSxtQkFBbUIsRUFBRSxNQUFNLElBQ3JGLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFRLE9BQU87SUFBTSxVQUFVO01BQUMsTUFBTTtNQUFLLE1BQU07SUFBRztFQUFDLEdBQUc7QUFDL0U7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CQyxHQUNELE9BQU8sU0FBUyxjQUFjLEdBQVc7RUFDdkMsTUFBTSxLQUFLO0VBQ1gsSUFBSSxTQUFTLE1BQU0sT0FBTztFQUMxQixNQUFNLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQztJQUNyQixNQUFNLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTztJQUMzQixPQUFPLEVBQUUsTUFBTSxLQUFLLElBQUcsR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0VBQ2pELEdBQUcsV0FBVztFQUNkLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksT0FBTyxDQUFDLGVBQWUsTUFBTSxLQUFLLENBQUM7RUFDckUsSUFBSSxLQUFLLE1BQU0sT0FBTztFQUN0QixPQUFPLFFBQVEsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVE7QUFDL0MsRUFDQSxZQUFZIn0=