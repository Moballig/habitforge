import { type SetupTableOptions } from "@nodef/extra-sql";
/** Jones factor for conversion of nitrogen to protein. */ export interface JonesFactor {
  /** Food. */ food: string;
  /** Conversion Factor. */ factor: number;
}
/**
 * Load the jones factors corpus from the file.
 * @returns jones factors corpus
 */ export declare function loadJonesFactors(): Promise<Map<string, JonesFactor>>;
/**
 * Get the path to the jones factors CSV file.
 * @returns CSV file URL
 */ export declare function jonesFactorsCsv(): string;
/**
 * Obtain SQL command to create and populate the jones factors table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function jonesFactorsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching jones factors of a food query.
 * @param txt food query
 * @returns matches `[{food, factor}]`
 * @example
 * ```javascript
 * ifct2017.jonesFactors('maida');
 * ifct2017.jonesFactors('Refined wheat');
 * // → [ { food: 'Refined wheat flour (Maida)', factor: '5.70' } ]
 *
 * ifct2017.jonesFactors('what is jones factor of barley?');
 * ifct2017.jonesFactors('jones factor of oats');
 * // → [ { food: 'Barley and its flour;Rye and its flour;Oats',
 * // →     factor: '5.83' } ]
 * ```
 */ export declare function jonesFactors(txt: string): JonesFactor[];
