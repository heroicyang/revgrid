import { CellEvent } from '../cell/cell-event';
import { CellProperties } from '../cell/cell-properties';
import { CellPropertiesAccessor } from '../cell/cell-properties-accessor';
import { AssertError } from '../lib/revgrid-error';
import { assignOrDelete } from '../lib/utils';
import { DataModel } from '../model/data-model';
import { MetaModel } from '../model/meta-model';
import { SchemaModel } from '../model/schema-model';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid';
import { ColumnProperties } from './column-properties';

/** @public */
export class Column {
    readonly grid: Revgrid;
    readonly dataModel: DataModel;
    readonly schemaColumn: SchemaModel.Column;
    readonly index: number; // always the same as SchemaColumn index
    readonly name: string;

    /** @internal */
    private _properties: ColumnProperties;

    /** @summary Create a new `Column` object.
     * @param columnSchema.header - Displayed in column headers. If not defined, name is used.
     * @param columnSchema.calculator - Define to make a computed column.
     * @param columnSchema.type - For possible data model use. (Not used in core.)
     */
    /** @internal */
    constructor(grid: Revgrid, schemaColumn: SchemaModel.Column) {
        this.grid = grid;
        this.dataModel = grid.mainDataModel;
        this.index = schemaColumn.index;
        this.name = schemaColumn.name

        // this.properties = columnSchema; // see {@link Column#properties properties} setter
        this._properties = new this.grid.columnPropertiesConstructor(grid.properties, this); // see {@link Column#properties properties} setter
        this.schemaColumn = schemaColumn;
    }

    // mixIn: overrider.mixIn,

    /**
     * @summary Get or set the text of the column's header.
     * @desc The _header_ is the label at the top of the column.
     *
     * Setting the header updates both:
     * * the `schema` (aka, header) array in the underlying data source; and
     * * the filter.
     * @type {string}
     */
    // set header(header: string) {
    //     this.schemaColumn.header = header;
    // }
    // get header() {
    //     return this.schemaColumn.header;
    // }

    /**
     * @summary Get or set the computed column's calculator function.
     * @desc Setting the value here updates the calculator in the data model schema.
     *
     * The results of the new calculations will appear in the column cells on the next repaint.
     * @type {string}
     */
    set calculator(calculator: SchemaModel.Column.Calculator) {
        calculator = this.resolveCalculator(calculator);
        if (calculator !== this.schemaColumn.calculator) {
            this.schemaColumn.calculator = calculator;
            this.grid.reindex();
        }
    }
    get calculator() {
        return this.schemaColumn.calculator;
    }

    /**
     * @summary Get or set the type of the column's header.
     * @desc Setting the type updates the filter which typically uses this information for proper collation.
     *
     * @todo: Instead of using `this._type`, put on data source like the other essential properties. In this case, sorter could use the info to choose a comparator more intelligently and efficiently.
     * @type {string}
     */
    set type(type) {
        this.schemaColumn.type = type;
        this.grid.reindex();
    }
    get type() {
        return this.schemaColumn.type;
    }

    getValue(y: number) {
        return this.dataModel.getValue(this.schemaColumn, y/*, dataModel*/);
    }

    /**
     * @this ColumnType
     */
    setValue(y: number, value: unknown) {
        return this.dataModel.setValue(this.schemaColumn, y, value/*, dataModel*/);
    }

    getWidth() {
        return this.properties.width || this.grid.properties.defaultColumnWidth;
    }

    setWidth(width: number) {
        width = Math.min(Math.max(this.properties.minimumColumnWidth, width), this.properties.maximumColumnWidth || Infinity);
        if (width === this.properties.width) {
            return false;
        } else {
            this.properties.width = width;
            this.properties.columnAutosizing = false;
            return true;
        }
    }

    checkColumnAutosizing(force?: boolean) {
        const properties = this.properties;
        let autoSized: boolean;

        if (properties.columnAutosizing) {
            const width = properties.width;
            const preferredWidth = properties.preferredWidth ?? width;
            force = force || !properties.columnAutosized;
            if (width !== preferredWidth || force && preferredWidth !== undefined) {
                properties.width = force ? preferredWidth : Math.max(width, preferredWidth);
                if (properties.columnAutosizingMax && properties.width > properties.columnAutosizingMax) {
                    properties.width = properties.columnAutosizingMax;
                }
                properties.columnAutosized = !isNaN(properties.width);
                autoSized = properties.width !== width;
            }
        } else {
            autoSized = false;
        }

        return autoSized;
    }

    getCellType(y: number) {
        const value = this.getValue(y);
        return this.typeOf(value);
    }

