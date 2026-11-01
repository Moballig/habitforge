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
 * Load the jones factors corpus from CSV file.
 * @param file CSV file path
 * @returns jones factors corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const factor = parseFloat(r.factor);
    map.set(r.food, {
      food: r.food,
      factor
    });
  }
  return map;
}
/**
 * Setup the lunr index for the jones factors corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('key');
    this.field('food');
    for (const r of corpus.values())this.add({
      key: r.food,
      food: r.food.replace(/[\W\s]+/g, ' ')
    });
  });
}
/**
 * Load the jones factors corpus from the file.
 * @returns jones factors corpus
 */ export async function loadJonesFactors() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(jonesFactorsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the jones factors CSV file.
 * @returns CSV file URL
 */ export function jonesFactorsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the jones factors table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function jonesFactorsSql(tab = "jonesfactors", opt = {}) {
  return setupTable(tab, {
    food: "TEXT",
    factor: "REAL"
  }, (await loadJonesFactors()).values(), Object.assign({
    pk: "food",
    index: true,
    tsvector: {
      food: "A"
    }
  }, opt));
}
/**
 * Find matching jones factors of a food query.
 * @param txt food query
 * @returns matches `[{food, factor}]`
 * @example
 * ```javascript
 * ifct2017.jonesFactors('maida');
 * ifct2017.jonesFactors('Refined wheat');
 * // → [ { food: 'Refined wheat flour (Maida)', factor: '5.70' } ]
 *
 * ifct2017.jonesFactors('what is jones factor of barley?');
 * ifct2017.jonesFactors('jones factor of oats');
 * // → [ { food: 'Barley and its flour;Rye and its flour;Oats',
 * // →     factor: '5.83' } ]
 * ```
 */ export function jonesFactors(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ').replace(/factor/gi, '');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a.length > 0 ? a : [
    corpus?.get('Food where specific factor is not listed')
  ];
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9qb25lc2ZhY3RvcnMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIEpvbmVzIGZhY3RvciBmb3IgY29udmVyc2lvbiBvZiBuaXRyb2dlbiB0byBwcm90ZWluLiAqL1xuZXhwb3J0IGludGVyZmFjZSBKb25lc0ZhY3RvciB7XG4gIC8qKiBGb29kLiAqL1xuICBmb29kOiBzdHJpbmcsXG4gIC8qKiBDb252ZXJzaW9uIEZhY3Rvci4gKi9cbiAgZmFjdG9yOiBudW1iZXJcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIEpvbmVzRmFjdG9yPiB8IG51bGwgPSBudWxsO1xubGV0IGluZGV4OiBsdW5yLkluZGV4IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSBqb25lcyBmYWN0b3JzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgam9uZXMgZmFjdG9ycyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgSm9uZXNGYWN0b3I+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IGZhY3RvciA9IHBhcnNlRmxvYXQoci5mYWN0b3IpO1xuICAgIG1hcC5zZXQoci5mb29kLCB7Zm9vZDogci5mb29kLCBmYWN0b3J9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBqb25lcyBmYWN0b3JzIGNvcnB1cy5cbiAqIEByZXR1cm5zIGx1bnIgaW5kZXhcbiAqL1xuZnVuY3Rpb24gc2V0dXBJbmRleChjb3JwdXM6IE1hcDxzdHJpbmcsIEpvbmVzRmFjdG9yPikge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZigna2V5Jyk7XG4gICAgdGhpcy5maWVsZCgnZm9vZCcpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXMudmFsdWVzKCkpXG4gICAgICB0aGlzLmFkZCh7a2V5OiByLmZvb2QsIGZvb2Q6IHIuZm9vZC5yZXBsYWNlKC9bXFxXXFxzXSsvZywgJyAnKX0pO1xuICB9KTtcbn1cblxuXG4vKipcbiAqIExvYWQgdGhlIGpvbmVzIGZhY3RvcnMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBqb25lcyBmYWN0b3JzIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEpvbmVzRmFjdG9ycygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIEpvbmVzRmFjdG9yPj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb3JwdXMgPSBhd2FpdCBsb2FkRnJvbUNzdihqb25lc0ZhY3RvcnNDc3YoKSk7XG4gIGluZGV4ICA9IHNldHVwSW5kZXgoY29ycHVzKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgam9uZXMgZmFjdG9ycyBDU1YgZmlsZS5cbiAqIEByZXR1cm5zIENTViBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gam9uZXNGYWN0b3JzQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGpvbmVzIGZhY3RvcnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBqb25lc0ZhY3RvcnNTcWwodGFiOiBzdHJpbmc9XCJqb25lc2ZhY3RvcnNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2Zvb2Q6IFwiVEVYVFwiLCBmYWN0b3I6IFwiUkVBTFwifSxcbiAgICAoYXdhaXQgbG9hZEpvbmVzRmFjdG9ycygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJmb29kXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2Zvb2Q6IFwiQVwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBqb25lcyBmYWN0b3JzIG9mIGEgZm9vZCBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgZm9vZCBxdWVyeVxuICogQHJldHVybnMgbWF0Y2hlcyBgW3tmb29kLCBmYWN0b3J9XWBcbiAqIEBleGFtcGxlXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiBpZmN0MjAxNy5qb25lc0ZhY3RvcnMoJ21haWRhJyk7XG4gKiBpZmN0MjAxNy5qb25lc0ZhY3RvcnMoJ1JlZmluZWQgd2hlYXQnKTtcbiAqIC8vIOKGkiBbIHsgZm9vZDogJ1JlZmluZWQgd2hlYXQgZmxvdXIgKE1haWRhKScsIGZhY3RvcjogJzUuNzAnIH0gXVxuICpcbiAqIGlmY3QyMDE3LmpvbmVzRmFjdG9ycygnd2hhdCBpcyBqb25lcyBmYWN0b3Igb2YgYmFybGV5PycpO1xuICogaWZjdDIwMTcuam9uZXNGYWN0b3JzKCdqb25lcyBmYWN0b3Igb2Ygb2F0cycpO1xuICogLy8g4oaSIFsgeyBmb29kOiAnQmFybGV5IGFuZCBpdHMgZmxvdXI7UnllIGFuZCBpdHMgZmxvdXI7T2F0cycsXG4gKiAvLyDihpIgICAgIGZhY3RvcjogJzUuODMnIH0gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb25lc0ZhY3RvcnModHh0OiBzdHJpbmcpOiBKb25lc0ZhY3RvcltdIHtcbiAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgYTogSm9uZXNGYWN0b3JbXSA9IFtdO1xuICB0eHQgPSB0eHQucmVwbGFjZSgvXFxXL2csICcgJykucmVwbGFjZSgvZmFjdG9yL2dpLCAnJyk7XG4gIGNvbnN0IG1hdHMgPSBpbmRleC5zZWFyY2godHh0KTsgbGV0IG1heCA9IDA7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgbWF4ID0gTWF0aC5tYXgobWF4LCBPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGgpO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIGlmIChPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGggPT09IG1heCkgYS5wdXNoKGNvcnB1cz8uZ2V0KG1hdC5yZWYpIHx8IHt9IGFzIEpvbmVzRmFjdG9yKTtcbiAgcmV0dXJuIGEubGVuZ3RoPjA/IGEgOiBbY29ycHVzPy5nZXQoJ0Zvb2Qgd2hlcmUgc3BlY2lmaWMgZmFjdG9yIGlzIG5vdCBsaXN0ZWQnKSBhcyBKb25lc0ZhY3Rvcl07XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBYWxGLFlBQVk7QUFLWixpQkFBaUI7QUFDakIsSUFBSSxTQUEwQztBQUM5QyxJQUFJLFFBQTJCO0FBQy9CLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUFTO0lBQ3ZCLE1BQU0sU0FBUyxXQUFXLEVBQUUsTUFBTTtJQUNsQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRTtNQUFDLE1BQU0sRUFBRSxJQUFJO01BQUU7SUFBTTtFQUN2QztFQUNBLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELFNBQVMsV0FBVyxNQUFnQztFQUNsRCxPQUFPLEtBQUs7SUFDVixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLEtBQUssTUFBTSxLQUFLLE9BQU8sTUFBTSxHQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDO01BQUMsS0FBSyxFQUFFLElBQUk7TUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZO0lBQUk7RUFDaEU7QUFDRjtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sZUFBZTtFQUNwQixJQUFJLFFBQVEsT0FBTztFQUNuQixTQUFTLE1BQU0sWUFBWTtFQUMzQixRQUFTLFdBQVc7RUFDcEIsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsT0FBTyxZQUFZLE9BQU8sQ0FBQztBQUM3QjtBQUdBOzs7OztDQUtDLEdBQ0QsT0FBTyxlQUFlLGdCQUFnQixNQUFZLGNBQWMsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDekYsT0FBTyxXQUFXLEtBQUs7SUFBQyxNQUFNO0lBQVEsUUFBUTtFQUFNLEdBQ2xELENBQUMsTUFBTSxrQkFBa0IsRUFBRSxNQUFNLElBQ2pDLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFRLE9BQU87SUFBTSxVQUFVO01BQUMsTUFBTTtJQUFHO0VBQUMsR0FBRztBQUNwRTtBQUdBOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sU0FBUyxhQUFhLEdBQVc7RUFDdEMsSUFBSSxTQUFTLE1BQU0sT0FBTyxFQUFFO0VBQzVCLE1BQU0sSUFBbUIsRUFBRTtFQUMzQixNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxPQUFPLENBQUMsWUFBWTtFQUNsRCxNQUFNLE9BQU8sTUFBTSxNQUFNLENBQUM7RUFBTSxJQUFJLE1BQU07RUFDMUMsS0FBSyxNQUFNLE9BQU8sS0FDaEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNO0VBQ2hFLEtBQUssTUFBTSxPQUFPLEtBQ2hCLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sS0FBSyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO0VBQzFGLE9BQU8sRUFBRSxNQUFNLEdBQUMsSUFBRyxJQUFJO0lBQUMsUUFBUSxJQUFJO0dBQTJEO0FBQ2pHLEVBQ0EsWUFBWSJ9