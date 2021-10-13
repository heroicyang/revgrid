import { GridSettings } from 'grid-settings';

export interface TestGridSettingsColorMap extends GridSettings.ColorMap {
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

    // bkgdRowHeader: string;
    // foreRowHeader: string;
}
