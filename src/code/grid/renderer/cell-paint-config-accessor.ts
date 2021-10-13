import { BeingPaintedCell } from '../cell/being-painted-cell';
import { ColumnProperties } from '../column/column-properties';
import { GridProperties } from '../grid-properties';
import { Localization } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangle';
import { Halign } from '../lib/types';
import { DataModel } from '../model/data-model';
import { CellPaintConfig } from './cell-paint-config';

/** @public */
export class CellPaintConfigAccessor implements CellPaintConfig {
    private readonly _gridProperties: GridProperties;
    private readonly _columnProperties: ColumnProperties;

    private readonly _dataOrHeaderOrFilterProperties: ColumnProperties.HeaderFilter;
    private readonly _dataOrHeaderProperties: ColumnProperties.ColumnHeader;
    private readonly _dataOrFilterProperties: ColumnProperties.Filter;

    constructor(beingPaintedCell: BeingPaintedCell) {
        this._columnProperties = beingPaintedCell.column.properties;
        this._gridProperties = beingPaintedCell.grid.properties;
        if (beingPaintedCell.isHeaderCell) {
            this._dataOrHeaderOrFilterProperties = this._columnProperties.columnHeader;
            this._dataOrHeaderProperties = this._columnProperties.columnHeader;
            this._dataOrFilterProperties = this._columnProperties;
        } else {
            if (beingPaintedCell.isFilterCell) {
                this._dataOrHeaderOrFilterProperties = this._columnProperties.filterProperties;
                this._dataOrFilterProperties = this._columnProperties.filterProperties;
                this._dataOrHeaderProperties = this._columnProperties;
            } else {
                // must be data cell
                this._dataOrHeaderOrFilterProperties = this._columnProperties;
                this._dataOrHeaderProperties = this._columnProperties;
                this._dataOrFilterProperties = this._columnProperties;
            }
        }
    }

    dataCell: WritablePoint;
    gridCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRow;
    formatValue: Localization.FormatFunction;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isDataColumn: boolean;
    isMainRow: boolean;
    isFilterRow: boolean;
    isHandleColumn: boolean;
    isHeaderRow: boolean;
    isInCurrentSelectionRectangle: boolean;
    isRowHovered: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isTreeColumn: boolean;
    isUserDataArea: boolean;
    minWidth: number;
    mouseDown: boolean;
    prefillColor: GridProperties.Color;
    snapshot: BeingPaintedCell.SubrowSnapshot; // BeingPaintedCell
    subrow: number;
    subrows: number;
    value: unknown;

    clickRect?: Rectangle;

    cellBorderThickness?: number;
    cellBorderStyle?: string /*| CanvasGradient | CanvasPattern */;
    hotIcon?: string;

    // grid overrides set by renderer as well
    private _selectionRegionOutlineColor: GridProperties.Color;
    private _selectionRegionOverlayColor: GridProperties.Color;

    // column overrides set by painters/renderer as well
    private _backgroundColor: GridProperties.Color;
    private _halign: Halign;

    get backgroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.backgroundSelectionColor; }
    get centerIcon() { return this._gridProperties.centerIcon; }
    get color() { return this._dataOrHeaderOrFilterProperties.color; }
    get foregroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._dataOrHeaderProperties.foregroundSelectionFont; }
    get headerTextWrapping() { return this._gridProperties.headerTextWrapping; }
    get hoverCellHighlight() { return this._gridProperties.hoverCellHighlight; }
    get hoverColumnHighlight() { return this._gridProperties.hoverColumnHighlight; }
    get hoverRowHighlight() { return this._gridProperties.hoverRowHighlight; }
    get iconPadding() { return this._gridProperties.iconPadding; }
    get leftIcon() { return this._gridProperties.leftIcon; }
    get linkOnHover() { return this._gridProperties.linkOnHover; }
    get linkColor() { return this._gridProperties.linkColor; }
    get linkColorOnHover() { return this._gridProperties.linkColorOnHover; }
    get cellPainter() { return this._dataOrHeaderOrFilterProperties.cellPainter; }
    get renderFalsy() { return this._gridProperties.renderFalsy; }
    get rightIcon() { return this._dataOrFilterProperties.rightIcon; }
    get strikeThrough() { return this._gridProperties.strikeThrough; }
    get textTruncateType() { return this._gridProperties.textTruncateType; }
    get voffset() { return this._gridProperties.voffset; }

    get selectionRegionOutlineColor() { return this._selectionRegionOutlineColor ?? this._gridProperties.selectionRegionOutlineColor; }
    set selectionRegionOutlineColor(value: GridProperties.Color) { this._selectionRegionOutlineColor = value; }
    get selectionRegionOverlayColor() { return this._selectionRegionOverlayColor ?? this._gridProperties.selectionRegionOverlayColor; }
    set selectionRegionOverlayColor(value: GridProperties.Color) { this._selectionRegionOverlayColor = value; }

    get columnName() { return this._columnProperties.name; }
    get cellPadding() { return this._columnProperties.cellPadding; }
    get columnAutosizing() { return this._columnProperties.columnAutosizing; }
    get font() { return this._dataOrHeaderOrFilterProperties.font; }
    get format() { return this._dataOrHeaderProperties.format; }
    get gridLinesHWidth() { return this._columnProperties.gridLinesHWidth; }
    get gridLinesVWidth() { return this._columnProperties.gridLinesVWidth; }
    get link() { return this._columnProperties.link; }

    get backgroundColor() { return this._backgroundColor ?? this._dataOrHeaderOrFilterProperties.backgroundColor; }
    set backgroundColor(value: GridProperties.Color) { this._backgroundColor = value; }
    get halign() { return this._halign ?? this._dataOrHeaderOrFilterProperties.halign; }
    set halign(value: Halign) { this._halign = value; }
}
