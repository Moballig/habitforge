import { type SetupTableOptions } from "@nodef/extra-sql";
/** Detailed nutrient composition of a key food in India. */ export interface Composition {
  /** Food Code. */ code: string;
  /** Food Name. */ name: string;
  /** Scientific Name. */ scie: string;
  /** Local Name. */ lang: string;
  /** Food Group. */ grup: string;
  /** No. of Regions. */ regn: number;
  /** Tags. */ tags: string;
  /** Moisture. */ water: number;
  /** Protein. */ protcnt: number;
  /** Ash. */ ash: number;
  /** Total Fat. */ fatce: number;
  /** Dietary Fiber. */ fibtg: number;
  /** Insoluble Dietary Fiber. */ fibins: number;
  /** Soluble Dietary Fiber. */ fibsol: number;
  /** Carbohydrate. */ choavldf: number;
  /** Energy. */ enerc: number;
  /** Thiamine (B1). */ thia: number;
  /** Riboflavin (B2). */ ribf: number;
  /** Niacin (B3). */ nia: number;
  /** Pantothenic acid (B5). */ pantac: number;
  /** Total B6. */ vitb6c: number;
  /** Biotin (B7). */ biot: number;
  /** Folates (B9). */ folsum: number;
  /** Ascorbic acids (C). */ vitc: number;
  /** Retinol. */ retol: number;
  /** Ergocalciferol (D2). */ ergcal: number;
  /** Cholecalciferol (D3). */ chocal: number;
  /** 25-OH-D3. */ doh25: number;
  /** α-Tocopherol. */ tocpha: number;
  /** β-Tocopherol. */ tocphb: number;
  /** γ-Tocopherol. */ tocphg: number;
  /** δ-Tocopherol. */ tocphd: number;
  /** α-Tocotrienol. */ toctra: number;
  /** β-Tocotrienol. */ toctrb: number;
  /** γ-Tocotrienol. */ toctrg: number;
  /** δ-Tocotrienol. */ toctrd: number;
  /** α-Tocopherol equivalent (E). */ vite: number;
  /** Phylloquinones (K1). */ vitk1: number;
  /** Menaquinones (K2). */ vitk2: number;
  /** Lutein. */ lutn: number;
  /** Zeaxanthin. */ zea: number;
  /** β-Cryptoxanthin. */ crypxb: number;
  /** Lycopene. */ lycpn: number;
  /** γ-Carotene. */ cartg: number;
  /** α-Carotene. */ carta: number;
  /** β-Carotene. */ cartb: number;
  /** Carotenoids. */ cartoid: number;
  /** Aluminium (Al). */ al: number;
  /** Arsenic (As). */ as: number;
  /** Cadmium (Cd). */ cd: number;
  /** Calcium (Ca). */ ca: number;
  /** Chromium (Cr). */ cr: number;
  /** Cobalt (Co). */ co: number;
  /** Copper (Cu). */ cu: number;
  /** Iron (Fe). */ fe: number;
  /** Lead (Pb). */ pb: number;
  /** Lithium (Li). */ li: number;
  /** Magnesium (Mg). */ mg: number;
  /** Manganese (Mn). */ mn: number;
  /** Mercury (Hg). */ hg: number;
  /** Molybdenum (Mo). */ mo: number;
  /** Nickel (Ni). */ ni: number;
  /** Phosphorus (P). */ p: number;
  /** Potassium (K). */ k: number;
  /** Selenium (Se). */ se: number;
  /** Sodium (Na). */ na: number;
  /** Zinc (Zn). */ zn: number;
  /** Available CHO. */ cho: number;
  /** Starch. */ starch: number;
  /** Fructose. */ frus: number;
  /** Glucose. */ glus: number;
  /** Sucrose. */ sucs: number;
  /** Maltose. */ mals: number;
  /** Free Sugars. */ fsugar: number;
  /** Lactose. */ lactose: number;
  /** Butyric acid (C4:0). */ f4d0: number;
  /** Caproic acid (C6:0). */ f6d0: number;
  /** Caprylic acid (C8:0). */ f8d0: number;
  /** Capric acid (C10:0). */ f10d0: number;
  /** Undecanoic acid (C11:0). */ f11d0: number;
  /** Lauric acid (C12:0). */ f12d0: number;
  /** Myristic acid (C14:0). */ f14d0: number;
  /** Pentadecanoic acid (C15:0). */ f15d0: number;
  /** Palmitic acid (C16:0). */ f16d0: number;
  /** Stearic acid (C18:0). */ f18d0: number;
  /** Arachidic acid (C20:0). */ f20d0: number;
  /** Behenic acid (C22:0). */ f22d0: number;
  /** Lignoceric acid (C24:0). */ f24d0: number;
  /** Myristoleic acid (C14:1). */ f14d1cn5: number;
  /** Palmitoleic acid (C16:1). */ f16d1cn7: number;
  /** Oleic acid (C18:1n9). */ f18d1cn9: number;
  /** Elaidic acid (C18:1n9t). */ f18d1tn9: number;
  /** Eicosenoic acid (C20:1n9). */ f20d1cn9: number;
  /** Erucic acid (C22:1n9). */ f22d1cn9: number;
  /** Nervonic acid (C24:1n9). */ f24d1cn9: number;
  /** Linoleic acid (C18:2n6). */ f18d2cn6: number;
  /** Eicosadienoic acid (C20:2). */ f20d2n6: number;
  /** Docosadienoic acid (C22:2). */ f22d2n6: number;
  /** α-Linolenic acid (C18:3n3). */ f18d3n3: number;
  /** Eicosatrienoic acid (C20:3n6). */ f20d3n6: number;
  /** Arachidonic acid (C20:4n6). */ f20d4n6: number;
  /** Eicosapentaenoic acid (C20:5n3). */ f20d5n3: number;
  /** Docosapentaenoic acid (C22:5n3). */ f22d5n3: number;
  /** Docosahexaenoic acid (C22:6n3). */ f22d6n3: number;
  /** Saturated Fatty acids. */ fasat: number;
  /** Monounsaturated Fatty acids. */ fams: number;
  /** Polyunsaturated Fatty acids. */ fapu: number;
  /** Cholesterol. */ cholc: number;
  /** Histidine. */ his: number;
  /** Isoleucine. */ ile: number;
  /** Leucine. */ leu: number;
  /** Lysine. */ lys: number;
  /** Methionine. */ met: number;
  /** Cysteine. */ cys: number;
  /** Phenylalanine. */ phe: number;
  /** Threonine. */ thr: number;
  /** Tryptophan. */ trp: number;
  /** Valine. */ val: number;
  /** Alanine. */ ala: number;
  /** Arginine. */ arg: number;
  /** Aspartic acid. */ asp: number;
  /** Glutamic acid. */ glu: number;
  /** Glycine. */ gly: number;
  /** Proline. */ pro: number;
  /** Serine. */ ser: number;
  /** Tyrosine. */ tyr: number;
  /** Oxalates. */ oxalt: number;
  /** Soluble Oxalate. */ oxals: number;
  /** Insoluble Oxalate. */ oxali: number;
  /** Cis-Aconitic acid. */ caconac: number;
  /** Citric acid. */ citac: number;
  /** Fumaric acid. */ fumac: number;
  /** Malic acid. */ malac: number;
  /** Quinic acid. */ quinac: number;
  /** Succinic acid. */ sucac: number;
  /** Tartaric acid. */ tarac: number;
  /** "3. */ dhbenzac34: number;
  /** 3-Hydroxy Benzaldehyde. */ hbenzal3: number;
  /** Protocatechuic acid. */ pcathac: number;
  /** Vanillic acid. */ vanlac: number;
  /** Gallic acid. */ gallac: number;
  /** Cinnamic acid. */ cinmac: number;
  /** o-Coumaric acid. */ coumaco: number;
  /** p-Coumaric acid. */ coumacp: number;
  /** Caffeic acid. */ caffac: number;
  /** Chlorogenic acid. */ chlrac: number;
  /** Ferulic acid. */ ferac: number;
  /** Apigenin. */ apigen: number;
  /** Apigenin-6-C-gluoside. */ apigen6cgls: number;
  /** Apigenin-7-O-neohesperidoside. */ apigen7onshps: number;
  /** Luteolin. */ luteol: number;
  /** Kaempferol. */ kaemf: number;
  /** Quercetin. */ querce: number;
  /** Quercetin-3-β-D-glucoside. */ querce3bdgls: number;
  /** Quercetin-3-O-rutinoside. */ querce3ortns: number;
  /** Quercetin-3-β-galactoside. */ querce3bgls: number;
  /** Isorhamnetin. */ isormt: number;
  /** Myricetin. */ myrct: number;
  /** Resvertrol. */ rsvrtol: number;
  /** Hesperetin. */ hespt: number;
  /** Naringenin. */ narng: number;
  /** Hesperdin. */ hespd: number;
  /** Daidzein. */ daidzn: number;
  /** Genistein. */ gnstein: number;
  /** (-)-Epicatechin. */ epicatec: number;
  /** (-)-Epigallo catechin. */ epicategc: number;
  /** (-)-Epigallo catechin 3-gallate. */ epicatgc3gal: number;
  /** (+)-Catechin. */ catec: number;
  /** (-)-Gallocatechin gallate. */ galcatecgal: number;
  /** (-)-Gallocatechin. */ galcatec: number;
  /** Syringic acid. */ syrgac: number;
  /** Sinapinic acid. */ sinpac: number;
  /** Ellagic acid. */ ellgac: number;
  /** Polyphenols. */ polyph: number;
  /** Raffinose. */ rafs: number;
  /** Stachyose. */ stas: number;
  /** Verbascose. */ vers: number;
  /** Ajugose. */ ajgs: number;
  /** Campesterol. */ camt: number;
  /** Stigmasterol. */ stgstr: number;
  /** β-Sitosterol. */ stostrb: number;
  /** Phytate. */ phytac: number;
  /** Saponins. */ sapon: number;
  /** Vitamin B. */ vitb: number;
  /** Vitamin D. */ vitd: number;
  /** Vitamin K. */ vitk: number;
  /** Tocopherols. */ tocph: number;
  /** Tocotrienols. */ toctr: number;
  /** Essential Amino acids. */ amiace: number;
  /** Conditionally essential Amino acids. */ amiacce: number;
  /** Non-essential Amino acids. */ amiacne: number;
  /** Amino acids. */ amiac: number;
  /** Organic acids. */ orgac: number;
  /** Unsaturated Fatty acids. */ fauns: number;
  /** Essential Fatty acids. */ faess: number;
  /** Cis ω-3 Fatty acids. */ facn3: number;
  /** Cis ω-6 Fatty acids. */ facn6: number;
  /** Cis ω-9 Fatty acids. */ facn9: number;
  /** Cis ω-5 Fatty acids. */ facn5: number;
  /** Cis ω-7 Fatty acids. */ facn7: number;
  /** Cis Fatty acids. */ facis: number;
  /** Trans Fatty acids. */ fatrn: number;
  /** Oligosaccharides. */ olsac: number;
  /** Phytosterols. */ phystr: number;
  /** Essential Quantity Minerals. */ mnrleq: number;
  /** Essential Trace Minerals. */ mnrlet: number;
  /** Possibly essential Trace Minerals. */ mnrlpet: number;
  /** Non-essential Trace Minerals. */ mnrlnet: number;
  /** Toxic Minerals. */ mnrltx: number;
  /** Carotenes. */ carot: number;
  /** Xanthophylls. */ xantp: number;
  /** β-Carotene equivalents. */ cartbeq: number;
  /** Vitamin A. */ vita: number;
  /** Vitamins. */ vit: number;
}
/**
 * Load the compositions corpus from the file.
 * @returns compositions corpus
 */ export declare function loadCompositions(): Promise<Map<string, Composition>>;
