import {
    DataModel,
    RevRecordData,
    RevRecordDateFunctionizeField,
    RevRecordField,
    RevRecordFieldIndex,
    RevRecordIndex,
    RevRecordNumericFunctionizeField,
    RevRecordSimpleFunctionizeField,
    RevRecordStore,
    RevRecordStringFunctionizeField,
    RevRecordValueRecentChangeTypeId
} from "..";

export class RecordStore implements RevRecordStore {
    private _records: RecordStore.Record[] = [];
    // private _fieldsEventers!: RevRecordStore.FieldsEventers;
    private _recordsEventers!: RevRecordStore.RecordsEventers;

    constructor() {
        for (let I = 0; I < RecordStore.initialValues.length; I++) {
            this._records.push(RecordStore.Record.createCopy(RecordStore.initialValues[I]));
        }
    }

    setFieldEventers(fieldsEventers: RevRecordStore.FieldsEventers): void {
        // this._fieldsEventers = fieldsEventers;

        fieldsEventers.beginChange();
        try {
            // Define the fields used by this grid
            for (const field of RecordStore.fieldDefinitions) {
                fieldsEventers.addField(field, field.name);
            }
        } finally {
            fieldsEventers.endChange();
        }
    }

    setRecordEventers(recordsEventers: RevRecordStore.RecordsEventers): void {
        this._recordsEventers = recordsEventers;

        const recordCount = this._records.length;
        if (recordCount > 0) {
            recordsEventers.recordsInserted(0, recordCount);
        }
    }

    getRecord(index: RevRecordIndex): RecordStore.Record {
        return this._records[index];
    }

    getRecords(): RecordStore.Record[] {
        return this._records;
    }

    get recordCount(): number {
        return this._records.length;
    }

    addRecordData(data: RecordStore.Record.Data): void {
        const index = this._records.length;
        const record: RecordStore.Record = {
            index,
            data,
        }
        this._records.push(record);
    }

    clearRecords(): void {
        this._records.length = 0;
        this.eventifyAllRecordsDeleted();
    }

    deleteRecord(index: number, eventify: boolean): void {
        this._records.splice(index, 1);
        this.reindex(index);

        if (eventify) {
            this.eventifyRecordDeleted(index);
        }
    }

    deleteRecords(index: number, count: number): void {
        this._records.splice(index, count);
        this.reindex(index);

        this._recordsEventers.recordsDeleted(index, count);
    }

    insertRecord(index: number, data: RecordStore.Record.Data, recent: boolean, eventify: boolean): void {
        const record: RecordStore.Record = {
            index,
            data,
        }
        this._records.splice(index, 0, record);
        this.reindex(index + 1);

        if (eventify) {
            this.eventifyRecordInserted(index, recent);
        }
    }

    insertRecords(index: number, recordDatas: RecordStore.Record.Data[], recent: boolean): void {
        const count = recordDatas.length;
        const records = new Array<RecordStore.Record>(count);
        for (let i = 0; i < count; i++) {
            records[i] = {
                index: index + i,
                data: recordDatas[i],
            };
        }

        this._records.splice(index, 0, ...records);
        this.reindex(index + count);

        this._recordsEventers.recordsInserted(index, count, recent);
    }

