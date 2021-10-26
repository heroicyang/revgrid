import { SchemaModel } from '../../grid/grid-public-api';
import { RevRecordSchemaError, RevRecordUnexpectedUndefinedError } from './rev-record-error';
import { RevRecordField } from './rev-record-field';
import { RevRecordStore } from './rev-record-store';
import { RevRecordFieldIndex } from './rev-record-types';

/** @public */
export class RevRecordFieldAdapter implements SchemaModel, RevRecordStore.FieldsEventers {
    private readonly _schema: RevRecordField.SchemaColumn[] = [];
    private readonly _fields: RevRecordField[] = [];
    private readonly _fieldNameLookup = new Map<string, RevRecordField>();
    private readonly _fieldIndexLookup = new Map<RevRecordField, RevRecordFieldIndex>();
    private readonly _fieldValueDependsOnRecordIndexFieldIndexes: RevRecordFieldIndex[] = [];
    private readonly _fieldValueDependsOnRowIndexFieldIndexes: RevRecordFieldIndex[] = [];

    private _callbackListener: SchemaModel.CallbackListener;
    private _recordStoreEventersSet = false;

    get schema(): readonly RevRecordField.SchemaColumn[] { return this._schema }
    get fieldCount(): number { return this._fields.length; }
    get fields(): readonly RevRecordField[] { return this._fields; }

    constructor(private readonly _recordStore: RevRecordStore) {
    }

    addSchemaCallbackListener(value: SchemaModel.CallbackListener): void {
        this._callbackListener = value;
        if (!this._recordStoreEventersSet) {
            this._recordStore.setFieldEventers(this);
            this._recordStoreEventersSet = true;
        }
    }

    addField(field: RevRecordField, header: string): RevRecordField.SchemaColumn {
        const fieldIndex = this._fields.length;

        this._fieldIndexLookup.set(field, fieldIndex);
        this._fieldNameLookup.set(field.name, field);
        this._fields.push(field);

        if (field.valueDependsOnRecordIndex) {
            if (!this._fieldValueDependsOnRecordIndexFieldIndexes.includes(fieldIndex)) {
                this._fieldValueDependsOnRecordIndexFieldIndexes.push(fieldIndex);
            }
        }

        if (field.valueDependsOnRowIndex) {
            if (!this._fieldValueDependsOnRowIndexFieldIndexes.includes(fieldIndex)) {
                this._fieldValueDependsOnRowIndexFieldIndexes.push(fieldIndex);
            }
        }

        // Update Hypergrid Schema
        const schemaColumn: RevRecordField.SchemaColumn = {
            name: field.name,
            index: fieldIndex,
            header,
        };

        this._schema.push(schemaColumn);

        this._callbackListener.columnsInserted(fieldIndex, 1);

        return schemaColumn;
    }

    addFields(fields: RevRecordField[]): RevRecordFieldIndex {
        if (fields.length <= 0) {
            throw new RevRecordSchemaError('FSMAF26774', 'No fields provided');
        } else {

            let firstIndex: RevRecordFieldIndex;
            this.beginChange();
            try {
                const firstField = fields[0];
                firstIndex = this.addField(firstField, firstField.name).index;

                for (let index = 1; index < fields.length; index++) {
                    const field = fields[index];
                    this.addField(field, field.name);
                }

            } finally {
                this.endChange();
            }

            return firstIndex;
        }
    }

    beginChange(): void {
        this._callbackListener.beginChange();
    }

    endChange(): void {
        this._callbackListener.endChange();
    }

    getActiveSchemaColumns() {
        return this._callbackListener.getActiveSchemaColumns() as RevRecordField.SchemaColumn[];
    }

    getColumnCount(): number {
        return this._fields.length;
    }

    getField(fieldIndex: RevRecordFieldIndex): RevRecordField {
        if (fieldIndex < 0 || fieldIndex >= this._fields.length) {
            throw new RevRecordSchemaError('FSMGF74330', 'Field Index out of range');
        } else {
            return this._fields[fieldIndex];
        }
    }

    getFieldByName(fieldName: string): RevRecordField {
        const field = this._fieldNameLookup.get(fieldName);

        if (field === undefined) {
            throw new RevRecordUnexpectedUndefinedError('FSMGFBN98821');
        } else {
            return field;
        }
    }

    getFieldIndex(field: RevRecordField): RevRecordFieldIndex {
        const fieldIndex = this._fieldIndexLookup.get(field);

        if (fieldIndex === undefined) {
            throw new RevRecordSchemaError('FSMGFI03382', 'Field not found');
        }

        return fieldIndex;
    }

    getFieldIndexByName(fieldName: string): RevRecordFieldIndex {
        const field = this._fieldNameLookup.get(fieldName);
        if (field === undefined) {
            throw new RevRecordUnexpectedUndefinedError('DMIGFIF22288');
        } else {
            const index = this._fieldIndexLookup.get(field)
            if (index === undefined) {
                throw new RevRecordUnexpectedUndefinedError('DMIGFII22288');
            } else {
                return index;
            }
        }
    }

    getFieldNames(): string[] {
        return this._fields.map((field) => field.name);
    }

    getFilteredFields(filterCallback: (field: RevRecordField) => boolean): RevRecordField[] {
        return this._fields.filter((field) => filterCallback(field));
    }

    getFieldValueDependsOnRecordIndexFieldIndexes() {
        return this._fieldValueDependsOnRecordIndexFieldIndexes;
    }

    getSchema(): readonly SchemaModel.Column[] {
        return this._schema;
    }

    hasField(name: string): boolean {
        return this._fieldNameLookup.has(name);
    }

    reset(): void {
        if (this._schema.length > 0) {
            this._fieldIndexLookup.clear();
            this._fields.length = 0;
            this._schema.length = 0;
            this._callbackListener.allColumnsDeleted();
        }
    }

    setFieldHeader(fieldOrIndex: RevRecordFieldIndex | RevRecordField, header: string): number {
        const fieldIndex = typeof fieldOrIndex === 'number' ? fieldOrIndex : this.getFieldIndex(fieldOrIndex);
        const columnSchema = this._schema[fieldIndex];
        columnSchema.header = header;
        return fieldIndex;
    }
}
