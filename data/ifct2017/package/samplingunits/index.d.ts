import { type SetupTableOptions } from "@nodef/extra-sql";
/** Primary sampling unit of each State/UT. */ export interface SamplingUnit {
  /** Sl. No. */ sno: string;
  /** State name. */ state: string;
  /** Total No. of Districts. */ districts: number;
  /** Districts Selected. */ selected: number;
}
/**
 * Load the sampling units corpus from the file.
 * @returns sampling units corpus
 */ export declare function loadSamplingUnits(): Promise<Map<string, SamplingUnit>>;
/**
 * Get the path to the sampling units CSV file.
 * @returns CSV file URL
 */ export declare function samplingUnitsCsv(): string;
/**
 * Obtain SQL command to create and populate the sampling units table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function samplingUnitsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching sampling units of an sno/state query.
 * @param txt sno/state query
 * @returns matches `[{sno, state, districts, selected}]`
 * @example
 * ```javascript
 * ifct2017.samplingUnits('andaman');
 * ifct2017.samplingUnits('Nicobar');
 * // → [ { sno: 'A',
 * // →     state: 'Andaman & Nicobar',
 * // →     districts: 3,
 * // →     selected: 1 } ]
 *
 * ifct2017.samplingUnits('sampling units in orissa?');
 * ifct2017.samplingUnits('orissa\'s sampling units');
 * // → [ { sno: '20', state: 'Orissa', districts: 30, selected: 4 } ]
 * ```
 */ export declare function samplingUnits(txt: string): SamplingUnit[];
