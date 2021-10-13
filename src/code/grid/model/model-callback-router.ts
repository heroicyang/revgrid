import { EventDetail } from '../event/event-detail';
import { EventName } from '../event/event-name';
import { GridProperties } from '../grid-properties';
import { DataModel } from './data-model';
import { MainDataModel } from './main-data-model';
import { ModelUpdateId, SchemaModel } from './schema-model';

export class ModelCallbackRouter {
    getLastModelUpdateIdEvent: ModelCallbackRouter.GetLastModelUpdateIdEvent;
    // updateModelIdEvent: ModelChangeConsolidator.UpdateModelIdEvent;

    beginSchemaChangeEvent: ModelCallbackRouter.BeginSchemaChangeEvent;
    endSchemaChangeEvent: ModelCallbackRouter.EndSchemaChangeEvent;

    columnsInsertedEvent: ModelCallbackRouter.ColumnsInsertedEvent;
    columnsDeletedEvent: ModelCallbackRouter.ColumnsDeletedEvent;
    allColumnsDeletedEvent: ModelCallbackRouter.AllColumnsDeletedEvent;
    schemaChangedEvent: ModelCallbackRouter.SchemaChangedEvent;
    getActiveSchemaColumnsEvent: ModelCallbackRouter.GetActiveSchemaColumnsEvent;

    beginDataChangeEvent: ModelCallbackRouter.BeginDataChangeEvent;
    endDataChangeEvent: ModelCallbackRouter.EndDataChangeEvent;

    rowsInsertedEvent: ModelCallbackRouter.RowsInsertedEvent;
    rowsDeletedEvent: ModelCallbackRouter.RowsDeletedEvent;
    allRowsDeletedEvent: ModelCallbackRouter.AllRowsDeletedEvent;
    rowCountChangedEvent: ModelCallbackRouter.RowCountChangedEvent;
    rowsMovedEvent: ModelCallbackRouter.RowsMovedEvent;
    invalidateAllEvent: ModelCallbackRouter.InvalidateAllEvent;
    invalidateRowsEvent: ModelCallbackRouter.InvalidateRowsEvent;
    invalidateRowEvent: ModelCallbackRouter.InvalidateRowEvent;
    invalidateRowColumnsEvent: ModelCallbackRouter.InvalidateRowColumnsEvent;
    invalidateRowCellsEvent: ModelCallbackRouter.InvalidateRowCellsEvent;
    invalidateCellEvent: ModelCallbackRouter.InvalidateCellEvent;
    preReindexEvent: ModelCallbackRouter.PreReindexEvent;
    postReindexEvent: ModelCallbackRouter.PostReindexEvent;

    gridEvent: ModelCallbackRouter.GridEvent;

    private _destroyed = false;
    private _schemaModel: SchemaModel | undefined;
    private _schemaCallbackListenerAdded = false;
    private _registeredDataModels = new Array<ModelCallbackRouter.RegisteredDataModel>();

    /** @internal */
    private readonly schemaModelCallbackListener: SchemaModel.CallbackListener = {
        beginChange: () => this.handleBeginSchemaChange(),
        endChange: () => this.handleEndSchemaChange(),
        columnsInserted: (columnIndex, columnCount) => this.handleColumnsInserted(columnIndex, columnCount),
        columnsDeleted: (columnIndex, columnCount) => this.handleColumnsDeleted(columnIndex, columnCount),
        allColumnsDeleted: () => this.handleAllColumnsDeleted(),
        schemaChanged: () => this.handleSchemaChanged(),
        getActiveSchemaColumns: () => this.handleGetActiveSchemaColumns(),
    }

    constructor(private readonly _gridProperties: GridProperties) {
    }

    destroy() {
        this.reset();

        this._destroyed = true;
    }

    reset() {
        for (const registeredDataModel of this._registeredDataModels) {
            const callbackListener = registeredDataModel.callbackListener;
            if (callbackListener !== undefined) {
                const dataModel = registeredDataModel.dataModel;
                if (dataModel.removeDataCallbackListener !== undefined) {
                    dataModel.removeDataCallbackListener(callbackListener);
                }
            }
        }

        if (this._schemaModel !== undefined) {
            if (this._schemaCallbackListenerAdded && this._schemaModel.removeSchemaCallbackListener !== undefined) {
                this._schemaModel.removeSchemaCallbackListener(this.schemaModelCallbackListener);
                this._schemaCallbackListenerAdded = false;
            }
            this._schemaModel = undefined;
        }
    }

    setSchemaModel(schemaModel: SchemaModel) {
        this._schemaModel = schemaModel;
        if (this._schemaModel.addSchemaCallbackListener !== undefined) {
            this._schemaModel.addSchemaCallbackListener(this.schemaModelCallbackListener);
            this._schemaCallbackListenerAdded = true;
        }
    }

