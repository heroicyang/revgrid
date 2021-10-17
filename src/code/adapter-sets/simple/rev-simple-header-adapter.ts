
import { AssertError, DataModel } from '../../grid/grid-public-api';
import { SchemaStaticAdapter } from './rev-simple-schema-adapter';

export class HeaderSimpleAdapter implements DataModel {

    private _rowCount = 0;
    private _callbackListeners: DataModel.CallbackListener[] = [];

    addDataCallbackListener(listener: DataModel.CallbackListener) {
        this._callbackListeners.push(listener)
    }

    removeDataCallbackListener(listener: DataModel.CallbackListener) {
        const idx = this._callbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('HSARDCL65539', 'HeaderStaticAdapter: CallbackListener not found');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return this._rowCount;
    }

    getValue(schemaColumn: SchemaStaticAdapter.Column, rowIndex: number) {
        const headers = schemaColumn.headers;
        if (rowIndex >= headers.length) {
            return schemaColumn.name;
        } else {
            return headers[rowIndex];
        }
    }

    reset(rowCount: number) {
        this._rowCount = rowCount;
        this._callbackListeners.forEach((listener) => listener.rowsLoaded());
    }
}
