

// /**
//  * @param {string} defaultLocale
//  * @param {string} [locale=defaultlocale]
//  * @param {object} [options]
//  * @constructor
//  */
// export abstract class Formatter {
//     name?: string;
//     readonly expectation?: string;
//     readonly locale: string;
//     localizedDigits: string[];

//     invalid: Localization.Localizer.InvalidFunction<T>;

//     constructor(defaultLocale: string, options?: Formatter.Options<T>)
//     constructor(defaultLocale: string, locale: string, options?: Formatter.Options<T>)
//     constructor(defaultLocale: string, localeOrOptions: string | Formatter.Options<T>, options?: Formatter.Options<T>) {
//         super();

//         let locale: string;
//         if (typeof localeOrOptions === 'object') {
//             locale = defaultLocale;
//             options = localeOrOptions;
//         } else {
//             locale = localeOrOptions;
//         }

//         this.locale = locale;

//         if (options !== undefined) {
//             if (typeof options.invalid === 'function') {
//                 this.invalid = options.invalid;
//             }

//             if (options.expectation !== undefined) {
//                 this.expectation = options.expectation;
//             }
//         }
//     }

//     abstract format(value: unknown, config?: CellRenderer.Config): string;
//     abstract parse(value: string): unknown;

//     formatDigit(d: number) {
//         return this.localizedDigits[d];
//     }

//     parseDigit(c: string) {
//         const d = this.localizedDigits.indexOf(c);
//         if (d < 0) {
//             throw new Error(`Unknown digit: ${c}`);
//         } else {
//             return d;
//         }
//     }
// }

// export namespace Formatter {
//     export interface Options<T> {
//         expectation?: string;
//         invalid: Localization.Localizer.InvalidFunction<T>;
//     }

//     // export type Constructor = new(defaultLocale: string, locale: string | object, options?: Formatter.Options | string) => Formatter;
// }


// /**
//  * @summary Create a number localizer.
//  * @implements localizerInterface
//  * @desc Create an object conforming to {@link localizerInterface} for numbers, using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`}.
//  * @param {string} defaultLocale
//  * @param {string} [locale=defaultLocale] - Passed to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`} constructor.
//  * @param {object} [options] - Passed to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`} constructor.
//  * @param {boolean} [options.acceptStandardDigits=false] - Accept standard digits and decimal point interchangeably with localized digits and decimal point. (This option is interpreted here; it is not used by {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat `Intl.NumberFormat`}.)
//  * @constructor
//  * @extends Formatter
//  * @tutorial localization
//  */
// export class NumberFormatter extends Formatter<number> {
//     private invalids: RegExp;
//     private _numberFormat: Intl.NumberFormat;
//     private map: string;

//     constructor(defaultLocale: string, options: NumberFormatter.Options)
//     constructor(defaultLocale: string, locale: string, options?: NumberFormatter.Options);
//     constructor(defaultLocale: string, localeOrOptions: string | NumberFormatter.Options, options?: NumberFormatter.Options) {
//         super(defaultLocale, localeOrOptions, options);

//         if (typeof locale === 'object') {
//             options = locale;
//         }

//         options = options ?? {
//             invalid: this.invalid,
//         };

//         this._numberFormat = new Intl.NumberFormat(this.locale, options);

//         const mapperOptions = { useGrouping: false };
//         const mapperNumberFormat = new Intl.NumberFormat(this.locale, mapperOptions);

//         /**
//          * @summary A string containing the valid characters.
//          * @desc Contains all localized digits + localized decimal point.
//          * If we're accepting standard digits, will also contain all the standard digits + standard decimal point (if different than localized versions).
//          * @type {string}
//          * @private
//          * @desc Localized digits and decimal point. Will also include standardized digits and decimal point if `options.acceptStandardDigits` is truthy.
//          *
//          * For internal use by the {@link NumberFormatter#parse|parse} method.
//          * @memberOf NumberFormatter.prototype
//          */
//         this.map = mapperNumberFormat.format(10123456789.5).substr(1, 11); // localized '0123456789.'

//         if (options.acceptStandardDigits && this.map !== '0123456789.') {
//             this.map += '0123456789.';  // standard '0123456789.'
//         }

