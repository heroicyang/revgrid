import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export abstract class NumberTextfield extends CellEditor {

    constructor(grid: Revgrid) {
        super(grid, undefined, template);
        this.input.style.textAlign = this.event.columnProperties.halign;
        this.input.style.font = this.event.columnProperties.font;
    }

    override selectAll() {
        this.input.setSelectionRange(0, this.input.value.length);
    }
}

const template = '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">';
