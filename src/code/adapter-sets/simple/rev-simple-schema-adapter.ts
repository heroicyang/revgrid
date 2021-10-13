import { AssertError, SchemaModel } from '../../grid/grid-public-api';

export class SchemaStaticAdapter implements SchemaModel {
    private _schemaCallbackListeners: SchemaModel.CallbackListener[] = [];
    private _columns = new Array<SchemaStaticAdapter.Column>();

    addSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        this._schemaCallbackListeners.push(listener)
    }

    removeSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        const idx = this._schemaCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('LMDMRSCL91364', 'LocalMainSchemaModel: SchemaCallbackListener not found');
        } else {
            this._schemaCallbackListeners.splice(idx, 1);
        }
    }

    reset(schema: SchemaStaticAdapter.Column[]) {
        this._columns = schema;
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     */
    getSchema(): readonly SchemaStaticAdapter.Column[] {
        return this._columns;
    }

    setSchema(schema: SchemaStaticAdapter.Column[]) {
        this._columns = schema;
        this._schemaCallbackListeners.forEach((listener) => listener.schemaChanged());
    }
}

export namespace SchemaStaticAdapter {
    export interface Column extends SchemaModel.Column {
        headers: string[];
    }
}
