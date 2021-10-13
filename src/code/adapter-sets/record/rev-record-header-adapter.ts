import { DataModel } from '../../grid/grid-public-api';
import { RevRecordFieldAdapter } from './rev-record-field-adapter';

/** @public */
export class RevRecordHeaderAdapter implements DataModel {

    private _dataCallbackListener: DataModel.CallbackListener;

    addDataCallbackListener(value: DataModel.CallbackListener): void {
        this._dataCallbackListener = value;
    }

    getValue(schemaColumn: RevRecordFieldAdapter.SchemaColumn): string {
        return schemaColumn.header;
    }

    getRowCount() {
        return 1;
    }

    invalidateCell(schemaColumnIndex: number) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, 0);
    }
}
