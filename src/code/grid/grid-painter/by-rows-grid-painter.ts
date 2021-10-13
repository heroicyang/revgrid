
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { Renderer } from '../renderer/renderer';
import { GridPainter } from './grid-painter';

/** @summary Render the grid.
 * @desc _**NOTE:** This grid renderer is not as performant as the others and it's use is not recommended if you care about performance. The reasons for the wanting performance are unclear, possibly having to do with the way Chrome optimizes access to the column objects?_
 *
 * Paints all the cells of a grid, one row at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 */
export class ByRowsGridPainter extends GridPainter {
    constructor(renderer: Renderer) {
        super(renderer, ByRowsGridPainter.key, false, undefined);
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        // this = this.renderer
        const grid = this.grid;
        const gridProps = grid.properties;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowBundles = this.rowBundles;
        const visibleColumns = this.visibleColumns;
        const visibleRows = this.visibleRows;
        const C = visibleColumns.length;
        const c0 = 0;
        const cLast = C - 1;
        const R = visibleRows.length;
        const pool = this.renderedCellPool;
        const preferredWidth = Array(C - c0).fill(0);
        // columnClip,
        // clipToGrid,
        let firstVisibleColumnLeft: number;
        let lastVisibleColumnRight: number;
        if (C === 0) {
            firstVisibleColumnLeft = 0;
            lastVisibleColumnRight = 0;
        } else {
            firstVisibleColumnLeft = this.visibleColumns[0].left;
            lastVisibleColumnRight = this.visibleColumns[cLast].rightPlus1;
        }
        const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
        const viewHeight = R ? visibleRows[R - 1].bottom : 0;
        const drawLines = gridProps.gridLinesH;
        const lineWidth = gridProps.gridLinesHWidth;
        const lineColor = gridProps.gridLinesHColor;

        gc.clearRect(0, 0, this.renderer.bounds.width, this.renderer.bounds.height);

        if (!C || !R) { return; }

        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        if (this.reset) {
            this.renderer.resetAllGridRenderers();
            this.reset = false;
            this.bundleRows(true);
        }

        const rowPrefillColors = this.rowPrefillColors;

        for (let r = rowBundles.length; r--;) {
            const rowBundle = rowBundles[r];
            gc.clearFill(firstVisibleColumnLeft, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each row of each subgrid...
        for (let p = 0, r = 0; r < R; r++) {
            const prefillColor = rowPrefillColors[r];

            if (drawLines) {
                gc.cache.fillStyle = lineColor;
                gc.fillRect(firstVisibleColumnLeft, pool[p].visibleRow.bottom, viewWidth, lineWidth);
            }

            // For each column (of each row)...
            visibleColumns.forEach((vc, c) => {  // eslint-disable-line no-loop-func
                p++;
                const beingPaintedCell = pool[p]; // next cell across the row (redundant for first cell in row)
                vc = beingPaintedCell.visibleColumn;

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.properties.columnClip;
                gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.rightPlus1, viewHeight);

                const config = beingPaintedCell.subgrid.getCellPaintConfig(beingPaintedCell);

                try {
                    preferredWidth[c] = Math.max(preferredWidth[c], this.paintCell(gc, beingPaintedCell, config, prefillColor));
                } catch (e) {
                    this.paintErrorCell(e as Error, gc, vc, visibleRows[r]);
                }

                gc.clipRestore(columnClip);
            });
        }

        // gc.clipRestore(clipToGrid);

        this.visibleColumns.forEach((vc, c) => {
            vc.column.properties.preferredWidth = Math.round(preferredWidth[c]);
        });
    }
}

export namespace ByRowsGridPainter {
    export const key = 'by-rows';
}
