import { Column } from './column/column';
import { ColumnsManager } from './column/columns-manager';
import { Rectangle } from './lib/rectangle';
import { CellModel } from './model/cell-model';
import { DataModel } from './model/data-model';
import { MainDataModel } from './model/main-data-model';
import { MetaModel } from './model/meta-model';
import { ModelCallbackRouter } from './model/model-callback-router';
import { SchemaModel } from './model/schema-model';
import { Revgrid } from './revgrid';
import { SelectionModel } from './selection/selection-model';
import { SelectionRectangle } from './selection/selection-rectangle';
import { Subgrid } from './subgrid';

/** @public */
export class MainSubgrid extends Subgrid {
    // More Hypegrid and behavior logic should be moved into here

    /** @internal */
    private _nestedStashSelectionsRequestCount = 0;
    /** @internal */
    private _stashedSelectedRowIds: unknown[] | undefined;
    /** @internal */
    private _stashedSelectedColumnNames: string[] | undefined;
    /** @internal */
    private _stashedSelectedSingleFirstCellPosition: MainSubgrid.StashedSelectedSingleFirstCellPosition | undefined;
    /**
     * The instance of the grid's selection model.
     * May or may not contain any cell, row, and/or column selections.
     */
    selectionModel: SelectionModel;
    lastEdgeSelection: [x: number, y: number] = [0, 0]; // 1st element is x, 2nd element is y


    /** @internal */
    constructor(
        /** @internal */
        grid: Revgrid,
        columnsManager: ColumnsManager,
        modelCallbackManager: ModelCallbackRouter,
        role: Subgrid.Role,
        schemaModel: SchemaModel,
        public override readonly dataModel: MainDataModel,
        metaModel: MetaModel | undefined,
        cellModel: CellModel | undefined,
    ) {
        super(grid, columnsManager, modelCallbackManager, role, schemaModel, dataModel, metaModel, cellModel);

        this.selectionModel = new SelectionModel(grid);

        modelCallbackManager.preReindexEvent = () => this.handleDataPreReindexEvent();
        modelCallbackManager.postReindexEvent = () => this.handleDataPostReindexEvent();
    }

    reset() {
        this.lastEdgeSelection = [0, 0];
        this.selectionModel.reset();
    }

    get selections() { return this.selectionModel.selections; }
    /**
     * @returns We have any selections.
     */
    hasSelections() {
        // if (!this.getSelectionModel) { // set in constructor
        //     return; // were not fully initialized yet
        // }
        return this.selectionModel.hasSelections();
    }

    /**
     * @returns Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV(): string {
        switch (this.selectionModel.getLastSelectionType()) {
            case 'cell':
                const selectionMatrix = this.getSelectionMatrix();
                const selections = selectionMatrix[selectionMatrix.length - 1];
                return this.getMatrixSelectionAsTSV(selections);
            case 'row':
                return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
            case 'column':
                return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
            default:
                return '';
        }
    }

    getMatrixSelectionAsTSV(selections: Array<Array<DataModel.DataValue>>) {
        let result = '';

        //only use the data from the last selection
        if (selections.length) {
            const width = selections.length;
            const height = selections[0].length;
            const area = width * height;
            const lastCol = width - 1;
                //Whitespace will only be added on non-singular rows, selections
            const whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange() {
        this.selectionModel.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange() {
        this.selectionModel.endChange();
    }

    /**
     * @desc Clear all the selections.
     */
    clearSelections() {
        const keepRowSelections = this._grid.properties.checkboxOnlyRowSelections;
        this.selectionModel.clear(keepRowSelections);
    }

