
import { dispatchGridEvent } from '../canvas/dispatch-grid-event';
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { AssertError } from '../lib/revgrid-error';
import { Revgrid } from '../revgrid';
import { RangeSelectionModel } from './range-selection-model';
import { Selection } from './selection';
import { SelectionDetailAccessor } from './selection-detail';

/**
 *
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

export class SelectionModel {
    rowSelectionModel: RangeSelectionModel;
    columnSelectionModel: RangeSelectionModel;

    private _selections: Selection[];
    private _flattenedX: InclusiveRectangle[];
    private _flattenedY: InclusiveRectangle[];
    private _lastSelectionType: SelectionModel.LastSelectionType[];
    private _allRowsSelected = false;

    private _beginChangeCount = 0;
    private _changed = false;
    private _silentlyChanged = false;

    get selections() { return this._selections; }

    constructor(private readonly grid: Revgrid) {
        this.reset();
    }

    reset() {
        /**
         * @summary The selection rectangles.
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this._selections = [];

        /**
         * @summary The selection rectangles flattened in the horizontal direction (no width).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this._flattenedX = [];

        /**
         * @summary The selection rectangles flattened in the vertical direction (no height).
         * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
         */
        this._flattenedY = [];

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.rowSelectionModel = new RangeSelectionModel();

        /**
         * @summary The selection rectangles.
         * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
         */
        this.columnSelectionModel = new RangeSelectionModel();

        this._lastSelectionType = [];
    }

    beginChange() {
        ++this._beginChangeCount;
    }

    endChange() {
        if (--this._beginChangeCount === 0) {
            if (this._changed) {
                this._changed = false;
                const silentlyChanged = this._silentlyChanged;
                this._silentlyChanged = false;

                const gridProps = this.grid.properties;

                if (!gridProps.checkboxOnlyRowSelections && gridProps.autoSelectRows) {
                    // Project the cell selection into the rows
                    this.selectRowsFromCellsOrLastSelection();
                }

                if (gridProps.autoSelectColumns) {
                    // Project the cell selection into the columns
                    this.selectColumnsFromCells();
                }

                if (!silentlyChanged) {
                    dispatchGridEvent(this.grid, 'rev-selection-changed', false, new SelectionDetailAccessor(this));
                }
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new AssertError('SMEC91004', 'Mismatched SelectionModel begin/endChange callback');
            }
        }
    }

    selectRowsFromCellsOrLastSelection() {
        if (!this.grid.properties.singleRowSelectionMode) {
            this.selectRowsFromCells(0, true);
        } else {
            const last = this.getLastSelection();
            if (last !== undefined) {
                this.clearRowSelection();
                this.selectRows(last.corner.y);
            } else {
                this.clearRowSelection();
            }
        }
        this.grid.fireSyntheticRowSelectionChangedEvent();
    }



    flagChanged(silently: boolean) {
        if (silently) {
            // Can only flag as silently if no other change was silent
            if (!this._changed) {
                this._silentlyChanged = true;
            } else {
                this._silentlyChanged = false;
            }
        }
        this._changed = true;
    }

    getLastSelection() {
        const sels = this._selections;
        if (sels.length > 0) {
            return sels[sels.length - 1];
        } else {
            return undefined;
        }
    }

    /**
     * The most recent selection type. This is the TOS of `this.lastSelectionType`, the stack of unique selection types.
     *
     * Note that in the case where the only remaining previous selection of `type` was deselected, and `setLastSelectionType` was called with `reset` truthy, `type` is removed from the stack. If it was previously TOS, the TOS will now be what was the 2nd most recently pushed type (or nothing if no other selections).
     *
     * Returns empty string (`''`) if there are no selections.
     */
    getLastSelectionType(n?: number) {
        return this._lastSelectionType[n ?? 0] || '';
    }

    /**
     * Set the most recent selection's `type`. That is, push onto TOS of `this.lastSelectionType`, the stack of unique selection types. If already in the stack, move it to the top.
     *
     * If `reset` is truthy, remove the given `type` from the stack, regardless of where found therein (or not), thus "revealing" the 2nd most recently pushed type.
     *
     * @param type - One of: `'cell'`, `'row'`, or `'column'`
     * @param reset - Remove the given `type` from the stack. Specify truthy when the only remaining previous selection of `type` has been deselected.
     */
    setLastSelectionType(type: SelectionModel.LastSelectionType, reset?: boolean) {
        const i = this._lastSelectionType.indexOf(type);
        if (i === 0 && !reset) {
            return;
        }
        if (i >= 0) {
            this._lastSelectionType.splice(i, 1);
        }
        if (!reset) {
            this._lastSelectionType.unshift(type);
        }
    }

    /**
     * @description Select the region described by the given coordinates.
     *
     * @param originX - origin x coordinate
     * @param originY - origin y coordinate
     * @param extentX - extent x coordinate (width - 1)
     * @param extentY - extent y coordinate (height - 1)
     * @param silent - whether to fire selection changed event
     */
    select(originX: number, originY: number, extentX: number, extentY: number, silent?: boolean) {
        this.beginChange();
        try {
            const newSelection = new Selection(originX, originY, extentX + 1, extentY + 1);

            if (this.grid.properties.multipleSelections) {
                this._selections.push(newSelection);
                // Following can be cast as Rectangle constructor used which uses unchanged extent
                this._flattenedX.push(newSelection.newXFlattened(0));
                this._flattenedY.push(newSelection.newYFlattened(0));
            } else {
                this._selections[0] = newSelection;
                this._flattenedX[0] = newSelection.newXFlattened(0);
                this._flattenedY[0] = newSelection.newYFlattened(0);
            }
            this.setLastSelectionType('cell');

            this.flagChanged(silent);
        } finally {
            this.endChange()
        }
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    toggleSelect(ox: number, oy: number, ex: number, ey: number) {

        const index = this._selections.findIndex((selection) => {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });

        if (index >= 0) {
            this.beginChange();
            try {
                this._selections.splice(index, 1);
                this._flattenedX.splice(index, 1);
                this._flattenedY.splice(index, 1);
                this.setLastSelectionType('cell', !this._selections.length);
                this.flagChanged(false);
            } finally {
                this.endChange();
            }
        } else {
            this.select(ox, oy, ex, ey);
        }
    }

    /**
     * @desc Remove the last selection that was created.
     */
    clearMostRecentSelection(keepRowSelections: boolean) {
        this.beginChange();
        try {
            console.debug('clearmostrecent');
            if (!keepRowSelections) {
                this.setAllRowsSelected(false);
            }
            const changed = this._selections.length > 0;
            if (changed) { --this._selections.length; }
            if (this._flattenedX.length) { --this._flattenedX.length; }
            if (this._flattenedY.length) { --this._flattenedY.length; }
            this.setLastSelectionType('cell', !this._selections.length);

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    clearMostRecentColumnSelection() {
        this.columnSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    clearMostRecentRowSelection() {
        this.rowSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    clearRowSelection() {
        this.rowSelectionModel.clear();
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    hasSelections() {
        return this._selections.length !== 0;
    }

    hasRowSelections() {
        return !this.rowSelectionModel.isEmpty();
    }

    hasColumnSelections() {
        return !this.columnSelectionModel.isEmpty();
    }

    /**
     * @return Selection covers a specific column.
     */
    isCellSelectedInRow(y: number): boolean {
        return this._isCellSelected(this._flattenedX, 0, y);
    }

    isCellSelectedInColumn(x: number) {
        return this._isCellSelected(this._flattenedY, x, 0);
    }

    /**
     * @summary Selection query function.
     * @returns The given cell is selected (part of an active selection).
     */
    isSelected(x: number, y: number): boolean {
        return (
            this.isColumnSelected(x) ||
            this.isRowSelected(y) ||
            this._isCellSelected(this._selections, x, y)
        );
    }

    isCellSelected(x: number, y: number) {
        return this._isCellSelected(this._selections, x, y);
    }

    private _isCellSelected(selections: InclusiveRectangle[], x: number, y: number) {
        return !!selections.find((selection) => this.rectangleContains(selection, x, y));
    }

    /**
     * @desc empty out all our state
     */
    clear(keepRowSelections?: boolean) {
        this.beginChange();
        try {
            const changed = this._selections.length > 0;
            this._selections.length = 0;
            this._flattenedX.length = 0;
            this._flattenedY.length = 0;
            this.columnSelectionModel.clear();
            if (!keepRowSelections) {
                this._lastSelectionType.length = 0;
                this.setAllRowsSelected(false);
                this.rowSelectionModel.clear();
            } else if (this._lastSelectionType.indexOf('row') >= 0) {
                this._lastSelectionType = ['row'];
            } else {
                this._lastSelectionType.length = 0;
            }
            if (changed) {
                this.flagChanged(false); // was previously not flagged as changed
            }
        } finally {
            this.endChange();
        }
    }

    /**
     * @param ox - origin x coordinate
     * @param oy - origin y coordinate
     * @param ex - extent x coordinate
     * @param ey - extent y coordinate
     */
    isRectangleSelected(ox: number, oy: number, ex: number, ey: number): boolean {
        return !!this._selections.find(function(selection) {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });
    }

    isColumnSelected(x: number) {
        return this.columnSelectionModel.isSelected(x);
    }

    isRowSelected(y: number) {
        return this._allRowsSelected || this.rowSelectionModel.isSelected(y);
    }

    selectColumns(x1: number, x2?: number) {
        this.columnSelectionModel.select(x1, x2);
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    selectAllRows() {
        this.clear();
        this.setAllRowsSelected(true);
    }

    setAllRowsSelected(isIt: boolean) {
        this._allRowsSelected = isIt;
    }

    areAllRowsSelected() {
        return this._allRowsSelected;
    }

    selectRows(y1: number, y2?: number) {
        this.rowSelectionModel.select(y1, y2);
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    deselectColumn(x1: number, x2?: number) {
        this.columnSelectionModel.deselect(x1, x2);
        this.setLastSelectionType('column', !this.columnSelectionModel.selection.length);
    }

    deselectRow(y1: number, y2?: number) {
        if (this.areAllRowsSelected()) {
            // To deselect a row, we must first remove the all rows flag...
            this.setAllRowsSelected(false);
            // ...and create a single range representing all rows
            this.rowSelectionModel.select(0, this.grid.getRowCount() - 1);
        }
        this.rowSelectionModel.deselect(y1, y2);
        this.setLastSelectionType('row', !this.rowSelectionModel.selection.length);
    }

    getSelectedRows() {
        if (this.areAllRowsSelected()) {
            const rowCount = this.grid.getRowCount();
            const result = new Array<number>(rowCount);
            for (let i = 0; i < rowCount; i++) {
                result[i] = i;
            }
            return result;
        }
        return this.rowSelectionModel.getSelections();
    }

    getSelectedColumns() {
        return this.columnSelectionModel.getSelections();
    }

    isColumnOrRowSelected() {
        return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
    }

    getFlattenedYs() {
        const result = Array<number>();
        const set = {};
        this._selections.forEach((selection) => {
            const top = selection.origin.y;
            const size = selection.height;
            for (let r = 0; r < size; r++) {
                const ti = r + top;
                if (!set[ti]) {
                    result.push(ti);
                    set[ti] = true;
                }
            }
        });

        result.sort((x, y) => {
            return x - y;
        });

        return result;
    }

    selectRowsFromCells(offset: number, keepRowSelections: boolean) {
        offset = offset || 0;

        const sm = this.rowSelectionModel;

        if (!keepRowSelections) {
            this.setAllRowsSelected(false);
            sm.clear();
        }

        this._selections.forEach((selection) => {
            let top = selection.origin.y;
            const extent = selection.extent.y;
            top += offset;
            sm.select(top, top + extent);
        });
    }

    selectColumnsFromCells(offset?: number) {
        offset = offset || 0;

        const sm = this.columnSelectionModel;
        sm.clear();

        this._selections.forEach((selection) => {
            let left = selection.origin.x;
            const extent = selection.extent.x;
            left += offset;
            sm.select(left, left + extent);
        });
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        const last = this.getLastSelection();
        return last && this.rectangleContains(last, x, y);
    }

    rectangleContains(rect: InclusiveRectangle, x: number, y: number) { //TODO: explore why this works and rectanglular.contains does not
        let minX = rect.origin.x;
        let minY = rect.origin.y;
        let maxX = minX + rect.extent.x;
        let maxY = minY + rect.extent.y;

        if (rect.extent.x < 0) {
            minX = maxX;
            maxX = rect.origin.x;
        }

        if (rect.extent.y < 0) {
            minY = maxY;
            maxY = rect.origin.y;
        }

        const result =
            x >= minX &&
            y >= minY &&
            x <= maxX &&
            y <= maxY;

        return result;
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number) {
        this.beginChange();
        try {
            const selections = this._selections;
            let changed = false;
            for (let i = this._selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                if (selection.adjustForRowsInserted(rowIndex, rowCount)) {
                // if (adjustedSelection !== undefined) {
                //     selections[i] = adjustedSelection;
                    changed = true;
                }
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number) {
        this.beginChange();
        try {
            const selections = this._selections;
            let changed = false;
            for (let i = this._selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                const adjustmentResult = selection.adjustForRowsDeleted(rowIndex, rowCount);
                if (adjustmentResult === null) {
                    selections.splice(i, 1);
                } else {
                    if (adjustmentResult) {
                        changed = true;
                    }
                }
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number) {
        this.beginChange();
        try {
            // this could probably be better optimised
            this.adjustForRowsDeleted(oldRowIndex, count);
            this.adjustForRowsInserted(newRowIndex, count);
        } finally {
            this.endChange();
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const selections = this._selections;
            let changed = false;
            for (let i = this._selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                if (selection.adjustForColumnsInserted(columnIndex, columnCount)) {
                    changed = true;
                }
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            const selections = this._selections;
            let changed = false;
            for (let i = this._selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                const adjustedResult = selection.adjustForColumnsDeleted(columnIndex, columnCount);
                if (adjustedResult === null) {
                    selections.splice(i, 1);
                } else {
                    if (adjustedResult) {
                        changed = true;
                    }
                }
            }

            if (changed) {
                this.flagChanged(false);
            }
        } finally {
            this.endChange();
        }
    }
}

export namespace SelectionModel {
    export const enum LastSelectionTypeEnum {
        cell = 'cell',
        column = 'column',
        row = 'row',
    }
    export type LastSelectionType = keyof typeof LastSelectionTypeEnum;
}
