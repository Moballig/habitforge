import { type SetupTableOptions } from "@nodef/extra-sql";
/** Name of food in local languages, including scientific name. */ export interface YieldFactor {
  /** Food Code. */ code: string;
  /** Food Name. */ name: string;
  /** Scientific Name. */ scie: string;
  /** Local Name. */ lang: string;
  /** Food Group. */ grup: string;
  /** No. of Regions. */ regn: number;
  /** Tags. */ tags: string;
  /** Overall yield factor, considering removal of inedible parts, washng, and cutting. */ yield: number;
  /** Preparation considerations, including stem removal, washing, deseeding, etc. */ preparation: string;
}
/**
 * Load the yield factors corpus from the file.
 * @returns yield factors corpus
 */ export declare function loadYieldFactors(): Promise<Map<string, YieldFactor>>;
/**
 * Get the path to the yield factors CSV file.
 * @returns CSV file URL
 */ export declare function yieldFactorsCsv(): string;
/**
 * Obtain SQL command to create and populate the yield factors table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function yieldFactorsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching yield factors of an code/name/scie/preparation query.
 * @param txt code/name/scie/preparation query
 * @returns matches `[{code, name, scie, yield, preparation}]`
 * @example
 * ```javascript
 * ifct2017.yieldFactors('mango');
 * ifct2017.yieldFactors('Mangifera indica');
 * // → [ { code: 'D057',
 * // →     name: 'Mango, green, raw',
 * // →     scie: 'Mangifera indica',
 * // →     lang: 'A. Keasa aam; B. Aam (kancha); G. Ambo; H. Katcha Aam; Kan. Mavinakayi; Kash. Kach Aamb; Kh. Soh pieng im; Mal. Manga; M. Heinou Ashangba; Mar. Amba; O. Ambu (kacha); P. Kaccha aam; Tam. Mangai; Tel. Mamidikaya; U. Kaccha aam.',
 * // →     grup: 'Other Vegetables',
 * // →     regn: 6,
 * // →     tags: 'vegetarian eggetarian fishetarian veg',
 * // →     yield: 0.6833333333,
 * // →     preparation: 'Washing, Peeling, Seed removal' } ]
 *
 * ifct2017.yieldFactors('yield factor of cow milk?');
 * ifct2017.yieldFactors('cow milk');
 * // → [ { code: 'L002',
 * // →     name: 'Milk, Cow',
 * // →     scie: '',
 * // →     lang: 'A. Garoor gakhir; B. Doodh (garu); G. Gai nu dhudh; H. Gai ka doodh; Kan. Hasuvina halu; Kash. Doodh; Kh. Dud masi; M. San Sanghom; Mar. Doodh (gay); O. Gai dudha; P. Gaan da doodh; S. Gow kshiram; Tam. Pasumpaal; Tel. Aavu paalu.',
 * // →     grup: 'Milk and Milk Products',
 * // →     regn: 6,
 * // →     tags: 'vegetarian eggetarian fishetarian veg',
 * // →     yield: 1,
 * // →     preparation: 'None' } ]
 * ```
 */ export declare function yieldFactors(txt: string): YieldFactor[];
