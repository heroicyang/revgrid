import { Animation } from '../canvas/animation';
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPainter } from '../cell-painter/cell-painter';
import { CellPainterRepository } from '../cell-painter/cell-painter-repository';
import { BeingPaintedCell } from '../cell/being-painted-cell';
import { RenderedCell } from '../cell/rendered-cell';
import { Column } from '../column/column';
import { ColumnsManager } from '../column/columns-manager';
import { EventDetail } from '../event/event-detail';
import { EventName } from '../event/event-name';
import { GridPainter } from '../grid-painter/grid-painter';
import { GridPainterRepository } from '../grid-painter/grid-painter-repository';
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { Point } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangle';
import { AssertError, UnreachableCaseError } from '../lib/revgrid-error';
import { invalidModelUpdateId, lowestValidModelUpdateId, ModelUpdateId } from '../model/schema-model';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid';
import { RenderAction } from './render-action';
import { RenderActioner } from './render-actioner';


/** CanvasRenderingContext2D
 * {@link https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D|CanvasRenderingContext2D}
 */


/**
 * @desc fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.
 *
 * It relies on two other external subprojects
 *
 * 1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
 * 2. rectangular: a small npm module providing Point and Rectangle objects
 *
 * The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
 * Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.
 *
 * Instances of this object have basically four main functions.
 *
 * 1. render fixed row headers
 * 2. render fixed col headers
 * 3. render main data cells
 * 4. render grid lines
 *
 * Same parameters as {@link Renderer#initialize|initialize}, which is called by this constructor.
 *
 */
export class Renderer {
    private readonly gridPainterRepository = new GridPainterRepository();
    readonly cellPainterRepository = new CellPainterRepository();
    /**
     * Represents the ordered set of visible columns. Array size is always the exact number of visible columns, the last of which may only be partially visible.
     *
     * This sequence of elements' `columnIndex` values assumes one of three patterns. Which pattern is base on the following two questions:
     * * Are there "fixed" columns on the left?
     * * Is the grid horizontally scrolled?
     *
     * The set of `columnIndex` values consists of:
     * 1. The first element will be -1 if the row handle column is being rendered.
     * 2. A zero-based list of consecutive of integers representing the fixed columns (if any).
     * 3. An n-based list of consecutive of integers representing the scrollable columns (where n = number of fixed columns + the number of columns scrolled off to the left).
     */
    visibleColumns = new Renderer.VisibleColumnArray();

    /**
     * Represents the ordered set of visible rows. Array size is always the exact number of visible rows.
     *
     * The sequence of elements' `rowIndex` values is local to each subgrid.
     * * **For each non-scrollable subgrid:** The sequence is a zero-based list of consecutive integers.
     * * **For the scrollable subgrid:**
     *   1. A zero-based list of consecutive of integers representing the fixed rows (if any).
     *   2. An n-based list of consecutive of integers representing the scrollable rows (where n = number of fixed rows + the number of rows scrolled off the top).
     *
     * Note that non-scrollable subgrids can come both before _and_ after the scrollable subgrid.
     */
    visibleRows = new Renderer.VisibleRowArray();

    private _visibleColumnsByIndex = new Array<Renderer.VisibleColumn>();  // array because number of columns will always be reasonable
    private _visibleRowsByDataRowIndex = new Map<number, Renderer.VisibleRow>(); // hash because keyed by (fixed and) scrolled row indexes

    // I don't think this is used
    private _insertionBounds = new Array<number>();

    private _lastKnowRowCount: number | undefined;
    private _needsComputeCellsBounds = false;

    dataWindow: InclusiveRectangle;

    bounds: Renderer.Bounds;

    private _destroyed = false;
    private _documentHidden = false;

    private readonly _animator: Animation.Animator;
    private readonly _renderActioner = new RenderActioner()

    private _firstNonFixedColumnIndex: number;

    private _horizontalScrollableContentOverflowed: boolean;
    // Specifies the index of the column anchored to the bounds edge
    // Will be first non-fixed visible column or last visible column depending on the gridRightAligned property
    // Set to -1 if there is no space scrollable columns (ie only space for fixed columns)
    private _columnScrollAnchorIndex: number;
    // Specifies the number of pixels of the anchored column which have been scrolled off the viewport
    private _columnScrollAnchorOffset: number;

    // Limits to which column scroll anchor can be moved to
    private _leftColumnScrollAnchorLimitIndex: number;
    private _leftColumnScrollAnchorLimitOffset: number;
    private _rightColumnScrollAnchorLimitIndex: number;
    private _rightColumnScrollAnchorLimitOffset: number;

    private _fixedColumnsViewWidth = 0;
    private _nonFixedColumnsViewWidth = 0;
    private _activeColumnsViewWidth = 0;

    private _lastModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _lastRenderedModelUpdateId: ModelUpdateId = lowestValidModelUpdateId;
    private _waitModelRenderedResolves = new Array<Renderer.WaitModelRenderedResolve>();

    private gridPainter: GridPainter;

    private _pageVisibilityChangeListener = () => this.handlePageVisibilityChange();

    //the shared single item "pooled" cell object for drawing each cell
    private cell = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    renderedCellPool = new Array<BeingPaintedCell>();

    get horizontalScrollableContentOverflowed() { return this._horizontalScrollableContentOverflowed; }
    get firstNonFixedColumnIndex() { return this._firstNonFixedColumnIndex; }

    get columnScrollAnchorIndex() { return this._columnScrollAnchorIndex; }
    get columnScrollAnchorOffset() { return this._columnScrollAnchorOffset; }

    get fixedColumnsViewWidth() { return this._fixedColumnsViewWidth; }
    get nonFixedColumnsViewWidth() { return this._nonFixedColumnsViewWidth; }
    get activeColumnsViewWidth() { return this._activeColumnsViewWidth; }

    get properties() { return this.grid.properties; }

    get lastModelUpdateId() { return this._lastModelUpdateId; }

    constructor(
        public readonly grid: Revgrid,
        private readonly _columnsManager: ColumnsManager,
        private readonly _gc: CanvasRenderingContext2DEx,
        private readonly _gridEventDispatchHandler: <T extends EventName>(name: T, detail: EventName.DetailMap[T]) => void,
    ) {
        this._renderActioner.actionsEvent = (actions) => this.processRenderActions(actions);

        document.addEventListener('visibilitychange', this._pageVisibilityChangeListener);

        this._animator = {
            isContinuous: this.properties.enableContinuousRepaint, // TODO properties should update this dynamically
            intervalRate: this.properties.repaintIntervalRate, // TODO properties should update this dynamically
            dirty: false,
            animating: false,
            animate: () => this.paint(),
            onTick: () => this.tickNotification(), // this needs improvement
            // internal
            lastAnimateTime: 0,
            currentAnimateCount: 0,
            currentFPS: 0,
            lastFPSComputeTime: 0,
        }

        this.setGridPainter(this.properties.gridPainter);

        this.reset();
    }

    destroy() {
        this.resolveWaitModelRendered(invalidModelUpdateId);

        document.removeEventListener('visibilitychange', this._pageVisibilityChangeListener);

        this._destroyed = true;
    }

    reset() {
        this.bounds = {
            width: 0,
            height: 0
        };

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this._insertionBounds.length = 0;

        this.renderedCellPool.length = 0;

        this.resetScrollAnchor();
    }

    start() {
        Animation.registerAnimator(this._animator);
    }

    stop() {
        Animation.deregisterAnimator(this._animator);
    }

    registerGridPainter(key: string, constructor: GridPainter.Constructor) {
        this.gridPainterRepository.register(key, constructor);
    }

