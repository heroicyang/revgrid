
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { Renderer } from '../renderer/renderer';
import { GridPainter } from './grid-painter';

/** @summary Render the grid with discrete column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * In this grid renderer, a background rect is _not_ drawn using the grid background color.
 *
 * Rather, all columns paint their own background rects, with color defaulting to grid background color.
 *
 * The idea of painting each column rect is to "clip" text that might have overflowed from the previous column by painting over it with the background from this column. Only the last column will show overflowing text, and only if the canvas width exceeds the grid width. If this is the case, you can turn on clipping for the last column only by setting `columnClip` to `true` for the last column.
 *
 * NOTE: As a convenience feature, setting `columnClip` to `null` will clip only the last column, so simply setting it on the grid (rather than the last column) will have the same effect. This is much more convenient because you don't have to worry about the last column being redefined (moved, hidden, etc).
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumnsDiscrete|paintCellsByColumnsDiscrete}.
 */

export class ByColumnsDiscreteGridPainter extends GridPainter {
    constructor(renderer: Renderer) {
        super(renderer, ByColumnsDiscreteGridPainter.key, false, undefined);
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        // this = this.renderer
        let prefillColor: string;
        const visibleColumns = this.visibleColumns;
        const visibleRows = this.visibleRows;
        const C = visibleColumns.length;
        const cLast = C - 1;
        const R = visibleRows.length;
        const pool = this.renderedCellPool;
        // clipToGrid;
        // let firstVisibleColumnLeft: number;
        // let lastVisibleColumnRight: number;
        // if (C === 0) {
        //     firstVisibleColumnLeft = 0;
        //     lastVisibleColumnRight = 0;
        // } else {
        //     firstVisibleColumnLeft = this.visibleColumns[0].left;
        //     lastVisibleColumnRight = this.visibleColumns[cLast].right;
        // }
        const viewHeight = R ? visibleRows[R - 1].bottom : 0;

        gc.clearRect(0, 0, this.renderer.bounds.width, this.renderer.bounds.height);

        if (!C || !R) { return; }

        if (this.reset) {
            this.renderer.resetAllGridRenderers(['by-columns']);
            this.reset = false;
            this.bundleColumns(true);
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each column...
        let p = 0;
        this.visibleColumns.forEach((vc, c) => {
            let beingPaintedCell = pool[p]; // first cell in column c
            vc = beingPaintedCell.visibleColumn;

            prefillColor = beingPaintedCell.column.properties.backgroundColor;
            gc.clearFill(vc.left, 0, vc.width, viewHeight, prefillColor);

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            const columnClip = vc.column.properties.columnClip;
            gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.rightPlus1, viewHeight);

            let preferredWidth = 0;
            // For each row of each subgrid (of each column)...
            for (let r = 0; r < R; r++, p++) {
                beingPaintedCell = pool[p]; // next cell down the column (redundant for first cell in column)

                const config = beingPaintedCell.subgrid.getCellPaintConfig(beingPaintedCell);

                try {
                    preferredWidth = Math.max(preferredWidth, this.paintCell(gc, beingPaintedCell, config, prefillColor));
                } catch (e) {
                    this.paintErrorCell(e as Error, gc, vc, beingPaintedCell.visibleRow);
                }
            }

            gc.clipRestore(columnClip);

            beingPaintedCell.column.properties.preferredWidth = Math.ceil(preferredWidth);
        });

        // gc.clipRestore(clipToGrid);
    }
}

export namespace ByColumnsDiscreteGridPainter {
    export const key = 'by-columns-discrete';
}