//         /** @summary A regex that tests `true` on first invalid character.
//          * @type {RegExp}
//          * @private
//          * @desc Valid characters include:
//          *
//          * * Localized digits
//          * * Localized decimal point
//          * * Standard digits (when `options.acceptStandardDigits` is truthy)
//          * * Standard decimal point (when `options.acceptStandardDigits` is truthy)
//          * * Cosmetic characters added by formatter as per `options` (for human-friendly readability).
//          *
//          * Any characters outside this set are considered invalid.
//          *
//          * Set by the constructor; consumed by the {@link module:localization~NumberFormatter#invalid|invalid} method.
//          *
//          * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
//          * @memberOf NumberFormatter.prototype
//          */
//         this.invalids = new RegExp(
//             '[^' +
//             this.format(11111).replace(this.map[1], '') + // thousands separator if in use
//             this.map + // digits + decimal point
//             ']'
//         );
//     }

//     format(value: number) {
//         return this._numberFormat.format(value);
//     }

//     /** @summary Tests for invalid characters.
//      * @desc Tests a localized string representation of a number that it contains any invalid characters.
//      *
//      * The number may be unformatted or it may be formatted with any of the permitted formatting characters, as implied by the constructor's `options` (passed to `Intl.NumberFormat`). Any other characters are considered invalid.
//      *
//      * However, standard digits and the standard decimal point are considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
//      *
//      * Use this method to:
//      * 1. Filter out invalid characters on a `onkeydown` event; or
//      * 2. Test an edited string prior to calling the {@link module:localization~NumberFormatter#parse|parse}.
//      *
//      * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
//      *
//      * @returns {boolean|string} Falsy means valid which in this case means contains only valid characters.
//      */
//     override invalid(value: number) {
//         return this.invalids.test(value);
//     }

//     const expectation =
//         'Expected a number with optional commas (thousands grouping separator), optional decimal point, and an optional fractional part.\n' +
//         'Comma separators are part of the format and will always be displayed for values >= 1000.\n' +
//         'Edited values are always saved in their entirety even though the formatted value is rounded to the specified number of decimal places.';

//     /**
//      * This method will:
//      * * Convert localized digits and decimal point characters to standard digits and decimal point characters.
//      * * "Clean" the string by ignoring all other characters.
//      * * Coerce the string to a number primitive.
//      * @param formattedLocalizedNumber - May or may not be formatted.
//      * @returns Number primitive.
//      */
//     parse(formattedLocalizedNumber: string) {
//         const value = Number(
//             formattedLocalizedNumber.split('').map((c) => this.demap(c)).join('')
//         );

//         if (isNaN(value)) {
//             throw 'Invalid Number';
//         }

//         return value;
//     }

//     private demap(c: string) {
//         const d = this.map.indexOf(c) % 11;
//         return d < 0 ? '' : d < 10 ? d : '.';
//     }
// }

// export namespace NumberFormatter {
//     export interface Options extends Formatter.Options<number>, Intl.NumberFormatOptions {
//         acceptStandardDigits?: boolean;
//     }
// }

// /**
//  * @implements localizerInterface
//  * @param {string} defaultLocale
//  * @param {string} [locale=defaultlocale] - Passed to the {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat `Intl.DateFormat`} constructor.
//  * @param {object} [options] - Passed to the {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat `Intl.DateFormat`} constructor.
//  * @constructor
//  * @extends Formatter
//  */
// export class DateFormatter extends Formatter {
//     private _dateTimeFormat: Intl.DateTimeFormat;
//     private partsMap: DateFormatter.PartsMap;

//     constructor(defaultLocale: string, locale: string, options: DateFormatter.Options) {
//         super();

//         if (typeof locale === 'object') {
//             options = locale;
//         }

//         options = options ?? {};

//         /** @summary Transform a date object into human-friendly string representation.
//          * @method
//          */
//         this._dateTimeFormat = new Intl.DateTimeFormat(this.locale, options);

//         // Get digits because may be chinese or "real Arabic" numerals.
//         const testOptions = { useGrouping: false, style: 'decimal' };
//         const localizeNumber = new Intl.NumberFormat(this.locale, testOptions).format;
//         const localizedDigits = this.localizedDigits = localizeNumber(10123456789).substr(1, 10); // all localized digits in numerical order

