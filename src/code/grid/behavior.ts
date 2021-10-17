import { CellEvent } from './cell/cell-event';
import { RenderedCell } from './cell/rendered-cell';
import { GridProperties } from './grid-properties';
import { assignOrDelete } from './lib/utils';
import { MetaModel } from './model/meta-model';
import { SchemaModel } from './model/schema-model';
import { Revgrid } from './revgrid';
import { Subgrid } from './subgrid';

const noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
];

/**
 * @mixes cellProperties.behaviorMixin
 * @mixes rowProperties.mixin
 * @mixes subgrids.mixin
 * @mixes dataModel.mixin
 * @constructor
 * @desc A controller for the data model.
 * > This constructor (actually `initialize`) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @param {Revgrid} grid
 * @param {object} [options] - _(Passed to {@link Behavior#reset reset})._
 * @param {DataModel} [options.dataModel] - _Per {@link Behavior#reset reset}._
 * @param {object} [options.metadata] - _Per {@link Behavior#reset reset}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Per {@link Behavior#reset reset}._
 * @param {function|object[]} [options.data] - _Per {@link Behavior#setData setData}._
 * @param {function|menuItem[]} [options.schema] - _Per {@link Behavior#setData setData}._
 * @param {subgridSpec[]} [options.subgrids=this.grid.properties.subgrids] - _Per {@link Behavior#setData setData}._
 * @param {boolean} [options.apply=true] - _Per {@link Behavior#setData setData}._
 * @abstract
 */
export class Behavior {
    /** @internal */
    private _scrollPositionY: number;
    /** @internal */
    private _rowPropertiesPrototype: MetaModel.RowPropertiesPrototype;

    // Start RowProperties Mixin
    /** @internal */
    // private _height: number;
    // defaultRowHeight: number;
    // End RowProperties Mixin

    // Start DataModel Mixin
    // allColumns: Behavior.ColumnArray;
    // End DataModel Mixin

    // Start RowProperties Mixin
    // get height() {
    //     return this._height || this.defaultRowHeight;
    // }
    // set height(height: number) {
    //     height = Math.max(5, Math.ceil(height));
    //     if (isNaN(height)) {
    //         height = undefined;
    //     }
    //     if (height !== this._height) {
    //         this._height = height; // previously set as not enumerable
    //         this.grid.behaviorStateChanged();
    //     }
    // }
    // End RowProperties Mixin

    constructor(
        /** @internal */
        readonly grid: Revgrid
    ) { }

    // features: []; // override in implementing class; or provide feature names in grid.properties.features; else no features

    /**
     * Reset the behavior.
     * @param {object} [options] - _Same as constructor's `options`._<br>
     * _Passed to {@link Behavior#resetDataModel resetDataModel} and {@link Behavior#setData setData} (both of which see)._
     * @internal
     */
    reset() {
        // this.checkLoadDataModelMetadata(options);
        // const dataModelChanged = this.resetMainDataModel(options);

        this._scrollPositionY = 0;

        this._rowPropertiesPrototype = DefaultRowProperties;


        // /**
        //  * Ordered list of subgrids to render.
        //  * @type {subgridSpec[]}
        //  */
        // if (options !== undefined && options.subgrids !== undefined && options.subgrids.length > 0) {
        //     this.setSubgrids(options.subgrids);
        // } else {
        //     if (!dataModelChanged && this.subgrids) {
        //         // do nothing and keep existing
        //     } else {
        //         const gridPropertiesSubgrids = this.grid.properties.subgrids;
        //         if (gridPropertiesSubgrids !== undefined && gridPropertiesSubgrids.length > 0) {
        //             this.setSubgrids(gridPropertiesSubgrids);
        //         } else {
        //             this.setSubgrids([Subgrid.RoleEnum.main]);
        //         }
        //     }
        // }
    }

