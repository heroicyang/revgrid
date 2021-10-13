
import { CellEvent } from '../cell/cell-event';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export class Spinner extends CellEditor {
    constructor(grid: Revgrid, options: CellEvent) {
        super(grid, options, template);
    }
}

const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
