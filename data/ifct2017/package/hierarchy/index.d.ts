import { type SetupTableOptions } from "@nodef/extra-sql";
/** Tree-like hierarchy of a nutrient. */ export interface Hierarchy {
  /** Column code. */ code: string;
  /** List of Parent columns, space separated. */ parents: string;
  /** List of Ancestor columns, space separated. */ ancestry: string;
  /** List of Child columns, space separated. */ children: string;
}
/**
 * Load the hierarchy corpus from the file.
 * @returns hierarchy corpus
 */ export declare function loadHierarchy(): Promise<Map<string, Hierarchy>>;
/**
 * Get the path to the hierarchy CSV file.
 * @returns CSV file URL
 */ export declare function hierarchyCsv(): string;
/**
 * Obtain SQL command to create and populate the hierarchy table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function hierarchySql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching hierarchy of a column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns `{code, parents, ancestry, children}` if found, else null
 * @example
 * ```javascript
 * ifct2017.hierarchy('soluble oxalic acid');
 * ifct2017.hierarchy('Soluble Oxalic Acid');
 * // → { parents: 'oxalt', ancestry: 'oxalt orgac', children: '' }
 *
 * ifct2017.hierarchy('what is hierarchy of total saturated fat?');
 * ifct2017.hierarchy('who are children of total saturated fat?');
 * // → { parents: 'fatce',
 * // →   ancestry: 'fatce',
 * // →   children:
 * // →    'f4d0 f6d0 f8d0 f10d0 f11d0 f12d0 f14d0 f15d0 f16d0 f18d0 f20d0 f22d0 f24d0' }
 * ```
 */ export declare function hierarchy(txt: string): Hierarchy | null;
