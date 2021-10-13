
import { GridProperties } from './grid-properties';
import { AssertError } from './lib/revgrid-error';
import { HorizontalWheelScrollingAllowed, TextTruncateType } from './lib/types';
import { SchemaModel } from './model/schema-model';

/**
 * This module lists the properties that can be set on a {@link Hypergrid} along with their default values.
 * Edit this file to override the defaults.
 */

/** @public */
export const defaultGridProperties: Required<GridProperties> = {

    /**
     * @summary The global theme name.
     * @default
     * @type {string}
     */
    themeName: 'default',

    /**
     * The default message to display in front of the canvas when there are no grid rows.
     * Format is HTML.
     * @default
     * @type {string}
     */
    noDataMessage: '',

    /**
     * Multiplier for horizontal mouse wheel movement, applied to values of [`WheelEvent#deltaX`](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaX) (received by the horizontal scrollbar's listener).
     *
     * #### Caveat
     * Wheel granularity depends on the OS, the input device, and possibly the browser. Any setting you choose will work differently in different environments. If you don't know the user's environment, it is probably best to give users control of this setting so they can fine tune it themselves.
     *
     * #### Default values
     * This particular default value of `0.01` seems to work well on the MacBook Pro trackpad. It's slower than it was, which will greatly improve the scrolling experience since column scrolling often occurred inadvertently when the intent was to scroll in the veritcal direction only.
     *
     * Be aware however that the trackpad scrolling speed can be adjusted by the Mac user at the OS level (System Preferences -> Accessibility -> Mouse & Trackpad -> Trackpad Options… -> Scrolling speed).
     *
     * Hint: You can tell if the user is using a trackpad by listening for any deltaX (since a simple mouse wheel is deltaY only); and what OS by checking user agent.
     * @default
     * @type {number}
     */
    wheelHFactor: 0.01,

    /**
     * Multiplier for vertical mouse wheel movement, applied to values of [`WheelEvent#deltaY`](https://developer.mozilla.org/docs/Web/API/WheelEvent/deltaY) (received by the vertical scrollbar's listener).
     *
     * #### Caveat
     * Wheel granularity depends on the OS, the input device, and possibly the browser. Any setting you choose will work differently in different environments. If you don't know the user's environment, it is probably best to give users control of this setting so they can fine tune it themselves.
     *
     * #### Default values
     * This particular default value of `0.05` is a compromise. It seems to work well on the MacBook Pro trackpad; and works acceptably (though differently) with a mouse wheel on both Mac OS and Windows.
     *
     * Be aware however that the trackpad scrolling speed can be adjusted by the Mac user at the OS level (System Preferences -> Accessibility -> Mouse & Trackpad -> Trackpad Options… -> Scrolling speed). Mouse wheel scrolling speed is also adjustable ( _yada yada_ -> Mouse Options… -> Scrolling speed; or on Windows search for "Change mouse wheel settings" in the Start menu).
     *
     * This default setting of `0.05` feels good on trackpad (2-finger drag). It's much slower than it was, but the way it was before was way to coarse and fast, scrolling hundreds of rows in a flash.
     *
     * With this setting, a mouse connected to a Mac, the wheel requires 5 click-stops to scroll 1 row; the same mouse connected to Windows scrolls 5 rows per click-stop. (However, I may have changed the default settings on my machines; not sure.)
     *
     * On Windows, the original multiplier setting (_i.e.,_ `1.0`) scrolled 100 grid rows on a single mouse wheel click-stop; the new default (`0.05`) scrolls 5 rows per click-stop. It stands to reason therefore that a setting of `0.01` will scroll 1:1 (1 row per 1 click-stop).
     *
     * #### Hint
     * You can tell if the user is using a trackpad by listening for any deltaX (since a simple mouse wheel is deltaY only); and what OS by checking user agent.
     * @default
     * @type {number}
     */
    wheelVFactor: 0.05,

    /**
     * @summary List of subgrids by
     * @desc Restrict usage here to strings (naming data models) or arrays consisting of such a string + constructor arguments. That is, avoid {@link subgridSpec}'s function and object overloads and {@link subgridConstructorRef} function overload.
     */
    adapterSet: {
        schemaModel: undefined as SchemaModel,
        subgrids: [],
    },

    /**
     * The font for data cells.
     * @default
     * @type {cssFont}
     */
    font: '13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for data cells.
     * @default
     * @type {string}
     */
    color: 'rgb(25, 25, 25)',

    /**
     * Background color for data cells.
     * @default
     * @type {string}
     */
    backgroundColor: 'rgb(241, 241, 241)',

    /**
     * Font style for selected cell(s).
     * @default
     * @type {string}
     */
    foregroundSelectionFont: 'bold 13px Tahoma, Geneva, sans-serif',

    /**
     * Font color for selected cell(s).
     * @default
     * @type {string}
     */
    foregroundSelectionColor: 'rgb(0, 0, 128)',
    /**
     * Background color for selected cell(s).
     * @default
     * @type {string}
     */
    backgroundSelectionColor: 'rgba(147, 185, 255, 0.625)',


    /********** SECTION: COLUMN HEADER COLORS **********/

    // IMPORTANT CAVEAT: The code is inconsistent regarding the terminology. Is the "column header" section _the row_ of cells at the top (that act as headers for each column) or is it _the column_ of cells (that act as headers for each row)? Oh my.

    /**
     * @default
     * @type {cssFont}
     */
    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     */
    columnHeaderColor: 'rgb(25, 25, 25)',

    /**
     * Font style for selected columns' headers.
     * @default
     * @type {string}
     */
    columnHeaderForegroundSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',

    /**
     * @default
     * @type {cssColor}
     */
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',
    columnHeaderForegroundSelectionColor: 'rgb(80, 80, 80)',
    columnHeaderBackgroundSelectionColor: 'rgba(255, 220, 97, 0.45)',
    columnHeaderHalign: 'center',
    columnHeaderCellPainter: 'SimpleCell',
    /** There is no standard format called "header"; unless defined, defaults to "string" (pass-thru formatter). */
    columnHeaderFormat: 'header',
    backgroundColor2: 'rgb(201, 201, 201)',
    filterFont: '12px Tahoma, Geneva, sans-serif',
    filterColor: 'rgb(25, 25, 25)',
    filterBackgroundColor: 'white',
    filterForegroundSelectionColor: 'rgb(25, 25, 25)',
    filterBackgroundSelectionColor: 'rgb(255, 220, 97)',
    filterHalign: 'center',
    filterCellPainter: 'SimpleCell',
    filterEditor: 'TextField',
    filterable: true,
    showFilterRow: false,
    voffset: 0,
    scrollHorizontallySmoothly: false,
    scrollbarHoverOver: 'visible',
    scrollbarHoverOff: 'hidden',
    scrollingEnabled: true,
    horizontalWheelScrollingAllowed: HorizontalWheelScrollingAllowed.CtrlKeyDown,
    vScrollbarClassPrefix: '',
    hScrollbarClassPrefix: '',

    /**
     * Horizontal alignment of each cell as interpreted by it's cell renderer.
     */
    halign: 'center',

    /**
     * Padding to left and right of cell value.
     *
     * NOTE: Right padding may not be visible if column is not sized wide enough.
     *
     * See also {@link module:defaults.iconPadding|iconPadding}.
     * @default
     * @type {number}
     */
    cellPadding: 5,

    /**
     * Padding to left and right of cell icons.
     *
     * Overrides {@link module:defaults.cellPadding|cellPadding}:
     * * Left icon + `iconPadding` overrides left {@link module:defaults.cellPddingg|cellPddingg}.
     * * Right icon + `iconPadding` overrides right {@link module:defaults.cellPddingg|cellPddingg}.
     * {@link module:defaults.leftIcon|leftIcon}
     * {@link module:defaults.centerIcon|centerIcon}
     * {@link module:defaults.rightIcon|rightIcon}
     * @default
     * @type {number}
     */
    iconPadding: 3,

    /**
     * @summary Name of image to appear at right of cell.
     * @desc Must be a key from {@link module:images|images}.
     *
     * Used by {@link SimpleCell} cell renderer.
     * {@link module:defaults.centerIcon|centerIcon}
     * {@link module:defaults.rightIcon|rightIcon}
     * {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     */
    leftIcon: undefined,

    /**
     * @summary Name of image to appear at right of cell.
     * @desc Must be a key from {@link module:images|images}.
     *
     * Used by {@link SimpleCell} cell renderer.
     * {@link module:defaults.leftIcon|leftIcon}
     * {@link module:defaults.rightIcon|rightIcon}
     * {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     */
    centerIcon: undefined,

    /**
     * @summary Name of image to appear at right of cell.
     * @desc Must be a key from {@link module:images|images}.
     *
     * Used by {@link SimpleCell} cell renderer.
     * {@link module:defaults.leftIcon|leftIcon}
     * {@link module:defaults.centerIcon|centerIcon}
     * {@link module:defaults.iconPadding|iconPadding}
     * @default
     * @type {string}
     */
    rightIcon: undefined,

    /**
     * Set to `true` to render `0` and `false`. Otherwise these value appear as blank cells.
     * @default
     * @type {boolean}
     */
    renderFalsy: false,

    /**
     * The name of a transformer function defined in require('synonomous/transformers').
     *
     * If the named headerify function is defined, whenever the schema array changes, it is applied each element
     * (column schema) for each column that does not already have an explicitly defined `header` property.
     *
     * When this property does not name a defined headerify function, undefined column headers default to their column names.
     *
     * @see lib/headerifiers.js
     * @default
     * @type {string}
     */
    headerify: 'toTitle',

    /**
     * Enable rendering of horizontal grid lines.
     * @default
     * @type {boolean}
     */
    gridLinesH: true,

    /**
     * Thickness of horizontal grid lines (pixels).
     * @type {number}
     * @default
     * {@link module:dynamicProperties.lineWidth lineWidth}
     */
    gridLinesHWidth: 1,

    /**
     * Color of horizontal grid lines.
     * @type {string}
     * @default
     * {@link module:dynamicProperties.lineColor lineColor}
     */
    gridLinesHColor: 'rgb(199, 199, 199)',

    /**
     * Enable rendering of vertical grid lines.
     * @default
     * @type {boolean}
     */
    gridLinesV: true,

    /**
     * Thickness of vertical grid lines (pixels).
     * @type {number}
     * @default
     * {@link module:dynamicProperties.lineWidth lineWidth}
     */
    gridLinesVWidth: 1,

    /**
     * Color of vertical grid lines.
     * @type {string}
     * @default
     * {@link module:dynamicProperties.lineColor lineColor}
     */
    gridLinesVColor: 'rgb(199, 199, 199)',

    /**
     * When {@link module:defaults.gridLinesV} is truthy, determines if lines render in the column headers area.
     * @type {boolean}
     * @default
     */
    gridLinesColumnHeader: true,

    /**
     * When {@link module:defaults.gridLinesV} or {@link module:defaults.gridLinesH} are truthy, determines if lines render in the user data area.
     * @type {boolean}
     * @default
     */
    gridLinesUserDataArea: true,

    /**
     * Set canvas's CSS border to this string as well as:
     * * {@link module:dynamicProperties.gridBorderLeft gridBorderLeft}
     * * {@link module:dynamicProperties.gridBorderRight gridBorderRight}
     * * {@link module:dynamicProperties.gridBorderTop gridBorderTop}
     * * {@link module:dynamicProperties.gridBorderBottom gridBorderBottom}.
     *
     * If set to:
     * `true`: uses current {@link module:dynamicProperties.lineWidth lineWidth} and {@link module:dynamicProperties.lineColor lineColor}
     * `false`: uses null
     *
     * Caveat: The use of `grid.canvas.canvas.style.boxSizing = 'border-box'` is _not_ recommended due to
     * the fact that the canvas is squashed slightly to accommodate the border resulting in blurred text.
     *
     * @default
     * @type {boolean|string}
     */
    gridBorder: false,

    /**
     * Set canvas's left CSS border to this string.
     *
     * If set to:
     * * `true`: uses current {@link module:dynamicProperties.lineWidth lineWidth} and {@link module:dynamicProperties.lineColor lineColor}
     * * `false`: uses null
     * @default
     * @type {boolean|string}
     */
    gridBorderLeft: false,

    /**
     * Set canvas's right CSS border to this string.
     *
     * If set to:
     * * `true`: uses current {@link module:dynamicProperties.lineWidth lineWidth} and {@link module:dynamicProperties.lineColor lineColor}
     * * `false`: uses null
     * @default
     * @type {boolean}
     */
    gridBorderRight: false,

    /**
     * Set canvas's top CSS border to this string.
     *
     * If set to:
     * * `true`: uses current {@link module:dynamicProperties.lineWidth lineWidth} and {@link module:dynamicProperties.lineColor lineColor}
     * * `false`: uses null
     * @default
     * @type {boolean}
     */
    gridBorderTop: false,

    /**
     * Set canvas's bottom CSS border to this string.
     *
     * If set to:
     * * `true`: uses current {@link module:dynamicProperties.lineWidth lineWidth} and {@link module:dynamicProperties.lineColor lineColor}
     * * `false`: uses null
     * @default
     * @type {boolean}
     */
    gridBorderBottom: false,
    gridRightAligned: false,
    fixedLinesHWidth: 2,
    fixedLinesHEdge: undefined,
    fixedLinesHColor: 'rgb(164,164,164)', // ~21% darker than {@link module:defaults.gridLinesHColor} default
    fixedLinesVWidth: 2,
    fixedLinesVEdge: undefined,
    fixedLinesVColor: 'rgb(164,164,164)', // ~21% darker than {@link module:defaults.gridLinesVColor} default
    defaultRowHeight: 14,

    /**
     * This default column width is used when `width` property is undefined.
     * (`width` is defined on column creation unless {@link module:defaults.columnAutosizing columnAutosizing} has been set to `false`.)
     * @default
     * @type {number}
     */
    defaultColumnWidth: 100,

    /**
     * Minimum column width.
     * Adjust this value for different fonts/sizes or exotic cell renderers.
     * _Must be defined._
     * The default (`5`) is enough room for an ellipsis with default font size.
     * @default
     * @type {number}
     */
    minimumColumnWidth: 5,

    /**
     * Maximum column width.
     * _When defined,_ column width is clamped to this value by {@link Column#setWidth setWidth}).
     * Ignored when falsy.
     * Respects {@link module:defaults.resizeColumnInPlace resizeColumnInPlace} but may cause user confusion when
     * user can't make column narrower due to next column having reached its maximum.
     * @default
     * @type {number}
     */
    maximumColumnWidth: undefined,

    visibleColumnWidthAdjust: false,

    /**
     * Resizing a column through the UI (by clicking and dragging on the column's
     * right border in the column header row) normally affects the width of the whole grid.
     *
     * Set this new property to truthy to inversely resize the next column.
     * In other words, if user expands (say) the third column, then the fourth column will contract —
     * and _vice versa_ — without therefore affecting the width of the grid.
     *
     * This is a _column property_ and may be set for selected columns (`myColumn.properties.resizeColumnInPlace`)
     * or for all columns by setting it at the grid level (`myGrid.properties.resizeColumnInPlace`).
     *
     * Note that the implementation of this property does not allow expanding a
     * column beyond the width it can borrow from the next column.
     * The last column, however, is unconstrained, and resizing of course affects the total grid width.
     * @default
     * @type {boolean}
     */
    resizeColumnInPlace: false,

    //for immediate painting, set these values to 0, true respectively
    repaintIntervalRate: 60,
    repaintImmediately: false,
    useHiDPI: true,

    emitModelEvents: false,

    navKeyMap: {
        // RETURN: 'DOWN',
        // RETURNSHIFT: 'UP',
        // TAB: 'RIGHT',
        // TABSHIFT: 'LEFT'
        'ArrowUp': 'UP',
        'ArrowDown': 'DOWN',
        'ArrowLeft': 'LEFT',
        'ArrowRight': 'RIGHT',
    },

    /** @summary Validation failure feedback.
     * @desc Validation occurs on {@link CellEditor#stopEditing|stopEditing}, normally called on commit (`TAB`, `ENTER`, or any other keys listed in `navKeyMap`).
     *
     * On successful validation, the value is saved back to the data source and the editor is closed.
     *
     * On validation failure, feedback is shown to the user in the form of an "error effect" possibly followed by an "end effect" containing a detailed explanation.
     *
     * The error effect to use is named in {@link module:defaults.feedbackEffect|feedbackEffect}.
     *
     * The value of this property is the number of times to show the "error effect" on validation failure before showing the detailed explanation.
     *
     * `feedback` may be set to one of:
     * * **`undefined`** - Do not show the error effect or the alert. Just discard the value and close the editor (as if `ESC` had been typed).
     * * **`0`** - Just shows the error feedback effect (see the {@link CellEditor#errorEffect|errorEffect} property).
     * * **`1`** - Shows the error feedback effect followed by the detailed explanation.
     * * `2` or more:
     *   1. Shows the error feedback effect
     *   2. On every `feedback` tries, shows the detailed explanation.
     * @default
     * @type {number|undefined}
     */
    feedbackCount: 3,

    /**
     * @default
     * @type {{name:string,options:object}|string}
     * {@link module:defaults.feedbackCount|feedbackCount}
     */
    feedbackEffect: 'shaker',
    readOnly: false,
    fixedColumnCount: 0,
    fixedRowCount: 0,
    cellSelection: true,
    columnSelection: true,
    rowSelection: true,
    singleRowSelectionMode: true,

    /**
     * @summary Fill color for last selection overlay.
     * @desc The color should be translucent (or transparent). Note that "Partial" grid renderers (such as the {@link paintCellsAsNeeded} renderer) do not draw overlay because it just gets darker and darker for non-updated cells.
     * @default
     * @type {cssColor}
     */
    selectionRegionOverlayColor: 'transparent', // 'rgba(0, 0, 48, 0.2)',

    /**
     * @summary Stroke color for last selection overlay.
     * @default
     * @type {string}
     */
    selectionRegionOutlineColor: 'rgb(69, 69, 69)',

    /**
     * @summary Whether to automatically expand column width to accommodate widest rendered value.
     * @desc When truthy for a given column _and_ user has not manually resized it, column will expand to accommodate widest rendered value.
     *
     * What's actually happening is (`props` in the following refers to the column's properties):
     * 1. On each grid render, for all visible columns:
     *    1. The cell renderer reports back the width of each rendered cell contents.
     *    2. The largest value for each column is saved (in `props.preferredWidth`).
     * 2. At the conclusion of the grid render, the renderer calls `grid.gridRenderedNotification`, which calls `grid.behavior.checkColumnAutosizing`, which for all columns for which `props.columnAutosizing` is truthy, determines if the column needs to be widened subject to the following conditions:
     *    1. If user has not already manually set column width (`props.columnAutosized` is still falsy)
     *    2. If render width > current width (`props.preferredWidths > props.width`)
     *    3. If column's max autosizing width is defined and it's greater than render width (`props.peferredWidths < props.columnAutosizingMax`)
     * 3. If any column width has changed, re-shape the grid with the new column widths and re-render it. As this typically happens before the next monitor refresh, user only sees the final result.
     * @default
     * @type {boolean}
     */
    columnAutosizing: true,

    /**
     * @summary The widest the column will be auto-sized to.
     * @desc For no limit, set this property to a falsy value such as `undefined` or `0`.
     *
     * Note this property only specifies a maximum column width for _auto-sizing;_ it places no limit on manual resizing of column width.
     * @default
     * @type {number}
     */
    columnAutosizingMax: 400,

    /**
     * @summary Whether text in header cells is wrapped.
     * @desc For performance reasons, text in data cells is not wrapped. (This is a function of the supplied `SimpleCell` renderer. Override with a custom renderer if you must have wrapped text in data cells.)
     * @default
     * @type {boolean}
     */
    headerTextWrapping: false,

    /**
     * @default
     * @type {boolean}
     */
    rowResize: false,


    /* CELL EDITING */

    /**
     * @default
     * @type {boolean}
     */
    editable: true,

    /**
     * Edit cell on double-click rather than single-click.
     *
     * @default
     * @type {boolean}
     */
    editOnDoubleClick: true,

    /**
     * Grid-level property.
     * When user presses a "printable" keyboard character _or_ BACKSPACE _or_ DELETE:
     * 1. Activate cell editor on current cell (i.e., origin of most recent selection).
     * 2. If cell editor is a text editor:
     *    1. Replace current value with the character the user typed; or
     *    2. Clear it on BACKSPACE, DELETE, or other invalid character (_e.g._ when user types a letter but the cell editor only accepts digits).
     *
     * > In invoked, user has the option to back out by pressing the ESCAPE key.
     *
     * @default
     * @type {boolean}
     */
    editOnKeydown: true,

    /**
     * @summary Open cell editor when cell selected via keyboard navigation.
     * @desc Keyboard navigation always includes:
     * 1. The four arrow keys -- but only when there is no active text cell editor open
     * 2. Additional keys mapped to the four directs in {@link module:defaults.navKeyMap}
     *
     * Generally set at the grid level. If set at the column (or cell) level, note that the property pertains to the cell navigated _to,_ not the cell navigated _away from._
     * @default
     * @type {boolean}
     */
    editOnNextCell: false,


    /* COLUMN SORTING */

    /**
     * Ignore sort handling in feature/ColumnSorting.js.
     * Useful for excluding some columns but not other from participating in sorting.
     *
     * @default
     * @type {boolean}
     */
    sortable: true,

    /**
     * Sort column on double-click rather than single-click.
     *
     * Used by:
     * * feature/ColumnSorting.js to decide which event to respond to (if any, see `unsortabe`).
     * * feature/ColumnSelection.js to decide whether or not to wait for double-click.
     * @default
     * @type {boolean}
     */
    sortOnDoubleClick: true,

    /**
     * **This is a standard property definition for sort plug-in use.
     * It is not referenced in core.**
     *
     * The maximum number of columns that may participate in a multi-column sort (via ctrl-click headers).
     * @default
     * @type {number}
     */
    maxSortColumns : 3,

    /**
     * **This is a standard property definition for sort plug-in use.
     * It is not referenced in core.**
     *
     * Column(s) participating and subsequently hidden still affect sort.
     *
     * @default
     * @type {boolean}
     */
    sortOnHiddenColumns: true,


    /**
     * @summary Retain row selections.
     * @desc When falsy, row selections are cleared when selecting cells; when truthy, row selections are kept as is when selecting cells.
     * @todo Deprecate in favor of something simpler like `keepRowSelections`. (The current name is misleading and has caused some confusion among both developers and users. At the very least it should have been called `checkboxOnlyRowDeselections`.)
     * @default
     * @type {boolean}
     */
    checkboxOnlyRowSelections: false,

    /**
     * @summary Select cell's entire row.
     * @desc When truthy, selecting a cell will also select the entire row it is in, subject to note #1 below.
     *
     * Notes:
     * 1. Ineffectual unless `checkboxOnlyRowSelections` is set to `false`.
     * 2. To allow auto-selection of _multiple rows,_ set `singleRowSelectionMode` to `false`.
     *
     * @default
     * @type {boolean}
     */
    autoSelectRows: false,

    /**
     * @summary Select cell's entire column.
     * @desc When truthy, selecting a cell will also select the entire column it is in.
     * @default
     * @type {boolean}
     */
    autoSelectColumns: false,

    /**
     * Collapse cell selection onto next row selection.
     * @default
     * @type {boolean}
     */
    collapseCellSelections: false,

    /** @summary Name of a formatter for cell text.
     * @desc Unknown formatter falls back to the `string` formatter (simple conversion to string with `+ ''`).
     * @default undefined
     * @type {string}
     * @tutorial localization
     */
    format: undefined,

    /** @summary Name of a cell editor from the {@link module:cellEditors|cellEditors API}..
     * @desc Not editable if named editor is does not exist.
     * @default undefined
     * @type {string}
     * @tutorial cell-editors
     */
    editor: undefined,

    /**
     * Name of cell renderer from the {@link module:cellRenderers|cellRenderers API}.
     * @default
     * @type {string}
     */
    cellPainter: 'SimpleCell',

    /**
     * Name of grid renderer.
     * Renderer must have been registered.
     * {@link Renderer#registerGridRenderer}.
     * @default
     * @type {string}
     */
    gridPainter: 'by-columns-and-rows',

    /********** HOVER COLORS **********/

    /** On mouse hover, whether to repaint the cell background and how.
     * @default '{ enabled: true, background: rgba(160, 160, 40, 0.30) }'
     */
    hoverCellHighlight: {
        enabled: true,
        backgroundColor: 'rgba(160, 160, 40, 0.45)'
    },

    /** On mouse hover, whether to repaint the row background and how.
     * @default '{ enabled: true, background: rgba(100, 100, 25, 0.15) }'
     */
    hoverRowHighlight: {
        enabled: true,
        backgroundColor: 'rgba(100, 100, 25, 0.30)'

    },

    /** On mouse hover, whether to repaint the column background and how.
     * @default '{ enabled: true, background: rgba(60, 60, 15, 0.15) }'
     */
    hoverColumnHighlight: {
        enabled: true,
        backgroundColor: 'rgba(60, 60, 15, 0.15)'
    },

    /** @summary Display cell value as a link (with underline).
     * @desc One of:
     * * `boolean` - No action occurs on click; you would need to attach a 'rev-click' listener to the hypergrid object.
     *   * `true` - Displays the cell as a link.
     *   * _falsy_ - Displays the cell normally.
     * * `string` -  The URL is decorated (see {}) and then opened in a separate window/tab. See also {@link module:defaults.linkTarget|linkTarget}.
     *   * `'*'` - Use the cell value as the URL, ready for decorating (see {CellClick#openLink|openLink)).
     *   * _field name_ - Fetches the string from the named field in the same row, assumed to be a URL ready for decorating. (May contain only alphanumerics and underscore; no spaces or other punctuation.)
     *   * _otherwise_ Assumed to contains a URL ready for decorating.
     * * `function` - A function to execute to get the URL ready for decorating. The function is passed a single parameter, `cellEvent`, from which you can get the field `name`, `dataRow`, _etc._
     * * `Array` - An array to "apply" to {@link https://developer.mozilla.org/docs/Web/API/Window/open window.open} in its entirety. The first element is interpreted as above for `string` or `function`.
     *
     * In the case of `string` or `Array`, the link is further unpacked by {@link module:CellClick.openLink|openLink} and then sent to `grid.windowOpen`.
     *
     * @example
     * // following affect upper-left data cell:
     * grid.behavior.setCellProperty(0, 0, 'https://nytimes.com'); // absolute address using specific protocol
     * grid.behavior.setCellProperty(0, 0, '//nytimes.com'); // absolute address using current protocol
     * grid.behavior.setCellProperty(0, 0, '/page2.com'); // relative to current site
     * grid.behavior.setCellProperty(0, 0, 'mypage.com'); // relative to current page
     * grid.behavior.setCellProperty(0, 0, 'mypage.com?id=%value'); // cell's value will replace %value
     * grid.behavior.setCellProperty(0, 0, ['//www.newyorker.com', 'ny', undefined, true]) // target='ny', replace=true
     * @type {boolean|string|Array}
     * @default
     */
    link: false,

    /** @summary The window (or tab) in which to open the link.
     * @desc The default ('_blank'`) will open a new window for every click.
     *
     * To have the first click open a new window and all subsequent clicks reuse that same window, set this to an arbitrary string.
     *
     * Otherwise, specific columns or cells can be set to open their links in their own window by setting the appropriate column's or cell's `linkTarget` property.
     * @default
     */
    linkTarget: '_blank',

    /** @summary Underline link on hover only.
     * @type {boolean}
     * @default
     */
    linkOnHover: false,

    /** @summary Color for link.
     * @desc Falsy means defer to foreground color.
     * @type {string}
     * @default
     */
    linkColor: 'blue',

    /** @summary Color for visited link.
     * @desc Falsy means defer to foreground color.
     * @type {string}
     * @default
     */
    linkVisitedColor: 'purple',

    /** @summary Color link on hover only.
     * @type {boolean}
     * @default
     */
    linkColorOnHover: false,

    /** Display cell font with strike-through line drawn over it.
     * @type {boolean}
     * @default
     */
    strikeThrough: false,

    multipleSelections: false,
    enableContinuousRepaint: false,

    /** @summary Allow user to move columns .
     * @desc Columns can be reordered through either of two interfaces:
     * * Column Dragging feature
     * * behavior.columns API
     */
    columnsReorderable: true,
    columnsReorderableHideable: false,

    /** @summary Column grab within this number of pixels from top of cell.
     */
    columnGrabMargin: 10,

    /** @summary Set up a clipping region around each column before painting cells.
     * @desc One of:
     * * `true` - Clip column.
     * * `false` - Do not clip column.
     * * `null` - Clip iff last active column.
     *
     * Clipping prevents text that overflows to the right of the cell from being rendered.
     * If you can guarantee that none of your text will overflow, turn column clipping off
     * for better performance. If not, you may still be able to get away without clipping.
     * If the background color of the next column is opaque, you don't really need to clip,
     * although text can leak out to the right of the last column. Clipping the last column
     * only can help this but not solve it since the leaked text from (say) the column before
     * the last column could stretch across the entire last column and leak out anyway.
     * The solution to this is to clip the rendered string so at most only a partial character
     * will overflow.
     * @type {boolean|undefined}
     * @default
     */
    columnClip: true,

    /**
     * @summary Repeating pattern of property overrides for grid rows.
     * @desc Notes:
     * * "Grid row" refers to data rows.
     * * Row index modulo is applied when dereferencing this array. In other words, this array represents a _repeating pattern_ of properties to be applied to the data rows.
     * * For no row properties, specify a falsy value in place of the array.
     * * Do not specify an empty array (will throw an error).
     * * Each element of the array may be either:
     *   * An object containing property overrides to be applied to every cell of the row; or
     *   * A falsy value signifying that there are no row properties for this specific row.
     * * Caveat: Row properties use `Object.assign()` to copy properties and therefore are not as performant as column properties which use prototype chain.
     * * `Object.assign()` is a polyfill in older versions of Chrome (<45) and in all Internet Explorer (through 11).
     * @type {undefined|object[]}
     * @default
     */
    rowStripes: undefined,

    // for Renderer.prototype.assignProps
    // propClassLayers: propClassLayersMap.DEFAULT,

    /**
     * Used to access registered features -- unless behavior has a non-empty `features` property (array of feature contructors).
     */
    features: [
        'filters',
        'cellselection',
        'keypaging',
        'columnresizing',
        // 'rowresizing',
        'rowselection',
        'columnselection',
        'columnmoving',
        'columnsorting',
        'cellclick',
        'cellediting',
        'onhover',
        'touchscrolling',
        'thumbwheelscrolling'
    ],

    restoreRowSelections: true,
    restoreColumnSelections: true,
    restoreSingleCellSelection: true,

    /** @summary How to truncate text.
     * @desc A "quaternary" value, one of:
     * * `undefined` - Text is not truncated.
     * * `true` (default) - Truncate sufficient characters to fit ellipsis if possible. Most acceptable option that avoids need for clipping.
     * * `false` - Truncate *before* last partially visible character. Visibly annoying; semantically jarring.
     * * `null` - Truncate *after* partially visible character. Less visibly annoying; still semantically confusing. Best solution when combined with either column clipping or painting over with next column's background.
     * @type {boolean|null|undefined}
     * @default
     */
    textTruncateType: TextTruncateType.WithEllipsis,

    calculators: {},
    columnAutosized: false,
    columnIndexes: [],
    fetchSubregions: false,
    lineColor: 'black',
    lineWidth: 1,
    settingState: false,
    width: 50,
    useBitBlit: false,
};

