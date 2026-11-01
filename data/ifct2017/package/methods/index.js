// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import lunr from "lunr"; // @deno-types="npm:@types/lunr@2.3.7"
import { setupTable } from "@nodef/extra-sql";
import { loadColumns, columns } from "../columns/index.js";
//#endregion
//#region CONSTANTS
const OVERRIDE = new Map([
  [
    'crypxb',
    'Carotenoids'
  ],
  [
    'cartg',
    'Carotenoids'
  ],
  [
    'carta',
    'Carotenoids'
  ],
  [
    'cartb',
    'Carotenoids'
  ],
  [
    'cholc',
    'Stigmasterol, β-Sitosterol, Campesterol, Ergosterol, 5-alpha-Cholestenol'
  ],
  [
    'phytac',
    'Phyates'
  ],
  [
    'vitb',
    null
  ],
  [
    'vitd',
    'Vitamin D2 & D3'
  ],
  [
    'vitk',
    'Vitamin K1 & K2'
  ],
  [
    'olsac',
    'Oligosaccharides (Raffinose, Stachyose, Verbascose and Ajugose)'
  ],
  [
    'phystr',
    'Stigmasterol, β-Sitosterol, Campesterol, Ergosterol, 5-alpha-Cholestenol'
  ],
  [
    'mnrleq',
    null
  ],
  [
    'mnrlet',
    null
  ],
  [
    'mnrlpet',
    null
  ],
  [
    'mnrlnet',
    null
  ],
  [
    'mnrltx',
    null
  ],
  [
    'vit',
    null
  ]
]);
//#endregion
//#region GLOBALS
let corpus = null;
let index = null;
//#endregion
//#region FUNCTIONS
function bestMatchIndex(index, analyte) {
  const txt = analyte.replace(/\W/g, ' ');
  const ms = index.search(txt);
  let max = 0;
  for (const m of ms)max = Math.max(max, Object.keys(m.matchData.metadata).length);
  for (const m of ms)if (Object.keys(m.matchData.metadata).length === max) return m.ref;
  return -1;
}
/**
 * Load the methods corpus from CSV file.
 * @param file CSV file path
 * @returns methods corpus
 */ async function loadFromCsv(records, index) {
  const map = new Map();
  const ccolumns = await loadColumns();
  let i = -1;
  for (const c of ccolumns.values()){
    if (OVERRIDE.has(c.code)) {
      const analyte = OVERRIDE.get(c.code);
      i = analyte != null ? bestMatchIndex(index, analyte) : -1;
    } else {
      let tags = `${c.code} ${c.code} ${c.code} ${c.name} ${c.name} ${c.tags}`;
      tags = tags.replace(/\W+/g, ' ').toLowerCase().trim();
      i = bestMatchIndex(index, tags);
    // if (c.code==='as') console.log(c, tags, ms);
    }
    if (i >= 0) map.set(c.code, records[i]);
  // if (index>=0) console.log(c.code, '->', array[index].analyte, tags);
  // if (c.code==='facis') console.log(ms);
  }
  return map;
}
/**
 * Setup the lunr index for the methods corpus.
 * @param records records from CSV file
 * @returns lunr index
 */ function setupIndex(records) {
  return lunr(function() {
    this.ref('index');
    this.field('analyte');
    this.pipeline.remove(lunr.stopWordFilter);
    for(let i = 0, I = records.length; i < I; i++)this.add({
      index: i,
      analyte: records[i].analyte.replace(/\W+/g, ' ')
    });
  });
}
/**
 * Load the methods corpus from the file.
 * @returns methods corpus
 */ export async function loadMethods() {
  if (corpus) return corpus;
  const data = await (await fetch(methodsCsv())).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: '#'
  });
  index = setupIndex(records);
  corpus = await loadFromCsv(records, index);
  return corpus;
}
/**
 * Get the path to the methods CSV file.
 * @returns CSV file URL
 */ export function methodsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the methods table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function methodsSql(tab = "methods", opt = {}) {
  return setupTable(tab, {
    analyte: "TEXT",
    method: "TEXT",
    reference: "TEXT"
  }, (await loadMethods()).values(), Object.assign({
    pk: "analyte",
    index: true,
    tsvector: {
      analyte: "A",
      method: "B",
      reference: "C"
    }
  }, opt));
}
/**
 * Find matching methods of a column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns `{analyte, method, reference}` if found, else null
 * @example
 * ```javascript
 * ifct2017.methods('soluble oxalic acid');
 * ifct2017.methods('Insoluble Oxalic Acid');
 * // → { analyte: 'Oxalic acid (Total), Soluble oxalic acid, Insoluble oxalic acid',
 * // →   method: 'Fast- HPLC',
 * // →   reference: 'Moreau & Savage (2009)' }
 *
 * ifct2017.methods('what is analytical method of saponin?');
 * ifct2017.methods('how is total saponin measured?');
 * // → { analyte: 'Total Saponin',
 * // →   method: 'Colorimetry',
 * // →   reference: 'Dini et al. (2009)' }
 * ```
 */ export function methods(txt) {
  if (index == null) return null;
  const cs = columns(txt);
  return cs.length > 0 ? corpus?.get(cs[0].code) || null : null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9tZXRob2RzL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoQykgMjAyNS0yNiBTdWJoYWppdCBTYWh1XG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbi8vIFNlZSBMSUNFTlNFIGZvciBmdWxsIHRlcm1zXG5pbXBvcnQgKiBhcyBjc3YgIGZyb20gXCJAc3RkL2NzdlwiO1xuaW1wb3J0IGx1bnIgZnJvbSBcImx1bnJcIjsgIC8vIEBkZW5vLXR5cGVzPVwibnBtOkB0eXBlcy9sdW5yQDIuMy43XCJcbmltcG9ydCB7dHlwZSBSb3dEYXRhLCB0eXBlIFNldHVwVGFibGVPcHRpb25zLCBzZXR1cFRhYmxlfSBmcm9tIFwiQG5vZGVmL2V4dHJhLXNxbFwiO1xuaW1wb3J0IHtsb2FkQ29sdW1ucywgY29sdW1uc30gZnJvbSBcIi4uL2NvbHVtbnMvaW5kZXguanNcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogQW5hbHl0aWNhbCBtZXRob2RzIGZvciBudXRyaWVudCBhbmQgYmlvYWN0aXZlIGNvbXBvbmVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWV0aG9kIHtcbiAgLyoqIEFuYWx5dGUuICovXG4gIGFuYWx5dGU6IHN0cmluZyxcbiAgLyoqIE1ldGhvZC4gKi9cbiAgbWV0aG9kOiBzdHJpbmcsXG4gIC8qKiBSZWZlcmVuY2UuICovXG4gIHJlZmVyZW5jZTogc3RyaW5nXG59O1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBDT05TVEFOVFNcbmNvbnN0IE9WRVJSSURFID0gbmV3IE1hcChbXG4gIFsnY3J5cHhiJywgICdDYXJvdGVub2lkcyddLFxuICBbJ2NhcnRnJywgICAnQ2Fyb3Rlbm9pZHMnXSxcbiAgWydjYXJ0YScsICAgJ0Nhcm90ZW5vaWRzJ10sXG4gIFsnY2FydGInLCAgICdDYXJvdGVub2lkcyddLFxuICBbJ2Nob2xjJywgICAnU3RpZ21hc3Rlcm9sLCDOsi1TaXRvc3Rlcm9sLCBDYW1wZXN0ZXJvbCwgRXJnb3N0ZXJvbCwgNS1hbHBoYS1DaG9sZXN0ZW5vbCddLFxuICBbJ3BoeXRhYycsICAnUGh5YXRlcyddLFxuICBbJ3ZpdGInLCAgICBudWxsXSxcbiAgWyd2aXRkJywgICAgJ1ZpdGFtaW4gRDIgJiBEMyddLFxuICBbJ3ZpdGsnLCAgICAnVml0YW1pbiBLMSAmIEsyJ10sXG4gIFsnb2xzYWMnLCAgICdPbGlnb3NhY2NoYXJpZGVzIChSYWZmaW5vc2UsIFN0YWNoeW9zZSwgVmVyYmFzY29zZSBhbmQgQWp1Z29zZSknXSxcbiAgWydwaHlzdHInLCAgJ1N0aWdtYXN0ZXJvbCwgzrItU2l0b3N0ZXJvbCwgQ2FtcGVzdGVyb2wsIEVyZ29zdGVyb2wsIDUtYWxwaGEtQ2hvbGVzdGVub2wnXSxcbiAgWydtbnJsZXEnLCAgbnVsbF0sXG4gIFsnbW5ybGV0JywgIG51bGxdLFxuICBbJ21ucmxwZXQnLCBudWxsXSxcbiAgWydtbnJsbmV0JywgbnVsbF0sXG4gIFsnbW5ybHR4JywgIG51bGxdLFxuICBbJ3ZpdCcsICAgICBudWxsXSxcbl0pO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBNZXRob2Q+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG5mdW5jdGlvbiBiZXN0TWF0Y2hJbmRleChpbmRleDogbHVuci5JbmRleCwgYW5hbHl0ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHR4dCA9IGFuYWx5dGUucmVwbGFjZSgvXFxXL2csICcgJyk7XG4gIGNvbnN0IG1zICA9IGluZGV4LnNlYXJjaCh0eHQpOyBsZXQgbWF4ID0gMDtcbiAgZm9yIChjb25zdCBtIG9mIG1zKVxuICAgIG1heCA9IE1hdGgubWF4KG1heCwgT2JqZWN0LmtleXMobS5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aCk7XG4gIGZvciAoY29uc3QgbSBvZiBtcylcbiAgICBpZiAoT2JqZWN0LmtleXMobS5tYXRjaERhdGEubWV0YWRhdGEpLmxlbmd0aD09PW1heCkgcmV0dXJuIG0ucmVmO1xuICByZXR1cm4gLTE7XG59XG5cblxuLyoqXG4gKiBMb2FkIHRoZSBtZXRob2RzIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgbWV0aG9kcyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YocmVjb3JkczogTWV0aG9kW10sIGluZGV4OiBsdW5yLkluZGV4KSB7XG4gIGNvbnN0IG1hcCA9IG5ldyBNYXA8c3RyaW5nLCBNZXRob2Q+KCk7XG4gIGNvbnN0IGNjb2x1bW5zID0gYXdhaXQgbG9hZENvbHVtbnMoKTsgbGV0IGkgPSAtMTtcbiAgZm9yIChjb25zdCBjIG9mIGNjb2x1bW5zLnZhbHVlcygpKSB7XG4gICAgaWYgKE9WRVJSSURFLmhhcyhjLmNvZGUpKSB7XG4gICAgICBjb25zdCBhbmFseXRlID0gT1ZFUlJJREUuZ2V0KGMuY29kZSk7XG4gICAgICBpID0gYW5hbHl0ZSE9bnVsbD8gYmVzdE1hdGNoSW5kZXgoaW5kZXgsIGFuYWx5dGUpIDogLTE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IHRhZ3MgPSBgJHtjLmNvZGV9ICR7Yy5jb2RlfSAke2MuY29kZX0gJHtjLm5hbWV9ICR7Yy5uYW1lfSAke2MudGFnc31gO1xuICAgICAgdGFncyA9IHRhZ3MucmVwbGFjZSgvXFxXKy9nLCAnICcpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgaSA9IGJlc3RNYXRjaEluZGV4KGluZGV4LCB0YWdzKTtcbiAgICAgIC8vIGlmIChjLmNvZGU9PT0nYXMnKSBjb25zb2xlLmxvZyhjLCB0YWdzLCBtcyk7XG4gICAgfVxuICAgIGlmIChpID49IDApIG1hcC5zZXQoYy5jb2RlLCByZWNvcmRzW2ldKTtcbiAgICAvLyBpZiAoaW5kZXg+PTApIGNvbnNvbGUubG9nKGMuY29kZSwgJy0+JywgYXJyYXlbaW5kZXhdLmFuYWx5dGUsIHRhZ3MpO1xuICAgIC8vIGlmIChjLmNvZGU9PT0nZmFjaXMnKSBjb25zb2xlLmxvZyhtcyk7XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn1cblxuXG4vKipcbiAqIFNldHVwIHRoZSBsdW5yIGluZGV4IGZvciB0aGUgbWV0aG9kcyBjb3JwdXMuXG4gKiBAcGFyYW0gcmVjb3JkcyByZWNvcmRzIGZyb20gQ1NWIGZpbGVcbiAqIEByZXR1cm5zIGx1bnIgaW5kZXhcbiAqL1xuZnVuY3Rpb24gc2V0dXBJbmRleChyZWNvcmRzOiBNZXRob2RbXSkge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZignaW5kZXgnKTtcbiAgICB0aGlzLmZpZWxkKCdhbmFseXRlJyk7XG4gICAgdGhpcy5waXBlbGluZS5yZW1vdmUobHVuci5zdG9wV29yZEZpbHRlcik7XG4gICAgZm9yIChsZXQgaT0wLCBJPXJlY29yZHMubGVuZ3RoOyBpPEk7IGkrKylcbiAgICAgIHRoaXMuYWRkKHtpbmRleDogaSwgYW5hbHl0ZTogcmVjb3Jkc1tpXS5hbmFseXRlLnJlcGxhY2UoL1xcVysvZywgJyAnKX0pO1xuICB9KTtcbn1cblxuXG4vKipcbiAqIExvYWQgdGhlIG1ldGhvZHMgY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBtZXRob2RzIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZE1ldGhvZHMoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBNZXRob2Q+PiB7XG4gIGlmIChjb3JwdXMpIHJldHVybiBjb3JwdXM7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2gobWV0aG9kc0NzdigpKSkudGV4dCgpO1xuICBjb25zdCByZWNvcmRzID0gY3N2LnBhcnNlKGRhdGEsIHtza2lwRmlyc3RSb3c6IHRydWUsIGNvbW1lbnQ6ICcjJ30pIGFzIHVua25vd24gYXMgTWV0aG9kW107XG4gIGluZGV4ICA9IHNldHVwSW5kZXgocmVjb3Jkcyk7XG4gIGNvcnB1cyA9IGF3YWl0IGxvYWRGcm9tQ3N2KHJlY29yZHMsIGluZGV4KTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgbWV0aG9kcyBDU1YgZmlsZS5cbiAqIEByZXR1cm5zIENTViBmaWxlIFVSTFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWV0aG9kc0NzdigpOiBzdHJpbmcge1xuICByZXR1cm4gaW1wb3J0Lm1ldGEucmVzb2x2ZSgnLi9pbmRleC5jc3YnKTtcbn1cblxuXG4vKipcbiAqIE9idGFpbiBTUUwgY29tbWFuZCB0byBjcmVhdGUgYW5kIHBvcHVsYXRlIHRoZSBtZXRob2RzIHRhYmxlLlxuICogQHBhcmFtIHRhYiB0YWJsZSBuYW1lXG4gKiBAcGFyYW0gb3B0IG9wdGlvbnMgZm9yIHRoZSB0YWJsZVxuICogQHJldHVybnMgQ1JFQVRFIFRBQkxFLCBJTlNFUlQsIENSRUFURSBWSUVXLCBDUkVBVEUgSU5ERVggc3RhdGVtZW50c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWV0aG9kc1NxbCh0YWI6IHN0cmluZz1cIm1ldGhvZHNcIiwgb3B0OiBTZXR1cFRhYmxlT3B0aW9ucz17fSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBzZXR1cFRhYmxlKHRhYiwge2FuYWx5dGU6IFwiVEVYVFwiLCBtZXRob2Q6IFwiVEVYVFwiLCByZWZlcmVuY2U6IFwiVEVYVFwifSxcbiAgICAoYXdhaXQgbG9hZE1ldGhvZHMoKSkudmFsdWVzKCkgYXMgSXRlcmFibGU8Um93RGF0YT4sXG4gICAgT2JqZWN0LmFzc2lnbih7cGs6IFwiYW5hbHl0ZVwiLCBpbmRleDogdHJ1ZSwgdHN2ZWN0b3I6IHthbmFseXRlOiBcIkFcIiwgbWV0aG9kOiBcIkJcIiwgcmVmZXJlbmNlOiBcIkNcIn19LCBvcHQpKTtcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgbWV0aG9kcyBvZiBhIGNvbHVtbjpjb2RlL25hbWUvdGFncyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgY29sdW1uOmNvZGUvbmFtZS90YWdzIHF1ZXJ5XG4gKiBAcmV0dXJucyBge2FuYWx5dGUsIG1ldGhvZCwgcmVmZXJlbmNlfWAgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGlmY3QyMDE3Lm1ldGhvZHMoJ3NvbHVibGUgb3hhbGljIGFjaWQnKTtcbiAqIGlmY3QyMDE3Lm1ldGhvZHMoJ0luc29sdWJsZSBPeGFsaWMgQWNpZCcpO1xuICogLy8g4oaSIHsgYW5hbHl0ZTogJ094YWxpYyBhY2lkIChUb3RhbCksIFNvbHVibGUgb3hhbGljIGFjaWQsIEluc29sdWJsZSBveGFsaWMgYWNpZCcsXG4gKiAvLyDihpIgICBtZXRob2Q6ICdGYXN0LSBIUExDJyxcbiAqIC8vIOKGkiAgIHJlZmVyZW5jZTogJ01vcmVhdSAmIFNhdmFnZSAoMjAwOSknIH1cbiAqXG4gKiBpZmN0MjAxNy5tZXRob2RzKCd3aGF0IGlzIGFuYWx5dGljYWwgbWV0aG9kIG9mIHNhcG9uaW4/Jyk7XG4gKiBpZmN0MjAxNy5tZXRob2RzKCdob3cgaXMgdG90YWwgc2Fwb25pbiBtZWFzdXJlZD8nKTtcbiAqIC8vIOKGkiB7IGFuYWx5dGU6ICdUb3RhbCBTYXBvbmluJyxcbiAqIC8vIOKGkiAgIG1ldGhvZDogJ0NvbG9yaW1ldHJ5JyxcbiAqIC8vIOKGkiAgIHJlZmVyZW5jZTogJ0RpbmkgZXQgYWwuICgyMDA5KScgfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXRob2RzKHR4dDogc3RyaW5nKTogTWV0aG9kIHwgbnVsbCB7XG4gIGlmIChpbmRleCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY3MgPSBjb2x1bW5zKHR4dCk7XG4gIHJldHVybiBjcy5sZW5ndGg+MD8gY29ycHVzPy5nZXQoY3NbMF0uY29kZSkgfHwgbnVsbCA6IG51bGw7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBQ2xGLFNBQVEsV0FBVyxFQUFFLE9BQU8sUUFBTyxzQkFBc0I7QUFlekQsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQixNQUFNLFdBQVcsSUFBSSxJQUFJO0VBQ3ZCO0lBQUM7SUFBVztHQUFjO0VBQzFCO0lBQUM7SUFBVztHQUFjO0VBQzFCO0lBQUM7SUFBVztHQUFjO0VBQzFCO0lBQUM7SUFBVztHQUFjO0VBQzFCO0lBQUM7SUFBVztHQUEyRTtFQUN2RjtJQUFDO0lBQVc7R0FBVTtFQUN0QjtJQUFDO0lBQVc7R0FBSztFQUNqQjtJQUFDO0lBQVc7R0FBa0I7RUFDOUI7SUFBQztJQUFXO0dBQWtCO0VBQzlCO0lBQUM7SUFBVztHQUFrRTtFQUM5RTtJQUFDO0lBQVc7R0FBMkU7RUFDdkY7SUFBQztJQUFXO0dBQUs7RUFDakI7SUFBQztJQUFXO0dBQUs7RUFDakI7SUFBQztJQUFXO0dBQUs7RUFDakI7SUFBQztJQUFXO0dBQUs7RUFDakI7SUFBQztJQUFXO0dBQUs7RUFDakI7SUFBQztJQUFXO0dBQUs7Q0FDbEI7QUFDRCxZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBcUM7QUFDekMsSUFBSSxRQUEyQjtBQUMvQixZQUFZO0FBS1osbUJBQW1CO0FBQ25CLFNBQVMsZUFBZSxLQUFpQixFQUFFLE9BQWU7RUFDeEQsTUFBTSxNQUFNLFFBQVEsT0FBTyxDQUFDLE9BQU87RUFDbkMsTUFBTSxLQUFNLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQ3pDLEtBQUssTUFBTSxLQUFLLEdBQ2QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxL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