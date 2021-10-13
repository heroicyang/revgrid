import { Column, MainDataModel, SchemaModel } from '../dist/types/public-api';
import { MainRecord } from './main-record';
import { SchemaAdapter } from './schema-adapter';

export class MainDataAdapter implements MainDataModel {
    readonly mainDataModel = true;

    private readonly _data: MainRecord[] = [];
    private _fishCreateCount = 0;
    private _dataModelCallbackListener: MainDataModel.CallbackListener;

    constructor() {
        const initialDataCount = MainDataAdapter.initialData.length;
        this._data.length = initialDataCount;
        for (let i = 0; i < initialDataCount; i++) {
            const record = MainDataAdapter.initialData[i];
            record.receiveDate = this.calculateReceiveDate(record.age);
            this._data[i] = record;
        }
    }

    addDataCallbackListener(listener: MainDataModel.CallbackListener) {
        this._dataModelCallbackListener = listener;
    }

    getRowCount() {
        return this._data.length;
    }

    getValue(columnSchema: SchemaModel.Column, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = (columnSchema as SchemaAdapter.Column).name;
        return record[fieldName];
    }

    getRowId?(rowIndex: number): number {
        return this._data[rowIndex].id;
    }

    sort(column: Column) {
        this._dataModelCallbackListener.preReindex();
        try {
            const schemaColumn = column.schemaColumn as SchemaAdapter.Column;
            this._data.sort((left: MainRecord, right: MainRecord) => MainRecord.compareField(schemaColumn.name, left, right));
            this._dataModelCallbackListener.invalidateAll();
        } finally {
            this._dataModelCallbackListener.postReindex();
        }
    }

    deleteRow(rowIndex: number) {
        this._data.splice(rowIndex, 1);
        this._dataModelCallbackListener.rowsDeleted(rowIndex, 1);
    }

    addFish() {
        const insertCount = 20;
        const insertIndex = this._data.length;
        let index = insertIndex;
        this._data.length += insertCount;
        for (let i = 0; i < insertCount; i++) {
            const record = this.createFishRecord(index);
            this._data[index++] = record;
        }

        this._dataModelCallbackListener.rowsInserted(insertIndex, insertCount);
    }

    private createFishRecord(index: number): MainRecord {
        const age = Math.round(0.2 + Math.random() * 100) / 100;
        const receiveDate = this.calculateReceiveDate(age);
        return {
            id: index,
            name: 'Bubbles' + (++this._fishCreateCount).toString(),
            type: 'Fish',
            color: 'Grey',
            age,
            receiveDate,
            favoriteFood: 'Pellets',
            restrictMovement: true,
        }
    }

    private calculateReceiveDate(age: number) {
        const ageInMilliseconds = age * 1000 * 60 * 60 * 24 * 365;
        return new Date(Date.now() - ageInMilliseconds);
    }
}

export namespace MainDataAdapter {
    const dummyDate = new Date();

    export const initialData: MainRecord[] = [
        {
            id: 0,
            name: 'Rover',
            type: 'Dog',
            color: 'red',
            age: 5,
            receiveDate: dummyDate,
            favoriteFood: 'meat',
            restrictMovement: true,
        },
        {
            id: 1,
            name: 'Moggie',
            type: 'Cat',
            color: 'white and black',
            age: 7,
            receiveDate: dummyDate,
            favoriteFood: 'gravied meat',
            restrictMovement: false,
        },
        {
            id: 2,
            name: 'Tweets',
            type: 'Canary',
            color: 'yellow',
            age: 0.5,
            receiveDate: dummyDate,
            favoriteFood: 'pellets',
            restrictMovement: true,
        },
    ];
}
