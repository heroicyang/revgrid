import { RevRecordField } from './rev-record-field';

/** Provides access to a field
 * @public
 */
export abstract class RevRecordFunctionizeField implements RevRecordField {
    constructor(public readonly name: string) {
    }

    getValue: (this: void, record: never) => unknown;
    compare: (this: void, left: never, right: never) => number;
    compareDesc: (this: void, left: never, right: never) => number;
}

/**
 * Provides a simple field accessor
 * @public
 */
export class RevRecordSimpleFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => unknown,
        compare?: (left: Record, right: Record) => number, compareDesc?: (left: Record, right: Record) => number) {
        super(name);

        this.getValue = value;

        if (compare !== undefined) {
            this.compare = compare;

            if (compareDesc === undefined) {
                compareDesc = (left, right) => -compare(left, right);
            }

            this.compareDesc = compareDesc;
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

        this.getValue = value;

        this.compare = (left: Record, right: Record) => value(right) - value(left);
        this.compareDesc = (left: Record, right: Record) => value(left) - value(right);
    }
}

/**
 * Provides a string field accessor with basic sorting
 * @public
 */
export class RevRecordStringFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => string, options?: Intl.CollatorOptions) {
        super(name);

        this.getValue = value;

        this.compare = (left: Record, right: Record) => value(right).localeCompare(value(left), undefined, options);
        this.compareDesc = (left: Record, right: Record) => value(left).localeCompare(value(right), undefined, options);
    }
}

/**
 * Provides a date field accessor with basic sorting
 * @public
 */
export class RevRecordDateFunctionizeField<Record> extends RevRecordFunctionizeField {
    constructor(name: string, value: (record: Record) => Date, /*options?: Intl.CollatorOptions*/) {
        super(name);

        this.getValue = value;

        this.compare = (left: Record, right: Record) => value(right).getTime() - value(left).getTime();
        this.compareDesc = (left: Record, right: Record) => value(left).getTime() - value(right).getTime();
    }
}