//         // Localize a test date with the default numeric parts to find out the resulting order of these parts.
//         const yy = 1987;
//         const mm = 12;
//         const dd = 30;
//         const YY = this.transformNumber(yy);
//         const MM = this.transformNumber(mm);
//         const DD = this.transformNumber(dd);
//         const testDate = new Date(yy, mm - 1, dd);
//         const localizeDate = new Intl.DateTimeFormat(this.locale).format;
//         const localizedDate = localizeDate(testDate); // all localized digits + localized punctuation
//         const missingDigits = new Intl.NumberFormat(this.locale).format(456);
//         const localizedNumberPattern = this.localizedNumberPattern = new RegExp('[' + localizedDigits + ']+', 'g');
//         const parts = localizedDate.match(localizedNumberPattern);

//         this.partsMap = {
//             yy: parts.indexOf(YY),
//             mm: parts.indexOf(MM),
//             dd: parts.indexOf(DD)
//         }

//         if (options.acceptStandardDigits) {
//             missingDigits += '1234567890';
//         }

//         /** @summary A regex that tests `true` on first invalid character.
//          * @type {RegExp}
//          * @private
//          * @desc Valid characters include:
//          *
//          * * Localized digits
//          * * Standard digits (when `options.acceptStandardDigits` is truthy)
//          * * Localized punctuation to delimit date parts
//          *
//          * Any characters outside this set are considered invalid. Note that this only currently implemented when all three date parts are numeric
//          *
//          * Set by the constructor; consumed by the {@link NumberFormatter#valid|valid} method.
//          *
//          * Testing a string against this pattern yields `true` if at least one invalid character or `false` if all characters are valid.
//          * @memberOf DateFormatter.prototype
//          */
//         this.invalids = new RegExp(
//             '[^' +
//             localizedDate.replace(/-/g, '\\-') +
//             missingDigits +
//             ']'
//         );
//     }

//     /** @summary Tests for invalid characters.
//      * @desc Tests a localized string representation of a number that it contains any invalid characters.
//      *
//      * The date is assumed to contain localized digits and punctuation as would be returned by `Intl.DateFormat` with the given `locale` and `options`. Any other characters are considered invalid.
//      *
//      * However, standard digits and the standard decimal point are also considered valid if the value of `options.acceptStandardDigits` as provided to the constructor was truthy. (Of course, these are always valid for locales that use them.)
//      *
//      * Use this method to:
//      * 1. Filter out invalid characters on a `onkeydown` event; or
//      * 2. Test an edited string prior to calling the {@link module:localization~DateFormatter#parse|parse}.
//      *
//      * NOTE: The current implementation only supports date formats using all numerics (which is the default for `Intl.DateFormat`).
//      *
//      * NOTE: This method does not check grammatical syntax; it only checks for invalid characters.
//      *
//      * @returns Contains only valid characters.
//      * @memberOf DateFormatter.prototype
//      */
//     invalid(value: number) {
//         return this.invalids.test(value);
//     }

//     /**
//      * This method will:
//      * * Convert localized date to Date object.
//      * * "Clean" the string by ignoring all other characters.
//      * * Coerce the string to a number primitive.
//      * @param localizedDate
//      * @throws {string} Invalid date.
//      */
//     parse(localizedDate: string) {
//         let date: Date;
//         const parts = localizedDate.match(this.localizedNumberPattern);

//         if (parts && parts.length === 3) {
//             const y = this.transformNumber(this.digitParser, parts[this.partsMap.yy]);
//             const m = this.transformNumber(this.digitParser, parts[this.partsMap.mm]) - 1;
//             const d = this.transformNumber(this.digitParser, parts[this.partsMap.dd]);

//             date = new Date(y, m, d);
//         } else {
//             throw 'Invalid Date';
//         }

//         return date;
//     }

//     /**
//      * Transform a number to or from a string representation with localized digits.
//      */
//     private transformNumber(value: number) {
//         return value.toString().split('').map((c) => this.formatDigit(c)).join('');
//     }
// }