    /**
     * @description Set the header labels.
     * @param headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    // setHeaders(headers: string[] | Record<string, string>) {
    //     if (headers instanceof Array) {
    //         // Reset all headers
    //         const allColumns = this._allColumns;
    //         headers.forEach((header, index) => {
    //             allColumns[index].header = header; // setter updates header in both column and data source objects
    //         });
    //     } else if (typeof headers === 'object') {
    //         // Adjust just the headers in the hash
    //         this._allColumns.forEach((column) => {
    //             if (headers[column.name]) {
    //                 column.header = headers[column.name];
    //             }
    //         });
    //     }
    // }

    get renderedColumnCount() {
        return this.grid.renderer.visibleColumns.length;
    }

    get renderedRowCount() {
        return this.grid.renderer.visibleRows.length;
    }

    /**
     * @desc utility function to empty an object of its members
     * @param obj - the object to empty
     * @param exportProps
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
     * @internal
     */
    clearObjectProperties(obj: Record<string, unknown>, exportProps?: boolean) {
        for (const key in obj) {
            if (
                obj.hasOwnProperty(key) && (
                    exportProps === undefined ||
                    !exportProps && noExportProperties.indexOf(key) >= 0 ||
                    exportProps && noExportProperties.indexOf(key) < 0
                )
            ) {
                delete obj[key];
            }
        }
    }

    //this is effectively a clone, with certain things removed....
    /** @internal */
    getState() {
        // copy.columnProperties does not exist. Not sure what this is doing.
        const copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    }

    /**
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param properties - assignable grid properties
     */
    setState(properties: Record<string, unknown>) {
        this.addState(properties, true);
    }

    /**
     * @param properties - assignable grid properties
     * @param settingState - Clear properties object before assignments.
     */
    addState(properties: Record<string, unknown>, settingState: boolean) {
        if (settingState) {
            // clear all table state
            this.grid.properties.loadDefaults();
            this.grid.createColumns();
        }

        const gridProps = this.grid.properties as GridProperties; // this may not work

        gridProps.settingState = settingState;
        assignOrDelete(gridProps, properties);
        delete gridProps.settingState;

        this.grid.reindex();
    }

    /**
     * @desc fetch the value for a property key
     * @returns The value of the given property.
     * @param key - a property name
     */
    // resolveProperty(key) {
    //     // todo: remove when we remove the deprecated grid.resolveProperty
    //     return this.grid.resolveProperty(key);
    // }

    /**
     * @desc a dnd column has just been dropped, we've been notified
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    endDragColumnNotification() {

    }

    /**
     * @return the cursor at a specific x,y coordinate
     * @param x - the x coordinate
     * @param y - the y coordinate
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCursorAt(x: number, y: number) {
        return null;
    }

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @desc Quietly set the horizontal scroll position.
     * @param x - The new position in pixels.
     */
    // setScrollPositionX(x: number) {
    //     this.scrollPositionX = x;
    // }

    /**
     * @desc Quietly set the vertical scroll position.
     * @param y - The new position in pixels.
     */
    setScrollPositionY(y: number) {
        this._scrollPositionY = y;
    }

    getScrollPositionY() {
        return this._scrollPositionY;
    }

    /**
     * @return The cell editor for the cell at the given coordinates.
     * @param editPoint - The grid cell coordinates.
     * @internal
     */
    getCellEditorAt(event: CellEvent) {
        return event.isDataColumn && event.column.getCellEditorAt(event);
    }

    /**
     * @return `true` if we should highlight on hover
     * @param isColumnHovered - the column is hovered or not
     * @param isRowHovered - the row is hovered or not
     */
    highlightCellOnHover(isColumnHovered: boolean, isRowHovered: boolean): boolean {
        return isColumnHovered && isRowHovered;
    }

    // getSelectionMatrixFunction(selectedRows) {
    //     return function() {
    //         return null;
    //     };
    // }

