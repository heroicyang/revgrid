import { EventDetail } from '../event/event-detail';
import { RenderedCell } from './rendered-cell';

/**
 * @classdesc `CellEvent` is a very low-level object that needs to be super-efficient. JavaScript objects are well known to be light weight in general, but at this level we need to be careful.
 *
 * These objects were originally only being created on mouse events. This was no big deal as mouse events are few and far between. However, as of v1.2.0, the renderer now also creates one for each visible cell on each and every grid paint.
 *
 * For this reason, to maintain performance, each grid gets a custom definition of `CellEvent`, created by this class factory, with the following optimizations:
 *
 * * Use of `extend-me` is avoided because its `initialize` chain is a bit too heavy here.
 * * Custom versions of `CellEvent` for each grid lightens the load on the constructor.
 *
 * @desc All own enumerable properties are mixed into cell editor:
 * * Includes `this.column` defined by constructor (as enumerable).
 * * Excludes all other properties defined by constructor and prototype, all of which are non-enumerable.
 * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
 *
 * Including the params calls {@link CellEvent#resetGridCY resetGridCY(gridX, gridY)}.
 * Alternatively, instantiate without params and/or later call one of these:
 * * {@link CellEvent#resetGridXY resetGridXY(...)}
 * * {@link CellEvent#resetDataXY resetDataXY(...)}
 * * {@link CellEvent#resetGridXDataY resetGridXDataY(...)}
 */

/** @public */
export class CellEvent extends RenderedCell {
}

export class MouseCellEvent extends CellEvent {
    mouse: EventDetail.Mouse;
}
