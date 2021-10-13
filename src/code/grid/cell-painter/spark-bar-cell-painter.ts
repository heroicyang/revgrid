
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPainter } from './cell-painter';

/**
 * Renders a bar chart sparkline, hence the name.
 */
export class SparkBarCellPainter extends CellPainter {
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
            gc.cache.fillStyle = config.isSelected ? 'blue' : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.cache.fillStyle = fgColor;
        for (let i = 0; i < val.length; i++) {
            const barheight = val[i] / 110 * height;
            gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
            x += eWidth;
        }
        gc.closePath();
        config.minWidth = count * 10;
    }
}

export namespace SparkBarCellPainter {
    export const typeName = 'SparkBar';
}
