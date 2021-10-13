
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { Revgrid } from '../revgrid';

const commands: KeyPaging.CommandMap = {
    PAGEDOWN: (grid: Revgrid) => { grid.pageDown(); },
    PAGEDOWNSHIFT: (grid: Revgrid) => { grid.pageDown(); },
    PAGEUP: (grid: Revgrid) => { grid.pageUp(); },
    PAGEUPSHIFT: (grid: Revgrid) => { grid.pageUp(); },
    PAGELEFT: (grid: Revgrid) => { grid.pageLeft(); },
    PAGELEFTSHIFT: (grid: Revgrid) => { grid.pageLeft(); },
    PAGERIGHT: (grid: Revgrid) => { grid.pageRight(); },
    PAGERIGHTSHIFT: (grid: Revgrid) => { grid.pageRight(); },
};

/**
 * @constructor
 */
export class KeyPaging extends Feature {

    readonly typeName = KeyPaging.typeName;

    /**
     * @param event - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const func = commands[eventDetail.primitiveEvent.key];
        if (func) {
            func(this.grid);
        } else if (this.next) {
            this.next.handleKeyDown(eventDetail);
        }
    }

}

export namespace KeyPaging {
    export const typeName = 'keypaging';

    export type CommandFunction = (this: void, grid: Revgrid) => void;
    export interface CommandMap {
        [command: string]: CommandFunction;
        PAGEDOWN: CommandFunction;
        PAGEUP: CommandFunction;
        PAGELEFT: CommandFunction;
        PAGERIGHT: CommandFunction;
    }
}
