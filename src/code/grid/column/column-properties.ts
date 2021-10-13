import { GridProperties } from '../grid-properties';
import { Halign } from '../lib/types';
import { SchemaModel } from '../model/schema-model';
import { Column } from './column';

/** @public */
export interface ColumnProperties extends ColumnProperties.HeaderFilter, ColumnProperties.ColumnHeader, ColumnProperties.Filter {
    readonly name: string;
    /** typeof DataValue contained in Column */
    type: string;

    readonly gridProperties: GridProperties;

    readonly columnHeader: ColumnProperties.ColumnHeader;
    readonly filterProperties: ColumnProperties.Filter;

    calculator?: SchemaModel.Column.Calculator; // not sure about this
    preferredWidth: number;

    // Grid overrides
    cellPadding: number;
    cellSelection: boolean;
    columnAutosizingMax: number;
    columnClip: boolean | null;
    editOnKeydown: boolean;
    editOnNextCell: boolean;
    editor: string;
    feedbackCount: number;
    filterable: boolean;
    font: string;
    format: string;
    gridLinesVWidth: number;
    gridLinesHWidth: number;
    halign: Halign;
    link: false | string | GridProperties.LinkProp | GridProperties.LinkFunction;
    linkTarget: string;
    maximumColumnWidth: number;
    resizeColumnInPlace: boolean;
    sortOnDoubleClick: boolean;
    sortable: boolean;

    // Grid passthroughs so can be used by header and filter
    readonly color: string;
    readonly backgroundSelectionColor: string;
    readonly foregroundSelectionColor: string;
    readonly foregroundSelectionFont: string;
    readonly cellPainter: string;
    readonly rightIcon: string;


    // Grid overrides set by painters as well
    backgroundColor: GridProperties.Color;
    columnAutosized: boolean;
    columnAutosizing: boolean;
    minimumColumnWidth: number;
    width: number;

    merge(properties: Partial<ColumnProperties>): void;
}

/** @public */
export namespace ColumnProperties {
    export type Constructor = new (gridProperties: GridProperties, column: Column) => ColumnProperties;

    export interface HeaderFilter {
        backgroundColor: /* CanvasGradient | CanvasPattern | */ string;
        backgroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
        cellPainter: string;
        color: /* CanvasGradient | CanvasPattern | */ string;
        font: string;
        foregroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
        halign: Halign;
    }

    export interface ColumnHeader extends HeaderFilter {
        format: string;
        foregroundSelectionFont: string;
        // autosizing: boolean | undefined;
        // autosizingMax: number | undefined;
        // leftIcon: { writable: true, value: undefined},
        // centerIcon: { writable: true, value: undefined},
        // rightIcon: { writable: true, value: undefined},
    }

    export interface Filter extends HeaderFilter {
        editor: string;
        rightIcon: string; // key to images
    }
}
