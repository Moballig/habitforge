import { type SetupTableOptions } from "@nodef/extra-sql";
/** Name of food in local languages, including scientific name. */ export interface Description {
  /** Food Code. */ code: string;
  /** Food Name. */ name: string;
  /** Scientific Name. */ scie: string;
  /** Food Group. */ grup: string;
  /** Description (local names). */ desc: string;
}
/**
 * Load the descriptions corpus from the file.
 * @returns descriptions corpus
 */ export declare function loadDescriptions(): Promise<Map<string, Description>>;
/**
 * Get the path to the descriptions CSV file.
 * @returns CSV file URL
 */ export declare function descriptionsCsv(): string;
/**
 * Obtain SQL command to create and populate the descriptions table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function descriptionsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching descriptions of an code/name/scie/desc query.
 * @param txt code/name/scie/desc query
 * @returns matches `[{code, name, scie, grup, desc}]`
 * @example
 * ```javascript
 * ifct2017.descriptions('pineapple');
 * ifct2017.descriptions('ananas comosus');
 * // → [ { code: 'E053',
 * // →     name: 'Pineapple',
 * // →     scie: 'Ananas comosus',
 * // →     grup: 'Fruits',
 * // →     desc: 'A. Ahnaros; B. Anarasa; G. Anenas; H. Ananas; Kan. Ananas; Kash. Punchitipul; Kh. Soh trun; Kon. Anas; Mal. Kayirha chakka; M. Kihom Ananas; O. Sapuri; P. Ananas; Tam. Annasi pazham; Tel. Anasa pandu; U. Ananas.' } ]
 *
 * ifct2017.descriptions('tell me about cow milk.');
 * ifct2017.descriptions('gai ka doodh details.');
 * // → [ { code: 'L002',
 * // →     name: 'Milk, Cow',
 * // →     scie: '',
 * // →     grup: 'Milk and Milk Products',
 * // →     desc: 'A. Garoor gakhir; B. Doodh (garu); G. Gai nu dhudh; H. Gai ka doodh; Kan. Hasuvina halu; Kash. Doodh; Kh. Dud masi; M. San Sanghom; Mar. Doodh (gay); O. Gai dudha; P. Gaan da doodh; S. Gow kshiram; Tam. Pasumpaal; Tel. Aavu paalu.' } ]
 * ```
 */ export declare function descriptions(txt: string): Description[];
