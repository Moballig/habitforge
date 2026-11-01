import type { Composition } from "../compositions/index.js";
/** Type of the composition stats. */ export type CompositionStatType = "min" | "max" | "avg";
/**
 * Load the compositions corpus from the file.
 * @returns compositions corpus
 */ export declare function loadCompositionStats(): Promise<Map<string, Composition>>;
/**
 * Get the path to the compositions stats CSV file.
 * @returns CSV file URL
 */ export declare function compositionStatsCsv(): string;
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
 */ export declare function compositionStats(type: CompositionStatType): Composition[];
