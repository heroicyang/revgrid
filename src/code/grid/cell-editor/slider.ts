
import { CellEvent } from '../cell/cell-event';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

/**
 * @constructor
 * @extends CellEditor
 */
export class Slider extends CellEditor {
    constructor(grid: Revgrid, options: CellEvent) {
        super(grid, options, template);
    }
}

const template = '<input type="range" lang="{{locale}}" style="{{style}}">'


export namespace Slider {
    export const typeName = 'Slider';
}