    // Start RowProperties Mixin

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param rowPropertiesPrototype - Prototype for a new properties object when one does not already exist. If you don't define this and one does not already exist, this call will return `undefined`.
     * Typical defined value is `null`, which creates a plain object with no prototype, or `Object.prototype` for a more "natural" object.
     * _(Required when 3rd param provided.)_
     * @param subgrid- This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     * @returns The row properties object which will be one of:
     * * object - existing row properties object or new row properties object created from `prototype`; else
     * * `false` - row found but no existing row properties object and `prototype` was not defined; else
     * * `undefined` - no such row or DataModel does not support row properties
     */
    getRowPropertiesUsingCellEvent(cellInfo: RenderedCell, rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype): MetaModel.RowProperties | false | undefined {
        return this.getRowProperties(cellInfo.dataCell.y, rowPropertiesPrototype, cellInfo.subgrid);
    }
    // getRowProperties(yOrCellEvent: number | CellEvent,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;
    // getRowProperties(y: number,
    //     rowPropertiesPrototype?: DataModel.RowPropertiesPrototype,
    //     subgrid?: Subgrid): DataModel.RowProperties | false | undefined;
    getRowProperties(y: number,
        rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype,
        subgrid?: Subgrid): MetaModel.RowProperties | false | undefined {

        // if (typeof yOrCellEvent === 'object') {
        //     subgrid = yOrCellEvent.subgrid;
        //     yOrCellEvent = yOrCellEvent.dataCell.y;
        // }

        subgrid ??= this.grid.mainSubgrid;
        const rowMetadataPrototype: MetaModel.RowMetadataPrototype = rowPropertiesPrototype === undefined ? undefined : null;
        const metadata = subgrid.getRowMetadata(y, rowMetadataPrototype);
        return metadata && (metadata.__ROW ?? (rowPropertiesPrototype !== undefined && (metadata.__ROW = Object.create(rowPropertiesPrototype))));
    }

