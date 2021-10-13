
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ColumnRowResizing } from '../feature/column-row-resizing';
import { Point } from '../lib/point';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid';

export class RowResizing extends ColumnRowResizing {

    readonly typeName = RowResizing.typeName;

    /**
     * the index of the row/column we are dragging
     */
    private dragArea = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private dragAreaStartingSize = -1;

    /**
     * @desc get the mouse x,y coordinate
     * @param event - the mouse event to query
     */
    override getMouseValue(event: MouseCellEvent) {
        return event.mouse.mouse.y;
    }

    /**
     * @desc get the grid cell x,y coordinate
     */
    getGridCellValue(gridCell: Point): number {
        return gridCell.x;
    }

    /**
     * @desc return the grids x,y scroll value
     */
    getScrollValue(grid: Revgrid): number {
        return grid.getVScrollValue();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override getGridRightBottomAligned(grid: Revgrid) {
        return false;
    }

    /**
     * @desc return the width/height of the row/column of interest
     * @param index - the row/column index of interest
     */
    private getAreaSize(grid: Revgrid, index: number): number {
        return grid.getRowHeight(index);
    }

    /**
     * @desc set the width/height of the row/column at index
     * @param index - the row/column index of interest
     * @param value - the width/height to set to
     */
    private setAreaSize(grid: Revgrid, index: number, value: number, subgrid: Subgrid) {
        grid.setRowHeight(index, value, subgrid);
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override overAreaDivider(event: CellEvent): boolean {
        return false; // previously returned void (undefined)
    }

    /**
     * @desc am I over the column/row area
     */
    private isFirstFixedOtherArea(event: CellEvent): boolean {
        return this.isFirstFixedColumn(event);
    }

    /**
     * @desc return the cursor name
     */
    override getCursorName() {
        return 'row-resize';
    }

    private getFixedAreaCount(grid: Revgrid): number {
        return grid.getFixedRowCount() + grid.getHeaderRowCount();
    }

    // isEnabled(grid: Hypergrid): boolean {
    //     return grid.isRowResizeable();
    // }
}

export namespace RowResizing {
    export const typeName = 'rowresizing';
}
