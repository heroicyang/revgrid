import { dispatchGridEvent } from '../canvas/dispatch-grid-event';
import { AssertError } from '../lib/revgrid-error';
import { SchemaModel } from '../model/schema-model';
import { Revgrid } from '../revgrid';
import { Column } from './column';
import { ColumnProperties } from './column-properties';

/** @public */
export class ColumnsManager {
    /** @internal */
    schemaModel: SchemaModel;
    /** @internal */
    columnsCreated = false;
    /** @internal */
    private _activeColumns = new Array<Column>();
    /** @internal */
    private _allColumns = new Array<Column>(); // always in same order as Schema

    /** @internal */
    private _beginSchemaChangeCount = 0;
    /** @internal */
    private _schemaChanged = false;

    /** @internal */
    private _beforeCreateColumnsListeners = new Array<ColumnsManager.BeforeCreateColumnsListener>();

    /** @internal */
    constructor(private readonly _grid: Revgrid) { }

    /** @internal */
    addBeforeCreateColumnsListener(listener: ColumnsManager.BeforeCreateColumnsListener) {
        this._beforeCreateColumnsListeners.push(listener);
    }

    /** @internal */
    removeBeforeCreateColumnsListener(listener: ColumnsManager.BeforeCreateColumnsListener) {
        const index = this._beforeCreateColumnsListeners.indexOf(listener);
        if (index < 0) {
            throw new AssertError('CMRBCCL72009');
        } else {
            this._beforeCreateColumnsListeners.splice(index, 1);
        }
    }

    /** @internal */
    getSchema() {
        return this.schemaModel.getSchema();
    }

    /** @internal */
    beginSchemaChange() {
        this._beginSchemaChangeCount++;
    }

    /** @internal */
    endSchemaChange() {
        // In future, advise ColumnsManager of all schema changes and let ColumnManager figure out if schema changed
        this._beginSchemaChangeCount--;
        if (this._beginSchemaChangeCount === 0) {
            if ( this._schemaChanged) {
                this._schemaChanged = false;
                this.createColumns();
            }
        } else {
            if (this._beginSchemaChangeCount < 0) {
                throw new AssertError('RAEC91004', 'Mismatched ColumnsManager beginSchema/endSchemaChange callback');
            }
        }
    }