    /**
     * Reset the row properties in its entirety to the given row properties object.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - The new row properties object. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */
    setRowPropertiesUsingCellEvent(cellInfo: RenderedCell, properties: MetaModel.RowProperties | undefined) {
        // Do we need this?
        // if (subgrid === undefined) {
        //     subgrid = this.mainSubgrid;
        // }

        this.setRowProperties(cellInfo.dataCell.y, properties, cellInfo.subgrid)
    }
    setRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid): void {
        if (!properties) {
            return;
        }

        const metadata = subgrid.getRowMetadata(y, null);
        if (metadata) {
            metadata.__ROW = Object.create(this._rowPropertiesPrototype);
            this.addRowProperties(y, properties, subgrid, metadata.__ROW);
            this.grid.behaviorStateChanged();
        }
    }

    /**
     * Sets a single row property on a specific individual row.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param key - The property name.
     * @param value - The new property value.
     * @param dataModel - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    setRowPropertyUsingCellEvent(cellEvent: CellEvent, key: string, value: unknown) {
        this.setRowProperty(cellEvent.dataCell.y, key, value, cellEvent.subgrid);
    }

    setRowProperty(y: number, key: string, value: unknown, subgrid?: Subgrid) {
        let rowProps: MetaModel.RowProperties | false | undefined;
        const isHeight = (key === 'height');

        if (value !== undefined) {
            rowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
            if (rowProps) {
                rowProps[key] = value;
            }
        } else {
            // only try to undefine key if row props object exists; no point in creating it just to delete a non-existant key
            rowProps = this.getRowProperties(y, undefined, subgrid);
            if (rowProps) {
                delete rowProps[isHeight ? '_height' : key];
            }
        }

        if (isHeight) {
            this.grid.behaviorShapeChanged();
        } else {
            this.grid.behaviorStateChanged();
        }
    }

    addRowPropertiesUsingCellEvent(cellEvent: CellEvent, properties: MetaModel.RowProperties | undefined, rowProps?: MetaModel.RowProperties) {
        this.addRowProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid, rowProps);
    }

    /**
     * Add all the properties in the given row properties object to the row properties.
     * @param yOrCellEvent - Data row index local to `dataModel`; or a `CellEvent` object.
     * @param properties - An object containing new property values(s) to assign to the row properties. If `undefined`, this call is a no-op.
     * @param subgrid - This is the subgrid. You only need to provide the subgrid when it is not the data subgrid _and_ you did not give a `CellEvent` object in the first param (which already knows what subgrid it's in).
     */

    addRowProperties(y: number, properties: MetaModel.RowProperties | undefined, subgrid: Subgrid, rowProps?: MetaModel.RowProperties | false) {
        if (!properties) {
            return;
        }

        let isHeight: boolean;
        let hasHeight: boolean;

        let resolvedRowProps: MetaModel.RowProperties | false | undefined;
        if (rowProps) {
            resolvedRowProps = rowProps;
        } else {
            resolvedRowProps = this.getRowProperties(y, this._rowPropertiesPrototype, subgrid);
        }

        if (rowProps) {
            Object.keys(properties).forEach(function(key) {
                const value = properties[key];
                if (value !== undefined) {
                    resolvedRowProps[key] = value;
                } else {
                    isHeight = key === 'height';
                    delete resolvedRowProps[isHeight ? '_height' : key];
                    hasHeight = hasHeight || isHeight;
                }
            });

            if (hasHeight) {
                this.grid.behaviorShapeChanged();
            } else {
                this.grid.behaviorStateChanged();
            }
        }
    }

    /**
     * @param yOrCellEvent - Data row index local to `dataModel`.
     * @returns The row height in pixels.
     */
    getRowHeight(y: number, subgrid?: Subgrid) {
        const rowProps = this.getRowProperties(y, undefined, subgrid);
        return rowProps && rowProps.height || this.grid.properties.defaultRowHeight;
    }

    /**
     * @desc set the pixel height of a specific row
     * @param yOrCellEvent - Data row index local to dataModel.
     * @param height - pixel height
     */
    setRowHeight(yOrCellEvent: number, height: number, subgrid?: Subgrid) {
        this.setRowProperty(yOrCellEvent, 'height', height, subgrid);
    }
    // End RowProperties Mixin


    // Start DataModel Mixin
    // getSchema() {
    //     return this.schemaModel;
    // }

    // setSchema(newSchema) {
    //     this.mainDataModel.setSchema(newSchema);
    // }

    /**
     * @summary Get the value at cell (x,y).
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal grid coordinate
     * @param y - The vertical coordinate.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     * @returns The raw cell data.
     */
    getValue(schemaColumn: SchemaModel.Column, x: number, y: number, subgrid?: Subgrid) {
        if (subgrid !== undefined) {
            return subgrid.dataModel.getValue(schemaColumn, y);
        } else {
            const cellEvent = new CellEvent(this.grid);
            const visible = cellEvent.resetDataXY(x, y, subgrid);
            if (visible) {
                return cellEvent.value;
            }
        }
    }

    /**
     * @summary Update the value at cell (x,y) with the given value.
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     * @param value - New cell data.
     * @param subgrid - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     */
    setValue(schemaColumn: SchemaModel.Column, x: number, y: number, value: unknown, subgrid?: Subgrid) {
        if (subgrid !== undefined) {
            subgrid.dataModel.setValue(schemaColumn, y, value);
        } else {
            const cellEvent = new CellEvent(this.grid);
            const visible = cellEvent.resetDataXY(x, y, subgrid);
            if (visible) {
                cellEvent.value = value;
            }
        }
    }

    // End DataModel Mixin

    // Begin Local

    // protected abstract readonly schema: ColumnSchema[];
    // protected abstract createDataRowProxy(): void;
    // protected abstract resetMainDataModel(options?: Hypergrid.Options): boolean;
    // abstract charMap: DataModel.DrillDownCharMap;
    // abstract cellClicked(event: CellEvent): boolean | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // hasTreeColumn(columnIndex?: number) {
    //     return false;
    // }
    // abstract createLocalDataModel(subgridRole: Subgrid.Role): DataModel;
    // boundDispatchEvent: DataModel.EventListener;

    /**
     * @summary Attach a data model object to the grid.
     * @desc Installs data model events, fallbacks, and hooks.
     *
     * Called from {@link Behavior#reset}.
     * @param options
     * @param options.dataModel - A fully instantiated data model object.
     * @param options.dataModelConstructorOrArray - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param options.metadata - Passed to {@link DataModel#setMetadataStore setMetadataStore}.
     * @returns `true` if the data model has changed.
     */
    // private resetMainDataModel(options?: Hypergrid.Options) {
    //     const newDataModel = this.getNewMainDataModel(options);
    //     const changed = newDataModel !== undefined && newDataModel !== this.mainDataModel;

    //     if (changed) {
    //         this.mainDataModel = newDataModel;
    //         this.mainSubgrid = this.createSubgrid(newDataModel, Subgrid.RoleEnum.main);
    //         // decorators.addDeprecationWarnings.call(this);
    //         // decorators.addFriendlierDrillDownMapKeys.call(this);
    //         this.checkLoadDataModelMetadata(newDataModel, options?.metadata);
    //     }

    //     return changed;
    // }

    // private checkLoadDataModelMetadata(options: Hypergrid.Options | undefined) {
    //     const metadata = options?.metadata
    //     if (metadata !== undefined) {
    //         if (this.mainDataModel.setMetadataStore) {
    //             this.mainDataModel.setMetadataStore(metadata);
    //         } else {
    //             throw new HypergridError('Metadata specified in options but no DataModel does not support setMetadataStore');
    //         }
    //     }
    // }

    /**
     * Create a new data model
     * @param options.dataModel - A fully instantiated data model object.
     */
    // private getNewMainDataModel(options?: Hypergrid.Options) {
    //     let dataModel: DataModel;

    //     options = options ?? {};

    //     if (options.dataModel !== undefined) {
    //         dataModel = options.dataModel;
    //     } else {
    //         const dataModelConstructorOrArray = options.dataModelConstructorOrArray;
    //         if (dataModelConstructorOrArray !== undefined) {
    //             dataModel = this.createLocalDataModel(Subgrid.RoleEnum.main);
    //             this.checkLoadDataModelMetadata(dataModel);
    //         } else {
    //             if (!Array.isArray(dataModelConstructorOrArray)) {
    //                 dataModel = new dataModelConstructorOrArray();
    //             } else {
    //                 if (dataModelConstructorOrArray.length === 0) {
    //                     dataModel = new LocalMainDataModel();
    //                 } else {
    //                     dataModelConstructorOrArray.forEach((constructor) => {
    //                         dataModel = new constructor(dataModel);
    //                     });
    //                 }
    //             }
    //         }
    //     }

    //     return dataModel;
    // }

    // End Local
}