    /**
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection(keepRowSelections: boolean) {
        this.selectionModel.clearMostRecentSelection(keepRowSelections);
    }

    /**
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection() {
        this.selectionModel.clearMostRecentColumnSelection();
    }

    /**
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    }

    /**
     * @summary Select given region.
     * @param ox - origin x
     * @param oy - origin y
     * @param ex - extent x
     * @param ex - extent y
     */
    select(ox: number, oy: number, ex: number, ey: number) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selectionModel.select(ox, oy, ex, ey);
    }

    /**
     * @returns Given point is selected.
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     */
    isSelected(x: number, y: number): boolean {
        return this.selectionModel.isSelected(x, y);
    }

    /**
     * @returns The given column is selected anywhere in the entire table.
     * @param y - The row index.
     */
    isCellSelectedInRow(y: number): boolean {
        return this.selectionModel.isCellSelectedInRow(y);
    }

    /**
     * @returns The given row is selected anywhere in the entire table.
     * @param x - The column index.
     */
    isCellSelectedInColumn(x: number): boolean {
        return this.selectionModel.isCellSelectedInColumn(x);
    }

    getRowSelection(hiddenColumns: boolean | number[] | string[]): DataModel.DataRow {
        const selectedRowIndexes = this.selectionModel.getSelectedRows();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result: DataModel.DataRow = {};

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            const rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                const dataRow = this.getRow(selectedRowIndex);
                rows[j] = this.valOrFunc(dataRow, column);
            });
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataModel.DataValue>> {
        const selectedRowIndexes = this.selectionModel.getSelectedRows();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result = new Array<Array<DataModel.DataValue>>(columns.length);

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            result[c] = new Array<DataModel.DataValue>(selectedRowIndexes.length);
            selectedRowIndexes.forEach(
                (selectedRowIndex, r) => {
                    const dataRow = this.getRow(selectedRowIndex);
                    result[c][r] = this.valOrFunc(dataRow, column);
                }
            );
        }

        return result;
    }

    getColumnSelectionMatrix(): DataModel.DataValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.getSelectedColumns();
        const numRows = this.dataModel.getRowCount();
        const result = new Array<Array<DataModel.DataValue>>(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[c] = new Array<DataModel.DataValue>(numRows);

            for (let r = 0; r < numRows; r++) {
                const dataRow = this.getRow(r);
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getColumnSelection() {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.getSelectedColumns();
        const result: Revgrid.ColumnsDataValuesObject = {};
        const rowCount = this.dataModel.getRowCount();

        selectedColumnIndexes.forEach((selectedColumnIndex) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[column.name] = new Array<DataModel.DataValue>(rowCount);

            for (let r = 0; r < rowCount; r++) {
                const dataRow = this.getRow(r);
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelection(): Revgrid.ColumnsDataValuesObject[] {
        const columnsManager = this._columnsManager;
        const selections = this.selectionModel.selections;
        const rects = new Array<Revgrid.ColumnsDataValuesObject>(selections.length);

        selections.forEach(
            (selectionRect, i) => {
                const rect = this.normalizeRect(selectionRect);
                const colCount = rect.width;
                const rowCount = rect.height;
                const columns: Revgrid.ColumnsDataValuesObject = {};

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const column = columnsManager.getActiveColumn(x);
                    const values = columns[column.name] = new Array<DataModel.DataValue>(rowCount);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.getRow(y);
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = columns;
            }
        );

        return rects;
    }

    getLastSelection() {
        return this.selectionModel.getLastSelection();
    }

    getSelectionMatrix(): DataModel.DataValue[][][] {
        const columnsManager = this._columnsManager;
        const selections = this.selectionModel.selections;
        const rects = new Array<Array<Array<DataModel.DataValue>>>(selections.length);

        selections.forEach(
            (selectionRect, i) => {
                const rect = this.normalizeRect(selectionRect);
                const colCount = rect.width;
                const rowCount = rect.height;
                const rows = new Array<Array<DataModel.DataValue>>();

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const values = rows[c] = new Array<DataModel.DataValue>(rowCount);
                    const column = columnsManager.getActiveColumn(x);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.getRow(y);
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = rows;
            }
        );

        return rects;
    }

    selectCell(x: number, y: number, silent?: boolean) {
        const keepRowSelections = this._grid.properties.checkboxOnlyRowSelections;
        this.beginSelectionChange();
        try {
            this.selectionModel.clear(keepRowSelections);
            this.selectionModel.select(x, y, 0, 0, silent);
        } finally {
            this.endSelectionChange();
        }
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const model = this.selectionModel;
        const alreadySelected = model.isColumnSelected(x);
        this.beginSelectionChange();
        try {
            if (!ctrlKeyDown && !shiftKeyDown) {
                model.clear();
                if (!alreadySelected) {
                    model.selectColumns(x);
                }
            } else {
                if (ctrlKeyDown) {
                    if (alreadySelected) {
                        model.deselectColumn(x);
                    } else {
                        model.selectColumns(x);
                    }
                }
                if (shiftKeyDown) {
                    model.clear();
                    model.selectColumns(this.lastEdgeSelection[0], x);
                }
            }
            if (!alreadySelected && !shiftKeyDown) {
                this.lastEdgeSelection[0] = x;
            }
        } finally {
            this.endSelectionChange();
        }
        this._grid.repaint();
        this._grid.fireSyntheticColumnSelectionChangedEvent();
    }

    toggleSelectRow(y: number, shiftKeyDown: boolean) {
        //we can select the totals rows if they exist, but not rows above that
        const sm = this.selectionModel;
        const alreadySelected = sm.isRowSelected(y);

        this.beginSelectionChange();
        try {
            if (alreadySelected) {
                sm.deselectRow(y);
            } else {
                if (this._grid.properties.singleRowSelectionMode) {
                    sm.clearRowSelection();
                }
                sm.selectRows(y);
            }

            if (shiftKeyDown) {
                sm.clear();
                sm.selectRows(this.lastEdgeSelection[1], y);
            }

            if (!alreadySelected && !shiftKeyDown) {
                this.lastEdgeSelection[1] = y;
            }
        } finally {
            this.endSelectionChange();
        }

        this._grid.repaint();
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getSelectedRow() {
        const sels = this.selectionModel.selections;
        if (sels.length) {
            const dataModel = this.dataModel;
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.getActiveColumnCount();
            const topSelectedRow = sels[0].origin.y;
            const row = {
                    //hierarchy: behavior.getFixedColumnValue(0, topRow)
                };

            for (let c = 0; c < colCount; c++) {
                const column = columnsManager.getActiveColumn(c);
                row[column.name] = dataModel.getValue(column.schemaColumn, topSelectedRow);
            }

            return row;
        } else {
            return undefined;
        }
    }

    isColumnOrRowSelected() {
        return this.selectionModel.isColumnOrRowSelected();
    }

    selectColumns(x1: number, x2?: number) {
        this.selectionModel.selectColumns(x1, x2);
    }

    selectRows(y1: number, y2?: number) {
        const sm = this.selectionModel;

        if (this._grid.properties.singleRowSelectionMode) {
            sm.clearRowSelection();
            y2 = y1;
        } else {
            if (y2 === undefined) {
                y2 = y1;
            }
        }

        sm.selectRows(Math.min(y1, y2), Math.max(y1, y2));
    }

    getSelectedRows() {
        return this.selectionModel.getSelectedRows();
    }

    getSelectedColumns() {
        return this.selectionModel.getSelectedColumns();
    }

    getLastSelectionType(n?: number) {
        return this.selectionModel.getLastSelectionType(n);
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        return this.selectionModel.isInCurrentSelectionRectangle(x, y);
    }

    selectAllRows() {
        this.selectionModel.selectAllRows();
    }

    areAllRowsSelected() {
        return this.selectionModel.areAllRowsSelected();
    }

    toggleSelectAllRows() {
        if (this.areAllRowsSelected()) {
            this.selectionModel.clear();
        } else {
            this.selectAllRows();
        }
        this._grid.repaint();
    }

    requestStashSelections() {
        if (this._nestedStashSelectionsRequestCount++ === 0) {
            this.stashSelections();
        }
    }

    requestUnstashSelections() {
        if (--this._nestedStashSelectionsRequestCount === 0) {
            this.unstashSelections();
        }
    }

    /**
     * @param hiddenColumns - One of:
     * `false` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - index into all column list
     * * `string` - name of a column from the all column list
     * @internal
     */
    private getActiveAllOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[]): Column[] {
        let columns: Column[];
        const allColumns = this._columnsManager.allColumns;
        const activeColumns = this._columnsManager.activeColumns;

        if (Array.isArray(hiddenColumns)) {
            columns = [];
            hiddenColumns.forEach((index: number | string) => {
                const key = typeof index === 'number' ? 'index' : 'name';
                const column = allColumns.find((column) => { return column[key] === index; });
                if (activeColumns.indexOf(column) < 0) {
                    columns.push(column);
                }
            });
            columns = columns.concat(activeColumns);
        } else {
            columns = hiddenColumns ? allColumns : activeColumns;
        }

        return columns;
    }

    /** @internal */
    private normalizeRect(rect: Rectangle) {
        const o = rect.origin;
        const c = rect.corner;

        const ox = Math.min(o.x, c.x);
        const oy = Math.min(o.y, c.y);

        const cx = Math.max(o.x, c.x);
        const cy = Math.max(o.y, c.y);

        return new SelectionRectangle(ox, oy, cx - ox, cy - oy);
    }

    /**
     * @returns '' if data value is undefined
     * @internal
     */
    private valOrFunc(dataRow: DataModel.DataRow, column: Column): (DataModel.DataValue | '') {
        if (Array.isArray(dataRow)) {
            return dataRow[column.schemaColumn.index];
        } else {
            let result: DataModel.DataValue;
            if (dataRow) {
                result = dataRow[column.name];
                const calculator = (((typeof result)[0] === 'f' && result) || column.calculator) as SchemaModel.Column.CalculateFunction;
                if (calculator) {
                    result = calculator(dataRow, column.name);
                }
            }
            return result || result === 0 || result === false ? result : '';
        }
    }

    /** @internal */
    private handleDataPreReindexEvent() {
        this.requestStashSelections();
        this._grid.renderer.modelUpdated();
    }

    /** @internal */
    private handleDataPostReindexEvent() {
        const grid = this._grid;
        this.requestUnstashSelections();
        grid.behaviorShapeChanged();
        grid.renderer.modelUpdated();
    }

    private stashSelections() {
        if (!this.stashSingleFirstCellSelection()) {
            this.stashRowSelections();
            this.stashColumnSelections();
        }
        this.selectionModel.clear();
    }

    private unstashSelections() {
        this.selectionModel.reset();
        this.selectionModel.beginChange();
        try {
            if (!this.unstashSingleFirstCellSelection()) {
                // only unstash Row and Column if single cell was not unstashed
                this.unstashRowSelections();
                this.unstashColumnSelections();
            }
        } finally {
            this.selectionModel.endChange();
        }

        // make sure nothing stashed
        this._stashedSelectedRowIds = undefined;
        this._stashedSelectedColumnNames = undefined;
        this._stashedSelectedSingleFirstCellPosition = undefined;
    }

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    private stashRowSelections() {
        // selectionModel should be moved into Subgrid
        const gridProps = this._grid.properties;
        if (gridProps.restoreRowSelections) {
            if (gridProps.rowSelection) {
                const selectedRows = this.getSelectedRows();
                this._stashedSelectedRowIds = selectedRows.map( (selectedRowIndex) => this.dataModel.getRowIdFromIndex(selectedRowIndex) );
            }
        }
    }

    /**
     * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowIndexes` which should be called first.
     *
     * Note that not all previously selected rows will necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     */
    private unstashRowSelections() {
        // selectionModel should be moved into Subgrid
        const rowIds = this._stashedSelectedRowIds;
        if (rowIds !== undefined) {
            this._stashedSelectedRowIds = undefined;
            this._stashedSelectedSingleFirstCellPosition = undefined; // make sure

            const rowCount = this._grid.getRowCount();
            let rowIdCount = rowIds.length;
            const gridRowIndexes = [];
            const dataModel = this.dataModel;
            const selectionModel = this.selectionModel;

            if (dataModel.getRowIndexFromId !== undefined) {
                for (let i = 0; i < rowIdCount; i++) {
                    const rowId = rowIds[i];
                    const rowIndex = dataModel.getRowIndexFromId(rowId);
                    if (rowIndex !== undefined) {
                        selectionModel.selectRows(rowIndex);
                    }
                }
            } else {
                for (let rowIndex = 0; rowIdCount > 0 && rowIndex < rowCount; ++rowIndex) {
                    const rowId = dataModel.getRowIdFromIndex(rowIndex);
                    const rowSelected = rowIds.includes(rowId);
                    if (rowSelected) {
                        gridRowIndexes.push(rowIndex);
                        selectionModel.selectRows(rowIndex);
                        rowIdCount--; // count down so we can bail early if all found
                    }
                }
            }
        }
    }

    /**
     * Save data column names of current column selections in `grid.selectedColumnNames`.
     *
     * This call should be paired with a subsequent call to `reselectColumnsByNames`.
     * @returns Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
     */
    private stashColumnSelections() {
        // selectionModel should be moved into Subgrid
        if (this._grid.properties.restoreColumnSelections) {
            const selectedColumns = this.getSelectedColumns();
            this._stashedSelectedColumnNames = selectedColumns.map( (selectedColumnIndex) => this._columnsManager.getActiveColumn(selectedColumnIndex).name );
        }
    }

    /**
     * Re-establish columns selections based on column names saved by `getSelectedColumnNames` which should be called first.
     *
     * Note that not all preveiously selected columns wil necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     * @returns Number of rows reselected or `undefined` if there were no previously selected columns.
     */
    private unstashColumnSelections() {
        // selectionModel should be moved into Subgrid
        const selectedColumnNames = this._stashedSelectedColumnNames;
        if (selectedColumnNames) {
            this._stashedSelectedColumnNames = undefined;

            const columnsManager = this._columnsManager;
            const selectionModel = this.selectionModel;

            for (const columnName in selectedColumnNames) {
                const activeColumnIndex = columnsManager.getActiveColumnIndexByName(columnName);
                if (activeColumnIndex >= 0) {
                    selectionModel.selectColumns(activeColumnIndex);
                }
            }
        }
    }

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @returns Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    private stashSingleFirstCellSelection() {
        // selectionModel should be moved into Subgrid
        let stashed = false;
        const gridProps = this._grid.properties;
        if (gridProps.restoreSingleCellSelection) {
            if (gridProps.cellSelection && !gridProps.multipleSelections) {
                const selections = this.selectionModel.selections;
                if (selections.length === 1) {
                    const selection = selections[0];
                    const firstSelectedCell = selection.firstSelectedCell;
                    this._stashedSelectedSingleFirstCellPosition = {
                        columnName: this._columnsManager.getActiveColumn(firstSelectedCell.x).name,
                        rowId: this.dataModel.getRowIdFromIndex(firstSelectedCell.y),
                    };
                    stashed = true;
                }
            }
        }

        return stashed;
    }

    private unstashSingleFirstCellSelection() {
        // selectionModel should be moved into Subgrid
        const rowIdCellPosition = this._stashedSelectedSingleFirstCellPosition;
        if (rowIdCellPosition === undefined) {
            return false;
        } else {
            this._stashedSelectedSingleFirstCellPosition = undefined;

            const { columnName, rowId: selectedRowId } = rowIdCellPosition;

            const selectedColumnIndex = this._columnsManager.getActiveColumnIndexByName(columnName);
            if (selectedColumnIndex >= 0) {
                const dataModel = this.dataModel;
                if (dataModel.getRowIndexFromId !== undefined) {
                    const rowIndex = dataModel.getRowIndexFromId(selectedRowId);
                    if (rowIndex !== undefined) {
                        this.select(selectedColumnIndex, rowIndex, 0, 0);
                    }
                } else {
                    const rowCount = this._grid.getRowCount();
                    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                        const rowId = dataModel.getRowIdFromIndex(rowIndex);
                        if (rowId === selectedRowId) {
                            this.select(selectedColumnIndex, rowIndex, 0, 0);
                            break;
                        }
                    }
                }
            }

            return true; // was stashed so return true even if unstash did not make new selection
        }
    }
}

/** @public */
export namespace MainSubgrid {
    export interface StashedSelectedSingleFirstCellPosition {
        columnName: string;
        rowId: unknown;
    }
}