    getGridPainter(key: string) {
        return this.gridPainterRepository.get(this, key);
    }

    setGridPainter(key: string) {
        const gridPainter = this.gridPainterRepository.get(this, key);

        if (!gridPainter) {
            throw new AssertError('RSGP68240', 'Unregistered grid renderer "' + key + '"');
        }

        if (gridPainter !== this.gridPainter) {
            this.gridPainter = gridPainter;
            this.gridPainter.reset = true;
        }
    }

    resetAllGridRenderers(blackList?: string[]) {
        // Notify renderers that grid shape has changed
        const all = this.gridPainterRepository.allCreatedEntries();
        for (const [key, value] of all) {
            value.reset = !blackList || blackList.indexOf(key) < 0;
        }
    }

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    rebundleGridRenderers() {
        const all = this.gridPainterRepository.allCreated();
        for (const value of all) {
            if (value.rebundle !== undefined) {
                value.rebundle = true;
            }
        }
    }

    registerCellPainter(typeName: string, constructor: CellPainter.Constructor) {
        this.cellPainterRepository.register(typeName, constructor);
    }

    beginChange() {
        this._renderActioner.beginChange();
    }

    endChange() {
        this._renderActioner.endChange();
    }

    renderColumnsInserted(index: number, count: number) {
        this._renderActioner.renderColumnsInserted(index, count);
    }

    renderColumnsDeleted(index: number, count: number) {
        this._renderActioner.renderColumnsDeleted(index, count);
    }

    renderAllColumnsDeleted() {
        this._renderActioner.renderAllColumnsDeleted();
    }

    renderColumnsChanged() {
        this._renderActioner.renderColumnsChanged();
    }

    renderRowsInserted(index: number, count: number) {
        this._renderActioner.renderRowsInserted(index, count);
    }

    renderRowsDeleted(index: number, count: number) {
        this._renderActioner.renderRowsDeleted(index, count);
    }

    renderAllRowsDeleted() {
        this._renderActioner.renderAllRowsDeleted();
    }

    renderRowsLoaded() {
        this._renderActioner.renderRowsLoaded();
    }

    renderRowsMoved(oldRowIndex: number, newRowIndex: number, rowCount: number) {
        this._renderActioner.renderRowsMoved(oldRowIndex, newRowIndex, rowCount);
    }

    invalidateAll() {
        this._renderActioner.invalidateAll();
    }

    invalidateRows(rowIndex: number, count: number) {
        this._renderActioner.invalidateRows(rowIndex, count);
    }

    invalidateRow(rowIndex: number) {
        this._renderActioner.invalidateRow(rowIndex);
    }

    invalidateRowColumns(rowIndex: number, columnIndex: number, columnCount: number) {
        this._renderActioner.invalidateRowColumns(rowIndex, columnIndex, columnCount);
    }

    invalidateRowCells(rowIndex: number, columnIndexes: number[]) {
        this._renderActioner.invalidateRowCells(rowIndex, columnIndexes);
    }

    invalidateCell(columnIndex: number, rowIndex: number) {
        this._renderActioner.invalidateCell(columnIndex, rowIndex);
    }

    processRenderActions(actions: RenderAction[]) {
        const count = actions.length;
        for (let i = 0; i < count; i++) {
            const action = actions[i];
            switch (action.type) {
                case RenderAction.Type.RepaintGrid: {
                    this.repaint();
                    break;
                }
                case RenderAction.Type.RecalculateView: {
                    this.grid.behaviorShapeChanged(); // needs cleanup
                    break;
                }
                default:
                    throw new UnreachableCaseError('RPRA30816', action.type);
            }
        }
    }

    getCurrentFPS() {
        return this._animator.currentFPS;
    }

    paintNow() {
        this._animator.animate();
    }

    resetScrollAnchor() {
        this._columnScrollAnchorIndex = this.grid.getFixedColumnCount();
        this._columnScrollAnchorOffset = 0;
        this._leftColumnScrollAnchorLimitIndex = this._columnScrollAnchorIndex;
        this._leftColumnScrollAnchorLimitOffset = this._columnScrollAnchorOffset;
        this._rightColumnScrollAnchorLimitIndex = this._columnScrollAnchorIndex;
        this._rightColumnScrollAnchorLimitOffset = this._columnScrollAnchorOffset;
    }

    /**
     * @param index - Index of active column that should be anchor
     * @return true if changed
     */
    setColumnScrollAnchor(index: number, offset = 0): boolean {
        if (!this.isColumnScrollAnchorWithinLeftLimit(index, offset)) {
            index = this._leftColumnScrollAnchorLimitIndex;
            offset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this._rightColumnScrollAnchorLimitIndex;
                offset = this._rightColumnScrollAnchorLimitOffset;
            }
        }

