import { MainRecord } from 'main-record';
import { SchemaModel } from '../dist/types/public-api';

export class SchemaAdapter implements SchemaModel {
    private _callbackListener: SchemaModel.CallbackListener;

    getSchema() {
        return SchemaAdapter.schema;
    }

    addSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        this._callbackListener = listener;

        this._callbackListener.schemaChanged();
    }
}

export namespace SchemaAdapter {
    export interface Column extends SchemaModel.Column {
        name: keyof MainRecord;
        index: number;
        header: string;
    }

    export const schema: Column[] = [
        {
            name: 'name',
            index: 0,
            header: 'Name',
        },
        {
            name: 'type',
            index: 1,
            header: 'Type',
        },
        {
            name: 'color',
            index: 2,
            header : 'Color',
        },
        {
            name: 'age',
            index: 3,
            header: 'Age',
        },
        {
            name: 'receiveDate',
            index: 4,
            header: 'Receive Date',
        },
        {
            name: 'favoriteFood',
            index: 5,
            header: 'Favorite Food',
        },
        {
            name: 'restrictMovement',
            index: 6,
            header: 'Restrict Movement',
        },
    ];
}