    modifyValue(field: RevRecordField, recIdx: number): RevRecordValueRecentChangeTypeId | undefined {
        const record = this._records[recIdx];

        switch (field) {
            case RecordStore.intValGridField: {
                const newValue = Math.floor(Math.random() * 200);
                const valueRecentChangeTypeId = this.calculateNumberValueRecentChangeId(record.data[RecordStore.Record.Data.intValIndex], newValue);
                if (valueRecentChangeTypeId !== undefined) {
                    record.data[RecordStore.Record.Data.intValIndex] = newValue;
                }
                return valueRecentChangeTypeId;
            }
            case RecordStore.strValGridField: {
                const newValue = 'Mod' + this.generateRandomString();
                const valueRecentChangeTypeId = this.calculateStringValueRecentChangeId(record.data[RecordStore.Record.Data.strValIndex], newValue);
                if (valueRecentChangeTypeId !== undefined) {
                    record.data[RecordStore.Record.Data.strValIndex] = newValue;
                }
                return valueRecentChangeTypeId;
            }
            case RecordStore.numberValGridField: {
                const newValue = Math.random() * 10000 / 300.0;
                const valueRecentChangeTypeId = this.calculateNumberValueRecentChangeId(record.data[RecordStore.Record.Data.numberValIndex], newValue);
                if (valueRecentChangeTypeId !== undefined) {
                    record.data[RecordStore.Record.Data.numberValIndex] = newValue;
                }
                return valueRecentChangeTypeId;
            }
            case RecordStore.dateValGridField: {
                const newValue = new Date(2018, 5, Math.floor(Math.random() * 12));
                const valueRecentChangeTypeId = this.calculateNumberValueRecentChangeId(record.data[RecordStore.Record.Data.dateValIndex].getTime(), newValue.getTime());
                if (valueRecentChangeTypeId !== undefined) {
                    record.data[RecordStore.Record.Data.dateValIndex] = newValue;
                }
                return valueRecentChangeTypeId;
            }
            case RecordStore.statusIdValGridField: {
                const newValue = Math.floor(Math.random() * 5) as RecordStore.TDataItemStatusId;
                const valueRecentChangeTypeId = RevRecordValueRecentChangeTypeId.Update;
                if (valueRecentChangeTypeId !== undefined) {
                    record.data[RecordStore.Record.Data.statusIdIndex] = newValue;
                }
                return valueRecentChangeTypeId;
            }
            default:
                return undefined;
        }
    }

    beginChange(): void {
        this._recordsEventers.beginChange();
    }

    endChange(): void {
        this._recordsEventers.endChange();
    }

    invalidateAll(): void {
        this._recordsEventers.invalidateAll();
    }

    invalidateRecord(index: number): void {
        this._recordsEventers.invalidateRecord(index);
    }

    invalidateValue(fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex, valueRecentChangeTypeId: RevRecordValueRecentChangeTypeId): void {
        this._recordsEventers.invalidateValue(fieldIndex, recordIndex, valueRecentChangeTypeId);
    }

    eventifyRecordsInserted(idx: number, count: number, recent: boolean): void {
        this._recordsEventers.recordsInserted(idx, count, recent);
    }

    eventifyRecordDeleted(idx: number): void {
        this._recordsEventers.recordDeleted(idx);
    }

    private calculateNumberValueRecentChangeId(oldValue: number, newValue: number) {
        if (newValue === oldValue) {
            return undefined;
        } else {
            return newValue > oldValue ? RevRecordValueRecentChangeTypeId.Increase : RevRecordValueRecentChangeTypeId.Decrease;
        }
    }

    private calculateStringValueRecentChangeId(oldValue: string, newValue: string) {
        if (newValue === oldValue) {
            return undefined;
        } else {
            return newValue > oldValue ? RevRecordValueRecentChangeTypeId.Increase : RevRecordValueRecentChangeTypeId.Decrease;
        }
    }

    private generateRandomString(): string {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let result = '';
        for (let i = 0; i < 5; i++) {
            result += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return result;
    }

    private reindex(fromIndex: number) {
        const count = this._records.length;
        for (let i = fromIndex; i < count; i++) {
            this._records[i].index = i;
        }
    }

    private eventifyRecordInserted(idx: number, recent: boolean): void {
        this._recordsEventers.recordInserted(idx, recent);
    }

    private eventifyAllRecordsDeleted() {
        this._recordsEventers.allRecordsDeleted();
    }
}

export namespace RecordStore {
    export type Integer = number;

    export const enum TDataItemStatusId {
        dsInactive,
        dsError,
        dsOffline,
        dsNotSynchronised,
        dsSynchronised,
    }

    export interface Record extends RevRecordData {
        index: number;
        data: Record.Data;
    }

    export namespace Record {
        export type Data = [intVal: Integer, strVal: string, dblVal:number, dateVal: Date, statusId: TDataItemStatusId];
        export namespace Data {
            export const intValIndex = 0;
            export const strValIndex = 1;
            export const numberValIndex = 2;
            export const dateValIndex = 3;
            export const statusIdIndex = 4;
        }

