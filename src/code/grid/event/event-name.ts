import { CellEditor } from '../cell-editor/cell-editor';
import { CellEvent } from '../cell/cell-event';
import { SelectionDetail } from '../selection/selection-detail';
import { EventDetail } from './event-detail';

/** @public */
export type EventName = keyof EventName.DetailMap;

/** @public */
export namespace EventName {
    export interface DetailMap {
        // Canvas
        'rev-canvas-click': EventDetail.Mouse;
        'rev-canvas-dragstart': EventDetail.Mouse;
        'rev-canvas-drag': EventDetail.Mouse;
        'rev-canvas-mousemove': EventDetail.Mouse;
        'rev-canvas-mousedown': EventDetail.Mouse;
        'rev-canvas-dragend': EventDetail.Mouse;
        'rev-canvas-mouseup': EventDetail.Mouse;
        'rev-canvas-mouseout': EventDetail.Mouse;
        'rev-canvas-wheelmoved': EventDetail.Mouse;
        'rev-canvas-dblclick': EventDetail.Mouse;
        'rev-canvas-context-menu': EventDetail.Mouse;
        'rev-canvas-keydown': EventDetail.Keyboard;
        'rev-canvas-keyup': EventDetail.Keyboard;
        'rev-canvas-focus-gained': undefined;
        'rev-canvas-focus-lost': undefined;
        'rev-canvas-touchstart': EventDetail.Touch;
        'rev-canvas-touchmove': EventDetail.Touch;
        'rev-canvas-touchend': EventDetail.Touch;
        'rev-canvas-resized': EventDetail.Resize;

        // SchemaModel / DataModel
        'rev-schema-loaded': undefined;
        'rev-data-loaded': undefined;
        'rev-data-all-invalidated': undefined;
        'rev-data-rows-invalidated': EventDetail.RowsDataInvalidated;
        'rev-data-cell-invalidated': EventDetail.CellDataInvalidated;
        'rev-data-row-columns-invalidated': EventDetail.RowColumnsDataInvalidated;
        'rev-data-row-cells-invalidated': EventDetail.RowCellsDataInvalidated;
        'rev-data-row-count-changed': undefined;
        'rev-data-rows-moved': undefined;
        'rev-data-prereindex': undefined;
        'rev-data-postreindex': undefined;

        // Grid
        'rev-column-sort': EventDetail.ColumnSort;
        'rev-editor-keyup': CellEditor.KeyEventDetail;
        'rev-editor-keydown': CellEditor.KeyEventDetail;
        'rev-editor-keypress': CellEditor.KeyEventDetail;
        'rev-editor-data-change': CellEditor.DataChangeEventDetail;
        'rev-row-selection-changed': SelectionDetail;
        'rev-column-selection-changed': SelectionDetail;
        'rev-selection-changed': SelectionDetail;
        'rev-context-menu': CellEvent;
        'rev-mouseup': CellEvent;
        'rev-mousedown': CellEvent;
        'rev-mousemove': CellEvent | undefined;
        'rev-button-pressed': CellEvent;
        'rev-keydown': EventDetail.Keyboard;
        'rev-keyup': EventDetail.Keyboard;
        'rev-filter-applied': undefined;
        'rev-cell-enter': CellEvent;
        'rev-cell-exit': CellEvent;
        'rev-click': CellEvent;
        'rev-double-click': CellEvent;
        'rev-columns-view-widths-changed': EventDetail.ColumnsViewWidthsChanged;
        'rev-grid-rendered': EventDetail.Grid;
        'rev-tick': EventDetail.Grid;
        'rev-grid-resized': EventDetail.Resize;
        'rev-touchstart': EventDetail.Touch;
        'rev-touchmove': EventDetail.Touch;
        'rev-touchend': EventDetail.Touch;
        'rev-scroll-x': EventDetail.Scroll;
        'rev-scroll-y': EventDetail.Scroll;
        'rev-request-cell-edit': CellEditor.RequestCellEditDetail;
        'rev-before-cell-edit': CellEditor.DataChangeEventDetail;
        'rev-after-cell-edit': CellEditor.DataChangeEventDetail;
        'rev-column-changed-event': undefined;
        'rev-hypergrid-columns-created': undefined;
    }
}
