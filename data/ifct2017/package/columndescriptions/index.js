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
 * Load the column descriptions corpus from CSV file.
 * @param file CSV file path
 * @returns column descriptions corpus
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
 * Setup the lunr index for the column descriptions corpus.
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
    this.field('shortdesc');
    this.field('longdesc');
    this.pipeline.remove(lunr.stopWordFilter);
    for (const { code, name, shortdesc, longdesc } of corpus.values())this.add({
      code,
      name: name.replace(/\W/g, ' '),
      shortdesc,
      longdesc
    });
  });
}
/**
 * Load the column descriptions corpus from the file.
 * @returns column descriptions corpus
 */ export async function loadColumnDescriptions() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(columnDescriptionsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the column descriptions CSV file.
 * @returns CSV file URL
 */ export function columnDescriptionsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the columns table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function columnDescriptionsSql(tab = "columns", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    name: "TEXT",
    shortdesc: "TEXT",
    longdesc: "TEXT"
  }, (await loadColumnDescriptions()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      name: "B",
      shortdesc: "C",
      longdesc: "D"
    }
  }, opt));
}
/**
 * Find matching columns of an code/name/shortdesc/longdesc query.
 * @param txt code/name/shortdesc/longdesc query
 * @returns matches `[{code, name, shortdesc, longdesc}]`
 * @example
 * ```javascript
 * ifct2017.columnDescriptions('vitamin c');
 * ifct2017.columnDescriptions('c-vitamin');
 * // → [ { code: 'vitc',
 * // →     name: 'Ascorbic acids (C)',
 * // →     shortdesc: 'Collagen production, antioxidant. Deficiency: scurvy (bleeding gums).',
 * // →     longdesc: 'An essential vitamin and antioxidant that protects cells, maintains healthy skin, blood vessels, bones, and cartilage, and aids in wound healing. It also improves iron absorption. Lack of Vitamin C can lead to scurvy.' },
 * // → ... ]
 *
 * ifct2017.columnDescriptions('what is butyric acid?');
 * ifct2017.columnDescriptions('c4:0 stands for?');
 * // → [ { code: 'f4d0',
 * // →     name: 'Butyric acid (C4:0)',
 * // →     shortdesc: 'Short-chain fatty acid; colon health/energy for gut cells.',
 * // →     longdesc: 'A short-chain saturated fatty acid with a 4-carbon backbone. It's produced in the colon when dietary fibers are fermented by gut bacteria. Butyrate serves as a primary energy source for colonocytes (cells lining the colon) and has anti-inflammatory properties, playing a role in gut health.' },
 * // → ... ]
 * ```
 */ export function columnDescriptions(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb2x1bW5kZXNjcmlwdGlvbnMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIENvZGUsIG5hbWUsIHNob3J0LCBhbmQgbG9uZyBkZXNjcmlwdGlvbiBvZiBhIGNvbHVtbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29sdW1uRGVzY3JpcHRpb24ge1xuICAvKiogQ29sdW1uIENvZGUuICovXG4gIGNvZGU6IHN0cmluZyxcbiAgLyoqIENvbHVtbiBOYW1lLiAqL1xuICBuYW1lOiBzdHJpbmcsXG4gIC8qKiBTaG9ydCBkZXNjcmlwdGlvbi4gKi9cbiAgc2hvcnRkZXNjOiBzdHJpbmcsXG4gIC8qKiBMb25nIGRlc2NyaXB0aW9uLiAqL1xuICBsb25nZGVzYzogc3RyaW5nLFxufVxuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBDb2x1bW5EZXNjcmlwdGlvbj4gfCBudWxsID0gbnVsbDtcbmxldCBpbmRleDogbHVuci5JbmRleCB8IG51bGwgPSBudWxsO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBGVU5DVElPTlNcbi8qKlxuICogTG9hZCB0aGUgY29sdW1uIGRlc2NyaXB0aW9ucyBjb3JwdXMgZnJvbSBDU1YgZmlsZS5cbiAqIEBwYXJhbSBmaWxlIENTViBmaWxlIHBhdGhcbiAqIEByZXR1cm5zIGNvbHVtbiBkZXNjcmlwdGlvbnMgY29ycHVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGcm9tQ3N2KGZpbGU6IHN0cmluZykge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIENvbHVtbkRlc2NyaXB0aW9uPigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpXG4gICAgbWFwLnNldChyLmNvZGUsIHIgYXMgdW5rbm93biBhcyBDb2x1bW5EZXNjcmlwdGlvbik7XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIGNvbHVtbiBkZXNjcmlwdGlvbnMgY29ycHVzLlxuICogQHJldHVybnMgbHVuciBpbmRleFxuICovXG5mdW5jdGlvbiBzZXR1cEluZGV4KGNvcnB1czogTWFwPHN0cmluZywgQ29sdW1uRGVzY3JpcHRpb24+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdjb2RlJyk7XG4gICAgdGhpcy5maWVsZCgnY29kZScsIHtib29zdDogM30pO1xuICAgIHRoaXMuZmllbGQoJ25hbWUnLCB7Ym9vc3Q6IDJ9KTtcbiAgICB0aGlzLmZpZWxkKCdzaG9ydGRlc2MnKTtcbiAgICB0aGlzLmZpZWxkKCdsb25nZGVzYycpO1xuICAgIHRoaXMucGlwZWxpbmUucmVtb3ZlKGx1bnIuc3RvcFdvcmRGaWx0ZXIpO1xuICAgIGZvciAoY29uc3Qge2NvZGUsIG5hbWUsIHNob3J0ZGVzYywgbG9uZ2Rlc2N9IG9mIGNvcnB1cy52YWx1ZXMoKSlcbiAgICAgIHRoaXMuYWRkKHtjb2RlLCBuYW1lOiBuYW1lLnJlcGxhY2UoL1xcVy9nLCAnICcpLCBzaG9ydGRlc2MsIGxvbmdkZXNjfSk7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29sdW1uIGRlc2NyaXB0aW9ucyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGNvbHVtbiBkZXNjcmlwdGlvbnMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQ29sdW1uRGVzY3JpcHRpb25zKCk6IFByb21pc2U8TWFwPHN0cmluZywgQ29sdW1uRGVzY3JpcHRpb24+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGNvbHVtbkRlc2NyaXB0aW9uc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBjb2x1bW4gZGVzY3JpcHRpb25zIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2x1bW5EZXNjcmlwdGlvbnNDc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgY29sdW1ucyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbHVtbkRlc2NyaXB0aW9uc1NxbCh0YWI6IHN0cmluZz1cImNvbHVtbnNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2NvZGU6IFwiVEVYVFwiLCBuYW1lOiBcIlRFWFRcIiwgc2hvcnRkZXNjOiBcIlRFWFRcIiwgbG9uZ2Rlc2M6IFwiVEVYVFwifSxcbiAgICAoYXdhaXQgbG9hZENvbHVtbkRlc2NyaXB0aW9ucygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJjb2RlXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2NvZGU6IFwiQVwiLCBuYW1lOiBcIkJcIiwgc2hvcnRkZXNjOiBcIkNcIiwgbG9uZ2Rlc2M6IFwiRFwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBjb2x1bW5zIG9mIGFuIGNvZGUvbmFtZS9zaG9ydGRlc2MvbG9uZ2Rlc2MgcXVlcnkuXG4gKiBAcGFyYW0gdHh0IGNvZGUvbmFtZS9zaG9ydGRlc2MvbG9uZ2Rlc2MgcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7Y29kZSwgbmFtZSwgc2hvcnRkZXNjLCBsb25nZGVzY31dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LmNvbHVtbkRlc2NyaXB0aW9ucygndml0YW1pbiBjJyk7XG4gKiBpZmN0MjAxNy5jb2x1bW5EZXNjcmlwdGlvbnMoJ2Mtdml0YW1pbicpO1xuICogLy8g4oaSIFsgeyBjb2RlOiAndml0YycsXG4gKiAvLyDihpIgICAgIG5hbWU6ICdBc2NvcmJpYyBhY2lkcyAoQyknLFxuICogLy8g4oaSICAgICBzaG9ydGRlc2M6ICdDb2xsYWdlbiBwcm9kdWN0aW9uLCBhbnRpb3hpZGFudC4gRGVmaWNpZW5jeTogc2N1cnZ5IChibGVlZGluZyBndW1zKS4nLFxuICogLy8g4oaSICAgICBsb25nZGVzYzogJ0FuIGVzc2VudGlhbCB2aXRhbWluIGFuZCBhbnRpb3hpZGFudCB0aGF0IHByb3RlY3RzIGNlbGxzLCBtYWludGFpbnMgaGVhbHRoeSBza2luLCBibG9vZCB2ZXNzZWxzLCBib25lcywgYW5kIGNhcnRpbGFnZSwgYW5kIGFpZHMgaW4gd291bmQgaGVhbGluZy4gSXQgYWxzbyBpbXByb3ZlcyBpcm9uIGFic29ycHRpb24uIExhY2sgb2YgVml0YW1pbiBDIGNhbiBsZWFkIHRvIHNjdXJ2eS4nIH0sXG4gKiAvLyDihpIgLi4uIF1cbiAqXG4gKiBpZmN0MjAxNy5jb2x1bW5EZXNjcmlwdGlvbnMoJ3doYXQgaXMgYnV0eXJpYyBhY2lkPycpO1xuICogaWZjdDIwMTcuY29sdW1uRGVzY3JpcHRpb25zKCdjNDowIHN0YW5kcyBmb3I/Jyk7XG4gKiAvLyDihpIgWyB7IGNvZGU6ICdmNGQwJyxcbiAqIC8vIOKGkiAgICAgbmFtZTogJ0J1dHlyaWMgYWNpZCAoQzQ6MCknLFxuICogLy8g4oaSICAgICBzaG9ydGRlc2M6ICdTaG9ydC1jaGFpbiBmYXR0eSBhY2lkOyBjb2xvbiBoZWFsdGgvZW5lcmd5IGZvciBndXQgY2VsbHMuJyxcbiAqIC8vIOKGkiAgICAgbG9uZ2Rlc2M6ICdBIHNob3J0LWNoYWluIHNhdHVyYXRlZCBmYXR0eSBhY2lkIHdpdGggYSA0LWNhcmJvbiBiYWNrYm9uZS4gSXQncyBwcm9kdWNlZCBpbiB0aGUgY29sb24gd2hlbiBkaWV0YXJ5IGZpYmVycyBhcmUgZmVybWVudGVkIGJ5IGd1dCBiYWN0ZXJpYS4gQnV0eXJhdGUgc2VydmVzIGFzIGEgcHJpbWFyeSBlbmVyZ3kgc291cmNlIGZvciBjb2xvbm9jeXRlcyAoY2VsbHMgbGluaW5nIHRoZSBjb2xvbikgYW5kIGhhcyBhbnRpLWluZmxhbW1hdG9yeSBwcm9wZXJ0aWVzLCBwbGF5aW5nIGEgcm9sZSBpbiBndXQgaGVhbHRoLicgfSxcbiAqIC8vIOKGkiAuLi4gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2x1bW5EZXNjcmlwdGlvbnModHh0OiBzdHJpbmcpOiBDb2x1bW5EZXNjcmlwdGlvbltdIHtcbiAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgYTogQ29sdW1uRGVzY3JpcHRpb25bXSA9IFtdOyB0eHQgPSB0eHQucmVwbGFjZSgvXFxXL2csICcgJyk7XG4gIGNvbnN0IG1hdHMgPSBpbmRleC5zZWFyY2godHh0KTsgbGV0IG1heCA9IDA7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgbWF4ID0gTWF0aC5tYXgobWF4LCBPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGgpO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIGlmIChPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGggPT09IG1heCkgYS5wdXNoKGNvcnB1cz8uZ2V0KG1hdC5yZWYpIHx8IHt9IGFzIENvbHVtbkRlc2NyaXB0aW9uKTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBaUJsRixZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBZ0Q7QUFDcEQsSUFBSSxRQUEyQjtBQUMvQixZQUFZO0FBS1osbUJBQW1CO0FBQ25COzs7O0NBSUMsR0FDRCxlQUFlLFlBQVksSUFBWTtFQUNyQyxNQUFNLE1BQU8sSUFBSTtFQUNqQixNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sTUFBTSxLQUFLLEVBQUUsSUFBSTtFQUMzQyxNQUFNLFVBQVUsSUFBSSxLQUFLLENBQUMsTUFBTTtJQUFDLGNBQWM7SUFBTSxTQUFTO0VBQUc7RUFDakUsS0FBSyxNQUFNLEtBQUssUUFDZCxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRTtFQUNsQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxTQUFTLFdBQVcsTUFBc0M7RUFDeEQsT0FBTyxLQUFLO0lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNULElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtNQUFDLE9BQU87SUFBQztJQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7TUFBQyxPQUFPO0lBQUM7SUFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLGNBQWM7SUFDeEMsS0FBSyxNQUFNLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFDLElBQUksT0FBTyxNQUFNLEdBQzNELElBQUksQ0FBQyxHQUFHLENBQUM7TUFBQztNQUFNLE1BQU0sS0FBSyxPQUFPLENBQUMsT0FBTztNQUFNO01BQVc7SUFBUTtFQUN2RTtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsc0JBQXNCLE1BQVksU0FBUyxFQUFFLE1BQXVCLENBQUMsQ0FBQztFQUMxRixPQUFPLFdBQVcsS0FBSztJQUFDLE1BQU07SUFBUSxNQUFNO0lBQVEsV0FBVztJQUFRLFVBQVU7RUFBTSxHQUNyRixDQUFDLE1BQU0sd0JBQXdCLEVBQUUsTUFBTSxJQUN2QyxPQUFPLE1BQU0sQ0FBQztJQUFDLElBQUk7SUFBUSxPQUFPO0lBQU0sVUFBVTtNQUFDLE1BQU07TUFBSyxNQUFNO01BQUssV0FBVztNQUFLLFVBQVU7SUFBRztFQUFDLEdBQUc7QUFDOUc7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCQyxHQUNELE9BQU8sU0FBUyxtQkFBbUIsR0FBVztFQUM1QyxJQUFJLFNBQVMsTUFBTSxPQUFPLEVBQUU7RUFDNUIsTUFBTSxJQUF5QixFQUFFO0VBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPO0VBQzVELE1BQU0sT0FBTyxNQUFNLE1BQU0sQ0FBQztFQUFNLElBQUksTUFBTTtFQUMxQyxLQUFLLE1BQU0sT0FBTyxLQUNoQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU07RUFDaEUsS0FBSyxNQUFNLE9BQU8sS0FDaEIsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7RUFDMUYsT0FBTztBQUNULEVBQ0EsWUFBWSJ9