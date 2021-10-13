import { GridProperties } from '../grid-properties';
import { Halign } from '../lib/types';
import { deepClone } from '../lib/utils';
import { SchemaModel } from '../model/schema-model';
import { Column } from './column';
import { ColumnProperties } from './column-properties';

export class ColumnPropertiesAccessor implements ColumnProperties {
    // not overridable properties
    private _preferredWidth?: number;

    // grid overridable properties
    private _cellPadding: number | undefined;
    private _cellSelection: boolean | undefined;
    private _columnAutosizingMax: number | undefined;
    private _columnClip: boolean | null | undefined;
    private _editOnKeydown: boolean | undefined;
    private _editOnNextCell: boolean | undefined;
    private _editor: string | undefined;
    private _feedbackCount: number | undefined;
    private _filterable: boolean | undefined;
    private _font: string | undefined;
    private _format: string | undefined;
    private _gridLinesVWidth: number | undefined;
    private _gridLinesHWidth: number | undefined;
    private _halign: Halign | undefined;
    private _link: false | string | GridProperties.LinkProp | GridProperties.LinkFunction | undefined;
    private _linkTarget: string | undefined;
    private _maximumColumnWidth: number | undefined;
    private _resizeColumnInPlace: boolean | undefined;
    private _sortOnDoubleClick: boolean | undefined;
    private _sortable: boolean | undefined;

    // grid overridable properties set by Painters as well
    private _backgroundColor: GridProperties.Color | undefined;
    private _columnAutosized: boolean | undefined;
    private _columnAutosizing: boolean | undefined;
    private _minimumColumnWidth: number | undefined;
    private _width: number | undefined;

    readonly columnHeader: ColumnPropertiesAccessor.ColumnHeader;
    readonly filterProperties: ColumnPropertiesAccessor.Filter;

    constructor(private readonly _gridProperties: GridProperties, private readonly _column: Column) {
        this.columnHeader = new ColumnPropertiesAccessor.ColumnHeader(this._gridProperties);
        this.filterProperties = new ColumnPropertiesAccessor.Filter(this._gridProperties);

        // switch (_column.index) {
        //     case _column.behavior.treeColumnIndex: properties = properties.treeHeader; break;
        //     case _column.behavior.rowColumnIndex: properties = properties.rowHeader; break;
        // }
    }

    get gridProperties() { return this._gridProperties; }

    get name() { return this._column.name; }
    get type() { return this._column.type; }
    set type(value: string) { this._column.type = value; }
    get calculator() { return this._column.calculator; }
    set calculator(value: SchemaModel.Column.Calculator) { this._column.calculator = value; }

    get preferredWidth() { return this._preferredWidth; }
    set preferredWidth(value: number) { this._preferredWidth = value; }

    get cellPadding() { return this._cellPadding ?? this._gridProperties.cellPadding; }
    set cellPadding(value: number) { this._cellPadding = value; }
    get cellSelection() { return this._cellSelection ?? this._gridProperties.cellSelection; }
    set cellSelection(value: boolean) { this._cellSelection = value; }
    get columnAutosizingMax() { return this._columnAutosizingMax ?? this._gridProperties.columnAutosizingMax; }
    set columnAutosizingMax(value: number) { this._columnAutosizingMax = value; }
    get columnClip() { return this._columnClip ?? this._gridProperties.columnClip; }
    set columnClip(value: boolean | null) { this._columnClip = value; }
    get editOnKeydown() { return this._editOnKeydown ?? this._gridProperties.editOnKeydown; }
    set editOnKeydown(value: boolean) { this._editOnKeydown = value; }
    get editOnNextCell() { return this._editOnNextCell ?? this._gridProperties.editOnNextCell; }
    set editOnNextCell(value: boolean) { this._editOnNextCell = value; }
    get editor() { return this._editor ?? this._gridProperties.editor; }
    set editor(value: string) { this._editor = value; }
    get feedbackCount() { return this._feedbackCount ?? this._gridProperties.feedbackCount; }
    set feedbackCount(value: number) { this._feedbackCount = value; }
    get filterable() { return this._filterable ?? this._gridProperties.filterable; }
    set filterable(value: boolean) { this._filterable = value; }
    get font() { return this._font ?? this._gridProperties.font; }
    set font(value: string) { this._font = value; }
    get format() { return this._format ?? this._gridProperties.format; }
    set format(value: string) { this._format = value; }
    get gridLinesVWidth() { return this._gridLinesVWidth ?? this._gridProperties.gridLinesVWidth; }
    set gridLinesVWidth(value: number) { this._gridLinesVWidth = value; }
    get gridLinesHWidth() { return this._gridLinesHWidth ?? this._gridProperties.gridLinesHWidth; }
    set gridLinesHWidth(value: number) { this._gridLinesHWidth = value; }
    get halign() { return this._halign ?? this._gridProperties.halign; }
    set halign(value: Halign) { this._halign = value; }
    get link() { return this._link ?? this._gridProperties.link; }
    set link(value: false | string | GridProperties.LinkProp | GridProperties.LinkFunction) { this._link = value; }
    get linkTarget() { return this._linkTarget ?? this._gridProperties.linkTarget; }
    set linkTarget(value: string) { this._linkTarget = value; }
    get maximumColumnWidth() { return this._maximumColumnWidth ?? this._gridProperties.maximumColumnWidth; }
    set maximumColumnWidth(value: number) { this._maximumColumnWidth = value; }
    get resizeColumnInPlace() { return this._resizeColumnInPlace ?? this._gridProperties.resizeColumnInPlace; }
    set resizeColumnInPlace(value: boolean) { this._resizeColumnInPlace = value; }
    get sortOnDoubleClick() { return this._sortOnDoubleClick ?? this._gridProperties.sortOnDoubleClick; }
    set sortOnDoubleClick(value: boolean) { this._sortOnDoubleClick = value; }
    get sortable() { return this._sortable ?? this._gridProperties.sortable; }
    set sortable(value: boolean) { this._sortable = value; }

