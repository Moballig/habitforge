// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import lunr from "lunr"; // @deno-types="npm:@types/lunr@2.3.7"
import { setupTable } from "@nodef/extra-sql";
//#endregion
//#region GLOBALS
let corpus = null;
let index = null;
//#endregion
//#region FUNCTIONS
/**
 * Load the codes corpus from CSV file.
 * @param file CSV file path
 * @returns codes corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records)map.set(r.name, r);
  return map;
}
/**
 * Setup the lunr index for the codes corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('key');
    this.field('name');
    this.field('code');
    this.pipeline.remove(lunr.stopWordFilter);
    for (const r of corpus?.values() || [])this.add({
      key: r.name,
      name: r.name.replace(/\W+/g, ' '),
      code: r.code
    });
  });
}
/**
 * Load the codes corpus from the file.
 * @returns codes corpus
 */ export async function loadCodes() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(codesCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the codes CSV file.
 * @returns CSV file URL
 */ export function codesCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the codes table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function codesSql(tab = "codes", opt = {}) {
  return setupTable(tab, {
    name: "TEXT",
    code: "TEXT"
  }, (await loadCodes()).values(), Object.assign({
    pk: "name",
    index: true,
    tsvector: {
      name: "A",
      code: "B"
    }
  }, opt));
}
/**
 * Find matching codes of an name/code query.
 * @param txt name/code query
 * @returns matches `[{name, code}]`
 * @example
 * ```javascript
 * codes('mango green');
 * codes('Raw mango');
 * // → [ { name: 'Mango, green, raw (Common)', code: 'D057' } ]
 *
 * codes('what is food code of atta?');
 * codes('atta code');
 * // → [ { name: 'Atta (H., P.)', code: 'A019' },
 * // →   { name: 'Gahama atta (O.)', code: 'A019' },
 * // →   { name: 'Wheat flour, atta (Common)', code: 'A019' } ]
 * ```
 */ export function codes(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb2Rlcy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKEMpIDIwMjUtMjYgU3ViaGFqaXQgU2FodVxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4vLyBTZWUgTElDRU5TRSBmb3IgZnVsbCB0ZXJtc1xuaW1wb3J0ICogYXMgY3N2ICBmcm9tIFwiQHN0ZC9jc3ZcIjtcbmltcG9ydCBsdW5yIGZyb20gXCJsdW5yXCI7ICAvLyBAZGVuby10eXBlcz1cIm5wbTpAdHlwZXMvbHVuckAyLjMuN1wiXG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogVW5pcXVlbHkgaWRlbnRpZmlhYmxlIGNvZGUgZm9yIGVhY2ggZm9vZC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29kZSB7XG4gIC8qKiBGb29kIE5hbWUuICovXG4gIG5hbWU6IHN0cmluZyxcbiAgLyoqIEZvb2QgQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nXG59XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIENvZGU+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGNvZGVzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgY29kZXMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIENvZGU+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3JkcylcbiAgICBtYXAuc2V0KHIubmFtZSwgciBhcyB1bmtub3duIGFzIENvZGUpO1xuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBjb2RlcyBjb3JwdXMuXG4gKiBAcmV0dXJucyBsdW5yIGluZGV4XG4gKi9cbmZ1bmN0aW9uIHNldHVwSW5kZXgoY29ycHVzOiBNYXA8c3RyaW5nLCBDb2RlPikge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZigna2V5Jyk7XG4gICAgdGhpcy5maWVsZCgnbmFtZScpO1xuICAgIHRoaXMuZmllbGQoJ2NvZGUnKTtcbiAgICB0aGlzLnBpcGVsaW5lLnJlbW92ZShsdW5yLnN0b3BXb3JkRmlsdGVyKTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgY29ycHVzPy52YWx1ZXMoKSB8fCBbXSlcbiAgICAgIHRoaXMuYWRkKHtrZXk6IHIubmFtZSwgbmFtZTogci5uYW1lLnJlcGxhY2UoL1xcVysvZywgJyAnKSwgY29kZTogci5jb2RlfSk7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29kZXMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBjb2RlcyBjb3JwdXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb2RlcygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIENvZGU+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGNvZGVzQ3N2KCkpO1xuICBpbmRleCAgPSBzZXR1cEluZGV4KGNvcnB1cyk7XG4gIHJldHVybiBjb3JwdXM7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGNvZGVzIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2Rlc0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSBjb2RlcyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvZGVzU3FsKHRhYjogc3RyaW5nPVwiY29kZXNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge25hbWU6IFwiVEVYVFwiLCBjb2RlOiBcIlRFWFRcIn0sXG4gICAgKGF3YWl0IGxvYWRDb2RlcygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJuYW1lXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge25hbWU6IFwiQVwiLCBjb2RlOiBcIkJcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgY29kZXMgb2YgYW4gbmFtZS9jb2RlIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBuYW1lL2NvZGUgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7bmFtZSwgY29kZX1dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGNvZGVzKCdtYW5nbyBncmVlbicpO1xuICogY29kZXMoJ1JhdyBtYW5nbycpO1xuICogLy8g4oaSIFsgeyBuYW1lOiAnTWFuZ28sIGdyZWVuLCByYXcgKENvbW1vbiknLCBjb2RlOiAnRDA1NycgfSBdXG4gKlxuICogY29kZXMoJ3doYXQgaXMgZm9vZCBjb2RlIG9mIGF0dGE/Jyk7XG4gKiBjb2RlcygnYXR0YSBjb2RlJyk7XG4gKiAvLyDihpIgWyB7IG5hbWU6ICdBdHRhIChILiwgUC4pJywgY29kZTogJ0EwMTknIH0sXG4gKiAvLyDihpIgICB7IG5hbWU6ICdHYWhhbWEgYXR0YSAoTy4pJywgY29kZTogJ0EwMTknIH0sXG4gKiAvLyDihpIgICB7IG5hbWU6ICdXaGVhdCBmbG91ciwgYXR0YSAoQ29tbW9uKScsIGNvZGU6ICdBMDE5JyB9IF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29kZXModHh0OiBzdHJpbmcpOiBDb2RlW10ge1xuICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBhOiBDb2RlW10gPSBbXTsgdHh0ID0gdHh0LnJlcGxhY2UoL1xcVy9nLCAnICcpO1xuICBjb25zdCBtYXRzID0gaW5kZXguc2VhcmNoKHR4dCk7IGxldCBtYXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoKTtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBpZiAoT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoID09PSBtYXgpIGEucHVzaChjb3JwdXM/LmdldChtYXQucmVmKSB8fCB7fSBhcyBDb2RlKTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FB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