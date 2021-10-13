
import { MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { Point } from '../lib/point';

export class CellSelection extends Feature {

    readonly typeName = CellSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    currentDrag: Point;

    /**
     * the cell coordinates of the where the mouse pointer is during a drag operation
     */
    lastDragCell: Point;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    sbAutoStart = 0;
    dragging: boolean;

    override handleMouseUp(event: MouseCellEvent) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(event);
        }
    }

    override handleMouseDown(event: MouseCellEvent) {
        const grid = this.grid;
        const dx = event.gridCell.x;
        const dy = event.dataCell.y;
        const isSelectable = grid.getCellProperty(event.dataCell.x, event.gridCell.y, 'cellSelection', event.subgrid);

        if (isSelectable && event.isDataCell && !event.mouse.isRightClick) {
            const dCell = Point.create(dx, dy);
            const mouse = event.mouse;
            this.dragging = true;
            this.extendSelection(dCell, mouse.primitiveEvent.shiftKey, mouse.primitiveEvent.ctrlKey);
        } else if (this.next) {
            this.next.handleMouseDown(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;
        if (this.dragging && grid.properties.cellSelection && !event.mouse.isRightClick) {
            this.currentDrag = event.mouse.mouse;
            this.lastDragCell = Point.create(event.gridCell.x, event.dataCell.y);
            this.checkDragScroll(this.currentDrag);
            this.handleMouseDragCellSelection(this.lastDragCell);
        } else if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const grid = this.grid;
        const cellEvent = grid.getGridCellFromLastSelection(true);
        const navKey = grid.generateNavKey(eventDetail.primitiveEvent)
        const handler = this['handle' + navKey];

        // STEP 1: Move the selection
        if (handler) {
            handler.call(this, eventDetail.primitiveEvent);

            // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
            if (cellEvent.columnProperties.editOnNextCell) {
                grid.renderer.computeCellsBounds(true); // moving selection may have auto-scrolled
                const cellEvent = grid.getGridCellFromLastSelection(false); // new cell
                grid.editAt(cellEvent); // succeeds only if `editable`
            }

            // STEP 3: If editor not opened on new cell, take focus
            if (!grid.cellEditor) {
                grid.takeFocus();
            }
        } else if (this.next) {
            this.next.handleKeyDown(eventDetail);
        }
    }

    /**
     * @desc Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection(gridCell: Point) {
        const grid = this.grid;
        const x = Math.max(0, gridCell.x);
        const y = Math.max(0, gridCell.y);
        const previousDragExtent = grid.getDragExtent();
        const mouseDown = grid.getMouseDown();
        const newX = x - mouseDown.x;
        const newY = y - mouseDown.y;

        if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
            return;
        }

        grid.beginSelectionChange();
        try {
            grid.clearMostRecentSelection();
            grid.select(mouseDown.x, mouseDown.y, newX, newY);
        } finally {
            grid.endSelectionChange();
        }
        grid.setDragExtent(Point.create(newX, newY));

        grid.repaint();
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(mouse: Point) {
        const grid = this.grid;
        if (!grid.properties.scrollingEnabled) {
            return;
        }
        const b = grid.getDataBounds();
        const inside = b.contains(mouse);
        if (inside) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else if (!grid.isScrollingNow()) {
            grid.setScrollingNow(true);
            this.scrollDrag();
        }
    }

    /**
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     */
    scrollDrag() {
        const grid = this.grid;
        if (!grid.isScrollingNow()) {
            return;
        }

        const dragStartedInHeaderArea = grid.isMouseDownInHeaderArea();
        const lastDragCell = this.lastDragCell;
        const b = grid.getDataBounds();

        let xOffset = 0;
        let yOffset = 0;

        const numFixedColumns = grid.getFixedColumnCount();
        const numFixedRows = grid.getFixedRowCount();

        const dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
        const dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (!dragStartedInHeaderArea) {
            if (this.currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
        }
        if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }
        if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        let dragCellOffsetX = xOffset;
        let dragCellOffsetY = yOffset;

        if (dragEndInFixedAreaX) {
            dragCellOffsetX = 0;
        }
        if (dragEndInFixedAreaY) {
            dragCellOffsetY = 0;
        }

        this.lastDragCell = Point.plusXY(lastDragCell, dragCellOffsetX, dragCellOffsetY);
        grid.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(lastDragCell); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection(gridCell: Point, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const grid = this.grid;
        const mousePoint = grid.getMouseDown();
        const x = gridCell.x; // - numFixedColumns + scrollLeft;
        const y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        grid.beginSelectionChange();
        try {
            //we have repeated a click in the same spot deslect the value from last time
            if (
                ctrlKeyDown &&
                x === mousePoint.x &&
                y === mousePoint.y
            ) {
                grid.clearMostRecentSelection();
                grid.popMouseDown();
                grid.repaint();
                return;
            }

            if (!ctrlKeyDown && !shiftKeyDown) {
                grid.clearSelections();
            }

            if (shiftKeyDown) {
                grid.clearMostRecentSelection();
                grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
                grid.setDragExtent(Point.create(x - mousePoint.x, y - mousePoint.y));
            } else {
                grid.select(x, y, 0, 0);
                grid.setMouseDown(Point.create(x, y));
                grid.setDragExtent(Point.create(0, 0));
            }
        } finally {
            grid.endSelectionChange();
        }
        grid.repaint();
    }


    handleDOWNSHIFT() {
        this.moveShiftSelect(0, 1);
    }

    handleUPSHIFT() {
        this.moveShiftSelect(0, -1);
    }

    handleLEFTSHIFT() {
        this.moveShiftSelect(-1, 0);
    }

    handleRIGHTSHIFT() {
        this.moveShiftSelect(1, 0);
    }

    handleDOWN(event: KeyboardEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.preventDefault();

        const count = this.getAutoScrollAcceleration();
        this.grid.moveSingleSelect(0, count);
    }

    handleUP(event: KeyboardEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.preventDefault();

        const count = this.getAutoScrollAcceleration();
        this.grid.moveSingleSelect(0, -count);
    }

    handleLEFT() {
        this.grid.moveSingleSelect(-1, 0);
    }

    handleRIGHT() {
        this.grid.moveSingleSelect(1, 0);
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        const count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    }

    /**
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime() {
        this.sbAutoStart = Date.now();
    }

    /**
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll() {
        const now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    }

    /**
     * @desc answer how long we have been auto scrolling
     */
    getAutoScrollDuration() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    }

    /**
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    moveShiftSelect(offsetX: number, offsetY: number) {
        if (this.grid.extendSelect(offsetX, offsetY)) {
            this.pingAutoScroll();
        }
    }

}

export namespace CellSelection {
    export const typeName = 'cellselection';
}
