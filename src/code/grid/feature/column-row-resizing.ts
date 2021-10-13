
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { Column } from '../column/column';
import { Revgrid } from '../revgrid';
import { Feature } from './feature';

export abstract class ColumnRowResizing extends Feature {
    private dragColumn: Column | undefined;

    /**
     * the pixel location of the where the drag was initiated
     */
    protected dragStart = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    dragStartWidth = -1;

    inPlaceAdjacentStartWidth: number;
    inPlaceAdjacentColumn: Column;

    /**
     * @desc get the mouse x,y coordinate
     * @param event - the cell event to query
     */
    protected abstract getMouseValue(event: CellEvent): number;

    /**
     * @desc returns the index of which divider I'm over
     */
    protected abstract overAreaDivider(event: CellEvent): boolean;

    /**
     * @desc return the cursor name
     */
    protected abstract getCursorName(): string;

    protected abstract getGridRightBottomAligned(grid: Revgrid): boolean;

    override handleMouseDrag(event: MouseCellEvent) {
        if (this.dragColumn !== undefined) {
            const grid = this.grid;
            const mouseValue = this.getMouseValue(event);
            let delta: number;
            if (this.getGridRightBottomAligned(grid)) {
                delta = this.dragStart - mouseValue;
            } else {
                delta = mouseValue - this.dragStart;
            }
            const dragWidth = this.dragStartWidth + delta;
            const inPlaceAdjacentWidth = this.inPlaceAdjacentStartWidth - delta;
            if (!this.inPlaceAdjacentColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                grid.setActiveColumnWidth(this.dragColumn, dragWidth);
            } else {
                const np = this.inPlaceAdjacentColumn.properties;
                const dp = this.dragColumn.properties;
                if (
                    0 < delta && delta <= (this.inPlaceAdjacentStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this.dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || inPlaceAdjacentWidth < np.maximumColumnWidth)
                ) {
                    grid.setActiveColumnWidth(this.dragColumn, dragWidth);
                    grid.setActiveColumnWidth(this.inPlaceAdjacentColumn, inPlaceAdjacentWidth);
                }
            }
        } else if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    override handleMouseDown(event: MouseCellEvent) {
        if (event.isHeaderRow && this.overAreaDivider(event)) {
            const grid = this.grid;
            const visibleColumnCount = grid.renderer.visibleColumns.length;
            let vc = event.visibleColumn;
            let vcIndex = vc.index;

            const gridRightBottomAligned = this.getGridRightBottomAligned(grid);
            if (!gridRightBottomAligned) {
                if (event.mousePoint.x <= 3) {
                    vcIndex--;
                    if (vcIndex < 0) {
                        return; // can't drag left-most column boundary
                    } else {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        this.dragColumn = vc.column;
                        this.dragStartWidth = vc.width;
                    }
                } else {
                    this.dragColumn = event.column;
                    this.dragStartWidth = event.bounds.width;
                }
            } else {
                if (event.mousePoint.x >= event.bounds.width - 3) {
                    vcIndex++;
                    if (vcIndex >= visibleColumnCount) {
                        return; // can't drag right-most column boundary
                    } else {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        this.dragColumn = vc.column;
                        this.dragStartWidth = vc.width;
                    }
                } else {
                    this.dragColumn = event.column;
                    this.dragStartWidth = event.bounds.width;
                }
            }




            // let gridColumnIndex = event.gridCell.x;

            // const gridRightBottomAligned = this.getGridRightBottomAligned(grid);
            // if (!gridRightBottomAligned) {
            //     if (event.mousePoint.x <= 3) {
            //         gridColumnIndex -= 1;
            //         if (gridColumnIndex === grid.behavior.treeColumnIndex) {
            //             gridColumnIndex--; // get row number column if tree column undefined
            //         }
            //         const vc = grid.renderer.visibleColumns[gridColumnIndex];
            //         if (vc) {
            //             this.dragColumn = vc.column;
            //             this.dragStartWidth = vc.width;
            //         } else {
            //             return; // can't drag left-most column boundary
            //         }
            //     } else {
            //         this.dragColumn = event.column;
            //         this.dragStartWidth = event.bounds.width;
            //     }
            // } else {
            //     if (event.mousePoint.x >= event.bounds.width - 3) {
            //         gridColumnIndex += 1;
            //         if (gridColumnIndex === grid.behavior.treeColumnIndex) {
            //             gridColumnIndex++; // get first data column if tree column undefined
            //         }
            //         const vc = grid.renderer.visibleColumns[gridColumnIndex];
            //         if (vc) {
            //             this.dragColumn = vc.column;
            //             this.dragStartWidth = vc.width;
            //         } else {
            //             return; // can't drag right-most column boundary
            //         }
            //     } else {
            //         this.dragColumn = event.column;
            //         this.dragStartWidth = event.bounds.width;
            //     }
            // }

            this.dragStart = this.getMouseValue(event);

            if (this.dragColumn.properties.resizeColumnInPlace) {
                let column: Column | undefined;

                if (!gridRightBottomAligned) {
                    vcIndex++;
                    if (vcIndex < visibleColumnCount) {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        column = vc.column;
                    }
                } else {
                    vcIndex--;
                    if (vcIndex >= 0) {
                        vc = grid.renderer.visibleColumns[vcIndex];
                        column = vc.column;
                    }
                }

                if (column) {
                    this.inPlaceAdjacentColumn = column;
                    this.inPlaceAdjacentStartWidth = column.getWidth();
                } else {
                    this.inPlaceAdjacentColumn = undefined;
                }
            } else {
                this.inPlaceAdjacentColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
            }
            this.grid.featuresSharedState.mouseDownUpClickUsedForMoveOrResize = true;
        } else {
            super.handleMouseDown(event);
        }
    }

    override handleMouseUp(event: MouseCellEvent) {
        if (this.dragColumn !== undefined) {
            this.cursor = null;
            this.dragColumn = undefined;

            event.mouse.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            this.grid.behaviorShapeChanged();
            this.grid.featuresSharedState.mouseDownUpClickUsedForMoveOrResize = true;
        } else {
            super.handleMouseUp(event);
        }
    }

    override handleMouseMove(event: MouseCellEvent | undefined) {
        if (this.dragColumn === undefined) {
            this.cursor = null;

            super.handleMouseMove(event);

            if (event !== undefined) {
                this.cursor = event !== undefined && event.isHeaderRow && this.overAreaDivider(event) ? this.getCursorName() : null;
            }
        }
    }

    override handleDoubleClick(event: MouseCellEvent) {
        if (event.isHeaderRow && this.overAreaDivider(event)) {
            const grid = this.grid;
            const column = event.mousePoint.x <= 3
                ? grid.getActiveColumn(event.gridCell.x - 1)
                : event.column;
            column.properties.columnAutosizing = true;
            column.properties.columnAutosized = false;  // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
            setTimeout(() => { // do after next render, which measures text now that auto-sizing is on
                grid.autosizeColumn(column);
            });
        } else if (this.next) {
            this.next.handleDoubleClick(event);
        }
    }
}
