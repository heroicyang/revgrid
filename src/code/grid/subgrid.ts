import { CellModel } from '../grid/model/cell-model';
import { DataModel } from '../grid/model/data-model';
import { MetaModel } from '../grid/model/meta-model';
import { SchemaModel } from '../grid/model/schema-model';
import { CellEditor } from './cell-editor/cell-editor';
import { cellEditorFactory } from './cell-editor/cell-editor-factory';
import { CellPainter } from './cell-painter/cell-painter';
import { BeingPaintedCell } from './cell/being-painted-cell';
import { CellEvent } from './cell/cell-event';
import { ColumnsManager } from './column/columns-manager';
import { CellPaintConfig } from './renderer/cell-paint-config';
import { CellPaintConfigAccessor } from './renderer/cell-paint-config-accessor';
import { Revgrid } from './revgrid';

/** @public */
export class Subgrid {
    readonly isMain: boolean = false;
    readonly isHeader: boolean = false;
    readonly isFilter: boolean = false;
    readonly isSummary: boolean = false;

    /** @internal */
    protected _destroyed = false;

    /** @internal */
    private rowProxy: Subgrid.DataRowProxy; // used if DataModel.getRowProperties not implemented
    /** @internal */
    private rowMetadata: MetaModel.RowMetadata[] = [];

    private _columnsManagerBeforeCreateColumnsListener = () => this.rowProxy.updateSchema();

