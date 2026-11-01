// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
//#endregion
//#region CONSTANTS
const TEXTCOLS = new Set([
  'code',
  'name',
  'scie',
  'lang',
  'grup',
  'tags'
]);
//#endregion
//#region GLOBALS
let corpus = null;
//#endregion
//#region FUNCTIONS
// Parse a row from the CSV file.
function parseRow(row) {
  const a = {};
  for(const k in row){
    // Name of column is after the last semicolon.
    const l = k.substring(k.lastIndexOf(';') + 1).trim();
    a[l] = TEXTCOLS.has(l) ? row[k] : parseFloat(row[k]);
  }
  return a;
}
/**
 * Load the compositions corpus from CSV file.
 * @param file CSV file path
 * @returns compositions corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records)map.set(r.code, parseRow(r));
  return map;
}
/**
 * Load the compositions corpus from the file.
 * @returns compositions corpus
 */ export async function loadCompositionStats() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(compositionStatsCsv());
  return corpus;
}
/**
 * Get the path to the compositions stats CSV file.
 * @returns CSV file URL
 */ export function compositionStatsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Find the minimum, maximum, or average composition of all the foods.
 * @param type type of the composition stats (min/max/avg)
 * @returns composition stat (minimum, maximum, or average)
 * @example
 * ```javascript
 * ifct2017.compositionsStats('max');
 * // → { code: 'XMAX',
 * // →   name: 'Maximum composition of all foods',
 * // →   scie: '',
 * // →   lang: '',
 * // →   grup: '',
 * // →   regn: 0,
 * // →   tags: '',
 * // →   enerc: 2809,
 * // →   enerc_e: 86,
 * // →   water: 95.77,
 * // →   water_e: 2.78,
 * // →   ... } ]
 * ```
 */ export function compositionStats(type) {
  if (corpus == null) return [];
  switch(type){
    case 'min':
      return [
        corpus.get('XMIN')
      ];
    case 'max':
      return [
        corpus.get('XMAX')
      ];
    case 'avg':
      return [
        corpus.get('XAVG')
      ];
    default:
      return [];
  }
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9jb21wb3NpdGlvbnN0YXRzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuLy8gaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB0eXBlIHtDb21wb3NpdGlvbn0gZnJvbSBcIi4uL2NvbXBvc2l0aW9ucy9pbmRleC5qc1wiO1xuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogVHlwZSBvZiB0aGUgY29tcG9zaXRpb24gc3RhdHMuICovXG5leHBvcnQgdHlwZSBDb21wb3NpdGlvblN0YXRUeXBlID0gXCJtaW5cIiB8IFwibWF4XCIgfCBcImF2Z1wiO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBDT05TVEFOVFNcbmNvbnN0IFRFWFRDT0xTID0gbmV3IFNldChbJ2NvZGUnLCAnbmFtZScsICdzY2llJywgJ2xhbmcnLCAnZ3J1cCcsICd0YWdzJ10pO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBDb21wb3NpdGlvbj4gfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vLyBQYXJzZSBhIHJvdyBmcm9tIHRoZSBDU1YgZmlsZS5cbmZ1bmN0aW9uIHBhcnNlUm93KHJvdzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICBjb25zdCBhOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBudW1iZXI+ID0ge307XG4gIGZvciAoY29uc3QgayBpbiByb3cpIHtcbiAgICAvLyBOYW1lIG9mIGNvbHVtbiBpcyBhZnRlciB0aGUgbGFzdCBzZW1pY29sb24uXG4gICAgY29uc3QgbCA9IGsuc3Vic3RyaW5nKGsubGFzdEluZGV4T2YoJzsnKSsxKS50cmltKCk7XG4gICAgYVtsXSA9IFRFWFRDT0xTLmhhcyhsKT8gcm93W2tdIDogcGFyc2VGbG9hdChyb3dba10pO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgY29tcG9zaXRpb25zIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgY29tcG9zaXRpb25zIGNvcnB1c1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnJvbUNzdihmaWxlOiBzdHJpbmcpIHtcbiAgY29uc3QgbWFwICA9IG5ldyBNYXA8c3RyaW5nLCBDb21wb3NpdGlvbj4oKTtcbiAgY29uc3QgZGF0YSA9IGF3YWl0IChhd2FpdCBmZXRjaChmaWxlKSkudGV4dCgpO1xuICBjb25zdCByZWNvcmRzID0gY3N2LnBhcnNlKGRhdGEsIHtza2lwRmlyc3RSb3c6IHRydWUsIGNvbW1lbnQ6IFwiI1wifSk7XG4gIGZvciAoY29uc3QgciBvZiByZWNvcmRzKVxuICAgIG1hcC5zZXQoci5jb2RlLCBwYXJzZVJvdyhyKSBhcyB1bmtub3duIGFzIENvbXBvc2l0aW9uKTtcbiAgcmV0dXJuIG1hcDtcbn1cblxuXG4vKipcbiAqIExvYWQgdGhlIGNvbXBvc2l0aW9ucyBjb3JwdXMgZnJvbSB0aGUgZmlsZS5cbiAqIEByZXR1cm5zIGNvbXBvc2l0aW9ucyBjb3JwdXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb21wb3NpdGlvblN0YXRzKCk6IFByb21pc2U8TWFwPHN0cmluZywgQ29tcG9zaXRpb24+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KGNvbXBvc2l0aW9uU3RhdHNDc3YoKSk7XG4gIHJldHVybiBjb3JwdXM7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGNvbXBvc2l0aW9ucyBzdGF0cyBDU1YgZmlsZS5cbiAqIEByZXR1cm5zIENTViBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zaXRpb25TdGF0c0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgdGhlIG1pbmltdW0sIG1heGltdW0sIG9yIGF2ZXJhZ2UgY29tcG9zaXRpb24gb2YgYWxsIHRoZSBmb29kcy5cbiAqIEBwYXJhbSB0eXBlIHR5cGUgb2YgdGhlIGNvbXBvc2l0aW9uIHN0YXRzIChtaW4vbWF4L2F2ZylcbiAqIEByZXR1cm5zIGNvbXBvc2l0aW9uIHN0YXQgKG1pbmltdW0sIG1heGltdW0sIG9yIGF2ZXJhZ2UpXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuY29tcG9zaXRpb25zU3RhdHMoJ21heCcpO1xuICogLy8g4oaSIHsgY29kZTogJ1hNQVgnLFxuICogLy8g4oaSICAgbmFtZTogJ01heGltdW0gY29tcG9zaXRpb24gb2YgYWxsIGZvb2RzJyxcbiAqIC8vIOKGkiAgIHNjaWU6ICcnLFxuICogLy8g4oaSICAgbGFuZzogJycsXG4gKiAvLyDihpIgICBncnVwOiAnJyxcbiAqIC8vIOKGkiAgIHJlZ246IDAsXG4gKiAvLyDihpIgICB0YWdzOiAnJyxcbiAqIC8vIOKGkiAgIGVuZXJjOiAyODA5LFxuICogLy8g4oaSICAgZW5lcmNfZTogODYsXG4gKiAvLyDihpIgICB3YXRlcjogOTUuNzcsXG4gKiAvLyDihpIgICB3YXRlcl9lOiAyLjc4LFxuICogLy8g4oaSICAgLi4uIH0gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb3NpdGlvblN0YXRzKHR5cGU6IENvbXBvc2l0aW9uU3RhdFR5cGUpOiBDb21wb3NpdGlvbltdIHtcbiAgaWYgKGNvcnB1cyA9PSBudWxsKSByZXR1cm4gW107XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ21pbic6IHJldHVybiBbY29ycHVzLmdldCgnWE1JTicpIGFzIENvbXBvc2l0aW9uXTtcbiAgICBjYXNlICdtYXgnOiByZXR1cm4gW2NvcnB1cy5nZXQoJ1hNQVgnKSBhcyBDb21wb3NpdGlvbl07XG4gICAgY2FzZSAnYXZnJzogcmV0dXJuIFtjb3JwdXMuZ2V0KCdYQVZHJykgYXMgQ29tcG9zaXRpb25dO1xuICAgIGRlZmF1bHQ6IHJldHVybiBbXTtcbiAgfVxufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFTakMsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQixNQUFNLFdBQVcsSUFBSSxJQUFJO0VBQUM7RUFBUTtFQUFRO0VBQVE7RUFBUTtFQUFRO0NBQU87QUFDekUsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQTBDO0FBQzlDLFlBQVk7QUFLWixtQkFBbUI7QUFDbkIsaUNBQWlDO0FBQ2pDLFNBQVMsU0FBUyxHQUEyQjtFQUMzQyxNQUFNLElBQXFDLENBQUM7RUFDNUMsSUFBSyxNQUFNLEtBQUssSUFBSztJQUNuQiw4Q0FBOEM7SUFDOUMsTUFBTSxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLE9BQUssR0FBRyxJQUFJO0lBQ2hELENBQUMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxHQUFHLENBQUMsS0FBSSxHQUFHLENBQUMsRUFBRSxHQUFHLFdBQVcsR0FBRyxDQUFDLEVBQUU7RUFDcEQ7RUFDQSxPQUFPO0FBQ1Q7QUFHQTs7OztDQUlDLEdBQ0QsZUFBZSxZQUFZLElBQVk7RUFDckMsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLE1BQU0sQ0FBQyxNQUFNLE1BQU0sS0FBSyxFQUFFLElBQUk7RUFDM0MsTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU07SUFBQyxjQUFjO0lBQU0sU0FBUztFQUFHO0VBQ2pFLEtBQUssTUFBTSxLQUFLLFFBQ2QsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUztFQUMzQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLGVBQWU7RUFDcEIsSUFBSSxRQUFRLE9BQU87RUFDbkIsU0FBUyxNQUFNLFlBQVk7RUFDM0IsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxTQUFTO0VBQ2QsT0FBTyxZQUFZLE9BQU8sQ0FBQztBQUM3QjtBQUdBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQyxHQUNELE9BQU8sU0FBUyxpQkFBaUIsSUFBeUI7RUFDeEQsSUFBSSxVQUFVLE1BQU0sT0FBTyxFQUFFO0VBQzdCLE9BQVE7SUFDTixLQUFLO01BQU8sT0FBTztRQUFDLE9BQU8sR0FBRyxDQUFDO09BQXVCO0lBQ3RELEtBQUs7TUFBTyxPQUFPO1FBQUMsT0FBTyxHQUFHLENBQUM7T0FBdUI7SUFDdEQsS0FBSztNQUFPLE9BQU87UUFBQyxPQUFPLEdBQUcsQ0FBQztPQUF1QjtJQUN0RDtNQUFTLE9BQU8sRUFBRTtFQUNwQjtBQUNGLEVBQ0EsWUFBWSJ9