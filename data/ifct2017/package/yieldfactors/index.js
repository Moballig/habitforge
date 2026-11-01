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
 * Load the yield factors corpus from CSV file.
 * @param file CSV file path
 * @returns yield factors corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const { code, name, scie, lang, grup, tags, preparation } = r;
    const regn = parseInt(r.regn, 10);
    const yieldf = parseFloat(r.yield);
    map.set(r.code, {
      code,
      name,
      scie,
      lang,
      grup,
      regn,
      tags,
      yield: yieldf,
      preparation
    });
  }
  return map;
}
/**
 * Setup the lunr index for the yield factors corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('code');
    this.field('code');
    this.field('name');
    this.field('scie');
    this.field('lang');
    this.field('grup');
    this.field('tags');
    this.field('preparation');
    for (const r of corpus.values()){
      let { code, name, scie, lang, grup, tags, preparation } = r;
      name = name.replace(/^(\w+),/g, '$1 $1 $1 $1,');
      lang = lang.replace(/\[.*?\]/g, '');
      lang = lang.replace(/\w+\.\s([\w\',\/\(\)\- ]+)[;\.]?/g, '$1');
      lang = lang.replace(/[,\/\(\)\- ]+/g, ' ');
      this.add({
        code,
        name,
        scie,
        lang,
        grup,
        tags,
        preparation
      });
    }
  });
}
/**
 * Load the yield factors corpus from the file.
 * @returns yield factors corpus
 */ export async function loadYieldFactors() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(yieldFactorsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the yield factors CSV file.
 * @returns CSV file URL
 */ export function yieldFactorsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the yield factors table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function yieldFactorsSql(tab = "yieldfactors", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    name: "TEXT",
    scie: "TEXT",
    lang: "TEXT",
    grup: "TEXT",
    regn: "INT",
    tags: "TEXT",
    yield: "REAL",
    preparation: "TEXT"
  }, (await loadYieldFactors()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      name: "B",
      scie: "B",
      lang: "B",
      grup: "C",
      tags: "C",
      preparation: "C"
    }
  }, opt));
}
/**
 * Find matching yield factors of an code/name/scie/preparation query.
 * @param txt code/name/scie/preparation query
 * @returns matches `[{code, name, scie, yield, preparation}]`
 * @example
 * ```javascript
 * ifct2017.yieldFactors('mango');
 * ifct2017.yieldFactors('Mangifera indica');
 * // → [ { code: 'D057',
 * // →     name: 'Mango, green, raw',
 * // →     scie: 'Mangifera indica',
 * // →     lang: 'A. Keasa aam; B. Aam (kancha); G. Ambo; H. Katcha Aam; Kan. Mavinakayi; Kash. Kach Aamb; Kh. Soh pieng im; Mal. Manga; M. Heinou Ashangba; Mar. Amba; O. Ambu (kacha); P. Kaccha aam; Tam. Mangai; Tel. Mamidikaya; U. Kaccha aam.',
 * // →     grup: 'Other Vegetables',
 * // →     regn: 6,
 * // →     tags: 'vegetarian eggetarian fishetarian veg',
 * // →     yield: 0.6833333333,
 * // →     preparation: 'Washing, Peeling, Seed removal' } ]
 *
 * ifct2017.yieldFactors('yield factor of cow milk?');
 * ifct2017.yieldFactors('cow milk');
 * // → [ { code: 'L002',
 * // →     name: 'Milk, Cow',
 * // →     scie: '',
 * // →     lang: 'A. Garoor gakhir; B. Doodh (garu); G. Gai nu dhudh; H. Gai ka doodh; Kan. Hasuvina halu; Kash. Doodh; Kh. Dud masi; M. San Sanghom; Mar. Doodh (gay); O. Gai dudha; P. Gaan da doodh; S. Gow kshiram; Tam. Pasumpaal; Tel. Aavu paalu.',
 * // →     grup: 'Milk and Milk Products',
 * // →     regn: 6,
 * // →     tags: 'vegetarian eggetarian fishetarian veg',
 * // →     yield: 1,
 * // →     preparation: 'None' } ]
 * ```
 */ export function yieldFactors(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy95aWVsZGZhY3RvcnMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIE5hbWUgb2YgZm9vZCBpbiBsb2NhbCBsYW5ndWFnZXMsIGluY2x1ZGluZyBzY2llbnRpZmljIG5hbWUuICovXG5leHBvcnQgaW50ZXJmYWNlIFlpZWxkRmFjdG9yIHtcbiAgLyoqIEZvb2QgQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogRm9vZCBOYW1lLiAqL1xuICBuYW1lOiBzdHJpbmcsXG4gIC8qKiBTY2llbnRpZmljIE5hbWUuICovXG4gIHNjaWU6IHN0cmluZyxcbiAgLyoqIExvY2FsIE5hbWUuICovXG4gIGxhbmc6IHN0cmluZyxcbiAgLyoqIEZvb2QgR3JvdXAuICovXG4gIGdydXA6IHN0cmluZyxcbiAgLyoqIE5vLiBvZiBSZWdpb25zLiAqL1xuICByZWduOiBudW1iZXIsXG4gIC8qKiBUYWdzLiAqL1xuICB0YWdzOiBzdHJpbmcsXG4gIC8qKiBPdmVyYWxsIHlpZWxkIGZhY3RvciwgY29uc2lkZXJpbmcgcmVtb3ZhbCBvZiBpbmVkaWJsZSBwYXJ0cywgd2FzaG5nLCBhbmQgY3V0dGluZy4gKi9cbiAgeWllbGQ6IG51bWJlcixcbiAgLyoqIFByZXBhcmF0aW9uIGNvbnNpZGVyYXRpb25zLCBpbmNsdWRpbmcgc3RlbSByZW1vdmFsLCB3YXNoaW5nLCBkZXNlZWRpbmcsIGV0Yy4gKi9cbiAgcHJlcGFyYXRpb246IHN0cmluZyxcbn07XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEdMT0JBTFNcbmxldCBjb3JwdXM6IE1hcDxzdHJpbmcsIFlpZWxkRmFjdG9yPiB8IG51bGwgPSBudWxsO1xubGV0IGluZGV4OiBsdW5yLkluZGV4IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSB5aWVsZCBmYWN0b3JzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgeWllbGQgZmFjdG9ycyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgWWllbGRGYWN0b3I+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3Jkcykge1xuICAgIGNvbnN0IHtjb2RlLCBuYW1lLCBzY2llLCBsYW5nLCBncnVwLCB0YWdzLCBwcmVwYXJhdGlvbn0gPSByIGFzIHVua25vd24gYXMgWWllbGRGYWN0b3I7XG4gICAgY29uc3QgcmVnbiAgID0gcGFyc2VJbnQoci5yZWduLCAxMCk7XG4gICAgY29uc3QgeWllbGRmID0gcGFyc2VGbG9hdChyLnlpZWxkKTtcbiAgICBtYXAuc2V0KHIuY29kZSwge2NvZGUsIG5hbWUsIHNjaWUsIGxhbmcsIGdydXAsIHJlZ24sIHRhZ3MsIHlpZWxkOiB5aWVsZGYsIHByZXBhcmF0aW9ufSk7XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn1cblxuXG4vKipcbiAqIFNldHVwIHRoZSBsdW5yIGluZGV4IGZvciB0aGUgeWllbGQgZmFjdG9ycyBjb3JwdXMuXG4gKiBAcmV0dXJucyBsdW5yIGluZGV4XG4gKi9cbmZ1bmN0aW9uIHNldHVwSW5kZXgoY29ycHVzOiBNYXA8c3RyaW5nLCBZaWVsZEZhY3Rvcj4pIHtcbiAgcmV0dXJuIGx1bnIoZnVuY3Rpb24odGhpczogbHVuci5CdWlsZGVyKSB7XG4gICAgdGhpcy5yZWYoJ2NvZGUnKTtcbiAgICB0aGlzLmZpZWxkKCdjb2RlJyk7XG4gICAgdGhpcy5maWVsZCgnbmFtZScpO1xuICAgIHRoaXMuZmllbGQoJ3NjaWUnKTtcbiAgICB0aGlzLmZpZWxkKCdsYW5nJyk7XG4gICAgdGhpcy5maWVsZCgnZ3J1cCcpO1xuICAgIHRoaXMuZmllbGQoJ3RhZ3MnKTtcbiAgICB0aGlzLmZpZWxkKCdwcmVwYXJhdGlvbicpO1xuICAgIGZvciAoY29uc3QgciBvZiBjb3JwdXMudmFsdWVzKCkpIHtcbiAgICAgIGxldCB7Y29kZSwgbmFtZSwgc2NpZSwgbGFuZywgZ3J1cCwgdGFncywgcHJlcGFyYXRpb259ID0gcjtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL14oXFx3KyksL2csICckMSAkMSAkMSAkMSwnKTtcbiAgICAgIGxhbmcgPSBsYW5nLnJlcGxhY2UoL1xcWy4qP1xcXS9nLCAnJyk7XG4gICAgICBsYW5nID0gbGFuZy5yZXBsYWNlKC9cXHcrXFwuXFxzKFtcXHdcXCcsXFwvXFwoXFwpXFwtIF0rKVs7XFwuXT8vZywgJyQxJyk7XG4gICAgICBsYW5nID0gbGFuZy5yZXBsYWNlKC9bLFxcL1xcKFxcKVxcLSBdKy9nLCAnICcpO1xuICAgICAgdGhpcy5hZGQoe2NvZGUsIG5hbWUsIHNjaWUsIGxhbmcsIGdydXAsIHRhZ3MsIHByZXBhcmF0aW9ufSk7XG4gICAgfVxuICB9KTtcbn1cblxuXG4vKipcbiAqIExvYWQgdGhlIHlpZWxkIGZhY3RvcnMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyB5aWVsZCBmYWN0b3JzIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFlpZWxkRmFjdG9ycygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIFlpZWxkRmFjdG9yPj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb3JwdXMgPSBhd2FpdCBsb2FkRnJvbUNzdih5aWVsZEZhY3RvcnNDc3YoKSk7XG4gIGluZGV4ICA9IHNldHVwSW5kZXgoY29ycHVzKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgeWllbGQgZmFjdG9ycyBDU1YgZmlsZS5cbiAqIEByZXR1cm5zIENTViBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24geWllbGRGYWN0b3JzQ3N2KCk6IHN0cmluZyB7XG4gIHJldHVybiBpbXBvcnQubWV0YS5yZXNvbHZlKCcuL2luZGV4LmNzdicpO1xufVxuXG5cbi8qKlxuICogT2J0YWluIFNRTCBjb21tYW5kIHRvIGNyZWF0ZSBhbmQgcG9wdWxhdGUgdGhlIHlpZWxkIGZhY3RvcnMgdGFibGUuXG4gKiBAcGFyYW0gdGFiIHRhYmxlIG5hbWVcbiAqIEBwYXJhbSBvcHQgb3B0aW9ucyBmb3IgdGhlIHRhYmxlXG4gKiBAcmV0dXJucyBDUkVBVEUgVEFCTEUsIElOU0VSVCwgQ1JFQVRFIFZJRVcsIENSRUFURSBJTkRFWCBzdGF0ZW1lbnRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB5aWVsZEZhY3RvcnNTcWwodGFiOiBzdHJpbmc9XCJ5aWVsZGZhY3RvcnNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2NvZGU6IFwiVEVYVFwiLCBuYW1lOiBcIlRFWFRcIiwgc2NpZTogXCJURVhUXCIsIGxhbmc6IFwiVEVYVFwiLCBncnVwOiBcIlRFWFRcIiwgcmVnbjogXCJJTlRcIiwgdGFnczogXCJURVhUXCIsIHlpZWxkOiBcIlJFQUxcIiwgcHJlcGFyYXRpb246IFwiVEVYVFwifSxcbiAgICAoYXdhaXQgbG9hZFlpZWxkRmFjdG9ycygpKS52YWx1ZXMoKSBhcyBJdGVyYWJsZTxSb3dEYXRhPixcbiAgICBPYmplY3QuYXNzaWduKHtwazogXCJjb2RlXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2NvZGU6IFwiQVwiLCBuYW1lOiBcIkJcIiwgc2NpZTogXCJCXCIsIGxhbmc6IFwiQlwiLCBncnVwOiBcIkNcIiwgdGFnczogXCJDXCIsIHByZXBhcmF0aW9uOiBcIkNcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgeWllbGQgZmFjdG9ycyBvZiBhbiBjb2RlL25hbWUvc2NpZS9wcmVwYXJhdGlvbiBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgY29kZS9uYW1lL3NjaWUvcHJlcGFyYXRpb24gcXVlcnlcbiAqIEByZXR1cm5zIG1hdGNoZXMgYFt7Y29kZSwgbmFtZSwgc2NpZSwgeWllbGQsIHByZXBhcmF0aW9ufV1gXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcueWllbGRGYWN0b3JzKCdtYW5nbycpO1xuICogaWZjdDIwMTcueWllbGRGYWN0b3JzKCdNYW5naWZlcmEgaW5kaWNhJyk7XG4gKiAvLyDihpIgWyB7IGNvZGU6ICdEMDU3JyxcbiAqIC8vIOKGkiAgICAgbmFtZTogJ01hbmdvLCBncmVlbiwgcmF3JyxcbiAqIC8vIOKGkiAgICAgc2NpZTogJ01hbmdpZmVyYSBpbmRpY2EnLFxuICogLy8g4oaSICAgICBsYW5nOiAnQS4gS2Vhc2EgYWFtOyBCLiBBYW0gKGthbmNoYSk7IEcuIEFtYm87IEguIEthdGNoYSBBYW07IEthbi4gTWF2aW5ha2F5aTsgS2FzaC4gS2FjaCBBYW1iOyBLaC4gU29oIHBpZW5nIGltOyBNYWwuIE1hbmdhOyBNLiBIZWlub3UgQXNoYW5nYmE7IE1hci4gQW1iYTsgTy4gQW1idSAoa2FjaGEpOyBQLiBLYWNjaGEgYWFtOyBUYW0uIE1hbmdhaTsgVGVsLiBNYW1pZGlrYXlhOyBVLiBLYWNjaGEgYWFtLicsXG4gKiAvLyDihpIgICAgIGdydXA6ICdPdGhlciBWZWdldGFibGVzJyxcbiAqIC8vIOKGkiAgICAgcmVnbjogNixcbiAqIC8vIOKGkiAgICAgdGFnczogJ3ZlZ2V0YXJpYW4gZWdnZXRhcmlhbiBmaXNoZXRhcmlhbiB2ZWcnLFxuICogLy8g4oaSICAgICB5aWVsZDogMC42ODMzMzMzMzMzLFxuICogLy8g4oaSICAgICBwcmVwYXJhdGlvbjogJ1dhc2hpbmcsIFBlZWxpbmcsIFNlZWQgcmVtb3ZhbCcgfSBdXG4gKlxuICogaWZjdDIwMTcueWllbGRGYWN0b3JzKCd5aWVsZCBmYWN0b3Igb2YgY293IG1pbGs/Jyk7XG4gKiBpZmN0MjAxNy55aWVsZEZhY3RvcnMoJ2NvdyBtaWxrJyk7XG4gKiAvLyDihpIgWyB7IGNvZGU6ICdMMDAyJyxcbiAqIC8vIOKGkiAgICAgbmFtZTogJ01pbGssIENvdycsXG4gKiAvLyDihpIgICAgIHNjaWU6ICcnLFxuICogLy8g4oaSICAgICBsYW5nOiAnQS4gR2Fyb29yIGdha2hpcjsgQi4gRG9vZGggKGdhcnUpOyBHLiBHYWkgbnUgZGh1ZGg7IEguIEdhaSBrYSBkb29kaDsgS2FuLiBIYXN1dmluYSBoYWx1OyBLYXNoLiBEb29kaDsgS2guIER1ZCBtYXNpOyBNLiBTYW4gU2FuZ2hvbTsgTWFyLiBEb29kaCAoZ2F5KTsgTy4gR2FpIGR1ZGhhOyBQLiBHYWFuIGRhIGRvb2RoOyBTLiBHb3cga3NoaXJhbTsgVGFtLiBQYXN1bXBhYWw7IFRlbC4gQWF2dSBwYWFsdS4nLFxuICogLy8g4oaSICAgICBncnVwOiAnTWlsayBhbmQgTWlsayBQcm9kdWN0cycsXG4gKiAvLyDihpIgICAgIHJlZ246IDYsXG4gKiAvLyDihpIgICAgIHRhZ3M6ICd2ZWdldGFyaWFuIGVnZ2V0YXJpYW4gZmlzaGV0YXJpYW4gdmVnJyxcbiAqIC8vIOKGkiAgICAgeWllbGQ6IDEsXG4gKiAvLyDihpIgICAgIHByZXBhcmF0aW9uOiAnTm9uZScgfSBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHlpZWxkRmFjdG9ycyh0eHQ6IHN0cmluZyk6IFlpZWxkRmFjdG9yW10ge1xuICBpZiAoaW5kZXggPT0gbnVsbCkgcmV0dXJuIFtdO1xuICBjb25zdCBhOiBZaWVsZEZhY3RvcltdID0gW107IHR4dCA9IHR4dC5yZXBsYWNlKC9cXFcvZywgJyAnKTtcbiAgY29uc3QgbWF0cyA9IGluZGV4LnNlYXJjaCh0eHQpOyBsZXQgbWF4ID0gMDtcbiAgZm9yIChjb25zdCBtYXQgb2YgbWF0cylcbiAgICBtYXggPSBNYXRoLm1heChtYXgsIE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCk7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgaWYgKE9iamVjdC5rZXlzKG1hdC5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCA9PT0gbWF4KSBhLnB1c2goY29ycHVzPy5nZXQobWF0LnJlZikgfHwge30gYXMgWWllbGRGYWN0b3IpO1xuICByZXR1cm4gYTtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLFlBQVksU0FBVSxXQUFXO0FBQ2pDLE9BQU8sVUFBVSxPQUFPLENBQUUsc0NBQXNDO0FBQ2hFLFNBQThDLFVBQVUsUUFBTyxtQkFBbUI7QUEyQmxGLFlBQVk7QUFLWixpQkFBaUI7QUFDakIsSUFBSSxTQUEwQztBQUM5QyxJQUFJLFFBQTJCO0FBQy9CLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJ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