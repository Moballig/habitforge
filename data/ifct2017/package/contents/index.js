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
 * Load the contents corpus from CSV file.
 * @param file CSV file path
 * @returns contents corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records)map.set(r.sno, r);
  return map;
}
/**
 * Setup the lunr index for the contents corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('sno');
    this.field('sno');
    this.field('title');
    this.field('pagenos');
    for (const r of corpus.values())this.add(r);
  });
}
/**
 * Load the contents corpus from the file.
 * @returns contents corpus
 */ export async function loadContents() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(contentsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the contents CSV file.
 * @returns CSV file URL
 */ export function contentsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the contents table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function contentsSql(tab = "contents", opt = {}) {
  return setupTable(tab, {
    sno: "TEXT",
    title: "TEXT",
    pagenos: "TEXT"
  }, (await loadContents()).values(), Object.assign({
    pk: "sno",
    index: true,
    tsvector: {
      sno: "A",
      title: "B",
      pagenos: "C"
    }
  }, opt));
}
/**
 * Find matching contents of an sno/title/pagenos query.
 * @param txt sno/title/pagenos query
 * @returns matches `[{sno, title, pagenos}]`
 * @example
 * ```javascript
 * ifct2017.contents('table 2');
 * ifct2017.contents('Water soluble vitamins');
 * // → [ { sno: '6.2.',
 * // →     title: 'Table 2:  Water Soluble Vitamins',
 * // →     pagenos: '31' } ]
 *
 * ifct2017.contents('what is page number of table 3?');
 * ifct2017.contents('fat soluble vitamin page number');
 * // → [ { sno: '6.3.',
 * // →     title: 'Table 3:  Fat Soluble Vitamins',
 * // →     pagenos: '61' } ]
 * ```
 */ export function contents(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb250ZW50cy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKEMpIDIwMjUtMjYgU3ViaGFqaXQgU2FodVxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4vLyBTZWUgTElDRU5TRSBmb3IgZnVsbCB0ZXJtc1xuaW1wb3J0ICogYXMgY3N2ICBmcm9tIFwiQHN0ZC9jc3ZcIjtcbmltcG9ydCBsdW5yIGZyb20gXCJsdW5yXCI7ICAvLyBAZGVuby10eXBlcz1cIm5wbTpAdHlwZXMvbHVuckAyLjMuN1wiXG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogQ29udGVudCBpbiB0aGUgb3JpZ2luYWwgYm9vay4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29udGVudCB7XG4gIC8qKiBTLiBOby4gKi9cbiAgc25vOiBzdHJpbmcsXG4gIC8qKiBUaXRsZS4gKi9cbiAgdGl0bGU6IHN0cmluZyxcbiAgLyoqIFBhZ2UgTm9zLiAqL1xuICBwYWdlbm9zOiBzdHJpbmdcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIENvbnRlbnQ+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGNvbnRlbnRzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgY29udGVudHMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIENvbnRlbnQ+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3JkcylcbiAgICBtYXAuc2V0KHIuc25vLCByIGFzIHVua25vd24gYXMgQ29udGVudCk7XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIGNvbnRlbnRzIGNvcnB1cy5cbiAqIEByZXR1cm5zIGx1bnIgaW5kZXhcbiAqL1xuZnVuY3Rpb24gc2V0dXBJbmRleChjb3JwdXM6IE1hcDxzdHJpbmcsIENvbnRlbnQ+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCd0aXRsZScpO1xuICAgIHRoaXMuZmllbGQoJ3BhZ2Vub3MnKTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgY29ycHVzLnZhbHVlcygpKVxuICAgICAgdGhpcy5hZGQocik7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29udGVudHMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBjb250ZW50cyBjb3JwdXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb250ZW50cygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIENvbnRlbnQ+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGNvbnRlbnRzQ3N2KCkpO1xuICBpbmRleCAgPSBzZXR1cEluZGV4KGNvcnB1cyk7XG4gIHJldHVybiBjb3JwdXM7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGNvbnRlbnRzIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50c0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSBjb250ZW50cyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbnRlbnRzU3FsKHRhYjogc3RyaW5nPVwiY29udGVudHNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge3NubzogXCJURVhUXCIsIHRpdGxlOiBcIlRFWFRcIiwgcGFnZW5vczogXCJURVhUXCJ9LFxuICAgIChhd2FpdCBsb2FkQ29udGVudHMoKSkudmFsdWVzKCkgYXMgSXRlcmFibGU8Um93RGF0YT4sXG4gICAgT2JqZWN0LmFzc2lnbih7cGs6IFwic25vXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge3NubzogXCJBXCIsIHRpdGxlOiBcIkJcIiwgcGFnZW5vczogXCJDXCJ9fSwgb3B0KSk7XG59XG5cblxuLyoqXG4gKiBGaW5kIG1hdGNoaW5nIGNvbnRlbnRzIG9mIGFuIHNuby90aXRsZS9wYWdlbm9zIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBzbm8vdGl0bGUvcGFnZW5vcyBxdWVyeVxuICogQHJldHVybnMgbWF0Y2hlcyBgW3tzbm8sIHRpdGxlLCBwYWdlbm9zfV1gXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuY29udGVudHMoJ3RhYmxlIDInKTtcbiAqIGlmY3QyMDE3LmNvbnRlbnRzKCdXYXRlciBzb2x1YmxlIHZpdGFtaW5zJyk7XG4gKiAvLyDihpIgWyB7IHNubzogJzYuMi4nLFxuICogLy8g4oaSICAgICB0aXRsZTogJ1RhYmxlIDI6ICBXYXRlciBTb2x1YmxlIFZpdGFtaW5zJyxcbiAqIC8vIOKGkiAgICAgcGFnZW5vczogJzMxJyB9IF1cbiAqXG4gKiBpZmN0MjAxNy5jb250ZW50cygnd2hhdCBpcyBwYWdlIG51bWJlciBvZiB0YWJsZSAzPycpO1xuICogaWZjdDIwMTcuY29udGVudHMoJ2ZhdCBzb2x1YmxlIHZpdGFtaW4gcGFnZSBudW1iZXInKTtcbiAqIC8vIOKGkiBbIHsgc25vOiAnNi4zLicsXG4gKiAvLyDihpIgICAgIHRpdGxlOiAnVGFibGUgMzogIEZhdCBTb2x1YmxlIFZpdGFtaW5zJyxcbiAqIC8vIOKGkiAgICAgcGFnZW5vczogJzYxJyB9IF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGVudHModHh0OiBzdHJpbmcpOiBDb250ZW50W10ge1xuICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBhOiBDb250ZW50W10gPSBbXTsgdHh0ID0gdHh0LnJlcGxhY2UoL1xcVy9nLCAnICcpO1xuICBjb25zdCBtYXRzID0gaW5kZXguc2VhcmNoKHR4dCk7IGxldCBtYXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoKTtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBpZiAoT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoID09PSBtYXgpIGEucHVzaChjb3JwdXM/LmdldChtYXQucmVmKSB8fCB7fSBhcyBDb250ZW50KTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBZWxGLFlBQVk7QUFLWixpQkFBaUI7QUFDakIsSUFBSSxTQUFzQztBQUMxQyxJQUFJLFFBQTJCO0FBQy9CLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUNkLElBQUksR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFO0VBQ2pCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELFNBQVMsV0FBVyxNQUE0QjtFQUM5QyxPQUFPLEtBQUs7SUFDVixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQzNCLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDYjtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsWUFBWSxNQUFZLFVBQVUsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDakYsT0FBTyxXQUFXLEtBQUs7SUFBQyxLQUFLO0lBQVEsT0FBTztJQUFRLFNBQVM7RUFBTSxHQUNqRSxDQUFDLE1BQU0sY0FBYyxFQUFFLE1BQU0sSUFDN0IsT0FBTyxNQUFNLENBQUM7SUFBQyxJQUFJO0lBQU8sT0FBTztJQUFNLFVBQVU7TUFBQyxLQUFLO01BQUssT0FBTztNQUFLLFNBQVM7SUFBRztFQUFDLEdBQUc7QUFDNUY7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JDLEdBQ0QsT0FBTyxTQUFTLFNBQVMsR0FBVztFQUNsQyxJQUFJLFNBQVMsTUFBTSxPQUFPLEVBQUU7RUFDNUIsTUFBTSxJQUFlLEVBQUU7RUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU87RUFDbEQsTUFBTSxPQUFPLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQzFDLEtBQUssTUFBTSxPQUFPLEtBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTTtFQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztFQUMxRixPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=