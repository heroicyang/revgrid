import { Behavior } from '../behavior';
import { CellPainter } from '../cell-painter/cell-painter';
import { Column } from '../column/column';
import { ColumnProperties } from '../column/column-properties';
import { Point, WritablePoint } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangle';
import { DataModel } from '../model/data-model';
import { MetaModel } from '../model/meta-model';
import { Renderer } from '../renderer/renderer';
import { Revgrid } from '../revgrid';
import { SelectionModel } from '../selection/selection-model';
import { Subgrid } from '../subgrid';

export abstract class RenderedCell {

    // getter caches
    private _columnProperties: ColumnProperties;
    private _cellOwnProperties: MetaModel.CellOwnProperties | undefined;
    _bounds: RenderedCell.Bounds;

    // this.disabled: boolean;

    private renderer: Renderer;
    private selectionModel: SelectionModel;
    private behavior: Behavior;

    cellPainter: CellPainter;
    clickRect: Rectangle;
    clientPoint: Point;
    column: Column;
    dataCell: WritablePoint = {} as WritablePoint; // no need for initialization
    // dataRow: DataRowObject;
    format: string;
    gridCell: WritablePoint = {} as WritablePoint; // no need for initialization
    gridPoint: Point;
    mousePoint: Point;
    pagePoint: Point;
    row: unknown;
    subgrid: Subgrid;
    visibleColumn: Renderer.VisibleColumn;
    visibleRow: Renderer.VisibleRow;


    /**
     * @summary Create a new CellEvent object.
     * @param gridX - grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param gridY - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     */
    constructor(public grid: Revgrid, public gridX?: number, public gridY?: number) {
        this.renderer = grid.renderer;
        this.selectionModel = grid.selectionModel;
        this.behavior = grid.behavior;
        if (arguments.length > 1) {
            this.resetGridCY(gridX, gridY);
        }
    }

