
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { Renderer } from '../renderer/renderer';
import { GridPainter } from './grid-painter';

/** @summary Render the grid with consolidated column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any columns with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of column backgrounds are all drawn before iterating through cells. Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (`grid.properties.columnClip = true` but big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * **Regading clipping.** The reason for clipping is to prevent text from overflowing into the next column. However there is a serious performance cost.
 *
 * For performance reasons {@link Renderer#_paintCell|_paintCell} does not set up a clipping region for each cell. However, iff grid property `columnClip` is truthy, this grid renderer will set up a clipping region to prevent text overflow to right. If `columnClip` is `null`, a clipping region will only be set up on the last column. Otherwise, there will be no clipping region.
 *
 * The idea of clipping just the last column is because in addition to the optional graphics clipping, we also clip ("truncate") text. Text can be truncated conservatively so it will never overflow. The problem with this is that characters vanish as they hit the right cell boundary, which may or may be obvious depending on font size. Alternatively, text can be truncated so that the overflow will be a maximum of 1 character. This allows partial characters to be rendered. But this is where graphics clipping is required.
 *
 * When renderering column by column as this particular renderer does, _and_ when the background color _of the next cell to the right_ is opaque (alpha = 1), clipping can be turned off because each column will _overpaint_ any text that overflowed from the one before. However, any text that overflows the last column will paint into unused canvas region to the right of the grid. This is the _raison d'être_ for "clip last column only" option mentioned above (when `columnClip` is set to `null`). To avoid even this performance cost (of clipping just the last column), column widths can be set to fill the available canvas.
 *
 * Note that text never overflows to left because text starting point is never < 0. The reason we don't clip to the left is for cell renderers that need to re-render to the left to produce a merged cell effect, such as grouped column header.
 */

export class ByColumnsGridPainter extends GridPainter {
    constructor(renderer: Renderer) {
        super(renderer, ByColumnsGridPainter.key, false, ByColumnsGridPainter.initialRebundle);
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        // this = this.renderer
        const grid = this.grid;
        const gridProps = grid.properties;
        let prefillColor: string;
        const gridPrefillColor = gridProps.backgroundColor;
        const visibleColumns = this.visibleColumns;
        const visibleRows = this.visibleRows;
        const C = visibleColumns.length;
        const cLast = C - 1;
        const R = visibleRows.length;
        const pool = this.renderedCellPool;
            // clipToGrid;
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


        gc.clearRect(0, 0, this.renderer.bounds.width, this.renderer.bounds.height);

        if (!C || !R) { return; }

        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        if (this.reset) {
            this.renderer.resetAllGridRenderers(['by-columns-discrete']);
            this.reset = false;
            this.bundleColumns(true);
        } else if (this.rebundle === true) {
            // do not do this if undefined
            this.rebundle = false;
            this.bundleColumns();
        }

        for (let columnBundles = this.columnBundles, c = columnBundles.length; c--;) {
            const columnBundle = columnBundles[c];
            gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each column...
        let p = 0;
        this.visibleColumns.forEach((vc, c) => {
            let beingPaintedCell = pool[p]; // first cell in column c
            vc = beingPaintedCell.visibleColumn;

            prefillColor = beingPaintedCell.column.properties.backgroundColor;

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

export namespace ByColumnsGridPainter {
    export const key = 'by-columns';
    export const initialRebundle = true; // see rebundleGridRenderers
}
