import { type SetupTableOptions } from "@nodef/extra-sql";
/** Content in the original book. */ export interface Content {
  /** S. No. */ sno: string;
  /** Title. */ title: string;
  /** Page Nos. */ pagenos: string;
}
/**
 * Load the contents corpus from the file.
 * @returns contents corpus
 */ export declare function loadContents(): Promise<Map<string, Content>>;
/**
 * Get the path to the contents CSV file.
 * @returns CSV file URL
 */ export declare function contentsCsv(): string;
/**
 * Obtain SQL command to create and populate the contents table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function contentsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching contents of an sno/title/pagenos query.
 * @param txt sno/title/pagenos query
 * @returns matches `[{sno, title, pagenos}]`
 * @example
 * ```javascript
 * ifct2017.contents('table 2');
 * ifct2017.contents('Water soluble vitamins');
 * // → [ { sno: '6.2.',
 * // →     title: 'Table 2:  Water Soluble Vitamins',
 * // →     pagenos: '31' } ]
 *
 * ifct2017.contents('what is page number of table 3?');
 * ifct2017.contents('fat soluble vitamin page number');
 * // → [ { sno: '6.3.',
 * // →     title: 'Table 3:  Fat Soluble Vitamins',
 * // →     pagenos: '61' } ]
 * ```
 */ export declare function contents(txt: string): Content[];