// export namespace DateFormatter {
//     export interface PartsMap {
//         yy: number,
//         mm: number,
//         dd: number
//     }

//     export interface Options extends Formatter.Options, Intl.DateTimeFormatOptions {
//         acceptStandardDigits?: boolean;
//     }
// }

// export class Localization {
//     readonly locale: string;
//     private _localizerMap = new Map<string, Localization.Localizer>();

//     readonly int: NumberFormatter;
//     readonly float: NumberFormatter;

//     constructor(locale: string, numberOptions: NumberFormatter.Options, dateOptions: DateFormatter.Options) {
//         this.locale = locale;

//         /**
//          * @name number
//          * @see The {@link NumberFormatter|NumberFormatter} class
//          * @memberOf Localization.prototype
//          */
//         this.int = new NumberFormatter('', locale, numberOptions);
//         this.float = this.int;

//         this._localizerMap.set('int', this.int);
//         this._localizerMap.set('float', this.float);

//         const dateFormatter = new DateFormatter('', locale, dateOptions);
//         this._localizerMap.set('date', dateFormatter);
//     }

//     /** @summary Register a localizer.
//      * @desc Checks the provided localizer that it conforms to {@link localizerInterface}
//      * and adds it to the object using localizerName all lower case as the key.
//      * @type {any} // Handle TS bug, remove this issue after resolved {@link https://github.com/microsoft/TypeScript/issues/41672)
//      * @param {string} name
//      * @param {localizerInterface} localizer
//      */
//     add(name: string | Localization.Localizer, localizer?: Localization.Localizer) {
//         if (typeof name === 'object') {
//             localizer = name;
//             name = undefined;
//         }

//         if (
//             typeof localizer !== 'object' ||
//             typeof localizer.format !== 'function' ||
//             typeof localizer.parse !== 'function' ||
//             localizer.invalid && typeof localizer.invalid !== 'function' ||
//             localizer.expectation && typeof localizer.expectation !== 'string'
//         ) {
//             throw 'Expected localizer object to conform to interface.';
//         }

//         name = name ?? localizer.name;
//         name = name && name.toLowerCase();
//         this._localizerMap.set(name, localizer);

//         return localizer;
//     }

//     /**
//      *
//      * @param name - localizer name
//      */
//     get(name: string): Localization.Localizer {
//         return this._localizerMap.get(name && name.toLowerCase()) ?? Localization.string;
//     }
// }

// export namespace Localization {
//     export interface Localizer {
//         format: Localizer.FormatFunction<unknown>;
//         parse: Localizer.ParseFunction<unknown>;
//         invalid?: Localizer.InvalidFunction<unknown>;
//         expectation?: string;
//     }

//     export interface TypedLocalizer<T> extends Localizer {
//         format: Localizer.FormatFunction<T>;
//         parse: Localizer.ParseFunction<T>;
//         invalid?: Localizer.InvalidFunction<T>;
//         expectation?: string;
//     }

//     export namespace Localizer {
//         export type FormatFunction<T> = (value: T, config?: CellRenderer.Config) => string;
//         export type ParseFunction<T> = (value: string) => T;
//         export type InvalidFunction<T> = (value: T) => boolean;
//     }

//     export const nullLocalizer: TypedLocalizer<unknown> = {
//         format(value: unknown) {
//             return value;
//         },
//         parse(str: unknown) {
//             return str;
//         }
//     }

//     export const string: TypedLocalizer<string> = {
//         format(value: string) {
//             return value;
//         },
//         parse(str: string) {
//             return str;
//         }
//     }

//     // Special localizer for use by Chrome's date input control.
//     export const chromeDate: TypedLocalizer<Date | null> = {
//         format(date: Date) {
//             if (date !== null) {
//                 if (typeof date !== 'object') {
//                     date = new Date(date);
//                 }

//                 const yy = date.getFullYear();
//                 const m = date.getMonth() + 1, mm = m < 10 ? '0' + m : m;
//                 const d = date.getDate(), dd = d < 10 ? '0' + d : d;

