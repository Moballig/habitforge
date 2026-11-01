import { type SetupTableOptions } from "@nodef/extra-sql";
/** Frequency of States/UTs for fixing the number of districts to be sampled. */ export interface Frequency {
  /** No. of Districts. */ districts: string;
  /** No. of States/UTs. */ states: number;
  /** No. of districts to be selected from each State/UT. */ selected: number;
  /** Total No. of districts to be sampled. */ sampled: number;
}
/**
 * Load the frequency distribution corpus from the file.
 * @returns frequency distribution corpus
 */ export declare function loadFrequencyDistribution(): Promise<Map<number, Frequency>>;
/**
 * Get the path to the frequency distribution CSV file.
 * @returns CSV file URL
 */ export declare function frequencyDistributionCsv(): string;
/**
 * Obtain SQL command to create and populate the frequency distribution table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function frequencyDistributionSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching frequency distribution for a given no. of districts.
 * @param dis no. of districts
 * @returns `{districts, states, selected, sampled}` if found, else null
 * @example
 * ```javascript
 * ifct2017.frequencyDistribution(2);
 * ifct2017.frequencyDistribution(5);
 * // → { districts: '1-5', states: 9, selected: 1, sampled: 9 }
 *
 * ifct2017.frequencyDistribution(32);
 * ifct2017.frequencyDistribution(37);
 * // → { districts: '31-40', states: 4, selected: 5, sampled: 20 }
 * ```
 */ export declare function frequencyDistribution(dis: number): Frequency | null;
