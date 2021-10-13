import { CellPaintConfig } from '../../grid/grid-public-api';
import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

/** @public */
export interface RevRecordCellPaintConfig extends CellPaintConfig {
    /** True if any cell in row is focused */
    readonly isRowFocused: boolean;
    // /** Has color if internal border to be drawn  */
    // readonly internalBorder: string | undefined;
    /** Flags if cell has recently been changed and the change type */
    readonly valueRecentChangeTypeId?: RevRecordValueRecentChangeTypeId;
    /** Flags if row that cell has recently been changed and the change type */
    readonly recordRecentChangeTypeId?: RevRecordRecentChangeTypeId;
}
