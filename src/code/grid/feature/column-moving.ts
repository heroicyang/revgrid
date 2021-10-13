import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { Feature } from '../feature/feature';
import { Point } from '../lib/point';
import { Renderer } from '../renderer/renderer';

const enum MoveLocation { Before, After }
const enum DragActionType { Move, Scroll, None }

interface Action {
    type: DragActionType;
}

interface MoveAction extends Action {
    type: DragActionType.Move;
    location: MoveLocation;
    source: Renderer.VisibleColumn | null;
    target: Renderer.VisibleColumn | null;
}

interface ScrollAction extends Action {
    type: DragActionType.Scroll;
    toRight: boolean;
    mouseOffGrid: boolean; // only considers left and right off grid
    source: Renderer.VisibleColumn;
}

interface NoAction extends Action {
    type: DragActionType.None;
}

type ColumnDragAction = MoveAction | ScrollAction | NoAction

export class ColumnMoving extends Feature {

    readonly typeName = ColumnMoving.typeName;

    // static GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing']
    static GRABBING = 'grabbing';
    // static GRAB = ['grab', '-moz-grab', '-webkit-grab']
    static GRAB = 'grab';

    private _dragOverlay: HTMLCanvasElement;
    private _dragCol: Renderer.VisibleColumn;
    private _dragArmed = false;
    private _dragging = false;
    private _scrolling = false;
    private _scrollVelocity = 0;

    get dragArmed() { return this._dragArmed; }
    get dragging() { return this._dragging; }

    override initializeOn() {
        this._dragOverlay = document.createElement('canvas');
        this._dragOverlay.style.position = 'absolute';
        this._dragOverlay.style.pointerEvents = 'none';
        this._dragOverlay.style.top = '0px';
        this._dragOverlay.style.left = '0px';
        this._dragOverlay.style.display = 'none';

        this.grid.containerHtmlElement.appendChild(this._dragOverlay);

        super.initializeOn();
    }

    override handleMouseDown(event: MouseCellEvent) {
        const grid = this.grid;
        const ctrlKeyDown = event.mouse.primitiveEvent.ctrlKey;
        if (
            ctrlKeyDown &&
            grid.properties.columnsReorderable &&
            !event.mouse.isRightClick &&
            !event.isColumnFixed &&
            event.isHeaderCell
        ) {
            this._dragArmed = true;
            this.cursor = ColumnMoving.GRABBING;
            this.grid.mainSubgrid.stashSelections();
            this.grid.featuresSharedState.mouseDownUpClickUsedForMoveOrResize = true;
        }
        super.handleMouseDown(event);
    }

    override handleMouseUp(event: MouseCellEvent) {
        if (this._dragging) {

            const dragAction = this.getDragAction(event);

            this.endGridScrolling();
            this.endDragColumn(dragAction);
            this.grid.mainSubgrid.unstashSelections();
            this.cursor = null
            // End Column Drag
            setTimeout(() => {
                this.attachChain();
                // This is fired so the hover feature
                //  can update the hovered column
                this.next.handleMouseMove(event);
            }, 50);
            this._dragging = false;
            this.grid.featuresSharedState.mouseDownUpClickUsedForMoveOrResize = true;
        }
        this._dragArmed = false;
        this._dragOverlay.style.display = 'none';
        requestAnimationFrame(() => this.render(null));
        super.handleMouseUp(event);
    }

