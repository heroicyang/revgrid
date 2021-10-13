import { Rectangle } from '../lib/rectangle';

/*
 * The Hypergrid selection model defines a rectangle's bottom and right as inclusive rather than exclusive.
 * This definition works fine so long as it is used consistently. It does however throw off `Rectangle`'s
 * `width`, `height`, and `area` properties, all of which are getters which assume an exclusive model.
 * The following `SelectionModel` object extends (subclasses) `Rectangle` to correct this problem so that
 * those properties return accurate results.
 */

export class SelectionRectangle extends Rectangle {
    override get width() { return this.extent.x + 1; }
    override get height() { return this.extent.y + 1; }
}

