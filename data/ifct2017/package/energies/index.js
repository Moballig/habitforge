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
 * Load the energies corpus from CSV file.
 * @param file CSV file path
 * @returns energies corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const kj = parseFloat(r.kj);
    const kcal = parseFloat(r.kcal);
    map.set(r.component, {
      component: r.component,
      kj,
      kcal
    });
  }
  return map;
}
/**
 * Setup the lunr index for the energies corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('component');
    this.field('component');
    for (const r of corpus.values())this.add(r);
  });
}
/**
 * Load the energies corpus from the file.
 * @returns energies corpus
 */ export async function loadEnergies() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(energiesCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the energies CSV file.
 * @returns CSV file URL
 */ export function energiesCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the energies table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function energiesSql(tab = "energies", opt = {}) {
  return setupTable(tab, {
    component: "TEXT",
    kj: "REAL",
    kcal: "REAL"
  }, (await loadEnergies()).values(), Object.assign({
    pk: "component",
    index: true,
    tsvector: {
      component: "A"
    }
  }, opt));
}
/**
 * Finds matching energies of a component query.
 * @param txt component query
 * @returns matches `[{component, kj, kcal}]`
 * ```javascript
 * ifct2017.energies('dietary fibre');
 * ifct2017.energies('Soluble fibre');
 * // → [ { component: 'Fibre', kj: 8, kcal: 2 } ]
 *
 * ifct2017.energies('what is energy conversion factor of fat?');
 * ifct2017.energies('conversion factor of fat');
 * // → [ { component: 'Fat', kj: 37, kcal: 9 } ]
 * ```
 */ export function energies(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9lbmVyZ2llcy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKEMpIDIwMjUtMjYgU3ViaGFqaXQgU2FodVxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4vLyBTZWUgTElDRU5TRSBmb3IgZnVsbCB0ZXJtc1xuaW1wb3J0ICogYXMgY3N2ICBmcm9tIFwiQHN0ZC9jc3ZcIjtcbmltcG9ydCBsdW5yIGZyb20gXCJsdW5yXCI7ICAvLyBAZGVuby10eXBlcz1cIm5wbTpAdHlwZXMvbHVuckAyLjMuN1wiXG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogTWV0YWJvbGl6YWJsZSBlbmVyZ3kgY29udmVyc2lvbiBmYWN0b3IuICovXG5leHBvcnQgaW50ZXJmYWNlIEVuZXJneSB7XG4gIC8qKiBDb21wb25lbnQuICovXG4gIGNvbXBvbmVudDogc3RyaW5nLFxuICAvKioga0ovZy4gKi9cbiAga2o6IG51bWJlcixcbiAgLyoqIGtjYWwvZy4gKi9cbiAga2NhbDogbnVtYmVyXG59O1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBFbmVyZ3k+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGVuZXJnaWVzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgZW5lcmdpZXMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIEVuZXJneT4oKTtcbiAgY29uc3QgZGF0YSA9IGF3YWl0IChhd2FpdCBmZXRjaChmaWxlKSkudGV4dCgpO1xuICBjb25zdCByZWNvcmRzID0gY3N2LnBhcnNlKGRhdGEsIHtza2lwRmlyc3RSb3c6IHRydWUsIGNvbW1lbnQ6IFwiI1wifSk7XG4gIGZvciAoY29uc3QgciBvZiByZWNvcmRzKSB7XG4gICAgY29uc3Qga2ogICA9IHBhcnNlRmxvYXQoci5raik7XG4gICAgY29uc3Qga2NhbCA9IHBhcnNlRmxvYXQoci5rY2FsKTtcbiAgICBtYXAuc2V0KHIuY29tcG9uZW50LCB7Y29tcG9uZW50OiByLmNvbXBvbmVudCwga2osIGtjYWx9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBlbmVyZ2llcyBjb3JwdXMuXG4gKiBAcmV0dXJucyBsdW5yIGluZGV4XG4gKi9cbmZ1bmN0aW9uIHNldHVwSW5kZXgoY29ycHVzOiBNYXA8c3RyaW5nLCBFbmVyZ3k+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdjb21wb25lbnQnKTtcbiAgICB0aGlzLmZpZWxkKCdjb21wb25lbnQnKTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgY29ycHVzLnZhbHVlcygpKVxuICAgICAgdGhpcy5hZGQocik7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgZW5lcmdpZXMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBlbmVyZ2llcyBjb3JwdXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRFbmVyZ2llcygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIEVuZXJneT4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YoZW5lcmdpZXNDc3YoKSk7XG4gIGluZGV4ICA9IHNldHVwSW5kZXgoY29ycHVzKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgZW5lcmdpZXMgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuZXJnaWVzQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGVuZXJnaWVzIHRhYmxlLlxuICogQHBhcmFtIHRhYiB0YWJsZSBuYW1lXG4gKiBAcGFyYW0gb3B0IG9wdGlvbnMgZm9yIHRoZSB0YWJsZVxuICogQHJldHVybnMgQ1JFQVRFIFRBQkxFLCBJTlNFUlQsIENSRUFURSBWSUVXLCBDUkVBVEUgSU5ERVggc3RhdGVtZW50c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5lcmdpZXNTcWwodGFiOiBzdHJpbmc9XCJlbmVyZ2llc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7Y29tcG9uZW50OiBcIlRFWFRcIiwga2o6IFwiUkVBTFwiLCBrY2FsOiBcIlJFQUxcIn0sXG4gICAgKGF3YWl0IGxvYWRFbmVyZ2llcygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJjb21wb25lbnRcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7Y29tcG9uZW50OiBcIkFcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmRzIG1hdGNoaW5nIGVuZXJnaWVzIG9mIGEgY29tcG9uZW50IHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBjb21wb25lbnQgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7Y29tcG9uZW50LCBraiwga2NhbH1dYFxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuZW5lcmdpZXMoJ2RpZXRhcnkgZmlicmUnKTtcbiAqIGlmY3QyMDE3LmVuZXJnaWVzKCdTb2x1YmxlIGZpYnJlJyk7XG4gKiAvLyDihpIgWyB7IGNvbXBvbmVudDogJ0ZpYnJlJywga2o6IDgsIGtjYWw6IDIgfSBdXG4gKlxuICogaWZjdDIwMTcuZW5lcmdpZXMoJ3doYXQgaXMgZW5lcmd5IGNvbnZlcnNpb24gZmFjdG9yIG9mIGZhdD8nKTtcbiAqIGlmY3QyMDE3LmVuZXJnaWVzKCdjb252ZXJzaW9uIGZhY3RvciBvZiBmYXQnKTtcbiAqIC8vIOKGkiBbIHsgY29tcG9uZW50OiAnRmF0Jywga2o6IDM3LCBrY2FsOiA5IH0gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmVyZ2llcyh0eHQ6IHN0cmluZyk6IEVuZXJneVtdIHtcbiAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgYTogRW5lcmd5W10gPSBbXTsgdHh0ID0gdHh0LnJlcGxhY2UoL1xcVy9nLCAnICcpO1xuICBjb25zdCBtYXRzID0gaW5kZXguc2VhcmNoKHR4dCk7IGxldCBtYXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoKTtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBpZiAoT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoID09PSBtYXgpIGEucHVzaChjb3JwdXM/LmdldChtYXQucmVmKSB8fCB7fSBhcyBFbmVyZ3kpO1xuICByZXR1cm4gYTtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLFlBQVksU0FBVSxXQUFXO0FBQ2pDLE9BQU8sVUFBVSxPQUFPLENBQUUsc0NBQXNDO0FBQ2hFLFNBQThDLFVBQVUsUUFBTyxtQkFBbUI7QUFlbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQXFDO0FBQ3pDLElBQUksUUFBMkI7QUFDL0IsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQVM7SUFDdkIsTUFBTSxLQUFPLFdBQVcsRUFBRSxFQUFFO0lBQzVCLE1BQU0sT0FBTyxXQUFXLEVBQUUsSUFBSTtJQUM5QixJQUFJLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRTtNQUFDLFdBQVcsRUFBRSxTQUFTO01BQUU7TUFBSTtJQUFJO0VBQ3hEO0VBQ0EsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsU0FBUyxXQUFXLE1BQTJCO0VBQzdDLE9BQU8sS0FBSztJQUNWLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQzNCLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDYjtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsWUFBWSxNQUFZLFVBQVUsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDakYsT0FBTyxXQUFXLEtBQUs7SUFBQyxXQUFXO0lBQVEsSUFBSTtJQUFRLE1BQU07RUFBTSxHQUNqRSxDQUFDLE1BQU0sY0FBYyxFQUFFLE1BQU0sSUFDN0IsT0FBTyxNQUFNLENBQUM7SUFBQyxJQUFJO0lBQWEsT0FBTztJQUFNLFVBQVU7TUFBQyxXQUFXO0lBQUc7RUFBQyxHQUFHO0FBQzlFO0FBR0E7Ozs7Ozs7Ozs7Ozs7Q0FhQyxHQUNELE9BQU8sU0FBUyxTQUFTLEdBQVc7RUFDbEMsSUFBSSxTQUFTLE1BQU0sT0FBTyxFQUFFO0VBQzVCLE1BQU0sSUFBYyxFQUFFO0VBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPO0VBQ2pELE1BQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQztFQUFNLElBQUksTUFBTTtFQUMxQyxLQUFLLE1BQU0sT0FBTyxLQUNoQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU07RUFDaEUsS0FBSyxNQUFNLE9BQU8sS0FDaEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7RUFDMUYsT0FBTztBQUNULEVBQ0EsWUFBWSJ9