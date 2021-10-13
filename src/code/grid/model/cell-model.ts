import { CellEditor } from '../cell-editor/cell-editor';
import { CellPainter } from '../cell-painter/cell-painter';
import { BeingPaintedCell } from '../cell/being-painted-cell';
import { CellEvent } from '../cell/cell-event';
import { CellPaintConfig } from '../renderer/cell-paint-config';

/** @public */
export interface CellModel {
    getCellPaintConfig?: (this: void, beingPaintedCell: BeingPaintedCell) => CellPaintConfig | undefined;

    /**
     * @method DataModel#getCell
     * @summary Renderer configuration interceptor.
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation ({@link module:hooks.getCell}).
     *
     * #### Description
     *
     * This method is a hook called on every cell just prior to rendering and is intended to be overridden.
     *
     * The first parameter to this method, `config`, Please refer to the {@link renderConfig} object for details. Most of the properties on this object can be overridden programmatically in this method. Properties typically overridden include {@link module:defaults.renderer renderer}, {@link module:defaults.editor editor}, {@link module:defaults.format format}, and the various permutations of {@link module:defaults.font font}, {@link module:defaults.color color}, and {@link module:defaults.halign halign}.
     *
     * Your override will be called with the data model as it's execution context (the `this` value).
     *
     * The only requirement for this method (or its override) is to return a reference to an instantiated cell renderer, which is all the default implementation does. This is typically the renderer whose name is in the {@link module:defaults.renderer config.renderer}, property (assumed to be a "registered" cell renderer). It doesn't have to be that cell renderer, however; and any object with a `paint` method will do.
     *
     * #### IMPORTANT CAVEAT!!
     *
     * Although this hook was designed to be overridden, adding lots (or any, really) programmatic logic to be executed on every cell, on every render, is _expensive_ in terms of performance, and doing so should only be a last resort.
     *
     * As Hypergrid has evolved, many properties have been added including row and cell properties, which can accomplish much that was previously impossible without overrideing `getCell`. For example, you can now select a formatter and a renderer simply by setting a column's (or row's) (or cell's) `format` or `renderer` property.
     *
     * Overriding `getCell` still has great facility when the rendering needs to be a function of the data values, but other than that, every effort should be made to avoid overriding `getCell` whenever possible.
     *
     * #### Parameters:
     * @param gridPainterKey - Same as `config.renderer`, the proposed cell renderer name.
     * @returns An instantiated cell painter.
     */
    getCellPainter?: (this: void, cellPaintConfig: CellPaintConfig, gridPainterKey: string) => CellPainter | undefined;

    /**
     * @method DataModel#getCellEditorAt
     * @summary Instantiate a new cell editor.
     * @desc _IMPLEMENTATION OF THIS METHOD IS OPTIONAL._
     * If your data model does not implement this method, {@link Local#resetDataModel} adds the default implementation ({@link module:hooks.getCellEditorAt}).
     *
     * #### Description
     *
     * The application developer may override this method to:
     * * Instantiate and return an arbitrary cell editor. The generic implementation here simply returns the declared cell editor. This is `undefined` when there was no such declaration, or if the named cell editor was not registered.
     * * Return `undefined` for no cell editor at all. The cell will not be editable.
     * * Set properties on the instance by passing them in the `options` object. These are applied to the new cell editor object after instantiation but before rendering.
     * * Manipulate the cell editor object (including its DOM elements) after rendering but before DOM insertion.
     *
     * Overriding this method with a null function (that always returns `undefined`) will have the effect of making all cells uneditable.
     *
     * The only requirement for this method (or its override) is to return a reference to an instantiated cell editor, which is all the default implementation does. This is typically the cell editor whose name is in the {@link module:defaults.editor config.editor} property (assumed to be a "registered" cell editor). It doesn't have to be that cell editor, however; any object conforming to the CellEditor interface will do.
     *
     * #### Parameters:
     *
     * @param {number} columnIndex - Absolute column index. I.e., the position of the column in the data source's original `fields` array, as echoed in `behavior.allColumns[]`.
     *
     * @param {number} rowIndex - Row index of the data row in the current list of rows, regardless of vertical scroll position, offset by the number of header rows (all the rows above the first data row including the filter row). I.e., after subtracting out the number of header rows, this is the position of the data row in the `index` array of the data source (i.e., the last data source pipeline).
     *
     * @param {string} editorName - The proposed cell editor name (from the render properties).
     *
     * @param {CellEvent} cellEvent - All enumerable properties of this object will be copied to the new cell editor object for two purposes:
     * * Used in cell editor logic.
     * * For access from the cell editor's HTML template (via mustache).
     *
     * Developer's override of this method may add custom properties, for the purposes listed above.
     *
     * Hypergrid adds the following properties, required by {@link CellEditor}:
     * * **`.format`** - The cell's `format` render prop (name of localizer to use to format the editor preload and parse the edited value). May be `undefined` (no formatting or parsing). Added by calling {@link Column#getCellEditorAt|getCellEditorAt} method. Developer's override is free to alter this property.
     * **`.column`** ({@link Column} object), the only enumerable property of the native `CellEvent` object. Read-only.
     *
     * > Note: The `editPoint` property formerly available to cell editors in version 1 has been deprecated in favor of `cellEvent.gridCell`.
     *
     * @returns {undefined|CellEditor} An object instantiated from the registered cell editor constructor named in `editorName`. A falsy return means the cell is not editable because the `editorName` was not registered.
     */
    getCellEditorAt?: (this: void, columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent) => CellEditor | undefined;
}

/** @public */
export namespace CellModel {
    export type Constructor = new () => CellModel;
}