    override handleMouseMove(event: MouseCellEvent | undefined) {
        const grid = this.grid;
        if (
            event !== undefined &&
            event.mouse.primitiveEvent.ctrlKey &&
            grid.properties.columnsReorderable &&
            !event.isColumnFixed &&
            !this._dragging &&
            event.isHeaderCell
        ) {
            this.cursor = ColumnMoving.GRAB;
        } else {
            this.cursor = null;
        }

        if (this._dragging) {
            this.cursor = ColumnMoving.GRABBING;
        }
        else {
            super.handleMouseMove(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;

        // if (event.isColumnFixed) {
        //     super.handleMouseDrag(grid, event);
        //     return;
        // }

        if (event.isHeaderCell && this._dragArmed && !this._dragging) {
            this._dragCol = event.visibleColumn;
            this._dragOverlay.width = grid.canvas.width;
            this._dragOverlay.height = grid.canvas.height;
            this._dragOverlay.style.display = null;
            this._dragging = true;
            this.detachChain();
        }
        else {
            super.handleMouseDrag(event);
        }

        if (this._dragging) {

            const dragAction = this.getDragAction(event);

            if (dragAction.type === DragActionType.Scroll) {
                this.scroll(dragAction);
            }
            else {
                this.endGridScrolling();
            }

            requestAnimationFrame(() => this.render(dragAction));
        }

    }

    private scroll(action: ScrollAction) {
        this._scrollVelocity = action.toRight ? 1 : -1;

        if (!this._scrolling) {
            this._scrolling = true;
            this.beginGridScrolling(action);
        }
    }

    private endGridScrolling() {
        this._scrolling = false;
        this._scrollVelocity = 0;
    }

    private beginGridScrolling(action: ScrollAction) {
        setTimeout(() => {
            if (!this._scrolling) {
                return;
            }

            if (this.grid.scrollColumnsBy(this._scrollVelocity)) {
                this.render(action);
            }

            this.beginGridScrolling(action);
        },
        400);
    }

    private render(dragAction: ColumnDragAction) {
        const grid = this.grid;

        const dragContext = this._dragOverlay.getContext('2d', { alpha: true });
        this._dragOverlay.width = grid.canvas.width;
        this._dragOverlay.height = grid.canvas.height;
        dragContext.clearRect(0, 0, grid.canvas.width, grid.canvas.height);

        if (dragAction !== null) {

            if (dragAction.type == DragActionType.Move) {
                const indicatorX = dragAction.location === MoveLocation.Before
                    ? dragAction.target.left
                    : dragAction.target.rightPlus1;
                dragContext.fillStyle = 'rgba(50, 50, 255, 1)';
                dragContext.fillRect(indicatorX, 0, 2, grid.canvas.height);
            }

            const dragCol = grid.renderer.getVisibleColumn(this._dragCol.activeColumnIndex);
            if (dragCol) {
                const hideAction = dragAction.type === DragActionType.Scroll && grid.properties.columnsReorderableHideable && dragAction.mouseOffGrid;
                dragContext.fillStyle = hideAction
                    ? 'rgba(255, 50, 50, 0.2)'
                    : 'rgba(50, 50, 255, 0.2)';
                dragContext.fillRect(dragCol.left, 0, dragCol.width, grid.canvas.height);
            }
        }
    }

    private endDragColumn(dragAction: ColumnDragAction) {
        const grid = this.grid;
        switch (dragAction.type) {
            case DragActionType.Scroll:
                if (grid.properties.columnsReorderableHideable && dragAction.mouseOffGrid) {
                    grid.hideActiveColumn(dragAction.source.activeColumnIndex);
                }
                break;
            case DragActionType.Move:
                if (dragAction.location === MoveLocation.Before) {
                    grid.moveColumnBefore(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex);
                } else {
                    grid.moveColumnAfter(dragAction.source.activeColumnIndex, dragAction.target.activeColumnIndex);
                }
                break;
        }
        grid.fireSyntheticOnColumnsChangedEvent();
    }

    private getDragAction(event: CellEvent) {
        const grid = this.grid;
        const updatedDragCol = grid.renderer.getVisibleColumn(this._dragCol.activeColumnIndex)
        const dragCol = updatedDragCol ? updatedDragCol : this._dragCol;
        const gridBounds = grid.getBounds();
        return this.calculateDragAction(
            dragCol,
            updatedDragCol !== undefined,
            event.visibleColumn,
            event.isColumnFixed,
            gridBounds.width,
            event.gridPoint,
            event.mousePoint
        )
    }

    private calculateDragAction(
        dragCol: Renderer.VisibleColumn,
        dragColIsVisible: boolean,
        overCol: Renderer.VisibleColumn,
        colIsFixed: boolean,
        gridWidth: number,
        gridPoint: Point,
        mousePoint: Point): ColumnDragAction
    {
        const mouseLeftOffGrid = gridPoint.x < 0;
        const mouseRightOffGrid = gridPoint.x >= gridWidth;
        const scrollLeft = colIsFixed || mouseLeftOffGrid;
        const scrollRight = mouseRightOffGrid;
        if (scrollLeft || scrollRight) {
            return {
                type: DragActionType.Scroll,
                toRight: scrollRight,
                mouseOffGrid: mouseLeftOffGrid || mouseRightOffGrid,
                source: dragCol
            };
        } else {
            const lower = dragCol.left - overCol.width / 2;
            const upper = dragCol.rightPlus1 + overCol.width / 2;
            const inMoveRange = !dragColIsVisible || gridPoint.x < lower || gridPoint.x > upper;
            if (!inMoveRange || overCol.index < 0) {
                return { type: DragActionType.None }
            }

            const location = mousePoint.x > overCol.width / 2
                ? MoveLocation.After
                : MoveLocation.Before;

            return {
                type: DragActionType.Move,
                location,
                source: dragCol,
                target: overCol
            };
        }
    }
}

export namespace ColumnMoving {
    export const typeName = 'columnmoving';
}