    /** @internal */
    constructor(
        /** @internal */
        protected readonly _grid: Revgrid,
        /** @internal */
        protected readonly _columnsManager: ColumnsManager,
        /** @internal */
        public readonly role: Subgrid.Role,
        public readonly schemaModel: SchemaModel,
        public readonly dataModel: DataModel,
        public readonly metaModel: MetaModel | undefined,
        public readonly cellModel: CellModel | undefined,
    ) {
        switch (role) {
            case 'main':
                this.isMain = true;
                break;
            case 'header':
                this.isHeader = true;
                break;
            case 'footer':
                break;
            case 'filter':
                this.isFilter = true;
                break;
            case 'summary':
                this.isSummary = true;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const never: never = role
        }

        this.rowProxy = new Subgrid.DataRowProxy(this.schemaModel, this.dataModel);
        this._columnsManager.addBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener);
    }

    /** @internal */
    destroy() {
        this._columnsManager.removeBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener);
        this._destroyed = true;
    }

    /** @internal */
    getRow(rowIndex: number) {
        if (this.dataModel.getRow !== undefined) {
            return this.dataModel.getRow(rowIndex);
        } else {
            this.rowProxy.____rowIndex = rowIndex;
            return this.rowProxy;
        }
    }

    /** @internal */
    getRowMetadata(rowIndex: number, prototype?: MetaModel.RowMetadataPrototype): undefined | false | MetaModel.RowMetadata {
        if (this.metaModel !== undefined && this.metaModel.getRowMetadata !== undefined) {
            return this.metaModel.getRowMetadata(rowIndex, prototype);
        } else {
            return this.rowMetadata[rowIndex];
        }
    }

    /** @internal */
    setRowMetadata(rowIndex: number, newMetadata?: MetaModel.RowMetadata) {
        if (this.metaModel !== undefined && this.metaModel.setRowMetadata !== undefined) {
            this.metaModel.setRowMetadata(rowIndex, newMetadata);
        } else {
            this.rowMetadata[rowIndex] = newMetadata;
        }
    }

    /** @internal */
    // private handleDataModelEvent(nameOrEvent: DataModel.EventName | DataModel.Event) {
    //     let type: DataModel.EventName;
    //     let dataModelEvent: DataModel.Event;
    //     switch (typeof nameOrEvent) {
    //         case 'string':
    //             type = nameOrEvent as DataModel.EventName;
    //             dataModelEvent = { type };
    //             break;
    //         case 'object':
    //             if ('type' in nameOrEvent) {
    //                 type = nameOrEvent.type;
    //                 break;
    //             } else {
    //                 throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //             }
    //         default:
    //             throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //     }

    //     if (!DataModel.REGEX_DATA_EVENT_STRING.test(type)) {
    //         throw new HypergridError('Expected data model event type "' + type + '" to match ' + DataModel.REGEX_DATA_EVENT_STRING + '.');
    //     }

    //     const nativeHandler = this.dataModelEventMap[type];
    //     let dispatched: boolean | undefined;
    //     if (nativeHandler) {
    //         dispatched = nativeHandler(dataModelEvent);
    //     }

    //     return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler(type, dataModelEvent);
    // }

    /**
     * @desc These handlers are called by {@link dispatchDataModelEvent dataModel.dispatchEvent} to perform Hypergrid housekeeping tasks.
     *
     * (Hypergrid registers itself with the data model by calling `dataModel.addListener`. Both `addListener` and `dispatchEvent` are optional API. If the data model lacks `addListener`, Hypergrid inserts a bound version of `dispatchEvent` directly into the data model.)
     *
     * #### Coding pattern
     * If there are no housekeeping tasks to be performed, do not define a handler here.
     *
     * Otherwise, the typical coding pattern is for our handler to perform the housekeeping tasks, returning `undefined` to the caller ({@link DispatchDataModelEvent}) which then re-emits the event as a Hypergrid event (_i.e.,_ as a DOM event to the `<canvas>` element).
     *
     * Alternatively, our handler can re-emit the event itself by calling the grid event handler and propagating its boolean return value value to the caller which signals the caller _not_ to re-emit on our behalf. This is useful when tasks need to be performed _after_ the Hypergrid event handler is called (or before _and_ after).
     *
     * The pattern, in general:
     * ```js
     * exports['rev-hypergrid-data-myevent'] = function(event) {
     *     var notCanceled;
     *
     *     PerformHousekeepingTasks();
     *
     *     // optionally re-emit the event as a grid event
     *     import { dispatchGridEvent } from '../../lib/dispatchGridEvent.js';
     *     notCanceled = dispatchGridEvent.call(this, event.type, isCancelable, event);
     *
     *     if (!notCanceled) {
     *         PerformAdditionalHousekeepingTasks()
     *     }
     *
     *     return notCanceled;
     * }
     * Re-emitting the event is optional; if `notCanceled` is never defined, the caller will take care of it. If your handler does choose to re-emit the event itself by calling `dispatchGridEvent`, you should propagate its return value (the result of its internal call to [`dispatchEvent`](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent), which is either `false` if the event was canceled or `true` if it was not).
     *
     */

    // /** @internal */
    // private handleFinHypergridSchemaLoaded(): boolean | undefined {
    //     this.rowProxy.updateSchema();
    //     return this._schemaLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataLoaded(): boolean | undefined {
    //     return this._dataLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataShapeChanged(): boolean | undefined {
    //     return this._dataShapeChangedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataPrereindex(): boolean | undefined {
    //     return this._dataPrereindexEventHandler();
    // }

    // private handleFinHypergridDataPostreindex(): boolean | undefined {
    //     return this._dataPostreindexEventHandler();
    // }

    // Same events as above except using notifier

    // abstract getRowCount(): number;
    // abstract getValue(columnIndex: number, rowIndex: number): unknown;
    // abstract getSchema(): (RawColumnSchema | ColumnSchema)[];



    // // Fallbacks

    // // eslint-disable-next-line @typescript-eslint/no-empty-function
    // apply() {

    // }

    // isTree() {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // isTreeCol(columnIndex: number) {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // toggleRow(rowIndex: number, columnIndex?: number, toggle?: boolean) {
    //     return undefined;
    // }

    // getColumnCount() {
    //     return this.getSchema().length;
    // }

    // getRow(y: number): DataRowObject {
    //     this.$rowProxy$.$y$ = y;
    //     return this.$rowProxy$;
    // }

    // getData(metadataFieldName: string) {
    //     const Y = this.getRowCount();
    //     const rows = new Array(Y);

    //     for (let y = 0; y < Y; y++) {
    //         const row = this.getRow(y);
    //         if (row !== undefined) {
    //             rows[y] = Object.assign({}, row);
    //             if (metadataFieldName) {
    //                 const metadata = this.getRowMetadata(y);
    //                 if (metadata) {
    //                     rows[y][metadataFieldName] = metadata;
    //                 }
    //             }
    //         }
    //     }

    //     return rows;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setData(data: DataRowObject[], schema: RawColumnSchema[]) {
    //     // fail silently because Local.js::setData currently calls this for every subgrid
    // }

    // setValue(x: number, y: number, value: unknown) {
    //     console.warn('dataModel.setValue(' + x + ', ' + y + ', "' + value + '") called but no implementation. Data not saved.');
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setSchema(schema: ColumnSchema[]) {
    //     console.warn('dataModel.setSchema(schema) called but no implementation. Schema not updated.');
    // }

    // getRowIndex(y: number) {
    //     return y;
    // }

    // /** @implements DataModel#getRowMetadata */
    // getRowMetadata(y: number, prototype?: null): undefined | RowMetadata {
    //     return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    // }

    // getMetadataStore() {
    //     return this.metadata;
    // }

    // setRowMetadata(y: number, metadata: RowMetadata) {
    //     if (metadata !== undefined) {
    //         this.metadata[y] = metadata;
    //     } else {
    //         delete this.metadata[y];
    //     }
    //     return !!metadata;
    // }

    // setMetadataStore(newMetadataStore: RowMetadata[] | undefined) {
    //     this.metadata = newMetadataStore ?? [];
    // }

    // Hooks
    /** @internal */
    getCellPaintConfig(beingPaintedCell: BeingPaintedCell): CellPaintConfig {
        let config: CellPaintConfig;
        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellPaintConfig !== undefined) {
                config = cellModel.getCellPaintConfig(beingPaintedCell);
            }
        }

        if (config === undefined) {
            return new CellPaintConfigAccessor(beingPaintedCell);
        } else {
            return config;
        }
    }

    /** @internal */
    getCellPainter(cellPaintConfig: CellPaintConfig, gridPainterKey: string): CellPainter {
        let painter: CellPainter;
        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellPainter !== undefined) {
                painter = cellModel.getCellPainter(cellPaintConfig, gridPainterKey);
            }
        }

        if (painter === undefined) {
            return this._grid.renderer.cellPainterRepository.get(gridPainterKey);
        } else {
            return painter;
        }
    }

    /** @internal */
    getCellEditorAt(columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent): CellEditor {
        let editor: CellEditor;

        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellEditorAt !== undefined) {
                editor = cellModel.getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);
            }
        }

        if (editor === undefined) {
            return cellEditorFactory.create(this._grid, editorName);
        } else {
            return editor;
        }
    }
}

