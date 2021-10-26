import { DataModel } from '../../grid/grid-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderAdapter implements DataModel {

    private _dataCallbackListener: DataModel.CallbackListener;

    addDataCallbackListener(value: DataModel.CallbackListener): void {
        this._dataCallbackListener = value;
    }

    getValue(schemaColumn: RevRecordField.SchemaColumn): string {
        return schemaColumn.header;
    }

    getRowCount() {
        return 1;
    }

    invalidateCell(schemaColumnIndex: number) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, 0);
    }
}
