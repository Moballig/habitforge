import { type SetupTableOptions } from "@nodef/extra-sql";
/** Metabolizable energy conversion factor. */ export interface Energy {
  /** Component. */ component: string;
  /** kJ/g. */ kj: number;
  /** kcal/g. */ kcal: number;
}
/**
 * Load the energies corpus from the file.
 * @returns energies corpus
 */ export declare function loadEnergies(): Promise<Map<string, Energy>>;
/**
 * Get the path to the energies CSV file.
 * @returns CSV file URL
 */ export declare function energiesCsv(): string;
/**
 * Obtain SQL command to create and populate the energies table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function energiesSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Finds matching energies of a component query.
 * @param txt component query
 * @returns matches `[{component, kj, kcal}]`
 * ```javascript
 * ifct2017.energies('dietary fibre');
 * ifct2017.energies('Soluble fibre');
 * // → [ { component: 'Fibre', kj: 8, kcal: 2 } ]
 *
 * ifct2017.energies('what is energy conversion factor of fat?');
 * ifct2017.energies('conversion factor of fat');
 * // → [ { component: 'Fat', kj: 37, kcal: 9 } ]
 * ```
 */ export declare function energies(txt: string): Energy[];
