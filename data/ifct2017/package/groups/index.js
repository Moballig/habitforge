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
 * Load the groups corpus from CSV file.
 * @param file CSV file path
 * @returns groups corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const entries = parseInt(r.entries, 10);
    map.set(r.code, {
      code: r.code,
      group: r.group,
      entries,
      tags: r.tags
    });
  }
  return map;
}
/**
 * Setup the lunr index for the groups corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('code');
    this.field('code');
    this.field('group');
    this.field('tags');
    this.pipeline.remove(lunr.stopWordFilter);
    for (const r of corpus.values())this.add(r);
  });
}
/**
 * Load the groups corpus from the file.
 * @returns groups corpus
 */ export async function loadGroups() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(groupsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the groups CSV file.
 * @returns CSV file URL
 */ export function groupsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the groups table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function groupsSql(tab = "groups", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    group: "TEXT",
    entries: "INT",
    tags: "TEXT"
  }, (await loadGroups()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      group: "B",
      tags: "C"
    }
  }, opt));
}
/**
 * Find matching groups of an code/group/tags query.
 * @param txt code/group/tags query
 * @returns matches `[{code, group, entries, tags}]`
 * @example
 * ```javascript
 * ifct2017.groups('cereals');
 * ifct2017.groups('Millet');
 * // → [ { code: 'A',
 * // →     group: 'Cereals and Millets',
 * // →     entries: 24,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' } ]
 *
 * ifct2017.groups('what is vegetable?');
 * ifct2017.groups('vegetable group code?');
 * // → [ { code: 'D',
 * // →     group: 'Other Vegetables',
 * // →     entries: 78,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' },
 * // →   { code: 'C',
 * // →     group: 'Green Leafy Vegetables',
 * // →     entries: 34,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' } ]
 * ```
 */ export function groups(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9ncm91cHMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIENhdGVnb3JpemF0aW9uIG9mIGZvb2QgYnkgaXRzIGNvbW1vbiBuYW1lcy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR3JvdXAge1xuICAvKiogQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogRm9vZCBncm91cHMuICovXG4gIGdyb3VwOiBzdHJpbmcsXG4gIC8qKiBOby4gb2YgZm9vZCBlbnRyaWVzLiAqL1xuICBlbnRyaWVzOiBudW1iZXIsXG4gIC8qKiBUYWdzLiAqL1xuICB0YWdzOiBzdHJpbmdcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIEdyb3VwPiB8IG51bGwgPSBudWxsO1xubGV0IGluZGV4OiBsdW5yLkluZGV4IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSBncm91cHMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBncm91cHMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIEdyb3VwPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBlbnRyaWVzID0gcGFyc2VJbnQoci5lbnRyaWVzLCAxMCk7XG4gICAgbWFwLnNldChyLmNvZGUsIHtjb2RlOiByLmNvZGUsIGdyb3VwOiByLmdyb3VwLCBlbnRyaWVzLCB0YWdzOiByLnRhZ3N9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBncm91cHMgY29ycHVzLlxuICogQHJldHVybnMgbHVuciBpbmRleFxuICovXG5mdW5jdGlvbiBzZXR1cEluZGV4KGNvcnB1czogTWFwPHN0cmluZywgR3JvdXA+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdjb2RlJyk7XG4gICAgdGhpcy5maWVsZCgnY29kZScpO1xuICAgIHRoaXMuZmllbGQoJ2dyb3VwJyk7XG4gICAgdGhpcy5maWVsZCgndGFncycpO1xuICAgIHRoaXMucGlwZWxpbmUucmVtb3ZlKGx1bnIuc3RvcFdvcmRGaWx0ZXIpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXMudmFsdWVzKCkpXG4gICAgICB0aGlzLmFkZChyKTtcbiAgfSk7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBncm91cHMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBncm91cHMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkR3JvdXBzKCk6IFByb21pc2U8TWFwPHN0cmluZywgR3JvdXA+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGdyb3Vwc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBncm91cHMgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3Vwc0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSBncm91cHMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBncm91cHNTcWwodGFiOiBzdHJpbmc9XCJncm91cHNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2NvZGU6IFwiVEVYVFwiLCBncm91cDogXCJURVhUXCIsIGVudHJpZXM6IFwiSU5UXCIsIHRhZ3M6IFwiVEVYVFwifSxcbiAgICAoYXdhaXQgbG9hZEdyb3VwcygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJjb2RlXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2NvZGU6IFwiQVwiLCBncm91cDogXCJCXCIsIHRhZ3M6IFwiQ1wifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBncm91cHMgb2YgYW4gY29kZS9ncm91cC90YWdzIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBjb2RlL2dyb3VwL3RhZ3MgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7Y29kZSwgZ3JvdXAsIGVudHJpZXMsIHRhZ3N9XWBcbiAqIEBleGFtcGxlXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiBpZmN0MjAxNy5ncm91cHMoJ2NlcmVhbHMnKTtcbiAqIGlmY3QyMDE3Lmdyb3VwcygnTWlsbGV0Jyk7XG4gKiAvLyDihpIgWyB7IGNvZGU6ICdBJyxcbiAqIC8vIOKGkiAgICAgZ3JvdXA6ICdDZXJlYWxzIGFuZCBNaWxsZXRzJyxcbiAqIC8vIOKGkiAgICAgZW50cmllczogMjQsXG4gKiAvLyDihpIgICAgIHRhZ3M6ICd2ZWdldGFyaWFuIGVnZ2V0YXJpYW4gZmlzaGV0YXJpYW4gdmVnJyB9IF1cbiAqXG4gKiBpZmN0MjAxNy5ncm91cHMoJ3doYXQgaXMgdmVnZXRhYmxlPycpO1xuICogaWZjdDIwMTcuZ3JvdXBzKCd2ZWdldGFibGUgZ3JvdXAgY29kZT8nKTtcbiAqIC8vIOKGkiBbIHsgY29kZTogJ0QnLFxuICogLy8g4oaSICAgICBncm91cDogJ090aGVyIFZlZ2V0YWJsZXMnLFxuICogLy8g4oaSICAgICBlbnRyaWVzOiA3OCxcbiAqIC8vIOKGkiAgICAgdGFnczogJ3ZlZ2V0YXJpYW4gZWdnZXRhcmlhbiBmaXNoZXRhcmlhbiB2ZWcnIH0sXG4gKiAvLyDihpIgICB7IGNvZGU6ICdDJyxcbiAqIC8vIOKGkiAgICAgZ3JvdXA6ICdHcmVlbiBMZWFmeSBWZWdldGFibGVzJyxcbiAqIC8vIOKGkiAgICAgZW50cmllczogMzQsXG4gKiAvLyDihpIgICAgIHRhZ3M6ICd2ZWdldGFyaWFuIGVnZ2V0YXJpYW4gZmlzaGV0YXJpYW4gdmVnJyB9IF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXBzKHR4dDogc3RyaW5nKTogR3JvdXBbXSB7XG4gIGlmIChpbmRleCA9PSBudWxsKSByZXR1cm4gW107XG4gIGNvbnN0IGE6IEdyb3VwW10gPSBbXTsgdHh0ID0gdHh0LnJlcGxhY2UoL1xcVy9nLCAnICcpO1xuICBjb25zdCBtYXRzID0gaW5kZXguc2VhcmNoKHR4dCk7IGxldCBtYXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoKTtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBpZiAoT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoID09PSBtYXgpIGEucHVzaChjb3JwdXM/LmdldChtYXQucmVmKSB8fCB7fSBhcyBHcm91cCk7XG4gIHJldHVybiBhO1xufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFDakMsT0FBTyxVQUFVLE9BQU8sQ0FBRSxzQ0FBc0M7QUFDaEUsU0FBOEMsVUFBVSxRQUFPLG1CQUFtQjtBQWlCbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQW9DO0FBQ3hDLElBQUksUUFBMkI7QUFDL0IsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQVM7SUFDdkIsTUFBTSxVQUFVLFNBQVMsRUFBRSxPQUFPLEVBQUU7SUFDcEMsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUU7TUFBQyxNQUFNLEVBQUUsSUFBSTtNQUFFLE9BQU8sRUFBRSxLQUFLO01BQUU7TUFBUyxNQUFNLEVBQUUsSUFBSTtJQUFBO0VBQ3RFO0VBQ0EsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsU0FBUyxXQUFXLE1BQTBCO0VBQzVDLE9BQU8sS0FBSztJQUNWLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLGNBQWM7SUFDeEMsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQzNCLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDYjtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsVUFBVSxNQUFZLFFBQVEsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDN0UsT0FBTyxXQUFXLEtBQUs7SUFBQyxNQUFNO0lBQVEsT0FBTztJQUFRLFNBQVM7SUFBTyxNQUFNO0VBQU0sR0FDL0UsQ0FBQyxNQUFNLFlBQVksRUFBRSxNQUFNLElBQzNCLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFRLE9BQU87SUFBTSxVQUFVO01BQUMsTUFBTTtNQUFLLE9BQU87TUFBSyxNQUFNO0lBQUc7RUFBQyxHQUFHO0FBQzNGO0FBR0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXdCQyxHQUNELE9BQU8sU0FBUyxPQUFPLEdBQVc7RUFDaEMsSUFBSSxTQUFTLE1BQU0sT0FBTyxFQUFFO0VBQzVCLE1BQU0sSUFBYSxFQUFFO0VBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPO0VBQ2hELE1BQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQztFQUFNLElBQUksTUFBTTtFQUMxQyxLQUFLLE1BQU0sT0FBTyxLQUNoQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU07RUFDaEUsS0FBSyxNQUFNLE9BQU8sS0FDaEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7RUFDMUYsT0FBTztBQUNULEVBQ0EsWUFBWSJ9