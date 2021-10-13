import { DataModel } from '../../grid/grid-public-api';
import { RevRecordRow } from './rev-record-row';

/** @public */
export interface RevRecord {
    index: number;
    __row?: RevRecordRow;
}

/** @public */
export interface RevRecordData extends RevRecord {
    data: DataModel.DataRow;
}
