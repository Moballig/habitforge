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
  let a = '(^|\\W+)(';
  for (const v of lst)a += v.length > 1 ? `${v}|` : `${v}\\.|`;
  a = a.substring(0, a.length - 1);
  a += `)(\\W+|$)`;
  return new RegExp(a, 'i');
}
/**
 * Load the languages corpus from CSV file.
 * @param file CSV file path
 * @returns languages corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const key = r.abbr.replace(/\W/g, '').toLowerCase();
    map.set(key, r);
  }
  return map;
}
/**
 * Load the languages corpus from the file.
 * @returns languages corpus
 */ export async function loadLanguages() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(languagesCsv());
  match = createRegex(corpus.keys());
  return corpus;
}
/**
 * Get the path to the languages CSV file.
 * @returns CSV file URL
 */ export function languagesCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the languages table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function languagesSql(tab = "languages", opt = {}) {
  return setupTable(tab, {
    abbr: "TEXT",
    lang: "TEXT"
  }, (await loadLanguages()).values(), Object.assign({
    pk: "abbr",
    index: true,
    tsvector: {
      abbr: "A",
      lang: "B"
    }
  }, opt));
}
/**
 * Find matching languages of an abbr/lang query.
 * @param txt abbr/lang query
 * @returns `{abbr, lang}` if found, else null
 * @example
 * ```javascript
 * ifct2017.languages('mal.');
 * ifct2017.languages('Mal');
 * // → { abbr: 'Mal.', lang: 'Malayalam' }
 *
 * ifct2017.languages('what is s.?');
 * ifct2017.languages('S. stands for?');
 * // → { abbr: 'S.', lang: 'Sanskrit' }
 *
 *
 * // Note:
 * // Full stops must immediately follow character, if present.
 * // For single character abbreviations, full stop is mandatory.
 * ```
 */ export function languages(txt) {
  if (match == null) return null;
  const re = /((\w\s+|\w\.\s*|\w\-\s*|\w$)+)|\w+/g;
  txt = txt.replace(re, (m)=>{
    const v = m.replace(/\W/g, '');
    return v.length === 1 ? m.trim() + ' ' : v + ' ';
  }).toLowerCase();
  const m = txt.match(match);
  if (m == null) return null;
  return corpus?.get(m[2].replace('.', '')) || null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9sYW5ndWFnZXMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogRnVsbCBmb3JtIG9mIGxhbmd1YWdlIGFiYnJldmlhdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGFuZ3VhZ2Uge1xuICAvKiogTGFuZ3VhZ2UuICovXG4gIGxhbmc6IHN0cmluZyxcbiAgLyoqIEFiYnJldmlhdGlvbiB1c2VkLiAqL1xuICBhYmJyOiBzdHJpbmdcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIExhbmd1YWdlPiB8IG51bGwgPSBudWxsO1xubGV0IG1hdGNoOiBSZWdFeHAgfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIENyZWF0ZSBhIHJlZ2V4IHRvIG1hdGNoIHRoZSBhYmJyZXZpYXRpb25zIGluIHRoZSBjb3JwdXMuXG4gKiBAcGFyYW0gbHN0IGxpc3Qgb2YgYWJicmV2aWF0aW9ucyB0byBtYXRjaFxuICogQHJldHVybnMgYSByZWdleCB0byBtYXRjaCB0aGUgYWJicmV2aWF0aW9uc1xuICovXG5mdW5jdGlvbiBjcmVhdGVSZWdleChsc3Q6IEl0ZXJhYmxlPHN0cmluZz4pOiBSZWdFeHAge1xuICBsZXQgYSA9ICcoXnxcXFxcVyspKCc7XG4gIGZvciAoY29uc3QgdiBvZiBsc3QpXG4gICAgYSArPSB2Lmxlbmd0aD4xPyBgJHt2fXxgOmAke3Z9XFxcXC58YDtcbiAgYSA9IGEuc3Vic3RyaW5nKDAsIGEubGVuZ3RoLTEpO1xuICBhICs9IGApKFxcXFxXK3wkKWA7XG4gIHJldHVybiBuZXcgUmVnRXhwKGEsICdpJyk7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBsYW5ndWFnZXMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBsYW5ndWFnZXMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIExhbmd1YWdlPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBrZXkgPSByLmFiYnIucmVwbGFjZSgvXFxXL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgIG1hcC5zZXQoa2V5LCByIGFzIHVua25vd24gYXMgTGFuZ3VhZ2UpO1xuICB9XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBsYW5ndWFnZXMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBsYW5ndWFnZXMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzKCk6IFByb21pc2U8TWFwPHN0cmluZywgTGFuZ3VhZ2U+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGxhbmd1YWdlc0NzdigpKTtcbiAgbWF0Y2ggID0gY3JlYXRlUmVnZXgoY29ycHVzLmtleXMoKSk7XG4gIHJldHVybiBjb3JwdXM7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGxhbmd1YWdlcyBDU1YgZmlsZS5cbiAqIEByZXR1cm5zIENTViBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZ3VhZ2VzQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGxhbmd1YWdlcyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxhbmd1YWdlc1NxbCh0YWI6IHN0cmluZz1cImxhbmd1YWdlc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7YWJicjogXCJURVhUXCIsIGxhbmc6IFwiVEVYVFwifSxcbiAgICAoYXdhaXQgbG9hZExhbmd1YWdlcygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJhYmJyXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2FiYnI6IFwiQVwiLCBsYW5nOiBcIkJcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgbGFuZ3VhZ2VzIG9mIGFuIGFiYnIvbGFuZyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgYWJici9sYW5nIHF1ZXJ5XG4gKiBAcmV0dXJucyBge2FiYnIsIGxhbmd9YCBpZiBmb3VuZCwgZWxzZSBudWxsXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcubGFuZ3VhZ2VzKCdtYWwuJyk7XG4gKiBpZmN0MjAxNy5sYW5ndWFnZXMoJ01hbCcpO1xuICogLy8g4oaSIHsgYWJicjogJ01hbC4nLCBsYW5nOiAnTWFsYXlhbGFtJyB9XG4gKlxuICogaWZjdDIwMTcubGFuZ3VhZ2VzKCd3aGF0IGlzIHMuPycpO1xuICogaWZjdDIwMTcubGFuZ3VhZ2VzKCdTLiBzdGFuZHMgZm9yPycpO1xuICogLy8g4oaSIHsgYWJicjogJ1MuJywgbGFuZzogJ1NhbnNrcml0JyB9XG4gKlxuICpcbiAqIC8vIE5vdGU6XG4gKiAvLyBGdWxsIHN0b3BzIG11c3QgaW1tZWRpYXRlbHkgZm9sbG93IGNoYXJhY3RlciwgaWYgcHJlc2VudC5cbiAqIC8vIEZvciBzaW5nbGUgY2hhcmFjdGVyIGFiYnJldmlhdGlvbnMsIGZ1bGwgc3RvcCBpcyBtYW5kYXRvcnkuXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhbmd1YWdlcyh0eHQ6IHN0cmluZyk6IExhbmd1YWdlIHwgbnVsbCB7XG4gIGlmIChtYXRjaD09bnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHJlID0gLygoXFx3XFxzK3xcXHdcXC5cXHMqfFxcd1xcLVxccyp8XFx3JCkrKXxcXHcrL2c7XG4gIHR4dCA9IHR4dC5yZXBsYWNlKHJlLCBtID0+IHtcbiAgICBjb25zdCB2ID0gbS5yZXBsYWNlKC9cXFcvZywgJycpO1xuICAgIHJldHVybiB2Lmxlbmd0aD09PTE/IG0udHJpbSgpKycgJyA6IHYrJyAnO1xuICB9KS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBtID0gdHh0Lm1hdGNoKG1hdGNoKTtcbiAgaWYgKG09PW51bGwpIHJldHVybiBudWxsO1xuICByZXR1cm4gY29ycHVzPy5nZXQobVsyXS5yZXBsYWNlKCcuJywgJycpKSB8fCBudWxsO1xufVxuLy8j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