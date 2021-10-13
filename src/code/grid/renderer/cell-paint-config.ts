import { BeingPaintedCell } from '../cell/being-painted-cell';
import { GridProperties } from '../grid-properties';
import { Localization } from '../lib/localization';
import { WritablePoint } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangle';
import { Halign, TextTruncateType } from '../lib/types';
import { DataModel } from '../model/data-model';

/** @public */
export interface CellPaintConfig {
    // not overrides also set by grid painters/renderer
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
    isMainRow: boolean;
    isFilterRow: boolean;
    isHeaderRow: boolean;
    isInCurrentSelectionRectangle: boolean;
    isRowHovered: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isUserDataArea: boolean;
    minWidth: number;
    mouseDown: boolean;
    prefillColor: GridProperties.Color;
    snapshot: BeingPaintedCell.SubrowSnapshot; // BeingPaintedCell
    subrow: number;
    subrows: number;
    value: unknown;

    // set by Simple Cell Painter
    clickRect?: Rectangle;

    // used by Simple Cell Painter but not set (so currently ignored)
    cellBorderThickness?: number;
    cellBorderStyle?: string /*| CanvasGradient | CanvasPattern */;
    hotIcon?: string;

    // grid overrides
    readonly backgroundSelectionColor: GridProperties.Color;
    readonly centerIcon: string;
    readonly color: GridProperties.Color;
    readonly foregroundSelectionColor: GridProperties.Color;
    readonly foregroundSelectionFont: string;
    readonly headerTextWrapping: boolean;
    readonly hoverCellHighlight: GridProperties.HoverColors;
    readonly hoverColumnHighlight: GridProperties.HoverColors;
    readonly hoverRowHighlight: GridProperties.HoverColors;
    readonly iconPadding: number;
    readonly leftIcon: string;
    readonly linkOnHover: boolean;
    readonly linkColor: GridProperties.Color;
    readonly linkColorOnHover: boolean;
    readonly cellPainter: string;
    readonly renderFalsy: boolean;
    readonly rightIcon: string;
    readonly strikeThrough: boolean;
    readonly textTruncateType: TextTruncateType;
    readonly voffset: number;

    // grid overrides set by renderer
    selectionRegionOutlineColor: GridProperties.Color;
    selectionRegionOverlayColor: GridProperties.Color;

    // column overrides
    readonly columnName: string;
    readonly cellPadding: number;
    readonly columnAutosizing: boolean;
    readonly font: string;
    readonly format: string;
    readonly gridLinesHWidth: number;
    readonly gridLinesVWidth: number;
    readonly link: false | string | GridProperties.LinkProp | GridProperties.LinkFunction;

    // column overrides set by painters/renderer as well
    backgroundColor: GridProperties.Color;
    halign: Halign;
}
