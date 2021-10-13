/** @public */
export abstract class RevgridError extends Error {
    constructor(public readonly code: string, message: string | undefined, baseMessage: string) {
        super(`Revgrid Error: ${code}: ${message === undefined ? baseMessage : `${baseMessage}: ${message}`}`);
    }
}

/** @public */
export class AssertError extends RevgridError {
    constructor(code: string, message?: string) {
        super(code, message, 'Assert');
    }
}

/** @public */
export class UnreachableCaseError extends RevgridError {
    constructor(code: string, value: never) {
        super(code, `"${value}"`, 'Unreachable case');
    }
}

/** @public */
export class OptionsError extends RevgridError {
    constructor(code: string, message?: string) {
        super(code, message, 'Options');
    }
}
