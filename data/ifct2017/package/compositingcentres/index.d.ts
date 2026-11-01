import { type SetupTableOptions } from "@nodef/extra-sql";
/** Regional compositing centre and sample size of each region. */ export interface CompositingCentre {
  /** Region. */ region: string;
  /** Regional Compositing centre. */ centre: string;
  /** Sample size. */ samples: number;
}
/**
 * Load the compositing centres corpus from the file.
 * @returns compositing centres corpus
 */ export declare function loadCompositingCentres(): Promise<Map<string, CompositingCentre>>;
/**
 * Get the path to the compositing centres CSV file.
 * @returns CSV file URL
 */ export declare function compositingCentresCsv(): string;
/**
 * Obtain SQL command to create and populate the compositing centres table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function compositingCentresSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching compositing centres of a region/centre query.
 * @param txt region/centre query
 * @returns matches `[{region, centre, samples}]`
 * @examples
 * ```javascript
 * ifct2017.compositingCentres('west');
 * ifct2017.compositingCentres('Mumbai');
 * // → [ { region: 'West', centre: 'Mumbai', samples: 12 } ]
 *
 * ifct2017.compositingCentres('what is compositing centre of north east?');
 * ifct2017.compositingCentres('North East compositing centre');
 * // → [ { region: 'North East', centre: 'Guwahati', samples: 11 } ]
 * ```
 */ export declare function compositingCentres(txt: string): CompositingCentre[];
