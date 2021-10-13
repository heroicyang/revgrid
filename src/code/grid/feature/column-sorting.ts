import { MouseCellEvent } from '../cell/cell-event';
import { ColumnProperties } from '../column/column-properties';
import { ColumnsManager } from '../column/columns-manager';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';

export class ColumnSorting extends Feature {

    readonly typeName = ColumnSorting.typeName;

    private _columnsManager: ColumnsManager;

    override initializeOn() {
        this._columnsManager = this.grid.columnsManager;

        super.initializeOn();
    }

    override handleClick(event: MouseCellEvent) {
        if (!this.grid.featuresSharedState.mouseDownUpClickUsedForMoveOrResize) {
            this.sort(event, false);
        }
    }

    override handleDoubleClick(event: MouseCellEvent) {
        this.sort(event, true);
    }

    override handleMouseMove(event: MouseCellEvent) {
        if (event !== undefined) {
            let columnProperties: ColumnProperties;
            if (
                event.isRowFixed &&
                event.isHeaderCell &&
                (columnProperties = this._columnsManager.getActiveColumnProperties(event.gridCell.x)) &&
                columnProperties.sortable
            ) {
                this.cursor = 'pointer';
            } else {
                this.cursor = null;
            }
        }

        super.handleMouseMove(event);
    }

    private sort(event: MouseCellEvent, onDoubleClick: boolean) {
        let columnProperties: ColumnProperties;
        if (
            event.isHeaderCell &&
            (columnProperties = event.columnProperties).sortable &&
            !(columnProperties.sortOnDoubleClick !== onDoubleClick) // both same (true or falsy)?
        ) {
            const mouseEvent = event.mouse.primitiveEvent;
            const eventDetail: EventDetail.ColumnSort = {
                time: Date.now(),
                column: event.column,
                activeColumnIndex: event.gridCell.x,
                altKey: mouseEvent.altKey,
                ctrlKey: mouseEvent.ctrlKey,
                metaKey: mouseEvent.metaKey,
                shiftKey: mouseEvent.shiftKey,
            }
            this.grid.fireSyntheticColumnSortEvent(eventDetail);
        }

        if (this.next) {
            this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](event);
        }
    }
}

export namespace ColumnSorting {
    export const typeName = 'columnsorting';
}
