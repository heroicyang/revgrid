import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { Point } from '../lib/point';

/** @public */
export class Selection extends InclusiveRectangle {
    readonly firstSelectedCell: Point;
    readonly lastSelectedCell: Point;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, width, height);

        this.firstSelectedCell = Point.create(x, y);

        const oppositeX = x === this.origin.x ? this.corner.x : this.origin.x;
        const oppositeY = y === this.origin.y ? this.corner.y : this.origin.y;
        this.lastSelectedCell = Point.create(oppositeX, oppositeY);
    }

    override moveX(offset: number) {
        super.moveX(offset);
        Point.moveX(this.firstSelectedCell, offset);
        Point.moveX(this.lastSelectedCell, offset);
    }

    override moveY(offset: number) {
        super.moveY(offset);
        Point.moveY(this.firstSelectedCell, offset);
        Point.moveY(this.lastSelectedCell, offset);
    }

    override growFromLeft(widthIncrease: number) {
        if (this.lastSelectedCell.x === this.corner.x) {
            Point.moveX(this.lastSelectedCell, widthIncrease)
        } else {
            Point.moveX(this.firstSelectedCell, widthIncrease)
        }
        super.growFromLeft(widthIncrease);
    }

    override growFromTop(heightIncrease: number) {
        if (this.lastSelectedCell.y === this.corner.y) {
            Point.moveY(this.lastSelectedCell, heightIncrease)
        } else {
            Point.moveY(this.firstSelectedCell, heightIncrease)
        }
        super.growFromTop(heightIncrease);
    }

    /** Adjusts the selection to where it would be after a columns insertion.
     * @returns true if selection changed
     */
    adjustForColumnsInserted(columnIndex: number, count: number): boolean {
        const left = this.x;
        const exclusiveRight = left + this.width;
        if (columnIndex >= exclusiveRight || count === 0) {
            return false;
        } else {
            if (columnIndex <= left) {
                this.moveX(count);
            } else {
                this.growFromLeft(count);
            }
            return true;
        }
    }

    /** Adjusts the selection to where it would be after a rows insertion.
     * @returns true if selection changed
     */
    adjustForRowsInserted(rowIndex: number, count: number): boolean {
        const top = this.y;
        const height = this.height;
        const exclusiveBottom = top + height;
        if (rowIndex >= exclusiveBottom || count === 0) {
            return false;
        } else {
            if (rowIndex <= top) {
                this.moveY(count);
            } else {
                this.growFromTop(count);
            }
            return true;
        }
    }

    /** Adjusts the selection to where it would be after a columns deletion.
     * @returns true if selection changed, false if it was not changed or null if it should be fully deleted
     */
    adjustForColumnsDeleted(deletionLeft: number, deletionCount: number): boolean | null {
        const left = this.x;
        const width = this.width;
        const exclusiveRight = left + width;
        if (deletionLeft >= exclusiveRight || deletionCount === 0) {
            // deletion after selection or nothing was deleted
            return false;
        } else {
            const exclusiveDeletionRight = deletionLeft + deletionCount;
            if (deletionLeft <= left) {
                if (exclusiveDeletionRight <= left) {
                    // deletion before selection - move
                    this.moveX(-deletionCount);
                    return true;
                } else {
                    if (exclusiveDeletionRight < exclusiveRight) {
                        // deletion before and into selection - move and shrink
                        this.moveX(deletionLeft - left);
                        this.growFromLeft(left - exclusiveDeletionRight);
                        return true;
                    } else {
                        // deletion covers all of selection
                        return null;
                    }
                }
            } else {
                if (exclusiveDeletionRight <= exclusiveRight) {
                    // deletion within selection - shrink
                    this.growFromLeft(-deletionCount);
                    return true;
                } else {
                    // deletion from within selection and beyond - shrink
                    this.growFromLeft(deletionLeft - exclusiveRight);
                    return true;
                }
            }
        }
    }

    /** Adjusts the selection to where it would be after a rows deletion.
     * @returns true if selection changed, false if it was not changed or null if it should be fully deleted
     */
    adjustForRowsDeleted(deletionTop: number, deletionCount: number): boolean | null {
        const top = this.y;
        const height = this.height;
        const exclusiveBottom = top + height;
        if (deletionTop >= exclusiveBottom || deletionCount === 0) {
            // deletion after selection or nothing was deleted
            return false;
        } else {
            const exclusiveDeletionBottom = deletionTop + deletionCount;
            if (deletionTop <= top) {
                if (exclusiveDeletionBottom <= top) {
                    // deletion before selection - move
                    this.moveY(-deletionCount);
                    return true;
                } else {
                    if (exclusiveDeletionBottom < exclusiveBottom) {
                        // deletion before and into selection - move and shrink
                        this.moveY(deletionTop - top);
                        this.growFromTop(top - exclusiveDeletionBottom);
                        return true;
                    } else {
                        // deletion covers all of selection
                        return null;
                    }
                }
            } else {
                if (exclusiveDeletionBottom <= exclusiveBottom) {
                    // deletion within selection - shrink
                    this.growFromTop(-deletionCount);
                    return true;
                } else {
                    // deletion from within selection and beyond - shrink
                    this.growFromTop(deletionTop - exclusiveBottom);
                    return true;
                }
            }
        }
    }
}
