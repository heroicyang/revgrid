import { AssertError, DataModel } from '../../grid/grid-public-api';
import { HeaderSimpleAdapter } from './rev-simple-header-adapter';
import { MainSimpleAdapter } from './rev-simple-main-adapter';
import { SchemaStaticAdapter } from './rev-simple-schema-adapter';

/** @public */
export class SimpleAdapter {
    private _schemaAdapter = new SchemaStaticAdapter();
    private _mainAdapter = new MainSimpleAdapter();
    private _headerAdapter = new HeaderSimpleAdapter();

    get schemaAdapter() { return this._schemaAdapter; }
    get mainAdapter() { return this._mainAdapter; }
    get headerAdapter() { return this._headerAdapter; }


    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * @param data - Array of congruent uniform objects containing the grid data and possibly also header rows.
     * @param headerRowCount - Number of Header rows. If greater than 0, then the initial rows in data actually contain headers. They
     * should be stripped from data and included in header. If less than 0, then there should be one header row and the header values
     * should be derived from column names in data.
     */
    setData(data: SimpleAdapter.DataRow[] | (() => SimpleAdapter.DataRow[]), headerRowCount = -1) {
        if (data === undefined) {
            return;
        } else {
            let dataRows = typeof data === 'function' ? data() : data;

            if (!Array.isArray(dataRows)) {
                throw new AssertError('BSD73766', 'Expected data to be an array of data row objects');
            } else {
                let schema: SchemaStaticAdapter.Column[];
                if (headerRowCount < 0) {
                    schema = this.calculateSchemaFromData(dataRows, true);
                } else {
                    if (headerRowCount === 0) {
                        schema = this.calculateSchemaFromData(dataRows, false);
                    } else {
                        ({ schema, dataRows } = this.extractSchemaAndHeadersFromData(dataRows, headerRowCount));
                    }
                }

                if (schema === []) {
                    headerRowCount = 0;
                } else {
                    headerRowCount = schema[0].headers.length;
                }

                this._mainAdapter.beginDataChange();
                try {
                    this._schemaAdapter.reset(schema);
                    this._headerAdapter.reset(headerRowCount);
                    this._mainAdapter.reset(dataRows);
                } finally {
                    this._mainAdapter.endDataChange();
                }
            }
        }
    }

    private extractSchemaAndHeadersFromData(
        rows: SimpleAdapter.DataRow[],
        headerRowCount: number
    ): ExtractSchemaAndHeadersFromDataResult {
        const { rows: headerRows, sourceCount: initialSourceCount } = this.getInitialDefinedRows(rows, headerRowCount);
        const headerCount = headerRows.length;
        if (headerCount === 0) {
            return {
                dataRows: [],
                schema: [],
            };
        } else {
            const dataRows = rows.splice(0, initialSourceCount);
            const firstHeaderRow = headerRows[0];
            const columnKeys = Object.keys(firstHeaderRow);

            const columnCount = columnKeys.length;
            const schema = new Array<SchemaStaticAdapter.Column>(columnCount);
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const columnKey = columnKeys[columnIndex];
                const columnHeaders = new Array<string>(headerCount);
                for (let rowIndex = 0; rowIndex < headerCount; rowIndex++) {
                    const row = headerRows[rowIndex];
                    let header = row[columnKey];
                    if (typeof header !== 'string') {
                        header = columnKey;
                    }
                    columnHeaders[rowIndex] = header as string; // should not need this cast
                }
                schema[columnIndex] = { name: columnKey, index: columnIndex, headers: columnHeaders };
            }

            return {
                dataRows,
                schema,
            };
        }
    }

    private calculateSchemaFromData(dataRows: SimpleAdapter.DataRow[], keyIsHeader: boolean): SchemaStaticAdapter.Column[] {
        const { rows } = this.getInitialDefinedRows(dataRows, 1);
        if (rows.length === 0) {
            return [];
        } else {
            const row = rows[0];
            const result = Object.keys(row).map((key, index) => ({ name: key, index, headers: keyIsHeader ? [key] : [] }));
            return result;
        }
    }

    /**
     * @summary Find initial defined elements in rows.
     * @param maxCount - the maximum number of initial rows to return
     * @returns The initial rows (up to maxCount) and the number of source rows these covered (may be more
     * than max count if some rows are undefined).
     */
    getInitialDefinedRows(sourceRows: SimpleAdapter.DataRow[], maxCount: number): GetInitialDefinedRowsResult {
        const rows = new Array<SimpleAdapter.DataRow>(maxCount);

        const sourceCount = sourceRows.length;
        let initialCount = 0;
        for (let i = 0; i < sourceCount; i++) {
            const row = sourceRows[i];
            if (row === undefined) {
                rows[initialCount++] = row;
                if (initialCount === maxCount) {
                    return {
                        rows,
                        sourceCount: i + 1,
                    }
                }
            }
        }

        rows.length = initialCount;
        return {
            rows,
            sourceCount,
        }
    }
}

/** @public */
export namespace SimpleAdapter {
    export interface DataRow extends MainSimpleAdapter.DataRow {
        [columnName: string]: DataModel.DataValue | string; // can also have header
    }
}

interface ExtractSchemaAndHeadersFromDataResult {
    schema: SchemaStaticAdapter.Column[];
    dataRows: SimpleAdapter.DataRow[];
}

interface GetInitialDefinedRowsResult {
    rows: SimpleAdapter.DataRow[];
    sourceCount: number;
}
