import { AssertError } from '../lib/revgrid-error';
import { RecalculateViewRenderAction, RenderAction, RepaintGridRenderAction } from './render-action';

export class RenderActioner {
    actionsEvent: RenderActioner.ActionsEvent;

    private _queuedActions: RenderAction[] = [];
    private _beginChangeCount = 0;

    beginChange() {
        this._beginChangeCount++;
    }

    endChange() {
        this._beginChangeCount--;
        if (this._beginChangeCount === 0) {
            if (this._queuedActions.length > 0) {
                const actions = this._queuedActions;
                this._queuedActions = [];
                this.actionsEvent(actions);
            } else {
                if (this._beginChangeCount < 0) {
                    throw new AssertError('RAEC91004', 'Mismatched RenderActioner begin/endChange callback');
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderColumnsInserted(index: number, count: number) {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderColumnsDeleted(index: number, count: number) {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    renderAllColumnsDeleted() {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    renderColumnsChanged() {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderRowsInserted(index: number, count: number) {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderRowsDeleted(index: number, count: number) {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    renderAllRowsDeleted() {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    renderRowsLoaded() {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    renderRowsMoved(oldIndex: number, newIndex: number, rowCount: number) {
        this.beginChange();
        try {
            this.queueRecalculateViewAction();
        } finally {
            this.endChange();
        }
    }

    invalidateAll() {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateRows(rowIndex: number, count: number) {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateRow(rowIndex: number) {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateRowColumns(rowIndex: number, columnIndex: number, columnCount: number) {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateRowCells(rowIndex: number, columnIndexes: number[]) {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    invalidateCell(columnIndex: number, rowIndex: number) {
        this.beginChange();
        try {
            this.queueRepaintGridAction();
        } finally {
            this.endChange();
        }
    }

    private queueRepaintGridAction() {
        if (this._queuedActions.length === 0) {
            const action: RepaintGridRenderAction = {
                type: RenderAction.Type.RepaintGrid,
            };
            this._queuedActions.push(action);
        }
    }

    private queueRecalculateViewAction() {
        if (this._queuedActions.length === 0) {
            const action: RecalculateViewRenderAction = {
                type: RenderAction.Type.RecalculateView,
            };
            this._queuedActions.push(action);
        } else {
            const firstQueuedAction = this._queuedActions[0];
            if (firstQueuedAction.type === RenderAction.Type.RepaintGrid) {
                // replace RepaintGrid with RecalculateView which will also repaint grid
                const action: RecalculateViewRenderAction = {
                    type: RenderAction.Type.RecalculateView,
                };
                this._queuedActions[0] = action;
            }
        }
    }
}

export namespace RenderActioner {
    export type ActionsEvent = (this: void, actions: RenderAction[]) => void;
}
