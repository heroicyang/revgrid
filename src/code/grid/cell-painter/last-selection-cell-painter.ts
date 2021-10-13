
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPainter } from './cell-painter';

/**
 * @desc A rendering of the last Selection Model
 */
export class LastSelectionCellPainter extends CellPainter {
    override paint(gc: CanvasRenderingContext2DEx, config: CellPaintConfig) {
        const visOverlay = gc.alpha(config.selectionRegionOverlayColor) > 0,
            visOutline = gc.alpha(config.selectionRegionOutlineColor) > 0;

        if (visOverlay || visOutline) {
            const x = config.bounds.x;
            const y = config.bounds.y;
            const width = config.bounds.width;
            const height = config.bounds.height;

            gc.beginPath();

            gc.rect(x, y, width, height);

            if (visOverlay) {
                gc.cache.fillStyle = config.selectionRegionOverlayColor;
                gc.fill();
            }

            if (visOutline) {
                gc.cache.lineWidth = 1;
                gc.cache.strokeStyle = config.selectionRegionOutlineColor;
                gc.stroke();
            }

            gc.closePath();
        }
    }
}

export namespace LastSelectionCellPainter {
    export const typeName = 'LastSelection';
}
