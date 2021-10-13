
import { Registry } from '../lib/registry';
import { ButtonCellPainter } from './button-cell-painter';
import { CellPainter } from './cell-painter';
import { ErrorCellPainter } from './error-cell-painter';
import { LastSelectionCellPainter } from './last-selection-cell-painter';
import { SimpleCellPainter } from './simple-cell-cell-painter';
import { SliderCellPainter } from './slider-cell-painter';
import { SparkBarCellPainter } from './spark-bar-cell-painter';
import { SparkLineCellPainter } from './spark-line-cell-painter';
import { TagCellPainter } from './tag-cell-painter';

/**
 * @classdesc Registry of cell renderer singletons.
 */
export class CellPainterRepository {
    private constructorRegistry = new Registry<CellPainter.Constructor>();
    private cache = new Map<string, CellPainter>();
    private cachedErrorCellPainter: ErrorCellPainter;
    private cachedLastSelectionCellPainter: LastSelectionCellPainter;

    get errorCellPainter() {
        if (this.cachedErrorCellPainter === undefined) {
            this.cachedErrorCellPainter = this.get(ErrorCellPainter.typeName) as ErrorCellPainter;
        }
        return this.cachedErrorCellPainter;
    }

    get lastSelectionCellPainter() {
        if (this.cachedLastSelectionCellPainter === undefined) {
            this.cachedLastSelectionCellPainter = this.get(LastSelectionCellPainter.typeName) as LastSelectionCellPainter;
        }
        return this.cachedLastSelectionCellPainter;
    }

    constructor() {
        // preregister the standard cell renderers
        this.constructorRegistry.register(ButtonCellPainter.typeName, ButtonCellPainter);
        this.constructorRegistry.register(SimpleCellPainter.typeName, SimpleCellPainter);
        this.constructorRegistry.register(SliderCellPainter.typeName, SliderCellPainter);
        this.constructorRegistry.register(SparkBarCellPainter.typeName, SparkBarCellPainter);
        this.constructorRegistry.register(LastSelectionCellPainter.typeName, LastSelectionCellPainter);
        this.constructorRegistry.register(SparkLineCellPainter.typeName, SparkLineCellPainter);
        this.constructorRegistry.register(ErrorCellPainter.typeName, ErrorCellPainter);
        this.constructorRegistry.register(TagCellPainter.typeName, TagCellPainter);
    }

    // // for better performance, instantiate at add time rather than render time.
    // add(name, Constructor) {
    //     if (arguments.length === 1) {
    //         Constructor = name;
    //         return Registry.prototype.add.call(this, new Constructor);
    //     } else {
    //         return Registry.prototype.add.call(this, name, new Constructor);
    //     }
    // }

    get(name: string) {
        let cellPainter = this.cache.get(name);
        if (cellPainter === undefined) {
            const constructor = this.constructorRegistry.get(name);
            cellPainter = new constructor();
            this.cache.set(name, cellPainter);
        }
        return cellPainter;
    }

    register(typeName: string, constructor: CellPainter.Constructor) {
        this.constructorRegistry.register(typeName, constructor);
    }
}