        if (this._columnScrollAnchorIndex !== index || this._columnScrollAnchorOffset !== offset) {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;
            return true;
        } else {
            return false;
        }
    }

    setColumnScrollAnchorToLimit(gridRightAligned: boolean) {
        if (gridRightAligned) {
            this.setColumnScrollAnchor(this._rightColumnScrollAnchorLimitIndex, this._rightColumnScrollAnchorLimitOffset);
        } else {
            this.setColumnScrollAnchor(this._leftColumnScrollAnchorLimitIndex, this._leftColumnScrollAnchorLimitOffset);
        }
    }

    setColumnScrollAnchorLimits(contentOverflowed: boolean, anchorLimits: Renderer.ScrollAnchorLimits) {
        this._horizontalScrollableContentOverflowed = contentOverflowed;

        this._leftColumnScrollAnchorLimitIndex = anchorLimits.startAnchorLimitIndex;
        this._leftColumnScrollAnchorLimitOffset = anchorLimits.startAnchorLimitOffset;
        this._rightColumnScrollAnchorLimitIndex = anchorLimits.finishAnchorLimitIndex;
        this._rightColumnScrollAnchorLimitOffset = anchorLimits.finishAnchorLimitOffset;

        if (!this.isColumnScrollAnchorWithinLeftLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
            this._columnScrollAnchorIndex = this._leftColumnScrollAnchorLimitIndex;
            this._columnScrollAnchorOffset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                this._columnScrollAnchorIndex = this._rightColumnScrollAnchorLimitIndex;
                this._columnScrollAnchorOffset = this._rightColumnScrollAnchorLimitOffset;
            }
        }
    }

    isColumnScrollAnchorWithinLeftLimit(index: number, offset: number) {
        const result =
            (index > this._leftColumnScrollAnchorLimitIndex)
            ||
            ((index === this._leftColumnScrollAnchorLimitIndex) && (offset <= this._leftColumnScrollAnchorLimitOffset));
        return result;
    }

    isColumnScrollAnchorWithinRightLimit(index: number, offset: number) {
        const result =
            (index < this._rightColumnScrollAnchorLimitIndex)
            ||
            ((index === this._rightColumnScrollAnchorLimitIndex) && (offset <= this._rightColumnScrollAnchorLimitOffset));
        return result;
    }

    isColumnScrollAnchorWithinLimits(index: number, offset: number) {
        return this.isColumnScrollAnchorWithinLeftLimit(index, offset) && this.isColumnScrollAnchorWithinRightLimit(index, offset);
    }

    limitColumnScrollAnchorValues(index: number, offset: number): Renderer.ScrollAnchor {
        if (!this.isColumnScrollAnchorWithinLeftLimit(index, offset)) {
            index = this._leftColumnScrollAnchorLimitIndex;
            offset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this._rightColumnScrollAnchorLimitIndex;
                offset = this._rightColumnScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    scrollColumnScrollAnchor(columnCount: number, gridRightAligned: boolean) {
        if (columnCount === 0) {
            return false;
        } else {
            let index: number;
            let offset = 0;
            index = this._columnScrollAnchorIndex + columnCount;
            if (this._columnScrollAnchorOffset > 0) {
                if (columnCount > 0) {
                    if (gridRightAligned) {
                        index--;
                    }
                } else {
                    if (!gridRightAligned) {
                        index++;
                    }
                }
            }

            ({ index, offset } = this.limitColumnScrollAnchorValues(index, offset));

            if (index !== this._columnScrollAnchorIndex || offset !== this._columnScrollAnchorOffset) {
                this._columnScrollAnchorIndex = index;
                this._columnScrollAnchorOffset = offset;
                return true;
            } else {
                return false;
            }
        }
    }

    updateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): boolean {
        const { index, offset } = this.calculateColumnScrollAnchor(viewportStart, viewportFinish, contentStart, contentFinish);
        if (index === this._columnScrollAnchorIndex && offset === this._columnScrollAnchorOffset) {
            return false;
        } else {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;
            return true;
        }
    }

    calculateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): Renderer.ScrollAnchor {
        const columnCount = this.grid.getActiveColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const gridProps = this.grid.properties;
        const gridLinesVWidth = gridProps.gridLinesVWidth;
        const gridRightAligned = gridProps.gridRightAligned;
        const scrollHorizontallySmoothly = gridProps.scrollHorizontallySmoothly;

        if (gridRightAligned) {
            if (viewportFinish >= contentFinish) {
                return {
                    index: columnCount - 1,
                    offset: 0
                };
            } else {
                let prevColumnLeft = contentFinish;
                let columnLeft: number;
                let lastColumnDone = false;
                for (let i = columnCount - 1; i >= fixedColumnCount; i--) {
                    columnLeft = prevColumnLeft - this.grid.getActiveColumnWidth(i);
                    if (lastColumnDone) {
                        columnLeft -= gridLinesVWidth;
                    } else {
                        lastColumnDone = true;
                    }

                    if (viewportFinish < columnLeft) {
                        prevColumnLeft = columnLeft;
                    } else {
                        let offset: number;
                        if (!scrollHorizontallySmoothly) {
                            offset = 0;
                        } else {
                            offset = Math.ceil(prevColumnLeft - viewportFinish - 1);
                        }
                        return {
                            index: i,
                            offset,
                        };
                    }
                }
                return {
                    index: fixedColumnCount,
                    offset: 0,
                };
            }
        } else {
            let left = contentStart;
            let nextLeft: number;
            for (let i = fixedColumnCount; i < columnCount; i++) {
                nextLeft = this.grid.getActiveColumnWidth(i) + gridLinesVWidth + left;
                if (viewportStart > nextLeft) {
                    left = nextLeft;
                } else {
                    let index: number;
                    if (viewportStart === nextLeft) {
                        index = i + 1;
                        left = nextLeft;
                    } else {
                        index = i;
                    }
                    let offset: number;
                    if (!scrollHorizontallySmoothly) {
                        offset = 0;
                    } else {
                        offset = Math.ceil(viewportStart - left);
                    }
                    return {
                        index,
                        offset
                    };
                }
            }

            let index: number;
            if (columnCount === fixedColumnCount) {
                index = fixedColumnCount;
            } else {
                index = columnCount -1;
            }
            return {
                index,
                offset: 0,
            };
        }
    }

    calculateColumnScrollAnchorViewportStart(contentStart: number) {
        const gridLinesVWidth = this.grid.properties.gridLinesVWidth;
        const columnCount = this.grid.getActiveColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = contentStart;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result += (this.grid.getActiveColumnWidth(i) + gridLinesVWidth);
            }
        }

        result += this._columnScrollAnchorOffset;

        return result;
    }

    calculateColumnScrollAnchorViewportFinish(contentFinish: number) {
        const gridLinesVWidth = this.grid.properties.gridLinesVWidth;
        const columnCount = this.grid.getActiveColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = contentFinish;
        for (let i = columnCount - 1; i > fixedColumnCount; i--) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result -= this.grid.getActiveColumnWidth(i);
            }
        }

        if (gridLinesVWidth > 0) {
            const anchorColumnCount = columnCount - columnScrollAnchorIndex;
            if (anchorColumnCount > 1) {
                result -= (anchorColumnCount - 1) * gridLinesVWidth;
            }
        }

        result -= this._columnScrollAnchorOffset;

        return result;
    }

    /**
     * Calculate the scroll anchor to bring a column just but fully into the view. Note, only use when column is on the opposite side of scroll anchor
     * @param activeColumnIndex - index of column to bring into view
     * @returns Scroll Anchor which will ensure the column is displayed
     */
    calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean, viewportSize: number): Renderer.ScrollAnchor {
        const grid = this.grid;
        const gridProperties = grid.properties;
        const gridLinesVWidth = gridProperties.gridLinesVWidth;
        let index: number;
        let offset: number;

        if (gridRightAligned) {
            index = grid.getActiveColumnCount();
            // calculate relative left of activeColumnIndex
            let left = gridLinesVWidth;
            while (index >= activeColumnIndex) {
                index--;
                left -= (this.grid.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // calculate viewportFinish needed to just fit in column
            const viewportFinishPlus1 = left + viewportSize;
            // find column which finishes at or crosses this viewport Finish
            let rightPlus1 = left + this.grid.getActiveColumnWidth(index);
            while (rightPlus1 < viewportFinishPlus1) {
                index++;
                rightPlus1 += (this.grid.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (rightPlus1 === viewportFinishPlus1) {
                // column finishes exactly at viewportFinish.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = rightPlus1 - viewportFinishPlus1;
                } else {
                    // use previous column to ensure target is fully displayed
                    index--;
                    offset = 0;
                }
            }

        } else {
            index = this.grid.getFixedColumnCount();
            // calculate relative left of activeColumnIndex
            let left = 0;
            while (index < activeColumnIndex) {
                left += (this.grid.getActiveColumnWidth(index) + gridLinesVWidth);
                index++;
            }
            // calculate relative right of activeColumnIndex;
            const rightPlus1 = left + this.grid.getActiveColumnWidth(index);
            // calculate viewportStart needed to just fit in column
            const viewportStart = rightPlus1 - viewportSize;
            // find column which starts at or crosses this viewport Start
            while (left > viewportStart) {
                index--;
                left -= (this.grid.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (left === viewportStart) {
                // column starts exactly at viewportStart.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = viewportStart - left;
                } else {
                    // use next column to ensure target is fully displayed
                    index++;
                    offset = 0;
                }
            }
        }

        return {
            index,
            offset
        }
    }

    computeCellsBounds(immediate = false) {
        if (immediate || this._documentHidden) {
            this.internalComputeCellsBounds();
            this._needsComputeCellsBounds = false;
        } else {
            this._needsComputeCellsBounds = true;
            this.grid.repaint(); // a paint is needed to recognise needsComputeCellsBounds
        }
    }

    /**
     * @desc This is the entry point from fin-canvas.
     */
    paint() {
        if (this._documentHidden) {
            return false;
        } else {
            if (!this._destroyed) {
                const gc = this._gc;
                try {
                    gc.cache.save();

                    this.paintGrid(gc);


                    if (this.grid.cellEditor) {
                        this.grid.cellEditor.gridRenderedNotification();
                    }

                    // Grid render also calculates mix width for each column.
                    // Check here to see if there was a change and if so immediately re-render
                    // before end-of-thread so user sees only the results of the 2nd render.
                    // Mostly important on first render after setData. Note that stack overflow
                    // will not happen because this will only be called once per data change.
                    if (this.grid.checkColumnAutosizing()) {
                        this.paintGrid(gc);
                    }

                    this.grid.fireSyntheticGridRenderedEvent();

                    const lastModelUpdateId = this._lastModelUpdateId;
                    if (this._lastRenderedModelUpdateId !== lastModelUpdateId) {
                        this._lastRenderedModelUpdateId = lastModelUpdateId;
                        // do not resolve in animation frame call back
                        setTimeout(() => this.resolveWaitModelRendered(lastModelUpdateId), 0);
                    }

                } catch (e) {
                    console.error(e);
                } finally {
                    gc.cache.restore();
                }
            }

            return true;
        }
    }

    painting() {
        return this._animator.animating;
    }

    requestRepaint() {
        this._animator.dirty = true;
    }

    repaint() {
        this.requestRepaint();
        if (this.properties.repaintIntervalRate === 0) {
            this._animator.animate();
        }
    }

    tickNotification() {
        this.grid.tickNotification();
    }

    modelUpdated() {
        ++this._lastModelUpdateId;
    }

    waitModelRendered(): Promise<ModelUpdateId> {
        const lastRenderedModelUpdateId = this._lastRenderedModelUpdateId;
        if (lastRenderedModelUpdateId === this._lastModelUpdateId) {
            return Promise.resolve(lastRenderedModelUpdateId); // latest model already rendered
        } else {
            return new Promise<ModelUpdateId>((resolve) => { this._waitModelRenderedResolves.push(resolve); });
        }
    }

    /**
     * @returns Answer how many rows we rendered
     */
    getVisibleRowsCount() {
        // This looks wrong.  It is not used within library - best to ignore
        return this.visibleRows.length - 1;
    }

    getVisibleScrollHeight() {
        const footerHeight = this.grid.properties.defaultRowHeight * this.grid.getFooterRowCount();
        return this.getBounds().height - footerHeight - this.grid.getFixedRowsHeight();
    }

    /**
     * @returns Number of columns we just rendered.
     */
    getVisibleColumnsCount() {
        // This looks wrong.  It is not used within library - best to ignore
        return this.visibleColumns.length - 1;
    }

    /**
     * @param x - Grid column coordinate.
     * @param y - Grid row coordinate.
     * @returns Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell(x: number, y: number): RectangleInterface {
        const vc = this.visibleColumns[x];
        const vr = this.visibleRows[y];

        return {
            x: vc.left,
            y: vr.top,
            width: vc.width,
            height: vr.height
        };
    }

    /**
     * @desc the index of the column whose edge is closest to the coordinate at pixelX
     * @param pixelX - The horizontal coordinate.
     * @returns The column index under the coordinate at pixelX.
     */
    getActiveColumnWidthEdgeClosestToPixelX(pixelX: number): number {
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const scrolledColumnCount = this._columnScrollAnchorIndex;
        const visibleColumns = this.visibleColumns;

        if (this.grid.properties.gridRightAligned) {
            let c = visibleColumns.length - 1;
            let previousColumnCenter: number;
            while (c > 0) {
                previousColumnCenter = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
                if (pixelX >= previousColumnCenter) {
                    return c;
                }
                c--;
            }
            return 0;
        } else {
            let c = 1;
            let previousColumnCenter: number;
            while (c < visibleColumns.length - 1) {
                previousColumnCenter = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
                if (pixelX < previousColumnCenter) {
                    if (c > fixedColumnCount) {
                        c += scrolledColumnCount;
                    }
                    return c - 1;
                }
                c++;
            }
            if (c > fixedColumnCount) {
                c += scrolledColumnCount;
            }
            return c - 1;
        }
    }


    /**
     * @desc Answer specific data cell coordinates given mouse coordinates in pixels.
     * @param point
     * @returns Cell coordinates
     */
    getGridCellFromMousePoint(point: Point): Renderer.GetGridCellFromMousePointResult {
        const x = point.x;
        const y = point.y;
        let isPseudoRow: boolean;
        let isPseudoCol: boolean;
        const vrs = this.visibleRows;
        const vcs = this.visibleColumns;
        const firstColumn = vcs[0];
        const inFirstColumn = firstColumn && x < firstColumn.rightPlus1;
        let vc = inFirstColumn ? firstColumn : vcs.find((vc) => { return x < vc.rightPlus1; });
        let vr = vrs.find(function(vr) { return y < vr.bottom; });
        let fake = false;

        //default to last row and col
        if (vr) {
            isPseudoRow = false;
        } else {
            vr = vrs[vrs.length - 1];
            isPseudoRow = true;
        }

        if (vc) {
            isPseudoCol = false;
        } else {
            vc = vcs[vcs.length - 1];
            isPseudoCol = true;
        }

        let beingPaintedCell: BeingPaintedCell;
        if (vc !== undefined) {
            beingPaintedCell = new BeingPaintedCell(this.grid, vc.activeColumnIndex, vr.index);
            const beingPaintedCellFromPool = this.findCell(beingPaintedCell);
            beingPaintedCell = beingPaintedCellFromPool ? Object.create(beingPaintedCellFromPool) : beingPaintedCell;
            beingPaintedCell.mousePoint = Point.create(x - vc.left, y - vr.top);
        }

        if (isPseudoCol || isPseudoRow) {
            fake = true;
            this.grid.beCursor(null);
        }

        return {
            renderedCell: beingPaintedCell,
            fake
        }
    }

    /**
     * Matrix of unformatted values of visible cells.
     */
    getVisibleCellMatrix(): Array<Array<unknown>> {
        const rows = Array(this.visibleRows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array(this.visibleColumns.length);
        }

        this.renderedCellPool.forEach((cell) => {
            const x = cell.gridCell.x;
            if (x >= 0) {
                rows[cell.gridCell.y][x] = cell.value;
            }
        });
        return rows;
    }

    /**
     * @summary Get the visibility of the column matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Determines if a column is visible.
     * @param activeIndex - the column index
     * @returns The given column is visible.
     */
    isColumnVisible(activeIndex: number) {
        return !!this.getVisibleColumn(activeIndex);
    }

    /**
     * @summary Get the "visible column" object matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Find a visible column object.
     * @param activeIndex - The grid column index.
     * @returns The given column if visible or `undefined` if not.
     */
    getVisibleColumn(activeIndex: number) {
        return this.visibleColumns.find(
            (vc) => {
                return vc.activeColumnIndex === activeIndex;
            }
        );
    }

    /**
     * @summary Get the visibility of the column matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Determines if a column is visible.
     * @param columnIndex - the column index
     */
    isDataColumnVisible(columnIndex: number) {
        return !!this.getVisibleDataColumn(columnIndex);
    }

    /**
     * @summary Get the "visible column" object matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Find a visible column object.
     * @param columnIndex - The grid column index.
     */
    getVisibleDataColumn(columnIndex: number) {
        return this.visibleColumns.find((vc) => {
            return vc.column.index === columnIndex;
        });
    }

    /**
     * @returns The width x coordinate of the last rendered column
     */
    getFinalVisibleColumnBoundary() {
        const chop = this.isLastColumnVisible() ? 2 : 1;
        const colWall = this.visibleColumns[this.visibleColumns.length - chop].rightPlus1;
        return Math.min(colWall, this.getBounds().width);
    }

    /**
     * @summary Get the visibility of the row matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Determines visibility of a row.
     * @param rowIndex - The grid row index.
     * @returns The given row is visible.
     */
    isRowVisible(rowIndex: number) {
        return !!this.visibleRows[rowIndex];
    }

    /**
     * @summary Get the "visible row" object matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Find a visible row object.
     * @param rowIndex - The grid row index.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleRow(rowIndex: number) {
        return this.visibleRows[rowIndex];
    }

    /**
     * @summary Get the visibility of the row matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Determines visibility of a row.
     * @param rowIndex - The data row index.
     * @returns The given row is visible.
     */
    isDataRowVisible(rowIndex: number, subgrid?: Subgrid): boolean {
        return this.getVisibleDataRow(rowIndex, subgrid) !== undefined;
    }

    /**
     * @summary Get the "visible row" object matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Find a visible row object.
     * @param rowIndex - The data row index within the given subgrid.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleDataRow(rowIndex: number, subgrid?: Subgrid) {
        if (subgrid === undefined) {
            subgrid = this.grid.mainSubgrid;
        }
        return this.visibleRows.find(
            (vr) => {
                return vr.subgrid === subgrid && vr.rowIndex === rowIndex;
            }
        );
    }

    /**
     * @desc This is the main forking of the renderering task.
     *
     * `dataModel.fetchData` callback renders the grid. Note however that this is not critical when the clock is
     * running as it will be rendered on the next tick. We let it call it anyway in case (1) fetch returns quickly
     * enough to be rendered on this tick rather than next or (2) clock isn't running (for debugging purposes).
     * @param gc
     * @this {RendererType}
     */
    paintGrid(gc: CanvasRenderingContext2DEx) {
        const grid = this.grid;

        grid.deferredBehaviorChange();

        const rowCount = grid.getRowCount();
        if (rowCount !== this._lastKnowRowCount) {
            /*var newWidth = */ // this.renderResetRowHeaderColumnWidth(gc, rowCount);
            // if (newWidth !== this.handleColumnWidth) {
                this._needsComputeCellsBounds = true;
            //     this.handleColumnWidth = newWidth;
            // }
            this._lastKnowRowCount = rowCount;
        }

        if (this._needsComputeCellsBounds) {
            this.internalComputeCellsBounds();
            this._needsComputeCellsBounds = false;

            // Pre-fetch data if supported by data model
            if (grid.mainDataModel.fetchData) {
                grid.mainDataModel.fetchData(this.getSubrects(), (failure) => this.fetchCompletion(gc, failure));
                return; // skip refresh renderGrid call below
            }
        }

        const lastSelectionBounds = this.calculateLastSelectionBounds();

        this.gridPainter.paintCells(gc);
        this.gridPainter.paintGridlines(gc);
        if (lastSelectionBounds !== undefined) {
            this.gridPainter.paintLastSelection(gc, lastSelectionBounds);

            if (this.gridPainter.key === 'by-cells') {
                this.gridPainter.reset = true; // fixes GRID-490
            }
        }
    }

    calculateLastSelectionBounds(): RenderedCell.Bounds | undefined {
        // should be moved into GridPainter
        const visibleColumnsCount = this.visibleColumns.length;
        const visibleRowsCount = this.visibleRows.length;

        if (visibleColumnsCount === 0 || visibleRowsCount === 0) {
            // nothing visible
            return undefined;
        }

        let selection: Rectangle;
        let left: number;
        let top: number;
        let width: number;
        let height: number;
        const grid = this.grid;
        const gridProps = grid.properties;
        const sm = grid.selectionModel;

        switch (sm.getLastSelectionType()) {
            case 'column':
                const columnSelections = sm.columnSelectionModel.selection;
                const lastColumnSelection = columnSelections[columnSelections.length - 1];

                left = lastColumnSelection[0];
                top = 0;
                width = lastColumnSelection[1] - left + 1;
                height = grid.getRowCount();
                selection = new InclusiveRectangle(left, top, width, height);
                break;

            case 'row':
                if (!(gridProps.collapseCellSelections && sm.getLastSelectionType(1) === 'cell')) {
                    const rowSelections = sm.rowSelectionModel.selection;
                    const lastRowSelection = rowSelections[rowSelections.length - 1];

                    left = 0;
                    top = lastRowSelection[0];
                    width = this._columnsManager.activeColumns.length;
                    height = lastRowSelection[1] - top + 1;
                    selection = new InclusiveRectangle(left, top, width, height);
                } else {
                    selection = sm.getLastSelection();
                }
                break;

            case 'cell':
                selection = sm.getLastSelection();
                break;
        }

        if (!selection) {
            return undefined; // no selection
        }

        // todo not sure what this is for; might be defunct logic
        if (selection.origin.x === -1) {
            // no selected area, lets exit
            return undefined;
        }

        let vc: Renderer.VisibleColumn;
        const vci = this._visibleColumnsByIndex;
        let vr: Renderer.VisibleRow;
        const vri = this._visibleRowsByDataRowIndex;
        const lastScrollableColumn = this.visibleColumns[visibleColumnsCount - 1]; // last column in scrollable section
        const lastScrollableRow = this.visibleRows[visibleRowsCount - 1]; // last row in scrollable data section
        const firstScrollableColumn = vci[this.dataWindow.origin.x];
        const firstScrollableRow = vri.get(this.dataWindow.origin.y);
        const fixedColumnCount = gridProps.fixedColumnCount;
        const fixedRowCount = gridProps.fixedRowCount;
        const headerRowCount = grid.getHeaderRowCount();

        if (
            // entire selection scrolled out of view to left of visible columns; or
            (vc = this.visibleColumns[0]) &&
            selection.corner.x < vc.activeColumnIndex ||

            // entire selection scrolled out of view between fixed columns and scrollable columns; or
            fixedColumnCount &&
            firstScrollableColumn &&
            (vc = this.visibleColumns[fixedColumnCount - 1]) &&
            selection.origin.x > vc.activeColumnIndex &&
            selection.corner.x < firstScrollableColumn.activeColumnIndex ||

            // entire selection scrolled out of view to right of visible columns; or
            lastScrollableColumn &&
            selection.origin.x > lastScrollableColumn.activeColumnIndex ||

            // entire selection scrolled out of view above visible rows; or
            (vr = this.visibleRows[headerRowCount]) &&
            selection.corner.y < vr.rowIndex ||

            // entire selection scrolled out of view between fixed rows and scrollable rows; or
            fixedRowCount &&
            firstScrollableRow &&
            (vr = this.visibleRows[headerRowCount + fixedRowCount - 1]) &&
            selection.origin.y > vr.rowIndex &&
            selection.corner.y < firstScrollableRow.rowIndex ||

            // entire selection scrolled out of view below visible rows
            lastScrollableRow &&
            selection.origin.y > lastScrollableRow.rowIndex
        ) {
            return undefined;
        }

        const vcOrigin = vci[selection.origin.x] || firstScrollableColumn;
        const vrOrigin = vri.get(selection.origin.y) || firstScrollableRow;
        const vcCorner = vci[selection.corner.x] || (selection.corner.x > lastScrollableColumn.activeColumnIndex ? lastScrollableColumn : vci[fixedColumnCount - 1]);
        const vrCorner = vri.get(selection.corner.y) || (selection.corner.y > lastScrollableRow.rowIndex ? lastScrollableRow : vri.get(fixedRowCount - 1));

        if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
            return undefined;
        }

        const bounds: RenderedCell.Bounds = {
            x: vcOrigin.left,
            y: vrOrigin.top,
            width: vcCorner.rightPlus1 - vcOrigin.left,
            height: vrCorner.bottom - vrOrigin.top
        };

        return bounds;
    }

    /**
     * @returns Current vertical scroll value.
     */
    getScrollTop(): number {
        return this.grid.getVScrollValue();
    }

    /**
     * @returns The last col was rendered (is visible)
     */
    isLastColumnVisible(): boolean {
        const lastColumnIndex = this.grid.getActiveColumnCount() - 1;
        return !!this.visibleColumns.find((vc) => { return vc.activeColumnIndex === lastColumnIndex; });
    }

    /**
     * @returns The rendered column width at index
     */
    getRenderedWidth(index: number) {
        const columns = this.visibleColumns;
        let result: number;

        if (index >= columns.length) {
            result = columns[columns.length - 1].rightPlus1;
        } else {
            result = columns[index].left;
        }

        return result;
    }

    /**
     * @returns The rendered row height at index
     */
    getRenderedHeight(index: number): number {
        const rows = this.visibleRows;
        let result: number;

        if (index >= rows.length) {
            const last = rows[rows.length - 1];
            result = last.bottom;
        } else {
            result = rows[index].top;
        }

        return result;
    }

    /**
     * @returns The row to go to for a page up.
     */
    getPageUpRow(): number {
        const grid = this.grid;
        const scrollHeight = this.getVisibleScrollHeight();
        let top = this.dataWindow.origin.y - this.properties.fixedRowCount - 1;
        let scanHeight = 0;
        while (scanHeight < scrollHeight && top >= 0) {
            scanHeight += grid.getRowHeight(top);
            top--;
        }
        return top + 1;
    }

    /**
     * @returns The row to goto for a page down.
     */
    getPageDownRow(): number {
        return this.dataWindow.corner.y - this.properties.fixedRowCount;
    }

    /**
     * This function creates several data structures:
     * * {@link Renderer#visibleColumns}
     * * {@link Renderer#visibleRows}
     *
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     *
     * @this {Renderer}
     */
    internalComputeCellsBounds() {
        const scrollTop = this.getScrollTop();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        const columnScrollAnchorOffset = this._columnScrollAnchorOffset;

        const bounds = this.getBounds();
        const grid = this.grid;
        const columnsManager = this._columnsManager;
        const behavior = grid.behavior;
        const leftMostColIndex = 0;

        const editorCellEvent = grid.cellEditor && grid.cellEditor.event;

        let vcEd: Renderer.VisibleColumn;
        let xEd: number;
        let vrEd: Renderer.VisibleRow;
        let yEd: number;
        let sgEd: Subgrid;
        let isSubgridEd: boolean;

        let insertionBoundsCursor = 0;
        let previousInsertionBoundsCursorValue = 0;

        const gridProps = grid.properties;
        // const borderBox = gridProps.boxSizing === 'border-box';
        const gridRightAligned = gridProps.gridRightAligned;
        const visibleColumnWidthAdjust = gridProps.visibleColumnWidthAdjust;

        const lineWidthV = gridProps.gridLinesVWidth;
        const lineGapV = lineWidthV;

        const lineWidthH = gridProps.gridLinesHWidth;
        const lineGapH = lineWidthH;

        const fixedColumnCount = this.grid.getFixedColumnCount();
        const lastFixedColumnIndex = fixedColumnCount - 1;
        const fixedRowCount = this.grid.getFixedRowCount();

        let subrows: number; // rows in subgrid
        let fixedRowIndex = -1;
        let fixedWidthV: number;
        let fixedWidthH: number;
        let fixedGapH: number;
        let fixedOverlapH: number;
        const subgrids = grid.subgrids;
        let subgrid: Subgrid;
        let rowIndex: number;
        let isMainSubgrid: boolean;
        let vy: number;
        let vr: Renderer.VisibleRow;
        let vc: Renderer.VisibleColumn;
        let height: number;
        let firstVX: number;
        let lastVX: number;
        let firstVY: number;
        let lastVY: number;
        let topR: number;

        if (editorCellEvent) {
            xEd = editorCellEvent.gridCell.x;
            yEd = editorCellEvent.dataCell.y;
            sgEd = editorCellEvent.subgrid;
        }

        if (fixedRowCount) {
            fixedRowIndex = fixedRowCount;
        }

        if (gridProps.fixedLinesVWidth === undefined) {
            fixedWidthV = lineWidthV;
        } else {
            fixedWidthV = gridProps.fixedLinesVWidth;
        }

        if (gridProps.fixedLinesHWidth === undefined) {
            fixedRowIndex = -1; // above any row
        } else {
            fixedWidthH = Math.max(gridProps.fixedLinesHWidth || lineWidthH, lineWidthH);
            fixedGapH = fixedWidthH; // hangover from borderBox
            fixedOverlapH = fixedGapH - fixedWidthH;
        }

        this.visibleColumns.length = 0;
        this.visibleColumns.gap = this.visibleColumns[-1] = this.visibleColumns[-2] = undefined;

        this.visibleRows.length = 0;
        this.visibleRows.gap = undefined;

        this._visibleColumnsByIndex.length = 0;
        this._visibleRowsByDataRowIndex.clear();

        this._insertionBounds.length = 0;

        const gridWidth = bounds.width ?? grid.canvas.width; // horizontal pixel loop limit
        const C = grid.getActiveColumnCount();

        let startX: number; // horizontal pixel loop index
        let start: number; // first visible index
        if (!gridRightAligned || columnScrollAnchorIndex < fixedColumnCount) {
            startX = 0;
            start = leftMostColIndex;
        } else {
            // We want to right align the grid in the canvas.  The last column (after scrolling) is always visible.  Work backwards to see which
            // column is the first visible and what its x position is.
            startX = gridWidth; // horizontal pixel loop index
            start = columnScrollAnchorIndex + 1;

            do {
                start--;

                if (start < C) {
                    if (start === lastFixedColumnIndex) {
                        startX = startX - fixedWidthV;
                    } else {
                        if (startX !== gridWidth) {
                            // not right most
                            startX = startX - lineGapV;
                        }
                    }
                    let width = Math.ceil(columnsManager.getActiveColumnWidth(start));
                    if (start === this._columnScrollAnchorIndex && columnScrollAnchorOffset > 0) {
                        width -= columnScrollAnchorOffset;
                        if (width < 0) {
                            width = 0;
                        }
                    }
                    startX = startX - width;
                }

            } while (start > leftMostColIndex && startX > 0)

/*            while (start > leftMostColIndex) {
                if (startX < 0) {
                    // no space left
                    break;
                } else {
                    if (!hasTreeColumn && start === treeColumnIndex) {
                        continue;
                    }

                    const gap = start === fixedColumnIndex;
                    if (gap) {
                        startX = startX - fixedGapV;
                    } else {
                        const notRightMost = startX !== X;
                        if (notRightMost) {
                            startX = startX - lineGapV;
                        }
                    }

                    let vx = start;
                    if (start >= fixedColumnCount) {
                        vx -= scrollLeft;
                    }
                    if (vx < 0) {
                        break; // scrolled beyond first column
                    }

                    const width = Math.ceil(behavior.getColumnWidth(vx));

                    startX = startX - width;
                    start--;
                }
            }*/
        }

        // Now that start has been calculated, can calculate visible column values
        let x = startX;
        let nonFixedStartX = startX;
        let vcIndex = 0;
        let isFirstNonFixedColumn = start >= fixedColumnCount;
        this._firstNonFixedColumnIndex = fixedColumnCount;
        let fixedColumnsViewWidth = 0;
        let nonFixedColumnsViewWidth = 0;
        let fixedNonFixedBorderWidth = 0;
        let firstNonFixedColumnLeft = 0;
        let gapLeft: number | undefined;
        for (let c = start; c < C; c++) {
            if (x >= gridWidth) {
                break; // no space left
            } else {
                if (c === fixedColumnCount) {
                    isFirstNonFixedColumn = true;
                }
                if (gridRightAligned || c < fixedColumnCount || c >= columnScrollAnchorIndex) {
                    if (isFirstNonFixedColumn) {
                        this._firstNonFixedColumnIndex = c;
                        firstNonFixedColumnLeft = x;
                    }

                    const columnWidth = columnsManager.getActiveColumnWidth(c);
                    let left: number;
                    let columnOrAnchoredWidth = columnsManager.getActiveColumnWidth(c);
                    if (c === columnScrollAnchorIndex) {
                        columnOrAnchoredWidth = columnWidth - columnScrollAnchorOffset;
                        if (gridRightAligned) {
                            left = x;
                        } else {
                            left = x - columnScrollAnchorOffset;
                        }
                    } else {
                        columnOrAnchoredWidth = columnWidth;
                        left = x;
                    }

                    let visibleWidth = columnWidth;
                    if (visibleColumnWidthAdjust) {
                        if (gridRightAligned) {
                            if (isFirstNonFixedColumn && left < 0) {
                                visibleWidth += left;
                                left = 0;
                            }
                        } else {
                            if (isFirstNonFixedColumn && left < firstNonFixedColumnLeft) {
                                visibleWidth -= (firstNonFixedColumnLeft - left);
                                left = firstNonFixedColumnLeft;
                            }
                        }
                        if (left + visibleWidth > gridWidth) {
                            visibleWidth = gridWidth - left;
                        }
                    }
                    visibleWidth = Math.floor(visibleWidth);

                    const rightPlus1 = left + visibleWidth;

                    this.visibleColumns[vcIndex] = this._visibleColumnsByIndex[c] = vc = {
                        index: vcIndex,
                        activeColumnIndex: c,
                        column: columnsManager.getActiveColumn(c),
                        left,
                        width: visibleWidth,
                        rightPlus1
                    };

                    if (xEd === c) {
                        vcEd = vc;
                    }

                    const isNonFixedColumn = c >= fixedColumnCount;

                    if (isNonFixedColumn) {
                        if (gapLeft !== undefined) {
                            // first non fixed column after fixed column
                            this.visibleColumns.gap = {
                                left: gapLeft, // from previous loop
                                rightPlus1: vc.left
                            };
                            gapLeft = undefined;
                            fixedNonFixedBorderWidth = fixedWidthV;
                        }

                        lastVX = c;
                        if (firstVX === undefined) {
                            firstVX = lastVX;
                        }

                        if (isFirstNonFixedColumn) {
                            isFirstNonFixedColumn = false;
                        }
                    }

                    x = x + columnOrAnchoredWidth;
                    if (c === lastFixedColumnIndex) {
                        fixedColumnsViewWidth = x - startX;
                        gapLeft = x; // for next loop
                        x = x + fixedWidthV;
                        nonFixedStartX = x;
                    } else {
                        x = x + lineGapV;
                    }

                    vcIndex++;

                    insertionBoundsCursor += Math.round(visibleWidth / 2) + previousInsertionBoundsCursorValue;
                    this._insertionBounds.push(insertionBoundsCursor);
                    previousInsertionBoundsCursorValue = Math.round(visibleWidth / 2);
                }
            }
        }
        if (x >= gridWidth) {
            nonFixedColumnsViewWidth = gridWidth - nonFixedStartX;
        } else {
            nonFixedColumnsViewWidth = x - nonFixedStartX;
        }

        // get height of total number of rows in all subgrids following the data subgrid
        const footerHeight = gridProps.defaultRowHeight * grid.getFooterRowCount();

        let base = 0; // sum of rows for all subgrids so far
        let y = 0; // vertical pixel loop index and limit
        const Y = bounds.height - footerHeight; // vertical pixel loop index and limit
        const G = subgrids.length; // subgrid loop index and limit
        let r = 0; // row loop index
        for (let g = 0; g < G; g++, base += subrows) {
            subgrid = subgrids[g];
            subrows = subgrid.dataModel.getRowCount();
            isMainSubgrid = subgrid.isMain;
            isSubgridEd = (sgEd === subgrid);
            topR = r;

            // For each row of each subgrid...
            const R = r + subrows; // row loop limit
            for (; r < R && y < Y; r++) {
                const gap = isMainSubgrid && r === fixedRowIndex;
                if (gap) {
                    this.visibleRows.gap = {
                        top: vr.bottom + fixedOverlapH,
                        bottom: undefined
                    };
                    y += fixedGapH;
                } else if (y) {
                    y += lineGapH;
                }


                vy = r;
                if (isMainSubgrid && r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }

                rowIndex = vy - base;
                height = behavior.getRowHeight(rowIndex, subgrid);

                this.visibleRows[r] = vr = {
                    index: r,
                    subgrid: subgrid,
                    rowIndex: rowIndex,
                    top: y,
                    height: height,
                    bottom: y + height
                };

                if (gap) {
                    this.visibleRows.gap.bottom = vr.top;
                }

                if (isMainSubgrid) {
                    this._visibleRowsByDataRowIndex.set(vy - base, vr);
                }

                if (isSubgridEd && yEd === rowIndex) {
                    vrEd = vr;
                }

                y += height;
            }

            if (isMainSubgrid) {
                subrows = r - topR;
            }
        }

        if (editorCellEvent) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = null;
        }

        this.dataWindow = new InclusiveRectangle(
            firstVX,
            firstVY,
            Math.min(lastVX - firstVX + 1, this.visibleColumns.length),
            Math.min(lastVY - firstVY + 1, this.visibleRows.length)
        );

        // Resize CellEvent pool
        const pool = this.renderedCellPool;
        const previousLength = pool.length;
        const P = this.visibleColumns.length * this.visibleRows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (let p = previousLength; p < P; p++) {
            pool[p] = new BeingPaintedCell(this.grid); // instantiate extra required - all real BeingPaintedCell (and CellEvent) objects are created here
        }

        this.updateColumnsViewWidths(fixedColumnsViewWidth, nonFixedColumnsViewWidth, fixedNonFixedBorderWidth);

        this.resetAllGridRenderers();
        this.grid.repaint();
    }

    private updateColumnsViewWidths(fixedColumnsViewWidth: number, nonFixedColumnsViewWidth: number, fixedNonFixedBorderWidth: number) {
        const activeColumnsViewWidth = fixedColumnsViewWidth + nonFixedColumnsViewWidth + fixedNonFixedBorderWidth;

        let fixedColumnsViewWidthChanged: boolean;
        if (fixedColumnsViewWidth === this._fixedColumnsViewWidth) {
            fixedColumnsViewWidthChanged = false;
        } else {
            this._fixedColumnsViewWidth = fixedColumnsViewWidth;
            fixedColumnsViewWidthChanged = true;
        }

        let nonFixedColumnsViewWidthChanged: boolean;
        if (nonFixedColumnsViewWidth === this._nonFixedColumnsViewWidth) {
            nonFixedColumnsViewWidthChanged = false;
        } else {
            this._nonFixedColumnsViewWidth = nonFixedColumnsViewWidth;
            nonFixedColumnsViewWidthChanged = true;
        }

        let activeColumnsViewWidthChanged: boolean;
        if (activeColumnsViewWidth === this._activeColumnsViewWidth) {
            activeColumnsViewWidthChanged = false;
        } else {
            this._activeColumnsViewWidth = activeColumnsViewWidth;
            activeColumnsViewWidthChanged = true;
        }

        if (fixedColumnsViewWidthChanged || nonFixedColumnsViewWidthChanged || activeColumnsViewWidthChanged) {
            const detail: EventDetail.ColumnsViewWidthsChanged = {
                fixedChanged: fixedColumnsViewWidthChanged,
                nonFixedChanged: nonFixedColumnsViewWidthChanged,
                activeChanged: activeColumnsViewWidthChanged,
            };
            this._gridEventDispatchHandler('rev-columns-view-widths-changed', detail);
        }
    }

    /**
     * Overridable for alternative or faster logic.
     * @param CellEvent
     * @returns {object} Layered config object.
     */
    // assignProps: layerProps,

    /**
     * @param colIndexOrCellEvent - This is the "data" x coordinate.
     * @param rowIndex - This is the "data" y coordinate. Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @param subgrid Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @returns The matching `CellEvent` object from the renderer's pool. Returns `undefined` if the requested cell is not currently visible (due to being scrolled out of view).
     */
    findCell(colIndexOrCellEvent: number | RenderedCell, rowIndex?: number, subgrid?: Subgrid) {
        let colIndex: number;
        const pool = this.renderedCellPool;

        if (typeof colIndexOrCellEvent === 'object') {
            // colIndexOrCellEvent is a cell event object
            subgrid = colIndexOrCellEvent.subgrid;
            rowIndex = colIndexOrCellEvent.dataCell.y;
            colIndex = colIndexOrCellEvent.dataCell.x;
        } else {
            colIndex = colIndexOrCellEvent;
        }

        subgrid = subgrid ?? this.grid.mainSubgrid;

        let len = this.visibleColumns.length;
        len *= this.visibleRows.length;
        for (let p = 0; p < len; ++p) {
            const beingPaintedCell = pool[p];
            if (
                beingPaintedCell.subgrid === subgrid &&
                beingPaintedCell.dataCell.x === colIndex &&
                beingPaintedCell.dataCell.y === rowIndex
            ) {
                return beingPaintedCell;
            }
        }
        return undefined;
    }

    /**
     * Resets the cell properties cache in the matching `CellEvent` object from the renderer's pool. This will insure that a new cell properties object will be known to the renderer. (Normally, the cache is not reset until the pool is updated by the next call to {@link Renderer#computeCellBounds}).
     */
    resetCellPropertiesCache(xOrCellEvent: number | RenderedCell, y?: number, subgrid?: Subgrid) {
        const beingPaintedCell = this.findCell(xOrCellEvent, y, subgrid);
        if (beingPaintedCell) {
            beingPaintedCell.clearCellOwnProperties();
        }
    }

    resetAllCellPropertiesCaches() {
        this.renderedCellPool.forEach((cellEvent) => {
            cellEvent.clearCellOwnProperties();
        });
    }

    getBounds() {
        return this.bounds;
    }

    setBounds(bounds: Renderer.Bounds) {
        return (this.bounds = bounds);
    }

    private handlePageVisibilityChange() {
        this._documentHidden = document.hidden;
    }

    private resolveWaitModelRendered(lastModelUpdateId: number) {
        if (this._waitModelRenderedResolves.length > 0) {
            for (const resolve of this._waitModelRenderedResolves) {
                resolve(lastModelUpdateId);
            }
            this._waitModelRenderedResolves.length = 0;
        }
    }

    private fetchCompletion(gc: CanvasRenderingContext2DEx, fetchError: boolean) {
        if (!fetchError) {
            // STEP 1: Render the grid immediately (before next refresh) just to get column widths
            // (for better performance this could be done off-screen but this works fine as is)
            this.gridPainter.paintCells(gc);
            // STEP 2: Re-render upon next refresh with proper column widths
            this.grid.repaint();
        }
    }

    /**
     * @summary Create a list of `Rectangle`s representing visible cells.
     * @desc When `grid.properties.fetchSubregions` is true, this function needs to handle:
     * 1. unordered columns
     * 2. column gaps (hidden columns)
     * 3. the single row gap that results when there are fixed rows and remaining rows are scrolled down
     *
     * @ToDo This function currently only handles (1) above; needs (2) (multiple rectangles for multiple contiguous column regions) and (3) (double each region for above and below the fixed boundary when scrolled down) as well. In its present form, it will "fetch" all cells from upper left of fixed area to lower right of scrollable area. (Yikes.)
     *
     * When `grid.properties.fetchSubregions` is falsy, this function merely returns `this.dataWindow` as the only rectangle.
     * This is way more efficient than calling `getSubrects` (as it is currently implemented) and is fine so long as there are no fixed columns or rows and column re-ordering is disabled.
     * (If tree column in use, it is a fixed column, but this is workable so long as the data model knows to always return it regardless of rectangle.)
     * Hidden columns within the range of visible columns will be fetched anyway.
     * Column scrolling is ok.
     *
     * @ToDo This function is too slow for practical use due to map and sort.
     *
     * @this {Renderer}
     */
    private getSubrects() {
        const dw = this.dataWindow;
        if (!this.grid.properties.fetchSubregions) {
            const rect = this.grid.newRectangle(dw.left, dw.top, dw.width, dw.height); // convert from InclusiveRect
            return [rect];
        }

        const orderedColumnIndexes = this.visibleColumns.map(
            (vc: Renderer.VisibleColumn) => {
                return vc.column.index;
            }
        ).sort(
            (a, b) => { return a - b; }
        );
        const xMin = orderedColumnIndexes[0];
        const width = orderedColumnIndexes[orderedColumnIndexes.length - 1] - xMin + 1;

        return [this.grid.newRectangle(xMin, dw.top, width, dw.height)];
    }
}

export namespace Renderer {
    export interface GetGridCellFromMousePointResult {
        fake: boolean;
        renderedCell: RenderedCell;
    }

    export interface VisibleColumn {
        /** A back reference to the element's array index in {@link Renderer#visibleColumns}. */
        index: number;
        /** Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position. */
        activeColumnIndex: number;

        column: Column;
        /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
        left: number;
        /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
        rightPlus1: number;
        /** Width of this column in pixels, rounded to nearest integer. */
        width: number;

        top?: number; // not used anymore I think (maybe by tree)
        bottom?: number; // not used anymore I think (maybe by tree)
    }

    export class VisibleColumnArray extends Array<VisibleColumn> {
        gap: VisibleColumnArray.Gap;
    }

    export namespace VisibleColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number | undefined;
        }
    }

    export interface VisibleRow {
        /** A back reference to the element's array index in {@link Renderer#visibleRows}. */
        index: number;
        /** Local vertical row coordinate within the subgrid to which the row belongs, adjusted for scrolling. */
        rowIndex: number;
        /** A reference to the subgrid to which the row belongs. */
        subgrid: Subgrid;
        /** Pixel coordinate of the top edge of this row, rounded to nearest integer. */
        top: number;
        /** Pixel coordinate of the bottom edge of this row, rounded to nearest integer. */
        bottom: number;
        /** Height of this row in pixels, rounded to nearest integer. */
        height: number;
    }

    export class VisibleRowArray extends Array<VisibleRow> {
        gap: VisibleRowArray.Gap | undefined;
    }

    export namespace VisibleRowArray {
        export interface Gap {
            top: number;
            bottom: number | undefined;
        }
    }

    export interface Bounds {
        width: number;
        height: number;
    }

    export class SubrowsValue extends Array<unknown> {
        subrows: unknown;
    }

    export interface ScrollAnchor {
        index: number; // Index of column/row
        offset: number; // number of pixels anchor is offset in current column/row
    }

    export interface ScrollAnchorLimits {
        startAnchorLimitIndex: number;
        startAnchorLimitOffset: number;
        finishAnchorLimitIndex: number;
        finishAnchorLimitOffset: number;
    }

    export interface ScrollContentSizeAndAnchorLimits {
        contentSize: number;
        contentOverflowed: boolean;
        anchorLimits: ScrollAnchorLimits;
    }

    export type WaitModelRenderedResolve = (this: void, id: ModelUpdateId) => void;
}
