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
 * Load the regions corpus from CSV file.
 * @param file CSV file path
 * @returns regions corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records)map.set(r.region, r);
  return map;
}
/**
 * Setup the lunr index for the regions corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('region');
    this.field('region');
    this.field('states');
    for (const r of corpus.values())this.add({
      region: r.region,
      states: r.states.replace(/\W/g, ' ')
    });
  });
}
/**
 * Load the regions corpus from the file.
 * @returns regions corpus
 */ export async function loadRegions() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(regionsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the regions CSV file.
 * @returns CSV file URL
 */ export function regionsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the regions table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function regionsSql(tab = "regions", opt = {}) {
  return setupTable(tab, {
    region: "TEXT",
    states: "TEXT"
  }, (await loadRegions()).values(), Object.assign({
    pk: "region",
    index: true,
    tsvector: {
      region: "A",
      states: "B"
    }
  }, opt));
}
/**
 * Find matching regions of a region/states query.
 * @param txt region/states query
 * @returns matches `[{region, states}]`
 * @example
 * ```javascript
 * ifct2017.regions('central');
 * ifct2017.regions('Uttaranchal');
 * // → [ { region: 'Central',
 * // →     states: 'Chhattisgarh;Madhya Pradesh;Uttar Pradesh;Uttaranchal' } ]
 *
 * ifct2017.regions('which region andhra pradesh belongs to?');
 * ifct2017.regions('details of south region');
 * // → [ { region: 'South',
 * // →     states: 'Andaman & Nicobar Islands;Andhra Pradesh;Karnataka;Kerala;Lakshadweep;Pondicherry;Telangana;Tamil Nadu' } ]
 * ```
 */ export function regions(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9yZWdpb25zL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB7dHlwZSBSb3dEYXRhLCB0eXBlIFNldHVwVGFibGVPcHRpb25zLCBzZXR1cFRhYmxlfSBmcm9tIFwiQG5vZGVmL2V4dHJhLXNxbFwiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBDYXRlZ29yaXphdGlvbiBvZiB0aGUgU3RhdGVzL1VUcyBpbnRvIHNpeCBkaWZmZXJlbnQgcmVnaW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVnaW9uIHtcbiAgLyoqIFJlZ2lvbi4gKi9cbiAgcmVnaW9uOiBzdHJpbmcsXG4gIC8qKiBTdGF0ZXMvVVRzLiAqL1xuICBzdGF0ZXM6IHN0cmluZ1xufTtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gR0xPQkFMU1xubGV0IGNvcnB1czogTWFwPHN0cmluZywgUmVnaW9uPiB8IG51bGwgPSBudWxsO1xubGV0IGluZGV4OiBsdW5yLkluZGV4IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSByZWdpb25zIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgcmVnaW9ucyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgUmVnaW9uPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpXG4gICAgbWFwLnNldChyLnJlZ2lvbiwgciBhcyB1bmtub3duIGFzIFJlZ2lvbik7XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIHJlZ2lvbnMgY29ycHVzLlxuICogQHJldHVybnMgbHVuciBpbmRleFxuICovXG5mdW5jdGlvbiBzZXR1cEluZGV4KGNvcnB1czogTWFwPHN0cmluZywgUmVnaW9uPikge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZigncmVnaW9uJyk7XG4gICAgdGhpcy5maWVsZCgncmVnaW9uJyk7XG4gICAgdGhpcy5maWVsZCgnc3RhdGVzJyk7XG4gICAgZm9yIChjb25zdCByIG9mIGNvcnB1cy52YWx1ZXMoKSlcbiAgICAgIHRoaXMuYWRkKHtyZWdpb246IHIucmVnaW9uLCBzdGF0ZXM6IHIuc3RhdGVzLnJlcGxhY2UoL1xcVy9nLCAnICcpfSk7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgcmVnaW9ucyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIHJlZ2lvbnMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkUmVnaW9ucygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIFJlZ2lvbj4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YocmVnaW9uc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSByZWdpb25zIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpb25zQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIHJlZ2lvbnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpb25zU3FsKHRhYjogc3RyaW5nPVwicmVnaW9uc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7cmVnaW9uOiBcIlRFWFRcIiwgc3RhdGVzOiBcIlRFWFRcIn0sXG4gICAgKGF3YWl0IGxvYWRSZWdpb25zKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcInJlZ2lvblwiLCBpbmRleDogdHJ1ZSwgdHN2ZWN0b3I6IHtyZWdpb246IFwiQVwiLCBzdGF0ZXM6IFwiQlwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyByZWdpb25zIG9mIGEgcmVnaW9uL3N0YXRlcyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgcmVnaW9uL3N0YXRlcyBxdWVyeVxuICogQHJldHVybnMgbWF0Y2hlcyBgW3tyZWdpb24sIHN0YXRlc31dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LnJlZ2lvbnMoJ2NlbnRyYWwnKTtcbiAqIGlmY3QyMDE3LnJlZ2lvbnMoJ1V0dGFyYW5jaGFsJyk7XG4gKiAvLyDihpIgWyB7IHJlZ2lvbjogJ0NlbnRyYWwnLFxuICogLy8g4oaSICAgICBzdGF0ZXM6ICdDaGhhdHRpc2dhcmg7TWFkaHlhIFByYWRlc2g7VXR0YXIgUHJhZGVzaDtVdHRhcmFuY2hhbCcgfSBdXG4gKlxuICogaWZjdDIwMTcucmVnaW9ucygnd2hpY2ggcmVnaW9uIGFuZGhyYSBwcmFkZXNoIGJlbG9uZ3MgdG8/Jyk7XG4gKiBpZmN0MjAxNy5yZWdpb25zKCdkZXRhaWxzIG9mIHNvdXRoIHJlZ2lvbicpO1xuICogLy8g4oaSIFsgeyByZWdpb246ICdTb3V0aCcsXG4gKiAvLyDihpIgICAgIHN0YXRlczogJ0FuZGFtYW4gJiBOaWNvYmFyIElzbGFuZHM7QW5kaHJhIFByYWRlc2g7S2FybmF0YWthO0tlcmFsYTtMYWtzaGFkd2VlcDtQb25kaWNoZXJyeTtUZWxhbmdhbmE7VGFtaWwgTmFkdScgfSBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lvbnModHh0OiBzdHJpbmcpOiBSZWdpb25bXSB7XG4gIGlmIChpbmRleCA9PSBudWxsKSByZXR1cm4gW107XG4gIGNvbnN0IGE6IFJlZ2lvbltdID0gW107IHR4dCA9IHR4dC5yZXBsYWNlKC9cXFcvZywgJyAnKTtcbiAgY29uc3QgbWF0cyA9IGluZGV4LnNlYXJjaCh0eHQpOyBsZXQgbWF4ID0gMDtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBtYXggPSBNYXRoLm1heChtYXgsIE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCk7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgaWYgKE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCA9PT0gbWF4KSBhLnB1c2goY29ycHVzPy5nZXQobWF0LnJlZikgfHwge30gYXMgUmVnaW9uKTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBYWxGLFlBQVk7QUFLWixpQkFBaUI7QUFDakIsSUFBSSxTQUFxQztBQUN6QyxJQUFJLFFBQTJCO0FBQy9CLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUNkLElBQUksR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFO0VBQ3BCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELFNBQVMsV0FBVyxNQUEyQjtFQUM3QyxPQUFPLEtBQUs7SUFDVixJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxLQUFLLE1BQU0sS0FBSyxPQUFPLE1BQU0sR0FDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQztNQUFDLFFBQVEsRUFBRSxNQUFNO01BQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTztJQUFJO0VBQ3BFO0FBQ0Y7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLGVBQWU7RUFDcEIsSUFBSSxRQUFRLE9BQU87RUFDbkIsU0FBUyxNQUFNLFlBQVk7RUFDM0IsUUFBUyxXQUFXO0VBQ3BCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSxXQUFXLE1BQVksU0FBUyxFQUFFLE1BQXVCLENBQUMsQ0FBQztFQUMvRSxPQUFPLFdBQVcsS0FBSztJQUFDLFFBQVE7SUFBUSxRQUFRO0VBQU0sR0FDcEQsQ0FBQyxNQUFNLGFBQWEsRUFBRSxNQUFNLElBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFVLE9BQU87SUFBTSxVQUFVO01BQUMsUUFBUTtNQUFLLFFBQVE7SUFBRztFQUFDLEdBQUc7QUFDckY7QUFHQTs7Ozs7Ozs7Ozs7Ozs7OztDQWdCQyxHQUNELE9BQU8sU0FBUyxRQUFRLEdBQVc7RUFDakMsSUFBSSxTQUFTLE1BQU0sT0FBTyxFQUFFO0VBQzVCLE1BQU0sSUFBYyxFQUFFO0VBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPO0VBQ2pELE1BQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQztFQUFNLElBQUksTUFBTTtFQUMxQyxLQUFLLE1BQU0sT0FBTyxLQUNoQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU07RUFDaEUsS0FBSyxNQUFNLE9BQU8sS0FDaEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7RUFDMUYsT0FBTztBQUNULEVBQ0EsWUFBWSJ9