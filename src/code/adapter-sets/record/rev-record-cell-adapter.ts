import { BeingPaintedCell, CellModel, CellPaintConfig, CellPainter } from '../../grid/grid-public-api';
import { RevRecordCellPaintConfigAccessor } from './rev-record-cell-paint-config-accessor';
import { RevRecordCellPainter } from './rev-record-cell-painter';
import { RevRecordMainAdapter } from './rev-record-main-adapter';

/** @public */
export class RevRecordCellAdapter implements CellModel {
    constructor(
        private readonly _mainAdapter: RevRecordMainAdapter,
        private readonly _mainCellPainter: RevRecordCellPainter) {
    }

    getCellPaintConfig(beingPaintedCell: BeingPaintedCell): CellPaintConfig | undefined {
        return new RevRecordCellPaintConfigAccessor(beingPaintedCell, this._mainAdapter);
    }

    getCellPainter(): CellPainter | undefined {
        return this._mainCellPainter;
    }
}
