import { Writable } from '..//lib/types';
import { Point } from './point';

/** @public */
export interface RectangleInterface {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** @public */
export class Rectangle implements RectangleInterface {
    readonly x: number;
    readonly y: number;

    /**
     * @summary Upper left corner of this rect.
     */
    readonly origin: Point;

    /**
     * @summary this rect's width and height.
     * @desc Unlike the other `Point` properties, `extent` is not a global coordinate pair; rather it consists of a _width_ (`x`, always positive) and a _height_ (`y`, always positive).
     *
     * This object might be more legitimately typed as something like `Area` with properties `width` and `height`; however we wanted it to be able to use it efficiently with a point's `plus` and `minus` methods (that is, without those methods having to check and branch on the type of its parameter).
     *
     * Created upon instantiation by the {@linkplain Rectangle|constructor}.
     * @see The {@link Rectangle#corner|corner} method.
     */
    readonly extent: Point;

    /**
     * @summary Lower right corner of this rect.
     * @desc This is a calculated value created upon instantiation by the {@linkplain Rectangle|constructor}. It is `origin` offset by `extent`.
     *
     * **Note:** These coordinates actually point to the pixel one below and one to the right of the rect's actual lower right pixel.
     */
    readonly corner: Point;

    /**
     * @constructor Rectangle
     *
     * @desc This object represents a rectangular area within an abstract 2-dimensional matrix.
     *
     * The unit of measure is typically pixels.
     * (If used to model computer graphics, vertical coordinates are typically measured downwards
     * from the top of the window. This convention however is not inherent in this object.)
     *
     * Normally, the `x` and `y` parameters to the constructor describe the upper left corner of the rect.
     * However, negative values of `width` and `height` will be added to the given `x` and `y`. That is,
     * a negative value of the `width` parameter will extend the rect to the left of the given `x` and
     * a negative value of the `height` parameter will extend the rect above the given `y`.
     * In any case, after instantiation the following are guaranteed to always be true:
     * * The `extent`, `width`, and `height` properties _always_ give positive values.
     * * The `origin`, `top`, and `left` properties _always_ reflect the upper left corner.
     * * The `corner`, `bottom`, and `right` properties _always_ reflect the lower right corner.
     *
     * Note: This object should be instantiated with the `new` keyword.
     *
     * @param x - Horizontal coordinate of some corner of the rect.
     * @param y - Vertical coordinate of some corner of the rect.
     * @param width - Width of the new rect. May be negative (see above).
     * @param height - Height of the new rect. May be negative (see above).
     */
    constructor(x: number, y: number, width: number, height: number) {
        if (width < 0) {
            x += width;
            width = -width;
        }

        if (height < 0) {
            y += height;
            height = -height;
        }

        this.x = x;
        this.y = y;
        this.origin = Point.create(x, y);
        this.extent = Point.create(width, height);
        this.corner = Point.create(x + width, y + height);
    }

    /**
     * @summary Minimum vertical coordinate of this rect.
     */
    get top() {
        return this.origin.y;
    }

    /**
     * @summary Minimum horizontal coordinate of this rect.
     */
    get left() {
        return this.origin.x;
    }

    /**
     * For exclusive, maximum vertical coordinate of this rect + 1.
     * For inclusive, maximum vertical coordinate of this rect.
     */
    get bottom() {
        return this.corner.y;
    }

    /**
     * For exclusive, maximum horizontal coordinate of this rect + 1.
     * For inclusive, maximum horizontal coordinate of this rect.
     */
    get right() {
        return this.corner.x;
    }

    /**
     * @summary Width of this rect (always positive).
     */
    get width() {
        return this.extent.x;
    }

    /**
     * @summary Height of this rect (always positive).
     */
    get height() {
        return this.extent.y;
    }

    /**
     * @summary Area of this rect.
     */
    get area() {
        return this.width * this.height;
    }

    /**
     * @returns `true` iff given `point` entirely contained within this rect.
     * @param pointOrRect - The point or rect to test for containment.
     */
    contains(point: Point): boolean {
        let minX = this.origin.x;
        let maxX = minX + this.extent.x;
        let minY = this.origin.y;
        let maxY = minY + this.extent.y;

        if (this.extent.x < 0) {
            minX = maxX;
            maxX = this.origin.x;
        }

        if (this.extent.y < 0) {
            minY = maxY;
            maxY = this.origin.y;
        }

        return (
            minX <= this.x && point.x < maxX &&
            minY <= this.y && point.y < maxY
        );
    }

    /**
     * _(Formerly `isContainedWithinRectangle`.)_
     * @returns {boolean} `true` iff `this` rect is entirely contained within given `rect`.
     * @param {Rectangle} rect - Rectangle to test against this rect.
     */
    within(rect: Rectangle): boolean {
        return (
            Point.lessThanOrEqualTo(rect.origin, this.origin) &&
            Point.greaterThanOrEqualTo(rect.corner, this.corner)
        );
    }

    /** Moves this Rectangle in x direction */
    moveX(offset: number) {
        const writeableRect = this as WriteableRectangle;
        writeableRect.x += offset;
        Point.moveX(writeableRect.origin, offset);
        Point.moveX(writeableRect.corner, offset);
    }

    /** Moves this Rectangle in y direction */
    moveY(offset: number) {
        const writeableRect = this as WriteableRectangle;
        writeableRect.y += offset;
        Point.moveY(writeableRect.origin, offset);
        Point.moveY(writeableRect.corner, offset);
    }