    getType() {
        const props = this.properties;
        let type = props.type;
        if (!type) {
            type = this.computeColumnType();
            if (type !== 'unknown') {
                props.type = type;
            }
        }
        return type;
    }

    /** @internal */
    computeColumnType() {
        const headerRowCount = this.grid.getHeaderRowCount();
        const height = this.grid.getRowCount();
        let value = this.getValue(headerRowCount);
        let eachType = this.typeOf(value);
        if (!eachType) {
            return 'unknown';
        }
        const type = this.typeOf(value);
        //var isNumber = ((typeof value) === 'number');
        for (let y = headerRowCount; y < height; y++) {
            value = this.getValue(y);
            eachType = this.typeOf(value);
            // if (type !== eachType) {
            //     if (isNumber && (typeof value === 'number')) {
            //         type = 'float';
            //     } else {
            //         return 'mixed';
            //     }
            // }
        }
        return type;
    }

    typeOf(something: unknown) {
        if (something == null) {
            return null;
        }
        switch (typeof something) {
            case 'object':
                return something.constructor.name.toLowerCase();
            case 'number':
                return parseInt(something.toString()) === something ? 'int' : 'float';
            default:
                return typeof something;
        }
    }

    get properties() {
        return this._properties;
    }
    // set properties(properties) {
    //     this.addProperties(properties, true);
    // }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param properties - A simple properties hash.
     */
    addProperties(properties: Partial<ColumnProperties>) {
        this._properties.merge(properties);
    }


    /**
     * Copy a properties collection to this column's properties object.
     *
     * When a value is `undefined` or `null`, the property is deleted except when a setter or non-configurable in which case it's set to `undefined`.
     * @param properties - Properties to copy to column's properties object. If `undefined`, this call is a no-op.
     * @param settingState - Clear column's properties object before copying properties.
     */
    /** This method is provided because some grid renderer optimizations require that the grid renderer be informed when column colors change. Due to performance concerns, they cannot take the time to figure it out for themselves. Along the same lines, making the property a getter/setter (in columnProperties.js), though doable, might present performance concerns as this property is possibly the most accessed of all column properties.
     * @param color
     */
    /** @internal */
    setBackgroundColor(color) {
        if (this.properties.backgroundColor !== color) {
            this.properties.backgroundColor = color;
            this.grid.renderer.rebundleGridRenderers();
        }
    }

