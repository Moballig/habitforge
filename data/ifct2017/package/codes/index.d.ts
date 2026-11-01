import { type SetupTableOptions } from "@nodef/extra-sql";
/** Uniquely identifiable code for each food. */ export interface Code {
  /** Food Name. */ name: string;
  /** Food Code. */ code: string;
}
/**
 * Load the codes corpus from the file.
 * @returns codes corpus
 */ export declare function loadCodes(): Promise<Map<string, Code>>;
/**
 * Get the path to the codes CSV file.
 * @returns CSV file URL
 */ export declare function codesCsv(): string;
/**
 * Obtain SQL command to create and populate the codes table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function codesSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching codes of an name/code query.
 * @param txt name/code query
 * @returns matches `[{name, code}]`
 * @example
 * ```javascript
 * codes('mango green');
 * codes('Raw mango');
 * // → [ { name: 'Mango, green, raw (Common)', code: 'D057' } ]
 *
 * codes('what is food code of atta?');
 * codes('atta code');
 * // → [ { name: 'Atta (H., P.)', code: 'A019' },
 * // →   { name: 'Gahama atta (O.)', code: 'A019' },
 * // →   { name: 'Wheat flour, atta (Common)', code: 'A019' } ]
 * ```
 */ export declare function codes(txt: string): Code[];
