import { type SetupTableOptions } from "@nodef/extra-sql";
/** Code, name, short, and long description of a column. */ export interface ColumnDescription {
  /** Column Code. */ code: string;
  /** Column Name. */ name: string;
  /** Short description. */ shortdesc: string;
  /** Long description. */ longdesc: string;
}
/**
 * Load the column descriptions corpus from the file.
 * @returns column descriptions corpus
 */ export declare function loadColumnDescriptions(): Promise<Map<string, ColumnDescription>>;
/**
 * Get the path to the column descriptions CSV file.
 * @returns CSV file URL
 */ export declare function columnDescriptionsCsv(): string;
/**
 * Obtain SQL command to create and populate the columns table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function columnDescriptionsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching columns of an code/name/shortdesc/longdesc query.
 * @param txt code/name/shortdesc/longdesc query
 * @returns matches `[{code, name, shortdesc, longdesc}]`
 * @example
 * ```javascript
 * ifct2017.columnDescriptions('vitamin c');
 * ifct2017.columnDescriptions('c-vitamin');
 * // → [ { code: 'vitc',
 * // →     name: 'Ascorbic acids (C)',
 * // →     shortdesc: 'Collagen production, antioxidant. Deficiency: scurvy (bleeding gums).',
 * // →     longdesc: 'An essential vitamin and antioxidant that protects cells, maintains healthy skin, blood vessels, bones, and cartilage, and aids in wound healing. It also improves iron absorption. Lack of Vitamin C can lead to scurvy.' },
 * // → ... ]
 *
 * ifct2017.columnDescriptions('what is butyric acid?');
 * ifct2017.columnDescriptions('c4:0 stands for?');
 * // → [ { code: 'f4d0',
 * // →     name: 'Butyric acid (C4:0)',
 * // →     shortdesc: 'Short-chain fatty acid; colon health/energy for gut cells.',
 * // →     longdesc: 'A short-chain saturated fatty acid with a 4-carbon backbone. It's produced in the colon when dietary fibers are fermented by gut bacteria. Butyrate serves as a primary energy source for colonocytes (cells lining the colon) and has anti-inflammatory properties, playing a role in gut health.' },
 * // → ... ]
 * ```
 */ export declare function columnDescriptions(txt: string): ColumnDescription[];
