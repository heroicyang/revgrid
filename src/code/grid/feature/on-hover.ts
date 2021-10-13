
import { MouseCellEvent } from '../cell/cell-event';
import { Feature } from '../feature/feature';

/**
 * @constructor
 */
export class OnHover extends Feature {

    readonly typeName = OnHover.typeName;

    override handleMouseMove(event: MouseCellEvent | undefined) {
        this.grid.processHoverCell(event);
        super.handleMouseMove(event);
    }

    override handleMouseEnter(event: MouseCellEvent) {
        this.grid.processHoverCell(event);
        super.handleMouseEnter(event);
    }

    override handleMouseExit(event: MouseCellEvent) {
        this.grid.processHoverCell(undefined);
        super.handleMouseExit(event);
    }
}

export namespace OnHover {
    export const typeName = 'onhover';
}
