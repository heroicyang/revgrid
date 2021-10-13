import { RevRecord, RevRecordData } from './rev-record';
import { RevRecordIndex } from './rev-record-types';

/**
 * An interface for providing access to records in a data store. Called by the Grid Adapter to retrieve data to display.
 * @public
 */
export interface RevRecordStore {
    /**
     * Gets the value of a record
     * @param index - The record index
     */
    getRecord(index: RevRecordIndex): RevRecord;

    /**
     * Retrieves the underlying records
     * @returns An array of the currently available records
     * The Grid Adapter will not modify the returned array
     */
    getRecords(): readonly RevRecord[];

    /** Get the number of current records available */
    readonly recordCount: number;
}

/** @public */
export interface RevRecordDataStore {
    revRecordData: true;

    /**
     * Gets the value of a record
     * @param index - The record index
     */
    getRecord(index: RevRecordIndex): RevRecordData;

    /**
     * Retrieves the underlying records
     * @returns An array of the currently available records
     * The Grid Adapter will not modify the returned array
     */
    getRecords(): readonly RevRecordData[];

    /** Get the number of current records available */
    readonly recordCount: number;
}
