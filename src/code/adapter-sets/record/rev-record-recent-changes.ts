import { RevRecordArrayUtil } from './rev-record-array-utils';
import { RevRecordAssertError } from './rev-record-error';
import {
    RevRecordRecentChange,
    RevRecordRowRecentChange,
    RevRecordSearchableRecentChange,
    RevRecordValueRecentChange
} from './rev-record-recent-change';
import { RevRecordRow } from './rev-record-row';
import { RevRecordRowMap } from './rev-record-row-map';
import {
    RevRecordFieldIndex,
    RevRecordInvalidatedValue,
    RevRecordRecentChangeTypeId,
    RevRecordSysTick,
    RevRecordValueRecentChangeTypeId
} from './rev-record-types';

export class RevRecordRecentChanges {
    allChangedRecentDuration: RevRecordSysTick.Span = 250;
    recordInsertedRecentDuration: RevRecordSysTick.Span = 1000;
    recordUpdatedRecentDuration: RevRecordSysTick.Span = 1000;
    valueChangedRecentDuration: RevRecordSysTick.Span = 1000;

    private readonly _rows: readonly RevRecordRow[];
    private readonly _expiryQueue = new Array<RevRecordRecentChange>();
    private readonly _searchRecentChange: RevRecordSearchableRecentChange = {
        expiryTime: 0,
    };

    private _beginMultipleChangesCount = 0;

    private _nextExpiryTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    private _nextExpiryTimeoutTargetTime: RevRecordSysTick.Time = RevRecordSysTick.now();

    constructor(
        private readonly _recordRowMap: RevRecordRowMap,
        // private readonly _rows: readonly RecordRow[],
        // private readonly _rowLookup: RecordRowIndexMap,
        private readonly _expiredChangesHandler: RevRecordRecentChanges.ExpiredChangesHandler
    ) {
        this._rows = this._recordRowMap.rows;
    }

    destroy() {
        this.cancelNextExpiryTimeout();
    }

    beginMultipleChanges() {
        ++this._beginMultipleChangesCount;
    }

    endMultipleChanges() {
        if (--this._beginMultipleChangesCount === 0) {
            this.checkConsistency();
        }
    }

    getRecordRecentChangeTypeId(rowIndex: number): RevRecordRecentChangeTypeId | undefined {
        const row = this._rows[rowIndex];
        return RevRecordRow.getRowRecentChangeTypeId(row);
    }

    getValueRecentChangeTypeId(fieldIndex: RevRecordFieldIndex, rowIndex: number): RevRecordValueRecentChangeTypeId | undefined {
        const row = this._rows[rowIndex];
        return RevRecordRow.getValueRecentChangeTypeId(row, fieldIndex);
    }

    addRecordUpdatedChange(rowIndex: number) {
        const recordUpdatedDuration = this.recordUpdatedRecentDuration;
        if (recordUpdatedDuration > 0) {
            const row = this._rows[rowIndex];
            let recentChange: RevRecordRowRecentChange;
            const expiryTime = RevRecordSysTick.now() + recordUpdatedDuration;
            if (row.recentChange === undefined) {
                recentChange = {
                    expiryTime,
                    typeId: RevRecordRecentChange.TypeId.Row,
                    recordRecentChangeTypeId: RevRecordRecentChangeTypeId.Update,
                    rowIndex,
                }
                row.recentChange = recentChange;
                this.queueRecentChange(recentChange);
            } else {
                recentChange = row.recentChange;
                recentChange.recordRecentChangeTypeId = RevRecordRecentChangeTypeId.Update;

                if (recentChange.expiryTime !== expiryTime) {
                    this.updateRecentChangeExpiryTime(recentChange, expiryTime);
                }
            }
        }
    }

    addValueChange(fieldIndex: RevRecordFieldIndex, rowIndex: number, changeTypeId: RevRecordValueRecentChangeTypeId) {
        const valueChangedDuration = this.valueChangedRecentDuration;
        if (valueChangedDuration > 0) {
            const expiryTime = RevRecordSysTick.now() + valueChangedDuration;
            this.addValueChangeToRow(rowIndex, fieldIndex, changeTypeId, expiryTime);
        }
    }

    addRecordValuesChanges(rowIndex: number, invalidatedValues: RevRecordInvalidatedValue[]) {
        const valueChangedDuration = this.valueChangedRecentDuration;
        if (valueChangedDuration > 0) {
            const expiryTime = RevRecordSysTick.now() + valueChangedDuration;

            // console.debug(`addLoop: ${invalidatedRecordValues.length}`);
            for (const invalidatedRecordValue of invalidatedValues) {
                const { fieldIndex, typeId } = invalidatedRecordValue;
                if (typeId !== undefined) {
                    this.addValueChangeToRow(rowIndex, fieldIndex, typeId, expiryTime);
                }
            }
        }
    }

