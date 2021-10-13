import { CellEditor } from '../cell-editor/cell-editor';
import { Column } from '../column/column';
import { Point } from '../lib/point';
import { Revgrid } from '../revgrid';

/** @public */
export namespace EventDetail {
    export interface Resize {
        readonly time: number;
        readonly width: number,
        readonly height: number,
    }

    export interface Mouse {
        readonly time: number;
        primitiveEvent: MouseEvent;
        readonly mouse: Point; // mouse location
        readonly dragstart?: Point;
        readonly isRightClick?: boolean;
    }

    export interface Keyboard {
        readonly time: number;
        readonly primitiveEvent: KeyboardEvent;
        // readonly legacyChar: e.legacyKey,
        // readonly code: number,
        // readonly key: number,
        readonly repeat?: number,
        readonly repeatCount?: number,
        readonly repeatStartTime?: number,
        readonly editor?: CellEditor;
    }

    export interface EditorKeyboard extends Keyboard {
        readonly time: number;
        readonly grid: Revgrid,
        readonly editor: CellEditor,
    }

    export interface Touch {
        readonly time: number;
        readonly primitiveEvent: TouchEvent;
        readonly touches: Point[];
    }

    export interface Grid {
        readonly time: number;
        readonly source: Revgrid;
    }

    export interface Scroll {
        readonly time: number;
        readonly value: number;
        readonly index: number;
        readonly offset: number;
    }

    export interface ColumnsViewWidthsChanged {
        readonly fixedChanged: boolean
        readonly nonFixedChanged: boolean;
        readonly activeChanged: boolean;
    }

    export interface ColumnSort {
        readonly time: number;
        readonly column: Column;
        readonly activeColumnIndex: number;
        readonly altKey: boolean;
        readonly metaKey: boolean;
        readonly ctrlKey: boolean;
        readonly shiftKey: boolean;
    }

    export interface RowsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly count: number;
    }

    export interface CellDataInvalidated {
        readonly time: number;
        readonly schemaColumnIndex: number;
        readonly rowIndex: number;
    }

    export interface RowCellsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly schemaColumnIndexes: number[];
    }

    export interface RowColumnsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly schemaColumnIndex: number;
        readonly columnCount: number;
    }
}
