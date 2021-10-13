import { Rectangle } from '../lib/rectangle';
import { SchemaModel } from './schema-model';
// import { Hypergrid } from '../Hypergrid';

/**
 * @desc Hypergrid 3 data models have a minimal required interface, as outlined on the [Data Model API](https://github.com/fin-hypergrid/core/wiki/Data-Model-API) wiki page.
 *
 * #### TL;DR
 * The minimum interface is an object with just three methods: {@link DataModel#getRowCount getRowCount()} {@link DataModel#getSchema getSchema()} and {@link DataModel#getValue getValue(x, y)}.
 */

 /** @public */
export interface DataModel {
    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#dispatchEvent dispatchEvent}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Hypergrid calls this method subscribe to data model events. The data model calls its own implementation of `dispatchEvent` to publish events to subscribers.
     *
     * Both the `addListener` polyfill as well as `datasaur-base`'s implementation service multiple listeners for the use case of multiple grid instances all using the same data model instance. To support this use case, your data model should service multiple listeners as well. (Doing so also lets the application add its own listener(s) to the data model.)
     *
     * Function is called addDataCallbackListener instead of addCallBackListener so that one class can implement both DataModel and SchemaModel.
     *
     * @param listener - A reference to a function bound to a grid instance. The function is called whenever the data model calls its {@link DataModel#dispatchEvent} method. The handler thus receives all data model events (in `event.type).
     */
    addDataCallbackListener?(listener: DataModel.CallbackListener): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Transforms the data. All the rows are subject to change, including the row count.
     */
    apply?(): void;

    /**
     * Removed dispatchEvent! Does not make sense for DataModel to receive these events - just emit them. Maybe this was for some type of chaining.  Needs to be revisited in this case
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#removeListener removeListener}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * If `addListener` is not implemented, Hypergrid falls back to a simpler approach, injecting its own implementation of `dispatchEvent`, bound to the grid instance, into the data model. If the data model already has such an implementation, the assumption is that it was injected by another grid instance using the same data model. The newly injected implementation will call the original injected implementation, thus creating a chain. This is an inferior approach because grids cannot easily unsubscribe themselves. Applications can remove all subscribers in the chain by deleting the implementation of `dispatchEvent` (the end of the chain) from the data model.
     */
    // dispatchEvent?(nameOrEvent: DataModel.EventName | DataModel.Event): void;
    /**
     * @desc Characters that can be used to construct cell values representing drill downs in a tree structure.
     *
     * A specialized cell renderer is often employed to produce better results using graphics instead of characters.
     */
    // drillDownCharMap?: DataModel.DrillDownCharMap;

    /**
     * @Summary Prefetch data
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Tells dataModel what cells will be needed by subsequent calls to {@link DataModel#getValue getValue()}. This helps remote or virtualized data models fetch and cache data. If your data model doesn't need to know this, don't implement it.
     * #### Parameters:
     * @param rectangles - Unordered list of rectangular regions of cells to fetch in a single (atomic) operation.
     * @param callback - Optional callback. If provided, implementation calls it with `false` on success (requested data fully fetched) or `true` on failure.
     */
    fetchData?(rectangles: Rectangle[], callback?: (failure: boolean) => void): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * All grid data.
     * @param metadataFieldName - If provided, the output will include the row metadata object in a "hidden" field with this name.
     * @returns All the grid's data rows.
     */
    getData?(metadataFieldName?: string): DataModel.DataRow[];

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Get a row of data.
     *
     * The injected default implementation is an object of lazy getters.
     * @returns {number|undefined} The data row corresponding to the given `rowIndex`; or `undefined` if no such row.
     */
    getRow?(rowIndex: number): DataModel.DataRow | undefined;

    /**
     * @returns The number of data rows currently contained in the model.
     */
    getRowCount(): number;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Only called by Hypergrid when it receives the `data-prereindex` or `data-postreindex` events.
     * These events are typically triggered before and after data model remaps the rows (in its `apply` method).
     * #### Parameters:
     * @param rowIndex - Grid row index.
     * @returns Unique Id of row specified by rowIndex.
     */
    getRowId?(rowIndex: number): number;

    /**
     * @desc Get a cell's value given its column & row indexes.
     * @returns The member with the given schema field from the data row with the given `rowIndex`.
     */
    getValue(schema: SchemaModel.Column, rowIndex: number): DataModel.DataValue;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation from [polyfills.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/polyfills.js). If your data model does implement it, it should also implement the sister methods {@link DataModel#addListener addListener}, {@link DataModel#dispatchEvent dispatchEvent}, and {@link DataModel#removeAllListeners removeAllListeners}, because they all work together and you don't want to mix native implementations with polyfills.
     *
     * Detaches the data model from a particular grid instance.
     *
     * This method is called by {@link Hypergrid#desctruct} to clean up memory.
     * Note: `destruct` is not called automatically by Hypergrid; applications must call it explicitly when disposing of a grid.
     *
     * @param listener - A reference to the handler originally provided to {@link DataModel#addListener}.
     */
    // removeListener?(listener: DataModel.EventListener): void;
    removeDataCallbackListener?(listener: DataModel.CallbackListener): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * @param data - An array of congruent raw data objects.
     * @param schema - Ordered array of column schema.
     */
    // setData?(data: DataModel.DataRowObject[], columnSchema: DataModel.RawColumnSchema[]): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Update or blank a row in place, without deleting the row (and without affecting succeeding rows' indexes).
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setRow?(rowIndex: number, dataRow?: DataModel.DataRow): void;

    /**
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Set a cell's value given its column schema & row indexes and a new value.
     */
    setValue?(schema: SchemaModel.Column, rowIndex: number, newValue: unknown): void;

    /**
     * @summary Mouse was clicked on a grid row.
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     *
     * Hypergrid calls this method from one place, {@link Local#cellClicked behavior.cellClicked}, which is called from src/features/CellClick when user clicks on a tree or data cell.
     *
     * The data model may consume or ignore the click.
     *
     * If the data model consumes the click by modifying some data in the existing data set, it should dispatch the 'rev-data-loaded` data event to the grid, which causes a grid "repaint" (which re-renders rows and columns in place).
     *
     * If the data model consumes the click by transforming the data, it should dispatch the following data events to the grid:
     *    * 'rev-data-prereindex' before transforming the data
     *    * 'rev-data-postreindex' after transforming the data
     *
     * This causes Hypergrid to save the current row and/or column selections before and then attempt to restore them after, before a "shape change" (which recalculates row and column bounding rects and then re-renders them).
     *
     * "Transforming the data" means altering the data set (by adding/removing rows, _etc._). The typical use case for this is a click on a cell containing a drill-down control.
     *
     * After rerendering, Hypergrid dispatches a DOM event with the same _type_ (same event string) to the grid's `<canvas>` element for the benefit of any application listeners.
     *
     * #### Parameters:
     *
     * @param rowIndex
     *
     * @param columnIndex - For the drill-down control use case, implementations should call `this.isTreeCol(columnIndex)` if they want to restrict the response to clicks in the tree column (rather than any column). Although defined in Hypergrid's call, implementations should not depend on it, which may be useful for testing purposes.
     *
     * @param toggle - One of:
     * * `undefined` (or omitted) - Toggle row.
     * * `true` - Expand row iff currently collapsed.
     * * `false` - Collapse row iff currently expanded.
     * > NOTE: Implementation of this parameter is optional. It may be useful for testing purposes but Hypergrid does not define actual parameter in its call in {@link Hypergrid#cellClicked}.
     *
     * @returns If click was consumed by the data model:
     * * `undefined` Not consumed: Row had no drill-down control.
     * * `true` Consumed: Row had a drill-down control which was toggled.
     * * `false` Not consumed: Row had a drill-down control but it was already in requested state.
     * > NOTE: Implementation of a return value is optional as of version v3.0.0. It may be useful for testing purposes but {@link Hypergrid#cellClicked} no longer uses the return value (depending instead on the implementation dispatching data events), so implementations no longer need to support it. Therefore, in general, applications should no depend on a return value. For particular requirements, however, an applications may make a private contract with a data model implementation for a return value (that may or may not follow the above definition. Regardless of the implementation, the return value of this method is propagated through the return values of {@link Local#cellClicked} -> {@link Hypergrid#cellClicked} -> the application.
     */
    toggleRow?(rowIndex: number, columnIndex?: number, toggle?: boolean): boolean | undefined;
}


/** @public */
export namespace DataModel {

    export type DataValue = unknown;

    /**
     * @desc A data row representation using an object.
     * The properties of this object are the data fields.
     * The property keys are the column names
     * All row objects should be congruent, meaning that each data row should have the same property keys.
     */
    export interface ObjectDataRow {
        [columnName: string]: DataValue;
    }
    export type ArrayDataRow = DataValue[];
    export type DataRow = ArrayDataRow | ObjectDataRow;

    export type Constructor = new () => DataModel;

    /**
     * Besides `type`, your event object can contain other event details.
     *
     * After calling the internal handler found in [src/behaviors/Local/events.js](https://github.com/fin-hypergrid/core/tree/master/src/behaviors/Local/events.js) matching the event name, Hypergrid then creates a {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent `CustomEvent`} with the same name, sets its `detail` property to this object, and dispatches to the `<canvas>` element — to be picked up by any listeners previously attached with {@link Hypergrid#addEventListener}.
     * @param event.type - Event string (name).
     */

    export interface CallbackListener {
        beginChange: (this: void) => void;
        endChange: (this: void) => void;
        rowsInserted: (this: void, rowIndex: number, rowCount: number) => void;
        rowsDeleted: (this: void, rowIndex: number, rowCount: number) => void;
        allRowsDeleted: (this: void) => void;
        /** Try to use rowsInserted, rowsDeleted, allRowsDeleted instead of rowCountChanged. These provide better optimisations and control of selection. */
        rowCountChanged: (this: void) => void;
        rowsMoved: (this: void, oldRowIndex: number, newRowIndex: number, rowCount: number) => void;
        invalidateAll: (this: void) => void;
        invalidateRows: (this: void, rowIndex: number, count: number) => void;
        invalidateRow: (this: void, rowIndex: number) => void;
        invalidateRowColumns: (this: void, rowIndex: number, schemaColumnIndex: number, columnCount: number) => void;
        invalidateRowCells: (this: void, rowIndex: number, schemaColumnIndexes: number[]) => void;
        invalidateCell: (this: void, schemaColumnIndex: number, rowIndex: number) => void;
    }
}
