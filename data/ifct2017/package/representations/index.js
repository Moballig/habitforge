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
 * Load the representations corpus from CSV file.
 * @param file CSV file path
 * @returns representations corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const factor = parseFloat(r.factor) || 1;
    map.set(r.code, {
      code: r.code,
      type: r.type,
      factor,
      unit: r.unit
    });
  }
  return map;
}
/**
 * Load the representations corpus from the file.
 * @returns representations corpus
 */ export async function loadRepresentations() {
  if (corpus) return corpus;
  const p = loadColumns();
  corpus = await loadFromCsv(representationsCsv());
  await p;
  return corpus;
}
/**
 * Get the path to the representations CSV file.
 * @returns CSV file URL
 */ export function representationsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the representations table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function representationsSql(tab = "representations", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    type: "TEXT",
    factor: "REAL",
    unit: "TEXT"
  }, (await loadRepresentations()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      type: "B",
      unit: "C"
    }
  }, opt));
}
/**
 * Find matching representations of a column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns `{code, type, factor, unit}` if found, else null
 * @example
 * ```javascript
 * ifct2017.representations('his');
 * ifct2017.representations('Histidine');
 * // → { type: 'mass', factor: 1000, unit: 'mg' }
 *
 * ifct2017.representations('representation of vitamin d?');
 * ifct2017.representations('what is unit of ergocalciferol?');
 * // → { type: 'mass', factor: 1000000000, unit: 'ng' }
 * ```
 */ export function representations(txt) {
  if (corpus == null) return null;
  const ms = columns(txt);
  if (ms.length === 0) return null;
  return corpus.get(ms[0].code) || null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9yZXByZXNlbnRhdGlvbnMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcbmltcG9ydCB7bG9hZENvbHVtbnMsIGNvbHVtbnN9IGZyb20gXCIuLi9jb2x1bW5zL2luZGV4LmpzXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIFJlcHJlc2VudGF0aW9uIG9mIGEgY29sdW1uIChhcyBmYWN0b3IgYW5kIHVuaXQpLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXByZXNlbnRhdGlvbiB7XG4gIC8qKiBDb2x1bW4gQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogVHlwZSBvZiBwaHlzaWNhbCBxdWFudGl0eS4gKi9cbiAgdHlwZTogc3RyaW5nLFxuICAvKiogTXVsdGlwbGljYXRpb24gZmFjdG9yLiAqL1xuICBmYWN0b3I6IG51bWJlcixcbiAgLyoqIFVuaXQgc3ltYm9sLiAqL1xuICB1bml0OiBzdHJpbmc7XG59O1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBSZXByZXNlbnRhdGlvbj4gfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIHJlcHJlc2VudGF0aW9ucyBjb3JwdXMgZnJvbSBDU1YgZmlsZS5cbiAqIEBwYXJhbSBmaWxlIENTViBmaWxlIHBhdGhcbiAqIEByZXR1cm5zIHJlcHJlc2VudGF0aW9ucyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgUmVwcmVzZW50YXRpb24+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IGZhY3RvciA9IHBhcnNlRmxvYXQoci5mYWN0b3IpIHx8IDE7XG4gICAgbWFwLnNldChyLmNvZGUsIHtjb2RlOiByLmNvZGUsIHR5cGU6IHIudHlwZSwgZmFjdG9yLCB1bml0OiByLnVuaXR9KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgcmVwcmVzZW50YXRpb25zIGNvcnB1cyBmcm9tIHRoZSBmaWxlLlxuICogQHJldHVybnMgcmVwcmVzZW50YXRpb25zIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFJlcHJlc2VudGF0aW9ucygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIFJlcHJlc2VudGF0aW9uPj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb25zdCBwID0gbG9hZENvbHVtbnMoKTtcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YocmVwcmVzZW50YXRpb25zQ3N2KCkpOyBhd2FpdCBwO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSByZXByZXNlbnRhdGlvbnMgQ1NWIGZpbGUuXG4gKiBAcmV0dXJucyBDU1YgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcHJlc2VudGF0aW9uc0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSByZXByZXNlbnRhdGlvbnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXByZXNlbnRhdGlvbnNTcWwodGFiOiBzdHJpbmc9XCJyZXByZXNlbnRhdGlvbnNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2NvZGU6IFwiVEVYVFwiLCB0eXBlOiBcIlRFWFRcIiwgZmFjdG9yOiBcIlJFQUxcIiwgdW5pdDogXCJURVhUXCJ9LFxuICAgIChhd2FpdCBsb2FkUmVwcmVzZW50YXRpb25zKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcImNvZGVcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7Y29kZTogXCJBXCIsIHR5cGU6IFwiQlwiLCB1bml0OiBcIkNcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgcmVwcmVzZW50YXRpb25zIG9mIGEgY29sdW1uOmNvZGUvbmFtZS90YWdzIHF1ZXJ5LlxuICogQHBhcmFtIHR4dCBjb2x1bW46Y29kZS9uYW1lL3RhZ3MgcXVlcnlcbiAqIEByZXR1cm5zIGB7Y29kZSwgdHlwZSwgZmFjdG9yLCB1bml0fWAgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3LnJlcHJlc2VudGF0aW9ucygnaGlzJyk7XG4gKiBpZmN0MjAxNy5yZXByZXNlbnRhdGlvbnMoJ0hpc3RpZGluZScpO1xuICogLy8g4oaSIHsgdHlwZTogJ21hc3MnLCBmYWN0b3I6IDEwMDAsIHVuaXQ6ICdtZycgfVxuICpcbiAqIGlmY3QyMDE3LnJlcHJlc2VudGF0aW9ucygncmVwcmVzZW50YXRpb24gb2Ygdml0YW1pbiBkPycpO1xuICogaWZjdDIwMTcucmVwcmVzZW50YXRpb25zKCd3aGF0IGlzIHVuaXQgb2YgZXJnb2NhbGNpZmVyb2w/Jyk7XG4gKiAvLyDihpIgeyB0eXBlOiAnbWFzcycsIGZhY3RvcjogMTAwMDAwMDAwMCwgdW5pdDogJ25nJyB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcHJlc2VudGF0aW9ucyh0eHQ6IHN0cmluZyk6IFJlcHJlc2VudGF0aW9uIHwgbnVsbCB7XG4gIGlmIChjb3JwdXMgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IG1zID0gY29sdW1ucyh0eHQpO1xuICBpZiAobXMubGVuZ3RoPT09MCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBjb3JwdXMuZ2V0KG1zWzBdLmNvZGUpfHxudWxsO1xufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFDakMsU0FBOEMsVUFBVSxRQUFPLG1CQUFtQjtBQUNsRixTQUFRLFdBQVcsRUFBRSxPQUFPLFFBQU8sc0JBQXNCO0FBaUJ6RCxZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBNkM7QUFDakQsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQVM7SUFDdkIsTUFBTSxTQUFTLFdBQVcsRUFBRSxNQUFNLEtBQUs7SUFDdkMsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUU7TUFBQyxNQUFNLEVBQUUsSUFBSTtNQUFFLE1BQU0sRUFBRSxJQUFJO01BQUU7TUFBUSxNQUFNLEVBQUUsSUFBSTtJQUFBO0VBQ25FO0VBQ0EsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLE1BQU0sSUFBSTtFQUNWLFNBQVMsTUFBTSxZQUFZO0VBQXVCLE1BQU07RUFDeEQsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsT0FBTyxZQUFZLE9BQU8sQ0FBQztBQUM3QjtBQUdBOzs7OztDQUtDLEdBQ0QsT0FBTyxlQUFlLG1CQUFtQixNQUFZLGlCQUFpQixFQUFFLE1BQXVCLENBQUMsQ0FBQztFQUMvRixPQUFPLFdBQVcsS0FBSztJQUFDLE1BQU07SUFBUSxNQUFNO0lBQVEsUUFBUTtJQUFRLE1BQU07RUFBTSxHQUM5RSxDQUFDLE1BQU0scUJBQXFCLEVBQUUsTUFBTSxJQUNwQyxPQUFPLE1BQU0sQ0FBQztJQUFDLElBQUk7SUFBUSxPQUFPO0lBQU0sVUFBVTtNQUFDLE1BQU07TUFBSyxNQUFNO01BQUssTUFBTTtJQUFHO0VBQUMsR0FBRztBQUMxRjtBQUdBOzs7Ozs7Ozs7Ozs7OztDQWNDLEdBQ0QsT0FBTyxTQUFTLGdCQUFnQixHQUFXO0VBQ3pDLElBQUksVUFBVSxNQUFNLE9BQU87RUFDM0IsTUFBTSxLQUFLLFFBQVE7RUFDbkIsSUFBSSxHQUFHLE1BQU0sS0FBRyxHQUFHLE9BQU87RUFDMUIsT0FBTyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksS0FBRztBQUNqQyxFQUNBLFlBQVkifQ==