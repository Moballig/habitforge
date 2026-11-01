import { type SetupTableOptions } from "@nodef/extra-sql";
/** Recommended daily intakes of nutrient. */ export interface Intake {
  /** Column Code. */ code: string;
  /** WHO Recommended Dietary Allowance. */ whorda: number;
  /** US Estimated Average Requirement. */ usear: number;
  /** US Recommended Dietary Allowance (Male). */ usrdam: number;
  /** US Recommended Dietary Allowance (Female). */ usrdaf: number;
  /** EU Population Reference Intake (Male). */ euprim: number;
  /** EU Population Reference Intake (Female). */ euprif: number;
  /** Tolerable intake Upper Level (US). */ ulus: number;
  /** Tolerable intake Upper Level (EU). */ uleu: number;
  /** Tolerable intake Upper Level (Japan). */ uljapan: number;
}
/**
 * Load the intakes corpus from the file.
 * @returns intakes corpus
 */ export declare function loadIntakes(): Promise<Map<string, Intake>>;
/**
 * Get the path to the intakes CSV file.
 * @returns CSV file URL
 */ export declare function intakesCsv(): string;
/**
 * Obtain SQL command to create and populate the intakes table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function intakesSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching intakes of an column:code/name/tags query.
 * @param txt column:code/name/tags query
 * @returns matches `[{code, whorda, usear, usrdam, usrdaf, euprim, euprif, ulus, uleu, uljapan}]`
 * @example
 * ```javascript
 * ifct2017.intakes('his');
 * ifct2017.intakes('Histidine');
 * // → [{ code: 'his',
 * // →    whorda: -0.01,
 * // →    usear: NaN,
 * // →    usrdam: -0.014,
 * // →    usrdaf: NaN,
 * // →    euprim: NaN,
 * // →    euprif: NaN,
 * // →    ulus: NaN,
 * // →    uleu: NaN,
 * // →    uljapan: NaN }]
 *
 * ifct2017.intakes('intake of total fibre?');
 * ifct2017.intakes('what is rda of total fiber?');
 * // → [{ code: 'fibtg',
 * // →    whorda: NaN,
 * // →    usear: NaN,
 * // →    usrdam: 38,
 * // →    usrdaf: 25,
 * // →    euprim: NaN,
 * // →    euprif: NaN,
 * // →    ulus: NaN,
 * // →    uleu: NaN,
 * // →    uljapan: NaN }]
 *
 *
 * // Note:
 * // +ve value indicates amount in grams.
 * // -ve value indicates amount in grams per kg of body weight.
 * // NaN indicates no recommentation given.
 * ```
 */ export declare function intakes(txt: string): Intake[];
