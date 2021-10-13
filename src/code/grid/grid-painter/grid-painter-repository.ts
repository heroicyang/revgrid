
import { Registry } from '../lib/registry';
import { Renderer } from '../renderer/renderer';
import { AsNeededGridPainter } from './as-needed-grid-painter';
import { ByColumnsAndRowsGridPainter } from './by-columns-and-rows-grid-painter';
import { ByColumnsDiscreteGridPainter } from './by-columns-discrete-grid-painter';
import { ByColumnsGridPainter } from './by-columns-grid-painter';
import { ByRowsGridPainter } from './by-rows-grid-painter';
import { GridPainter } from './grid-painter';

export class GridPainterRepository {
    private constructorRegistry = new Registry<GridPainter.Constructor>();
    private cache = new Map<string, GridPainter>();

    constructor() {
        // preregister the standard grid painters
        this.constructorRegistry.register(AsNeededGridPainter.key, AsNeededGridPainter);
        this.constructorRegistry.register(ByColumnsGridPainter.key, ByColumnsGridPainter);
        this.constructorRegistry.register(ByColumnsDiscreteGridPainter.key, ByColumnsDiscreteGridPainter);
        this.constructorRegistry.register(ByColumnsAndRowsGridPainter.key, ByColumnsAndRowsGridPainter);
        this.constructorRegistry.register(ByRowsGridPainter.key, ByRowsGridPainter);
    }

    get(renderer: Renderer, key: string) {
        let gridPainter = this.cache.get(key);
        if (gridPainter === undefined) {
            const constructor = this.constructorRegistry.get(key);
            gridPainter = new constructor(renderer);
            this.cache.set(key, gridPainter);
        }
        return gridPainter;
    }

    allCreatedEntries() {
        return this.cache.entries();
    }

    allCreated() {
        return this.cache.values();
    }

    register(key: string, constructor: GridPainter.Constructor) {
        this.constructorRegistry.register(key, constructor);
    }
}
