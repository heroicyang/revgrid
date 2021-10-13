import { BeingPaintedCell, CellPaintConfigAccessor } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfig } from './rev-record-cell-paint-config';
import { RevRecordMainAdapter } from './rev-record-main-adapter';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export class RevRecordCellPaintConfigAccessor extends CellPaintConfigAccessor implements RevRecordCellPaintConfig {
    readonly isRowFocused: boolean
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;

    constructor(beingPaintedCell: BeingPaintedCell, mainAdapter: RevRecordMainAdapter) {
        super(beingPaintedCell)

        let rowIndex = beingPaintedCell.dataCell.y;

        const grid = beingPaintedCell.grid;
        const selections = grid.selections;
        this.isRowFocused = selections.length > 0 && selections[0].firstSelectedCell.y === rowIndex;

        if (mainAdapter.rowOrderReversed) {
            const rowCount = mainAdapter.getRowCount();
            rowIndex = rowCount - rowIndex - 1;
        }
        const recentChanges = mainAdapter.recentChanges;
        const fieldIndex = beingPaintedCell.dataCell.x;
        this.valueRecentChangeTypeId = recentChanges.getValueRecentChangeTypeId(fieldIndex, rowIndex);
        this.recordRecentChangeTypeId = recentChanges.getRecordRecentChangeTypeId(rowIndex);
    }
}