    registerDataModel(dataModel: DataModel) {
        const index = this._registeredDataModels.length;

        let callbackListener: DataModel.CallbackListener | undefined;
        if (dataModel.addDataCallbackListener !== undefined) {
            callbackListener = {
                beginChange: () => this.handleBeginDataChange(),
                endChange: () => this.handleEndDataChange(),
                rowsInserted: (rowIndex, rowCount) => this.handleRowsInserted(dataModel, rowIndex, rowCount),
                rowsDeleted: (rowIndex, rowCount) => this.handleRowsDeleted(dataModel, rowIndex, rowCount),
                allRowsDeleted: () => this.handleAllRowsDeleted(dataModel),
                rowCountChanged: () => this.handleRowCountChanged(dataModel),
                rowsMoved: (oldRowIndex, newRowIndex, rowCount) => this.handleRowsMoved(dataModel, oldRowIndex, newRowIndex, rowCount),
                invalidateAll: () => this.handleInvalidateAll(),
                invalidateRows: (rowIndex, count) => this.handleInvalidateRows(rowIndex, count),
                invalidateRow: (rowIndex) => this.handleInvalidateRow(rowIndex),
                invalidateRowColumns: (rowIndex, schemaColumnIndex, columnCount) =>
                    this.handleInvalidateRowColumns(rowIndex, schemaColumnIndex, columnCount),
                invalidateRowCells: (rowIndex, schemaColumnIndexes) => this.handleInvalidateRowCells(rowIndex, schemaColumnIndexes),
                invalidateCell: (schemaColumnIndex, rowIndex) => this.handleInvalidateCell(schemaColumnIndex, rowIndex),
            }

            if (MainDataModel.isMain(dataModel)) {
                const mainCallbackListener = callbackListener as MainDataModel.CallbackListener;
                mainCallbackListener.preReindex = () => this.handleDataPreReindex();
                mainCallbackListener.postReindex = () => this.handleDataPostReindex();
            }

            dataModel.addDataCallbackListener(callbackListener);
        }

        const registeredDataModel: ModelCallbackRouter.RegisteredDataModel = {
            dataModel,
            callbackListener,
        }
        this._registeredDataModels.push(registeredDataModel);

        return index;
    }

    getDataCallbackListener(index: number) {
        return this._registeredDataModels[index].callbackListener;
    }

    /** @internal */
    private handleBeginSchemaChange() {
        if (!this._destroyed) {
            this.beginSchemaChangeEvent();
        }
    }

    /** @internal */
    private handleEndSchemaChange() {
        if (!this._destroyed) {
            this.endSchemaChangeEvent();
        }
    }

    /** @internal */
    private handleColumnsInserted(columnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.columnsInsertedEvent(columnIndex, columnCount);
            this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }
    }

    /** @internal */
    private handleColumnsDeleted(columnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.columnsDeletedEvent(columnIndex, columnCount);
            this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }
    }

    /** @internal */
    private handleAllColumnsDeleted() {
        if (!this._destroyed) {
            this.allColumnsDeletedEvent();
            this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }
    }

    /** @internal */
    private handleSchemaChanged() {
        if (!this._destroyed) {
            this.schemaChangedEvent();
            this.tryNotifyUndefinedDetailedModelEvent('rev-schema-loaded');
        }
    }

    /** @internal */
    private handleGetActiveSchemaColumns() {
        if (this._destroyed) {
            return [];
        } else {
            return this.getActiveSchemaColumnsEvent();
        }
    }

    /** @internal */
    private handleBeginDataChange() {
        if (!this._destroyed) {
            this.beginDataChangeEvent();
        }
    }

    /** @internal */
    private handleEndDataChange() {
        if (!this._destroyed) {
            this.endDataChangeEvent();
        }
    }

    /** @internal */
    private handleInvalidateAll() {
        if (!this._destroyed) {
            this.invalidateAllEvent();
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-all-invalidated');
        }
    }

    /** @internal */
    private handleInvalidateRows(rowIndex: number, count: number) {
        if (!this._destroyed) {
            this.invalidateRowsEvent(rowIndex, count);

            if (this._gridProperties.emitModelEvents) {
                const detail: EventDetail.RowsDataInvalidated = {
                    time: Date.now(),
                    rowIndex,
                    count,
                }
                this.gridEvent('rev-data-rows-invalidated', detail);
            }
        }
    }

    /** @internal */
    private handleInvalidateRow(rowIndex: number) {
        if (!this._destroyed) {
            this.invalidateRowEvent(rowIndex);

            if (this._gridProperties.emitModelEvents) {
                const detail: EventDetail.RowsDataInvalidated = {
                    time: Date.now(),
                    rowIndex,
                    count: 1,
                }
                this.gridEvent('rev-data-rows-invalidated', detail);
            }
        }
    }

    /** @internal */
    private handleInvalidateRowColumns(rowIndex: number, schemaColumnIndex: number, columnCount: number) {
        if (!this._destroyed) {
            this.invalidateRowColumnsEvent(rowIndex, schemaColumnIndex, columnCount);

            if (this._gridProperties.emitModelEvents) {
                const detail: EventDetail.RowColumnsDataInvalidated = {
                    time: Date.now(),
                    rowIndex,
                    schemaColumnIndex,
                    columnCount,
                }
                this.gridEvent('rev-data-row-columns-invalidated', detail);
            }
        }
    }

    /** @internal */
    private handleInvalidateRowCells(rowIndex: number, schemaColumnIndexes: number[]) {
        if (!this._destroyed) {
            this.invalidateRowCellsEvent(rowIndex, schemaColumnIndexes);

            if (this._gridProperties.emitModelEvents) {
                const detail: EventDetail.RowCellsDataInvalidated = {
                    time: Date.now(),
                    rowIndex,
                    schemaColumnIndexes,
                }
                this.gridEvent('rev-data-row-cells-invalidated', detail);
            }
        }
    }

    /** @internal */
    private handleInvalidateCell(schemaColumnIndex: number, rowIndex: number) {
        if (!this._destroyed) {
            this.invalidateCellEvent(schemaColumnIndex, rowIndex);

            if (this._gridProperties.emitModelEvents) {
                const detail: EventDetail.CellDataInvalidated = {
                    time: Date.now(),
                    schemaColumnIndex,
                    rowIndex,
                }
                this.gridEvent('rev-data-cell-invalidated', detail);
            }
        }
    }

    /** @internal */
    private handleRowsInserted(dataModel: DataModel, rowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsInsertedEvent(dataModel, rowIndex, rowCount);
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }
    }

    /** @internal */
    private handleRowsDeleted(dataModel: DataModel, rowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsDeletedEvent(dataModel, rowIndex, rowCount);
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }
    }

    /** @internal */
    private handleAllRowsDeleted(dataModel: DataModel) {
        if (!this._destroyed) {
            this.allRowsDeletedEvent(dataModel);
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }
    }

    /** @internal */
    private handleRowCountChanged(dataModel: DataModel) {
        if (!this._destroyed) {
            this.rowCountChangedEvent(dataModel);
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-row-count-changed');
        }
    }

    /** @internal */
    private handleRowsMoved(dataModel: DataModel, oldRowIndex: number, newRowIndex: number, rowCount: number) {
        if (!this._destroyed) {
            this.rowsMovedEvent(dataModel, oldRowIndex, newRowIndex, rowCount);
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-rows-moved');
        }
    }

    /** @internal */
    private handleDataPreReindex() {
        if (!this._destroyed) {
            this.preReindexEvent();
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-prereindex');
        }
    }

    /** @internal */
    private handleDataPostReindex() {
        if (!this._destroyed) {
            this.postReindexEvent();
            this.tryNotifyUndefinedDetailedModelEvent('rev-data-postreindex');
        }
    }

    private tryNotifyUndefinedDetailedModelEvent<T extends EventName>(eventName: T) {
        if (this._gridProperties.emitModelEvents) {
            this.gridEvent(eventName, undefined);
        }
    }
}

