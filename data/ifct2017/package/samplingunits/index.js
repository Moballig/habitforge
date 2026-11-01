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
 * Load the sampling units corpus from CSV file.
 * @param file CSV file path
 * @returns sampling units corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const districts = parseInt(r.districts, 10);
    const selected = parseInt(r.selected, 10);
    map.set(r.sno, {
      sno: r.sno,
      state: r.state,
      districts,
      selected
    });
  }
  return map;
}
/**
 * Setup the lunr index for the sampling units corpus.
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
 * Load the sampling units corpus from the file.
 * @returns sampling units corpus
 */ export async function loadSamplingUnits() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(samplingUnitsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the sampling units CSV file.
 * @returns CSV file URL
 */ export function samplingUnitsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the sampling units table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function samplingUnitsSql(tab = "samplingunits", opt = {}) {
  return setupTable(tab, {
    sno: "TEXT",
    state: "TEXT",
    districts: "INT",
    selected: "INT"
  }, (await loadSamplingUnits()).values(), Object.assign({
    pk: "sno",
    index: true,
    tsvector: {
      sno: "A",
      state: "B"
    }
  }, opt));
}
/**
 * Find matching sampling units of an sno/state query.
 * @param txt sno/state query
 * @returns matches `[{sno, state, districts, selected}]`
 * @example
 * ```javascript
 * ifct2017.samplingUnits('andaman');
 * ifct2017.samplingUnits('Nicobar');
 * // → [ { sno: 'A',
 * // →     state: 'Andaman & Nicobar',
 * // →     districts: 3,
 * // →     selected: 1 } ]
 *
 * ifct2017.samplingUnits('sampling units in orissa?');
 * ifct2017.samplingUnits('orissa\'s sampling units');
 * // → [ { sno: '20', state: 'Orissa', districts: 30, selected: 4 } ]
 * ```
 */ export function samplingUnits(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9zYW1wbGluZ3VuaXRzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB7dHlwZSBSb3dEYXRhLCB0eXBlIFNldHVwVGFibGVPcHRpb25zLCBzZXR1cFRhYmxlfSBmcm9tIFwiQG5vZGVmL2V4dHJhLXNxbFwiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBQcmltYXJ5IHNhbXBsaW5nIHVuaXQgb2YgZWFjaCBTdGF0ZS9VVC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxpbmdVbml0IHtcbiAgLyoqIFNsLiBOby4gKi9cbiAgc25vOiBzdHJpbmcsXG4gIC8qKiBTdGF0ZSBuYW1lLiAqL1xuICBzdGF0ZTogc3RyaW5nLFxuICAvKiogVG90YWwgTm8uIG9mIERpc3RyaWN0cy4gKi9cbiAgZGlzdHJpY3RzOiBudW1iZXIsXG4gIC8qKiBEaXN0cmljdHMgU2VsZWN0ZWQuICovXG4gIHNlbGVjdGVkOiBudW1iZXJcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIFNhbXBsaW5nVW5pdD4gfCBudWxsID0gbnVsbDtcbmxldCBpbmRleDogbHVuci5JbmRleCB8IG51bGwgPSBudWxsO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBGVU5DVElPTlNcbi8qKlxuICogTG9hZCB0aGUgc2FtcGxpbmcgdW5pdHMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBzYW1wbGluZyB1bml0cyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgU2FtcGxpbmdVbml0PigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBkaXN0cmljdHMgPSBwYXJzZUludChyLmRpc3RyaWN0cywgMTApO1xuICAgIGNvbnN0IHNlbGVjdGVkICA9IHBhcnNlSW50KHIuc2VsZWN0ZWQsIDEwKTtcbiAgICBtYXAuc2V0KHIuc25vLCB7c25vOiByLnNubywgc3RhdGU6IHIuc3RhdGUsIGRpc3RyaWN0cywgc2VsZWN0ZWR9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogU2V0dXAgdGhlIGx1bnIgaW5kZXggZm9yIHRoZSBzYW1wbGluZyB1bml0cyBjb3JwdXMuXG4gKiBAcmV0dXJucyBsdW5yIGluZGV4XG4gKi9cbmZ1bmN0aW9uIHNldHVwSW5kZXgoY29ycHVzOiBNYXA8c3RyaW5nLCBTYW1wbGluZ1VuaXQ+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCdzbm8nKTtcbiAgICB0aGlzLmZpZWxkKCdzdGF0ZScpO1xuICAgIC8vIHRoaXMucGlwZWxpbmUucmVtb3ZlKGx1bnIuc3RvcFdvcmRGaWx0ZXIpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXMudmFsdWVzKCkpXG4gICAgICB0aGlzLmFkZChyKTtcbiAgfSk7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBzYW1wbGluZyB1bml0cyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIHNhbXBsaW5nIHVuaXRzIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFNhbXBsaW5nVW5pdHMoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBTYW1wbGluZ1VuaXQ+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KHNhbXBsaW5nVW5pdHNDc3YoKSk7XG4gIGluZGV4ICA9IHNldHVwSW5kZXgoY29ycHVzKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgc2FtcGxpbmcgdW5pdHMgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsaW5nVW5pdHNDc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgc2FtcGxpbmcgdW5pdHMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYW1wbGluZ1VuaXRzU3FsKHRhYjogc3RyaW5nPVwic2FtcGxpbmd1bml0c1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7c25vOiBcIlRFWFRcIiwgc3RhdGU6IFwiVEVYVFwiLCBkaXN0cmljdHM6IFwiSU5UXCIsIHNlbGVjdGVkOiBcIklOVFwifSxcbiAgICAoYXdhaXQgbG9hZFNhbXBsaW5nVW5pdHMoKSkudmFsdWVzKCkgYXMgSXRlcmFibGU8Um93RGF0YT4sXG4gICAgT2JqZWN0LmFzc2lnbih7cGs6IFwic25vXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge3NubzogXCJBXCIsIHN0YXRlOiBcIkJcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgc2FtcGxpbmcgdW5pdHMgb2YgYW4gc25vL3N0YXRlIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBzbm8vc3RhdGUgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7c25vLCBzdGF0ZSwgZGlzdHJpY3RzLCBzZWxlY3RlZH1dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LnNhbXBsaW5nVW5pdHMoJ2FuZGFtYW4nKTtcbiAqIGlmY3QyMDE3LnNhbXBsaW5nVW5pdHMoJ05pY29iYXInKTtcbiAqIC8vIOKGkiBbIHsgc25vOiAnQScsXG4gKiAvLyDihpIgICAgIHN0YXRlOiAnQW5kYW1hbiAmIE5pY29iYXInLFxuICogLy8g4oaSICAgICBkaXN0cmljdHM6IDMsXG4gKiAvLyDihpIgICAgIHNlbGVjdGVkOiAxIH0gXVxuICpcbiAqIGlmY3QyMDE3LnNhbXBsaW5nVW5pdHMoJ3NhbXBsaW5nIHVuaXRzIGluIG9yaXNzYT8nKTtcbiAqIGlmY3QyMDE3LnNhbXBsaW5nVW5pdHMoJ29yaXNzYVxcJ3Mgc2FtcGxpbmcgdW5pdHMnKTtcbiAqIC8vIOKGkiBbIHsgc25vOiAnMjAnLCBzdGF0ZTogJ09yaXNzYScsIGRpc3RyaWN0czogMzAsIHNlbGVjdGVkOiA0IH0gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW1wbGluZ1VuaXRzKHR4dDogc3RyaW5nKTogU2FtcGxpbmdVbml0W10ge1xuICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBhOiBTYW1wbGluZ1VuaXRbXSA9IFtdOyB0eHQgPSB0eHQucmVwbGFjZSgvXFxXL2csICcgJyk7XG4gIGNvbnN0IG1hdHMgPSBpbmRleC5zZWFyY2godHh0KTsgbGV0IG1heCA9IDA7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgbWF4ID0gTWF0aC5tYXgobWF4LCBPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGgpO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIGlmIChPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGggPT09IG1heCkgYS5wdXNoKGNvcnB1cz8uZ2V0KG1hdC5yZWYpIHx8IHt9IGFzIFNhbXBsaW5nVW5pdCk7XG4gIHJldHVybiBhO1xufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFDakMsT0FBTyxVQUFVLE9BQU8sQ0FBRSxzQ0FBc0M7QUFDaEUsU0FBOEMsVUFBVSxRQUFPLG1CQUFtQjtBQWlCbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQTJDO0FBQy9DLElBQUksUUFBMkI7QUFDL0IsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQVM7SUFDdkIsTUFBTSxZQUFZLFNBQVMsRUFBRSxTQUFTLEVBQUU7SUFDeEMsTUFBTSxXQUFZLFNBQVMsRUFBRSxRQUFRLEVBQUU7SUFDdkMsSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUU7TUFBQyxLQUFLLEVBQUUsR0FBRztNQUFFLE9BQU8sRUFBRSxLQUFLO01BQUU7TUFBVztJQUFRO0VBQ2pFO0VBQ0EsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsU0FBUyxXQUFXLE1BQWlDO0VBQ25ELE9BQU8sS0FBSztJQUNWLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLDZDQUE2QztJQUM3QyxLQUFLLE1BQU0sS0FBSyxPQUFPLE1BQU0sR0FDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQztFQUNiO0FBQ0Y7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLGVBQWU7RUFDcEIsSUFBSSxRQUFRLE9BQU87RUFDbkIsU0FBUyxNQUFNLFlBQVk7RUFDM0IsUUFBUyxXQUFXO0VBQ3BCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSxpQkFBaUIsTUFBWSxlQUFlLEVBQUUsTUFBdUIsQ0FBQyxDQUFDO0VBQzNGLE9BQU8sV0FBVyxLQUFLO0lBQUMsS0FBSztJQUFRLE9BQU87SUFBUSxXQUFXO0lBQU8sVUFBVTtFQUFLLEdBQ25GLENBQUMsTUFBTSxtQkFBbUIsRUFBRSxNQUFNLElBQ2xDLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFPLE9BQU87SUFBTSxVQUFVO01BQUMsS0FBSztNQUFLLE9BQU87SUFBRztFQUFDLEdBQUc7QUFDOUU7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkMsR0FDRCxPQUFPLFNBQVMsY0FBYyxHQUFXO0VBQ3ZDLElBQUksU0FBUyxNQUFNLE9BQU8sRUFBRTtFQUM1QixNQUFNLElBQW9CLEVBQUU7RUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU87RUFDdkQsTUFBTSxPQUFPLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQzFDLEtBQUssTUFBTSxPQUFPLEtBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTTtFQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztFQUMxRixPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=