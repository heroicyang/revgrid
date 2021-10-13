import { RevRecordField } from './rev-record-field';

/** Provides access to a field
 * @public
 */
export abstract class RevRecordFunctionizeField implements RevRecordField {
    constructor(public readonly name: string) {
    }

    getFieldValue: (this: void, record: never) => unknown;
    compareField: (this: void, left: never, right: never) => number;
    compareFieldDesc: (this: void, left: never, right: never) => number;
}

/**
 * Provides a simple field accessor
 * @public
 */
export class RevRecordSimpleFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => unknown,
        compare?: (left: Record, right: Record) => number, compareDesc?: (left: Record, right: Record) => number) {
        super(name);

        this.getFieldValue = value;

        if (compare !== undefined) {
            this.compareField = compare;

            if (compareDesc === undefined) {
                compareDesc = (left, right) => -compare(left, right);
            }

            this.compareFieldDesc = compareDesc;
        }
    }
}

/**
 * Provides a numeric field accessor with sorting
 * @public
 */
export class RevRecordNumericFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => number) {
        super(name);

        this.getFieldValue = value;

        this.compareField = (left: Record, right: Record) => value(right) - value(left);
        this.compareFieldDesc = (left: Record, right: Record) => value(left) - value(right);
    }
}

/**
 * Provides a string field accessor with basic sorting
 * @public
 */
export class RevRecordStringFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => string, options?: Intl.CollatorOptions) {
        super(name);

        this.getFieldValue = value;

        this.compareField = (left: Record, right: Record) => value(right).localeCompare(value(left), undefined, options);
        this.compareFieldDesc = (left: Record, right: Record) => value(left).localeCompare(value(right), undefined, options);
    }
}

/**
 * Provides a date field accessor with basic sorting
 * @public
 */
export class RevRecordDateFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => Date, /*options?: Intl.CollatorOptions*/) {
        super(name);

        this.getFieldValue = value;

        this.compareField = (left: Record, right: Record) => value(right).getTime() - value(left).getTime();
        this.compareFieldDesc = (left: Record, right: Record) => value(left).getTime() - value(right).getTime();
    }
}
