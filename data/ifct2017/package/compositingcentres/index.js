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
 * Load the compositing centres corpus from CSV file.
 * @param file CSV file path
 * @returns compositing centres corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const samples = parseFloat(r.samples);
    map.set(r.region, {
      region: r.region,
      centre: r.centre,
      samples
    });
  }
  return map;
}
/**
 * Setup the lunr index for the compositing centres corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('region');
    this.field('region');
    this.field('centre');
    for (const r of corpus.values())this.add(r);
  });
}
/**
 * Load the compositing centres corpus from the file.
 * @returns compositing centres corpus
 */ export async function loadCompositingCentres() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(compositingCentresCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the compositing centres CSV file.
 * @returns CSV file URL
 */ export function compositingCentresCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the compositing centres table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function compositingCentresSql(tab = "compositingcentres", opt = {}) {
  return setupTable(tab, {
    region: "TEXT",
    centre: "TEXT",
    samples: "INT"
  }, (await loadCompositingCentres()).values(), Object.assign({
    pk: "region",
    index: true,
    tsvector: {
      region: "A",
      centre: "B"
    }
  }, opt));
}
/**
 * Find matching compositing centres of a region/centre query.
 * @param txt region/centre query
 * @returns matches `[{region, centre, samples}]`
 * @examples
 * ```javascript
 * ifct2017.compositingCentres('west');
 * ifct2017.compositingCentres('Mumbai');
 * // → [ { region: 'West', centre: 'Mumbai', samples: 12 } ]
 *
 * ifct2017.compositingCentres('what is compositing centre of north east?');
 * ifct2017.compositingCentres('North East compositing centre');
 * // → [ { region: 'North East', centre: 'Guwahati', samples: 11 } ]
 * ```
 */ export function compositingCentres(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb21wb3NpdGluZ2NlbnRyZXMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIFJlZ2lvbmFsIGNvbXBvc2l0aW5nIGNlbnRyZSBhbmQgc2FtcGxlIHNpemUgb2YgZWFjaCByZWdpb24uICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvc2l0aW5nQ2VudHJlIHtcbiAgLyoqIFJlZ2lvbi4gKi9cbiAgcmVnaW9uOiBzdHJpbmcsXG4gIC8qKiBSZWdpb25hbCBDb21wb3NpdGluZyBjZW50cmUuICovXG4gIGNlbnRyZTogc3RyaW5nLFxuICAvKiogU2FtcGxlIHNpemUuICovXG4gIHNhbXBsZXM6IG51bWJlclxufTtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gR0xPQkFMU1xubGV0IGNvcnB1czogTWFwPHN0cmluZywgQ29tcG9zaXRpbmdDZW50cmU+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGNvbXBvc2l0aW5nIGNlbnRyZXMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBjb21wb3NpdGluZyBjZW50cmVzIGNvcnB1c1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUNzdihmaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgbWFwICA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb3NpdGluZ0NlbnRyZT4oKTtcbiAgY29uc3QgZGF0YSA9IGF3YWl0IChhd2FpdCBmZXRjaChmaWxlKSkudGV4dCgpO1xuICBjb25zdCByZWNvcmRzID0gY3N2LnBhcnNlKGRhdGEsIHtza2lwRmlyc3RSb3c6IHRydWUsIGNvbW1lbnQ6IFwiI1wifSk7XG4gIGZvciAoY29uc3QgciBvZiByZWNvcmRzKSB7XG4gICAgY29uc3Qgc2FtcGxlcyA9IHBhcnNlRmxvYXQoci5zYW1wbGVzKTtcbiAgICBtYXAuc2V0KHIucmVnaW9uLCB7cmVnaW9uOiByLnJlZ2lvbiwgY2VudHJlOiByLmNlbnRyZSwgc2FtcGxlc30pO1xuICB9XG4gIHJldHVybiBtYXA7XG59XG5cblxuLyoqXG4gKiBTZXR1cCB0aGUgbHVuciBpbmRleCBmb3IgdGhlIGNvbXBvc2l0aW5nIGNlbnRyZXMgY29ycHVzLlxuICogQHJldHVybnMgbHVuciBpbmRleFxuICovXG5mdW5jdGlvbiBzZXR1cEluZGV4KGNvcnB1czogTWFwPHN0cmluZywgQ29tcG9zaXRpbmdDZW50cmU+KSB7XG4gIHJldHVybiBsdW5yKGZ1bmN0aW9uKHRoaXM6IGx1bnIuQnVpbGRlcikge1xuICAgIHRoaXMucmVmKCdyZWdpb24nKTtcbiAgICB0aGlzLmZpZWxkKCdyZWdpb24nKTtcbiAgICB0aGlzLmZpZWxkKCdjZW50cmUnKTtcbiAgICBmb3IgKGNvbnN0IHIgb2YgY29ycHVzLnZhbHVlcygpKVxuICAgICAgdGhpcy5hZGQocik7XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29tcG9zaXRpbmcgY2VudHJlcyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGNvbXBvc2l0aW5nIGNlbnRyZXMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkQ29tcG9zaXRpbmdDZW50cmVzKCk6IFByb21pc2U8TWFwPHN0cmluZywgQ29tcG9zaXRpbmdDZW50cmU+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGNvbXBvc2l0aW5nQ2VudHJlc0NzdigpKTtcbiAgaW5kZXggID0gc2V0dXBJbmRleChjb3JwdXMpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBjb21wb3NpdGluZyBjZW50cmVzIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NpdGluZ0NlbnRyZXNDc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgY29tcG9zaXRpbmcgY2VudHJlcyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbXBvc2l0aW5nQ2VudHJlc1NxbCh0YWI6IHN0cmluZz1cImNvbXBvc2l0aW5nY2VudHJlc1wiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7cmVnaW9uOiBcIlRFWFRcIiwgY2VudHJlOiBcIlRFWFRcIiwgc2FtcGxlczogXCJJTlRcIn0sXG4gICAgKGF3YWl0IGxvYWRDb21wb3NpdGluZ0NlbnRyZXMoKSkudmFsdWVzKCkgYXMgSXRlcmFibGU8Um93RGF0YT4sXG4gICAgT2JqZWN0LmFzc2lnbih7cGs6IFwicmVnaW9uXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge3JlZ2lvbjogXCJBXCIsIGNlbnRyZTogXCJCXCJ9fSwgb3B0KSk7XG59XG5cblxuLyoqXG4gKiBGaW5kIG1hdGNoaW5nIGNvbXBvc2l0aW5nIGNlbnRyZXMgb2YgYSByZWdpb24vY2VudHJlIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCByZWdpb24vY2VudHJlIHF1ZXJ5XG4gKiBAcmV0dXJucyBtYXRjaGVzIGBbe3JlZ2lvbiwgY2VudHJlLCBzYW1wbGVzfV1gXG4gKiBAZXhhbXBsZXNcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LmNvbXBvc2l0aW5nQ2VudHJlcygnd2VzdCcpO1xuICogaWZjdDIwMTcuY29tcG9zaXRpbmdDZW50cmVzKCdNdW1iYWknKTtcbiAqIC8vIOKGkiBbIHsgcmVnaW9uOiAnV2VzdCcsIGNlbnRyZTogJ011bWJhaScsIHNhbXBsZXM6IDEyIH0gXVxuICpcbiAqIGlmY3QyMDE3LmNvbXBvc2l0aW5nQ2VudHJlcygnd2hhdCBpcyBjb21wb3NpdGluZyBjZW50cmUgb2Ygbm9ydGggZWFzdD8nKTtcbiAqIGlmY3QyMDE3LmNvbXBvc2l0aW5nQ2VudHJlcygnTm9ydGggRWFzdCBjb21wb3NpdGluZyBjZW50cmUnKTtcbiAqIC8vIOKGkiBbIHsgcmVnaW9uOiAnTm9ydGggRWFzdCcsIGNlbnRyZTogJ0d1d2FoYXRpJywgc2FtcGxlczogMTEgfSBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2l0aW5nQ2VudHJlcyh0eHQ6IHN0cmluZyk6IENvbXBvc2l0aW5nQ2VudHJlW10ge1xuICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBhOiBDb21wb3NpdGluZ0NlbnRyZVtdID0gW107IHR4dCA9IHR4dC5yZXBsYWNlKC9cXFcvZywgJyAnKTtcbiAgY29uc3QgbWF0cyA9IGluZGV4LnNlYXJjaCh0eHQpOyBsZXQgbWF4ID0gMDtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBtYXggPSBNYXRoLm1heChtYXgsIE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCk7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgaWYgKE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCA9PT0gbWF4KSBhLnB1c2goY29ycHVzPy5nZXQobWF0LnJlZikgfHwge30gYXMgQ29tcG9zaXRpbmdDZW50cmUpO1xuICByZXR1cm4gYTtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLFlBQVksU0FBVSxXQUFXO0FBQ2pDLE9BQU8sVUFBVSxPQUFPLENBQUUsc0NBQXNDO0FBQ2hFLFNBQThDLFVBQVUsUUFBTyxtQkFBbUI7QUFlbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQWdEO0FBQ3BELElBQUksUUFBMkI7QUFDL0IsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQVM7SUFDdkIsTUFBTSxVQUFVLFdBQVcsRUFBRSxPQUFPO0lBQ3BDLElBQUksR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFO01BQUMsUUFBUSxFQUFFLE1BQU07TUFBRSxRQUFRLEVBQUUsTUFBTTtNQUFFO0lBQU87RUFDaEU7RUFDQSxPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxTQUFTLFdBQVcsTUFBc0M7RUFDeEQsT0FBTyxLQUFLO0lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNULElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQzNCLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDYjtBQUNGO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLFFBQVMsV0FBVztFQUNwQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLFNBQVM7RUFDZCxPQUFPLFlBQVksT0FBTyxDQUFDO0FBQzdCO0FBR0E7Ozs7O0NBS0MsR0FDRCxPQUFPLGVBQWUsc0JBQXNCLE1BQVksb0JBQW9CLEVBQUUsTUFBdUIsQ0FBQyxDQUFDO0VBQ3JHLE9BQU8sV0FBVyxLQUFLO0lBQUMsUUFBUTtJQUFRLFFBQVE7SUFBUSxTQUFTO0VBQUssR0FDcEUsQ0FBQyxNQUFNLHdCQUF3QixFQUFFLE1BQU0sSUFDdkMsT0FBTyxNQUFNLENBQUM7SUFBQyxJQUFJO0lBQVUsT0FBTztJQUFNLFVBQVU7TUFBQyxRQUFRO01BQUssUUFBUTtJQUFHO0VBQUMsR0FBRztBQUNyRjtBQUdBOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxTQUFTLG1CQUFtQixHQUFXO0VBQzVDLElBQUksU0FBUyxNQUFNLE9BQU8sRUFBRTtFQUM1QixNQUFNLElBQXlCLEVBQUU7RUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU87RUFDNUQsTUFBTSxPQUFPLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQzFDLEtBQUssTUFBTSxPQUFPLEtBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTTtFQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztFQUMxRixPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=