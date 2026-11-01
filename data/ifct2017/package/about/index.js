// Copyright (C) 2025-26 Subhajit Sahu
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms
//#region CONSTANTS
const REGEX = {
  '1937': /193\d|194\d/i,
  '1951': /195\d/i,
  '1963': /196\d/i,
  '1971': /197\d/i,
  '1989': /198\d|199\d/i,
  '2017': /200\d|201\d/i,
  father: /(father)/i,
  challenge: /challeng|difficult|inconsistent|fragment|exhaust/i,
  interest: /interest|bioactive|first/i,
  limitation: /limitation|exact/i,
  learn: /learn|underst|more/i,
  funder: /fund|financ|money|contribut|donat|pay|paid/i,
  when: /when|date|day|month|year|last/i,
  why: /why|cause|reason/i,
  publisher: /publish|issu|creat|wr(i|o)t|ma(k|de)|develop|produc|print|announc|report|declar|distribut|spread|disseminat|circulat/i,
  credit: /credit|acknowledg/i,
  supporter: /support|back|help/i,
  source: /source|from|origin|take|derive|borrow|obtain/i,
  data: /data|info/i,
  form: /form|shape|appear|configur|structure|dispos/i,
  group: /type|group|category|class|sort|kind|variety|collection|cluster/i,
  column: /column|component|part|piece|bit|constituent|element|ingredient|unit|module|item|section|portion/i,
  what: /what|about/i
};
const USER = /user|utilizer|applier/i;
const USE = /use|using|utiliz|employ|appl/i;
const WHO = /who|person|people|member/i;
//#endregion
//#region GLOBALS
let corpus = null;
//#endregion
//#region FUNCTIONS
/**
 * Read the index file and return the about details.
 * @returns about corpus
 */ async function readIndex() {
  const map = new Map();
  const file = import.meta.resolve('./index.txt');
  const data = await (await fetch(file)).text();
  let m = null;
  const re = /\[\[(\w+)\]\]\n([\w\W]*?)\n\n\n/g;
  while((m = re.exec(data)) != null){
    const k = m[1], v = m[2].trim();
    map.set(k, v);
  }
  return map;
}
/**
 * Load the about corpus from file.
 * @returns about corpus
 */ export async function loadAbout() {
  if (corpus) return corpus;
  corpus = await readIndex();
  return corpus;
}
/**
 * Find matching description of an about query.
 * @param txt about query
 * @returns if found, returns the description, else null
 * @example
 * ```javascript
 * about('who is you publisher');
 * about('which organization issued you');
 * // → Indian Food Composition Tables 2017 was published by:
 * // → T. Longvah, R. Ananthan, K. Bhaskarachary and K. Venkaiah
 * // → National Institute of Nutrition
 * // → Indian Council of Medical Research
 * // → Department of Health Research
 * // → Ministry of Health and Family Welfare, Government of India
 * // → Jamai Osmania (PO), Hyderabad – 500 007
 * // → Telangana, India
 * // → Phone: +91 40 27197334, Fax: +91 40 27000339, Email: nin@ap.nic.in
 *
 * about('can i know the food groups');
 * about('i want to know what types of food are there');
 * // → There are 20 food groups:
 * // → - A: Cereals and Millets. 24 foods.
 * // → - B: Grain Legumes. 25 foods.
 * // → - C: Green Leafy Vegetables. 34 foods.
 * // → - D: Other Vegetables. 78 foods.
 * // → - E: Fruits. 68 foods.
 * // → - F: Roots and Tubers. 19 foods.
 * // → - G: Condiments and Spices. 33 foods.
 * // → - H: Nuts and Oil Seeds. 21 foods.
 * // → - I: Sugars. 2 foods.
 * // → - J: Mushrooms. 4 foods.
 * // → - K: Miscellaneous Foods. 2 foods.
 * // → - L: Milk and Milk Products. 4 foods.
 * // → - M: Egg and Egg Products. 15 foods.
 * // → - N: Poultry. 19 foods.
 * // → - O: Animal Meat. 63 foods.
 * // → - P: Marine Fish. 92 foods.
 * // → - Q; Marine Shellfish. 8 foods.
 * // → - R: Marine Mollusks. 7 foods.
 * // → - S: Fresh Water Fish and Shellfish. 10 foods.
 * // → - T: Edible Oils and Fats. 9 foods.
 * ```
 */ export function about(txt) {
  const re = REGEX;
  if (USER.test(txt) || USE.test(txt) && WHO.test(txt)) return corpus?.get('user');
  if (USE.test(txt)) return corpus?.get('use');
  for(const k in re)if (re[k].test(txt)) return corpus?.get(k);
  return null;
} //#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9pZmN0MjAxNy9pZmN0MjAxNy9hYm91dC9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKEMpIDIwMjUtMjYgU3ViaGFqaXQgU2FodVxuLy8gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4vLyBTZWUgTElDRU5TRSBmb3IgZnVsbCB0ZXJtc1xuLy8jcmVnaW9uIENPTlNUQU5UU1xuY29uc3QgUkVHRVg6IHtbdG9waWM6IHN0cmluZ106IFJlZ0V4cH0gPSB7XG4gICcxOTM3JzogLzE5M1xcZHwxOTRcXGQvaSxcbiAgJzE5NTEnOiAvMTk1XFxkL2ksXG4gICcxOTYzJzogLzE5NlxcZC9pLFxuICAnMTk3MSc6IC8xOTdcXGQvaSxcbiAgJzE5ODknOiAvMTk4XFxkfDE5OVxcZC9pLFxuICAnMjAxNyc6IC8yMDBcXGR8MjAxXFxkL2ksXG4gIGZhdGhlcjogICAgIC8oZmF0aGVyKS9pLFxuICBjaGFsbGVuZ2U6ICAvY2hhbGxlbmd8ZGlmZmljdWx0fGluY29uc2lzdGVudHxmcmFnbWVudHxleGhhdXN0L2ksXG4gIGludGVyZXN0OiAgIC9pbnRlcmVzdHxiaW9hY3RpdmV8Zmlyc3QvaSxcbiAgbGltaXRhdGlvbjogL2xpbWl0YXRpb258ZXhhY3QvaSxcbiAgbGVhcm46ICAvbGVhcm58dW5kZXJzdHxtb3JlL2ksXG4gIGZ1bmRlcjogL2Z1bmR8ZmluYW5jfG1vbmV5fGNvbnRyaWJ1dHxkb25hdHxwYXl8cGFpZC9pLFxuICB3aGVuOiAgIC93aGVufGRhdGV8ZGF5fG1vbnRofHllYXJ8bGFzdC9pLFxuICB3aHk6ICAgIC93aHl8Y2F1c2V8cmVhc29uL2ksXG4gIHB1Ymxpc2hlcjogL3B1Ymxpc2h8aXNzdXxjcmVhdHx3cihpfG8pdHxtYShrfGRlKXxkZXZlbG9wfHByb2R1Y3xwcmludHxhbm5vdW5jfHJlcG9ydHxkZWNsYXJ8ZGlzdHJpYnV0fHNwcmVhZHxkaXNzZW1pbmF0fGNpcmN1bGF0L2ksXG4gIGNyZWRpdDogICAgL2NyZWRpdHxhY2tub3dsZWRnL2ksXG4gIHN1cHBvcnRlcjogL3N1cHBvcnR8YmFja3xoZWxwL2ksXG4gIHNvdXJjZTogICAgL3NvdXJjZXxmcm9tfG9yaWdpbnx0YWtlfGRlcml2ZXxib3Jyb3d8b2J0YWluL2ksXG4gIGRhdGE6ICAgL2RhdGF8aW5mby9pLFxuICBmb3JtOiAgIC9mb3JtfHNoYXBlfGFwcGVhcnxjb25maWd1cnxzdHJ1Y3R1cmV8ZGlzcG9zL2ksXG4gIGdyb3VwOiAgL3R5cGV8Z3JvdXB8Y2F0ZWdvcnl8Y2xhc3N8c29ydHxraW5kfHZhcmlldHl8Y29sbGVjdGlvbnxjbHVzdGVyL2ksXG4gIGNvbHVtbjogL2NvbHVtbnxjb21wb25lbnR8cGFydHxwaWVjZXxiaXR8Y29uc3RpdHVlbnR8ZWxlbWVudHxpbmdyZWRpZW50fHVuaXR8bW9kdWxlfGl0ZW18c2VjdGlvbnxwb3J0aW9uL2ksXG4gIHdoYXQ6ICAgL3doYXR8YWJvdXQvaSxcbn07XG5jb25zdCBVU0VSID0gL3VzZXJ8dXRpbGl6ZXJ8YXBwbGllci9pO1xuY29uc3QgVVNFICA9IC91c2V8dXNpbmd8dXRpbGl6fGVtcGxveXxhcHBsL2k7XG5jb25zdCBXSE8gID0gL3dob3xwZXJzb258cGVvcGxlfG1lbWJlci9pO1xuLy8jZW5kcmVnaW9uXG5cblxuXG5cbi8vI3JlZ2lvbiBHTE9CQUxTXG5sZXQgY29ycHVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbCA9IG51bGw7XG4vLyNlbmRyZWdpb25cblxuXG5cblxuLy8jcmVnaW9uIEZVTkNUSU9OU1xuLyoqXG4gKiBSZWFkIHRoZSBpbmRleCBmaWxlIGFuZCByZXR1cm4gdGhlIGFib3V0IGRldGFpbHMuXG4gKiBAcmV0dXJucyBhYm91dCBjb3JwdXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVhZEluZGV4KCkge1xuICBjb25zdCBtYXAgID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgY29uc3QgZmlsZSA9IGltcG9ydC5tZXRhLnJlc29sdmUoJy4vaW5kZXgudHh0Jyk7XG4gIGNvbnN0IGRhdGEgPSBhd2FpdCAoYXdhaXQgZmV0Y2goZmlsZSkpLnRleHQoKTsgbGV0IG0gPSBudWxsO1xuICBjb25zdCByZSA9IC9cXFtcXFsoXFx3KylcXF1cXF1cXG4oW1xcd1xcV10qPylcXG5cXG5cXG4vZztcbiAgd2hpbGUgKChtID0gcmUuZXhlYyhkYXRhKSkgIT0gbnVsbCkge1xuICAgIGNvbnN0IGsgPSBtWzFdLCB2ID0gbVsyXS50cmltKCk7XG4gICAgbWFwLnNldChrLCB2KTtcbiAgfVxuICByZXR1cm4gbWFwO1xufVxuXG5cbi8qKlxuICogTG9hZCB0aGUgYWJvdXQgY29ycHVzIGZyb20gZmlsZS5cbiAqIEByZXR1cm5zIGFib3V0IGNvcnB1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEFib3V0KCk6IFByb21pc2U8TWFwPHN0cmluZywgc3RyaW5nPj4ge1xuICBpZiAoY29ycHVzKSByZXR1cm4gY29ycHVzO1xuICBjb3JwdXMgPSBhd2FpdCByZWFkSW5kZXgoKTtcbiAgcmV0dXJuIGNvcnB1cztcbn1cblxuXG4vKipcbiAqIEZpbmQgbWF0Y2hpbmcgZGVzY3JpcHRpb24gb2YgYW4gYWJvdXQgcXVlcnkuXG4gKiBAcGFyYW0gdHh0IGFib3V0IHF1ZXJ5XG4gKiBAcmV0dXJucyBpZiBmb3VuZCwgcmV0dXJucyB0aGUgZGVzY3JpcHRpb24sIGVsc2UgbnVsbFxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGFib3V0KCd3aG8gaXMgeW91IHB1Ymxpc2hlcicpO1xuICogYWJvdXQoJ3doaWNoIG9yZ2FuaXphdGlvbiBpc3N1ZWQgeW91Jyk7XG4gKiAvLyDihpIgSW5kaWFuIEZvb2QgQ29tcG9zaXRpb24gVGFibGVzIDIwMTcgd2FzIHB1Ymxpc2hlZCBieTpcbiAqIC8vIOKGkiBULiBMb25ndmFoLCBSLiBBbmFudGhhbiwgSy4gQmhhc2thcmFjaGFyeSBhbmQgSy4gVmVua2FpYWhcbiAqIC8vIOKGkiBOYXRpb25hbCBJbnN0aXR1dGUgb2YgTnV0cml0aW9uXG4gKiAvLyDihpIgSW5kaWFuIENvdW5jaWwgb2YgTWVkaWNhbCBSZXNlYXJjaFxuICogLy8g4oaSIERlcGFydG1lbnQgb2YgSGVhbHRoIFJlc2VhcmNoXG4gKiAvLyDihpIgTWluaXN0cnkgb2YgSGVhbHRoIGFuZCBGYW1pbHkgV2VsZmFyZSwgR292ZXJubWVudCBvZiBJbmRpYVxuICogLy8g4oaSIEphbWFpIE9zbWFuaWEgKFBPKSwgSHlkZXJhYmFkIOKAkyA1MDAgMDA3XG4gKiAvLyDihpIgVGVsYW5nYW5hLCBJbmRpYVxuICogLy8g4oaSIFBob25lOiArOTEgNDAgMjcxOTczMzQsIEZheDogKzkxIDQwIDI3MDAwMzM5LCBFbWFpbDogbmluQGFwLm5pYy5pblxuICpcbiAqIGFib3V0KCdjYW4gaSBrbm93IHRoZSBmb29kIGdyb3VwcycpO1xuICogYWJvdXQoJ2kgd2FudCB0byBrbm93IHdoYXQgdHlwZXMgb2YgZm9vZCBhcmUgdGhlcmUnKTtcbiAqIC8vIOKGkiBUaGVyZSBhcmUgMjAgZm9vZCBncm91cHM6XG4gKiAvLyDihpIgLSBBOiBDZXJlYWxzIGFuZCBNaWxsZXRzLiAyNCBmb29kcy5cbiAqIC8vIOKGkiAtIEI6IEdyYWluIExlZ3VtZXMuIDI1IGZvb2RzLlxuICogLy8g4oaSIC0gQzogR3JlZW4gTGVhZnkgVmVnZXRhYmxlcy4gMzQgZm9vZHMuXG4gKiAvLyDihpIgLSBEOiBPdGhlciBWZWdldGFibGVzLiA3OCBmb29kcy5cbiAqIC8vIOKGkiAtIEU6IEZydWl0cy4gNjggZm9vZHMuXG4gKiAvLyDihpIgLSBGOiBSb290cyBhbmQgVHViZXJzLiAxOSBmb29kcy5cbiAqIC8vIOKGkiAtIEc6IENvbmRpbWVudHMgYW5kIFNwaWNlcy4gMzMgZm9vZHMuXG4gKiAvLyDihpIgLSBIOiBOdXRzIGFuZCBPaWwgU2VlZHMuIDIxIGZvb2RzLlxuICogLy8g4oaSIC0gSTogU3VnYXJzLiAyIGZvb2RzLlxuICogLy8g4oaSIC0gSjogTXVzaHJvb21zLiA0IGZvb2RzLlxuICogLy8g4oaSIC0gSzogTWlzY2VsbGFuZW91cyBGb29kcy4gMiBmb29kcy5cbiAqIC8vIOKGkiAtIEw6IE1pbGsgYW5kIE1pbGsgUHJvZHVjdHMuIDQgZm9vZHMuXG4gKiAvLyDihpIgLSBNOiBFZ2cgYW5kIEVnZyBQcm9kdWN0cy4gMTUgZm9vZHMuXG4gKiAvLyDihpIgLSBOOiBQb3VsdHJ5LiAxOSBmb29kcy5cbiAqIC8vIOKGkiAtIE86IEFuaW1hbCBNZWF0LiA2MyBmb29kcy5cbiAqIC8vIOKGkiAtIFA6IE1hcmluZSBGaXNoLiA5MiBmb29kcy5cbiAqIC8vIOKGkiAtIFE7IE1hcmluZSBTaGVsbGZpc2guIDggZm9vZHMuXG4gKiAvLyDihpIgLSBSOiBNYXJpbmUgTW9sbHVza3MuIDcgZm9vZHMuXG4gKiAvLyDihpIgLSBTOiBGcmVzaCBXYXRlciBGaXNoIGFuZCBTaGVsbGZpc2guIDEwIGZvb2RzLlxuICogLy8g4oaSIC0gVDogRWRpYmxlIE9pbHMgYW5kIEZhdHMuIDkgZm9vZHMuXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFib3V0KHR4dDogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHJlID0gUkVHRVg7XG4gIGlmIChVU0VSLnRlc3QodHh0KSB8fCAoVVNFLnRlc3QodHh0KSAmJiBXSE8udGVzdCh0eHQpKSkgcmV0dXJuIGNvcnB1cz8uZ2V0KCd1c2VyJykgYXMgc3RyaW5nO1xuICBpZiAoVVNFLnRlc3QodHh0KSkgcmV0dXJuIGNvcnB1cz8uZ2V0KCd1c2UnKSBhcyBzdHJpbmc7XG4gIGZvciAoY29uc3QgayBpbiByZSlcbiAgICBpZiAocmVba10udGVzdCh0eHQpKSByZXR1cm4gY29ycHVzPy5nZXQoaykgYXMgc3RyaW5nO1xuICByZXR1cm4gbnVsbDtcbn1cbi8vI2VuZHJlZ2lvblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUN0Qyw2Q0FBNkM7QUFDN0MsNkJBQTZCO0FBQzdCLG1CQUFtQjtBQUNuQixNQUFNLFFBQW1DO0VBQ3ZDLFFBQVE7RUFDUixRQUFRO0VBQ1IsUUFBUTtFQUNSLFFBQVE7RUFDUixRQUFRO0VBQ1IsUUFBUTtFQUNSLFFBQVk7RUFDWixXQUFZO0VBQ1osVUFBWTtFQUNaLFlBQVk7RUFDWixPQUFRO0VBQ1IsUUFBUTtFQUNSLE1BQVE7RUFDUixLQUFRO0VBQ1IsV0FBVztFQUNYLFFBQVc7RUFDWCxXQUFXO0VBQ1gsUUFBVztFQUNYLE1BQVE7RUFDUixNQUFRO0VBQ1IsT0FBUTtFQUNSLFFBQVE7RUFDUixNQUFRO0FBQ1Y7QUFDQSxNQUFNLE9BQU87QUFDYixNQUFNLE1BQU87QUFDYixNQUFNLE1BQU87QUFDYixZQUFZO0FBS1osaUJBQWlCO0FBQ2pCLElBQUksU0FBcUM7QUFDekMsWUFBWTtBQUtaLG1CQUFtQjtBQUNuQjs7O0NBR0MsR0FDRCxlQUFlO0VBQ2IsTUFBTSxNQUFPLElBQUk7RUFDakIsTUFBTSxPQUFPLFlBQVksT0FBTyxDQUFDO0VBQ2pDLE1BQU0sT0FBTyxNQUFNLENBQUMsTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJO0VBQUksSUFBSSxJQUFJO0VBQ3ZELE1BQU0sS0FBSztFQUNYLE1BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFNO0lBQ2xDLE1BQU0sSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJO0lBQzdCLElBQUksR0FBRyxDQUFDLEdBQUc7RUFDYjtFQUNBLE9BQU87QUFDVDtBQUdBOzs7Q0FHQyxHQUNELE9BQU8sZUFBZTtFQUNwQixJQUFJLFFBQVEsT0FBTztFQUNuQixTQUFTLE1BQU07RUFDZixPQUFPO0FBQ1Q7QUFHQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMENDLEdBQ0QsT0FBTyxTQUFTLE1BQU0sR0FBVztFQUMvQixNQUFNLEtBQUs7RUFDWCxJQUFJLEtBQUssSUFBSSxDQUFDLFFBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFPLE9BQU8sUUFBUSxJQUFJO0VBQzNFLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxPQUFPLFFBQVEsSUFBSTtFQUN0QyxJQUFLLE1BQU0sS0FBSyxHQUNkLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxPQUFPLFFBQVEsSUFBSTtFQUMxQyxPQUFPO0FBQ1QsRUFDQSxZQUFZIn0=