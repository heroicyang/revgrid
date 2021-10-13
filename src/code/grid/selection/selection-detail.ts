import { Selection } from './selection';
import { SelectionModel } from './selection-model';

/** @public */
export interface SelectionDetail {
    readonly selectedRows: number[]
    readonly selectedColumns: number[]
    readonly selections: Selection[]
}

/** @internal */
export class SelectionDetailAccessor implements SelectionDetail {
    constructor(private readonly _selectionModel: SelectionModel) {

    }

    get selectedRows() { return this._selectionModel.getSelectedRows(); }
    get selectedColumns() { return this._selectionModel.getSelectedColumns(); }
    get selections() { return this._selectionModel.selections; }
}