/** @public */
export namespace Subgrid {
    export const enum RoleEnum {
        main = 'main',
        header = 'header',
        footer = 'footer',
        filter = 'filter',
        summary = 'summary',
    }

    export type Role = keyof typeof RoleEnum;

    export interface Spec {
        role?: Role, // defaults to main
        dataModel: DataModel | DataModel.Constructor,
        metaModel?: MetaModel | MetaModel.Constructor,
        cellModel?: CellModel | CellModel.Constructor,
    }

    /** @internal */
    export class DataRowProxy {
        [columnName: string]: DataModel.DataValue;

        ____rowIndex: number;
        ____columnNames: string[] = [];

        constructor(public schemaModel: SchemaModel, public dataModel: DataModel) {
            this.updateSchema(); // is this necessary? If we do not always get the "rev-schema-loaded" event then it is necessary
        }

        updateSchema() {
            const existingCount = this.____columnNames.length;
            for (let i = 0; i < existingCount; i++) {
                const columnName = this.____columnNames[i];
                delete this[columnName];
            }
            this.____columnNames.length = 0;
            const schema = this.schemaModel.getSchema();
            const newCount = schema.length;
            for (let i = 0; i < newCount; i++) {
                const schemaColumn = schema[i]; // variable for closure
                const columnName = schemaColumn.name;
                this.____columnNames.push(columnName)
                Object.defineProperty(this, columnName, {
                    // enumerable: true, // is a real data field
                    configurable: true,
                    get: () => { return this.dataModel.getValue(schemaColumn, this.____rowIndex); },
                    set: (value: DataModel.DataValue) => { return this.dataModel.setValue(schemaColumn, this.____rowIndex, value); }
                });
            }
        }
    }

}
