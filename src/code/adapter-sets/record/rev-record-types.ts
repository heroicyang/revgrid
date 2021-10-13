
/** Represents an index to a defined Field
 * @public
 */
export type RevRecordFieldIndex = number;

/** Represents an index to a Record
 * @public
 */
export type RevRecordIndex = number;

/** @public */
export const enum RevRecordValueRecentChangeTypeId {
    Update,
    Increase,
    Decrease,
}

/** @public */
export const enum RevRecordRecentChangeTypeId {
    Update,
    Insert,
    Remove,
}

/** @public */
export interface RevRecordInvalidatedValue {
    fieldIndex: RevRecordFieldIndex,
    typeId?: RevRecordValueRecentChangeTypeId;
}

/** @public */
export namespace RevRecordSysTick {
	export type Time = number;
	export type Span = number;

	export function now(): Time {
		return performance.now();
	}

	export function compare(left: Time, right: Time): number {
		return right - left;
	}
}

