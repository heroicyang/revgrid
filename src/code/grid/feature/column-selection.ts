
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ColumnProperties } from '../column/column-properties';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { Point } from '../lib/point';
import { ColumnMoving } from './column-moving';

export class ColumnSelection extends Feature {

    readonly typeName = ColumnSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    currentDrag: Point = null;

    /**
     * The horizontal cell coordinate of the where the mouse pointer is during a drag operation.
     */
    lastDragColumn = -1 // null;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    sbAutoStart = 0;

    dragging = false;
    doubleClickTimer: ReturnType<typeof setTimeout>;


    override handleMouseUp(event: MouseCellEvent) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(event);
        }
    }

    override handleDoubleClick(event: MouseCellEvent) {
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer); // prevent mouseDown from continuing
            this.doubleClickTimer = undefined;
        }
        if (this.next) {
            this.next.handleDoubleClick(event);
        }
    }

    override handleMouseDown(event: MouseCellEvent) {
        if (this.doubleClickTimer) {
            return;
        }

        // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
        const grid = this.grid;
        if (
            grid.properties.columnSelection &&
            !event.mouse.isRightClick &&
            (
                grid.properties.autoSelectColumns ||
                event.isHeaderCell
            )
        ) {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this.doubleClickTimer = setTimeout(
                () => this.doubleClickTimerCallback(event),
                this.doubleClickDelay(event)
            );
        } else if (this.next) {
            this.next.handleMouseDown(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;
        if (
            grid.properties.columnSelection &&
            !this.isColumnDragging() &&
            !event.mouse.isRightClick &&
            this.dragging
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragColumn = event.gridCell.x;
            this.currentDrag = event.mouse.mouse;
            this.checkDragScroll(this.currentDrag);
            this.handleMouseDragCellSelection(this.lastDragColumn);
        } else if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const grid = this.grid;
        const handler = grid.getLastSelectionType() === 'column' &&
                this['handle' + eventDetail.primitiveEvent.key];

        if (handler) {
            handler(eventDetail);
        } else if (this.next) {
            this.next.handleKeyDown(eventDetail);
        }
    }

    /**
     * @desc Handle a mousedrag selection
     * @param keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection(x: number) {
        const grid = this.grid;
        const mouseX = grid.getMouseDown().x;

        grid.clearMostRecentColumnSelection();

        grid.selectColumns(mouseX, x);
        grid.setDragExtent(Point.create(x - mouseX, 0));

        grid.repaint();
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(mouse: Point) {
        const grid = this.grid;
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mouse)
        ) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else {
            if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag();
            }
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

        const b = grid.getDataBounds();
        let xOffset: number;

        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        } else if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }

        if (xOffset) {
            if (this.lastDragColumn >= grid.getFixedColumnCount()) {
                this.lastDragColumn += xOffset;
            }
            grid.scrollColumnsBy(xOffset);
        }

        this.handleMouseDragCellSelection(this.lastDragColumn); // update the selection
        grid.repaint();
        setTimeout(() => this.scrollDrag(), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     */
    extendSelection(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const grid = this.grid;
        if (!grid.abortEditing()) { return; }

        const mouseX = grid.getMouseDown().x;

        if (x < 0) { // outside of the grid?
            return; // do nothing
        }

        if (shiftKeyDown) {
            grid.clearMostRecentColumnSelection();
            grid.selectColumns(x, mouseX);
            grid.setDragExtent(Point.create(x - mouseX, 0));
        } else {
            grid.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
            grid.setMouseDown(Point.create(x, 0));
            grid.setDragExtent(Point.create(0, 0));
        }

        grid.repaint();
    }


    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleDOWNSHIFT() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleUPSHIFT() {

    }

    handleLEFTSHIFT() {
        this.moveShiftSelect(-1);
    }

    handleRIGHTSHIFT() {
        this.moveShiftSelect(1);
    }

    handleDOWN() {

        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // grid.repaint();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleUP() {

    }

    handleLEFT() {
        this.moveSingleSelect(-1);
    }

    handleRIGHT() {
        this.moveSingleSelect(1);
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
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
     */
    moveShiftSelect(offsetX: number) {
        const grid = this.grid;
        const origin = grid.getMouseDown();
        const extent = grid.getDragExtent();
        let newX = extent.x + offsetX;
        const maxViewableColumns = grid.renderer.visibleColumns.length - 1;
        let maxColumns = grid.getActiveColumnCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

        grid.clearMostRecentColumnSelection();
        grid.selectColumns(origin.x, origin.x + newX);
        grid.setDragExtent(Point.create(newX, 0));

        if (grid.ensureModelColIsVisible(newX + origin.x, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    }

    /**
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param offsetX - x coordinate to start at
     */
    override moveSingleSelect(offsetX: number) {
        const grid = this.grid;
        const extent = grid.getDragExtent();
        const mouseCorner = Point.plus(grid.getMouseDown(), extent);
        let newX = mouseCorner.x + offsetX;
        let maxColumns = grid.getActiveColumnCount() - 1;
        const maxViewableColumns = grid.getVisibleColumnsCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));

        grid.beginSelectionChange();
        try {
            grid.clearSelections();
            grid.selectColumns(newX);
        } finally {
            grid.endSelectionChange();
        }
        grid.setMouseDown(Point.create(newX, 0));
        grid.setDragExtent(Point.create(0, 0));

        if (grid.ensureModelColIsVisible(newX, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    }

    isColumnDragging() {
        const dragger = this.grid.lookupFeature('ColumnMoving') as ColumnMoving;
        return dragger && (dragger.dragging || dragger.dragArmed); //&& !this.dragging;
    }

    private doubleClickDelay(event: CellEvent) {
        let columnProperties: ColumnProperties;

        return (
            event.isHeaderCell &&
            (columnProperties = event.columnProperties).sortable &&
            columnProperties.sortOnDoubleClick &&
            300
        );
    }

    private doubleClickTimerCallback(event: MouseCellEvent) {
        this.doubleClickTimer = undefined;
        this.dragging = true;
        const mouseEvent = event.mouse.primitiveEvent;
        this.extendSelection(event.gridCell.x, mouseEvent.shiftKey, mouseEvent.ctrlKey);
    }
}

export namespace ColumnSelection {
    export const typeName = 'columnselection';
}