    /** Grows this Rectangle in x direction with let staying fixed */
    growFromLeft(widthIncrease: number) {
        Point.moveX(this.extent, widthIncrease);
        Point.moveX(this.corner, widthIncrease);
    }

    /** Grows this Rectangle in y direction with top staying fixed */
    growFromTop(heightIncrease: number) {
        Point.moveY(this.extent, heightIncrease);
        Point.moveY(this.corner, heightIncrease);
    }

    /**
     * @returns A copy of this rect but with horizontal position reset to given `x` and no width.
     * @param x - Horizontal coordinate of the new rect.
     */
    newXFlattened(x: number): Rectangle {
        return new Rectangle(x, this.origin.y, 0, this.extent.y);
    }

    /**
     * @returns A copy of this rect but with vertical position reset to given `y` and no height.
     * @param y - Vertical coordinate of the new rect.
     */
    newYFlattened(y: number): Rectangle {
        return new Rectangle(this.origin.x, y, this.extent.x, 0);
    }

    newXMoved(xOffset: number): Rectangle {
        return new Rectangle(this.x + xOffset, this.y, this.width, this.height);
    }

    newYMoved(yOffset: number): Rectangle {
        return new Rectangle(this.x, this.y + yOffset, this.width, this.height);
    }

    /**
     * _(Formerly: `insetBy`.)_
     * @returns That is enlarged/shrunk by given `padding`.
     * @param padding - Amount by which to increase (+) or decrease (-) this rect
     * @see The {@link Rectangle#newShrunkFromCenter|shrinkBy} method.
     */
    newGrownFromCenter(padding: number): Rectangle {
        return new Rectangle(
            this.x - padding,
            this.y - padding,
            this.width + 2 * padding,
            this.height + 2 * padding);
    }

    /**
     * @returns {Rectangle} That is enlarged/shrunk by given `padding`.
     * @param {number} padding - Amount by which to decrease (+) or increase (-) this rect.
     * @see The {@link Rectangle#newGrownFromCenter|growBy} method.
     */
    newShrunkFromCenter(padding: number): Rectangle {
        return this.newGrownFromCenter(-padding);
    }

    /**
     * @returns {Rectangle} Bounding rect that contains both this rect and the given `rect`.
     * @param {Rectangle} rect - The rectangle to union with this rect.
     */
    newUnioned(rect: Rectangle): Rectangle {
        const origin = Point.min(this.origin, rect.origin);
        const corner = Point.max(this.corner, rect.corner);
        const extent = Point.minus(corner, origin);

        return new Rectangle(
            origin.x, origin.y,
            extent.x, extent.y
        );
    }

    /**
     * iterate over all points within this rect, invoking `iteratee` for each.
     * @param {function(number,number)} iteratee - Function to call for each point.
     * Bound to `context` when given; otherwise it is bound to this rect.
     * Each invocation of `iteratee` is called with two arguments:
     * the horizontal and vertical coordinates of the point.
     * @param {object} [context=this] - Context to bind to `iteratee` (when not `this`).
     */
    // forEach(iteratee: (arg0: number, arg1: number) => unknown, context: Record<string, unknown>) {
    //     context = context || this;
    //     for (let x = this.origin.x, x2 = this.corner.x; x < x2; x++) {
    //         for (let y = this.origin.y, y2 = this.corner.y; y < y2; y++) {
    //             iteratee.call(context, x, y);
    //         }
    //     }
    // }

    /**
     * @returns {Rectangle} One of:
     * * _If this rect intersects with the given `rect`:_
     *      a new rect representing that intersection.
     * * _If it doesn't intersect and `ifNoneAction` defined:_
     *      result of calling `ifNoneAction`.
     * * _If it doesn't intersect and `ifNoneAction` undefined:_
     *      `null`.
     * @param {Rectangle} rect - The rectangle to intersect with this rect.
     * @param {function(Rectangle)} [ifNoneAction] - When no intersection, invoke and return result.
     * Bound to `context` when given; otherwise bound to this rect.
     * Invoked with `rect` as sole parameter.
     * @param {object} [context=this] - Context to bind to `ifNoneAction` (when not `this`).
     */
    // intersect(rect: Rectangle, ifNoneAction: (arg0: Rectangle) => any, context: object): Rectangle {
    //     var result = null,
    //         origin = this.origin.max(rect.origin),
    //         corner = this.corner.min(rect.corner),
    //         extent = corner.minus(origin);

    //     if (extent.x > 0 && extent.y > 0) {
    //         result = new Rectangle(
    //             origin.x, origin.y,
    //             extent.x, extent.y
    //         );
    //     } else if (typeof ifNoneAction === 'function') {
    //         result = ifNoneAction.call(context || this, rect);
    //     }

    //     return result;
    // }

    /**
     * @returns {boolean} `true` iff this rect overlaps with given `rect`.
     * @param {Rectangle} rect - The rectangle to intersect with this rect.
     */
    intersects(rect: Rectangle): boolean {
        return (
            rect.corner.x > this.origin.x &&
            rect.corner.y > this.origin.y &&
            rect.origin.x < this.corner.x &&
            rect.origin.y < this.corner.y
        );
    }
}

type WriteableRectangle = Writable<Rectangle>;