        export function createCopy(value: Record): Record {
            return {
                index: value.index,
                data: [...value.data],
            }
        }
    }

    export const initialValues: Record[] = [
        {
            index: 0,
            data: [
                31,
                "Thirtyone",
                62.3,
                new Date(2010, 2, 23),
                TDataItemStatusId.dsError
            ],
        },
        {
            index: 1,
            data: [
                0,
                "Zero",
                1246.356,
                new Date(1850, 1, 19),
                TDataItemStatusId.dsInactive
            ],
        },
        {
            index: 2,
            data: [
                900,
                "Nine Hundred",
                899.99,
                new Date(2040, 11, 1),
                TDataItemStatusId.dsNotSynchronised
            ],
        },
        {
            index: 3,
            data: [
                -80,
                "Minus Eighty",
                -8345.5,
                new Date(2010, 2, 23),
                TDataItemStatusId.dsOffline
            ],
        },
        {
            index: 4,
            data: [
                1345987,
                "Big",
                12e6,
                new Date(1950, 6, 6),
                TDataItemStatusId.dsSynchronised
            ],
        },
    ];

    abstract class BaseGridField implements RevRecordField {
        constructor(readonly name: string) {}
        abstract getValue(record: Record): DataModel.DataValue;
    }

    export class RecordIndexGridField extends BaseGridField {
        constructor() {
            super("RecIndex");
        }

        getValue(record: Record): DataModel.DataValue {
            return record.index;
        }
    }

    export class IntValGridField extends BaseGridField {
        constructor() {
            super("IntVal");
        }

        getValue(record: Record): DataModel.DataValue {
            return record.data[RecordStore.Record.Data.intValIndex];
        }

        compare(left: Record, right: Record): number {
            return right.data[RecordStore.Record.Data.intValIndex] - left.data[RecordStore.Record.Data.intValIndex];
        }

        compareDesc(left: Record, right: Record): number {
            return left.data[RecordStore.Record.Data.intValIndex] - right.data[RecordStore.Record.Data.intValIndex];
        }
    }

    export class StrValGridField extends BaseGridField {
        constructor() {
            super("fiStrVal");
        }

        getValue(record: Record): DataModel.DataValue {
            return record.data[RecordStore.Record.Data.strValIndex];
        }

        compare(left: Record, right: Record): number {
            return right.data[RecordStore.Record.Data.strValIndex].localeCompare(left.data[RecordStore.Record.Data.strValIndex]);
        }

        compareDesc(left: Record, right: Record): number {
            return left.data[RecordStore.Record.Data.strValIndex].localeCompare(right.data[RecordStore.Record.Data.strValIndex]);
        }
    }

    // Here, we implement these as new classes
    export const recordIndexGridField: RevRecordField = new RecordIndexGridField();
    export const intValGridField: RevRecordField = new IntValGridField();
    export const strValGridField: RevRecordField = new StrValGridField();
    // Or we have a helper class that lets you specify a name and function for GetFieldValue
    export const numberValGridField = new RevRecordNumericFunctionizeField<Record>(
        "fiDblVal",
        (record) => record.data[RecordStore.Record.Data.numberValIndex]
    );
    export const dateValGridField = new RevRecordDateFunctionizeField<Record>(
        "fiDateVal",
        (record) => record.data[RecordStore.Record.Data.dateValIndex]
    );
    export const statusIdValGridField = new RevRecordSimpleFunctionizeField<Record>(
        "fiStatusIdVal",
        (record) => record.data[RecordStore.Record.Data.statusIdIndex],
        (left, right) => right.data[RecordStore.Record.Data.statusIdIndex] - left.data[RecordStore.Record.Data.statusIdIndex]
    );
    export const hiddenStrValGridField = new RevRecordStringFunctionizeField<Record>(
        "fiHidden",
        (record) => record.data[RecordStore.Record.Data.strValIndex]
    );

    export const fieldDefinitions: RevRecordField[] = [
        recordIndexGridField,
        hiddenStrValGridField,
        intValGridField,
        strValGridField,
        numberValGridField,
        dateValGridField,
        statusIdValGridField,
    ];
}
