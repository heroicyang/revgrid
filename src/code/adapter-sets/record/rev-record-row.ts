import { RevRecordRowRecentChange, RevRecordValueRecentChange } from './rev-record-recent-change';
import { RevRecord } from './rev-record';
import { RevRecordAssertError } from './rev-record-error';
import { RevRecordFieldIndex, RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId } from './rev-record-types';

export interface RevRecordRow {
    record: RevRecord;
    index: number;
    recentChange?: RevRecordRowRecentChange;
    valueRecentChanges?: RevRecordValueRecentChange[];
}

export namespace RevRecordRow {
    export function addValueRecentChange(row: RevRecordRow, change: RevRecordValueRecentChange) {
        if (row.valueRecentChanges === undefined) {
            row.valueRecentChanges = [change];
        } else {
            row.valueRecentChanges.push(change);
        }
    }

    export function deleteValueRecentChange(row: RevRecordRow, fieldIndex: RevRecordFieldIndex) {
        const valueRecentChanges = row.valueRecentChanges;
        if (valueRecentChanges === undefined) {
            throw new RevRecordAssertError('RDRCCU16995');
        } else {
            const count = valueRecentChanges.length;
            for (let i = 0; i < count; i++) {
                const change = valueRecentChanges[i];
                if (change.fieldIndex === fieldIndex) {
                    valueRecentChanges.splice(i, 1);
                    return;
                }
            }
            throw new RevRecordAssertError('RDRCCN16995');
        }
    }

    export function clearRecentChanges(row: RevRecordRow) {
        row.recentChange = undefined;
        if (row.valueRecentChanges !== undefined) {
            row.valueRecentChanges.length = 0;
        }
    }

    export function findRecentValueChange(row: RevRecordRow, fieldIndex: RevRecordFieldIndex): RevRecordValueRecentChange | undefined {
        const valueRecentChanges = row.valueRecentChanges;
        if (valueRecentChanges === undefined) {
            return undefined;
        } else {
            const count = valueRecentChanges.length;
            for (let i = 0; i < count; i++) {
                const change = valueRecentChanges[i];
                if (change.fieldIndex === fieldIndex) {
                    return change;
                }
            }
            return undefined;
        }
    }

    export function getRowRecentChangeTypeId(row: RevRecordRow): RevRecordRecentChangeTypeId | undefined {
        const rowRecentChange = row.recentChange;
        return rowRecentChange === undefined ? undefined : rowRecentChange.recordRecentChangeTypeId;
    }

    export function getValueRecentChangeTypeId(row: RevRecordRow, fieldIndex: RevRecordFieldIndex): RevRecordValueRecentChangeTypeId | undefined {
        const recentChange = findRecentValueChange(row, fieldIndex);
        return recentChange === undefined ? undefined : recentChange.valueRecentChangeTypeId;
    }

    export function adjustForInsertion(rows: RevRecordRow[], count: number, insertIndex: number) {
        for (let i = 0; i < count; i++) {
            const row = rows[i];
            if (row.index >= insertIndex) {
                row.index++;
            }
        }
    }

    export type Comparer = (this: void, left: RevRecordRow, right: RevRecordRow) => number;
}

