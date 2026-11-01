import { type SetupTableOptions } from "@nodef/extra-sql";
/** Categorization of the States/UTs into six different regions. */ export interface Region {
  /** Region. */ region: string;
  /** States/UTs. */ states: string;
}
/**
 * Load the regions corpus from the file.
 * @returns regions corpus
 */ export declare function loadRegions(): Promise<Map<string, Region>>;
/**
 * Get the path to the regions CSV file.
 * @returns CSV file URL
 */ export declare function regionsCsv(): string;
/**
 * Obtain SQL command to create and populate the regions table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function regionsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching regions of a region/states query.
 * @param txt region/states query
 * @returns matches `[{region, states}]`
 * @example
 * ```javascript
 * ifct2017.regions('central');
 * ifct2017.regions('Uttaranchal');
 * // → [ { region: 'Central',
 * // →     states: 'Chhattisgarh;Madhya Pradesh;Uttar Pradesh;Uttaranchal' } ]
 *
 * ifct2017.regions('which region andhra pradesh belongs to?');
 * ifct2017.regions('details of south region');
 * // → [ { region: 'South',
 * // →     states: 'Andaman & Nicobar Islands;Andhra Pradesh;Karnataka;Kerala;Lakshadweep;Pondicherry;Telangana;Tamil Nadu' } ]
 * ```
 */ export declare function regions(txt: string): Region[];
