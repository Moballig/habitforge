import { type SetupTableOptions } from "@nodef/extra-sql";
/** Categorization of food by its common names. */ export interface Group {
  /** Code. */ code: string;
  /** Food groups. */ group: string;
  /** No. of food entries. */ entries: number;
  /** Tags. */ tags: string;
}
/**
 * Load the groups corpus from the file.
 * @returns groups corpus
 */ export declare function loadGroups(): Promise<Map<string, Group>>;
/**
 * Get the path to the groups CSV file.
 * @returns CSV file URL
 */ export declare function groupsCsv(): string;
/**
 * Obtain SQL command to create and populate the groups table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function groupsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching groups of an code/group/tags query.
 * @param txt code/group/tags query
 * @returns matches `[{code, group, entries, tags}]`
 * @example
 * ```javascript
 * ifct2017.groups('cereals');
 * ifct2017.groups('Millet');
 * // → [ { code: 'A',
 * // →     group: 'Cereals and Millets',
 * // →     entries: 24,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' } ]
 *
 * ifct2017.groups('what is vegetable?');
 * ifct2017.groups('vegetable group code?');
 * // → [ { code: 'D',
 * // →     group: 'Other Vegetables',
 * // →     entries: 78,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' },
 * // →   { code: 'C',
 * // →     group: 'Green Leafy Vegetables',
 * // →     entries: 34,
 * // →     tags: 'vegetarian eggetarian fishetarian veg' } ]
 * ```
 */ export declare function groups(txt: string): Group[];
