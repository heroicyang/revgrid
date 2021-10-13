import { GridProperties, RevRecordSysTick } from '..';

/** @public */
export interface GridSettings {
    /** The font family to use for all cells */
    fontFamily: string;
    /** The font size to use for all cells except heading */
    fontSize: string;
    /** The font size to use for all heading cells */
    columnHeaderFontSize: string;
    /** The default row height for all rows */
    defaultRowHeight: number;

    /** The amount of padding applied to the left and right of cells */
    cellPadding: number;
    /** The number of fixed columns */
    fixedColumnCount: number;
    /** Partially shown columns will have their width adjusted so that strings are truncated instead of clipped */
    visibleColumnWidthAdjust: boolean;
    /** Whether the grid is right aligned in container */
    gridRightAligned: boolean;

    /** Whether to render horizontal grid lines between rows */
    gridLinesH: boolean;
    /** Whether to render vertical grid lines between columns */
    gridLinesV: boolean;

    /** The weight of the horizontal grid lines */
    gridLinesHWidth: number;
    /** The weight of the vertical grid lines */
    gridLinesVWidth: number;

    /** Columns are scrolled smoothly (ie both left and right ends can show a partial column) */
    scrollHorizontallySmoothly: boolean;
    /** Height of grid horizontal scrollbar */
    scrollbarHorizontalHeight: number;
    /** Width of grid horizontal scrollbar's thumb */
    scrollbarHorizontalThumbHeight: number;
    /** Width of grid vertical scrollbar */
    scrollbarVerticalWidth: number;
    /** Width of grid vertical scrollbar's thumb */
    scrollbarVerticalThumbWidth: number;

    /** Opacity of scroll bar thumb when it is not active (between 0 and 1) */
    scrollbarThumbInactiveOpacity: number;

    /** Scroll bar margin */
    scrollbarMargin: number;

    /** The highlight duration when all values/records are changed. 0 to disable*/
    allChangedRecentDuration: RevRecordSysTick.Span;
    /** The highlight duration for added values. 0 to disable*/
    recordInsertedRecentDuration: RevRecordSysTick.Span;
    /** The highlight duration for updated records. 0 to disable*/
    recordUpdatedRecentDuration: RevRecordSysTick.Span;
    /** The highlight duration for changed values. 0 to disable */
    valueChangedRecentDuration: RevRecordSysTick.Span;

    /** The colours to apply to the grid */
    colorMap: GridSettings.ColorMap;
}

/** @public */
export namespace GridSettings {
    export function assignPropertiesTo<T=GridSettings>(source: Partial<T>, target: T): void {
        type Key = keyof T;
        const keys = Object.keys(source) as Key[];
        for (const key of keys) {
            const value = source[key] as T[Key];
            target[key] = value;
        }
    }

    export interface ColorMap {
        // Used by Grid
        backgroundColor: string;
        color: string;
        bkgdBaseAlt: string; // will be needed when stripes are working
        columnHeaderBackgroundColor: string;
        columnHeaderColor: string;
        backgroundSelectionColor: string;
        foregroundSelectionColor: string;
        columnHeaderBackgroundSelectionColor: string;
        columnHeaderForegroundSelectionColor: string;
        selectionRegionOutlineColor: string;
        gridLinesHColor: string;
        gridLinesVColor: string;

        bkgdGreyedOut: string;
        foreGreyedOut: string;
        bkgdFocusedRow: string;
        bkgdFocusedRowBorder: string;
        foreValueRecentlyModifiedBorder: string;
        foreValueRecentlyModifiedUpBorder: string;
        foreValueRecentlyModifiedDownBorder: string;
        foreRecordRecentlyUpdatedBorder: string;
        foreRecordRecentlyInsertedBorder: string;
        foreScrollbarThumbColor: string;
        scrollbarThumbShadowColor: string;
    }

