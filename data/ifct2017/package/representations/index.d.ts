import { type SetupTableOptions } from "@nodef/extra-sql";
/** Representation of a column (as factor and unit). */ export interface Representation {
  /** Column Code. */ code: string;
  /** Type of physical quantity. */ type: string;
  /** Multiplication factor. */ factor: number;
  /** Unit symbol. */ unit: string;
}
/**
 * Load the representations corpus from the file.
 * @returns representations corpus
 */ export declare function loadRepresentations(): Promise<Map<string, Representation>>;
/**
 * Get the path to the representations CSV file.
 * @returns CSV file URL
 */ export declare function representationsCsv(): string;
/**
 * Obtain SQL command to create and populate the representations table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function representationsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching representations of a column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns `{code, type, factor, unit}` if found, else null
 * @example
 * ```javascript
 * ifct2017.representations('his');
 * ifct2017.representations('Histidine');
 * // → { type: 'mass', factor: 1000, unit: 'mg' }
 *
 * ifct2017.representations('representation of vitamin d?');
 * ifct2017.representations('what is unit of ergocalciferol?');
 * // → { type: 'mass', factor: 1000000000, unit: 'ng' }
 * ```
 */ export declare function representations(txt: string): Representation | null;