export namespace ModelCallbackRouter {
    export interface RegisteredDataModel {
        dataModel: DataModel;
        callbackListener: DataModel.CallbackListener | undefined;
    }

    export type GetLastModelUpdateIdEvent = (this: void) => ModelUpdateId;

    export type BeginSchemaChangeEvent = (this: void) => void;
    export type EndSchemaChangeEvent = (this: void) => void;

    export type ColumnsInsertedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type ColumnsDeletedEvent = (this: void, columnIndex: number, columnCount: number) => void;
    export type AllColumnsDeletedEvent = () => void;
    export type SchemaChangedEvent = (this: void) => void;
    export type GetSchemaColumnEvent = (this: void, index: number) => SchemaModel.Column;
    export type GetActiveSchemaColumnsEvent = (this: void) => SchemaModel.Column[];

    export type BeginDataChangeEvent = (this: void) => void;
    export type EndDataChangeEvent = (this: void) => void;

    export type RowsInsertedEvent = (this: void, dataModel: DataModel, rowIndex: number, rowCount: number) => void;
    export type RowsDeletedEvent = (this: void, dataModel: DataModel, rowIndex: number, rowCount: number) => void;
    export type AllRowsDeletedEvent = (this: void, dataModel: DataModel) => void;
    export type RowCountChangedEvent = (this: void, dataModel: DataModel) => void;
    export type RowsMovedEvent = (this: void, dataModel: DataModel, oldRowIndex: number, newRowIndex: number, rowCount: number) => void;
    export type InvalidateAllEvent = (this: void) => void;
    export type InvalidateRowsEvent = (this: void, rowIndex: number, count: number) => void;
    export type InvalidateRowEvent = (this: void, rowIndex: number) => void;
    export type InvalidateRowColumnsEvent = (this: void, rowIndex: number, schemaColumnIndex: number, columnCount: number) => void;
    export type InvalidateRowCellsEvent = (this: void, rowIndex: number, schemaColumnIndexes: number[]) => void;
    export type InvalidateCellEvent = (this: void, schemaColumnIndex: number, rowIndex: number) => void;
    export type PreReindexEvent = (this: void) => void;
    export type PostReindexEvent = (this: void) => void;
    export type GridEvent = <T extends EventName>(this: void, eventName: T, eventDetail: EventName.DetailMap[T]) => void;

    export type SchemaUpdatedListener = (this: void) => void;
}
