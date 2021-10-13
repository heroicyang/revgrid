
import { CellClickFeature } from '../feature/cell-click-feature';
import { CellEditingFeature } from '../feature/cell-editing';
import { CellSelection } from '../feature/cell-selection';
import { ColumnMoving } from '../feature/column-moving';
import { ColumnResizing } from '../feature/column-resizing';
import { ColumnSelection } from '../feature/column-selection';
import { ColumnSorting } from '../feature/column-sorting';
import { Filters } from '../feature/filters';
import { KeyPaging } from '../feature/key-paging';
import { OnHover } from '../feature/on-hover';
import { RowResizing } from '../feature/row-resizing'; // should this be commented out?
import { RowSelection } from '../feature/row-selection';
import { ThumbwheelScrolling } from '../feature/thumbwheel-scrolling';
import { TouchScrolling } from '../feature/touch-scrolling';
import { Registry } from '../lib/registry';
import { Revgrid } from '../revgrid';
import { Feature } from './feature';



/**
 * @classdesc Registry of feature constructors.
 */
class FeatureFactory {
    private _registry = new Registry<Feature.Constructor>();

    constructor() {
        this.register(CellClickFeature.typeName, CellClickFeature);
        this.register(CellEditingFeature.typeName, CellEditingFeature);
        this.register(CellSelection.typeName, CellSelection);
        this.register(ColumnMoving.typeName, ColumnMoving);
        this.register(ColumnResizing.typeName, ColumnResizing);
        this.register(ColumnSelection.typeName, ColumnSelection);
        this.register(ColumnSorting.typeName, ColumnSorting);
        this.register(Filters.typeName, Filters);
        this.register(KeyPaging.typeName, KeyPaging);
        this.register(OnHover.typeName, OnHover);
        this.register(RowResizing.typeName, RowResizing);
        this.register(RowSelection.typeName, RowSelection);
        this.register(ThumbwheelScrolling.typeName, ThumbwheelScrolling);
        this.register(TouchScrolling.typeName, TouchScrolling);
    }

    register(name: string, constructor: Feature.Constructor) {
        this._registry.register(name, constructor);
    }

    create(name: string, grid: Revgrid) {
        const constructor = this._registry.get(name);
        if (constructor === undefined) {
            return undefined;
        } else {
            return new constructor(grid);
        }
    }
}

export const featureFactory = new FeatureFactory();
