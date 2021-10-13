import { DataModel } from '../../grid/grid-public-api';
import { RevRecord } from './rev-record';

/** Provides access to a field
 * @public
 */
export interface RevRecordField {
    readonly name: string;
    /**
     * Retrieves the value of a field for display purposes
     * @param record - The record to compare to
     * Can be undefined to show the record index instead
     */
    getFieldValue?(record: RevRecord): DataModel.DataValue;

    /**
     * Compares two records based on this field for sorting in ascending order
     * @param left - The record on the left of the comparison
     * @param right - The record on the right of the comparison
     * Can be undefined to disable sorting based on this field
     */
    compareField?(left: RevRecord, right: RevRecord): number;

    /**
     * Compares two records based on this field for sorting in descending order
     * @param left - The record on the left of the comparison
     * @param right - The record on the right of the comparison
     * Can be undefined to disable sorting based on this field
     */
    compareFieldDesc?(left: RevRecord, right: RevRecord): number;
}

/** @public */
export namespace RecordField {
    export type Comparer = (this: void, left: RevRecord, right: RevRecord) => number;
}