    /**
     * @summary Get a new cell editor.
     * @desc The cell editor to use must be registered with the key in the cell's `editor` property.
     *
     * The cell's `format` property is mixed into the provided cellEvent for possible overriding by developer's override of {@link DataModel.prototype.getCellEditorAt} before being used by {@link CellEditor} to parse and format the cell value.
     *
     * @returns Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return from `fireRequestCellEdit`.
     */
    /** @internal */
    getCellEditorAt(cellEvent: CellEvent) {
        const columnIndex = this.index;
        const rowIndex = cellEvent.gridCell.y;
        const editorName = cellEvent.columnProperties.editor;

        // I do not think this is needed
        // const options = Object.create(cellEvent, {
        //         format: {
        //             // `options.format` is a copy of the cell's `format` property which is:
        //             // 1. Subject to adjustment by the `getCellEditorAt` override.
        //             // 2. Then used by the cell editor to reference the registered localizer (defaults to 'string' localizer)
        //             writable: true,
        //             enumerable: true, // so cell editor will copy it to self
        //             value: cellEvent.columnProperties.format
        //         }
        //     });

        if (editorName === undefined) {
            return undefined;
        } else {
            const cellEditor = cellEvent.subgrid.getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);

            if (cellEditor && !cellEditor.grid) {
                // cell editor returned but not fully instantiated (aborted by falsy return from fireRequestCellEdit)
                return undefined;
            } else {
                return cellEditor;
            }
        }
    }

    /** @internal */
    getFormatter() {
        const localizerName = this.properties.format;
        return this.grid.localization.get(localizerName).format;
    }

    // Begin CellProperties Mixin

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found; else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Column#getCellProperty} instead (which calls this method).
     * @param rowIndex - Data row coordinate.
     * @return The properties of the cell at x,y in the grid.
     */
    /** @internal */
    getCellProperties(rowIndex: number, subgrid: Subgrid): CellProperties {
        const cellOwnProperties = this.getCellOwnProperties(rowIndex, subgrid);
        return new CellPropertiesAccessor(cellOwnProperties, this._properties);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns New cell properties object, based on column properties object, with `properties` copied to it.
     */
    /** @internal */
    setCellProperties(rowIndex: number, properties: MetaModel.CellOwnProperties | undefined, subgrid: Subgrid): MetaModel.CellOwnProperties | undefined {
        if (properties) {
            return Object.assign(this.newCellOwnPropertiesObject(rowIndex, subgrid), properties);
        } else {
            return undefined;
        }
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @param properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    addCellProperties(rowIndex: number, properties: MetaModel.CellOwnProperties | undefined, subgrid: Subgrid): MetaModel.CellOwnProperties | undefined {
        if (properties) {
            const existingCellOwnProperties = this.getCellPropertiesObject(rowIndex, subgrid)
            assignOrDelete(existingCellOwnProperties, properties);
            return existingCellOwnProperties;
        } else {
            return undefined;
        }
    }

    /**
     * @summary Get the cell's own properties object.
     * @desc Due to memory constraints, we don't create a cell properties object for every cell.
     *
     * If the cell has its own properties object, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * If the cell does not have its own properties object, this method returns `null`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link Column#getCellProperties|getCellProperties}.
     * @param rowIndex - Data row coordinate.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `null`.
     */
    /** @internal */
    getCellOwnProperties(rowIndex: number, subgrid: Subgrid): MetaModel.CellOwnProperties | null {
        // const dataModel = subgrid !== undefined ? subgrid.dataModel : this.dataModel;
        const metadata = subgrid.getRowMetadata(rowIndex);
        const properties = metadata && metadata[this.name] as MetaModel.CellOwnProperties;

        return properties ?? null; // null means not previously created
    }

    /**
     * Delete cell's own properties object.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellOwnProperties(rowIndex: number, subgrid: Subgrid) {
        // subgrid = subgrid || this.dataModel;
        const metadata = subgrid.getRowMetadata(rowIndex);
        if (metadata) {
            delete metadata[this.name];
            if (Object.keys(metadata).length === 0) {
                subgrid.setRowMetadata(rowIndex);
            }
        }
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param rowIndex - Data row coordinate.
     * @return The specified property for the cell at x,y in the grid.
     */
    /** @internal */
    getCellProperty(rowIndex: number, key: string | number, subgrid: Subgrid): MetaModel.CellOwnProperty;
    getCellProperty<T extends keyof ColumnProperties>(rowIndex: number, key: T, subgrid: Subgrid): ColumnProperties[T];
    getCellProperty<T extends keyof ColumnProperties>(
        rowIndex: number,
        key: string | number | T, subgrid: Subgrid
    ): MetaModel.CellOwnProperty | ColumnProperties[T] {
        const cellProperties = this.getCellProperties(rowIndex, subgrid);
        return cellProperties.get(key);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @returns Cell's own properties object, which will be created by this call if it did not already exist.
     */
    /** @internal */
    setCellProperty(rowIndex: number, key: string, value: unknown, subgrid: Subgrid): MetaModel.CellOwnProperties {
        const cellProps = this.getCellPropertiesObject(rowIndex, subgrid);
        cellProps[key] = value;
        return cellProps;
    }

    /**
     * @summary Delete a cell own property.
     * @summary If the property is not an own property, it is not deleted.
     * @param rowIndex - Data row coordinate.
     */
    /** @internal */
    deleteCellProperty(rowIndex: number, key: string, subgrid: Subgrid) {
        const cellProps = this.getCellOwnProperties(rowIndex, subgrid);
        if (cellProps) {
            delete cellProps[key];
        }
    }

    /**
     * Clear all cell properties from all cells in this column.
     */
    /** @internal */
    clearAllCellProperties() {
        this.grid.subgrids.forEach((subgrid) => {
            const rowCount = subgrid.dataModel.getRowCount();
            for (let y = rowCount - 1; y >= 0; y--) {
                this.deleteCellOwnProperties(y, subgrid);
            }
        });
    }


    // End CellProperties Mixin


    /**
     * Calculators are functions. Column calculators are saved in `grid.properties.calculators` using the function name as key. Anonymous functions use the stringified function itself as the key. This may seem pointless, but this achieves the objective here which is to share function instances.
     * @throws {HypergridError} Unexpected input.
     * @throws {HypergridError} Arrow function not permitted.
     * @throws {HypergridError} Unknown function.
     * @param calculator - One of:
     * * calculator function
     * * stringified calculator function with or without function name
     * * function name of a known function (already in `calculators`)
     * * falsy value
     * @returns {function} Shared calculator instance or `undefined` if input was falsy.
     * @internal
     */
    private resolveCalculator(calculator: SchemaModel.Column.Calculator): SchemaModel.Column.CalculateFunction | undefined {
        if (!calculator) {
            return undefined;
        }

        const forColumnName = ' (for column "' + this.name + '").';

        if (typeof calculator === 'function') {
            calculator = calculator.toString();
        } else if (typeof calculator !== 'string') {
            throw new AssertError('CRC23553', 'Expected calculator function OR string containing calculator function OR calculator name' + forColumnName);
        }

        let matches: string[];
        let key: string;
        const calculators = this.grid.properties.calculators ?? (this.grid.properties.calculators = {});

        if (/^\w+$/.test(calculator)) { // just a function name?
            // use as registry key but make sure it is in fact a registered calculator
            key = calculator;
            if (!calculators[key]) {
                throw new AssertError('CRC23554', 'Unknown calculator name "' + key + forColumnName);
            }

        } else if ((matches = calculator.match(REGEX_NAMED_FUNC))) { // named stringified function?
            // extract function name from stringified function to use as registry key
            key = matches[1];

        } else if (REGEX_ANON_FUNC.test(calculator)) { // anonymous stringified function?
            // use entire anonymous stringified function as registry key
            key = calculator;

        } else if (REGEX_ARROW_FUNC.test(calculator)) {
            throw new AssertError('CRC23555', 'Arrow function not permitted as column calculator ' + forColumnName);
        }

        if (!calculators[key]) { // neither a string nor a function (previously functionified string)?
            calculators[key] = this.toFunction(calculator);
        } else {
            calculators[key] = this.toFunction(calculators[key]); // functionify existing entries as well as new `calculators` entries
        }

        return calculators[key];
    }

    /** @internal */
    private toFunction(string: SchemaModel.Column.CalculateFunction | string | undefined): SchemaModel.Column.CalculateFunction | undefined {
        switch (typeof string) {
            case 'string':
                break;
            case 'undefined':
                return string;
            case 'function':
                return string;
            default:
                throw new AssertError('CTF27754', 'Expected string, function, or undefined.');
        }

        let args = string.match(/^function\s*\w*\s*\(([^]*?)\)/);
        if (!args) {
            throw new AssertError('CTF27755', 'Expected function keyword with formal parameter list.');
        }
        args = args[1].split(',').map((s, i) => {
            const matches = s.match(/\s*(\w*)\s*/); // trim each argument
            if (!matches && i) {
                throw new AssertError('CTF27756', 'Expected formal parameter.');
            }
            return matches[1];
        });

        const matchResult = string.match(/{\s*([^]*?)\s*}\s*$/);
        if (!matchResult) {
            throw new AssertError('CTF27757', 'Expected function body.');
        }
        const body = matchResult[1];

        if (args.length === 1 && !args[0]) {
            args[0] = body;
        } else {
            args = args.concat(body);
        }

        // eslint-disable-next-line prefer-spread
        return Function.apply(null, args) as SchemaModel.Column.CalculateFunction;
    }

    // Begin CellProperties Mixin

    /**
     * @todo: Theoretically setData should call this method to ensure each cell's persisted properties object is properly recreated with prototype set to its column's properties object.
     * @param rowIndex - Data row coordinate.
     * @internal *
    */
    private getCellPropertiesObject(rowIndex: number, subgrid: Subgrid): MetaModel.CellOwnProperties {
        return this.getCellOwnProperties(rowIndex, subgrid) ?? this.newCellOwnPropertiesObject(rowIndex, subgrid);
    }

    /**
     * @param rowIndex - Data row coordinate.
     * @internal *
     */
    private newCellOwnPropertiesObject(rowIndex: number, subgrid: Subgrid): MetaModel.CellOwnProperties {
        // This may need more work
        // const dataModel = subgrid !== undefined ? subgrid.dataModel : this.dataModel;
        const metadata = subgrid.getRowMetadata(rowIndex, null);
        // Commented out as part of Typescript conversion
        // let props = this.properties;

        // switch (this.index) {
        //     case this.behavior.treeColumnIndex:
        //         props = props.treeHeader;
        //         break;
        //     case this.behavior.rowColumnIndex:
        //         props = props.rowHeader;
        //         break;
        //     default:
        //         if (subgrid && subgrid.role === filter) {
        //             props = this.properties.filterProperties;
        //         }
        // }

        return (metadata[this.name]/* = Object.create(props)*/);
    }

    // End CellProperties Mixin
}

const REGEX_ARROW_FUNC = /^(\(.*\)|\w+)\s*=>/;
const REGEX_NAMED_FUNC = /^function\s+(\w+)\(/;
const REGEX_ANON_FUNC = /^function\s*\(/;