/**
 * Get the path to the compositions CSV file.
 * @returns CSV file URL
 */ export declare function compositionsCsv(): string;
/**
 * Obtain SQL command to create and populate the compositions table.
 * @param tab table name
 * @param opt options for the table
 * @returns CREATE TABLE, INSERT, CREATE VIEW, CREATE INDEX statements
 */ export declare function compositionsSql(tab?: string, opt?: SetupTableOptions): Promise<string>;
/**
 * Find matching compositions of a code/name/scie/lang/grup/tags query.
 * @param txt code/name/scie/lang/grup/tags query
 * @returns matches `[{code, name, scie, lang, grup, regn, tags, ...}]`
 * @example
 * ```javascript
 * ifct2017.compositions('pineapple');
 * ifct2017.compositions('ananas comosus');
 * // → [ { code: 'E053',
 * // →     name: 'Pineapple',
 * // →     scie: 'Ananas comosus',
 * // →     lang: 'A. Ahnaros; B. Anarasa; G. Anenas; H. Ananas; Kan. Ananas; Kash. Punchitipul; Kh. Soh trun; Kon. Anas; Mal. Kayirha chakka; M. Kihom Ananas; O. Sapuri; P. Ananas; Tam. Annasi pazham; Tel. Anasa pandu; U. Ananas.',
 * // →     ... } ]
 *
 * ifct2017.compositions('tell me about cow milk.');
 * ifct2017.compositions('gai ka doodh details.');
 * // → [ { code: 'L002',
 * // →     name: 'Milk, Cow',
 * // →     scie: '',
 * // →     lang: 'A. Garoor gakhir; B. Doodh (garu); G. Gai nu dhudh; H. Gai ka doodh; Kan. Hasuvina halu; Kash. Doodh; Kh. Dud masi; M. San Sanghom; Mar. Doodh (gay); O. Gai dudha; P. Gaan da doodh; S. Gow kshiram; Tam. Pasumpaal; Tel. Aavu paalu.',
 * // →     ... } ]
 * ```
 */ export declare function compositions(txt: string): Composition[];
