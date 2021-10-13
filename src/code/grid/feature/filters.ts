
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';

/**
 * @constructor
 */
export class Filters extends Feature {

    readonly typeName = Filters.typeName;

    /**
     * Navigate away from the filter cell when:
     * 1. Coming from a cell editor (`event.detail.editor` defined).
     * 2. The cell editor was for a filter cell.
     * 3. The key (`event.detail.char) maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     *    * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     *    * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     *    * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        let handled = false;

        if (eventDetail.editor !== undefined) {
            const cellEvent = eventDetail.editor.event;
            if (cellEvent.isFilterCell) {
                const navKey = this.grid.generateNavKey(eventDetail.primitiveEvent);
                const handler: ((cellEvent: CellEvent) => void) = this['handle' + navKey];
                handler(cellEvent);
                handled = true;
            }
        }

        if (!handled) {
            if (this.next) {
                this.next.handleKeyDown(eventDetail);
            }
        }
    }

    handleLEFT(cellEvent: CellEvent) {
        this.moveLaterally(cellEvent, -1);
    }

    handleRIGHT(cellEvent: CellEvent) {
        this.moveLaterally(cellEvent, +1);
    }

    handleUP = this.moveDown;
    handleDOWN = this.moveDown;

    override handleDoubleClick(event: MouseCellEvent) {
        if (event.isFilterCell) {
            this.grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(event);
        }
    }

    override handleClick(event: MouseCellEvent) {
        if (event.isFilterCell) {
            this.grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(event);
        }
    }

    private moveLaterally(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: CellEvent, deltaX: number) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        let gridX = cellEvent.visibleColumn.index;
        const gridY = cellEvent.visibleRow.index;
        const originX = gridX;
        const grid = this.grid;
        const C = grid.renderer.visibleColumns.length;

        const moveDownCellEvent = new CellEvent(grid); // redefine so we don't reset the original below

        while (
            (gridX = (gridX + deltaX + C) % C) !== originX &&
            moveDownCellEvent.resetGridXY(gridX, gridY)
        ) {
            if (moveDownCellEvent.columnProperties.filterable) {
                // Select previous or next filterable column's filter cell
                grid.editAt(moveDownCellEvent);
                return;
            }
        }

        this.moveDown(moveDownCellEvent);
    }

    private moveDown(/*detail: Canvas.SyntheticEventDetail.Keyboard,*/ cellEvent: CellEvent) {
        // const cellEvent = detail.editor.event; // previously detail was passed in
        const gridX = cellEvent.visibleColumn.index;

        // Select first visible grid cell of this column
        const grid = this.grid;
        grid.selectViewportCell(gridX, 0);
        grid.takeFocus();
    }

}

export namespace Filters {
    export const typeName = 'filters';
}
