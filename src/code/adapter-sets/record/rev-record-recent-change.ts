import { RevRecordRecentChangeTypeId, RevRecordValueRecentChangeTypeId, RevRecordSysTick } from './rev-record-types';

export interface RevRecordSearchableRecentChange {
    expiryTime: RevRecordSysTick.Time;
}

export namespace RevRecordSearchableRecentChange {
    export function compareExpiryTime(left: RevRecordSearchableRecentChange, right: RevRecordSearchableRecentChange) {
        return left.expiryTime - right.expiryTime;
    }
}

export interface RevRecordRecentChange extends RevRecordSearchableRecentChange {
    readonly typeId: RevRecordRecentChange.TypeId;
    rowIndex: number; // Also holds record index when grid is being sorted (See PreReindex and PostReindex)
}

export namespace RevRecordRecentChange {
    export const enum TypeId {
        Value,
        Row,
    }
}

export interface RevRecordValueRecentChange extends RevRecordRecentChange {
    readonly typeId: RevRecordRecentChange.TypeId.Value,
    valueRecentChangeTypeId: RevRecordValueRecentChangeTypeId;
    fieldIndex: number;
}

export interface RevRecordRowRecentChange extends RevRecordRecentChange {
    readonly typeId: RevRecordRecentChange.TypeId.Row,
    recordRecentChangeTypeId: RevRecordRecentChangeTypeId;
}