function columnOnlyError() {
    throw new AssertError('DGPCOE75522', 'Attempt to set/get column-only property on a non-column properties object.');
}

['name', 'type', 'header', 'calculator'].forEach(function(key) {
    Object.defineProperty(defaultGridProperties, key, {
        set: columnOnlyError
    });
});

/** cssColor
 * @see https://developer.mozilla.org/docs/Web/CSS/color_value
 */
/** cssFont
 * @see https://developer.mozilla.org/docs/Web/CSS/font
 */


/** @summary Reapply cell properties after `getCell`.
 * @param {boolean} value
 * @default
 */
// function reapplyCellProperties(value) {
//     if (!warned.reapplyCellProperties) {
//         console.warn('The `.reapplyCellProperties` property has been deprecated as of v2.1.3 in favor of using the new `.propClassLayers` property. (May be removed in a future release.) This property is now a setter which sets `.propClassLayers` to `.propClassLayersMap.DEFAULT` (grid ← columns ← stripes ← rows ← cells) on truthy or `propClassLayersMap.NO_ROWS` (grid ← columns ← cells) on falsy, which is what you will see on properties stringification. This will give the same effect in most cases as the former property implementation, but not in all cases due to it no longer being applied dynamically. Developers should discontinue use of this property and start specifying `.propClassLayers` instead.');
//         warned.reapplyCellProperties = true;
//     }
//     this.propClassLayers = value ? propClassLayersMap.NO_ROWS : propClassLayersMap.DEFAULT;
// }

