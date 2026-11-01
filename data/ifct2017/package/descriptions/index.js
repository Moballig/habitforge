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
 * Load the descriptions corpus from CSV file.
 * @param file CSV file path
 * @returns descriptions corpus
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
 * Setup the lunr index for the descriptions corpus.
 * @returns lunr index
 */ function setupIndex(corpus) {
  return lunr(function() {
    this.ref('code');
    this.field('code');
    this.field('name');
    this.field('scie');
    this.field('grup');
    this.field('desc');
    for (const r of corpus.values()){
      let { code, name, scie, grup, desc } = r;
      name = name.replace(/^(\w+),/g, '$1 $1 $1 $1,');
      desc = desc.replace(/\[.*?\]/g, '').replace(/\w+\.\s([\w\',\/\(\)\- ]+)[;\.]?/g, '$1');
      desc = desc.replace(/[,\/\(\)\- ]+/g, ' ').trim();
      this.add({
        code,
        name,
        scie,
        grup,
        desc
      });
    }
  });
}
/**
 * Load the descriptions corpus from the file.
 * @returns descriptions corpus
 */ export async function loadDescriptions() {
  if (corpus) return corpus;
  corpus = await loadFromCsv(descriptionsCsv());
  index = setupIndex(corpus);
  return corpus;
}
/**
 * Get the path to the descriptions CSV file.
 * @returns CSV file URL
 */ export function descriptionsCsv() {
  return import.meta.resolve('./index.csv');
}
/**
 * Obtain SQL command to create and populate the descriptions table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export async function descriptionsSql(tab = "descriptions", opt = {}) {
  return setupTable(tab, {
    code: "TEXT",
    name: "TEXT",
    scie: "TEXT",
    grup: "TEXT",
    desc: "TEXT"
  }, (await loadDescriptions()).values(), Object.assign({
    pk: "code",
    index: true,
    tsvector: {
      code: "A",
      name: "B",
      scie: "B",
      grup: "C",
      desc: "B"
    }
  }, opt));
}
/**
 * Find matching descriptions of an code/name/scie/desc query.
 * @param txt code/name/scie/desc query
 * @returns matches `[{code, name, scie, grup, desc}]`
 * @example
 * ```javascript
 * ifct2017.descriptions('pineapple');
 * ifct2017.descriptions('ananas comosus');
 * // → [ { code: 'E053',
 * // →     name: 'Pineapple',
 * // →     scie: 'Ananas comosus',
 * // →     grup: 'Fruits',
 * // →     desc: 'A. Ahnaros; B. Anarasa; G. Anenas; H. Ananas; Kan. Ananas; Kash. Punchitipul; Kh. Soh trun; Kon. Anas; Mal. Kayirha chakka; M. Kihom Ananas; O. Sapuri; P. Ananas; Tam. Annasi pazham; Tel. Anasa pandu; U. Ananas.' } ]
 *
 * ifct2017.descriptions('tell me about cow milk.');
 * ifct2017.descriptions('gai ka doodh details.');
 * // → [ { code: 'L002',
 * // →     name: 'Milk, Cow',
 * // →     scie: '',
 * // →     grup: 'Milk and Milk Products',
 * // →     desc: 'A. Garoor gakhir; B. Doodh (garu); G. Gai nu dhudh; H. Gai ka doodh; Kan. Hasuvina halu; Kash. Doodh; Kh. Dud masi; M. San Sanghom; Mar. Doodh (gay); O. Gai dudha; P. Gaan da doodh; S. Gow kshiram; Tam. Pasumpaal; Tel. Aavu paalu.' } ]
 * ```
 */ export function descriptions(txt) {
  if (index == null) return [];
  const a = [];
  txt = txt.replace(/\W/g, ' ');
  const mats = index.search(txt);
  let max = 0;
  for (const mat of mats)max = Math.max(max, Object.keys(mat.matchData.metadata).length);
  for (const mat of mats)if (Object.keys(mat.matchData.metadata).length === max) a.push(corpus?.get(mat.ref) || {});
  return a;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9kZXNjcmlwdGlvbnMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChDKSAyMDI1LTI2IFN1Ymhhaml0IFNhaHVcbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuLy8gU2VlIExJQ0VOU0UgZm9yIGZ1bGwgdGVybXNcbmltcG9ydCAqIGFzIGNzdiAgZnJvbSBcIkBzdGQvY3N2XCI7XG5pbXBvcnQgbHVuciBmcm9tIFwibHVuclwiOyAgLy8gQGRlbm8tdHlwZXM9XCJucG06QHR5cGVzL2x1bnJAMi4zLjdcIlxuaW1wb3J0IHt0eXBlIFJvd0RhdGEsIHR5cGUgU2V0dXBUYWJsZU9wdGlvbnMsIHNldHVwVGFibGV9IGZyb20gXCJAbm9kZWYvZXh0cmEtc3FsXCI7XG5cblxuXG5cbi8vI3JlZ2lvbiBUWVBFU1xuLyoqIE5hbWUgb2YgZm9vZCBpbiBsb2NhbCBsYW5ndWFnZXMsIGluY2x1ZGluZyBzY2llbnRpZmljIG5hbWUuICovXG5leHBvcnQgaW50ZXJmYWNlIERlc2NyaXB0aW9uIHtcbiAgLyoqIEZvb2QgQ29kZS4gKi9cbiAgY29kZTogc3RyaW5nLFxuICAvKiogRm9vZCBOYW1lLiAqL1xuICBuYW1lOiBzdHJpbmcsXG4gIC8qKiBTY2llbnRpZmljIE5hbWUuICovXG4gIHNjaWU6IHN0cmluZyxcbiAgLyoqIEZvb2QgR3JvdXAuICovXG4gIGdydXA6IHN0cmluZyxcbiAgLyoqIERlc2NyaXB0aW9uIChsb2NhbCBuYW1lcykuICovXG4gIGRlc2M6IHN0cmluZ1xufTtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gR0xPQkFMU1xubGV0IGNvcnB1czogTWFwPHN0cmluZywgRGVzY3JpcHRpb24+IHwgbnVsbCA9IG51bGw7XG5sZXQgaW5kZXg6IGx1bnIuSW5kZXggfCBudWxsID0gbnVsbDtcbi8vI2VuZHJlZ2lvblxuXG5cblxuXG4vLyNyZWdpb24gRlVOQ1RJT05TXG4vKipcbiAqIExvYWQgdGhlIGRlc2NyaXB0aW9ucyBjb3JwdXMgZnJvbSBDU1YgZmlsZS5cbiAqIEBwYXJhbSBmaWxlIENTViBmaWxlIHBhdGhcbiAqIEByZXR1cm5zIGRlc2NyaXB0aW9ucyBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZyb21Dc3YoZmlsZTogc3RyaW5nKSB7XG4gIGNvbnN0IG1hcCAgPSBuZXcgTWFwPHN0cmluZywgRGVzY3JpcHRpb24+KCk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTtcbiAgY29uc3QgcmVjb3JkcyA9IGNzdi5wYXJzZShkYXRhLCB7c2tpcEZpcnN0Um93OiB0cnVlLCBjb21tZW50OiBcIiNcIn0pO1xuICBmb3IgKGNvbnN0IHIgb2YgcmVjb3JkcylcbiAgICBtYXAuc2V0KHIuY29kZSwgciBhcyB1bmtub3duIGFzIERlc2NyaXB0aW9uKTtcbiAgcmV0dXJuIG1hcDtcbn1cblxuXG4vKipcbiAqIFNldHVwIHRoZSBsdW5yIGluZGV4IGZvciB0aGUgZGVzY3JpcHRpb25zIGNvcnB1cy5cbiAqIEByZXR1cm5zIGx1bnIgaW5kZXhcbiAqL1xuZnVuY3Rpb24gc2V0dXBJbmRleChjb3JwdXM6IE1hcDxzdHJpbmcsIERlc2NyaXB0aW9uPikge1xuICByZXR1cm4gbHVucihmdW5jdGlvbih0aGlzOiBsdW5yLkJ1aWxkZXIpIHtcbiAgICB0aGlzLnJlZignY29kZScpO1xuICAgIHRoaXMuZmllbGQoJ2NvZGUnKTtcbiAgICB0aGlzLmZpZWxkKCduYW1lJyk7XG4gICAgdGhpcy5maWVsZCgnc2NpZScpO1xuICAgIHRoaXMuZmllbGQoJ2dydXAnKTtcbiAgICB0aGlzLmZpZWxkKCdkZXNjJyk7XG4gICAgZm9yIChjb25zdCByIG9mIGNvcnB1cy52YWx1ZXMoKSkge1xuICAgICAgbGV0IHtjb2RlLCBuYW1lLCBzY2llLCBncnVwLCBkZXNjfSA9IHI7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9eKFxcdyspLC9nLCAnJDEgJDEgJDEgJDEsJyk7XG4gICAgICBkZXNjID0gZGVzYy5yZXBsYWNlKC9cXFsuKj9cXF0vZywgJycpLnJlcGxhY2UoL1xcdytcXC5cXHMoW1xcd1xcJyxcXC9cXChcXClcXC0gXSspWztcXC5dPy9nLCAnJDEnKTtcbiAgICAgIGRlc2MgPSBkZXNjLnJlcGxhY2UoL1ssXFwvXFwoXFwpXFwtIF0rL2csICcgJykudHJpbSgpO1xuICAgICAgdGhpcy5hZGQoe2NvZGUsIG5hbWUsIHNjaWUsIGdydXAsIGRlc2N9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgZGVzY3JpcHRpb25zIGNvcnB1cyBmcm9tIHRoZSBmaWxlLlxuICogQHJldHVybnMgZGVzY3JpcHRpb25zIGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZERlc2NyaXB0aW9ucygpOiBQcm9taXNlPE1hcDxzdHJpbmcsIERlc2NyaXB0aW9uPj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb3JwdXMgPSBhd2FpdCBsb2FkRnJvbUNzdihkZXNjcmlwdGlvbnNDc3YoKSk7XG4gIGluZGV4ICA9IHNldHVwSW5kZXgoY29ycHVzKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCB0byB0aGUgZGVzY3JpcHRpb25zIENTViBmaWxlLlxuICogQHJldHVybnMgQ1NWIGZpbGUgVVJMXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmlwdGlvbnNDc3YoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXguY3N2Jyk7XG59XG5cblxuLyoqXG4gKiBPYnRhaW4gU1FMIGNvbW1hbmQgdG8gY3JlYXRlIGFuZCBwb3B1bGF0ZSB0aGUgZGVzY3JpcHRpb25zIHRhYmxlLlxuICogQHBhcmFtIHRhYiB0YWJsZSBuYW1lXG4gKiBAcGFyYW0gb3B0IG9wdGlvbnMgZm9yIHRoZSB0YWJsZVxuICogQHJldHVybnMgQ1JFQVRFIFRBQkxFLCBJTlNFUlQsIENSRUFURSBWSUVXLCBDUkVBVEUgSU5ERVggc3RhdGVtZW50c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVzY3JpcHRpb25zU3FsKHRhYjogc3RyaW5nPVwiZGVzY3JpcHRpb25zXCIsIG9wdDogU2V0dXBUYWJsZU9wdGlvbnM9e30pOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gc2V0dXBUYWJsZSh0YWIsIHtjb2RlOiBcIlRFWFRcIiwgbmFtZTogXCJURVhUXCIsIHNjaWU6IFwiVEVYVFwiLCBncnVwOiBcIlRFWFRcIiwgZGVzYzogXCJURVhUXCJ9LFxuICAgIChhd2FpdCBsb2FkRGVzY3JpcHRpb25zKCkpLnZhbHVlcygpIGFzIEl0ZXJhYmxlPFJvd0RhdGE+LFxuICAgIE9iamVjdC5hc3NpZ24oe3BrOiBcImNvZGVcIiwgaW5kZXg6IHRydWUsIHRzdmVjdG9yOiB7Y29kZTogXCJBXCIsIG5hbWU6IFwiQlwiLCBzY2llOiBcIkJcIiwgZ3J1cDogXCJDXCIsIGRlc2M6IFwiQlwifX0sIG9wdCkpO1xufVxuXG5cbi8qKlxuICogRmluZCBtYXRjaGluZyBkZXNjcmlwdGlvbnMgb2YgYW4gY29kZS9uYW1lL3NjaWUvZGVzYyBxdWVyeS5cbiAqIEBwYXJhbSB0eHQgY29kZS9uYW1lL3NjaWUvZGVzYyBxdWVyeVxuICogQHJldHVybnMgbWF0Y2hlcyBgW3tjb2RlLCBuYW1lLCBzY2llLCBncnVwLCBkZXNjfV1gXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaWZjdDIwMTcuZGVzY3JpcHRpb25zKCdwaW5lYXBwbGUnKTtcbiAqIGlmY3QyMDE3LmRlc2NyaXB0aW9ucygnYW5hbmFzIGNvbW9zdXMnKTtcbiAqIC8vIOKGkiBbIHsgY29kZTogJ0UwNTMnLFxuICogLy8g4oaSICAgICBuYW1lOiAnUGluZWFwcGxlJyxcbiAqIC8vIOKGkiAgICAgc2NpZTogJ0FuYW5hcyBjb21vc3VzJyxcbiAqIC8vIOKGkiAgICAgZ3J1cDogJ0ZydWl0cycsXG4gKiAvLyDihpIgICAgIGRlc2M6ICdBLiBBaG5hcm9zOyBCLiBBbmFyYXNhOyBHLiBBbmVuYXM7IEguIEFuYW5hczsgS2FuLiBBbmFuYXM7IEthc2guIFB1bmNoaXRpcHVsOyBLaC4gU29oIHRydW47IEtvbi4gQW5hczsgTWFsLiBLYXlpcmhhIGNoYWtrYTsgTS4gS2lob20gQW5hbmFzOyBPLiBTYXB1cmk7IFAuIEFuYW5hczsgVGFtLiBBbm5hc2kgcGF6aGFtOyBUZWwuIEFuYXNhIHBhbmR1OyBVLiBBbmFuYXMuJyB9IF1cbiAqXG4gKiBpZmN0MjAxNy5kZXNjcmlwdGlvbnMoJ3RlbGwgbWUgYWJvdXQgY293IG1pbGsuJyk7XG4gKiBpZmN0MjAxNy5kZXNjcmlwdGlvbnMoJ2dhaSBrYSBkb29kaCBkZXRhaWxzLicpO1xuICogLy8g4oaSIFsgeyBjb2RlOiAnTDAwMicsXG4gKiAvLyDihpIgICAgIG5hbWU6ICdNaWxrLCBDb3cnLFxuICogLy8g4oaSICAgICBzY2llOiAnJyxcbiAqIC8vIOKGkiAgICAgZ3J1cDogJ01pbGsgYW5kIE1pbGsgUHJvZHVjdHMnLFxuICogLy8g4oaSICAgICBkZXNjOiAnQS4gR2Fyb29yIGdha2hpcjsgQi4gRG9vZGggKGdhcnUpOyBHLiBHYWkgbnUgZGh1ZGg7IEguIEdhaSBrYSBkb29kaDsgS2FuLiBIYXN1dmluYSBoYWx1OyBLYXNoLiBEb29kaDsgS2guIER1ZCBtYXNpOyBNLiBTYW4gU2FuZ2hvbTsgTWFyLiBEb29kaCAoZ2F5KTsgTy4gR2FpIGR1ZGhhOyBQLiBHYWFuIGRhIGRvb2RoOyBTLiBHb3cga3NoaXJhbTsgVGFtLiBQYXN1bXBhYWw7IFRlbC4gQWF2dSBwYWFsdS4nIH0gXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmlwdGlvbnModHh0OiBzdHJpbmcpOiBEZXNjcmlwdGlvbltdIHtcbiAgaWYgKGluZGV4ID09IG51bGwpIHJldHVybiBbXTtcbiAgY29uc3QgYTogRGVzY3JpcHRpb25bXSA9IFtdOyB0eHQgPSB0eHQucmVwbGFjZSgvXFxXL2csICcgJyk7XG4gIGNvbnN0IG1hdHMgPSBpbmRleC5zZWFyY2godHh0KTsgbGV0IG1heCA9IDA7XG4gIGZvciAoY29uc3QgbWF0IG9mIG1hdHMpXG4gICAgbWF4ID0gTWF0aC5tYXgobWF4LCBPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGgpO1xuICBmb3IgKGNvbnN0IG1hdCBvZiBtYXRzKVxuICAgIGlmIChPYmplY3Qua2V5cyhtYXQubWF0Y2hEYXRhLm1ldGFkYXRhKS5sZW5ndGggPT09IG1heCkgYS5wdXNoKGNvcnB1cz8uZ2V0KG1hdC5yZWYpIHx8IHt9IGFzIERlc2NyaXB0aW9uKTtcbiAgcmV0dXJuIGE7XG59XG4vLyNlbmRyZWdpb25cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxzQ0FBc0M7QUFDdEMsNkNBQTZDO0FBQzdDLDZCQUE2QjtBQUM3QixZQUFZLFNBQVUsV0FBVztBQUNqQyxPQUFPLFVBQVUsT0FBTyxDQUFFLHNDQUFzQztBQUNoRSxTQUE4QyxVQUFVLFFBQU8sbUJBQW1CO0FBbUJsRixZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBMEM7QUFDOUMsSUFBSSxRQUEyQjtBQUMvQixZQUFZO0FBS1osbUJBQW1CO0FBQ25COzs7O0NBSUMsR0FDRCxlQUFlLFlBQVksSUFBWTtFQUNyQyxNQUFNLE1BQU8sSUFBSTtFQUNqQixNQUFNLE9BQU8sTUFBTSxDQUFDLE1BQU0sTUFBTSxLQUFLLEVBQUUsSUFBSTtFQUMzQyxNQUFNLFVBQVUsSUFBSSxLQUFLLENBQUMsTUFBTTtJQUFDLGNBQWM7SUFBTSxTQUFTO0VBQUc7RUFDakUsS0FBSyxNQUFNLEtBQUssUUFDZCxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRTtFQUNsQixPQUFPO0FBQ1Q7QUFHQTs7O0NBR0MsR0FDRCxTQUFTLFdBQVcsTUFBZ0M7RUFDbEQsT0FBTyxLQUFLO0lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNULElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNYLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ1gsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEdBQUk7TUFDL0IsSUFBSSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsR0FBRztNQUNyQyxPQUFPLEtBQUssT0FBTyxDQUFDLFlBQVk7TUFDaEMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDLHFDQUFxQztNQUNqRixPQUFPLEtBQUssT0FBTyxDQUFDLGtCQUFrQixLQUFLLElBQUk7TUFDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUFDO1FBQU07UUFBTTtRQUFNO1FBQU07TUFBSTtJQUN4QztFQUNGO0FBQ0Y7QUFHQTs7O0NBR0MsR0FDRCxPQUFPLGVBQWU7RUFDcEIsSUFBSSxRQUFRLE9BQU87RUFDbkIsU0FBUyxNQUFNLFlBQVk7RUFDM0IsUUFBUyxXQUFXO0VBQ3BCLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sU0FBUztFQUNkLE9BQU8sWUFBWSxPQUFPLENBQUM7QUFDN0I7QUFHQTs7Ozs7Q0FLQyxHQUNELE9BQU8sZUFBZSxnQkFBZ0IsTUFBWSxjQUFjLEVBQUUsTUFBdUIsQ0FBQyxDQUFDO0VBQ3pGLE9BQU8sV0FBVyxLQUFLO0lBQUMsTUFBTTtJQUFRLE1BQU07SUFBUSxNQUFNO0lBQVEsTUFBTTtJQUFRLE1BQU07RUFBTSxHQUMxRixDQUFDLE1BQU0sa0JBQWtCLEVBQUUsTUFBTSxJQUNqQyxPQUFPLE1BQU0sQ0FBQztJQUFDLElBQUk7SUFBUSxPQUFPO0lBQU0sVUFBVTtNQUFDLE1BQU07TUFBSyxNQUFNO01BQUssTUFBTTtNQUFLLE1BQU07TUFBSyxNQUFNO0lBQUc7RUFBQyxHQUFHO0FBQ2hIO0FBR0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzQkMsR0FDRCxPQUFPLFNBQVMsYUFBYSxHQUFXO0VBQ3RDLElBQUksU0FBUyxNQUFNLE9BQU8sRUFBRTtFQUM1QixNQUFNLElBQW1CLEVBQUU7RUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU87RUFDdEQsTUFBTSxPQUFPLE1BQU0sTUFBTSxDQUFDO0VBQU0sSUFBSSxNQUFNO0VBQzFDLEtBQUssTUFBTSxPQUFPLEtBQ2hCLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTTtFQUNoRSxLQUFLLE1BQU0sT0FBTyxLQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxNQUFNLEtBQUssS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztFQUMxRixPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=