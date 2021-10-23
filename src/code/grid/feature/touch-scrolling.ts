
import { RenderedCell } from '../cell/rendered-cell';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { FinBar } from '../finbar/finbar-api';

export class TouchScrolling extends Feature {

    readonly typeName = TouchScrolling.typeName;

    private _stepTimeoutHandle: ReturnType<typeof setTimeout>;
    private touches: RenderedCell.Bounds[];

    override handleTouchStart(eventDetail: EventDetail.Touch) {
        this.stopDeceleration();
        this.touches = [this.getTouchedBounds(eventDetail)];
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override handleClick() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override handleDoubleClick() {

    }

    override handleTouchMove(eventDetail: EventDetail.Touch) {
        const currentTouch = this.getTouchedBounds(eventDetail);
        const lastTouch = this.touches[this.touches.length - 1];

        const xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
        const yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

        const grid = this.grid;
        grid.sbHScroller.scroll(xOffset);
        grid.sbVScroller.scrollIndex(yOffset);

        if (this.touches.length >= TouchScrolling.MAX_TOUCHES) {
            this.touches.shift();
        }

        this.touches.push(currentTouch);
    }

    override handleTouchEnd(eventDetail: EventDetail.Touch) {
        const currentTouch = this.getTouchedBounds(eventDetail);
        let timeOffset: number;
        let i = -1;

        do {
            timeOffset = (currentTouch.timestamp - this.touches[++i].timestamp);
        } while (timeOffset > 100 && i < this.touches.length - 1);

        const startTouch = this.touches[i];

        this.decelerateY(startTouch, currentTouch);
        this.decelerateX(startTouch, currentTouch);
    }

    private getTouchedBounds(eventDetail: EventDetail.Touch) {
        const point = eventDetail.touches[0];
        const bounds = this.grid.getGridCellFromMousePoint(point).renderedCell.bounds;
        bounds.timestamp = Date.now();
        return bounds;
    }

    private decelerateY(startTouch: RenderedCell.Bounds, endTouch: RenderedCell.Bounds) {
        const offset = endTouch.y - startTouch.y;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.grid.sbVScroller, offset, timeOffset);
    }

    private decelerateX(startTouch: RenderedCell.Bounds, endTouch: RenderedCell.Bounds) {
        const offset = endTouch.x - startTouch.x;
        const timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(this.grid.sbHScroller, offset, timeOffset);
    }

    private decelerate(scroller: FinBar, offset: number, timeOffset: number) {
        const velocity = (Math.abs(offset) / timeOffset) * 100;
        const dir = -Math.sign(offset);
        const interval = this.getInitialInterval(velocity);

        this.step(scroller, velocity, dir, interval);
    }

    private step(scroller: FinBar, velocity: number, dir: number, interval: number) {
        if (velocity > 0) {
            const delta = this.getDelta(velocity);
            const index = scroller.index + (dir * delta);
            scroller.index = index;

            if (index > scroller.contentRange.finish || index < 0) {
                return;
            }

            velocity -= TouchScrolling.DEC_STEP_SIZE;

            const nextInterval = this.updateInterval(interval, velocity);
            this._stepTimeoutHandle = setTimeout(
                () => this.step(scroller, velocity, dir, nextInterval),
                interval
            );
        }
    }

    private getDelta(velocity: number) {
        if (velocity >= 180) {
            return 10;
        } else if (velocity >= 100) {
            return 5;
        } else if (velocity >= 50) {
            return 2;
        } else if (velocity >= 25) {
            return 1;
        } else {
            return 0.5;
        }
    }

    private getInitialInterval(velocity: number) {
        if (velocity >= 50) {
            return 5;
        } else if (velocity >= 25) {
            return 15;
        } else {
            return 30;
        }
    }

    private updateInterval(interval: number, velocity: number) {
        if (interval >= TouchScrolling.MAX_INTERVAL) {
            return interval;
        }

        let offset = 0;

        if (velocity < 25) {
            offset = 10;
        } else if (velocity < 75) {
            offset = 5;
        } else if (velocity < 150) {
            offset = 2;
        }

        return interval + offset;
    }

    private stopDeceleration() {
        clearTimeout(this._stepTimeoutHandle);
    }
}

export namespace TouchScrolling {
    export const typeName = 'touchscrolling';

    export const MAX_INTERVAL = 200;
    export const MAX_TOUCHES = 70;
    export const DEC_STEP_SIZE = 5;
}
