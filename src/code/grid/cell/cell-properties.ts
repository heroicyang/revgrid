import { ColumnProperties } from '../column/column-properties';
import { MetaModel } from '../model/meta-model';

export interface CellProperties {
    get<T extends keyof ColumnProperties>(key: T): ColumnProperties[T];
    get(key: string | number): MetaModel.CellOwnProperty;
}