// function deleteProp(propName) {
//     var descriptor = Object.getOwnPropertyDescriptor(this, propName);
//     if (!descriptor) {
//         return false; // own property not found
//     } else if (!descriptor.get) {
//         return delete this[propName]; // non-accessor property found (returns !descriptor.configurable)
//     } else if (descriptor.get.toString().indexOf('.var.')) {
//         this.var[propName] = Object.getPrototypeOf(this)[propName];
//     } else {
//         return true; // property not deletable
//     }
//     this.grid.repaint();
//     return false; // delete was successful
// }

/**
 * @summary Execute value if "calculator" (function) or if column has calculator.
 * @desc This function is referenced here so:
 * 1. It will be available to the cell renderers
 * 2. Its context will naturally be the `config` object
 * @default {@link module:defaults.exec|exec}
 * @method
 * @param vf - Value or function.
 */
// function exec(vf) {
//     if (this.dataRow) {
//         var calculator = (typeof vf)[0] === 'f' && vf || this.calculator;
//         if (calculator) {
//             vf = calculator(this.dataRow, this.name, this.subrow);
//         }
//     }
//     return vf;
// }

// Add "utility" props so they will be available wherever props are available but make them non-enumerable because they are not real props.
// Object.defineProperties(defaults, {
//     mixIn: { value: require('overrider').mixIn },
//     delete: { value: deleteProp },
//     propClassEnum: { value: propClassEnum },
//     propClassLayersMap: { value: propClassLayersMap },
//     navKey: { value: navKey },
//     mappedNavKey: { value: mappedNavKey },
//     reapplyCellProperties: { set: reapplyCellProperties },
//     exec: { value: exec }
// });
