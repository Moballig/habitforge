import { type SetupTableOptions } from "@nodef/extra-sql";
/** Analytical methods for nutrient and bioactive component. */ export interface Method {
  /** Analyte. */ analyte: string;
  /** Method. */ method: string;
  /** Reference. */ reference: string;
}
/**
 * Load the methods corpus from the file.
 * @returns methods corpus
 */ export declare function loadMethods(): Promise<Map<string, Method>>;
/**
 * Get the path to the methods CSV file.
 * @returns CSV file URL
 */ export declare function methodsCsv(): string;
/**
 * Obtain SQL command to create and populate the methods table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function methodsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
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
 */ export declare function methods(txt: string): Method | null;
