import { RevRecord, RevRecordData } from './rev-record';
import { RevRecordField } from './rev-record-field';
import { RevRecordFieldIndex, RevRecordIndex, RevRecordInvalidatedValue, RevRecordValueRecentChangeTypeId } from './rev-record-types';

/**
 * An interface for providing access to records in a data store. Called by the Grid Adapter to retrieve data to display.
 * @public
 */
export interface RevRecordStore {
    setFieldEventers(fieldsEventers: RevRecordStore.FieldsEventers): void;
    setRecordEventers(recordsEventers: RevRecordStore.RecordsEventers): void;

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
export namespace RevRecordStore {
    export interface FieldsEventers {
        beginChange(): void;
        endChange(): void;

        addField(field: RevRecordField, header: string): RevRecordField.SchemaColumn;
        addFields(fields: RevRecordField[]): RevRecordFieldIndex;
    }

    export interface RecordsEventers {
        beginChange(): void;
        endChange(): void;

        allRecordsDeleted(): void;
        recordDeleted(recordIndex: RevRecordIndex): void;
        recordsDeleted(recordIndex: number, count: number): void;
        recordInserted(recordIndex: RevRecordIndex, recent?: boolean): void;
        recordsInserted(firstInsertedRecordIndex: RevRecordIndex, count: number, recent?: boolean): void;
        recordsSpliced(recordIndex: RevRecordIndex, deleteCount: number, insertCount: number): void;
        recordsLoaded(recent?: boolean): void;

        invalidateAll(): void;
        invalidateRecord(recordIndex: RevRecordIndex, recent?: boolean): void;
        invalidateRecords(recordIndex: RevRecordIndex, count: number, recent?: boolean): void;
        invalidateValue(
            fieldIndex: RevRecordFieldIndex,
            recordIndex: RevRecordIndex,
            valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId
        ): void;
        invalidateRecordValues(recordIndex: RevRecordIndex, invalidatedValues: RevRecordInvalidatedValue[]): void;
        invalidateRecordFields(recordIndex: RevRecordIndex, fieldIndex: RevRecordFieldIndex, fieldCount: number): void;
        invalidateRecordAndValues(
            recordIndex: RevRecordIndex,
            invalidatedValues: RevRecordInvalidatedValue[],
            recordUpdateRecent?: boolean
        ): void;
        invalidateFiltering(): void;
        invalidateFields(fieldIndexes: RevRecordFieldIndex[]): void;
    }
}

/** @public */
export interface RevRecordDataStore extends RevRecordStore {
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
}
