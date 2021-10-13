import { DataModel, SchemaModel } from '../dist/types/public-api';
import { SchemaAdapter } from './schema-adapter';

export class HeaderDataAdapter implements DataModel {
    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaModel.Column) {
        return (schemaColumn as SchemaAdapter.Column).header;
    }
}
