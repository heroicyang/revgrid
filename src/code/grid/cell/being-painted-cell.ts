// import { CellEvent } from './cell-event';
import { Renderer } from '../renderer/renderer';
import { RenderedCell } from './rendered-cell';

/** @public */
export class BeingPaintedCell extends RenderedCell {
    // partial render support
    snapshot: BeingPaintedCell.Snapshot;
    minWidth: number | undefined;

    override reset(visibleColumn: Renderer.VisibleColumn, visibleRow: Renderer.VisibleRow) {
        // partial render support
        this.snapshot = [];
        this.minWidth = undefined;

        super.reset(visibleColumn, visibleRow);
    }
}

/** @public */
export namespace BeingPaintedCell {
    export type SubrowSnapshot = Record<string, unknown>
    export type Snapshot = SubrowSnapshot[];
}
