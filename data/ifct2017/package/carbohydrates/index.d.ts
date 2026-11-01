import { type SetupTableOptions } from "@nodef/extra-sql";
/** Conversion of carbohydrate weight to monosaccharide equivalent. */ export interface Carbohydrate {
  /** S. No. */ sno: string;
  /** Carbohydrate. */ carbohydrate: string;
  /** Equivalent after Hydrolysis (g/100g). */ hydrolysis: number;
  /** Conversion to monosaccharide equivalent. */ monosaccharide: number;
}
/**
 * Load the carbohydrates corpus from the file.
 * @returns carbohydrates corpus
 */ export declare function loadCarbohydrates(): Promise<Map<string, Carbohydrate>>;
/**
 * Get the path to the carbohydrates CSV file.
 * @returns CSV file URL
 */ export declare function carbohydratesCsv(): string;
/**
 * Obtain SQL command to create and populate the carbohydrates table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function carbohydratesSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching carbohydrates of an sno/carbohydrate query.
 * @param txt sno/carbohydrate query
 * @returns matches `[{sno, carbohydrate, hydrolysis, monosaccharide}]`
 * @example
 * ```javascript
 * ifct2017.carbohydrates('monosaccharide');
 * ifct2017.carbohydrates('Glucose');
 * // → [ { sno: '1',
 * // →     carbohydrate: 'Monosaccharides e.g. glucose',
 * // →     hydrolysis: 100,
 * // →     monosaccharide: 1 } ]
 *
 * ifct2017.carbohydrates('what is carbohydrate conversion factor of disaccharides?');
 * ifct2017.carbohydrates('maltose conversion factor');
 * // → [ { sno: '2',
 * // →     carbohydrate: 'Disaccharides e.g. sucrose, lactose, maltose',
 * // →     hydrolysis: 105,
 * // →     monosaccharide: 1.05 } ]
 * ```
 */ export declare function carbohydrates(txt: string): Carbohydrate[];
