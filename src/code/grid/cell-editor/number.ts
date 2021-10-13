
import { Revgrid } from '../revgrid';
import { NumberTextfield } from './number-text-field';

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 */

export class Number extends NumberTextfield {
    constructor(grid: Revgrid) {
        super(grid);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.numberFormatter;
        }
    }
}

export namespace Number {
    export const typeName = 'Number';
}