    /** @internal */
    schemaColumnsInserted(_index: number, count: number) {
        this.beginSchemaChange();
        try {
            if (count > 0) {
                this._schemaChanged = true;
            }
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    schemaColumnsDeleted(_index: number, count: number) {
        this.beginSchemaChange();
        try {
            if (count > 0) {
                this._schemaChanged = true;
            }
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    allSchemaColumnsDeleted() {
        this.beginSchemaChange();
        try {
            this._schemaChanged = true;
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    schemaColumnsChanged() {
        this.beginSchemaChange();
        try {
            this._schemaChanged = true;
        } finally {
            this.endSchemaChange();
        }
    }

    /** @internal */
    clearColumns() {
        // As part of Typescript conversion, schema is now readonly.
        // Need to find other way of getting non default name and header to tree and row number columns
        //
        // const schema = this.mainDataModel.getSchema();
        this.columnsCreated = false;

        this._activeColumns.length = 0;
        this._allColumns.length = 0;

        // this.columns[tc].properties.propClassLayers = this.columns[rc].properties.propClassLayers = this.grid.properties.propClassLayersMap.NO_ROWS;

        // Signal the renderer to size the now-reset handle column before next render
        // this.grid.renderer.resetRowHeaderColumnWidth();
    }

    /** @internal */
    getActiveColumn(x: number) {
        return this._activeColumns[x];
    }

    /**
     * The "grid index" of an active column given a column name
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByName(name: string) {
        return this._activeColumns.findIndex((column) => { return column.name === name; });
    }

    /**
     * The "grid index" of an active column given a column index (or schemaColumn index)
     * @returns The grid index of the column or -1 if column not in grid (hidden).
     * @internal
     */
    getActiveColumnIndexByAllIndex(allIndex: number) {
        return this._activeColumns.findIndex((column) => { return column.index === allIndex; });
    }

    /** @internal */
    getAllColumn(allX: number) {
        return this._allColumns[allX];
    }

    /** @internal */
    newColumn(schemaColumn: SchemaModel.Column) {
        return new Column(this._grid, schemaColumn);
    }

    /** @internal */
    createColumns() {
        this._beforeCreateColumnsListeners.forEach((listener) => listener());

        const schema = this.schemaModel.getSchema();
        // fields.decorateSchema(schema);
        // fields.decorateColumnSchema(schema, this.grid.properties.headerify);

        this.clearColumns();

        schema.forEach((schemaColumn) => {
            const column = this.newColumn(schemaColumn);
            this._activeColumns.push(column);
            this._allColumns.splice(column.index, 0, column);
        });

        this.columnsCreated = true;

        this._grid.behaviorChanged();

        dispatchGridEvent(this._grid, 'rev-hypergrid-columns-created', false, undefined);
    }

    /** @internal */
    getActiveColumnWidth(x: number) {
        const column = this.getActiveColumn(x);
        return column ? column.getWidth() : 0;
    }

    /**
     * @param columnOrIndex - The column or active column index.
     * @internal
     */
    setActiveColumnWidth(columnOrIndex: Column | number, width: number) {
        let column: Column
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= -2) {
                column = this.getActiveColumn(columnOrIndex);
            } else {
                throw new Error(`Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }
        const changed = column.setWidth(width);
        if (changed) {
            this._grid.behaviorStateChanged();
            return column;
        } else {
            return undefined;
        }
    }

    /**
     * @summary Sets properties for active columns.
     * @desc Sets multiple columns' properties from elements of given array or collection. Keys may be column indexes or column names. The properties collection is cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     * @internal
     */
    setAllColumnProperties(columnsHash?: ColumnProperties[] | Record<string, ColumnProperties>) {
        this.addAllColumnProperties(columnsHash, true);
    }

    /**
     * @summary Adds properties for multiple columns.
     * @desc Adds . The properties collection is optionally cleared first. Falsy elements are ignored.
     * @param columnsHash - If undefined, this call is a no-op.
     * @param settingState - Clear columns' properties objects before copying properties.
     * @internal
     */
    addAllColumnProperties(columnsHash?: Partial<ColumnProperties>[] | Record<string, Partial<ColumnProperties>>, settingState?: boolean) {
        if (columnsHash === undefined) {
            return;
        }

        const allColumns = this._allColumns;

        if (Array.isArray(columnsHash)) {
            const columnCount = allColumns.length;
            for (let i = 0; i < columnCount; i++) {
                const column = allColumns[i];
                if (settingState === true) {
                    // column.clearProperties(); // needs to be implemented
                }

                column.addProperties(columnsHash[i]);
            }
        } else {
            Object.keys(columnsHash).forEach((key) => {
                const index = this._allColumns.findIndex((column) => column.name === key)

                if (index >= 0) {
                    const column = allColumns[index];
                    if (column) {
                        if (settingState === true) {
                            // column.clearProperties(); // needs to be implemented
                        }

                        column.addProperties(columnsHash[key]);
                    }
                }
            });
        }
    }

    /** @internal */
    setColumnOrder(allColumnIndexes: number[]) {
        const activeColumns = this._activeColumns;
        const allColumns = this._allColumns;
        // const arrayDecorator = new ArrayDecorator;

        // avoid recreating the `columns` array object to keep refs valid; just empty it
        activeColumns.length = 0;

        allColumnIndexes.forEach((index) => {
            activeColumns.push(allColumns[index]);
        });
    }

    /** @internal */
    setColumnOrderByName(allColumnNames: string[]) {
        const allColumns = this._allColumns;
        this.setColumnOrder(allColumnNames.map((name) => { return allColumns[name].index; }));
    }

    /**
     * @desc Rebuild the column order indexes
     * @param - list of column indexes
     * @param silent - whether to trigger column changed event
     * @internal
     */
    setColumnIndexes(allColumnIndexes: number[], silent = false) {
        this._grid.properties.columnIndexes = allColumnIndexes;
        if (!silent) {
            this._grid.fireSyntheticOnColumnsChangedEvent();
        }
    }

    /**
     * @summary Show inactive column(s) or move active column(s).
     *
     * @desc Adds one or several columns to the "active" column list.
     *
     * @param isActiveColumnIndexes - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted in which case it will be allColumnIndexes
     *
     * @param referenceIndex - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param allowDuplicateColumns - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     *
     * @internal
     */
    showColumns(allColumnIndexes: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    /** @internal */
    showColumns(isActiveColumnIndexes: boolean, columnIndexes?: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    /** @internal */
    showColumns(
        allColumnIndexesOrIsActiveColumnIndexes: boolean | number | number[],
        referenceIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrReferenceIndex?: boolean | number,
        allowDuplicateColumns?: boolean
    ): void;
    /** @internal */
    showColumns(
        allColumnIndexesOrIsActiveColumnIndexes: boolean | number | number[],
        referenceIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrReferenceIndex?: boolean | number,
        allowDuplicateColumns = false
    ): void {
        let isActiveColumnIndexes: boolean;
        let columnIndexes: number | number[] | undefined;
        let referenceIndex: number | undefined;

        // Promote args when isActiveColumnIndexes omitted
        if (typeof allColumnIndexesOrIsActiveColumnIndexes === 'number' || Array.isArray(allColumnIndexesOrIsActiveColumnIndexes)) {
            isActiveColumnIndexes = false;
            columnIndexes = allColumnIndexesOrIsActiveColumnIndexes;
            referenceIndex = referenceIndexOrColumnIndexes as number;
            allowDuplicateColumns = allowDuplicateColumnsOrReferenceIndex as boolean;
        } else {
            isActiveColumnIndexes = allColumnIndexesOrIsActiveColumnIndexes;
            columnIndexes = referenceIndexOrColumnIndexes;
            referenceIndex = allowDuplicateColumnsOrReferenceIndex as number;
        }

        const activeColumns = this._activeColumns;
        const sourceColumnList = isActiveColumnIndexes ? activeColumns : this._allColumns;

        // Nest scalar index
        if (typeof columnIndexes === 'number') {
            columnIndexes = [columnIndexes];
        }

        const newColumns = columnIndexes
            .map((index) => sourceColumnList[index]) // Look up columns using provided indexes
            .filter(column => column); // Remove any undefined columns

        // Default insertion point is end (i.e., before (last+1)th element)
        if (typeof referenceIndex !== 'number') {
            allowDuplicateColumns = referenceIndex; // assume reference index was omitted when not a number
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(
                (column) => {
                    const i = activeColumns.indexOf(column);
                    if (i >= 0) {
                        activeColumns.splice(i, 1);
                        if (referenceIndex > i) {
                            --referenceIndex;
                        }
                    }
                }
            );
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice(referenceIndex, 0, ...newColumns);
        }

        this._grid.properties.columnIndexes = activeColumns.map((column) => column.index );
    }

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param allColumnIndexes - Column index(es) to be removed. The columns are specified by the column index (not active index).
     * @internal
     */
    hideColumns(allColumnIndexes: number | number[]) {
        this.showColumns(allColumnIndexes, -1);
    }

    /** @internal */
    hideActiveColumn(columnIndex: number) {
        this._activeColumns.splice(columnIndex, 1);
    }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    getActiveColumnProperties(allX: number): ColumnProperties | undefined {
        const column = this.getAllColumn(allX);
        return column?.properties;
    }

    /**
     * @param allX - Data x coordinate.
     * @return The properties for a specific column.
     * @internal
     */
    setColumnProperties(allX: number, properties: ColumnProperties): ColumnProperties {
        const column = this.getAllColumn(allX);
        if (column === undefined) {
            throw 'Expected column.';
        }

        // column.clearProperties(); // needs implementation
        column.properties.merge(properties);
        this._grid.behaviorChanged();
        return column.properties;
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param allX - Omit for all columns.
     * @internal
     */
    clearAllCellProperties(allX?: number) {
        let X: number;

        if (allX === undefined) {
            allX = 0;
            X = this._allColumns.length;
        } else {
            X = allX + 1;
        }

        while (allX < X) {
            const column = this.getAllColumn(allX);
            if (column) {
                column.clearAllCellProperties();
            }
            allX++
        }
    }

    /**
     * @return All the currently hidden column header labels.
     * @internal
     */
    getHiddenColumnDescriptors() {
        const tableState = this._grid.properties;
        const indexes = tableState.columnIndexes;
        const labels = [];
        const columnCount = this.getActiveColumnCount();
        for (let i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                const column = this.getActiveColumn(i);
                labels.push({
                    id: i,
                    field: column.name
                });
            }
        }
        return labels;
    }

    /**
     * Total number of columns (including active and hidden).
     * @internal
     */
    getAllColumnCount() {
        return this._allColumns.length;
    }

    /**
     * Number of _visible_ columns.
     * @return The total number of columns.
     * @internal
     */
    getActiveColumnCount() {
        return this._activeColumns.length;
    }

    /**
     * @desc swap source and target columns
     * @param source - column index
     * @param target - column index
     * @internal
     */
    swapColumns(source: number, target: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[source];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[target];
        columns[source] = targetColumn;
        if (sourceColumn === undefined) {
            return;
        }
        columns[target] = sourceColumn;
        this._grid.behaviorChanged();
    }

    /** @internal */
    moveColumnBefore(sourceIndex: number, targetIndex: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[sourceIndex];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[targetIndex];
        if (targetColumn === undefined) {
            return;
        }
        this.move(columns, sourceIndex, targetIndex);
    }

    /** @internal */
    moveColumnAfter(sourceIndex: number, targetIndex: number) {
        const columns = this._activeColumns;
        const sourceColumn = columns[sourceIndex];
        if (sourceColumn === undefined) {
            return;
        }
        const targetColumn = columns[targetIndex];
        if (targetColumn === undefined) {
            return;
        }
        this.move(columns, sourceIndex, targetIndex + 1);
    }

    /** @internal */
    private move<T>(arr: T[], oldIndex: number, newIndex: number) {
        const old = arr[oldIndex];
        arr.splice(oldIndex, 1);
        arr.splice(newIndex > oldIndex ? newIndex - 1 : newIndex, 0, old);
        return arr;
    }

    /** @internal */
    autosizeAllColumns() {
        this.checkColumnAutosizing(true);
        this._grid.behaviorChanged();
    }

    /** @internal */
    checkColumnAutosizing(force?: boolean) {
        let autoSized = false;

        this._activeColumns.find((column) => {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });

        return autoSized;
    }

    /** @internal */
    get allColumns() {
        return this._allColumns;
    }

    /** @internal */
    get activeColumns() {
        return this._activeColumns;
    }

    /** @internal */
    getHiddenColumns() {
        // this does not look right
        const visible = this._activeColumns;
        const all = this._allColumns;
        const hidden = new Array<Column>();
        for (let i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort((a, b) => {
            return a.name < b.name ? 1 : 0; // previously was header
        });
        return hidden;
    }
}

/** @public */
export namespace ColumnsManager {
    export type BeforeCreateColumnsListener = (this: void) => void;
}