//                 date = yy + '-' + mm + '-' + dd;
//             } else {
//                 date = null;
//             }
//             return date;
//         },
//         parse(str: string) {
//             let date: Date,
//             const parts = str.split('-');
//             if (parts && parts.length === 3) {
//                 date = new Date(parts[0], parts[1] - 1, parts[2]);
//             } else {
//                 date = null;
//             }
//             return date;
//         }
//     }
// }

export abstract class Formatter {
    constructor(public readonly locale?: string, options?: Formatter.Options) {
        this.expectation = options?.expectation ?? '';
    }

    abstract format(value: unknown): string;
    abstract parse(value: string): unknown;
    expectation: string;
    invalid?(value: unknown): boolean;
}

export namespace Formatter {
    export interface Options {
        expectation?: string;
        // invalid: Localization.Localizer.InvalidFunction<T>;
    }
}

export class StringFormatter extends Formatter {
    override format(value: string) {
        return value;
    }

    override parse(value: string) {
        return value;
    }
}

export namespace StringFormatter {
    export const type = 'string';
}

export class NumberFormatter extends Formatter {
    private _intl: Intl.NumberFormat;
    constructor(locale?: string, options?: NumberFormatter.Options) {
        super(locale, options);
        this._intl = new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions);
    }

    override format(value: number) {
        return this._intl.format(value);
    }

    override parse(value: string) {
        // Needs Intl support
        return new Number(value);
    }
}

export namespace NumberFormatter {
    export const type = 'number';
    export const intType = 'int';
    export const floatType = 'float';

    export interface Options extends Formatter.Options, Intl.NumberFormatOptions {
        acceptStandardDigits?: boolean; // not implemented
    }
}

export class DateFormatter extends Formatter {
    private _intl: Intl.DateTimeFormat;
    constructor(locale?: string, options?: DateFormatter.Options) {
        super(locale, options);
        this._intl = new Intl.DateTimeFormat(locale, options as Intl.DateTimeFormatOptions);
    }

    override format(value: Date) {
        return this._intl.format(value);
    }

    override parse(value: string) {
        // Needs Intl support
        return new Date(value);
    }
}

export namespace DateFormatter {
    export const type = 'date';
    export const chromeType = 'chromeDate'; // might need to create separate formatter for chrome as per previous versions

    export interface Options extends Formatter.Options, Intl.DateTimeFormatOptions {
    }
}

export class Localization {
    private formatterMap = new Map<string, Formatter>();

    readonly stringFormatter: StringFormatter;
    readonly numberFormatter: NumberFormatter;
    readonly dateFormatter: DateFormatter;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(public readonly locale: string, numberOptions: NumberFormatter.Options, dateOptions: DateFormatter.Options) {
        this.stringFormatter = new StringFormatter();
        this.formatterMap.set(StringFormatter.type, this.stringFormatter);
        this.numberFormatter = new NumberFormatter(locale, numberOptions);
        this.formatterMap.set(NumberFormatter.type, this.numberFormatter);
        this.formatterMap.set(NumberFormatter.intType, this.numberFormatter);
        this.formatterMap.set(NumberFormatter.floatType, this.numberFormatter);
        this.dateFormatter = new DateFormatter(locale, dateOptions);
        this.formatterMap.set(DateFormatter.type, this.dateFormatter);
        this.formatterMap.set(DateFormatter.chromeType, this.dateFormatter);

        // this.locale = locale;

        // /**
        //  * @name number
        //  * @see The {@link NumberFormatter|NumberFormatter} class
        //  * @memberOf Localization.prototype
        //  */
        // this.int = new NumberFormatter('', locale, numberOptions);
        // this.float = this.int;

        // this._localizerMap.set('int', this.int);
        // this._localizerMap.set('float', this.float);

        // const dateFormatter = new DateFormatter('', locale, dateOptions);
        // this._localizerMap.set('date', dateFormatter);
    }

    get(name: string | undefined) {
        if (name === undefined) {
            return this.stringFormatter;
        } else {
            const formatter = this.formatterMap.get(name);
            if (formatter === undefined) {
                return this.stringFormatter;
            } else {
                return formatter;
            }
        }
    }
}

export namespace Localization {
    export type FormatFunction = (value: unknown) => string;
}
