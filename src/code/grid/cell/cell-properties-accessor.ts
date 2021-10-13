import { ColumnProperties } from '../column/column-properties';
import { MetaModel } from '../model/meta-model';
import { CellProperties } from './cell-properties';

export class CellPropertiesAccessor implements CellProperties {
    constructor(
        private readonly _cellOwnProperties: MetaModel.CellOwnProperties | undefined,
        private readonly _columnProperties: ColumnProperties
    ) {

    }

    get<T extends keyof ColumnProperties>(key: T): ColumnProperties[T];
    get(key: string | number): MetaModel.CellOwnProperty;
    get<T extends keyof ColumnProperties>(key: string | number | T) {
        let result: MetaModel.CellOwnProperty | undefined;
        if (this._cellOwnProperties !== undefined && this._cellOwnProperties !== null) {
            result = this._cellOwnProperties[key as string | number];
        }
        if (result === undefined) {
            result = this._columnProperties[key as T];
        }
        return result;
    }
}
