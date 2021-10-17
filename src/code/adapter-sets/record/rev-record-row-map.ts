import { RevRecord } from './rev-record';
import { RevRecordArrayUtil } from './rev-record-array-utils';
import { RevRecordAssertError } from './rev-record-error';
import { RevRecordRow } from './rev-record-row';
import { RevRecordIndex } from './rev-record-types';

export class RevRecordRowMap {
    readonly records = new Array<RevRecord>();
    readonly rows = new Array<RevRecordRow>();

    clear() {
        this.records.length = 0;
        this.rows.length = 0;
    }

    getRecordFromRowIndex(rowIndex: number) {
        return this.rows[rowIndex].record;
    }

    getRecordIndexFromRowIndex(rowIndex: number) {
        return this.rows[rowIndex].record.index;
    }

    getRowIndexFromRecordIndex(recordIndex: RevRecordIndex) {
        const row = this.records[recordIndex].__row;
        if (row === undefined) {
            return undefined;
        } else {
            return row.index;
        }
    }

    hasRecord(record: RevRecord) {
        const recordIndex = record.index;
        if (recordIndex >= this.records.length) {
            return false;
        } else {
            // got this record if it matches entry at recordIndex
            return this.records[recordIndex] === record;
        }
    }

    insertRecord(record: RevRecord) {
        this.records.splice(record.index, 0, record);
        const row = record.__row;
        if (row !== undefined) {
            const rowIndex = row.index;
            this.rows.splice(rowIndex, 0, row);
            this.reindexRows(rowIndex + 1);
        }
    }

    insertRecordsButNotRows(recordIndex: RevRecordIndex, records: RevRecord[]) {
        this.records.splice(recordIndex, 0, ...records);
    }

    removeRecord(recordIndex: RevRecordIndex) {
        const row = this.records[recordIndex].__row;
        this.records.splice(recordIndex, 1);
        if (row === undefined) {
            return undefined;
        } else {
            const rowIndex = row.index;
            this.rows.splice(rowIndex, 1);
            this.reindexRows(rowIndex);
            return rowIndex;
        }
    }

    removeRecordsButNotRows(recordIndex: RevRecordIndex, count: number) {
        this.records.splice(recordIndex, count);
    }

    insertRow(row: RevRecordRow) {
        const rowIndex = row.index;
        this.rows.splice(rowIndex, 0, row);
        row.record.__row = row;
        this.reindexRows(rowIndex + 1);
    }

    insertRowRangeButIgnoreRecords(rowIndex: number, rows: RevRecordRow[], rangeStartIndex: number, rangeExclusiveEndIndex: number) {
        this.rows.splice(rowIndex, 0, ...rows.slice(rangeStartIndex, rangeExclusiveEndIndex));
        this.reindexRows(rowIndex + (rangeExclusiveEndIndex - rangeStartIndex));
    }

    deleteRow(rowIndex: number) {
        const row = this.rows[rowIndex];
        const record = row.record;
        record.__row = undefined;
        this.rows.splice(rowIndex, 1);
        this.reindexRows(rowIndex);
    }

    deleteRowsButIgnoreRecords(rowIndex: number, count: number) {
        this.rows.splice(rowIndex, count);
        this.reindexRows(rowIndex);
    }

    moveRow(oldIndex: number, newIndex: number) {
        const rows = this.rows;
        const oldIndexRow = rows[oldIndex];
        if (newIndex > oldIndex) {
            for (let i = oldIndex; i < newIndex; i++) {
                const row = rows[i + 1]
                rows[i] = row;
                row.index = i;
            }
            rows[newIndex] = oldIndexRow;
            oldIndexRow.index = newIndex;
        } else {
            if (newIndex < oldIndex) {
                for (let i = oldIndex; i > newIndex; i--) {
                    const row = rows[i - 1];
                    rows[i] = row;
                    row.index = i;
                }
                rows[newIndex] = oldIndexRow;
                oldIndexRow.index = newIndex;
            }
        }
    }

    findInsertRowIndex(recordIndex: RevRecordIndex) {
        const records = this.records;
        const recordCount = records.length;
        if (recordIndex >= recordCount) {
            return this.rows.length;
        } else {
            let record = records[recordIndex];
            let row = record.__row;
            if (row !== undefined) {
                return row.index;
            } else {
                // Search for either previous or next record with a row.
                // Search in direction in which there are least number of records
                const midIndex = recordCount / 2.0;
                if (recordIndex >= midIndex) {
                    if (recordCount > 500) {
                        // It is likely that some earlier/lower records have already got rows while those after mid do not
                        // Try a portion of the lower range first
                        const lowerRangeStart = recordIndex -  recordCount / 20.0;
                        for (let i = recordIndex - 1; i > lowerRangeStart; i--) {
                            record = records[i];
                            row = record.__row;
                            if (row !== undefined) {
                                return row.index + 1;
                            }
                        }
                    }
                    for (let i = recordIndex + 1; i < recordCount; i++) {
                        record = records[i];
                        row = record.__row;
                        if (row !== undefined) {
                            return row.index;
                        }
                    }
                    return this.rows.length;
                } else {
                    for (let i = recordIndex - 1; i >= 0; i--) {
                        record = records[i];
                        row = record.__row;
                        if (row !== undefined) {
                            return row.index + 1;
                        }
                    }
                    return 0;
                }
            }
        }
    }

    binarySearchRows(row: RevRecordRow, comparer: RevRecordRow.Comparer) {
        return RevRecordArrayUtil.binarySearch(this.rows, row, comparer)
    }

    sortRows(comparer: RevRecordRow.Comparer) {
        this.rows.sort(comparer);
        this.reindexAllRows();
    }

    reindexAllRows() {
        this.reindexRows(0);
    }

    checkConsistency() {
        const rows = this.rows;
        const rowCount = rows.length;
        for (let i = 0; i < rowCount; i++) {
            const row = rows[i];
            if (row.index !== i) {
                throw new RevRecordAssertError('RRMCC31001');
            } else {
                const record = row.record;
                if (record === undefined) {
                    throw new RevRecordAssertError('RRMCC31002');
                } else {
                    if (record.__row !== row) {
                        throw new RevRecordAssertError('RRMCC31003');
                    }
                }
            }
        }

        const records = this.records;
        const recordCount = records.length;
        for (let i = 0; i < recordCount; i++) {
            const record = records[i];
            if (record.index !== i) {
                throw new RevRecordAssertError('RRMCC31005');
            } else {
                const row = record.__row;
                if (row !== undefined) {
                    if (row.record !== record) {
                        throw new RevRecordAssertError('RRMCC31006');
                    }
                }
            }
        }
    }

    private reindexRows(fromIndex: number) {
        const count = this.rows.length;
        for (let i = fromIndex; i < count; i++) {
            this.rows[i].index = i;
        }
    }
}