    get backgroundColor() { return this._backgroundColor ?? this._gridProperties.backgroundColor; }
    set backgroundColor(value: GridProperties.Color) { this._backgroundColor = value; }
    get columnAutosized() { return this._columnAutosized ?? this._gridProperties.columnAutosized; }
    set columnAutosized(value: boolean) { this._columnAutosized = value; }
    get columnAutosizing() { return this._columnAutosizing ?? this._gridProperties.columnAutosizing; }
    set columnAutosizing(value: boolean) { this._columnAutosizing = value; }
    get minimumColumnWidth() { return this._minimumColumnWidth ?? this._gridProperties.minimumColumnWidth; }
    set minimumColumnWidth(value: number) { this._minimumColumnWidth = value; }
    get width() { return this._width ?? this._gridProperties.width; }
    set width(value: number) { this._width = value; }

    get color() { return this._gridProperties.color; }
    get backgroundSelectionColor() { return this._gridProperties.backgroundSelectionColor; }
    get foregroundSelectionColor() { return this._gridProperties.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._gridProperties.foregroundSelectionFont; }
    get cellPainter() { return this._gridProperties.cellPainter; }
    get rightIcon() { return this._gridProperties.rightIcon; }

    // not yet implemented
    // toJSON() {
    //     return Object.assign({
    //         header: this.header,
    //         type: this.type,
    //         // calculator: this.calculator
    //     }, this);
    // }

    merge(properties: Partial<ColumnProperties>) {
        Object.keys(properties).forEach((key) => {
            let value = properties[key];

            if (typeof value === 'object') {
                value = deepClone(value);
            }

            this[key] = value;
        });
    }
}

export namespace ColumnPropertiesAccessor {
    export class ColumnHeader implements ColumnProperties.ColumnHeader {
        constructor(private readonly _gridProperties: GridProperties) {
//
        }
        get font() { return this._gridProperties.columnHeaderFont }
        set font(value: string) { this._gridProperties.columnHeaderFont = value; }
        get color() { return this._gridProperties.columnHeaderColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderColor = value; }
        get backgroundColor() { return this._gridProperties.columnHeaderBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderBackgroundColor = value; }
        get foregroundSelectionFont() { return this._gridProperties.columnHeaderForegroundSelectionFont }
        set foregroundSelectionFont(value: string) { this._gridProperties.columnHeaderForegroundSelectionFont = value; }
        get foregroundSelectionColor() { return this._gridProperties.columnHeaderForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.columnHeaderBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.columnHeaderBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.columnHeaderHalign }
        set halign(value: Halign | undefined) { this._gridProperties.columnHeaderHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string | undefined) { this._gridProperties.columnHeaderFormat = value; }
        get cellPainter() { return this._gridProperties.columnHeaderCellPainter }
        set cellPainter(value: string | undefined) { this._gridProperties.columnHeaderCellPainter = value; }
        // get autosizing() { return this._gridProperties.columnAutosizing }
        // set autosizing(value: boolean | undefined) { this._gridProperties.columnAutosizing = value; }
        // get autosizingMax() { return this._gridProperties.columnAutosizingMax }
        // set autosizingMax(value: number | undefined) { this._gridProperties.columnAutosizingMax = value; }

        // get leftIcon() {
        //     }
        // }
        // set leftIcon(value: string) {
        //     // this._column.rowHeaderLeftIcon = value;
        // }
    }

    export class Filter implements ColumnProperties.Filter {
        private _rightIcon: string;

        constructor(private readonly _gridProperties: GridProperties) { }

        get font() { return this._gridProperties.filterFont }
        set font(value: string) { this._gridProperties.filterFont = value; }
        get color() { return this._gridProperties.filterColor }
        set color(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterColor = value; }
        get backgroundColor() { return this._gridProperties.filterBackgroundColor }
        set backgroundColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterBackgroundColor = value; }
        get foregroundSelectionColor() { return this._gridProperties.filterForegroundSelectionColor }
        set foregroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterForegroundSelectionColor = value; }
        get backgroundSelectionColor() { return this._gridProperties.filterBackgroundSelectionColor }
        set backgroundSelectionColor(value: /*CanvasGradient | CanvasPattern |*/ string | undefined) { this._gridProperties.filterBackgroundSelectionColor = value; }
        get halign() { return this._gridProperties.filterHalign }
        set halign(value: Halign | undefined) { this._gridProperties.filterHalign = value; }
        get format() { return this._gridProperties.columnHeaderFormat }
        set format(value: string | undefined) { this._gridProperties.columnHeaderFormat = value; }
        get cellPainter() { return this._gridProperties.filterCellPainter }
        set cellPainter(value: string | undefined) { this._gridProperties.filterCellPainter = value; }
        get editor() { return this._gridProperties.filterEditor }
        set editor(value: string | undefined) { this._gridProperties.filterEditor = value; }

        get rightIcon() {
            const result = this._rightIcon;
            if (result === undefined) {
                if (this._gridProperties.filterable) {
                    // result = this._gridProperties.filter ? 'filter-on' : 'filter-off';
                }
                return result;
            } else {
                return undefined;
            }
        }
        set rightIcon(value: string) {
            this._rightIcon = value;
        }
    }
}
