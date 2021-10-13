
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPainter } from './cell-painter';

/**
 * The default cell rendering function for a button cell.
 */
export class ButtonCellPainter extends CellPainter {
    override paint(gc: CanvasRenderingContext2DEx, config: CellPaintConfig) {
        const val = config.value as string;
        const bounds = config.bounds;
        const x = bounds.x + 1;
        const y = bounds.y + 1;
        const width = bounds.width - 2;
        const height = bounds.height - 2;
        const radius = height / 2;
        const arcGradient = gc.createLinearGradient(x, y, x, y + height);

        if (config.mouseDown) {
            arcGradient.addColorStop(0, '#B5CBED');
            arcGradient.addColorStop(1, '#4d74ea');
        } else {
            arcGradient.addColorStop(0, '#ffffff');
            arcGradient.addColorStop(1, '#aaaaaa');
        }

        // draw the background
        gc.cache.fillStyle = config.backgroundColor;
        gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // draw the capsule
        gc.cache.fillStyle = arcGradient;
        gc.cache.strokeStyle = '#000000';
        this.roundRect(gc, x, y, width, height, radius, arcGradient !== undefined, true);

        const ox = (width - gc.getTextWidth(val)) / 2;
        const oy = (height - gc.getTextHeight(gc.cache.font).descent) / 2;

        // draw the text
        gc.cache.textBaseline = 'middle';
        gc.cache.fillStyle = '#333333';
        gc.cache.font = height - 2 + 'px sans-serif';
        config.backgroundColor = 'rgba(0,0,0,0)'; // Not sure about this
        gc.fillText(val, x + ox, y + oy);
    }
}

export namespace ButtonCellPainter {
    export const typeName = 'Button';
}
