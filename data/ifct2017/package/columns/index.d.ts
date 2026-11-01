import { type SetupTableOptions } from "@nodef/extra-sql";
/** Code and name of a nutrient. */ export interface Column {
  /** Column Code. */ code: string;
  /** Column Name. */ name: string;
  /** Tags. */ tags: string;
}
/**
 * Load the columns corpus from the file.
 * @returns columns corpus
 */ export declare function loadColumns(): Promise<Map<string, Column>>;
/**
 * Get the path to the columns CSV file.
 * @returns CSV file URL
 */ export declare function columnsCsv(): string;
/**
 * Obtain SQL command to create and populate the columns table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function columnsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching columns of an code/name/tags query.
 * @param txt code/name/tags query
 * @returns matches `[{code, name, tags}]`
 * @example
 * ```javascript
 * ifct2017.columns('vitamin c');
 * ifct2017.columns('c-vitamin');
 * // → [ { code: 'vitc',
 * // →     name: 'Total Ascorbic acid',
 * // →     tags: 'ascorbate water soluble vitamin c vitamin c essential' } ]
 *
 * ifct2017.columns('what is butyric acid?');
 * ifct2017.columns('c4:0 stands for?');
 * // → [ { code: 'f4d0',
 * // →     name: 'Butyric acid (C4:0)',
 * // →     tags: 'c40 c 40 4 0 bta butanoic propanecarboxylic carboxylic saturated fatty fat triglyceride lipid colorless liquid unpleasant vomit body odor' } ]
 * ```
 */ export declare function columns(txt: string): Column[];