// function warnBehaviorFeaturesDeprecation() {
//     var featureNames = [], unregisteredFeatures = [], n = 0;

//     this.features.forEach(function(FeatureConstructor) {
//         var className = FeatureConstructor.prototype.$$CLASS_NAME || FeatureConstructor.name,
//             featureName = className || 'feature' + n++;

//         // build list of feature names
//         featureNames.push(featureName);

//         // build list of unregistered features
//         if (!this.featureRegistry.get(featureName, true)) {
//             var constructorName = FeatureConstructor.name || FeatureConstructor.prototype.$$CLASS_NAME || 'FeatureConstructor' + n,
//                 params = [];
//             if (!className) {
//                 params.push('\'' + featureName + '\'');
//             }
//             params.push(constructorName);
//             unregisteredFeatures.push(params.join(', '));
//         }
//     }, this);

//     if (featureNames.length) {
//         var sampleCode = 'Hypergrid.defaults.features = [\n' + join('\t\'', featureNames, '\',\n') + '];';

//         if (unregisteredFeatures.length) {
//             sampleCode += '\n\nThe following custom features are unregistered and will need to be registered prior to behavior instantiation:\n\n' +
//                 join('Features.add(', unregisteredFeatures, ');\n');
//         }

//         if (n) {
//             sampleCode += '\n\n(You should provide meaningful names for your custom features rather than the generated names above.)';
//         }

//         console.warn('`grid.behavior.features` (array of feature constructors) has been deprecated as of version 2.1.0 in favor of `grid.properties.features` (array of feature names). Remove `features` array from your behavior and add `features` property to your grid state object (or Hypergrid.defaults), e.g.:\n\n' + sampleCode);
//     }


// }

// function join(prefix, array, suffix) {
//     return prefix + array.join(suffix + prefix) + suffix;
// }


export namespace Behavior {
}

// Begin RowProperties Mixin

export class DefaultRowProperties implements MetaModel.RowProperties {
    private _height: number | undefined;

    constructor(private grid: Revgrid) {

    }
    get height() {
        return this._height || this.grid.properties.defaultRowHeight;
    }

    set height(height) {
        height = Math.max(5, Math.ceil(height));
        if (isNaN(height)) {
            height = undefined;
        }
        if (height !== this._height) {
            if (!height) {
                delete this._height;
            } else {
                // Define `_height` as non-enumerable so won't be included in output of saveState.
                // (Instead the `height` getter is explicitly invoked and the result is included.)
                Object.defineProperty(this, '_height', { value: height, configurable: true });
            }
            this.grid.behaviorStateChanged();
        }
    }
}

// End RowProperties Mixin