    export function createGridPropertiesFromSettings(
        settings: GridSettings,
        existingProperties: GridProperties | undefined
    ): Partial<GridProperties> {
        const properties: Partial<GridProperties> = {};

        const newFontFamily = settings.fontFamily;
        if (newFontFamily !== '') {
            const newFontSize = settings.fontSize;
            if (newFontSize !== '') {
                const newFont = newFontSize + ' ' + newFontFamily;
                if (newFont !== existingProperties?.font) {
                    properties.font = newFont;
                    properties.foregroundSelectionFont = newFont;
                }
            }

            const newColumnHeaderFontSize = settings.columnHeaderFontSize;
            if (newColumnHeaderFontSize !== '') {
                const newFont = newColumnHeaderFontSize + ' ' + newFontFamily;
                if (newFont !== existingProperties?.columnHeaderFont) {
                    properties.columnHeaderFont = newFont;
                    properties.columnHeaderForegroundSelectionFont = newFont;
                    properties.filterFont = newFont;
                }
            }
        }

        const newDefaultRowHeight = settings.defaultRowHeight;
        if (newDefaultRowHeight !== existingProperties?.defaultRowHeight && newDefaultRowHeight > 0) {
            properties.defaultRowHeight = newDefaultRowHeight;
        }

        const newCellPadding = settings.cellPadding;
        if (newCellPadding !== existingProperties?.cellPadding && settings.cellPadding >= 0) {
            properties.cellPadding = newCellPadding;
        }

        const newFixedColumnCount = settings.fixedColumnCount;
        if (newFixedColumnCount !== existingProperties?.fixedColumnCount && newFixedColumnCount >= 0) {
            properties.fixedColumnCount = newFixedColumnCount;
        }

        const newVisibleColumnWidthAdjust = settings.visibleColumnWidthAdjust;
        if (newVisibleColumnWidthAdjust !== existingProperties?.visibleColumnWidthAdjust) {
            properties.visibleColumnWidthAdjust = newVisibleColumnWidthAdjust;
        }

        const newGridRightAligned = settings.gridRightAligned;
        if (newGridRightAligned !== existingProperties?.gridRightAligned) {
            properties.gridRightAligned = newGridRightAligned;
        }

        const newGridLinesH = settings.gridLinesH;
        if (newGridLinesH !== existingProperties?.gridLinesH) {
            properties.gridLinesH = newGridLinesH;
        }

        const newGridLinesHWidth = settings.gridLinesHWidth;
        if (newGridLinesHWidth !== existingProperties?.gridLinesHWidth) {
            properties.gridLinesHWidth = newGridLinesHWidth;
        }

        const newGridLinesV = settings.gridLinesV;
        if (newGridLinesV !== existingProperties?.gridLinesV) {
            properties.gridLinesV = newGridLinesV;
        }

        const newGridLinesVWidth = settings.gridLinesVWidth;
        if (newGridLinesVWidth !== existingProperties?.gridLinesVWidth) {
            properties.gridLinesVWidth = newGridLinesVWidth;
        }

        const newScrollHorizontallySmoothly = settings.scrollHorizontallySmoothly;
        if (newScrollHorizontallySmoothly !== existingProperties?.scrollHorizontallySmoothly) {
            properties.scrollHorizontallySmoothly = newScrollHorizontallySmoothly;
        }

        const colorMap = settings.colorMap;

        const newBackgroundColor = colorMap.backgroundColor;
        if (newBackgroundColor !== existingProperties?.backgroundColor) {
            properties.backgroundColor = newBackgroundColor;
        }

        const newColor = colorMap.color;
        if (newColor !== existingProperties?.color) {
            properties.color = newColor;
        }

        const newColumnHeaderBackgroundColor = colorMap.columnHeaderBackgroundColor;
        if (newColumnHeaderBackgroundColor !== existingProperties?.columnHeaderBackgroundColor) {
            properties.columnHeaderBackgroundColor = newColumnHeaderBackgroundColor;
        }

        const newColumnHeaderColor = colorMap.columnHeaderColor;
        if (newColumnHeaderColor !== existingProperties?.columnHeaderColor) {
            properties.columnHeaderColor = newColumnHeaderColor;
        }

        const newBackgroundSelectionColor = colorMap.backgroundSelectionColor;
        if (newBackgroundSelectionColor !== existingProperties?.backgroundSelectionColor) {
            properties.backgroundSelectionColor = newBackgroundSelectionColor;
        }

        const newForegroundSelectionColor = colorMap.foregroundSelectionColor;
        if (newForegroundSelectionColor !== existingProperties?.foregroundSelectionColor) {
            properties.foregroundSelectionColor = newForegroundSelectionColor;
        }

        const newColumnHeaderBackgroundSelectionColor = colorMap.columnHeaderBackgroundSelectionColor;
        if (newColumnHeaderBackgroundSelectionColor !== existingProperties?.columnHeaderBackgroundSelectionColor) {
            properties.columnHeaderBackgroundSelectionColor = newColumnHeaderBackgroundSelectionColor;
        }

        const newColumnHeaderForegroundSelectionColor = colorMap.columnHeaderForegroundSelectionColor;
        if (newColumnHeaderForegroundSelectionColor !== existingProperties?.columnHeaderForegroundSelectionColor) {
            properties.columnHeaderForegroundSelectionColor = newColumnHeaderForegroundSelectionColor;
        }

        const newSelectionRegionOutlineColor = colorMap.selectionRegionOutlineColor;
        if (newSelectionRegionOutlineColor !== existingProperties?.selectionRegionOutlineColor) {
            properties.selectionRegionOutlineColor = newSelectionRegionOutlineColor;
        }

        const newGridLinesHColor = colorMap.gridLinesHColor;
        if (newGridLinesHColor !== existingProperties?.gridLinesHColor) {
            properties.gridLinesHColor = newGridLinesHColor;
            properties.fixedLinesHColor = newGridLinesHColor;
        }

        const newGridLinesVColor = colorMap.gridLinesVColor;
        if (newGridLinesVColor !== existingProperties?.gridLinesVColor) {
            properties.gridLinesVColor = newGridLinesVColor;
            properties.fixedLinesVColor = newGridLinesVColor;
        }

        // fix below when row stripes are working
        // properties.rowStripes = [
        //     {
        //         backgroundColor: colorMap.backgroundColor,
        //     },
        //     {
        //         backgroundColor: colorMap.backgroundColorAlternative,
        //     }
        // ];

        return properties;
    }
}
