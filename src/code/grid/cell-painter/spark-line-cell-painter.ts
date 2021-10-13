
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPainter } from './cell-painter';

/**
 * Renders a sparkline.
 * {@link http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR|Edward Tufte sparkline}
 */
export class SparkLineCellPainter extends CellPainter {
    override paint(gc: CanvasRenderingContext2DEx, config: CellPaintConfig) {
        let x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;

        gc.beginPath();
        const val = config.value as number[];
        if (!val || !val.length) {
            return;
        }
        const count = val.length;
        const eWidth = width / count;

        const fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? config.backgroundSelectionColor : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.cache.strokeStyle = fgColor;
        gc.cache.fillStyle = fgColor;
        gc.beginPath();
        let prev: number;
        for (let i = 0; i < val.length; i++) {
            const barheight = val[i] / 110 * height;
            if (!prev) {
                prev = barheight;
            }
            gc.lineTo(x + 5, y + height - barheight);
            gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
            x += eWidth;
        }
        config.minWidth = count * 10;
        gc.stroke();
        gc.closePath();
    }
}

export namespace SparkLineCellPainter {
    export const typeName = 'SparkLine';
}
