// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import { setupTable } from "@nodef/extra-sql";
import { loadColumns, columns } from "../columns/index.js";
//#endregion
//#region GLOBALS
let corpus = null;
//#endregion
//#region FUNCTIONS
/**
 * Load the intakes corpus from CSV file.
 * @param file CSV file path
 * @returns intakes corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const s = {};
    for(const k in r)s[k] = k === "code" ? r[k] : parseFloat(r[k]);
    map.set(r.code, s);
  }
  return map;
}
/**
 * Load the intakes corpus from the file.
 * @returns intakes corpus
 */ export async function loadIntakes() {
  if (corpus) return corpus;
  const p = loadColumns();
  corpus = await loadFromCsv(intakesCsv());
  await p;
  return corpus;
}
/**
 * Get the path to the intakes CSV file.
 * @returns CSV file URL
 */ export function intakesCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the intakes table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function intakesSql(tab = "intakes", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    whorda: "REAL",
    usear: "REAL",
    usrdam: "REAL",
    usrdaf: "REAL",
    euprim: "REAL",
    euprif: "REAL",
    ulus: "REAL",
    uleu: "REAL",
    uljapan: "REAL"
  }, (await loadIntakes()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A"
    }
  }, opt));
}
/**
 * Find matching intakes of an column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns matches `[{code, whorda, usear, usrdam, usrdaf, euprim, euprif, ulus, uleu, uljapan}]`
 * @example
 * ```javascript
 * ifct2017.intakes('his');
 * ifct2017.intakes('Histidine');
 * // → [{ code: 'his',
 * // →    whorda: -0.01,
 * // →    usear: NaN,
 * // →    usrdam: -0.014,
 * // →    usrdaf: NaN,
 * // →    euprim: NaN,
 * // →    euprif: NaN,
 * // →    ulus: NaN,
 * // →    uleu: NaN,
 * // →    uljapan: NaN }]
 *
 * ifct2017.intakes('intake of total fibre?');
 * ifct2017.intakes('what is rda of total fiber?');
 * // → [{ code: 'fibtg',
 * // →    whorda: NaN,
 * // →    usear: NaN,
 * // →    usrdam: 38,
 * // →    usrdaf: 25,
 * // →    euprim: NaN,
 * // →    euprif: NaN,
 * // →    ulus: NaN,
 * // →    uleu: NaN,
 * // →    uljapan: NaN }]
 *
 *
 * // Note:
 * // +ve value indicates amount in grams.
 * // -ve value indicates amount in grams per kg of body weight.
 * // NaN indicates no recommentation given.
 * ```
 */ export function intakes(txt) {
  if (corpus == null) return [];
  return columns(txt).map((r)=>corpus?.get(r.code));
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9pbnRha2VzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5pbXBvcnQge2xvYWRDb2x1bW5zLCBjb2x1bW5zfSBmcm9tIFwiLi4vY29sdW1ucy9pbmRleC5qc1wiO1xuXG5cblxuXG4vLyNyZWdpb24gVFlQRVNcbi8qKiBSZWNvbW1lbmRlZCBkYWlseSBpbnRha2VzIG9mIG51dHJpZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRha2Uge1xuICAvKiogQ29sdW1uIENvZGUuICovXG4gIGNvZGU6IHN0cmluZyxcbiAgLyoqIFdITyBSZWNvbW1lbmRlZCBEaWV0YXJ5IEFsbG93YW5jZS4gKi9cbiAgd2hvcmRhOiBudW1iZXIsXG4gIC8qKiBVUyBFc3RpbWF0ZWQgQXZlcmFnZSBSZXF1aXJlbWVudC4gKi9cbiAgdXNlYXI6IG51bWJlcixcbiAgLyoqIFVTIFJlY29tbWVuZGVkIERpZXRhcnkgQWxsb3dhbmNlIChNYWxlKS4gKi9cbiAgdXNyZGFtOiBudW1iZXIsXG4gIC8qKiBVUyBSZWNvbW1lbmRlZCBEaWV0YXJ5IEFsbG93YW5jZSAoRmVtYWxlKS4gKi9cbiAgdXNyZGFmOiBudW1iZXIsXG4gIC8qKiBFVSBQb3B1bGF0aW9uIFJlZmVyZW5jZSBJbnRha2UgKE1hbGUpLiAqL1xuICBldXByaW06IG51bWJlcixcbiAgLyoqIEVVIFBvcHVsYXRpb24gUmVmZXJlbmNlIEludGFrZSAoRmVtYWxlKS4gKi9cbiAgZXVwcmlmOiBudW1iZXIsXG4gIC8qKiBUb2xlcmFibGUgaW50YWtlIFVwcGVyIExldmVsIChVUykuICovXG4gIHVsdXM6IG51bWJlcixcbiAgLyoqIFRvbGVyYWJsZSBpbnRha2UgVXBwZXIgTGV2ZWwgKEVVKS4gKi9cbiAgdWxldTogbnVtYmVyLFxuICAvKiogVG9sZXJhYmxlIGludGFrZSBVcHBlciBMZXZlbCAoSmFwYW4pLiAqL1xuICB1bGphcGFuOiBudW1iZXJcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIEludGFrZT4gfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGludGFrZXMgY29ycHVzIGZyb20gQ1NWIGZpbGUuXG4gKiBAcGFyYW0gZmlsZSBDU1YgZmlsZSBwYXRoXG4gKiBAcmV0dXJucyBpbnRha2VzIGNvcnB1c1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUNzdihmaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgbWFwICA9IG5ldyBNYXA8c3RyaW5nLCBJbnRha2U+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gcilcbiAgICAgIHNba10gPSBrPT09XCJjb2RlXCI/IHJba10gOiBwYXJzZUZsb2F0KHJba10pO1xuICAgIG1hcC5zZXQoci5jb2RlLCBzIGFzIHVua25vd24gYXMgSW50YWtlKTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgaW50YWtlcyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGludGFrZXMgY29ycHVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkSW50YWtlcygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIEludGFrZT4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29uc3QgcCA9IGxvYWRDb2x1bW5zKCk7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGludGFrZXNDc3YoKSk7IGF3YWl0IHA7XG4gIHJldHVybiBjb3JwdXM7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGludGFrZXMgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGFrZXNDc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgaW50YWtlcyB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGludGFrZXNTcWwodGFiOiBzdHJpbmc9XCJpbnRha2VzXCIsIG9wdDogU2V0dXBUYWJsZU9wdGlvbnM9e30pOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gc2V0dXBUYWJsZSh0YWIsIHtjb2RlOiBcIlRFWFRcIiwgd2hvcmRhOiBcIlJFQUxcIiwgdXNlYXI6IFwiUkVBTFwiLCB1c3JkYW06IFwiUkVBTFwiLFxuICAgIHVzcmRhZjogXCJSRUFMXCIsIGV1cHJpbTogXCJSRUFMXCIsIGV1cHJpZjogXCJSRUFMXCIsIHVsdXM6IFwiUkVBTFwiLCB1bGV1OiBcIlJFQUxcIiwgdWxqYXBhbjogXCJSRUFMXCJ9LFxuICAgIChhd2FpdCBsb2FkSW50YWtlcygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJjb2RlXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2NvZGU6IFwiQVwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBpbnRha2VzIG9mIGFuIGNvbHVtbjpjb2RlL25hbWUvdGFncyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgY29sdW1uOmNvZGUvbmFtZS90YWdzIHF1ZXJ5XG4gKiBAcmV0dXJucyBtYXRjaGVzIGBbe2NvZGUsIHdob3JkYSwgdXNlYXIsIHVzcmRhbSwgdXNyZGFmLCBldXByaW0sIGV1cHJpZiwgdWx1cywgdWxldSwgdWxqYXBhbn1dYFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LmludGFrZXMoJ2hpcycpO1xuICogaWZjdDIwMTcuaW50YWtlcygnSGlzdGlkaW5lJyk7XG4gKiAvLyDihpIgW3sgY29kZTogJ2hpcycsXG4gKiAvLyDihpIgICAgd2hvcmRhOiAtMC4wMSxcbiAqIC8vIOKGkiAgICB1c2VhcjogTmFOLFxuICogLy8g4oaSICAgIHVzcmRhbTogLTAuMDE0LFxuICogLy8g4oaSICAgIHVzcmRhZjogTmFOLFxuICogLy8g4oaSICAgIGV1cHJpbTogTmFOLFxuICogLy8g4oaSICAgIGV1cHJpZjogTmFOLFxuICogLy8g4oaSICAgIHVsdXM6IE5hTixcbiAqIC8vIOKGkiAgICB1bGV1OiBOYU4sXG4gKiAvLyDihpIgICAgdWxqYXBhbjogTmFOIH1dXG4gKlxuICogaWZjdDIwMTcuaW50YWtlcygnaW50YWtlIG9mIHRvdGFsIGZpYnJlPycpO1xuICogaWZjdDIwMTcuaW50YWtlcygnd2hhdCBpcyByZGEgb2YgdG90YWwgZmliZXI/Jyk7XG4gKiAvLyDihpIgW3sgY29kZTogJ2ZpYnRnJyxcbiAqIC8vIOKGkiAgICB3aG9yZGE6IE5hTixcbiAqIC8vIOKGkiAgICB1c2VhcjogTmFOLFxuICogLy8g4oaSICAgIHVzcmRhbTogMzgsXG4gKiAvLyDihpIgICAgdXNyZGFmOiAyNSxcbiAqIC8vIOKGkiAgICBldXByaW06IE5hTixcbiAqIC8vIOKGkiAgICBldXByaWY6IE5hTixcbiAqIC8vIOKGkiAgICB1bHVzOiBOYU4sXG4gKiAvLyDihpIgICAgdWxldTogTmFOLFxuICogLy8g4oaSICAgIHVsamFwYW46IE5hTiB9XVxuICpcbiAqXG4gKiAvLyBOb3RlOlxuICogLy8gK3ZlIHZhbHVlIGluZGljYXRlcyBhbW91bnQgaW4gZ3JhbXMuXG4gKiAvLyAtdmUgdmFsdWUgaW5kaWNhdGVzIGFtb3VudCBpbiBncmFtcyBwZXIga2cgb2YgYm9keSB3ZWlnaHQuXG4gKiAvLyBOYU4gaW5kaWNhdGVzIG5vIHJlY29tbWVudGF0aW9uIGdpdmVuLlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRha2VzKHR4dDogc3RyaW5nKTogSW50YWtlW10ge1xuICBpZiAoY29ycHVzID09IG51bGwpIHJldHVybiBbXTtcbiAgcmV0dXJuIGNvbHVtbnModHh0KS5tYXAociA9PiBjb3JwdXM/LmdldChyLmNvZGUpIGFzIEludGFrZSk7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBQ2xGLFNBQVEsV0FBVyxFQUFFLE9BQU8sUUFBTyxzQkFBc0I7QUE2QnpELFlBQVk7QUFLWixpQkFBaUI7QUFDakIsSUFBSSxTQUFxQztBQUN6QyxZQUFZO0FBS1osbUJBQW1CO0FBQ25COzs7O0NBSUMsR0FDRCxlQUFlLFlBQVksSUFBWTtFQUNyQyxNQUFNLE1BQU8sSUFBSTtFQUNqQixNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sTUFBTSxLQUFLLEVBQUUsSUFBSTtFQUMzQyxNQUFNLFVBQVUsSUFBSSxLQUFLLENBQUMsTUFBTTtJQUFDLGNBQWM7SUFBTSxTQUFTO0VBQUc7RUFDakUsS0FBSyxNQUFNLEtBQUssUUFBUztJQUN2QixNQUFNLElBQXFDLENBQUM7SUFDNUMsSUFBSyxNQUFNLEtBQUssRUFDZCxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQUksU0FBUSxDQUFDLENBQUMsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDLEVBQUU7SUFDM0MsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUU7RUFDbEI7RUFDQSxPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLGVBQWU7RUFDcEIsSUFBSSxRQUFRLE9BQU87RUFDbkIsTUFBTSxJQUFJO0VBQ1YsU0FBUyxNQUFNLFlBQVk7RUFBZSxNQUFNO0VBQ2hELE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSxXQUFXLE1BQVksU0FBUyxFQUFFLE1BQXVCLENBQUMsQ0FBQztFQUMvRSxPQUFPLFdBQVcsS0FBSztJQUFDLE1BQU07SUFBUSxRQUFRO0lBQVEsT0FBTztJQUFRLFFBQVE7SUFDM0UsUUFBUTtJQUFRLFFBQVE7SUFBUSxRQUFRO0lBQVEsTUFBTTtJQUFRLE1BQU07SUFBUSxTQUFTO0VBQU0sR0FDM0YsQ0FBQyxNQUFNLGFBQWEsRUFBRSxNQUFNLElBQzVCLE9BQU8sTUFBTSxDQUFDO0lBQUMsSUFBSTtJQUFRLE9BQU87SUFBTSxVQUFVO01BQUMsTUFBTTtJQUFHO0VBQUMsR0FBRztBQUNwRTtBQUdBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNDQyxHQUNELE9BQU8sU0FBUyxRQUFRLEdBQVc7RUFDakMsSUFBSSxVQUFVLE1BQU0sT0FBTyxFQUFFO0VBQzdCLE9BQU8sUUFBUSxLQUFLLEdBQUcsQ0FBQyxDQUFBLElBQUssUUFBUSxJQUFJLEVBQUUsSUFBSTtBQUNqRCxFQUNBLFlBQVkifQ==