
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPainter } from './cell-painter';

export class TagCellPainter extends CellPainter {

    override paint(gc: CanvasRenderingContext2DEx, config: CellPaintConfig) {
        const tagbands: TagCellPainter.Tagband[] | undefined = undefined; // should be config.tagbands
        if (tagbands) {
            const tagband = tagbands.find((tagband) => {
                return config.value >= tagband.floor;
            });
            const fillStyle = tagband && tagband.fillStyle;

            if (fillStyle) {
                const b = config.bounds,
                    x = b.x + b.width - 1,
                    y = b.y;

                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x, y + 8);
                gc.lineTo(x - 8, y);
                // gc.lineTo(x, y);
                gc.closePath();
                gc.cache.fillStyle = fillStyle;
                gc.fill();
            }
        }
    }
}

export namespace TagCellPainter {
    export const typeName = 'Tag';

    // Has not been implemented.  Needs to be declared elsewhere
    export interface Tagband {
        floor: number;
        fillStyle: string;
    }
}
