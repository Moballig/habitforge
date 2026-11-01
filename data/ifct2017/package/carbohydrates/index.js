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
 * Load the carbohydrates corpus from CSV file.
 * @param file CSV file path
 * @returns carbohydrates corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const hydrolysis = parseFloat(r.hydrolysis) || NaN;
    const monosaccharide = r.sno === '1' ? 1 : parseFloat(r.monosaccharide.substring(2)) || NaN;
    map.set(r.sno, {
      sno: r.sno,
      carbohydrate: r.carbohydrate,
      hydrolysis,
      monosaccharide
    });
  }
  return map;
}
/**
 * Setup the lunr index for the carbohydrates corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('sno');
    this.field('sno');
    this.field('carbohydrate');
    for (const r of corpus?.values() || [])this.add(r);
  });
}
/**
 * Load the carbohydrates corpus from the file.
 * @returns carbohydrates corpus
 */ export async function loadCarbohydrates() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(carbohydratesCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the carbohydrates CSV file.
 * @returns CSV file URL
 */ export function carbohydratesCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the carbohydrates table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function carbohydratesSql(tab = "carbohydrates", opt = {}) {
  return setupTable(tab, {
    sno: "TEXT",
    carbohydrate: "TEXT",
    hydrolysis: "REAL",
    monosaccharide: "TEXT"
  }, (await loadCarbohydrates()).values(), Object.assign({
    pk: "sno",
    index: true,
    tsvector: {
      sno: "A",
      carbohydrate: "B"
    }
  }, opt));
}
/**
 * Find matching carbohydrates of an sno/carbohydrate query.
 * @param txt sno/carbohydrate query
 * @returns matches `[{sno, carbohydrate, hydrolysis, monosaccharide}]`
 * @example
 * ```javascript
 * ifct2017.carbohydrates('monosaccharide');
 * ifct2017.carbohydrates('Glucose');
 * // → [ { sno: '1',
 * // →     carbohydrate: 'Monosaccharides e.g. glucose',
 * // →     hydrolysis: 100,
 * // →     monosaccharide: 1 } ]
 *
 * ifct2017.carbohydrates('what is carbohydrate conversion factor of disaccharides?');
 * ifct2017.carbohydrates('maltose conversion factor');
 * // → [ { sno: '2',
 * // →     carbohydrate: 'Disaccharides e.g. sucrose, lactose, maltose',
 * // →     hydrolysis: 105,
 * // →     monosaccharide: 1.05 } ]
 * ```
 */ export function carbohydrates(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jYXJib2h5ZHJhdGVzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB7dHlwZSBSb3dEYXRhLCB0eXBlIFNldHVwVGFibGVPcHRpb25zLCBzZXR1cFRhYmxlfSBmcm9tIFwiQG5vZGVmL2V4dHJhLXNxbFwiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBDb252ZXJzaW9uIG9mIGNhcmJvaHlkcmF0ZSB3ZWlnaHQgdG8gbW9ub3NhY2NoYXJpZGUgZXF1aXZhbGVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2FyYm9oeWRyYXRlIHtcbiAgLyoqIFMuIE5vLiAqL1xuICBzbm86IHN0cmluZyxcbiAgLyoqIENhcmJvaHlkcmF0ZS4gKi9cbiAgY2FyYm9oeWRyYXRlOiBzdHJpbmcsXG4gIC8qKiBFcXVpdmFsZW50IGFmdGVyIEh5ZHJvbHlzaXMgKGcvMTAwZykuICovXG4gIGh5ZHJvbHlzaXM6IG51bWJlcixcbiAgLyoqIENvbnZlcnNpb24gdG8gbW9ub3NhY2NoYXJpZGUgZXF1aXZhbGVudC4gKi9cbiAgbW9ub3NhY2NoYXJpZGU6IG51bWJlcixcbn1cbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gR0xPQkFMU1xubGV0IGNvcnB1czogTWFwPHN0cmluZywgQ2FyYm9oeWRyYXRlPiB8IG51bGwgPSBudWxsO1xubGV0IGluZGV4OiBsdW5yLkluZGV4IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSBjYXJib2h5ZHJhdGVzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgY2FyYm9oeWRyYXRlcyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgQ2FyYm9oeWRyYXRlPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBoeWRyb2x5c2lzICAgICA9IHBhcnNlRmxvYXQoci5oeWRyb2x5c2lzKSB8fCBOYU47XG4gICAgY29uc3QgbW9ub3NhY2NoYXJpZGUgPSByLnNubz09PScxJz8gMSA6IHBhcnNlRmxvYXQoci5tb25vc2FjY2hhcmlkZS5zdWJzdHJpbmcoMikpIHx8IE5hTjtcbiAgICBtYXAuc2V0KHIuc25vLCB7c25vOiByLnNubywgY2FyYm9oeWRyYXRlOiByLmNhcmJvaHlkcmF0ZSwgaHlkcm9seXNpcywgbW9ub3NhY2NoYXJpZGV9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBjYXJib2h5ZHJhdGVzIGNvcnB1cy5cbiAqIEByZXR1cm5zIGx1bnIgaW5kZXhcbiAqL1xuZnVuY3Rpb24gc2V0dXBJbmRleChjb3JwdXM6IE1hcDxzdHJpbmcsIENhcmJvaHlkcmF0ZT4pIHtcbiAgcmV0dXJuIGx1bnIoZnVuY3Rpb24odGhpczogbHVuci5CdWlsZGVyKSB7XG4gICAgdGhpcy5yZWYoJ3NubycpO1xuICAgIHRoaXMuZmllbGQoJ3NubycpO1xuICAgIHRoaXMuZmllbGQoJ2NhcmJvaHlkcmF0ZScpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXM/LnZhbHVlcygpIHx8IFtdKVxuICAgICAgdGhpcy5hZGQocik7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY2FyYm9oeWRyYXRlcyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGNhcmJvaHlkcmF0ZXMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQ2FyYm9oeWRyYXRlcygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIENhcmJvaHlkcmF0ZT4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YoY2FyYm9oeWRyYXRlc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBjYXJib2h5ZHJhdGVzIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYXJib2h5ZHJhdGVzQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGNhcmJvaHlkcmF0ZXMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYXJib2h5ZHJhdGVzU3FsKHRhYjogc3RyaW5nPVwiY2FyYm9oeWRyYXRlc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7c25vOiBcIlRFWFRcIiwgY2FyYm9oeWRyYXRlOiBcIlRFWFRcIiwgaHlkcm9seXNpczogXCJSRUFMXCIsIG1vbm9zYWNjaGFyaWRlOiBcIlRFWFRcIn0sXG4gICAgKGF3YWl0IGxvYWRDYXJib2h5ZHJhdGVzKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcInNub1wiLCBpbmRleDogdHJ1ZSwgdHN2ZWN0b3I6IHtzbm86IFwiQVwiLCBjYXJib2h5ZHJhdGU6IFwiQlwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBjYXJib2h5ZHJhdGVzIG9mIGFuIHNuby9jYXJib2h5ZHJhdGUgcXVlcnkuXG4gKiBAcGFyYW0gdHh0IHNuby9jYXJib2h5ZHJhdGUgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7c25vLCBjYXJib2h5ZHJhdGUsIGh5ZHJvbHlzaXMsIG1vbm9zYWNjaGFyaWRlfV1gXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuY2FyYm9oeWRyYXRlcygnbW9ub3NhY2NoYXJpZGUnKTtcbiAqIGlmY3QyMDE3LmNhcmJvaHlkcmF0ZXMoJ0dsdWNvc2UnKTtcbiAqIC8vIOKGkiBbIHsgc25vOiAnMScsXG4gKiAvLyDihpIgICAgIGNhcmJvaHlkcmF0ZTogJ01vbm9zYWNjaGFyaWRlcyBlLmcuIGdsdWNvc2UnLFxuICogLy8g4oaSICAgICBoeWRyb2x5c2lzOiAxMDAsXG4gKiAvLyDihpIgICAgIG1vbm9zYWNjaGFyaWRlOiAxIH0gXVxuICpcbiAqIGlmY3QyMDE3LmNhcmJvaHlkcmF0ZXMoJ3doYXQgaXMgY2FyYm9oeWRyYXRlIGNvbnZlcnNpb24gZmFjdG9yIG9mIGRpc2FjY2hhcmlkZXM/Jyk7XG4gKiBpZmN0MjAxNy5jYXJib2h5ZHJhdGVzKCdtYWx0b3NlIGNvbnZlcnNpb24gZmFjdG9yJyk7XG4gKiAvLyDihpIgWyB7IHNubzogJzInLFxuICogLy8g4oaSICAgICBjYXJib2h5ZHJhdGU6ICdEaXNhY2NoYXJpZGVzIGUuZy4gc3Vjcm9zZSwgbGFjdG9zZSwgbWFsdG9zZScsXG4gKiAvLyDihpIgICAgIGh5ZHJvbHlzaXM6IDEwNSxcbiAqIC8vIOKGkiAgICAgbW9ub3NhY2NoYXJpZGU6IDEuMDUgfSBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhcmJvaHlkcmF0ZXModHh0OiBzdHJpbmcpOiBDYXJib2h5ZHJhdGVbXSB7XG4gIGlmIChpbmRleCA9PSBudWxsKSByZXR1cm4gW107XG4gIGNvbnN0IGE6IENhcmJvaHlkcmF0ZVtdID0gW107IHR4dCA9IHR4dC5yZXBsYWNlKC9cXFcvZywgJyAnKTtcbiAgY29uc3QgbWF0cyA9IGluZGV4LnNlYXJjaCh0eHQpOyBsZXQgbWF4ID0gMDtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBtYXggPSBNYXRoLm1heChtYXgsIE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCk7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgaWYgKE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCA9PT0gbWF4KSBhLnB1c2goY29ycHVzPy5nZXQobWF0LnJlZikgfHwge30gYXMgQ2FyYm9oeWRyYXRlKTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBaUJsRixZQUFZO0FBS1osaUJB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