// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
import * as csv from "@std/csv";
import { setupTable } from "@nodef/extra-sql";
//#endregion
//#region GLOBALS
let corpus = null;
//#endregion
//#region FUNCTIONS
/**
 * Load the frequency distribution corpus from CSV file.
 * @param file CSV file path
 * @returns frequency distribution corpus
 */ async function loadFromCsv(file) {
  const map = new Map();
  const data = await (await fetch(file)).text();
  const records = csv.parse(data, {
    skipFirstRow: true,
    comment: "#"
  });
  for (const r of records){
    const states = parseFloat(r.states);
    const selected = parseFloat(r.selected);
    const sampled = parseFloat(r.sampled);
    const key = parseFloat(r.districts.split('-')[0].replace(/\D/g, ''));
    map.set(key === 70 ? 71 : key, {
      districts: r.districts,
      states,
      selected,
      sampled
    });
  }
  return map;
}
/**
 * Load the frequency distribution corpus from the file.
 * @returns frequency distribution corpus
 */ export async function loadFrequencyDistribution() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(frequencyDistributionCsv());
  return corpus;
}
/**
 * Get the path to the frequency distribution CSV file.
 * @returns CSV file URL
 */ export function frequencyDistributionCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the frequency distribution table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function frequencyDistributionSql(tab = "frequencydistribution", opt = {}) {
  return setupTable(tab, {
    districts: "TEXT",
    states: "INT",
    selected: "INT",
    sampled: "INT"
  }, (await loadFrequencyDistribution()).values(), Object.assign({
    pk: "districts",
    index: true,
    tsvector: {
      districts: "A"
    }
  }, opt));
}
/**
 * Find matching frequency distribution for a given no. of districts.
 * @param dis no. of districts
 * @returns `{districts, states, selected, sampled}` if found, else null
 * @example
 * ```javascript
 * ifct2017.frequencyDistribution(2);
 * ifct2017.frequencyDistribution(5);
 * // → { districts: '1-5', states: 9, selected: 1, sampled: 9 }
 *
 * ifct2017.frequencyDistribution(32);
 * ifct2017.frequencyDistribution(37);
 * // → { districts: '31-40', states: 4, selected: 5, sampled: 20 }
 * ```
 */ export function frequencyDistribution(dis) {
  if (corpus == null) return null;
  if (dis <= 5) return corpus.get(1) || null;
  if (dis <= 10) return corpus.get(6) || null;
  if (dis > 70) return corpus.get(71) || null;
  return corpus.get(Math.floor((dis - 1) / 10) * 10 + 1) || null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9mcmVxdWVuY3lkaXN0cmlidXRpb24vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQge3R5cGUgUm93RGF0YSwgdHlwZSBTZXR1cFRhYmxlT3B0aW9ucywgc2V0dXBUYWJsZX0gZnJvbSBcIkBub2RlZi9leHRyYS1zcWxcIjtcblxuXG5cblxuLy8jcmVnaW9uIFRZUEVTXG4vKiogRnJlcXVlbmN5IG9mIFN0YXRlcy9VVHMgZm9yIGZpeGluZyB0aGUgbnVtYmVyIG9mIGRpc3RyaWN0cyB0byBiZSBzYW1wbGVkLiAqL1xuZXhwb3J0IGludGVyZmFjZSBGcmVxdWVuY3kge1xuICAvKiogTm8uIG9mIERpc3RyaWN0cy4gKi9cbiAgZGlzdHJpY3RzOiBzdHJpbmcsXG4gIC8qKiBOby4gb2YgU3RhdGVzL1VUcy4gKi9cbiAgc3RhdGVzOiBudW1iZXIsXG4gIC8qKiBOby4gb2YgZGlzdHJpY3RzIHRvIGJlIHNlbGVjdGVkIGZyb20gZWFjaCBTdGF0ZS9VVC4gKi9cbiAgc2VsZWN0ZWQ6IG51bWJlcixcbiAgLyoqIFRvdGFsIE5vLiBvZiBkaXN0cmljdHMgdG8gYmUgc2FtcGxlZC4gKi9cbiAgc2FtcGxlZDogbnVtYmVyXG59O1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8bnVtYmVyLCBGcmVxdWVuY3k+IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBMb2FkIHRoZSBmcmVxdWVuY3kgZGlzdHJpYnV0aW9uIGNvcnB1cyBmcm9tIENTViBmaWxlLlxuICogQHBhcmFtIGZpbGUgQ1NWIGZpbGUgcGF0aFxuICogQHJldHVybnMgZnJlcXVlbmN5IGRpc3RyaWJ1dGlvbiBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPG51bWJlciwgRnJlcXVlbmN5PigpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgKGF3YWl0IGZldGNoKGZpbGUpKS50ZXh0KCk7XG4gIGNvbnN0IHJlY29yZHMgPSBjc3YucGFyc2UoZGF0YSwge3NraXBGaXJzdFJvdzogdHJ1ZSwgY29tbWVudDogXCIjXCJ9KTtcbiAgZm9yIChjb25zdCByIG9mIHJlY29yZHMpIHtcbiAgICBjb25zdCBzdGF0ZXMgICA9IHBhcnNlRmxvYXQoci5zdGF0ZXMpO1xuICAgIGNvbnN0IHNlbGVjdGVkID0gcGFyc2VGbG9hdChyLnNlbGVjdGVkKTtcbiAgICBjb25zdCBzYW1wbGVkICA9IHBhcnNlRmxvYXQoci5zYW1wbGVkKTtcbiAgICBjb25zdCBrZXkgPSBwYXJzZUZsb2F0KHIuZGlzdHJpY3RzLnNwbGl0KCctJylbMF0ucmVwbGFjZSgvXFxEL2csICcnKSk7XG4gICAgbWFwLnNldChrZXk9PT03MD8gNzEgOiBrZXksIHtkaXN0cmljdHM6IHIuZGlzdHJpY3RzLCBzdGF0ZXMsIHNlbGVjdGVkLCBzYW1wbGVkfSk7XG4gIH1cbiAgcmV0dXJuIG1hcDtcbn1cblxuXG4vKipcbiAqIExvYWQgdGhlIGZyZXF1ZW5jeSBkaXN0cmlidXRpb24gY29ycHVzIGZyb20gdGhlIGZpbGUuXG4gKiBAcmV0dXJucyBmcmVxdWVuY3kgZGlzdHJpYnV0aW9uIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEZyZXF1ZW5jeURpc3RyaWJ1dGlvbigpOiBQcm9taXNlPE1hcDxudW1iZXIsIEZyZXF1ZW5jeT4+IHtcbiAgaWYgKGNvcnB1cykgcmV0dXJuIGNvcnB1cztcbiAgY29ycHVzID0gYXdhaXQgbG9hZEZyb21Dc3YoZnJlcXVlbmN5RGlzdHJpYnV0aW9uQ3N2KCkpO1xuICByZXR1cm4gY29ycHVzO1xufVxuXG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIHRvIHRoZSBmcmVxdWVuY3kgZGlzdHJpYnV0aW9uIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcmVxdWVuY3lEaXN0cmlidXRpb25Dc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgZnJlcXVlbmN5IGRpc3RyaWJ1dGlvbiB0YWJsZS5cbiAqIEBwYXJhbSB0YWIgdGFibGUgbmFtZVxuICogQHBhcmFtIG9wdCBvcHRpb25zIGZvciB0aGUgdGFibGVcbiAqIEByZXR1cm5zIENSRUFURSBUQUJMRSwgSU5TRVJULCBDUkVBVEUgVklFVywgQ1JFQVRFIElOREVYIHN0YXRlbWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZyZXF1ZW5jeURpc3RyaWJ1dGlvblNxbCh0YWI6IHN0cmluZz1cImZyZXF1ZW5jeWRpc3RyaWJ1dGlvblwiLCBvcHQ6IFNldHVwVGFibGVPcHRpb25zPXt9KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIHNldHVwVGFibGUodGFiLCB7ZGlzdHJpY3RzOiBcIlRFWFRcIiwgc3RhdGVzOiBcIklOVFwiLCBzZWxlY3RlZDogXCJJTlRcIiwgc2FtcGxlZDogXCJJTlRcIn0sXG4gICAgKGF3YWl0IGxvYWRGcmVxdWVuY3lEaXN0cmlidXRpb24oKSkudmFsdWVzKCkgYXMgSXRlcmFibGU8Um93RGF0YT4sXG4gICAgT2JqZWN0LmFzc2lnbih7cGs6IFwiZGlzdHJpY3RzXCIsIGluZGV4OiB0cnVlLCB0c3ZlY3Rvcjoge2Rpc3RyaWN0czogXCJBXCJ9fSwgb3B0KSk7XG59XG5cblxuLyoqXG4gKiBGaW5kIG1hdGNoaW5nIGZyZXF1ZW5jeSBkaXN0cmlidXRpb24gZm9yIGEgZ2l2ZW4gbm8uIG9mIGRpc3RyaWN0cy5cbiAqIEBwYXJhbSBkaXMgbm8uIG9mIGRpc3RyaWN0c1xuICogQHJldHVybnMgYHtkaXN0cmljdHMsIHN0YXRlcywgc2VsZWN0ZWQsIHNhbXBsZWR9YCBpZiBmb3VuZCwgZWxzZSBudWxsXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuZnJlcXVlbmN5RGlzdHJpYnV0aW9uKDIpO1xuICogaWZjdDIwMTcuZnJlcXVlbmN5RGlzdHJpYnV0aW9uKDUpO1xuICogLy8g4oaSIHsgZGlzdHJpY3RzOiAnMS01Jywgc3RhdGVzOiA5LCBzZWxlY3RlZDogMSwgc2FtcGxlZDogOSB9XG4gKlxuICogaWZjdDIwMTcuZnJlcXVlbmN5RGlzdHJpYnV0aW9uKDMyKTtcbiAqIGlmY3QyMDE3LmZyZXF1ZW5jeURpc3RyaWJ1dGlvbigzNyk7XG4gKiAvLyDihpIgeyBkaXN0cmljdHM6ICczMS00MCcsIHN0YXRlczogNCwgc2VsZWN0ZWQ6IDUsIHNhbXBsZWQ6IDIwIH1cbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJlcXVlbmN5RGlzdHJpYnV0aW9uKGRpczogbnVtYmVyKTogRnJlcXVlbmN5IHwgbnVsbCB7XG4gIGlmIChjb3JwdXMgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGlmIChkaXMgPD0gNSkgIHJldHVybiBjb3JwdXMuZ2V0KDEpICB8fCBudWxsO1xuICBpZiAoZGlzIDw9IDEwKSByZXR1cm4gY29ycHVzLmdldCg2KSAgfHwgbnVsbDtcbiAgaWYgKGRpcyA+IDcwKSAgcmV0dXJuIGNvcnB1cy5nZXQoNzEpIHx8IG51bGw7XG4gIHJldHVybiBjb3JwdXMuZ2V0KE1hdGguZmxvb3IoKGRpcy0xKS8xMCkqMTAgKyAxKSB8fCBudWxsO1xufVxuLy8jZW5kcmVnaW9uXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBQ3RDLDZDQUE2QztBQUM3Qyw2QkFBNkI7QUFDN0IsWUFBWSxTQUFVLFdBQVc7QUFDakMsU0FBOEMsVUFBVSxRQUFPLG1CQUFtQjtBQWlCbEYsWUFBWTtBQUtaLGlCQUFpQjtBQUNqQixJQUFJLFNBQXdDO0FBQzVDLFlBQVk7QUFLWixtQkFBbUI7QUFDbkI7Ozs7Q0FJQyxHQUNELGVBQWUsWUFBWSxJQUFZO0VBQ3JDLE1BQU0sTUFBTyxJQUFJO0VBQ2pCLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQzNDLE1BQU0sVUFBVSxJQUFJLEtBQUssQ0FBQyxNQUFNO0lBQUMsY0FBYztJQUFNLFNBQVM7RUFBRztFQUNqRSxLQUFLLE1BQU0sS0FBSyxRQUFTO0lBQ3ZCLE1BQU0sU0FBVyxXQUFXLEVBQUUsTUFBTTtJQUNwQyxNQUFNLFdBQVcsV0FBVyxFQUFFLFFBQVE7SUFDdEMsTUFBTSxVQUFXLFdBQVcsRUFBRSxPQUFPO0lBQ3JDLE1BQU0sTUFBTSxXQUFXLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPO0lBQ2hFLElBQUksR0FBRyxDQUFDLFFBQU0sS0FBSSxLQUFLLEtBQUs7TUFBQyxXQUFXLEVBQUUsU0FBUztNQUFFO01BQVE7TUFBVTtJQUFPO0VBQ2hGO0VBQ0EsT0FBTztBQUNUO0FBR0E7OztDQUdDLEdBQ0QsT0FBTyxlQUFlO0VBQ3BCLElBQUksUUFBUSxPQUFPO0VBQ25CLFNBQVMsTUFBTSxZQUFZO0VBQzNCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSx5QkFBeUIsTUFBWSx1QkFBdUIsRUFBRSxNQUF1QixDQUFDLENBQUM7RUFDM0csT0FBTyxXQUFXLEtBQUs7SUFBQyxXQUFXO0lBQVEsUUFBUTtJQUFPLFVBQVU7SUFBTyxTQUFTO0VBQUssR0FDdkYsQ0FBQyxNQUFNLDJCQUEyQixFQUFFLE1BQU0sSUFDMUMsT0FBTyxNQUFNLENBQUM7SUFBQyxJQUFJO0lBQWEsT0FBTztJQUFNLFVBQVU7TUFBQyxXQUFXO0lBQUc7RUFBQyxHQUFHO0FBQzlFO0FBR0E7Ozs7Ozs7Ozs7Ozs7O0NBY0MsR0FDRCxPQUFPLFNBQVMsc0JBQXNCLEdBQVc7RUFDL0MsSUFBSSxVQUFVLE1BQU0sT0FBTztFQUMzQixJQUFJLE9BQU8sR0FBSSxPQUFPLE9BQU8sR0FBRyxDQUFDLE1BQU87RUFDeEMsSUFBSSxPQUFPLElBQUksT0FBTyxPQUFPLEdBQUcsQ0FBQyxNQUFPO0VBQ3hDLElBQUksTUFBTSxJQUFLLE9BQU8sT0FBTyxHQUFHLENBQUMsT0FBTztFQUN4QyxPQUFPLE9BQU8sR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsTUFBSSxDQUFDLElBQUUsTUFBSSxLQUFLLE1BQU07QUFDdEQsRUFDQSxZQUFZIn0=