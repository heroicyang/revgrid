
import { CellEditor } from './cell-editor';

export class Combo extends CellEditor {

    /**
     * the list of items to pick from
     */
    items: [];

    /**
     * @desc request focus for my input control
     */
    override takeFocus() {
        setTimeout(() => {
            //this.input.focus();
            this.selectAll();
        }, 300);
    }

    override selectAll() {
        const lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }
}
