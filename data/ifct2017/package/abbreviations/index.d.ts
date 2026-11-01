import { type SetupTableOptions } from "@nodef/extra-sql";
/** Full form of abbreviation used in the original book. */ export interface Abbreviation {
  /** Abbreviation, e.g., BRM. */ abbr: string;
  /** Full form of the abbreviation, e.g., "Basal metabolic rate". */ full: string;
}
/**
 * Load the abbreviations corpus from the file.
 * @returns abbreviations corpus {key ⇒ {abbr, full}}
 */ export declare function loadAbbreviations(): Promise<Map<string, Abbreviation>>;
/**
 * Get the path to the abbreviations CSV file.
 * @returns CSV file URL
 */ export declare function abbreviationsCsv(): string;
/**
 * Obtain SQL command to create and populate the abbreviations table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function abbreviationsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching full form of an abbreviation query.
 * @param txt abbreviation query
 * @returns `{abbr, full}` if found, null otherwise
 * @example
 * ```javascript
 * abbreviations('GLV');
 * abbreviations('g l v');
 * // { abbr: 'GLV', full: 'Green Leafy Vegetables' }
 *
 * abbreviations('what is D.R.I.');
 * abbreviations('d. r. i. stands for?');
 * // { abbr: 'DRI', full: 'Dietary reference intake' }
 *
 *
 * // Note:
 * // for single character abbreviations, full stop is mandatory
 * // full stops must immediately follow character, if present
 * ```
 */ export declare function abbreviations(txt: string): Abbreviation | null;
