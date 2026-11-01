import { type SetupTableOptions } from "@nodef/extra-sql";
/** Full form of language abbreviation. */ export interface Language {
  /** Language. */ lang: string;
  /** Abbreviation used. */ abbr: string;
}
/**
 * Load the languages corpus from the file.
 * @returns languages corpus
 */ export declare function loadLanguages(): Promise<Map<string, Language>>;
/**
 * Get the path to the languages CSV file.
 * @returns CSV file URL
 */ export declare function languagesCsv(): string;
/**
 * Obtain SQL command to create and populate the languages table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function languagesSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching languages of an abbr/lang query.
 * @param txt abbr/lang query
 * @returns `{abbr, lang}` if found, else null
 * @example
 * ```javascript
 * ifct2017.languages('mal.');
 * ifct2017.languages('Mal');
 * // → { abbr: 'Mal.', lang: 'Malayalam' }
 *
 * ifct2017.languages('what is s.?');
 * ifct2017.languages('S. stands for?');
 * // → { abbr: 'S.', lang: 'Sanskrit' }
 *
 *
 * // Note:
 * // Full stops must immediately follow character, if present.
 * // For single character abbreviations, full stop is mandatory.
 * ```
 */ export declare function languages(txt: string): Language | null;
