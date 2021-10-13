
import { CellEditor } from './cell-editor';

/**
 * As of spring 2016:
 * Functions well in Chrome and Firefox; unimplemented in Safari.
 * @constructor
 * @extends CellEditor
 */
export class Color extends CellEditor {
    template = '<input type="color" lang="{{locale}}" style="{{style}}">'
}

export namespace Color {
    export const typeName = 'Color';
}
