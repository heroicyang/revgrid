
import { CellEditor } from '../cell-editor/cell-editor';
import { MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
export class CellEditingFeature extends Feature {

    readonly typeName = CellEditingFeature.typeName;

    override handleClick(event: MouseCellEvent) {
        this.edit(event, false);
    }

    override handleDoubleClick(event: MouseCellEvent) {
        this.edit(event, true);
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const grid = this.grid;

        let char: string;
        let isVisibleChar: boolean;
        let isDeleteChar: boolean;

        const cellEvent = grid.getGridCellFromLastSelection(false);
        if (cellEvent === undefined) {
            super.handleKeyDown(eventDetail);
        } else {
            const keyboardEvent = eventDetail.primitiveEvent;
            if (cellEvent.columnProperties.editOnKeydown && !grid.cellEditor &&
                (
                    (char = keyboardEvent.key) === 'F2' ||
                    (isVisibleChar = char.length === 1 && !(keyboardEvent.metaKey || keyboardEvent.ctrlKey)) ||
                    (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
                )
            ) {
                const editor = grid.onEditorActivate(cellEvent);

                if (editor instanceof CellEditor) {
                    if (isVisibleChar) {
                        editor.input.value = char;
                    } else if (isDeleteChar) {
                        editor.setEditorValue('');
                    }
                    eventDetail.primitiveEvent.preventDefault();
                }
            } else {
                super.handleKeyDown(eventDetail);
            }
        }
    }

    edit(event: MouseCellEvent, onDoubleClick: boolean) {
        if (
            event.isDataCell &&
            !(event.columnProperties['editOnDoubleClick'] != onDoubleClick) // both same (true or falsy)?
        ) {
            this.grid.onEditorActivate(event);
        }

        if (this.next) {
            this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](event);
        }
    }
}

export namespace CellEditingFeature {
    export const typeName = 'cellediting';
}
