import { AssertError, DataModel, MainDataModel, MetaModel, SchemaModel } from '../../grid/grid-public-api';

export class MainSimpleAdapter implements MainDataModel {
    public readonly mainDataModel = true;

    private _data: MainSimpleAdapter.DataRow[] = [];
    private _callbackListeners: DataModel.CallbackListener[] = [];

    addDataCallbackListener(listener: DataModel.CallbackListener) {
        this._callbackListeners.push(listener)
    }

    removeDataCallbackListener(listener: DataModel.CallbackListener) {
        const idx = this._callbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('MSARDCL65539', 'MainStaticAdapter: CallbackListener not found');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    beginDataChange() {
        this._callbackListeners.forEach((listener) => listener.beginChange());
    }

    endDataChange() {
        this._callbackListeners.forEach((listener) => listener.endChange());
    }

    reset(data: MainSimpleAdapter.DataRow[]) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         */
        this._data = data;
        this._callbackListeners.forEach((listener) => listener.invalidateAll());
    }

    // setData(data: LocalDataRowObject[] | (() => LocalDataRowObject[]), apply?: boolean) {
    //     // if (!this.behavior) {
    //     //     this.setBehavior(options);
    //     // }
    //     // this.behavior.setData(data, apply);

    //     if (data === undefined) {
    //         return;
    //     } else {
    //         const dataRows = typeof data === 'function' ? data() : data;

    //         if (!Array.isArray(dataRows)) {
    //             throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
    //         } else {
    //             // Inform interested subgrids of data.
    //             this.mainDataModel.setData(dataRows);
    //             this._columnsManager.schemaModel = this.mainDataModel as LocalMainDataSource;
    //             this._modelCallbackManager.setSchemaModel(this._columnsManager.schemaModel);
    //             // The following should be moved to DataModel notfication
    //             if (this.cellEditor) {
    //                 this.cellEditor.cancelEditing();
    //             }

    //             if (apply === true) { // default is `true`
    //                 this.reindex();
    //             }

    //             this.allowEvents(this.getRowCount() > 0);
    //         }
    //     }
    //     this.behaviorShapeChanged();
    // }


    getRow(index: number) {
        return this._data[index];
    }

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setRow(index: number, dataRow: MainSimpleAdapter.DataRow) {
        this._data[index] = dataRow || undefined;
        this._callbackListeners.forEach((listener) => listener.invalidateRow(index));
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     */
    getRowMetadata(index: number, prototype?: null) {
        const dataRow = this._data[index];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    }

    setRowMetadata(index: number, metadata: MetaModel.RowMetadata) {
        const dataRow = this._data[index];
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
    }

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param index - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     */
    addRow(dataRow: MainSimpleAdapter.DataRow): void;
    addRow(index: number, dataRow: MainSimpleAdapter.DataRow): void;
    addRow(indexOrDataRow: number | MainSimpleAdapter.DataRow, dataRowOrUndefined?: MainSimpleAdapter.DataRow): void {
        const rowCount = this.getRowCount();
        let index: number;
        let dataRow: MainSimpleAdapter.DataRow;
        if (typeof indexOrDataRow === 'number') {
            index = indexOrDataRow;
            dataRow = dataRowOrUndefined as MainSimpleAdapter.DataRow;
        } else {
            index = rowCount;
            dataRow = indexOrDataRow;
        }

        if (index >= rowCount) {
            index = rowCount;
            this._data.push(dataRow);
        } else {
            this._data.splice(index, 0, dataRow);
        }

        this._callbackListeners.forEach((listener) => listener.rowsInserted(index, 1));
    }

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     */
    delRow(index: number, count = 1) {
        const rows = this._data.splice(index, count === undefined ? 1 : count);
        if (rows.length) {
            this._callbackListeners.forEach((listener) => listener.invalidateRows(index, count));
        }
        return rows;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     */
    getValue(schemaColumn: SchemaModel.Column, y: number) {
        const row = this._data[y];
        if (!row) {
            return null;
        }
        return row[schemaColumn.name];
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     */
    setValue(schemaColumn: SchemaModel.Column, y: number, value: unknown) {
        this._data[y][schemaColumn.name] = value;
        this._callbackListeners.forEach((listener) => listener.invalidateCell(schemaColumn.index, y));
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     */
    getRowCount() {
        return this._data.length;
    }
}

/**
 * @desc A data row representation.
 * The properties of this object are the data fields.
 * The property keys are the column names
 * First row is header
 * All row objects should be congruent, meaning that each data row should have the same property keys.
 */

export namespace MainSimpleAdapter {
    export interface DataRow extends DataModel.ObjectDataRow {
        [columnName: string]: DataModel.DataValue;
        __META?: MetaModel.RowMetadata;
    }
}