    // special method for use by renderer which reuses cellEvent object for performance reasons
    reset(visibleColumn: Renderer.VisibleColumn, visibleRow: Renderer.VisibleRow) {
        // getter caches
        this._columnProperties = undefined;
        this._cellOwnProperties = undefined;
        this._bounds = undefined;

        // this.disabled = undefined;

        this.visibleColumn = visibleColumn;
        this.visibleRow = visibleRow;

        this.subgrid = visibleRow.subgrid;

        this.column = visibleColumn.column; // enumerable so will be copied to cell renderer object

        this.gridCell.x = visibleColumn.activeColumnIndex;
        this.gridCell.y = visibleRow.index;

        this.dataCell.x = this.column && this.column.index;
        this.dataCell.y = visibleRow.rowIndex;
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridC - Horizontal grid cell coordinate adjusted for horizontal scrolling after fixed columns.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     */
    resetGridCY(gridC: number, gridY: number) {
        const vc = this.renderer.getVisibleColumn(gridC);
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleRow(gridY);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Raw horizontal grid cell coordinate.
     * @param gridY - Raw vertical grid cell coordinate.
     * @returns Visibility.
     */
    resetGridXY(gridX: number, gridY: number) {
        const vc = this.renderer.visibleColumns[gridX];
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleRow(gridY);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * @summary Set up this `CellEvent` instance to point to the cell at the given data coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view), the instance is not reset.
     * @param dataX - Horizontal data cell coordinate.
     * @param dataY - Vertical data cell coordinate.
     * @returns Visibility.
     */
    resetDataXY(dataX: number, dataY: number, subgrid?: Subgrid) {
        const vc = this.renderer.getVisibleDataColumn(dataX);
        if (vc === undefined) {
            return false;
        } else {
            const vr = this.renderer.getVisibleDataRow(dataY, subgrid);
            if (vr === undefined) {
                return false;
            } else {
                this.reset(vc, vr);
                return true;
            }
        }
    }

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid column and data row coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param gridX - Horizontal grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param dataY - Vertical data cell coordinate.
     * @param subgrid
     * @param useAllCells - Search in all rows and columns instead of only rendered ones.
     * @returns True if cell was reset.
     */
    resetGridXDataY(gridX: number, dataY: number, subgrid: Subgrid | undefined, useAllCells?: boolean) {
        let vc: Renderer.VisibleColumn;
        let vr: Renderer.VisibleRow;

        if (useAllCells) {
            // When expanding selections larger than the viewport, the origin/corner
            // points may not be rendered and would normally fail to reset cell's position.
            // Mock column and row objects for this.reset() to use:
            vc = {
                column: this.grid.getAllColumn(gridX), // pick any valid column (gridX will always index a valid column)
                activeColumnIndex: gridX,
                index: -1,
                left: -1,
                rightPlus1: -1,
                top: -1,
                bottom: -1,
                width: -1,
            };
            vr = {
                subgrid: subgrid ?? this.grid.mainSubgrid,
                rowIndex: dataY,
                index: -1,
                top: -1,
                bottom: -1,
                height: -1,
            };
            this.reset(vc, vr);
            return true;
        } else {
            const vc = this.renderer.getVisibleColumn(gridX);
            if (vc === undefined) {
                return false;
            } else {
                const vr = this.renderer.getVisibleDataRow(dataY, subgrid);
                if (vr === undefined) {
                    return false;
                } else {
                    this.reset(vc, vr);
                    return true;
                }
            }
        }
    }

    clearCellOwnProperties() {
        this._cellOwnProperties = undefined;
    }

    /**
     * The raw value of the cell, unformatted.
     */
    get value() { return this.subgrid.dataModel.getValue(this.column.schemaColumn, this.dataCell.y); }
    set value(value: unknown) { this.subgrid.dataModel.setValue(this.column.schemaColumn, this.dataCell.y, value); }

    /**
     * The formatted value of the cell.
     */
    get formattedValue() { return this.grid.formatValue(this._columnProperties.format, this.value); } // was this.properties

    /**
     * An object representing the whole data row, including hidden columns.
     */
    get dataRow(): DataModel.DataRow { return this.subgrid.getRow(this.dataCell.y); }

    /**
     * The bounds of the cell.
     */
    get bounds(): RenderedCell.Bounds {
        return this._bounds ?? (this._bounds = {
            x: this.visibleColumn.left,
            y: this.visibleRow.top,
            width: this.visibleColumn.width,
            height: this.visibleRow.height
        });
    }

    get columnProperties() {
        let cp = this._columnProperties;
        if (!cp) {
            cp = this.column.properties;
            // Next 5 lines were commented out in TypeScript conversion
            // if (this.isHeaderRow || this.isSummaryRow) {
            //     cp = cp.columnHeader;
            // } else if (this.isFilterRow) {
            //     cp = cp.filterProperties;
            // }

            // isDataColumn: cp already set to cp.rowHeader or cp.treeHeader
            // isDataRow: cp already set to basic props

            this._columnProperties = cp;
        }
        return cp;
    }

    get cellOwnProperties() {
        // do not use for get/set prop because may return null; instead use .getCellProperty('prop') or .properties.prop (preferred) to get, setCellProperty('prop', value) to set
        if (this._cellOwnProperties === undefined) {
            this._cellOwnProperties = this.column.getCellOwnProperties(this.dataCell.y, this.subgrid);
        }
        return this._cellOwnProperties; // null return means there is no cell properties object
    }

    // get properties() {
    //     return this.cellOwnProperties || this.columnProperties;
    // }

    /**
     * @param key - Property name.
     * @returns Property value.
     */
    getCellProperty(key: string): unknown {
        // included for completeness but `.properties[key]` is preferred
        return this.cellOwnProperties[key];
    }

    setCellProperty(key: string, value: unknown) {
        this._cellOwnProperties = this.column.setCellProperty(this.dataCell.y, key, value, this.subgrid);
        return this._cellOwnProperties;
    }

    get rowOwnProperties() {
        // undefined return means there is no row properties object
        return this.behavior.getRowPropertiesUsingCellEvent(this, undefined);
    }

    get rowProperties() {
        // use carefully! creates new object as needed; only use when object definitely needed: for setting prop with `.rowProperties[key] = value` or `Object.assign(.rowProperties, {...})`; use `rowOwnProperties`  to avoid creating a new object when object does not exist, or `getRowProperty(key)` for getting a property that may not exist
        const properties = this.behavior.getRowPropertiesUsingCellEvent(this, null);
        if (properties) {
            return properties;
        } else {
            return undefined;
        }
    }
    set rowProperties(properties: MetaModel.RowProperties) {
        // for resetting whole row properties object: `.rowProperties = {...}`
        this.behavior.setRowPropertiesUsingCellEvent(this, properties); // calls `stateChanged()`
    }

    getRowProperty(key: string) {
        // undefined return means there is no row properties object OR no such row property `[key]`
        const rowProps = this.rowOwnProperties;
        return rowProps && rowProps[key];
    }
    setRowProperty(key: string, value: unknown) {
        // creates new object as needed
        this.rowProperties[key] = value; // todo: call `stateChanged()` after refac-as-flags
    }


    /**
     * Copy self with or without own properties
     * @param assign - Copy the own properties to the clone.
     */
    // clone(assign = false) {
    //     const cellEvent = new CellInfo(this.grid, this.gridX, this.gridY);

    //     cellEvent.resetGridXY(this.visibleColumn.index, this.visibleRow.index);

    //     if (assign) {
    //         cellEvent.renderer = this.renderer;
    //         cellEvent.selectionModel = this.selectionModel;
    //         cellEvent.behavior = this.behavior;
    //         cellEvent.dataModel = this.dataModel;
    //         cellEvent.subgrid = this.subgrid;
    //         cellEvent.dataCell = this.dataCell;
    //         cellEvent.gridCell = this.gridCell;
    //         cellEvent.visibleColumn = this.visibleColumn;
    //         cellEvent.visibleRow = this.visibleRow;
    //         cellEvent.column = this.column;
    //     }

    //     return cellEvent;
    // }

    get mousePointInClickRect() {
        const clickRect = this.clickRect; // ?? this.properties.clickRect;
        if (clickRect === undefined) {
            return true;
        // } else if (typeof clickRect.contains === 'function') {
        //     return clickRect.contains(this.mousePoint);
        } else {
            return (
                clickRect.x <= this.mousePoint.x && this.mousePoint.x < clickRect.x + clickRect.width &&
                clickRect.y <= this.mousePoint.y && this.mousePoint.y < clickRect.y + clickRect.height
            );
        }
    }

    /**
     * "Visible" means scrolled into view.
     */
    get isRowVisible() {
        return !!this.visibleRow;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isColumnVisible() {
        return !!this.visibleColumn;
    }
    /**
     * "Visible" means scrolled into view.
     */
    get isCellVisible() {
        return this.isRowVisible && this.isColumnVisible;
    }

    /**
     * A data row is any row in the data subgrid; all other rows (headers, footers, _etc._) are not data rows.
     */
    get isMainRow() {
        return this.subgrid.isMain;
    }

    /**
     * A data column is any column that is not the row number column or the tree column.
     */
    get isDataColumn() {
        return true; // this.gridCell.x >= 0;
    }

    /**
     * A data cell is a cell in both a data row and a data column.
     */
    get isDataCell() {
        return this.isMainRow && this.isDataColumn;
    }

    get isRowSelected() {
        return this.isMainRow && this.selectionModel.isRowSelected(this.dataCell.y);
    }

    get isColumnSelected() {
        return this.isDataColumn && this.selectionModel.isColumnSelected(this.gridCell.x);
    }

    get isCellSelected() {
        return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y);
    }

    get isRowHovered() {
        return this.grid.canvas.hasMouse && this.isMainRow && this.grid.hoverCell && this.grid.hoverGridCell.y === this.gridCell.y;
    }

    get isColumnHovered() {
        return this.grid.canvas.hasMouse && this.isDataColumn && this.grid.hoverCell && this.grid.hoverGridCell.x === this.gridCell.x;
    }

    get isCellHovered() {
        return this.isRowHovered && this.isColumnHovered;
    }

    get isRowFixed() {
        return this.isMainRow && this.dataCell.y < this.grid.properties.fixedRowCount;
    }

    get isColumnFixed() {
        return this.isDataColumn && this.gridCell.x < this.grid.properties.fixedColumnCount;
    }

    get isCellFixed() {
        return this.isRowFixed && this.isColumnFixed;
    }

    get isHeaderRow() {
        return this.subgrid.isHeader;
    }

    get isHeaderCell() {
        return this.isHeaderRow && this.isDataColumn;
    }

    get isFilterRow() {
        return this.subgrid.isFilter;
    }

    get isFilterCell() {
        return this.isFilterRow && this.isDataColumn;
    }

    get isSummaryRow() {
        return this.subgrid.isSummary;
    }

    get isSummaryCell() {
        return this.isSummaryRow && this.isDataColumn;
    }

    // get isTopTotalsRow() {
    //     return this.subgrid === this.behavior.subgrids.lookup.topTotals;
    // }

    // get isTopTotalsHandle() {
    //     return this.isTopTotalsRow && this.isHandleColumn;
    // }

    // get isTopTotalsCell() {
    //     return this.isTopTotalsRow && this.isDataColumn;
    // }

    // get isBottomTotalsRow() {
    //     return this.subgrid === this.behavior.subgrids.lookup.bottomTotals;
    // }

    // get isBottomTotalsHandle() {
    //     return this.isBottomTotalsRow && this.isHandleColumn;
    // }

    // get isBottomTotalsCell() {
    //     return this.isBottomTotalsRow && this.isDataColumn;
    // }


    // From selectionDetailGetters in Hypergrid - used by fin-context-menu, fin-mouseup, fin-mousedown
    get rows() { return this.grid.mainSubgrid.getSelectedRows(); }
    get columns() { return this.grid.mainSubgrid.getSelectedColumns(); }
    get selections() { return this.grid.mainSubgrid.selectionModel.selections; }
}

export namespace RenderedCell {
    export interface Bounds extends RectangleInterface {
        timestamp?: number;
    }
}