    processAllChanged(addChange: boolean) {
        // first delete all existing changes
        const rowCount = this._rows.length;
        const queue = this._expiryQueue;
        const queueLength = queue.length;
        for (let i = 0; i < queueLength; i++) {
            const change = queue[i];
            const rowIndex = change.rowIndex;
            // Note that row count may have changed
            if (rowIndex < rowCount) {
                const row = this._rows[rowIndex];
                RevRecordRow.clearRecentChanges(row);
            }
        }
        queue.length = 0;

        if (addChange) {
            const allChangedDuration = this.allChangedRecentDuration;
            if (allChangedDuration > 0) {
                const rows = this._rows;
                const expiryTime = RevRecordSysTick.now() + allChangedDuration;
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    const recentChange: RevRecordRowRecentChange = {
                        expiryTime,
                        typeId: RevRecordRecentChange.TypeId.Row,
                        recordRecentChangeTypeId: RevRecordRecentChangeTypeId.Insert,
                        rowIndex,
                    }
                    const row = rows[rowIndex];
                    row.recentChange = recentChange;
                    this.queueRecentChange(recentChange);
                }
            }
        }
    }

    processRecordInserted(rowIndex: number, addChange: boolean) {
        const queue = this._expiryQueue;
        const originalQueueCount = queue.length;

        // adjust existing row indexes
        for (let i = 0; i < originalQueueCount; i++) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex >= rowIndex) {
                change.rowIndex++;
            }
        }
        this.checkConsistency();

        if (addChange) {
            const recordInsertedDuration = this.recordInsertedRecentDuration;
            if (recordInsertedDuration > 0) {
                // add recentChange to new row
                const row = this._rows[rowIndex];
                const expiryTime = RevRecordSysTick.now() + recordInsertedDuration;
                const recentChange: RevRecordRowRecentChange = {
                    expiryTime,
                    typeId: RevRecordRecentChange.TypeId.Row,
                    recordRecentChangeTypeId: RevRecordRecentChangeTypeId.Insert,
                    rowIndex,
                }
                row.recentChange = recentChange;
                this.queueRecentChange(recentChange);
            }
        }
    }

    processRecordsInserted(rowIndex: number, count: number, addChanges: boolean) {
        // adjust existing row indexes
        this.processRowsInserted(rowIndex, count);

        if (addChanges) {
            const recordInsertedDuration = this.recordInsertedRecentDuration;
            if (recordInsertedDuration > 0) {
                // add recentChange to new rows
                const nextRangeIndex = rowIndex + count;
                const expiryTime = RevRecordSysTick.now() + recordInsertedDuration;
                for (let insertedRowIndex = rowIndex; insertedRowIndex < nextRangeIndex; insertedRowIndex++) {
                    const row = this._rows[insertedRowIndex];
                    const recentChange: RevRecordRowRecentChange = {
                        expiryTime,
                        typeId: RevRecordRecentChange.TypeId.Row,
                        recordRecentChangeTypeId: RevRecordRecentChangeTypeId.Insert,
                        rowIndex: insertedRowIndex,
                    }
                    row.recentChange = recentChange;
                    this.queueRecentChange(recentChange);
                }
            }
        }
    }

    processRowInserted(rowIndex: number) {
        const queue = this._expiryQueue;
        const queueLength = queue.length;

        for (let i = 0; i < queueLength; i++) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex >= rowIndex) {
                change.rowIndex++;
            }
        }
        this.checkConsistency();
    }

    processRowsInserted(rowIndex: number, count: number) {
        // adjust existing row indexes
        const queue = this._expiryQueue;
        const queueLength = queue.length;

        for (let i = 0; i < queueLength; i++) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex >= rowIndex) {
                change.rowIndex += count;
            }
        }
        this.checkConsistency();
    }

    processRowDeleted(rowIndex: number) {
        const queue = this._expiryQueue;
        for (let i = queue.length - 1; i >= 0; i--) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex === rowIndex) {
                queue.splice(i, 1);
            } else {
                if (changeRowIndex > rowIndex) {
                    change.rowIndex--;
                }
            }
        }
        this.checkConsistency();
    }

    processRowsDeleted(rowIndex: number, count: number) {
        const queue = this._expiryQueue;
        const nextRangeIndex = rowIndex + count;
        for (let i = queue.length - 1; i >= 0; i--) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex >= rowIndex && changeRowIndex < nextRangeIndex) {
                queue.splice(i, 1);
            } else {
                if (changeRowIndex >= nextRangeIndex) {
                    change.rowIndex -= count;
                }
            }
        }
        this.checkConsistency();
    }

    processAllRowsDeleted() {
        const queue = this._expiryQueue;
        queue.length = 0;
        this.cancelNextExpiryTimeout();
        this.checkConsistency();
    }

    processRowMoved(oldRowIndex: number, newRowIndex: number) {
        const queue = this._expiryQueue;
        const queueLength = queue.length;
        const newGreaterThanOld = newRowIndex > oldRowIndex;
        let lowerIndex: number;
        let higherIndex: number;
        if (newGreaterThanOld) {
            lowerIndex = oldRowIndex;
            higherIndex = newRowIndex;
        } else {
            lowerIndex = newRowIndex;
            higherIndex = oldRowIndex;
        }

        for (let i = 0; i < queueLength; i++) {
            const change = queue[i];
            const changeRowIndex = change.rowIndex;
            if (changeRowIndex === oldRowIndex) {
                change.rowIndex = newRowIndex;
            } else {
                if (changeRowIndex >= lowerIndex && changeRowIndex <= higherIndex) {
                    if (newGreaterThanOld) {
                        change.rowIndex--;
                    } else {
                        change.rowIndex++;
                    }
                }
            }
        }
        this.checkConsistency();
    }

    processPreReindex() {
        this.checkConsistency();
        const queue = this._expiryQueue;
        const queueLength = queue.length;
        for (let i = 0; i < queueLength; i++) {
            const change = queue[i];
            const rowIndex = change.rowIndex;
            const row = this._rows[rowIndex];
            RevRecordRow.clearRecentChanges(row);
            const recordIndex = this._recordRowMap.getRecordIndexFromRowIndex(rowIndex);
            // const recordIndex = this._rowLookup.getLeftIndex(rowIndex);
            if (recordIndex === undefined) {
                throw new RevRecordAssertError('RCPPRE75529', `${rowIndex}`);
            } else {
                change.rowIndex = recordIndex; // temporarily hold record index while resorting
            }
        }
    }

    processPostReindex(allRowsKept: boolean) {
        const queue = this._expiryQueue;
        const queueLength = queue.length;
        for (let i = queueLength - 1; i >= 0; i--) {
            const change = queue[i];
            const recordIndex = change.rowIndex; // was holding record index while rows were being sorted
            // const rowIndex = this._rowLookup.getRightIndex(recordIndex);
            const rowIndex = this._recordRowMap.getRowIndexFromRecordIndex(recordIndex);
            if (rowIndex === undefined) {
                if (allRowsKept) {
                    throw new RevRecordAssertError('RCPPROU75529', `${recordIndex}`);
                } else {
                    queue.splice(i, 1);
                }
            } else {
                change.rowIndex = rowIndex;
                const row = this._rows[rowIndex];
                switch (change.typeId) {
                    case RevRecordRecentChange.TypeId.Value: {
                        const valueChange = change as RevRecordValueRecentChange;
                        valueChange.rowIndex = rowIndex;
                        RevRecordRow.addValueRecentChange(row, valueChange);
                        break;
                    }
                    case RevRecordRecentChange.TypeId.Row: {
                        const rowChange = change as RevRecordRowRecentChange;
                        rowChange.rowIndex = rowIndex;
                        row.recentChange = rowChange;
                        break;
                    }
                    default:
                        const switchCompletenessTest: never = change.typeId;
                        throw new RevRecordAssertError('RCPPROD75529', `${switchCompletenessTest}`);
                }
            }
        }
        this.checkConsistency();
    }

    public checkConsistency() {
        if (this._beginMultipleChangesCount === 0) {
            const rows = this._rows;
            const queue = this._expiryQueue;
            const queueLength = queue.length;
            for (let i = 0; i < queueLength; i++) {
                const change = queue[i];
                const rowIndex = change.rowIndex;
                if (rowIndex < 0 || rowIndex >= this._rows.length) {
                    throw new RevRecordAssertError('RCCEC13000', `${rowIndex}`);
                }

                const row = rows[rowIndex];

                switch (change.typeId) {
                    case RevRecordRecentChange.TypeId.Value: {
                        const valueRecentChanges = row.valueRecentChanges;
                        if (valueRecentChanges === undefined) {
                            throw new RevRecordAssertError('RCCEC13001', `${rowIndex}`);
                        }

                        const valueChange = change as RevRecordValueRecentChange;
                        const index = valueRecentChanges.indexOf(valueChange);
                        if (index < 0) {
                            throw new RevRecordAssertError('RCCEC13002', `${rowIndex}`);
                        }
                        break;
                    }
                    case RevRecordRecentChange.TypeId.Row: {
                        if (row.recentChange !== change) {
                            throw new RevRecordAssertError('RCCEC13003', `${rowIndex}`);
                        }
                        break;
                    }
                    default:
                        const switchCompletenessTest: never = change.typeId;
                        throw new RevRecordAssertError('RCCEC75529', `${switchCompletenessTest}`);
                }
            }

            const rowCount = rows.length;
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const row = rows[rowIndex];

                const rowRecentChange = row.recentChange;
                if (rowRecentChange !== undefined) {
                    const index = this._expiryQueue.indexOf(rowRecentChange);
                    if (index < 0) {
                        throw new RevRecordAssertError('RCCEC13004', `${rowIndex}`);
                    }
                }

                const valueRecentChanges = row.valueRecentChanges;
                if (valueRecentChanges !== undefined) {
                    const valueRecentChangeCount = valueRecentChanges.length;
                    for (let i = 0; i < valueRecentChangeCount; i++) {
                        const valueRecentChange = valueRecentChanges[i];
                        const index = this._expiryQueue.indexOf(valueRecentChange);
                        if (index < 0) {
                            throw new RevRecordAssertError('RCCEC13005', `${rowIndex} ${i}`);
                        }
                    }
                }
            }
        }
    }

    private queueRecentChange(recentChange: RevRecordRecentChange) {
        let index = RevRecordArrayUtil.binarySearch(this._expiryQueue, recentChange, RevRecordSearchableRecentChange.compareExpiryTime);
        if (index < 0) {
            index = ~index;
        }
        this._expiryQueue.splice(index, 0, recentChange);
        this.ensureNextExpiryTimeoutActive(recentChange.expiryTime);
        this.checkConsistency();
    }

    private updateRecentChangeExpiryTime(recentChange: RevRecordRecentChange, newExpiryTime: RevRecordSysTick.Time) {
        const oldIndex = RevRecordArrayUtil.binarySearchWithDuplicates(this._expiryQueue, recentChange, RevRecordSearchableRecentChange.compareExpiryTime);
        if (oldIndex < 0) {
            throw new RevRecordAssertError('RCEMUET08832');
        } else {
            this._searchRecentChange.expiryTime = newExpiryTime;
            // Don't care about duplicates here - can insert anywhere amongst duplicates
            let newIndex = RevRecordArrayUtil.binarySearch(this._expiryQueue, this._searchRecentChange, RevRecordSearchableRecentChange.compareExpiryTime);
            if (newIndex < 0) {
                newIndex = ~newIndex;
            }

            if (newIndex > oldIndex) {
                newIndex--;
            }

            recentChange.expiryTime = newExpiryTime;

            if (newIndex !== oldIndex) {
                RevRecordArrayUtil.move(this._expiryQueue, oldIndex, newIndex);
            }
            this.checkConsistency();
        }
    }

    private processNextExpiryTimeout() {
        this._nextExpiryTimeoutHandle = undefined;

        const now = RevRecordSysTick.now();
        const count = this._expiryQueue.length;

        const _expiredCellPositions = new Array<RevRecordRecentChanges.ExpiredCellPosition>();
        const _expiredRowIndexes = new Array<RevRecordRecentChanges.ExpiredRowIndex>();
        let expiredCellChangeCount = 0;
        let expiredRowChangeCount = 0;

        for (let i = 0; i < count; i++) {
            const change = this._expiryQueue[i] as RevRecordRecentChange;
            if (change.expiryTime <= now) {
                switch (change.typeId) {
                    case RevRecordRecentChange.TypeId.Value: {
                        if (_expiredCellPositions.length === 0) {
                            _expiredCellPositions.length = count; // set to maximum possible
                        }
                        const cellChange = change as RevRecordValueRecentChange;
                        const fieldIndex = cellChange.fieldIndex;
                        const rowIndex = cellChange.rowIndex;
                        _expiredCellPositions[expiredCellChangeCount++] = [fieldIndex, rowIndex];
                        break;
                    }
                    case RevRecordRecentChange.TypeId.Row: {
                        if (_expiredRowIndexes.length === 0) {
                            _expiredRowIndexes.length = count; // set to maximum possible
                        }
                        const rowChange = change as RevRecordRowRecentChange;
                        const rowIndex = rowChange.rowIndex;
                        _expiredRowIndexes[expiredRowChangeCount++] = rowIndex;
                        break;
                    }
                    default:
                        const switchCompletenessTest: never = change.typeId;
                        throw new RevRecordAssertError('RCEHTD98833', `${switchCompletenessTest}`);
                }
            }
        }

        const expiredCount = expiredCellChangeCount + expiredRowChangeCount;
        if (expiredCount > 0) {
            this._expiryQueue.splice(0, expiredCount);
        }

        if (expiredCellChangeCount > 0 || expiredRowChangeCount > 0) {
            this.expireRecentChanges(_expiredCellPositions, expiredCellChangeCount, _expiredRowIndexes, expiredRowChangeCount);
            _expiredCellPositions.length = 0;
            _expiredRowIndexes.length = 0;
        }

        if (this._expiryQueue.length > 0) {
            const earliestTimeoutChange = this._expiryQueue[0];
            this.ensureNextExpiryTimeoutActive(earliestTimeoutChange.expiryTime);
        }
        this.checkConsistency();
    }

    private expireRecentChanges(
        expiredCellPositions: RevRecordRecentChanges.ExpiredCellPosition[],
        expiredCellCount: number,
        expiredRowIndexes: RevRecordRecentChanges.ExpiredRowIndex[],
        expiredRowCount: number
    ) {
        for (let i = 0; i < expiredRowCount; i++) {
            const rowIndex = expiredRowIndexes[i];
            const row = this._rows[rowIndex];
            row.recentChange = undefined;
        }
        // console.debug(`deleteLoop: ${expiredCellCount}`);
        for (let i = 0; i < expiredCellCount; i++) {
            const [fieldIndex, rowIndex] = expiredCellPositions[i];
            const row = this._rows[rowIndex];
            RevRecordRow.deleteValueRecentChange(row, fieldIndex);
            // console.debug(`delete: ${fieldIndex}, ${rowIndex}`);
        }

        this._expiredChangesHandler(expiredCellPositions, expiredCellCount, expiredRowIndexes, expiredRowCount);
    }

    private cancelNextExpiryTimeout() {
        if (this._nextExpiryTimeoutHandle !== undefined) {
            clearTimeout(this._nextExpiryTimeoutHandle);
            this._nextExpiryTimeoutHandle = undefined;
        }
    }

    private ensureNextExpiryTimeoutActive(nextExpiryTimeoutTime: RevRecordSysTick.Time) {
        if (this._nextExpiryTimeoutTargetTime > nextExpiryTimeoutTime) {
            this.cancelNextExpiryTimeout();
        }

        if (this._nextExpiryTimeoutHandle === undefined) {
            let duration = nextExpiryTimeoutTime - RevRecordSysTick.now();
            if (duration < 0) {
                duration = 0;
            }
            this._nextExpiryTimeoutHandle = setTimeout(() => this.processNextExpiryTimeout(), duration);
        }
    }

    private addValueChangeToRow(rowIndex: number, fieldIndex: RevRecordFieldIndex, changeTypeId: RevRecordValueRecentChangeTypeId, expiryTime: RevRecordSysTick.Time) {
        const row = this._rows[rowIndex];
        let recentChange = RevRecordRow.findRecentValueChange(row, fieldIndex);
        if (recentChange === undefined) {
            recentChange = {
                expiryTime,
                typeId: RevRecordRecentChange.TypeId.Value,
                valueRecentChangeTypeId: changeTypeId,
                fieldIndex,
                rowIndex,
            }
            // console.debug(`add: ${fieldIndex}, ${rowIndex}`);
            RevRecordRow.addValueRecentChange(row, recentChange);
            this.queueRecentChange(recentChange);
        } else {
            recentChange.valueRecentChangeTypeId = changeTypeId;
            this.checkConsistency();

            if (recentChange.expiryTime !== expiryTime) {
                // console.debug(`update: ${fieldIndex}, ${rowIndex}`);
                this.updateRecentChangeExpiryTime(recentChange, expiryTime);
            }
        }
    }
}

export namespace RevRecordRecentChanges {
    export type ExpiredCellPosition = [fieldIndex: number, rowIndex: number];
    export type ExpiredRowIndex = number;

    export type ExpiredChangesHandler = (this: void,
        expiredCellPositions: ExpiredCellPosition[], expiredCellCount: number,
        expiredRowIndexes: ExpiredRowIndex[], expiredRowCount: number
    ) => void;

    export type ExpiredEventer = (this: void,
        cellChanges: ExpiredCellPosition[] | undefined, cellChangeCount: number,
        rowChanges: ExpiredRowIndex[] | undefined, rowChangeCount: number
    ) => void;
}
