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
 * Load the columns corpus from CSV file.
 * @param file CSV file path
 * @returns columns corpus
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
 * Setup the lunr index for the columns corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('code');
    this.field('code', {
      boost: 3
    });
    this.field('name', {
      boost: 2
    });
    this.field('tags');
    this.pipeline.remove(lunr.stopWordFilter);
    for (const { code, name, tags } of corpus.values())this.add({
      code,
      name: name.replace(/\W/g, ' '),
      tags
    });
  });
}
/**
 * Load the columns corpus from the file.
 * @returns columns corpus
 */ export async function loadColumns() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(columnsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the columns CSV file.
 * @returns CSV file URL
 */ export function columnsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the columns table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function columnsSql(tab = "columns", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    name: "TEXT",
    tags: "TEXT"
  }, (await loadColumns()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      name: "B",
      tags: "C"
    }
  }, opt));
}
/**
 * Find matching columns of an code/name/tags query.
 * @param txt code/name/tags query
 * @returns matches `[{code, name, tags}]`
 * @example
 * ```javascript
 * ifct2017.columns('vitamin c');
 * ifct2017.columns('c-vitamin');
 * // → [ { code: 'vitc',
 * // →     name: 'Total Ascorbic acid',
 * // →     tags: 'ascorbate water soluble vitamin c vitamin c essential' } ]
 *
 * ifct2017.columns('what is butyric acid?');
 * ifct2017.columns('c4:0 stands for?');
 * // → [ { code: 'f4d0',
 * // →     name: 'Butyric acid (C4:0)',
 * // →     tags: 'c40 c 40 4 0 bta butanoic propanecarboxylic carboxylic saturated fatty fat triglyceride lipid colorless liquid unpleasant vomit body odor' } ]
 * ```
 */ export function columns(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb2x1bW5zL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB7dHlwZSBSb3dEYXRhLCB0eXBlIFNldHVwVGFibGVPcHRpb25zLCBzZXR1cFRhYmxlfSBmcm9tIFwiQG5vZGVmL2V4dHJhLXNxbFwiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBDb2RlIGFuZCBuYW1lIG9mIGEgbnV0cmllbnQuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbHVtbiB7XG4gIC8qKiBDb2x1bW4gQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogQ29sdW1uIE5hbWUuICovXG4gIG5hbWU6IHN0cmluZyxcbiAgLyoqIFRhZ3MuICovXG4gIHRhZ3M6IHN0cmluZ1xufVxuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBDb2x1bW4+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGNvbHVtbnMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBjb2x1bW5zIGNvcnB1c1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUNzdihmaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgbWFwICA9IG5ldyBNYXA8c3RyaW5nLCBDb2x1bW4+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3JkcylcbiAgICBtYXAuc2V0KHIuY29kZSwgciBhcyB1bmtub3duIGFzIENvbHVtbik7XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIGNvbHVtbnMgY29ycHVzLlxuICogQHJldHVybnMgbHVuciBpbmRleFxuICovXG5mdW5jdGlvbiBzZXR1cEluZGV4KGNvcnB1czogTWFwPHN0cmluZywgQ29sdW1uPikge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZignY29kZScpO1xuICAgIHRoaXMuZmllbGQoJ2NvZGUnLCB7Ym9vc3Q6IDN9KTtcbiAgICB0aGlzLmZpZWxkKCduYW1lJywge2Jvb3N0OiAyfSk7XG4gICAgdGhpcy5maWVsZCgndGFncycpO1xuICAgIHRoaXMucGlwZWxpbmUucmVtb3ZlKGx1bnIuc3RvcFdvcmRGaWx0ZXIpO1xuICAgIGZvciAoY29uc3Qge2NvZGUsIG5hbWUsIHRhZ3N9IG9mIGNvcnB1cy52YWx1ZXMoKSlcbiAgICAgIHRoaXMuYWRkKHtjb2RlLCBuYW1lOiBuYW1lLnJlcGxhY2UoL1xcVy9nLCAnICcpLCB0YWdzfSk7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29sdW1ucyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGNvbHVtbnMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQ29sdW1ucygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIENvbHVtbj4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YoY29sdW1uc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBjb2x1bW5zIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2x1bW5zQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIGNvbHVtbnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb2x1bW5zU3FsKHRhYjogc3RyaW5nPVwiY29sdW1uc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7Y29kZTogXCJURVhUXCIsIG5hbWU6IFwiVEVYVFwiLCB0YWdzOiBcIlRFWFRcIn0sXG4gICAgKGF3YWl0IGxvYWRDb2x1bW5zKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcImNvZGVcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7Y29kZTogXCJBXCIsIG5hbWU6IFwiQlwiLCB0YWdzOiBcIkNcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgY29sdW1ucyBvZiBhbiBjb2RlL25hbWUvdGFncyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgY29kZS9uYW1lL3RhZ3MgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7Y29kZSwgbmFtZSwgdGFnc31dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LmNvbHVtbnMoJ3ZpdGFtaW4gYycpO1xuICogaWZjdDIwMTcuY29sdW1ucygnYy12aXRhbWluJyk7XG4gKiAvLyDihpIgWyB7IGNvZGU6ICd2aXRjJyxcbiAqIC8vIOKGkiAgICAgbmFtZTogJ1RvdGFsIEFzY29yYmljIGFjaWQnLFxuICogLy8g4oaSICAgICB0YWdzOiAnYXNjb3JiYXRlIHdhdGVyIHNvbHVibGUgdml0YW1pbiBjIHZpdGFtaW4gYyBlc3NlbnRpYWwnIH0gXVxuICpcbiAqIGlmY3QyMDE3LmNvbHVtbnMoJ3doYXQgaXMgYnV0eXJpYyBhY2lkPycpO1xuICogaWZjdDIwMTcuY29sdW1ucygnYzQ6MCBzdGFuZHMgZm9yPycpO1xuICogLy8g4oaSIFsgeyBjb2RlOiAnZjRkMCcsXG4gKiAvLyDihpIgICAgIG5hbWU6ICdCdXR5cmljIGFjaWQgKEM0OjApJyxcbiAqIC8vIOKGkiAgICAgdGFnczogJ2M0MCBjIDQwIDQgMCBidGEgYnV0YW5vaWMgcHJvcGFuZWNhcmJveHlsaWMgY2FyYm94eWxpYyBzYXR1cmF0ZWQgZmF0dHkgZmF0IHRyaWdseWNlcmlkZSBsaXBpZCBjb2xvcmxlc3MgbGlxdWlkIHVucGxlYXNhbnQgdm9taXQgYm9keSBvZG9yJyB9IF1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sdW1ucyh0eHQ6IHN0cmluZyk6IENvbHVtbltdIHtcbiAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgYTogQ29sdW1uW10gPSBbXTsgdHh0ID0gdHh0LnJlcGxhY2UoL1xcVy9nLCAnICcpO1xuICBjb25zdCBtYXRzID0gaW5kZXguc2VhcmNoKHR4dCk7IGxldCBtYXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoKTtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBpZiAoT2JqZWN0LmtleXMobWF0Lm1hdGNoRGF0YS5tZXRhZGF0YSkubGVuZ3RoID09PSBtYXgpIGEucHVzaChjb3JwdXM/LmdldChtYXQucmVmKSB8fCB7fSBhcyBDb2x1bW4pO1xuICByZXR1cm4gYTtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLFlBQVksU0FBVSxXQUFXO0FBQ2pDLE9BQU8sVUFBVSxPQUFPLENBQUUsc0NBQXNDO0FBQ2hFLFNBQThDLFVBQVUsUUFBTyxtQkFBbUI7QUFlbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQXFDO0FBQ3pDLElBQUksUUFBMkI7QUFDL0IsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQ2QsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUU7RUFDbEIsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsU0FBUyxXQUFXLE1BQTJCO0VBQzdDLE9BQU8sS0FBSztJQUNWLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDVCxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7TUFBQyxPQUFPO0lBQUM7SUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO01BQUMsT0FBTztJQUFDO0lBQzVCLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLGNBQWM7SUFDeEMsS0FBSyxNQUFNLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsSUFBSSxPQUFPLE1BQU0sR0FDNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztNQUFDO01BQU0sTUFBTSxLQUFLLE9BQU8sQ0FBQyxPQUFPO01BQU07SUFBSTtFQUN4RDtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsV0FBVyxNQUFZLFNBQVMsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDL0UsT0FBTyxXQUFXLEtBQUs7SUFBQyxNQUFNO0lBQVEsTUFBTTtJQUFRLE1BQU07RUFBTSxHQUM5RCxDQUFDLE1BQU0sYUFBYSxFQUFFLE1BQU0sSUFDNUIsT0FBTyxNQUFNLENBQUM7SUFBQyxJQUFJO0lBQVEsT0FBTztJQUFNLFVBQVU7TUFBQyxNQUFNO01BQUssTUFBTTtNQUFLLE1BQU07SUFBRztFQUFDLEdBQUc7QUFDMUY7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JDLEdBQ0QsT0FBTyxTQUFTLFFBQVEsR0FBVztFQUNqQyxJQUFJLFNBQVMsTUFBTSxPQUFPLEVBQUU7RUFDNUIsTUFBTSxJQUFjLEVBQUU7RUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU87RUFDakQsTUFBTSxPQUFPLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQzFDLEtBQUssTUFBTSxPQUFPLEtBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTTtFQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztFQUMxRixPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=