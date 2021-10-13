import { RevgridError } from '../../grid/grid-public-api';

/** @public */
export abstract class RevRecordError extends RevgridError {
    constructor(code: string, message: string | undefined, baseMessage: string) {
        super(code, message, 'Record ' + baseMessage);
    }
}

/** @public */
export abstract class RevRecordInternalError extends RevRecordError {

}

/** @public */
export class RevRecordUnexpectedUndefinedError extends RevRecordInternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'Unexpected Undefined');
    }
}

/** @public */
export class RevRecordAssertError extends RevRecordInternalError {
    constructor(code: string, message?: string) {
        super(code, message, 'Assert');
    }
}

/** @public */
export class RevRecordUnreachableCaseError extends RevRecordInternalError {
    constructor(code: string, value: never) {
        super(code, `"${value}"`, 'Unreachable case');
    }
}

/** @public */
export abstract class RevRecordExternalError extends RevRecordError {

}

/** @public */
export class RevRecordSchemaError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'Schema');
    }
}

/** @public */
export class RevRecordDataError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'Data');
    }
}

/** @public */
export class RevRecordRowError extends RevRecordExternalError {
    constructor(code: string, message: string) {
        super(code, message, 'RecordRow');
    }
}
