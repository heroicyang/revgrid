
import { MouseCellEvent } from '../cell/cell-event';
import { Feature } from '../feature/feature';
import { GridProperties } from '../grid-properties';
import { HorizontalWheelScrollingAllowed, UnreachableCaseError } from '../grid-public-api';

export class ThumbwheelScrolling extends Feature {

    readonly typeName = ThumbwheelScrolling.typeName;

    override handleWheelMoved(e: MouseCellEvent) {
        const grid = this.grid;
        if (grid.properties.scrollingEnabled) {
            const primEvent = e.mouse.primitiveEvent;
            if (primEvent instanceof WheelEvent) {
                const deltaX = primEvent.deltaX;
                const deltaY = primEvent.deltaY;

                if (deltaX) {
                    const gridProps = this.grid.properties;
                    if (this.isHorizontalWheelScrollingAllowed(gridProps, e)) {
                        if (gridProps.scrollHorizontallySmoothly) {
                            grid.scrollViewHorizontallyBy(deltaX);
                        } else {
                            grid.scrollColumnsBy(Math.sign(deltaX));
                        }
                    }
                }
                if (deltaY) {
                    grid.sbVScroller.scrollIndex(Math.sign(deltaY)); // Update when Vertical scrolling improved
                    // grid.scrollVBy(Math.sign(deltaY));
                }
            }
        }
    }

    isHorizontalWheelScrollingAllowed(gridProps: GridProperties, e: MouseCellEvent) {
        switch (gridProps.horizontalWheelScrollingAllowed) {
            case HorizontalWheelScrollingAllowed.Never: return false;
            case HorizontalWheelScrollingAllowed.Always: return true;
            case HorizontalWheelScrollingAllowed.CtrlKeyDown: return e.mouse.primitiveEvent.ctrlKey;
            default: throw new UnreachableCaseError('TSIHWCA82007', gridProps.horizontalWheelScrollingAllowed);
        }
    }
}

export namespace ThumbwheelScrolling {
    export const typeName = 'thumbwheelscrolling';
}
