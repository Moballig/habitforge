// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import lunr from "lunr"; // @deno-types="npm:@types/lunr@2.3.7"
import { setupTable } from "@nodef/extra-sql";
import { loadColumns, columns } from "../columns/index.js";
//#endregion
//#region GLOBALS
let corpus = null;
//#endregion
//#region FUNCTIONS
/**
 * Load the hierarchy corpus from CSV file.
 * @param file CSV file path
 * @returns hierarchy corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records)map.set(r.code, r);
  return map;
}
/**
 * Setup the lunr index for the hierarchy corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('sno');
    this.field('sno');
    this.field('state');
    // this.pipeline.remove(lunr.stopWordFilter);
    for (const r of corpus.values())this.add(r);
  });
}
/**
 * Load the hierarchy corpus from the file.
 * @returns hierarchy corpus
 */ export async function loadHierarchy() {
  if (corpus) return corpus;
  const p = loadColumns();
  corpus = await loadFromCsv(hierarchyCsv());
  await p;
  return corpus;
}
/**
 * Get the path to the hierarchy CSV file.
 * @returns CSV file URL
 */ export function hierarchyCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the hierarchy table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function hierarchySql(tab = "hierarchy", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    parents: "TEXT",
    ancestry: "TEST",
    children: "TEXT"
  }, (await loadHierarchy()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      parents: "B",
      ancestry: "C",
      children: "B"
    }
  }, opt));
}
/**
 * Find matching hierarchy of a column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns `{code, parents, ancestry, children}` if found, else null
 * @example
 * ```javascript
 * ifct2017.hierarchy('soluble oxalic acid');
 * ifct2017.hierarchy('Soluble Oxalic Acid');
 * // → { parents: 'oxalt', ancestry: 'oxalt orgac', children: '' }
 *
 * ifct2017.hierarchy('what is hierarchy of total saturated fat?');
 * ifct2017.hierarchy('who are children of total saturated fat?');
 * // → { parents: 'fatce',
 * // →   ancestry: 'fatce',
 * // →   children:
 * // →    'f4d0 f6d0 f8d0 f10d0 f11d0 f12d0 f14d0 f15d0 f16d0 f18d0 f20d0 f22d0 f24d0' }
 * ```
 */ export function hierarchy(txt) {
  if (corpus == null) return null;
  const cs = columns(txt);
  if (!cs.length) return null;
  return corpus.get(cs[0].code) || null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9oaWVyYXJjaHkvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5pbXBvcnQge2xvYWRDb2x1bW5zLCBjb2x1bW5zfSBmcm9tIFwiLi4vY29sdW1ucy9pbmRleC5qc1wiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBUcmVlLWxpa2UgaGllcmFyY2h5IG9mIGEgbnV0cmllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIEhpZXJhcmNoeSB7XG4gIC8qKiBDb2x1bW4gY29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogTGlzdCBvZiBQYXJlbnQgY29sdW1ucywgc3BhY2Ugc2VwYXJhdGVkLiAqL1xuICBwYXJlbnRzOiBzdHJpbmcsXG4gIC8qKiBMaXN0IG9mIEFuY2VzdG9yIGNvbHVtbnMsIHNwYWNlIHNlcGFyYXRlZC4gKi9cbiAgYW5jZXN0cnk6IHN0cmluZyxcbiAgLyoqIExpc3Qgb2YgQ2hpbGQgY29sdW1ucywgc3BhY2Ugc2VwYXJhdGVkLiAqL1xuICBjaGlsZHJlbjogc3RyaW5nLFxufTtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gR0xPQkFMU1xubGV0IGNvcnB1czogTWFwPHN0cmluZywgSGllcmFyY2h5PiB8IG51bGwgPSBudWxsO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBGVU5DVElPTlNcbi8qKlxuICogTG9hZCB0aGUgaGllcmFyY2h5IGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgaGllcmFyY2h5IGNvcnB1c1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUNzdihmaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgbWFwICA9IG5ldyBNYXA8c3RyaW5nLCBIaWVyYXJjaHk+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3JkcylcbiAgICBtYXAuc2V0KHIuY29kZSwgciBhcyB1bmtub3duIGFzIEhpZXJhcmNoeSk7XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIGhpZXJhcmNoeSBjb3JwdXMuXG4gKiBAcmV0dXJucyBsdW5yIGluZGV4XG4gKi9cbmZ1bmN0aW9uIHNldHVwSW5kZXgoY29ycHVzOiBNYXA8c3RyaW5nLCBIaWVyYXJjaHk+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCdzdGF0ZScpO1xuICAgIC8vIHRoaXMucGlwZWxpbmUucmVtb3ZlKGx1bnIuc3RvcFdvcmRGaWx0ZXIpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXMudmFsdWVzKCkpXG4gICAgICB0aGlzLmFkZChyKTtcbiAgfSk7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBoaWVyYXJjaHkgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBoaWVyYXJjaHkgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkSGllcmFyY2h5KCk6IFByb21pc2U8TWFwPHN0cmluZywgSGllcmFyY2h5Pj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb25zdCBwID0gbG9hZENvbHVtbnMoKTtcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YoaGllcmFyY2h5Q3N2KCkpOyBhd2FpdCBwO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBoaWVyYXJjaHkgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhpZXJhcmNoeUNzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSBoaWVyYXJjaHkgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoaWVyYXJjaHlTcWwodGFiOiBzdHJpbmc9XCJoaWVyYXJjaHlcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2NvZGU6IFwiVEVYVFwiLCBwYXJlbnRzOiBcIlRFWFRcIiwgYW5jZXN0cnk6IFwiVEVTVFwiLCBjaGlsZHJlbjogXCJURVhUXCJ9LFxuICAgIChhd2FpdCBsb2FkSGllcmFyY2h5KCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcImNvZGVcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7Y29kZTogXCJBXCIsIHBhcmVudHM6IFwiQlwiLCBhbmNlc3RyeTogXCJDXCIsIGNoaWxkcmVuOiBcIkJcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgaGllcmFyY2h5IG9mIGEgY29sdW1uOmNvZGUvbmFtZS90YWdzIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBjb2x1bW46Y29kZS9uYW1lL3RhZ3MgcXVlcnlcbiAqIEByZXR1cm5zIGB7Y29kZSwgcGFyZW50cywgYW5jZXN0cnksIGNoaWxkcmVufWAgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LmhpZXJhcmNoeSgnc29sdWJsZSBveGFsaWMgYWNpZCcpO1xuICogaWZjdDIwMTcuaGllcmFyY2h5KCdTb2x1YmxlIE94YWxpYyBBY2lkJyk7XG4gKiAvLyDihpIgeyBwYXJlbnRzOiAnb3hhbHQnLCBhbmNlc3RyeTogJ294YWx0IG9yZ2FjJywgY2hpbGRyZW46ICcnIH1cbiAqXG4gKiBpZmN0MjAxNy5oaWVyYXJjaHkoJ3doYXQgaXMgaGllcmFyY2h5IG9mIHRvdGFsIHNhdHVyYXRlZCBmYXQ/Jyk7XG4gKiBpZmN0MjAxNy5oaWVyYXJjaHkoJ3dobyBhcmUgY2hpbGRyZW4gb2YgdG90YWwgc2F0dXJhdGVkIGZhdD8nKTtcbiAqIC8vIOKGkiB7IHBhcmVudHM6ICdmYXRjZScsXG4gKiAvLyDihpIgICBhbmNlc3RyeTogJ2ZhdGNlJyxcbiAqIC8vIOKGkiAgIGNoaWxkcmVuOlxuICogLy8g4oaSICAgICdmNGQwIGY2ZDAgZjhkMCBmMTBkMCBmMTFkMCBmMTJkMCBmMTRkMCBmMTVkMCBmMTZkMCBmMThkMCBmMjBkMCBmMjJkMCBmMjRkMCcgfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWVyYXJjaHkodHh0OiBzdHJpbmcpOiBIaWVyYXJjaHkgfCBudWxsIHtcbiAgaWYgKGNvcnB1cyA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY3MgPSBjb2x1bW5zKHR4dCk7XG4gIGlmICghY3MubGVuZ3RoKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGNvcnB1cy5nZXQoY3NbMF0uY29kZSkgfHwgbnVsbDtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLFlBQVksU0FBVSxXQUFXO0FBQ2pDLE9BQU8sVUFBVSxPQUFPLENBQUUsc0NBQXNDO0FBQ2hFLFNBQThDLFVBQVUsUUFBTyxtQkFBbUI7QUFDbEYsU0FBUSxXQUFXLEVBQUUsT0FBTyxRQUFPLHNCQUFzQjtBQWlCekQsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQXdDO0FBQzVDLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUNkLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFO0VBQ2xCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELFNBQVMsV0FBVyxNQUE4QjtFQUNoRCxPQUFPLEtBQUs7SUFDVixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCw2Q0FBNkM7SUFDN0MsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQzNCLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDYjtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLE1BQU0sSUFBSTtFQUNWLFNBQVMsTUFBTSxZQUFZO0VBQWlCLE1BQU07RUFDbEQsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsT0FBTyxZQUFZLE9BQU8sQ0FBQztBQUM3QjtBQUdBOzs7OztDQUtDLEdBQ0QsT0FBTyxlQUFlLGFBQWEsTUFBWSxXQUFXLEVBQUUsTUFBdUIsQ0FBQyxDQUFDO0VBQ25GLE9BQU8sV0FBVyxLQUFLO0lBQUMsTUFBTTtJQUFRLFNBQVM7SUFBUSxVQUFVO0lBQVEsVUFBVTtFQUFNLEdBQ3ZGLENBQUMsTUFBTSxlQUFlLEVBQUUsTUFBTSxJQUM5QixPQUFPLE1BQU0sQ0FBQztJQUFDLElBQUk7SUFBUSxPQUFPO0lBQU0sVUFBVTtNQUFDLE1BQU07TUFBSyxTQUFTO01BQUssVUFBVTtNQUFLLFVBQVU7SUFBRztFQUFDLEdBQUc7QUFDaEg7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FDRCxPQUFPLFNBQVMsVUFBVSxHQUFXO0VBQ25DLElBQUksVUFBVSxNQUFNLE9BQU87RUFDM0IsTUFBTSxLQUFLLFFBQVE7RUFDbkIsSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFLE9BQU87RUFDdkIsT0FBTyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSztBQUNuQyxFQUNBLFlBQVkifQ==