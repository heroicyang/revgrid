import { Rectangle } from '..//lib/rectangle';
// var Rectangle = require('rectangular').Rectangle;

/*
 * The Hypergrid selection model defines a rectangle's bottom and right as inclusive rather than exclusive.
 * This definition works fine so long as it is used consistently. It does however throw off `Rectangle`'s
 * `width`, `height`, and `area` properties, all of which are getters which assume an exclusive model.
 * The following `SelectionModel` object extends (subclasses) `Rectangle` to correct this problem so that
 * those properties return accurate results.
 */
/** @public */
export class InclusiveRectangle extends Rectangle {
    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width - 1, height - 1);
    }

    override get width() {
        return this.extent.x + 1;
    }

    override get height() {
        return this.extent.y + 1;
    }
}
