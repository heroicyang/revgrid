import { Behavior } from './behavior';
import { Canvas } from './canvas/canvas';
import { dispatchGridEvent } from './canvas/dispatch-grid-event';
import { CellEditor } from './cell-editor/cell-editor';
import { cellEditorFactory } from './cell-editor/cell-editor-factory';
import { ButtonCellPainter } from './cell-painter/button-cell-painter';
import { CellPainter } from './cell-painter/cell-painter';
import { CellEvent, MouseCellEvent } from './cell/cell-event';
import { CellProperties } from './cell/cell-properties';
import { RenderedCell } from './cell/rendered-cell';
import { Column } from './column/column';
import { ColumnProperties } from './column/column-properties';
import { ColumnPropertiesAccessor } from './column/column-properties-accessor';
import { ColumnsManager } from './column/columns-manager';
import { defaultGridProperties } from './default-grid-properties';
import { EventDetail } from './event/event-detail';
import { EventName } from './event/event-name';
import { FeaturesManager } from './feature/features-manager';
import { FeaturesSharedState } from './feature/features-shared-state';
import { FinBar } from './finbar/finbar';
import { GridPainter } from './grid-painter/grid-painter';
import { GridProperties, LoadableGridProperties } from './grid-properties';
import { GridPropertiesAccessor } from './grid-properties-accessor';
import { SchemaModel } from './grid-public-api';
import { DateFormatter, Localization, NumberFormatter } from './lib/localization';
import { Point, WritablePoint } from './lib/point';
import { Rectangle, RectangleInterface } from './lib/rectangle';
import { AssertError } from './lib/revgrid-error';
import { MainSubgrid } from './main-subgrid';
import { CellModel } from './model/cell-model';
import { DataModel } from './model/data-model';
import { MainDataModel } from './model/main-data-model';
import { MetaModel } from './model/meta-model';
import { ModelCallbackRouter } from './model/model-callback-router';
import { Renderer } from './renderer/renderer';
import { SelectionDetail, SelectionDetailAccessor } from './selection/selection-detail';
import { Subgrid } from './subgrid';

/** @public */
export class Revgrid implements SelectionDetail {
    destroyed = false;
    options: Revgrid.Options;
    readonly properties: LoadableGridProperties;
    readonly canvas: Canvas;
    allowEventHandlers = true;
    numRows = 0;
    numColumns = 0;
    /** @internal */
    readonly renderer: Renderer;
    /** @internal */
    private _subgrids = new Array<Subgrid>();
    /** @internal */
    private _columnsManager: ColumnsManager;
    /** @internal */
    private _modelCallbackManager: ModelCallbackRouter;
    /** @internal */
    private _featureManager: FeaturesManager;
    /** @internal */
    readonly featuresSharedState: FeaturesSharedState = {} as FeaturesSharedState; // Will be initialised in constructor

    localization: Localization;

    readonly containerHtmlElement: HTMLElement;
    canvasDiv: HTMLDivElement;

    mainDataModel: MainDataModel;
    mainSubgrid: MainSubgrid;

    needsReindex = false;
    needsShapeChanged = false;
    needsStateChanged = false;

    mouseDownState: CellEvent;
    dragging = false;
    columnDragAutoScrolling: boolean; // I dont think this does anything

    cellEditorFactory = cellEditorFactory;

    // Begin Events mixin
    eventlistenerInfos = new Map<EventName | string, Revgrid.ListenerInfo[]>();
    // End Events mixin

    /** @internal */
    get columnsManager() { return this._columnsManager; }

    // Begin Selection mixin
    /** @internal */
    get selectionModel() { return this.mainSubgrid.selectionModel; }
    get selectedRows() { return this.mainSubgrid.getSelectedRows(); }
    get selectedColumns() { return this.mainSubgrid.getSelectedColumns(); }
    get selections() { return this.mainSubgrid.selections; }

    // End Selection mixin


    // Begin Themes mixin
    //_theme: Theme;
    // End Themes mixin

    // Begin Scrolling mixin
    /**
     * A float value between 0.0 - 1.0 of the vertical scroll position.
     */
    vScrollValue = 0;

    /**
     * A float value between 0.0 - 1.0 of the horizontal scroll position.
     */
    // hScrollValue = 0;

    /**
     * The vertical scroll bar model/controller.
     */
    sbVScroller: FinBar = null;

    /**
     * The horizontal scroll bar model/controller.
     */
    sbHScroller: FinBar = null;

    /**
     * The previous value of sbVScrollVal.
     * @type {number}
     */
    sbPrevVScrollValue: number = null;

    scrollingNow = false;
    // End Scrolling mixin

    columnPropertiesConstructor: ColumnProperties.Constructor = ColumnPropertiesAccessor;

    private _repaintSetTimeoutId: ReturnType<typeof setTimeout>;
    private _resizeSetTimeoutId: ReturnType<typeof setTimeout>;

    private mouseCatcher = () => this.abortEditing();

    get fixedColumnsViewWidth() { return this.renderer.fixedColumnsViewWidth; }
    get nonFixedColumnsViewWidth() { return this.renderer.nonFixedColumnsViewWidth; }
    get activeColumnsViewWidth() { return this.renderer.activeColumnsViewWidth; }

/**
 * @mixes scrolling.mixin
 * @mixes events.mixin
 * @mixes selection.mixin
 * @mixes themes.mixin
 * @mixes themes.sharedMixin
 * @constructor
 * @classdesc An object representing a Hypegrid.
 * @desc The first parameter, `container`, is optional. If omitted, the `options` parameter is promoted to first position. (Note that the container can also be given in `options.container.`)
 * @param {string|Element} [container] - CSS selector or Element. If omitted (and `options.container` also omitted), Hypergrid first looks for an _empty_ element with an ID of `hypergrid`. If not found, it will create a new element. In either case, the container element has the class name `hypergrid-container` added to its class name list. Finally, if the there is more than one such element with that class name, the element's ID attribute is set to `hypergrid` + _n_ where n is an ordinal one less than the number of such elements.
 * @param {object} [options] - If `options.data` provided, passed to {@link Hypergrid#setData setData}; else if `options.Behavior` provided, passed to {@link Hypergrid#setBehavior setBehavior}.
 * @param {function} [options.Behavior=Local] - _Per {@link Behavior#setData}._
 * @param {DataModel} [options.dataModel] - _Passed to behavior {@link Behavior constructor}._
 * @param {function} [options.DataModel=require('datasaur-local')] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|object[]} [options.data] - _Passed to behavior {@link Behavior constructor}._
 * @param {function|menuItem[]} [options.schema] - _Passed to behavior {@link Behavior constructor}._
 * @param {object} [options.metadata] - _Passed to behavior {@link Behavior constructor}._
 * @param {subgridSpec[]} [options.subgrids=this.properties.subgrids] - _Per {@link Behavior#setData}._
 * @param {pluginSpec|pluginSpec[]} [options.plugins]
 * @param {object} [options.state]
 *
 * @param {string|Element} [options.container] - Alternative to providing `container` (first) parameter above.
 *
 * @param {object} [options.contextAttributes={ alpha: true }] - Passed to [`HTMLCanvasElement.getContext`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext). Although the MDN docs say setting this to `{alpha: false}` (opaque canvas) can "can speed up drawing of transparent content and images," our testing (with Chrome v63) failed to show any measurable performance gain.
 *
 * _An opaque canvas does have an important advantage, however!_ It permits the graphics context to use [sub-pixel rendering](https://en.wikipedia.org/wiki/Subpixel_rendering) for sharper text as viewed on LCD or LED screens, especially black text on white backgrounds, and especially when viewed on a high-pixel-density display such as an [Apple retina display](https://en.wikipedia.org/wiki/Retina_Display).
 *
 * Zoom in on the following samples images to see the difference in rendering.
 *
 * Value | Sample
 * :---: | :----:
 * `{ alpha: true }`<br>Transparent canvas,<br>renders text using<br>_regular anti-aliasing_ | ![regular.png](https://cdn-pro.dprcdn.net/files/acc_645730/ZqurK3)
 * `{ alpha: false }`<br>Opaque canvas,<br>renders text using<br>_sub-pixel rendering_ | ![sub-pixel.png](https://cdn-std.dprcdn.net/files/acc_645730/bf3VXh).
 *
 * Use with caution, however. In particular, if the canvas is set to "opaque" (`{alpha: false}`), do _not_ also specify a transparent or translucent color for `grid.properties.backGround` because content may then be drawn with corrupt anti-aliasing (at lest as of Chrome v67).
 *
 * To clarify, the default setting (`{ alpha: true }`) is a transparent canvas, meaning that elements rendered underneath the `<canvas>` element can be seen through any non-opaque pixels (pixels with alpha channel < 1.0). Hypergrids that set their background color to non-opaque can see this effect.
 *
 * Note: An opaque canvas can still be made _to appear_ translucent using the CSS `opacity` property. But that is a different effect entirely, setting the entire rendered canvas to translucent, not just so all pixels become translucent.
 * @param {string} [options.localization=Hypergrid.localization]
 * @param {string|string[]} [options.localization.locale=Hypergrid.localization.locale] - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to `Intl.NumberFomrat` and `Intl.DateFomrat`. See {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information.
 * @param {string} [options.localization.numberOptions=Hypergrid.localization.numberOptions] - Options passed to [`Intl.NumberFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat) for creating the basic "number" localizer.
 * @param {string} [options.localization.dateOptions=Hypergrid.localization.dateOptions] - Options passed to [`Intl.DateTimeFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat) for creating the basic "date" localizer.
 *
 * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
 * @param {string} [options.margin.top='0px']
 * @param {string} [options.margin.right='0px']
 * @param {string} [options.margin.bottom='0px']
 * @param {string} [options.margin.left='0px']
 *
 * @param {object} [options.boundingRect] - Optional grid container size & position. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container > div:first-child` rule.)
 * @param {string} [options.boundingRect.width='auto']
 * @param {string} [options.boundingRect.height='500px']
 * @param {string} [options.boundingRect.left='auto']
 * @param {string} [options.boundingRect.top='auto']
 * @param {string} [options.boundingRect.right='auto']
 * @param {string} [options.boundingRect.bottom='auto']
 * @param {string} [options.boundingRect.position='relative']
 *
 */
    constructor(options?: Revgrid.Options);
    constructor(container: string | HTMLElement, options?: Revgrid.Options);
    constructor(containerOrOptions: string | HTMLElement | Revgrid.Options, options?: Revgrid.Options) {

        //Optional container argument
        let container: string | HTMLElement;
        if ((typeof containerOrOptions === 'string') || (containerOrOptions instanceof HTMLElement)) {
            container = containerOrOptions;
        } else {
            container = null;
            options = containerOrOptions;
        }

        options = options ?? {};

        this.properties = new GridPropertiesAccessor(this);
        this.properties.loadDefaults();
        if (options?.gridProperties !== undefined) {
            this.properties.merge(options.gridProperties);
        }

        this.behavior = new Behavior(this);
        this._columnsManager = new ColumnsManager(this);
        this._featureManager = new FeaturesManager(this, this.featuresSharedState);

        //Set up the container for a grid instance
        const resolvedContainer = container ?? options.container ?? this.findOrCreateContainer(options.boundingRect);
        // this.setContainer(
        //     container ??
        //     options.container ??
        //     this.findOrCreateContainer(options.boundingRect)
        // );
        this.containerHtmlElement = this.initContainer(resolvedContainer, options);

        this.loadFeatures();
        this.canvas = this.createCanvas(options);
        this.renderer = new Renderer(this,
            this._columnsManager,
            this.canvas.gc,
            (name, detail) => this.handleGridEventDispatchEvent(name, detail),
        );
        this.canvas.renderer = this.renderer;
        this._modelCallbackManager = this.createModelCallbackRouter();

        // Install shared plug-ins (those with a `preinstall` method)
        // Hypergrid.prototype.installPlugins(options.plugins);

        this.isWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
        this.clearMouseDown();
        this.setFormatter(options.localization);

        this.delegateCanvasEvents();
        this.initScrollbars(options?.loadBuiltinFinbarStylesheet);

        // if (options.data) {
        //     this.setData(options.data, options); // if no behavior has yet been set, `setData` sets a default behavior
        // } else {
        //     if (options.behaviorConstructor || options.dataModel || options.dataModelConstructorOrArray) {
        //         this.setBehavior(options); // also sets options.data
        //     }
        // }
        this.reset(options.adapterSet, undefined, false);

        this.reindex();

        // this.resizeScrollbars();

        if (options.state) {
            this.loadState(options.state);
        }

        this.synchronizeScrollingBoundaries();

        // /**
        //  * @name plugins
        //  * @summary Dictionary of named instance plug-ins.
        //  * @desc See examples for how to reference (albeit there is normally no need to reference plugins directly).
        //  *
        //  * For the dictionary of _shared_ plugins, see {@link Hypergrid.plugins|plugins} (a property of the constructor).
        //  * @example
        //  * var instancePlugins = myGrid.plugins;
        //  * var instancePlugins = this.plugins; // internal use
        //  * var myInstancePlugin = myGrid.plugins.myInstancePlugin;
        //  * @type {object}
        //  */
        // // this.plugins = {};

        // // Install instance plug-ins (those that are constructors OR have an `install` method)
        // this.installPlugins(options.plugins);

        // Listen for propagated mouseclicks. Used for aborting edit mode.
        document.addEventListener('mousedown',  this.mouseCatcher);

        this.canvas.start();
        this.renderer.start();
        this._repaintSetTimeoutId = setTimeout(() => {
            this._repaintSetTimeoutId = undefined;
            this.repaint();
        }, 0);

        Revgrid.grids.push(this);

        this.resetGridBorder('Top');
        this.resetGridBorder('Right');
        this.resetGridBorder('Bottom');
        this.resetGridBorder('Left');
    }

    /** @deprecated Use {@link (Hypgrid:class).destroy} instead */
    terminate() {
        this.destroy();
    }

    /**
     * Be a responsible citizen and call this function on instance disposal!
     * If multiple grids are used in an application (simultaneously or not), then {@link (Hypgrid:class).destroy} must be called otherwise
     * canvase paint loop will continue to run
     */
    destroy() {
        document.removeEventListener('mousedown', this.mouseCatcher);
        this.removeAllEventListeners(true);
        this._modelCallbackManager.destroy();
        this.destroySubgrids();
        this.renderer.stop();
        this.canvas.stop();
        this.renderer.destroy();

        if (this._repaintSetTimeoutId !== undefined) {
            clearTimeout(this._repaintSetTimeoutId);
        }
        if (this._resizeSetTimeoutId !== undefined) {
            clearTimeout(this._resizeSetTimeoutId);
        }

        const div = this.containerHtmlElement;
        while (div.hasChildNodes()) { div.removeChild(div.firstChild); }

        Revgrid.grids.splice(Revgrid.grids.indexOf(this), 1);

        this.destroyed = true;

        // delete this.containerHtmlElement;
        // delete this.canvas.div;
        // delete this.canvas.canvas;
        // delete this.sbVScroller;
        // delete this.sbHScroller;
    }

    resetGridBorder(edge?: string) {
        edge = edge ?? '';

        const propName = 'gridBorder' + edge;
        const styleName = 'border' + edge;
        const props = this.properties;
        const border = props[propName];

        let styleValue: string;

        switch (border) {
            case true:
                styleValue = props.lineWidth + 'px solid ' + props.lineColor;
                break;
            case false:
                styleValue = null;
                break;
        }
        this.canvas.canvas.style[styleName] = styleValue;
    }

    /**
     * A null object behavior serves as a place holder.
     */
    behavior: Behavior;

    /**
     * Cached result of webkit test.
     */
    isWebkit = true;

    /**
     * We do not support IE 11; we do NOT support older versions of IE.
     * (We do NOT officially support Edge.)
     * @see https://stackoverflow.com/questions/21825157/internet-explorer-11-detection#answer-21825207
     */
    // isIE11: !!(globalThis.MSInputMethodContext && document.documentMode);

    /**
     * The pixel location of an initial mousedown click, either for editing a cell or for dragging a selection.
     */
    mouseDown = new Array<Point>(); // [];

    /**
     * The extent from the mousedown point during a drag operation.
     */
    dragExtent: Point | null;

    /**
     * The instance of the currently active cell editor.
     * Will be `null` when not editing.
     */
    cellEditor: CellEditor | null;

    /**
     * The pixel location of the current hovered cell.
     * @todo Need to detect hovering over bottom totals.
     */
    hoverCell: CellEvent | undefined;
    hoverGridCell: Point | undefined;

    setAttribute(attribute: string, value: string) {
        this.containerHtmlElement.setAttribute(attribute, value);
    }

    removeAttribute(attribute: string) {
        this.containerHtmlElement.removeAttribute(attribute);
    }

    loadDefaultProperties() {
        /**
         * @name properties
         * @type {object}
         * @summary Object containing the properties of the grid.
         * @desc Grid properties objects have the following structure:
         * 1. User-configured properties and dynamic properties are in the "own" layer.
         * 2. Extends from the theme object.
         * 3. The theme object in turn extends from the {@link module:defaults|defaults} object.
         *
         * Note: Any changes the application developer may wish to make to the {@link module:defaults|defaults}
         * object should be made _before_ reaching this point (_i.e.,_ prior to any grid instantiations).
         */
        this.properties.loadDefaults();

        // Done in constructor
        // For all default props of object type, if a dynamic prop, invoke setter; else deep clone it so changes
        // made to inner props won't go to object on theme or defaults layers which are shared by other instances.
        // Object.keys(defaults).forEach(function(key) {
        //     var value = defaults[key];
        //     if (typeof value === 'object') {
        //         if (dynamicPropertyDescriptors[key]) {
        //             this[key] = value; // invoke dynamic prop setter
        //         } else {
        //             this[key] = deepClone(value); // just a plain object
        //         }
        //     }
        // }, this.properties);
    }

    loadFeatures() {
        this._featureManager.load();
    }

    /** @internal */
    createColumns() {
        // used by Behavior.addState()
        this._columnsManager.createColumns();
    }

    /**
     * @desc Clear out all state settings, data (rows), and schema (columns) of a grid instance.
     * @param options
     * @param options.subgrids - Consumed by {@link Behavior#reset}.
     * If omitted, previously established subgrids list is reused.
     */
    reset(
        adapterSet: GridProperties.AdapterSet | undefined,
        nonDefaultProperties: Partial<GridProperties> | undefined,
        removeAllEventListeners = false
    ) {
        if (nonDefaultProperties !== undefined) {
            this.properties.loadDefaults();
            this.properties.merge(nonDefaultProperties);
        }

        if (removeAllEventListeners) {
            this.removeAllEventListeners();
        }

        this.clearMouseDown();
        this.dragExtent = Point.create(0, 0);

        this.numRows = 0;
        this.numColumns = 0;

        this.vScrollValue = 0;
        // this.hScrollValue = 0;

        this.cancelEditing();

        this.sbPrevVScrollValue = null;

        this.setHoverCell(undefined);
        this.scrollingNow = false;

        if (adapterSet !== undefined) {
            this._modelCallbackManager.reset(); // will unsubscribe from SchemaModel and DataModels
            this.destroySubgrids();

            let schemaModel = adapterSet.schemaModel;
            if (typeof schemaModel === 'function') {
                schemaModel = new schemaModel();
            }
            this._columnsManager.schemaModel = schemaModel;
            this._modelCallbackManager.setSchemaModel(this._columnsManager.schemaModel);

            if  (adapterSet.subgrids.length > 0) {
                this.setSubgrids(adapterSet.subgrids);
            }
        }

        this.behavior.reset();
        this._columnsManager.clearColumns();
        this._columnsManager.createColumns();
        // if (options?.data !== undefined) {
        //     this.setData(options.data);
        // }

        this.renderer.reset();
        this.canvas.resize();
        // this.behaviorChanged();

        this.behaviorShapeChanged();
        // this.behavior.defaultRowHeight = null;
        // this._columnsManager.autosizeAllColumns();
    }

    /** pluginSpec
     * @desc One of:
     * * simple API - a plain object with an `install` method
     * * object API - an object constructor
     * * array:
     *    * first element is an optional name for the API or the newly instantiated object
     *    * next element (or first element when not a string) is the simple or object API
     *    * remaining arguments are optional arguments for the object constructor
     * * falsy value such as `undefined` - ignored
     *
     * The API may have a `name` or `$$CLASS_NAME` property.
     */
    /**
     * @summary Install plugins.
     * @desc Plugin installation:
     * * Each simple API is installed by calling it's `install` method with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     * * Each object API is installed by instantiating it's constructor with `this` as first arg + any additional args listed in the `pluginSpec` (when it is an array).
     *
     * The resulting plain object or instantiated objects may be named by (in priority order):
     * 1. if `pluginSpec` contains an array and first element is a string
     * 2. object has a `name` property
     * 3. object has a `$$CLASS_NAME` property
     *
     * If named, a reference to each object is saved in `this.plugins`. If the plug-in is unnamed, no reference is kept.
     *
     * There are two types of plugin installations:
     * * Preinstalled plugins which are installed on the prototype. These are simple API plugins with a `preinstall` method called with the `installPlugins` calling context as the first argument. Preinstallations are automatically performed whenever a grid is instantiated (at the beginning of the constructor), by calling `installPlugins` with `Hypergrid.prototype` as the calling context.
     * * Regular plugins which are installed on the instance. These are simple API plugins with an `install` method, as well as all object API plugins (constructors), called with the `installPlugins` calling context as the first argument. These installations are automatically performed whenever a grid is instantiated (at the end of the constructor), called with the new grid instance as the calling context.
     *
     * The "`installPlugins` calling context" means either the grid instance or its prototype, depending on how this method is called.
     *
     * Plugins may have both `preinstall` _and_ `install` methods, in which case both will be called. However, note that in any case, `install` methods on object API plugins are ignored.
     * @param {pluginSpec|pluginSpec[]} [plugins] - The plugins to install. If omitted, the call is a no-op.
     */
    // installPlugins(plugins) {
    //     var shared = this === Hypergrid.prototype; // Do shared ("preinstalled") plugins (if any)

    //     if (!plugins) {
    //         return;
    //     } else if (!Array.isArray(plugins)) {
    //         plugins = [plugins];
    //     }

    //     plugins.forEach(function(plugin) {
    //         var name, args, hash;

    //         if (!plugin) {
    //             return; // ignore falsy plugin spec
    //         }

    //         // set first arg of constructor to `this` (the grid instance)
    //         // set first arg of `install` method to `this` (the grid instance)
    //         // set first two args of `preinstall` method to `this` (the Hypergrid prototype) and the Behavior prototype
    //         args = [this];
    //         if (shared) {
    //             args.push(Behavior);
    //         }

    //         if (Array.isArray(plugin)) {
    //             if (!plugin.length) {
    //                 plugin = undefined;
    //             } else if (typeof plugin[0] !== 'string') {
    //                 args = args.concat(plugin.slice(1));
    //                 plugin = plugin[0];
    //             } else if (plugin.length >= 2) {
    //                 args = args.concat(plugin.slice(2));
    //                 name = plugin[0];
    //                 plugin = plugin[1];
    //             } else {
    //                 plugin = undefined;
    //             }
    //         }

    //         if (!plugin) {
    //             return; // ignore empty array or array with single string element
    //         }

    //         // Derive API name if not given in pluginSpec
    //         name = name || plugin.name || plugin.$$CLASS_NAME;
    //         if (name) {
    //             // Translate first character to lower case
    //             name = name.substr(0, 1).toLowerCase() + name.substr(1);
    //         }

    //         if (shared) {
    //             // Execute the `preinstall` method
    //             hash = this.constructor.plugins;
    //             if (plugin.preinstall && !hash[name]) {
    //                 plugin.preinstall.apply(plugin, args);
    //             }
    //         } else { // instance plug-ins:
    //             hash = this.plugins;
    //             if (typeof plugin === 'function') {
    //                 // Install "object API" by instantiating
    //                 plugin = this.createApply(plugin, args);
    //             } else if (plugin.install) {
    //                 // Install "simple API" by calling its `install` method
    //                 plugin.install.apply(plugin, args);
    //             } else if (!plugin.preinstall) {
    //                 throw new Base.HypergridError('Expected plugin (a constructor; or an API with a `preinstall` method and/or an `install` method).');
    //             }
    //         }

    //         if (name) {
    //             hash[name] = plugin;
    //         }

    //     }, this);
    // }

    /**
     * @summary Uninstall all uninstallable plugins or just named plugins.
     * @desc Calls `uninstall` on plugins that define such a method.
     *
     * To uninstall "preinstalled" plugins, call with `Hypergrid.prototype` as context.
     *
     * For convenience, the following args are passed to the call:
     * * `this` - the plugin to be uninstalled
     * * `grid` - the hypergrid object
     * * `key` - name of the plugin to be uninstalled (_i.e.,_ key in `plugins`)
     * * `plugins` - the plugins hash (a.k.a. `grid.plugins`)
     * @param {string|string[]} [pluginNames] If provided, limit uninstall to the named plugin (string) or plugins (string[]).
     */
    // uninstallPlugins(pluginNames) {
    //     if (!pluginNames) {
    //         pluginNames = [];
    //     } else if (!Array.isArray(pluginNames)) {
    //         pluginNames = [pluginNames];
    //     }
    //     _(this.plugins).each(function(plugin, key, plugins) {
    //         if (
    //             plugins.hasOwnProperty(key) &&
    //             pluginNames.indexOf(key) >= 0 &&
    //             plugin.uninstall
    //         ) {
    //             plugin.uninstall(this, key, plugins);
    //         }
    //     }, this);
    // }

    registerGridPainter(key: string, constructor: GridPainter.Constructor) {
        this.renderer.registerGridPainter(key, constructor)
    }

    registerCellPainter(typeName: string, constructor: CellPainter.Constructor) {
        this.renderer.registerCellPainter(typeName, constructor)
    }

    computeCellsBounds() {
        this.renderer.computeCellsBounds();
    }

    setFormatter(options?: Revgrid.LocalizationOptions) {
        options = options ?? {};
        this.localization = new Localization(
            options.locale || Revgrid.defaultLocalizationOptions.locale,
            options.numberOptions || Revgrid.defaultLocalizationOptions.numberOptions,
            options.dateOptions || Revgrid.defaultLocalizationOptions.dateOptions
        );
    }

    getFormatter(localizerName: string) {
        return this.localization.get(localizerName).format;
    }

    formatValue(localizerName: string, value: unknown) {
        const formatter = this.getFormatter(localizerName);
        return formatter(value);
    }


    /**
     * @desc Set the cell under the cursor.
     */
    processHoverCell(cellEvent: CellEvent | undefined) {
        const existingHoverCell = this.hoverCell;
        if (cellEvent === undefined) {
            if (existingHoverCell !== undefined) {
                this.setHoverCell(undefined);
                this.fireSyntheticOnCellExitEvent(existingHoverCell);
                this.repaint();
            }
        } else {
            if (existingHoverCell === undefined) {
                this.setHoverCell(cellEvent);
                this.fireSyntheticOnCellEnterEvent(cellEvent);
                this.repaint();
            } else {
                if (!Point.isEqual(existingHoverCell.gridCell, cellEvent.gridCell)) {
                    this.setHoverCell(undefined);
                    this.fireSyntheticOnCellExitEvent(existingHoverCell);
                    this.setHoverCell(cellEvent);
                    this.fireSyntheticOnCellEnterEvent(cellEvent);
                    this.repaint();
                }
            }
        }
    }

    private setHoverCell(cellEvent: CellEvent | undefined) {
        this.hoverCell = cellEvent;
        this.hoverGridCell = cellEvent?.gridCell;
    }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param properties - A simple properties hash.
     */
    addProperties(properties: Partial<GridProperties>) {
        const result = this.properties.merge(properties);
        if (result) {
            this.behaviorShapeChanged();
            // this.behavior.defaultRowHeight = null;
            // this._columnsManager.autosizeAllColumns();
        }
        return result;
    }

    /**
     * @desc Set the state object to return to the given user configuration; then re-render the grid.
     * @param state - A grid state object.
     * {@link http://en.wikipedia.org/wiki/Memento_pattern|Memento pattern}
     */
    setState(state: GridProperties) {
        this.addState(state, true);
    }

    /**
     * @desc Add to the state object; then re-render the grid.
     * @param state - A grid state object.
     * @param settingState - Clear state first (_i.e.,_ perform a set state operation).
     */
    addState(state: Record<string, unknown>, settingState = false) {
        this.behavior.addState(state, settingState);
        this.behaviorShapeChanged();
        // this.behavior.defaultRowHeight = null;
        // this._columnsManager.autosizeAllColumns();
        // this.behaviorChanged();
    }

    getState() {
        return this.behavior.getState();
    }

    loadState(state: Record<string, unknown>) {
        this.behavior.setState(state);
    }

    // /**
    //  * @todo Only output values when they differ from defaults (deep compare needed).
    //  * @param {object} [options]
    //  * @param {string[]} [options.blacklist] - List of grid properties to exclude. Pertains to grid own properties only.
    //  * @param {boolean} [options.compact] - Run garbage collection first. The only property this current affects is `properties.calculators` (removes unused calculators).
    //  * @param {number|string} [options.space='\t'] - For no space, give `0`. (See {@link https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Local/stringify|JSON.stringify}'s `space` param other options.)
    //  * @param {function} [options.headerify] - If your headers were generated by a function (taking column name as a parameter), give a reference to that function here to avoid persisting headers that match the generated string.
    //  * @this {Hypergrid}
    //  */
    // saveState(options: Hypergrid.Options) {
    //     options = options || {};

    //     const space = options.space === undefined ? '\t' : options.space;
    //     const properties = this.properties;
    //     const calculators = properties.calculators;
    //     const blacklist = options.blacklist = options.blacklist || [];

    //     blacklist.push('columnProperties'); // Never output this synonym of 'columns'

    //     if (calculators) {
    //         if (options.compact) {
    //             var columns = this.behavior.getColumns();
    //             Object.keys(calculators).forEach(function(key) {
    //                 if (!columns.find(function(column) {
    //                         return column.properties.calculator === calculators[key];
    //                     })) {
    //                     delete calculators[key];
    //                 }
    //             });
    //         }
    //         calculators.toJSON = stringifyFunctions;
    //     }

    //     // Temporarily copy the given headerify function for access by columns getter
    //     this.headerify = options.headerify;

    //     var json = JSON.stringify(properties, function(key, value) {
    //         if (this === properties && options.blacklist.indexOf(key) >= 0) {
    //             value = undefined; // JSON.stringify ignores undefined props
    //         } else if (key === 'calculator') {
    //             if (calculators) {
    //                 // convert function reference to registry key
    //                 value = Object.keys(calculators).find(function(key) {
    //                     return calculators[key] === value;
    //                 });
    //             } else {
    //                 // registry may not exist if Column.calculator setter was used directly so just save as is
    //                 value = value.toString();
    //             }
    //         }
    //         return value;
    //     }, space);

    //     // Remove the temporary copy
    //     delete this.headerify;

    //     return json;
    // }

    /**
     * @returns The initial mouse position on a mouse down event for cell editing or a drag operation.
     */
    getMouseDown() {
        if (this.mouseDown.length > 0) {
            return this.mouseDown[this.mouseDown.length - 1];
        } else {
            return undefined;
        }
    }

    /**
     * @desc Remove the last item from the mouse down stack.
     */
    popMouseDown() {
        let result: Point | undefined;
        if (this.mouseDown.length > 0) {
            result = this.mouseDown.pop();
        }
        return result;
    }

    /**
     * @desc Empty out the mouse down stack.
     */
    clearMouseDown() {
        this.mouseDown = [Point.create(-1, -1)];
        this.dragExtent = null;
    }

    /**
     * Set the mouse point that initiated a cell edit or drag operation.
     */
    setMouseDown(point: Point) {
        this.mouseDown.push(point);
    }

    /**
     * @returns The extent point of the current drag selection rectangle.
     */
    getDragExtent() {
        return this.dragExtent;
    }

    /**
     * @summary Set the extent point of the current drag selection operation.
     */
    setDragExtent(point: Point) {
        this.dragExtent = point;
    }

    tickNotification() {
        this.fireSyntheticTickEvent();
    }

    /**
     * @desc The grid has just been rendered, make sure the column widths are optimal.
     */
    checkColumnAutosizing() {
        const autoSized = this._columnsManager.checkColumnAutosizing(false);
        if (autoSized) {
            this.behaviorShapeChanged();
        }
        return autoSized;
    }

    /**
     * @summary Conditionally copy to clipboard.
     * @desc If we have focus, copy our current selection data to the system clipboard.
     * @param event - The copy system event.
     */
    checkClipboardCopy(event: ClipboardEvent) {
        if (this.hasFocus()) {
            event.preventDefault();
            const csvData = this.mainSubgrid.getSelectionAsTSV();
            event.clipboardData.setData('text/plain', csvData);
        }
    }

    /**
     * @returns We have focus.
     */
    hasFocus() {
        return this.canvas.hasFocus();
    }

    /**
     * @summary Set the Behavior object for this grid control.
     * @desc Called when `options.Behavior` from:
     * * Hypergrid constructor
     * * `setData` when not called explicitly before then
     * @param options - _Per {@link Behavior#setData}._
     * @param options.Behavior - The behavior (model) is a constructor.
     * @param options.dataModel - A fully instantiated data model object.
     * @param options.dataModelConstructor - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param options.metadata - Value to be passed to `setMetadataStore` if the data model has changed.
     * @param options.data - _Per {@link constructor#setData}._
     * @param options.schema - _Per {@link constructor#setData}.
     */
    // setBehavior(options: Hypergrid.Options) {
    //     const constructor = (options?.behaviorConstructor) ?? Behavior;
    //     this.behavior = new constructor(this, options);
    //     this.initScrollbars();
    //     this.refreshProperties();
    //     this.behavior.reindex();
    // }

    /**
     * Number of _visible_ columns.
     * @returns The number of columns.
     */
    getActiveColumnCount() {
        return this._columnsManager.getActiveColumnCount();
    }

    /**
     * @summary Gets the number of rows in the main subgrid.
     * @returns The number of rows.
     */
    getRowCount() {
        return this.mainDataModel.getRowCount();
    }

    /**
     * Retrieve a data row from the main data model.
     * @return The data row object at y index.
     * @param y - the row index of interest
     */
    getRow(y: number) {
        return this.mainSubgrid.getRow(y);
    }

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     */
    getData() {
        return this.mainDataModel.getData();
    }

    getValue(x: number, y: number, subgrid?: Subgrid) {
        const column = this._columnsManager.getActiveColumn(x);
        return this.behavior.getValue(column.schemaColumn, x, y, subgrid);
    }

    setValue(x: number, y: number, value: number, subgrid?: Subgrid) {
        const column = this._columnsManager.getActiveColumn(x);
        this.behavior.setValue(column.schemaColumn, x, y, value, subgrid);
    }

    /**
     * @summary Calls `apply()` on the data model.
     * Deferred if paintLoopRunning
     * {@link https://fin-hypergrid.github.io/doc/DataModel.html#reindex|reindex}
     */
    reindex() {
        if (this.paintLoopRunning()) {
            this.needsReindex = true;
        } else {
            if (this.mainDataModel.apply !== undefined) {
                this.mainDataModel.apply();
            }
        }
        this.behaviorShapeChanged();
    }

    /**
     * @desc I've been notified that the behavior has changed.
     */
    behaviorChanged() {
        if (!this.destroyed) {
            if (this.numColumns !== this._columnsManager.getAllColumnCount() || this.numRows !== this.getRowCount()) {
                this.numColumns = this._columnsManager.getAllColumnCount();
                this.numRows = this.getRowCount();
                this.behaviorShapeChanged();
            } else {
                this.behaviorStateChanged();
            }
        }
    }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorShapeChanged() {
        if (this.paintLoopRunning()) {
            this.needsShapeChanged = true;
            this.renderer.requestRepaint();
        } else if (!this.destroyed) {
            this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            this.repaint();
        }
    }

    /**
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    behaviorStateChanged() {
        if (this.paintLoopRunning()) {
            this.needsStateChanged = true;
            this.renderer.requestRepaint();
        } else if (!this.destroyed) {
            this.computeCellsBounds();
            // this.repaint();
        }
    }

    /**
     * Called from renderer/index.js
     */
    deferredBehaviorChange() {
        if (this.needsReindex) {
            this.reindex();
            this.needsReindex = false;
        }

        if (!this.destroyed) {
            if (this.needsShapeChanged) {
                this.synchronizeScrollingBoundaries(); // calls computeCellsBounds
            } else if (this.needsStateChanged) {
                this.computeCellsBounds();
            }
        }

        this.needsShapeChanged = this.needsStateChanged = false;
    }

    /**
     * @returns My bounds.
     */
    getBounds() {
        return this.renderer.getBounds();
    }

    repaint() {
        if (this.properties.repaintImmediately) {
            this.paintNow();
        } else {
            this.renderer.repaint();
        }
    }

    /**
     * @desc Paint immediately in this microtask.
     */
    paintNow() {
        if (this._columnsManager.columnsCreated) {
            this.renderer.paintNow();
        }
    }

    /** Promise resolves when last model update is rendered. Columns and rows will then reflect last model update */
    waitModelRendered() {
        return this.renderer.waitModelRendered();
    }

    /**
     * @summary Set the container for a grid instance
     */
    // private setContainer(div: string | HTMLElement) {
    //     this.initContainer(div);
    //     this.initRenderer();
    //     // injectGridElements.call(this);
    // }

    /**
     * @summary Initialize container
     */
    private initContainer(container: string | HTMLElement, options: Revgrid.Options): HTMLElement {
        if (typeof container === 'string') {
            container = document.querySelector(container) as HTMLElement;
        }

        // Default Position and height to ensure DnD works
        if (!container.style.position) {
            container.style.position = null; // revert to stylesheet value
        }

        if (container.clientHeight < 1) {
            container.style.height = null; // revert to stylesheet value
        }

        // injectStylesheetTemplate(this, true, 'grid');

        this.setStyles(container, options?.edgeStyleValues, Revgrid.edgeStyleKeys);
        container.removeAttribute('tabindex');

        container.classList.add(Revgrid.gridContainerElementCssClass);
        container.id = container.id || Revgrid.gridContainerElementCssIdBase + (document.querySelectorAll('.' + Revgrid.gridContainerElementCssClass).length - 1 || '');

        return container;
    }

    /**
     * @summary Initialize drawing surface.
     * @param {object} [options]
     * @param {object} [options.margin] - Optional canvas "margins" applied to containing div as .left, .top, .right, .bottom. (Default values actually derive from 'grid' stylesheet's `.hypergrid-container` rule.)
     * @param {string} [options.margin.top='0px']
     * @param {string} [options.margin.right='0px']
     * @param {string} [options.margin.bottom='0px']
     * @param {string} [options.margin.left='0px']
     * @param {any} [options.contextAttributes] TODO
     * @param {any} [options.canvasContextAttributes] TODO
     * @this {Revgrid}
     * @private
     */
    createCanvas(options?: Revgrid.Options): Canvas {
        // const canvasDiv = document.createElement('div');

        // canvasDiv.style.height = '100%';
        // canvasDiv.style.display = 'flex';
        // canvasDiv.style.flexDirection = 'column';
        // canvasDiv.style.width = '100%';
        // canvasDiv.style.minWidth = '0'; // Need this to ensure flex item has 0 minimum width (instead of minimum being content width)
        // canvasDiv.style.overflowX = 'clip'; // There are some small overflows - probably due to width calculations. Need to fix
        // canvasDiv.style.overflowY = 'clip'; // There are some small overflows - probably due to width calculations. Need to fix
        // this.setStyles(canvasDiv, options?.margin, Hypegrid.edgeStyleKeys);

        // this.containerHtmlElement.appendChild(canvasDiv);

        const contextAttributes = options?.canvasContextAttributes;
        const canvas = new Canvas(this.containerHtmlElement, contextAttributes);
        canvas.canvas.classList.add(Revgrid.gridElementCssClass);

        return canvas;
    }

    convertViewPointToDataPoint(unscrolled: Point) {
        return Point.create(
            this._columnsManager.getActiveColumn(unscrolled.x).index,
            unscrolled.y
        );
    }

    // convertDataPointToViewPoint(dataPoint: Point) {
    //     return this.behavior.convertDataPointToViewPoint(dataPoint); // not implemented
    // }

    /**
     * @desc Switch the cursor for a grid instance.
     * @param cursorName - A well know cursor name.
     * {@link http://www.javascripter.net/faq/stylesc.htm|cursor names}
     */
    beCursor(cursorName: string) {
        this.containerHtmlElement.style.cursor = cursorName;
    }

    createCellEditor(name: string) {
        return cellEditorFactory.tryCreate(this, name);
    }

    /**
     * @summary Shut down the current cell editor and save the edited value.
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    stopEditing() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    }

    /**
     * @summary Shut down the current cell editor without saving the edited val
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    cancelEditing() {
        return !this.cellEditor || this.cellEditor.cancelEditing();
    }

    /**
     * @summary Give cell editor opportunity to cancel (or something) instead of stop .
     * @returns One of:
     * * `false` - Editing BUT could not abort.
     * * `true` - Not editing OR was editing AND abort was successful.
     */
    abortEditing() {
        return !this.cellEditor || this.cellEditor.stopEditing();
    }

    /**
     * @returns The pixel coordinates of just the center 'main" data area.
     */
    getDataBounds() {
        const b = this.canvas.bounds;
        return new Rectangle(0, 0, b.origin.x + b.extent.x, b.origin.y + b.extent.y);
    }

    /**
     * @summary Open the cell-editor for the cell at the given coordinates.
     * @param cellEvent - Coordinates of "edit point" (gridCell.x, dataCell.y).
     * @return The cellEditor determined from the cell's render properties, which may be modified by logic added by overriding {@link DataModel#getCellEditorAt|getCellEditorAt}.
     */
    editAt(cellEvent: CellEvent): CellEditor | undefined {
        let cellEditor: CellEditor;

        this.abortEditing(); // if another editor is open, close it first

        if (
            cellEvent.isDataColumn &&
            cellEvent.columnProperties[cellEvent.isMainRow ? 'editable' : 'filterable'] &&
            (cellEditor = this.getCellEditorAt(cellEvent))
        ) {
            cellEditor.beginEditing();
        }

        return cellEditor;
    }

    /**
     * @param activeIndex - The column index in question.
     * @returns The given column is fully visible.
     */
    isColumnVisible(activeIndex: number) {
        return this.renderer.isColumnVisible(activeIndex);
    }

    /**
     * @param r - The raw row index in question.
     * @returns The given row is fully visible.
     */
    isDataRowVisible(r: number) {
        return this.renderer.isDataRowVisible(r);
    }

    /**
     * @param c - The column index in question.
     * @param rn - The grid row index in question.
     * @returns The given cell is fully is visible.
     */
    isDataVisible(c: number, rn: number) {
        return this.isDataRowVisible(rn) && this.isColumnVisible(c);
    }

    /**
     * @summary Scroll in the `offsetX` direction if column index `colIndex` is not visible.
     * @param colIndex - The column index in question.
     * @param offsetX - The direction and magnitude to scroll if we need to.
     * @return Column is visible.
     */
    ensureModelColIsVisible(colIndex: number, offsetX: number) {
        const maxCols = this.getActiveColumnCount() - 1; // -1 excludes partially visible columns
        const indexToCheck = colIndex + Math.sign(offsetX);
        const visible = !this.isColumnVisible(indexToCheck) || colIndex === maxCols;

        if (visible) {
            //the scroll position is the leftmost column
            this.scrollColumnsBy(offsetX);
        }

        return visible;
    }

    /**
     * @summary Scroll in the `offsetY` direction if column index c is not visible.
     * @param rowIndex - The column index in question.
     * @param offsetX - The direction and magnitude to scroll if we need to.
     * @return Row is visible.
     */
    ensureModelRowIsVisible(rowIndex: number, offsetY: number) {
        const maxRows = this.getRowCount() - 1; // -1 excludes partially visible rows
        const scrollOffset = (offsetY > -1) ? 1 : 0; // 1 to keep one blank line below active cell, 0 to keep zero lines above active cell
        const indexToCheck = rowIndex + scrollOffset;
        const visible = !this.isDataRowVisible(indexToCheck) || rowIndex === maxRows;

        if (visible) {
            //the scroll position is the topmost row
            this.scrollVBy(offsetY);
        }

        return visible;
    }

    /**
     * @summary Answer which data cell is under a pixel value mouse point.
     * @param mouse - The mouse point to interrogate.
     */
    getGridCellFromMousePoint(mouse: Point) {
        return this.renderer.getGridCellFromMousePoint(mouse);
    }

    /**
     * @param gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns The pixel based bounds rectangle given a data cell point.
     */
    getBoundsOfCell(gridCell: Point): RectangleInterface {
        const {x, y, width, height} = this.renderer.getBoundsOfCell(gridCell.x, gridCell.y);

        //convert to a proper rectangle
        return new Rectangle(x, y, width, height);
    }

    /**
     * @desc This is called by the fin-canvas when a resize occurs.
     */
    resized() {
        this.behaviorShapeChanged();
    }

    /**
     * @desc Determine the cell and delegate to the behavior (model).
     * {@link Local#cellClicked}
     * @param event - The cell event to interrogate.
     * {@link DataModel#toggleRow}'s return value which may or may not be implemented.
     */
    cellClicked(event: CellEvent): boolean | undefined {
        const toggleRow = this.mainDataModel.toggleRow;
        if (toggleRow === undefined) {
            return undefined;
        } else {
            return this.mainDataModel.toggleRow(event.dataCell.y, event.dataCell.x);
        }
    }

    /**
     * To intercept link clicks, override this method (either on the prototype to apply to all grid instances or on an instance to apply to a specific grid instance).
     */
    windowOpen(url: string, name: string, features?: string) {
        return window.open(url, name, features);
    }

    getSchema(): readonly SchemaModel.Column[] {
        return this._columnsManager.getSchema();
    }

    getAllColumn(allX: number) {
        return this._columnsManager.getAllColumn(allX);
    }

    /**
     * @returns A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getAllColumns(begin?: number, end?: number): Column[] {
        const columns = this._columnsManager.allColumns;
        return columns.slice(begin, end);
    }

    /**
     * @returns A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns(begin?: number, end?: number): Column[] {
        const columns = this._columnsManager.activeColumns;
        return columns.slice(begin, end);
    }

    getHiddenColumns() {
        //A non in-memory behavior will be more troublesome
        return this._columnsManager.getHiddenColumns();
    }

    hideActiveColumn(activeColumnIndex: number) {
        this._columnsManager.hideActiveColumn(activeColumnIndex);
        const activeColumns = this._columnsManager.activeColumns;
        this.properties.columnIndexes = activeColumns.map((column) => column.index );
        this.updateHorizontalScroll(true);
        this.behaviorChanged();
    }

    showColumns(columnIndexes: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    showColumns(isActiveColumnIndexes: boolean, columnIndexes?: number | number[], referenceIndex?: number, allowDuplicateColumns?: boolean): void;
    showColumns(
        columnIndexesOrIsActiveColumnIndexes: boolean | number | number[],
        referenceIndexOrColumnIndexes?: number | number[],
        allowDuplicateColumnsOrReferenceIndex?: boolean | number,
        allowDuplicateColumns = false
    ): void {
        this._columnsManager.showColumns(columnIndexesOrIsActiveColumnIndexes, referenceIndexOrColumnIndexes, allowDuplicateColumnsOrReferenceIndex, allowDuplicateColumns);
    }

    clearColumns() {
        this._columnsManager.clearColumns();
    }

    moveColumnBefore(sourceIndex: number, targetIndex: number) {
        this._columnsManager.moveColumnBefore(sourceIndex, targetIndex);
        this.updateHorizontalScroll(true);
        this.behaviorChanged();
    }

    moveColumnAfter(sourceIndex: number, targetIndex: number) {
        this._columnsManager.moveColumnAfter(sourceIndex, targetIndex);
        this.updateHorizontalScroll(true);
        this.behaviorChanged();
    }

    setColumnOrder(allColumnIndexes: number[]) {
        this._columnsManager.setColumnOrder(allColumnIndexes);
    }

    setColumnOrderByName(allColumnNames: string[]) {
        this._columnsManager.setColumnOrderByName(allColumnNames);
    }

    autosizeAllColumns() {
        this._columnsManager.autosizeAllColumns();
    }


    /**
     * @desc Request input focus.
     */
    takeFocus() {
        const wasCellEditor = this.cellEditor;
        this.stopEditing();
        if (!wasCellEditor) {
            this.canvas.takeFocus();
        }
    }

    /**
     * @desc Request focus for our cell editor.
     */
    editorTakeFocus() {
        if (this.cellEditor) {
            return this.cellEditor.takeFocus();
        }
    }

    /**
     * @desc Note that "viewable rows" includes any partially viewable rows.
     * @returns {number} The number of viewable rows.
     */
    // getVisibleRows() {
    //     return this.renderer.getVisibleRows(); // not implemented
    // }

    /**
     * @desc Note that "viewable columns" includes any partially viewable columns.
     * @returns The number of viewable columns.
     */
    // getVisibleColumns() {
    //     return this.renderer.getVisibleColumns(); // not implemented
    // }

    calculateActiveColumnsWidth() {
        const lineWidth = this.properties.gridLinesVWidth;
        const columnsManager = this._columnsManager;
        const activeColumnCount = columnsManager.getActiveColumnCount();
        const fixedColumnCount = this.getFixedColumnCount();

        let width = 0;
        for (let i = 0; i < activeColumnCount; i++) {
            width += columnsManager.getActiveColumnWidth(i);

            if (i > 0) {
                if (i === fixedColumnCount && i !== 0) {
                    const fixedLineWidth = this.properties.fixedLinesVWidth ?? lineWidth;
                    width += fixedLineWidth;
                } else {
                    width += lineWidth;
                }
            }
        }

        return width;
    }

    calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this.properties.gridLinesVWidth;
        const columnCount = this.getActiveColumnCount();
        const fixedColumnCount = this.getFixedColumnCount();
        let result = 0;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            result += this.getActiveColumnWidth(i);
        }

        if (gridLinesVWidth > 0) {
            const scrollableColumnCount = columnCount - fixedColumnCount;
            if (scrollableColumnCount > 1) {
                result += (scrollableColumnCount - 1) * gridLinesVWidth;
            }
        }

        return result;
    }

    calculateColumnScrollContentSizeAndAnchorLimits(
        contentStart: number, // Fixed columns width + fixed gridline width
        viewportSize: number,
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number,
    ): Renderer.ScrollContentSizeAndAnchorLimits {
        let contentSize = this.calculateActiveNonFixedColumnsWidth();
        let anchorLimits: Renderer.ScrollAnchorLimits;

        const contentOverflowed = contentSize > viewportSize && columnCount > fixedColumnCount
        if (contentOverflowed) {
            let leftAnchorLimitIndex: number;
            let leftAnchorLimitOffset: number;
            let rightAnchorLimitIndex: number;
            let rightAnchorLimitOffset: number;

            const gridLinesVWidth = this.properties.gridLinesVWidth;
            if (gridRightAligned) {
                rightAnchorLimitIndex = columnCount - 1;
                rightAnchorLimitOffset = 0;
                let prevColumnGridLineFinish = contentStart - 1;
                const lowestViewportFinish = prevColumnGridLineFinish + viewportSize;
                let lowestViewportStartColumnIndex = fixedColumnCount;
                let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this.getActiveColumnWidth(lowestViewportStartColumnIndex);
                while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
                    prevColumnGridLineFinish = lowestViewportStartColumnFinish;
                    lowestViewportStartColumnIndex++;
                    lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this.getActiveColumnWidth(lowestViewportStartColumnIndex) + gridLinesVWidth);
                }
                leftAnchorLimitIndex = lowestViewportStartColumnIndex;
                leftAnchorLimitOffset = lowestViewportStartColumnFinish - lowestViewportFinish;
                if (!this.properties.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
                    contentSize += (lowestViewportFinish - prevColumnGridLineFinish);
                    if (leftAnchorLimitOffset !== 0) {
                        leftAnchorLimitOffset = 0;
                        if (leftAnchorLimitIndex > fixedColumnCount) {
                            leftAnchorLimitIndex--;
                        }
                    }
                }
            } else {
                leftAnchorLimitIndex = fixedColumnCount;
                leftAnchorLimitOffset = 0;
                const highestViewportStart = contentSize - viewportSize;
                let nextColumnLeft = contentSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this.getActiveColumnWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this.getActiveColumnWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
                }
                rightAnchorLimitIndex = highestViewportStartColumnIndex;
                rightAnchorLimitOffset = highestViewportStart - highestViewportStartColumnLeft;
                if (!this.properties.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
                    contentSize += (nextColumnLeft - highestViewportStart);
                    if (rightAnchorLimitOffset !== 0) {
                        rightAnchorLimitOffset = 0;
                        if (rightAnchorLimitIndex < columnCount - 1) {
                            rightAnchorLimitIndex++;
                        }
                    }
                }
            }

            anchorLimits = {
                startAnchorLimitIndex: leftAnchorLimitIndex,
                startAnchorLimitOffset: leftAnchorLimitOffset,
                finishAnchorLimitIndex: rightAnchorLimitIndex,
                finishAnchorLimitOffset: rightAnchorLimitOffset,
            }
        } else {
            anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
        }

        return {
            contentSize,
            contentOverflowed,
            anchorLimits,
        };
    }

    calculateColumnScrollInactiveAnchorLimits(
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number
    ): Renderer.ScrollAnchorLimits {
        let startAnchorLimitIndex: number;
        let finishAnchorLimitIndex: number;
        if (gridRightAligned) {
            finishAnchorLimitIndex = columnCount - 1;
            startAnchorLimitIndex = finishAnchorLimitIndex;
        } else {
            startAnchorLimitIndex = fixedColumnCount;
            finishAnchorLimitIndex = startAnchorLimitIndex;
        }
        return {
            startAnchorLimitIndex,
            startAnchorLimitOffset: 0,
            finishAnchorLimitIndex,
            finishAnchorLimitOffset: 0,
        };
    }

    calculateColumnScrollAnchorViewportStart(): number {
        const gridRightAligned = this.properties.gridRightAligned;
        if (gridRightAligned) {
            const finish = this.renderer.calculateColumnScrollAnchorViewportFinish(this.sbHScroller.contentFinish);
            return finish - this.sbHScroller.viewportSize + 1;
        } else {
            return this.renderer.calculateColumnScrollAnchorViewportStart(this.sbHScroller.contentStart);
        }
    }

    getColumnScrollableLeft(activeIndex: number) {
        const fixedColumnCount = this.getFixedColumnCount();
        if (activeIndex < fixedColumnCount) {
            throw new AssertError('HGCSL89933');
        } else {
            const gridLinesVWidth = this.properties.gridLinesVWidth;
            let result = 0;
            for (let i = fixedColumnCount; i < activeIndex; i++) {
                result += this.getActiveColumnWidth(i);
            }

            if (gridLinesVWidth > 0) {
                const scrollableColumnCount = activeIndex - fixedColumnCount;
                if (scrollableColumnCount > 1) {
                    result += (scrollableColumnCount - 1) * gridLinesVWidth;
                }
            }

            return result;
        }
    }

    getActiveColumn(activeIndex: number) {
        return this._columnsManager.getActiveColumn(activeIndex);
    }

    getActiveColumnIndexByAllIndex(allIndex: number) {
        return this._columnsManager.getActiveColumnIndexByAllIndex(allIndex);
    }

    /**
     * @returns The width of the given column.
     * @param activeIndex - The untranslated column index.
     */
    getActiveColumnWidth(activeIndex: number) {
        return this._columnsManager.getActiveColumnWidth(activeIndex);
    }

    /**
     * @desc Set the width of the given column.
     * @param columnIndex - The untranslated column index.
     * @param columnWidth - The width in pixels.
     * @return column if width changed otherwise undefined
     */
    setActiveColumnWidth(columnOrIndex: number | Column, columnWidth: number) {
        if (this.abortEditing()) {
            return this._columnsManager.setActiveColumnWidth(columnOrIndex, columnWidth);
        } else {
            return undefined;
        }
    }

    /**
     * @returns The total width of all the fixed columns.
     */
    calculateFixedColumnsWidth(): number {
        const count = this.getFixedColumnCount();
        if (count === 0) {
            return 0;
        } else {
            let total = 0;

            for (let i = 0; i < count; i++) {
                const columnWidth = this.getActiveColumnWidth(i);
                total += columnWidth;
            }

            total += (count - 1) * this.properties.gridLinesVWidth;

            return total;
        }
    }

    /**
     * @returns The height of the given row
     * @param rowIndex - The untranslated fixed column index.
     */
    getRowHeight(rowIndex: number, subgrid?: Subgrid) {
        return this.behavior.getRowHeight(rowIndex, subgrid);
    }

    /**
     * @desc Set the height of the given row.
     * @param rowIndex - The row index.
     * @param rowHeight - The width in pixels.
     */
    setRowHeight(rowIndex: number, rowHeight: number, subgrid: Subgrid) {
        if (this.abortEditing()) {
            this.behavior.setRowHeight(rowIndex, rowHeight, subgrid);
        }
    }

    /**
     * @summary The total height of the "fixed rows."
     * @desc The total height of all (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @return The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowsHeight(): number {
        const subgrids = this._subgrids;
        const gridProps = this.properties;
        const gridLinesHWidth = gridProps.gridLinesHWidth;
        let isMain = false;
        let height = 0;

        for (let i = 0; i < subgrids.length && !isMain; ++i) {
            const subgrid = subgrids[i];
            isMain = subgrid.isMain;
            const R = isMain ? gridProps.fixedRowCount : subgrid.dataModel.getRowCount();
            for (let r = 0; r < R; ++r) {
                height += this.getRowHeight(r, subgrid);
                height += gridLinesHWidth;
            }
            // add in fixed rule thickness excess
            if (isMain && gridProps.fixedLinesHWidth) {
                height += gridProps.fixedLinesHWidth - gridLinesHWidth;
            }
        }

        return height;
    }

    /**
     * @returns The number of fixed columns.
     */
    getFixedColumnCount(): number {
        return this.properties.fixedColumnCount;
    }

    /**
     * @desc set the number of fixed columns
     * @param n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount(n: number) {
        this.properties.fixedColumnCount = n;
    }

    /**
     * @summary The number of "fixed rows."
     * @desc The number of (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @return The sum of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    getFixedRowCount() {
        return (
            this.getHeaderRowCount() +
            this.properties.fixedRowCount
        );
    }

    /**
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @param n - The number of rows.
     */
    setFixedRowCount(n: number) {
        this.properties.fixedRowCount = n;
    }

    /**
     * @summary The top left area has been clicked on
     * @desc Delegates to the behavior.
     * @param {event} mouse - The event details.
     */
    // topLeftClicked(mouse) {
    //     this.behavior.topLeftClicked(this, mouse); // not implemented
    // }

    /**
     * @summary A fixed row has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // rowHeaderClicked(mouse) {
    //     this.behavior.rowHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @summary A fixed column has been clicked.
     * @desc Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // columnHeaderClicked(mouse) {
    //     this.behavior.columnHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @desc An edit event has occurred. Activate the editor at the coordinates specified by the event.
     * @param event - The horizontal coordinate.
     * @returns The editor object or `undefined` if no editor or editor already open.
     */
    onEditorActivate(event: CellEvent) {
        return this.editAt(event);
    }

    /**
     * @summary Get the cell editor.
     * @desc Delegates to the behavior.
     * @returns The cell editor at the given coordinates.
     */
    getCellEditorAt(event: CellEvent) {
        return this.behavior.getCellEditorAt(event);
    }

    /**
     * @summary Toggle HiDPI support.
     * @desc HiDPI support is now *on* by default.
     * > There used to be a bug in Chrome that caused severe slow down on bit blit of large images, so this HiDPI needed to be optional.
     */
    toggleHiDPI() {
        if (this.properties.useHiDPI) {
            this.removeAttribute('hidpi');
        } else {
            this.setAttribute('hidpi', null);
        }
        this.canvas.resize();
    }

    /**
     * @returns The HiDPI ratio.
     */
    getHiDPI() {
        return this.canvas.devicePixelRatio;
    }

    /**
     * @returns The width of the given (recently rendered) column.
     * @param colIndex - The column index.
     */
    getRenderedWidth(colIndex: number): number {
        return this.renderer.getRenderedWidth(colIndex);
    }

    /**
     * @returns The height of the given (recently rendered) row.
     * @param rowIndex - The row index.
     */
    getRenderedHeight(rowIndex: number): number {
        return this.renderer.getRenderedHeight(rowIndex);
    }

    /**
     * @desc Update the cursor under the hover cell.
     */
    updateCursor() {
        let cursor = this.behavior.getCursorAt(-1, -1);
        const hoverGridCell = this.hoverGridCell;
        if (
            hoverGridCell &&
            hoverGridCell.x > -1 &&
            hoverGridCell.y > -1
        ) {
            const x = hoverGridCell.x + this.renderer.firstNonFixedColumnIndex;
            cursor = this.behavior.getCursorAt(x, hoverGridCell.y + this.getVScrollValue());
        }
        this.beCursor(cursor);
    }

    /**
     * @desc Repaint the given cell.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    // repaintCell(x: number, y: number) {
    //     this.renderer.repaintCell(x, y); // not implemented
    // }

    /**
     * @returns The user is currently dragging a column to reorder it.
     */
    // isDraggingColumn(): boolean {
    //     return !!this.renderOverridesCache.dragger;
    // }

    /**
     * @returns Objects with the values that were just rendered.
     */
    getRenderedData(): Array<Array<unknown>> {
        return this.renderer.getVisibleCellMatrix();
    }

    /**
     * @summary Autosize a column for best fit.
     * @param {Column|number} columnOrIndex - The column or active column index.
     */
    autosizeColumn(columnOrIndex: Column | number) {
        let column: Column;
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 2) {
                column = this._columnsManager.getActiveColumn(columnOrIndex);
            } else {
                throw new Error('Column index must be >= -2');
            }
        } else {
            column = columnOrIndex;
        }
        column.checkColumnAutosizing(true);
        this.computeCellsBounds();
    }

    /**
     * @desc Reset zoom factor used by mouse tracking and placement
     * of cell editors on top of canvas.
     *
     * Call this after resetting `document.body.style.zoom`.
     * (Do not set `zoom` style on canvas or any other ancestor thereof.)
     *
     * **NOTE THE FOLLOWING:**
     * 1. `zoom` is non-standard (unsupported by FireFox)
     * 2. The alternative suggested on MDN, `transform`, is ignored
     * here as it is not a practical replacement for `zoom`.
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
     *
     * @todo Scrollbars need to be repositioned when `canvas.style.zoom` !== 1. (May need update to finbars.)
     */
    // resetZoom() {
    //     this.abortEditing();
    //     this.canvas.resetZoom();
    // }

    // getBodyZoomFactor() {
    //     return this.canvas.bodyZoomFactor;
    // }

    /**
     * @desc Enable/disable if this component can receive the focus.
     */
    // setFocusable(canReceiveFocus: boolean) {
    //     this.canvas.setFocusable(canReceiveFocus);
    // }

    /**
     * @returns The number of columns that were just rendered
     */
    getVisibleColumnsCount() {
        return this.renderer.getVisibleColumnsCount();
    }

    /**
     * @returns The number of rows that were just rendered
     */
    getVisibleRowsCount() {
        return this.renderer.getVisibleRowsCount();
    }

    /**
     * @desc Update the size of a grid instance.
     */
    updateSize() {
        this.canvas.checksize();
    }


    /**
     * @desc Stop the global repainting flag thread.
     */
    // stopPaintThread() {
    //     this.canvas.stopPaintThread(); // not implemented
    // }

    /**
     * @desc Stop the global resize check flag thread.
     */
    // stopResizeThread() {
    //     this.canvas.stopResizeThread(); // not implemented
    // }

    /**
     * @desc Restart the global resize check flag thread.
     */
    // restartResizeThread() {
    //     this.canvas.restartResizeThread(); // not implemented
    // }

    /**
     * @desc Restart the global repainting check flag thread.
     */
    // restartPaintThread() {
    //     this.canvas.restartPaintThread(); // not implemented
    // }

    swapColumns(source: number, target: number) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this._columnsManager.swapColumns(source, target);
    }

    endDragColumnNotification() {
        this.behavior.endDragColumnNotification();
    }

    isMouseDownInHeaderArea() {
        const headerRowCount = this.getHeaderRowCount();
        const mouseDown = this.getMouseDown();
        return mouseDown.x < 0 || mouseDown.y < headerRowCount;
    }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     */
    getColumnProperties(x: number): ColumnProperties | undefined {
        return this._columnsManager.getActiveColumnProperties(x);
    }

    /**
     * @param x - Data x coordinate.
     * @return The properties for a specific column.
     */
    setColumnProperties(x: number, properties: ColumnProperties) {
        this._columnsManager.setColumnProperties(x, properties);
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param x - Omit for all columns.
     */
    clearAllCellProperties(x: number) {
        this._columnsManager.clearAllCellProperties(x);
        this.renderer.resetAllCellPropertiesCaches();
    }

    isGridRow(y: number) {
        return new CellEvent(this, 0, y).isMainRow;
    }

    lookupFeature(key: string) {
        return this._featureManager.lookupFeature(key);
    }

    newPoint(x: number, y: number) {
        return Point.create(x, y);
    }
    newRectangle(x: number, y: number, width: number, height: number) {
        return new Rectangle(x, y, width, height);
    }

    // decorateColumnArray(array) {
    //     if (!this.columnArrayDecorations) {
    //         var grid = this;
    //         this.columnArrayDecorations = {
    //             findWithNeg: {
    //                 // Like the Array.prototype version except searches the negative indexes as well.
    //                 value: function(iteratee, context) {
    //                     for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
    //                         if (!this[i]) {
    //                             continue;
    //                         }
    //                         if (iteratee.call(context, this[i], i, this)) {
    //                             return this[i];
    //                         }
    //                     }
    //                     return this.find(iteratee, context);
    //                 }
    //             },
    //             forEachWithNeg: {
    //                 // Like the Array.prototype version except it iterates the negative indexes as well.
    //                 value: function(iteratee, context) {
    //                     for (var i = grid.behavior.leftMostColIndex; i < 0; i++) {
    //                         if (!this[i]) {
    //                             continue;
    //                         }
    //                         iteratee.call(context, this[i], i, this);
    //                     }
    //                     return this.forEach(iteratee, context);
    //                 }

    //             }
    //         };
    //     }
    //     return Object.defineProperties(array || [], this.columnArrayDecorations);
    // }


    // Begin Events Mixin
    /**
     * @summary Add an event listener to me.
     * @desc Listeners added by this method should only be removed by {@link Revgrid#removeEventListener|grid.removeEventListener} (or {@link Revgrid#removeAllEventListeners|grid.removeAllEventListeners}).
     * @param eventName - The type of event we are interested in.
     * @param listener - The event handler.
     * @param internal - Used by {@link Revgrid#addInternalEventListener|grid.addInternalEventListener} (see).
     */
    addEventListener<T extends EventName>(eventName: T, listener: Canvas.EventListener<T>, internal?: boolean) {
        let alreadyAttached: boolean;
        let listenerInfos = this.eventlistenerInfos.get(eventName);
        if (listenerInfos === undefined) {
            listenerInfos = [];
            alreadyAttached = false;
        } else {
            const listenerInfo = listenerInfos.find((info) => info.listener === listener);
            alreadyAttached = listenerInfo !== undefined;
        }

        if (!alreadyAttached) {
            const info: Revgrid.TypedListenerInfo<T> = {
                internal: internal === true,
                listener,
                decorator: (e) => {
                    if (this.allowEventHandlers) {
                        listener(e);
                    }
                }
            };
            listenerInfos.push(info);
            this.eventlistenerInfos.set(eventName, listenerInfos);
            this.canvas.addEventListener(eventName, info.decorator);
        }
    }

    /**
     * @summary Add an internal event listener to me.
     * @desc The new listener is flagged as "internal." Internal listeners are removed as usual by {@link Revgrid#removeEventListener|grid.removeEventListener}. However, they are ignored by {@link Revgrid#removeAllEventListeners|grid.removeAllEventListeners()} (as called by {@link Revgrid#reset|reset}). (But see {@link Revgrid#removeAllEventListeners|grid.removeAllEventListeners(true)}.)
     *
     * Listeners added by this method should only be removed by {@link Revgrid#removeEventListener|grid.removeEventListener} (or {@link Revgrid#removeAllEventListeners|grid.removeAllEventListeners(true)}).
     * @param eventName - The type of event we are interested in.
     * @param listener - The event handler.
     */
    addInternalEventListener<T extends EventName>(eventName: T, listener: Canvas.EventListener<T>) {
    // addInternalEventListener(eventName: string, listener: Canvas.Listener) {
        this.addEventListener(eventName, listener, true);
    }

    /**
     * @summary Remove an event listeners.
     * @desc Removes the event listener with matching name and function that was added by {@link Revgrid#addEventListener|grid.addEventListener}.
     *
     * NOTE: This method cannot remove event listeners added by other means.
     */

    removeEventListener<T extends EventName>(eventName: T, listener: Canvas.EventListener<T>) {
        const listenerInfos = this.eventlistenerInfos.get(eventName);

        if (listenerInfos !== undefined) {
            listenerInfos.find(
                (info, index) => {
                    if (info.listener === listener) {
                        if (listenerInfos.length === 1) {
                            this.eventlistenerInfos.delete(eventName);
                        } else {
                            listenerInfos.splice(index, 1); // remove it from the list
                        }
                        this.canvas.removeEventListener<T>(eventName, info.decorator as Canvas.EventListener<T>);
                        return true;
                    } else {
                        return false;
                    }
                }
            )
        }
    }

    /**
     * @summary Remove all event listeners.
     * @desc Removes all event listeners added with {@link Revgrid#addEventListener|grid.addEventListener} except those added as "internal."
     * @param includeInternal - Include internal listeners.
     */
    removeAllEventListeners(includeInternal = false) {
        for (const [key, value] of this.eventlistenerInfos) {
            value.forEach(
                (info) => {
                    if (includeInternal || !info.internal) {
                        const eventName = key as EventName;
                        this.removeEventListener<never>(eventName as never, info.listener); // use base class so declare type as never
                    }
                }
            )
        }
    }

    /**
     * @param allow
     */
    allowEvents(allow: boolean){
        this.allowEventHandlers = !!allow;

        if (allow){
            this._featureManager.enable();
        } else {
            this._featureManager.disable();
        }

        this.behaviorChanged();
    }

    /**
     * @param c - grid column index.
     * @desc Synthesize and fire a `fin-column-sort` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSortEvent(eventDetail: EventDetail.ColumnSort): boolean {
        return dispatchGridEvent(this, 'rev-column-sort', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keyup` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyUpEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const eventDetail: CellEditor.KeyEventDetail = {
            editor: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'rev-editor-keyup', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keydown` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyDownEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const eventDetail: CellEditor.KeyEventDetail = {
            editor: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'rev-editor-keydown', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-keypress` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorKeyPressEvent(inputControl: CellEditor, keyEvent: KeyboardEvent) {
        const eventDetail: CellEditor.KeyEventDetail = {
            editor: inputControl,
            keyEvent: keyEvent,
        }
        return dispatchGridEvent(this, 'rev-editor-keypress', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-editor-data-change` event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticEditorDataChangeEvent(editor: CellEditor, oldValue: unknown, newValue: unknown) {
        const eventDetail: CellEditor.DataChangeEventDetail = {
            editor,
            oldValue,
            newValue,
            point: undefined,
        };

        return dispatchGridEvent(this, 'rev-editor-data-change', true, eventDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-row-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticRowSelectionChangedEvent() {
        const selectionDetail = new SelectionDetailAccessor(this.mainSubgrid.selectionModel);
        return dispatchGridEvent(this, 'rev-row-selection-changed', false, selectionDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticColumnSelectionChangedEvent() {
        const selectionDetail = new SelectionDetailAccessor(this.mainSubgrid.selectionModel);
        return dispatchGridEvent(this, 'rev-column-selection-changed', false, selectionDetail);
    }

    /**
     * @desc Synthesize and fire a `fin-context-menu` event
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticContextMenuEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'rev-context-menu', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mouseup` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseUpEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'rev-mouseup', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mousedown` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseDownEvent(event: CellEvent) {
        return dispatchGridEvent(this, 'rev-mousedown', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-mousemove` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticMouseMoveEvent(event: CellEvent | undefined) {
        return dispatchGridEvent(this, 'rev-mousemove', false, event);
    }

    /**
     * @desc Synthesize and fire a `fin-button-pressed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticButtonPressedEvent(event: CellEvent) {
        if (event.cellPainter instanceof ButtonCellPainter) { // Button or subclass thereof?
            // if (event.value && event.value.subrows) {
            //     var y = event.primitiveEvent.detail.mouse.y - event.bounds.y,
            //         subheight = event.bounds.height / event.value.subrows;
            //     event.subrow = Math.floor(y / subheight);
            // }
            return dispatchGridEvent(this, 'rev-button-pressed', false, event);
        } else {
            return undefined;
        }
    }

    /**
     * @desc Synthesize and fire a `fin-column-drag-start` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnColumnsChangedEvent() {
        return dispatchGridEvent(this, 'rev-column-changed-event', false, undefined);
    }

    /**
     * @desc Synthesize and fire a `fin-keydown` event.
     * @param event - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeydownEvent(detail: EventDetail.Keyboard) {
        return dispatchGridEvent(this, 'rev-keydown', false, detail);
    }

    /**
     * @desc Synthesize and fire a `fin-keyup` event.
     * @param event - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticKeyupEvent(detail: EventDetail.Keyboard) {
        return dispatchGridEvent(this, 'rev-keyup', false, detail);
    }

    /**
     * @desc Synthesize and fire a fin-filter-applied event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticFilterAppliedEvent() {
        return dispatchGridEvent(this, 'rev-filter-applied', false, undefined);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-enter` event
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellEnterEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'rev-cell-enter', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-exit` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticOnCellExitEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'rev-cell-exit', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-cell-click` event.
     * @param event - The system mouse event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticClickEvent(cellEvent: CellEvent) {
        return dispatchGridEvent(this, 'rev-click', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a `fin-double-click` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticDoubleClickEvent(cellEvent: CellEvent) {
        if (!this.abortEditing()) { return undefined; }

        return dispatchGridEvent(this, 'rev-double-click', false, cellEvent);
    }

    /**
     * @desc Synthesize and fire a fin-grid-rendered event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridRenderedEvent() {
        const eventDetail: EventDetail.Grid = {
            time: Date.now(),
            source: this,
        }
        return dispatchGridEvent(this, 'rev-grid-rendered', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a fin-tick event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTickEvent() {
        const eventDetail: EventDetail.Grid = {
            time: Date.now(),
            source: this,
        }
        return dispatchGridEvent(this, 'rev-tick', false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a fin-grid-resized event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticGridResizedEvent(detail: EventDetail.Resize) {
        return dispatchGridEvent(this, 'rev-grid-resized', false, detail);
    }

    /**
     * @desc Synthesize and fire a `fin-touchstart` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchStartEvent(detail: EventDetail.Touch) {
        return dispatchGridEvent(this, 'rev-touchstart', false, detail);
    }

    /**
     * @desc Synthesize and fire a `fin-touchmove` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchMoveEvent(detail: EventDetail.Touch) {
        return dispatchGridEvent(this, 'rev-touchmove', false, detail);
    }

    /**
     * @desc Synthesize and fire a `fin-touchend` event.
     * @param e - The canvas event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireSyntheticTouchEndEvent(detail: EventDetail.Touch) {
        return dispatchGridEvent(this, 'rev-touchend', false, detail);
    }

    /**
     * @desc Synthesize and fire a scroll event.
     * @param type - Should be either `fin-scroll-x` or `fin-scroll-y`.
     * @param oldValue - The old scroll value.
     * @param newValue - The new scroll value.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireScrollEvent(eventName: 'rev-scroll-x' | 'rev-scroll-y', newValue: number, index: number, offset: number) {
        const eventDetail: EventDetail.Scroll = {
            time: Date.now(),
            value: newValue,
            index,
            offset,
        };
        return dispatchGridEvent(this, eventName, false, eventDetail);
    }

    /**
     * @desc Synthesize and fire a fin-request-cell-edit event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireRequestCellEdit(editor: CellEditor, cellEvent: CellEvent, value: unknown) {
        const eventDetail: CellEditor.RequestCellEditDetail = {
            editor,
            value,
            cellEvent,
        }
        return dispatchGridEvent(this, 'rev-request-cell-edit', true, eventDetail);
    }

    /**
     * @desc Synthesize and fire a fin-before-cell-edit event.
     *
     * This event is cancelable.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireBeforeCellEdit(point: WritablePoint, oldValue: unknown, newValue: unknown, control: CellEditor) {
        const eventDetail: CellEditor.DataChangeEventDetail = {
            editor: control,
            oldValue: oldValue,
            newValue: newValue,
            point,
        };
        return dispatchGridEvent(this, 'rev-before-cell-edit', true, eventDetail);
    }

    /**
     * @param point - The x,y coordinates.
     * @param oldValue - The old value.
     * @param newValue - The new value.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    fireAfterCellEdit(point: WritablePoint, oldValue: unknown, newValue: unknown, control: CellEditor) {
        const eventDetail: CellEditor.DataChangeEventDetail = {
            editor: control,
            oldValue: oldValue,
            newValue: newValue,
            point,
        };

        return dispatchGridEvent(this, 'rev-after-cell-edit', false, eventDetail);
    }

    delegateCanvasEvents() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const grid = this;

        function handleMouseEvent(detail: EventDetail.Mouse, cb: ((cellEvent: MouseCellEvent | undefined) => void)) {
            if (grid.getLogicalRowCount() === 0) {
                return;
            }

            const c = grid.getGridCellFromMousePoint(detail.mouse);
            let cellEvent: MouseCellEvent | undefined;

            // No events on the whitespace of the grid unless they're drag events
            if (!c.fake || detail.dragstart) {
                cellEvent = c.renderedCell as MouseCellEvent; // CellEvents are really RenderedCells. All conversions occur here.
            } else {
                cellEvent = undefined;
            }

            if (cellEvent !== undefined) {
                cellEvent.mouse = detail;

                // add some interesting mouse offsets
                // let detail = cellEvent.primitiveEvent.detail;
                if (detail !== undefined) { // test should not be necessary
                    cellEvent.gridPoint = detail.mouse;
                    const uiEvent = detail.primitiveEvent as MouseEvent;
                    if (uiEvent !== undefined) {
                        cellEvent.clientPoint = Point.create(uiEvent.clientX, uiEvent.clientY);
                        cellEvent.pagePoint = Point.create(uiEvent.clientX + window.scrollX, uiEvent.clientY + window.scrollY);
                    }
                }

            }

            cb(cellEvent);
        }

        this.addInternalEventListener('rev-canvas-resized', (e) => {
            grid.resized();
            grid.fireSyntheticGridResizedEvent(e.detail);
        });

        this.addInternalEventListener('rev-canvas-mousemove', (e) => {
            if (grid.properties.readOnly) {
                return;
            } else {
                handleMouseEvent(e.detail, (cellEvent) => {
                    this.delegateMouseMove(cellEvent);
                    this.fireSyntheticMouseMoveEvent(cellEvent);
                });
            }
        });

        this.addInternalEventListener('rev-canvas-mousedown', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            if (!grid.abortEditing()) {
                e.stopPropagation();
                return;
            }

            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.mouseDownState = cellEvent;
                        this.delegateMouseDown(cellEvent);
                        this.fireSyntheticMouseDownEvent(cellEvent);
                        this.repaint();
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-click', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        const isMouseDownCell = this.mouseDownState !== undefined && Point.isEqual(this.mouseDownState.gridCell, cellEvent.gridCell);
                        if (isMouseDownCell && cellEvent.mousePointInClickRect) {
                            // cellEvent.keys = e.detail.keys; // todo: this was in fin-tap but wasn't here
                            if (this.mouseDownState !== undefined) {
                                this.fireSyntheticButtonPressedEvent(this.mouseDownState);
                            }
                            this.fireSyntheticClickEvent(cellEvent);
                            this.delegateClick(cellEvent);
                        }
                        this.mouseDownState = null;
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-mouseup', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = false;
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
            if (grid.columnDragAutoScrolling) {
                grid.columnDragAutoScrolling = false;
            }
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.delegateMouseUp(cellEvent);
                        this.fireSyntheticMouseUpEvent(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-dblclick', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        this.fireSyntheticDoubleClickEvent(cellEvent);
                        this.delegateDoubleClick(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-drag', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            grid.dragging = true;
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateMouseDrag(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-keydown', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            const eventDetail = e.detail;
            grid.fireSyntheticKeydownEvent(eventDetail);
            grid.delegateKeyDown(eventDetail);
        });

        this.addInternalEventListener('rev-canvas-keyup', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            const eventDetail = e.detail;
            grid.fireSyntheticKeyupEvent(eventDetail);
            grid.delegateKeyUp(eventDetail);
        });

        this.addInternalEventListener('rev-canvas-wheelmoved', (e) => {
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateWheelMoved(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-mouseout', (e) => {
            if (grid.properties.readOnly) {
                return;
            }
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateMouseExit(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-context-menu', (e) => {
            handleMouseEvent(e.detail,
                (cellEvent) => {
                    if (cellEvent !== undefined) {
                        grid.delegateContextMenu(cellEvent);
                        grid.fireSyntheticContextMenuEvent(cellEvent);
                    }
                }
            );
        });

        this.addInternalEventListener('rev-canvas-touchstart', (e) => {
            const eventDetail = e.detail;
            grid.delegateTouchStart(eventDetail);
            grid.fireSyntheticTouchStartEvent(eventDetail);
        });

        this.addInternalEventListener('rev-canvas-touchmove', (e) => {
            const eventDetail = e.detail;
            grid.delegateTouchMove(eventDetail);
            grid.fireSyntheticTouchMoveEvent(e.detail);
        });

        this.addInternalEventListener('rev-canvas-touchend', (e) => {
            const eventDetail = e.detail;
            grid.delegateTouchEnd(eventDetail);
            grid.fireSyntheticTouchEndEvent(eventDetail);
        });

        //Register a listener for the copy event so we can copy our selected region to the pastebuffer if conditions are right.
        document.body.addEventListener('copy', (evt) => {
            grid.checkClipboardCopy(evt);
        });
    }

    /**
     * @desc Delegate the wheel moved event to the behavior.
     * @param event - The pertinent event.
     */
    delegateWheelMoved(event: MouseCellEvent) {
        this._featureManager.onWheelMoved(event);
    }

    /**
     * @desc Delegate MouseExit to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateMouseExit(event: MouseCellEvent) {
        this._featureManager.handleMouseExit(event);
    }

    /**
     * @desc Delegate MouseExit to the behavior (model).
     * @param event - The pertinent event.
     */
    delegateContextMenu(event: MouseCellEvent) {
        this._featureManager.onContextMenu(event);
    }

    /**
     * @desc Delegate MouseMove to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseMove(cellEvent: MouseCellEvent | undefined) {
        this._featureManager.onMouseMove(cellEvent);
    }

    /**
     * @desc Delegate mousedown to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseDown(cellEvent: MouseCellEvent) {
        this._featureManager.handleMouseDown(cellEvent);
    }

    /**
     * @desc Delegate mouseup to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseUp(cellEvent: MouseCellEvent) {
        this._featureManager.onMouseUp(cellEvent);
    }

    /**
     * @desc Delegate click to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateClick(cellEvent: MouseCellEvent) {
        this._featureManager.onClick(cellEvent);
    }

    /**
     * @desc Delegate mouseDrag to the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateMouseDrag(cellEvent: MouseCellEvent) {
        this._featureManager.onMouseDrag(cellEvent);
    }

    /**
     * @desc We've been doubleclicked on. Delegate through the behavior (model).
     * @param cellEvent - An enriched mouse event from fin-canvas.
     */
    delegateDoubleClick(cellEvent: MouseCellEvent) {
        this._featureManager.onDoubleClick(cellEvent);
    }

    /**
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param {event} eventDetail - The pertinent event.
     */
    delegateKeyDown(eventDetail: EventDetail.Keyboard) {
        this._featureManager.onKeyDown(eventDetail);
    }

    /**
     * @summary Generate a function name and call it on self.
     * @desc This should also be delegated through Behavior keeping the default implementation here though.
     * @param event - The pertinent event.
     */
    delegateKeyUp(eventDetail: EventDetail.Keyboard) {
        this._featureManager.onKeyUp(eventDetail);
    }

    /**
     * @desc Delegate touchstart to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchStart(eventDetail: EventDetail.Touch) {
        this._featureManager.onTouchStart(eventDetail);
    }

    /**
     * @desc Delegate touchmove to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchMove(eventDetail: EventDetail.Touch) {
        this._featureManager.onTouchMove(eventDetail);
    }

    /**
     * @desc Delegate touchend to the Behavior model.
     * @param event - The pertinent event.
     */
    delegateTouchEnd(eventDetail: EventDetail.Touch) {
        this._featureManager.onTouchEnd(eventDetail);
    }
    // End Events Mixin

    // Begin Subgrids Mixin
    setSubgrids(subgridSpecs: Subgrid.Spec[]) {
        this.destroySubgrids();

        let mainSubgrid: MainSubgrid | undefined;
        const subgrids = this._subgrids;
        subgridSpecs.forEach(
            (spec) => {
                if (spec !== undefined) {
                    const subgrid = this.createSubgridFromSpec(spec);
                    subgrids.push(subgrid);
                    if (subgrid.role === Subgrid.RoleEnum.main) {
                        mainSubgrid = subgrid as MainSubgrid;
                    }
                }
            }
        );

        if (mainSubgrid === undefined) {
            throw new AssertError('BSS98224', 'Subgrid Specs does not include main');
        } else {
            this.mainSubgrid = mainSubgrid;
            this.mainDataModel = mainSubgrid.dataModel;
            if (this._columnsManager.columnsCreated) {
                this.behaviorShapeChanged();
            }
        }
    }

    get subgrids() {
        return this._subgrids;
    }

    /**
     * @summary Resolves a `subgridSpec` to a Subgrid (and its DataModel).
     * @desc The spec may describe either an existing data model, or a constructor for a new data model.
     * @returns either Subgrid or MainSubgrid depending on role specified in Spec
     */
    createSubgridFromSpec(spec: Subgrid.Spec) {
        let subgrid: Subgrid;

        if (spec.role === Subgrid.RoleEnum.main && this.mainSubgrid !== undefined) {
            subgrid = this.mainSubgrid;
        } else {
            // if (spec instanceof Array) {
            //     if (spec.length >= 1) {
            //         const constructor = spec[0];
            //         let role: Subgrid.RoleEnum;
            //         let variableArgArray: unknown[];
            //         if (spec.length === 1) {
            //             role = Subgrid.RoleEnum.Main;
            //             variableArgArray = [];
            //         } else {
            //             role  = spec[1];
            //             variableArgArray = spec.slice(2);
            //         }
            //         subgrid = new constructor(this.grid, role, ...variableArgArray);
            //         this.prepareDataModel(subgrid)
            //     }
            // } else {
            let dataModel = spec.dataModel;
            if (typeof dataModel === 'function') {
                dataModel = new dataModel();
            }
            let metaModel = spec.metaModel;
            if (typeof metaModel === 'function') {
                metaModel = new metaModel();
            }
            let cellModel = spec.cellModel;
            if (typeof cellModel === 'function') {
                cellModel = new cellModel();
            }
            subgrid = this.createSubgrid(spec.role ?? Subgrid.RoleEnum.main, dataModel, metaModel, cellModel); // Spec is a DataModel
                // } else {
                //     // Spec is a role
                //     const dataModel = this.createLocalDataModel(spec);
                //     subgrid = this.createSubgrid(spec, dataModel, undefined, undefined);
                // }
            // }
        }

        return subgrid;
    }

    /** @returns either Subgrid or MainSubgrid depending on role */
    private createSubgrid(role: Subgrid.Role, dataModel: DataModel, metaModel: MetaModel | undefined, cellModel: CellModel | undefined) {
        const constructor = (role === Subgrid.RoleEnum.main) ? MainSubgrid : Subgrid;

        const subgrid = new constructor(
            this,
            this._columnsManager,
            this._modelCallbackManager,
            role,
            this._columnsManager.schemaModel,
            dataModel,
            metaModel,
            cellModel,
        );

        return subgrid;
    }

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows in all subgrids before the (first) data subgrid. Rework to return row count of header subgrid
     * @returns The total number of rows of all subgrids preceding the data subgrid.
     */
    getHeaderRowCount() {
        let result = 0;

        this.subgrids.find((subgrid) => {
            if (subgrid.isMain) {
                return true; // stop
            }
            result += subgrid.dataModel.getRowCount();
            return undefined;
        });

        return result;
    }

    /**
     * @summary Gets the number of "footer rows".
     * @desc Defined as the sum of all rows in all subgrids after the main subgrid.  Rework to return row count of footer subgrid
     * @returns The total number of rows of all subgrids following the data subgrid.
     */
    getFooterRowCount() {
        let gotMain = false;
        return this.subgrids.reduce(
            (rows, subgrid) => {
                if (gotMain) {
                    rows += subgrid.dataModel.getRowCount();
                } else {
                    gotMain = subgrid.isMain;
                }
                return rows;
            },
            0
        );
    }

    /**
     * @summary Gets the total number of logical rows.
     * @desc Defined as the sum of all rows in all subgrids.
     * @returns The total number of logical rows of all subgrids.
     */
    getLogicalRowCount() {
        const count = this.subgrids.reduce(
            (rows, subgrid) => {
                return (rows += subgrid.dataModel.getRowCount());
            },
            0
        );
        return count;
    }

    // End Subgrids Mixin


    /**
     * Additions to `Hypergrid.prototype` for modeling cell, row, and column selections.
     *
     * All members are documented on the {@link Revgrid} page.
     * @mixin selection.mixin
     */

    // Start GridCellProperties Mixin
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param allXOrRenderedCell - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     */
    getCellOwnProperties(allXOrRenderedCell: number | RenderedCell, y?: number, subgrid?: Subgrid) {
        if (typeof allXOrRenderedCell === 'object') {
            // xOrCellEvent is cellEvent
            return allXOrRenderedCell.column.getCellOwnProperties(allXOrRenderedCell.dataCell.y, allXOrRenderedCell.subgrid);
        } else {
            // xOrCellEvent is x
            return this._columnsManager.getAllColumn(allXOrRenderedCell).getCellOwnProperties(y, subgrid);
        }
    }

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return The properties of the cell at x,y in the grid.
     */
    getCellOwnPropertiesFromRenderedCell(renderedCell: RenderedCell): MetaModel.CellOwnProperties {
        return renderedCell.cellOwnProperties;
    }

    getCellProperties(allX: number, y: number, subgrid: Subgrid): CellProperties {
        return this._columnsManager.getAllColumn(allX).getCellProperties(y, subgrid);
    }

    getCellOwnPropertyFromRenderedCell(renderedCell: RenderedCell, key: string): MetaModel.CellOwnProperty {
        return renderedCell.cellOwnProperties[key];
    }

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param allX - Data x coordinate.
     * @param y - Subgrid row coordinate.
     * @param key - Name of property to get.
     * @param subgrid - Subgrid in which contains cell
     * @return The specified property for the cell at x,y in the grid.
     */
    getCellProperty(allX: number, y: number, key: string | number, subgrid: Subgrid): MetaModel.CellOwnProperty;
    getCellProperty<T extends keyof ColumnProperties>(allX: number, y: number, key: T, subgrid: Subgrid): ColumnProperties[T];
    getCellProperty<T extends keyof ColumnProperties>(
        allX: number,
        y: number,
        key: string | T,
        subgrid: Subgrid
    ): MetaModel.CellOwnProperty | ColumnProperties[T] {
        return this._columnsManager.getAllColumn(allX).getCellProperty(y, key, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellPropertiesUsingCellEvent(cellEvent: CellEvent, properties: MetaModel.CellOwnProperties): MetaModel.CellOwnProperties {
        return cellEvent.column.setCellProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid);
    }
    setCellProperties(allX: number, y: number, properties: MetaModel.CellOwnProperties, subgrid: Subgrid): MetaModel.CellOwnProperties {
        return this._columnsManager.getAllColumn(allX).setCellProperties(y, properties, subgrid);
    }

    /**
     * @desc update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    addCellPropertiesUsingCellEvent(cellEvent: CellEvent, properties: MetaModel.CellOwnProperties): MetaModel.CellOwnProperties {
        return cellEvent.column.addCellProperties(cellEvent.dataCell.y, properties, cellEvent.subgrid);
    }
    addCellProperties(allX: number, y: number, properties: MetaModel.CellOwnProperties, subgrid?: Subgrid): MetaModel.CellOwnProperties {
        return this._columnsManager.getAllColumn(allX).addCellProperties(y, properties, subgrid);
    }

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link Renderer#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link Renderer#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param xOrCellEvent - `CellEvent` or data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellProperty(cellEvent: CellEvent, key: string | number, value: MetaModel.CellOwnProperty): MetaModel.CellOwnProperties;
    setCellProperty(allX: number, y: number, key: string | number, value: MetaModel.CellOwnProperty, subgrid: Subgrid): MetaModel.CellOwnProperties;
    setCellProperty(
        allXOrCellEvent: CellEvent | number,
        yOrKey: string | number,
        keyOrValue: string | number | MetaModel.CellOwnProperty,
        valueOrDataModel?: MetaModel.CellOwnProperty | DataModel,
        subgrid?: Subgrid
    ): MetaModel.CellOwnProperties {
        let cellOwnProperties: MetaModel.CellOwnProperties;
        if (typeof allXOrCellEvent === 'object') {
            const key = yOrKey as string;
            const value = keyOrValue;
            cellOwnProperties = allXOrCellEvent.setCellProperty(key, value);
        } else {
            const y = yOrKey as number;
            const key = keyOrValue as string;
            const value = valueOrDataModel;
            cellOwnProperties = this._columnsManager.getAllColumn(allXOrCellEvent).setCellProperty(y, key, value, subgrid);
            this.renderer.resetCellPropertiesCache(allXOrCellEvent, y, subgrid);
        }
        return cellOwnProperties;
    }

    // End GridCellProperties Mixin

    // Begin Selection Mixin

    beginSelectionChange() {
        this.mainSubgrid.beginSelectionChange();
    }

    endSelectionChange() {
        this.mainSubgrid.endSelectionChange();
    }

    getLastSelectionType() {
        return this.mainSubgrid.getLastSelectionType();
    }

    getSelectedRows() {
        return this.mainSubgrid.getSelectedRows();
    }

    clearSelections() {
        this.mainSubgrid.clearSelections();
        this.clearMouseDown();
    }

    /**
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection() {
        const keepRowSelections = this.properties.checkboxOnlyRowSelections;
        this.mainSubgrid.clearMostRecentSelection(keepRowSelections);
    }

    clearMostRecentColumnSelection() {
        this.mainSubgrid.clearMostRecentColumnSelection();
    }

    clearMostRecentRowSelection() {
        this.mainSubgrid.clearMostRecentRowSelection();
    }

    select(ox: number, oy: number, ex: number, ey: number) {
        this.mainSubgrid.select(ox, oy, ex, ey);
    }

    selectViewportCell(x: number, y: number) {
        let vc: Renderer.VisibleColumn
        let vr: Renderer.VisibleRow;
        if (
            this.getRowCount() &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            x = vc.activeColumnIndex;
            y = vr.rowIndex;
            this.mainSubgrid.selectCell(x, y);
            this.setMouseDown(Point.create(x, y));
            this.setDragExtent(Point.create(0, 0));
            this.repaint();
        }
    }

    selectToViewportCell(x: number, y: number) {
        let selections: Rectangle[];
        let vc: Renderer.VisibleColumn;
        let vr: Renderer.VisibleRow;
        if (
            (selections = this.mainSubgrid.selections) && selections.length &&
            (vc = this.renderer.visibleColumns[x]) &&
            (vr = this.renderer.visibleRows[y + this.getHeaderRowCount()])
        ) {
            const origin = selections[0].origin;
            x = vc.activeColumnIndex;
            y = vr.rowIndex;
            this.setDragExtent(Point.create(x - origin.x, y - origin.y));
            this.mainSubgrid.select(origin.x, origin.y, x - origin.x, y - origin.y);
            this.repaint();
        }
    }

    selectToFinalCellOfCurrentRow() {
        this.selectFinalCellOfCurrentRow(true);
    }

    selectFinalCellOfCurrentRow(to?: boolean) {
        const mainSubgrid = this.mainSubgrid;
        if (!mainSubgrid.dataModel.getRowCount()) {
            return;
        }
        const selectionModel = mainSubgrid.selectionModel;
        const selections = selectionModel.selections;
        if (selections && selections.length) {
            const selection = selections[0];
            const origin = selection.origin;
            const extent = selection.extent;
            const columnCount = this._columnsManager.getActiveColumnCount();

            this.scrollColumnsBy(columnCount);

            selectionModel.beginChange();
            try {
                this.clearSelections();
                if (to) {
                    selectionModel.select(origin.x, origin.y, columnCount - origin.x - 1, extent.y);
                } else {
                    selectionModel.select(columnCount - 1, origin.y, 0, 0);
                }
            } finally {
                selectionModel.endChange();
            }

            this.repaint();
        }
    }

    selectToFirstCellOfCurrentRow() {
        this.selectFirstCellOfCurrentRow(true);
    }

    selectFirstCellOfCurrentRow(to?: boolean) {
        const mainSubgrid = this.mainSubgrid;
        if (!mainSubgrid.dataModel.getRowCount()) {
            return;
        }
        const selectionModel = mainSubgrid.selectionModel;
        const selections = selectionModel.selections;
        if (selections && selections.length) {
            const selection = selections[0];
            const origin = selection.origin;
            const extent = selection.extent;

            selectionModel.beginChange();
            try {
                this.clearSelections();
                if (to) {
                    selectionModel.select(origin.x, origin.y, -origin.x, extent.y);
                } else {
                    selectionModel.select(0, origin.y, 0, 0);
                }
            } finally {
                selectionModel.endChange();
            }

            this.handleHScrollerChange(0);
            this.repaint();
        }
    }

    selectFinalCell() {
        const rowCount = this.mainSubgrid.dataModel.getRowCount();
        if (rowCount > 0) {
            this.selectCellAndScrollToMakeVisible(this._columnsManager.getActiveColumnCount() - 1, rowCount - 1);
            this.repaint();
        }
    }

    selectToFinalCell() {
        const mainSubgrid = this.mainSubgrid;
        const rowCount = mainSubgrid.dataModel.getRowCount();
        if (rowCount > 0) {
            const selectionModel = mainSubgrid.selectionModel;
            const selections = selectionModel.selections;
            if (selections && selections.length) {
                const selection = selections[0];
                const origin = selection.origin;
                const columnCount = this._columnsManager.getActiveColumnCount();

                selectionModel.beginChange();
                try {
                    this.clearSelections();
                    selectionModel.select(origin.x, origin.y, columnCount - origin.x - 1, rowCount - origin.y - 1);
                } finally {
                    selectionModel.endChange();
                }
                // this.scrollBy(columnCount, rowCount);
                this.repaint();
            }
        }
    }

    selectRows(y1: number, y2?: number) {
        this.mainSubgrid.selectRows(y1, y2);
    }

    selectColumns(x1: number, x2?: number) {
        this.mainSubgrid.selectColumns(x1, x2);
    }

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param offsetX - x offset
     * @param offsetY - y offset
     */
    moveSingleSelect(offsetX: number, offsetY: number) {
        const mouseCorner = Point.plus(this.getMouseDown(), this.getDragExtent());
        this.moveToSingleSelect(
            mouseCorner.x + offsetX,
            mouseCorner.y + offsetY
        );
    }

    toggleSelectRow(y: number, shiftKeyDown: boolean) {
        return this.mainSubgrid.toggleSelectRow(y, shiftKeyDown);
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        return this.mainSubgrid.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
    }

    /**
     * @summary Move cell selection by offset.
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param newX - x coordinate to start at
     * @param newY - y coordinate to start at
     */
    moveToSingleSelect(newX: number, newY: number) {
        let maxColumns = this.getActiveColumnCount() - 1;
        let maxRows = this.getRowCount() - 1;

        const maxViewableColumns = this.getVisibleColumnsCount() - 1;
        const maxViewableRows = this.getVisibleRowsCount() - 1;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));
        newY = Math.min(maxRows, Math.max(0, newY));

        const selectionModel = this.mainSubgrid.selectionModel;
        selectionModel.beginChange();
        try {
            this.clearSelections();
            selectionModel.select(newX, newY, 0, 0);
            this.setMouseDown(Point.create(newX, newY));
            this.setDragExtent(Point.create(0, 0));

            this.selectCellAndScrollToMakeVisible(newX, newY);
        } finally {
            selectionModel.endChange();
        }

        this.repaint();
    }

    /** @summary Extend cell selection by offset.
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    extendSelect(offsetX: number, offsetY: number) {
        let maxColumns = this.getActiveColumnCount() - 1;
        let maxRows = this.getRowCount() - 1;

        const maxViewableColumns = this.renderer.visibleColumns.length - 1;
        const maxViewableRows = this.renderer.visibleRows.length - 1;

        const origin = this.getMouseDown();
        const extent = this.getDragExtent();

        let newX = extent.x + offsetX;
        let newY = extent.y + offsetY;

        if (!this.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
            maxRows = Math.min(maxRows, maxViewableRows);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));
        newY = Math.min(maxRows - origin.y, Math.max(-origin.y, newY));

        const selectionModel = this.mainSubgrid.selectionModel;
        selectionModel.beginChange();
        try {
            this.clearMostRecentSelection();
            selectionModel.select(origin.x, origin.y, newX, newY);
        } finally {
            selectionModel.endChange();
        }
        this.setDragExtent(Point.create(newX, newY));

        const colScrolled = this.ensureModelColIsVisible(newX + origin.x, offsetX);
        const rowScrolled = this.ensureModelRowIsVisible(newY + origin.y, offsetY);

        this.repaint();

        return colScrolled || rowScrolled;
    }

    /**
     * @param useAllCells - Search in all rows and columns instead of only rendered ones.
     */
    getGridCellFromLastSelection(useAllCells: boolean) {
        const sel = this.mainSubgrid.getLastSelection();
        if (sel === undefined) {
            return undefined;
        } else {
            const cellEvent = new CellEvent(this);
            const cellReseted = cellEvent.resetGridXDataY(sel.origin.x, sel.origin.y, undefined, useAllCells);
            return cellReseted ? cellEvent : undefined;
        }
    }


    // end Selection mixin

    // Begin Themes mixin

    // /**
    //  * @summary Get currently active theme.
    //  * @desc May return a theme name or a theme object.
    //  * @returns {string|undefined|object} One of:
    //  * * **string:** Theme name (registered theme).
    //  * * **object:** Theme object (unregistered anonymous theme).
    //  * * **undefined:** No theme (i.e., the default theme).
    //  */
    // get theme() {
    //     const themeLayer = this._theme;
    //     const themeName = themeLayer.themeName;
    //     return themeName === 'default' || !Object.getOwnPropertyNames(themeLayer).length
    //         ? undefined // default theme or no theme
    //         : themeName in registry
    //             ? themeName // registered theme name
    //             : themeLayer; // unregistered theme object
    // }

    // /**
    //  * @summary Apply a grid theme.
    //  * @desc Apply props from the given theme object to the grid instance,
    //  * the instance's `myGrid.themeLayer` layer in the properties hierarchy.
    //  * @this {Hypergrid}
    //  * @param {object|string} [theme] - One of:
    //  * * **string:** A registered theme name.
    //  * * **object:** An anonymous (unregistered) theme object. Empty object removes grid theme, exposing global theme.
    //  * * _falsy value:_ Also removes grid theme (like empty object).
    //  * @param {string|undefined} [theme.themeName=undefined]
    //  */
    // set theme(value) {
    //     applyTheme(value);
    // }

    // End Themes Mixin

    // Begin Shared Themes Mixin
    // /**
    //  * @param {string} [name] - A registry name for the new theme. May be omitted if the theme has an embedded name (in `theme.themeName`).
    //  * _If omitted, the 2nd parameter (`theme`) is promoted to first position._
    //  * @param {HypergridThemeObject} [theme]
    //  * To build a Hypergrid theme object from a loaded {@link https://polymerthemes.com Polymer Theme} CSS stylesheet:
    //  * ```javascript
    //  * var myTheme = require('rev-hypergrid-themes').buildTheme();
    //  * ```
    //  * If omitted, unregister the theme named in the first parameter.
    //  *
    //  * Grid instances that have previously applied the named theme are unaffected by this action (whether re-registering or unregistering).
    //  */
    // static registerTheme(name: string, theme: Theme) {
    //     if (typeof name === 'object') {
    //         theme = name;
    //         name = theme.themeName;
    //     }

    //     if (!name) {
    //         throw new HypergridError('Cannot register an anonymous theme.');
    //     }

    //     if (name === 'default') {
    //         throw new HypergridError('Cannot register or unregister the "default" theme.');
    //     }

    //     if (theme) {
    //         theme.themeName = name;
    //         registry[name] = theme;
    //     } else {
    //         delete registry[name];
    //     }
    // }

    // /**
    //  * App developers are free to add in additional themes, such as those in {@link https://github.com/fin-hypergrid/themes/tree/master/js}:
    //  * ```javascript
    //  * Hypergrind.registerThemes(require('rev-hypergrid-themes'));
    //  * ```
    //  * @param {object} themeCollection
    //  */
    // static registerThemes(themeCollection) {
    //     if (themeCollection) {
    //         _(themeCollection).each(function(theme, name) {
    //             this.registerTheme(name, theme);
    //         }, this);
    //     } else {
    //         Object.keys(registry).forEach(function(themeName) {
    //             this.registerTheme(themeName);
    //         }, this);
    //     }
    // }

    // /**
    //  * @summary Apply global theme.
    //  * @desc Apply props from the given theme object to the global theme object,
    //  * the `defaults` layer at the bottom of the properties hierarchy.
    //  * @param {object|string} [theme=registry.default] - One of:
    //  * * **string:** A registered theme name.
    //  * * **object:** A theme object. Empty object removes global them, restoring defaults.
    //  * * _falsy value:_ Also restores defaults.
    //  * @param {string|undefined} [theme.themeName=undefined]
    //  */
    // static applyTheme(theme: Theme) {
    //     var themeObject = applyTheme.call(this, theme);
    //     images.setTheme(themeObject);
    // }

    // /**
    //  * @summary Theme registration and global theme support.
    //  * @desc Shared properties of `Hypergrid` "class" (_i.e.,_ "static" properties of constructor function) for registering themes and setting a global theme.
    //  *
    //  * All members are documented on the {@link Hypergrid} page (annotated as "(static)").
    //  * @mixin themes.sharedMixin
    //  */
    // static get theme() { return defaults; }
    // static set theme(theme: Theme) { Hypergrid.applyTheme(theme) }

    // // End Shared Mixin



    // Begin Scrolling Mixin

    /** @internal */
    setScrollingNow(isItNow: boolean) {
        this.scrollingNow = isItNow;
    }

    /**
     * @returns The `scrollingNow` field.
     */
    isScrollingNow() {
        return this.scrollingNow;
    }

    /**
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param offsetColumnCount - Scroll in the x direction this many columns.
     * @param offsetY - Scroll in the y direction this many rows.
     */
    scrollBy(offsetColumnCount: number, offsetY: number) {
        this.scrollColumnsBy(offsetColumnCount);
        this.scrollVBy(offsetY);
    }

    /**
     * @summary Scroll vertically by the provided offset.
     * @param offsetY - Scroll in the y direction this much.
     */
    scrollVBy(offsetY: number) {
        const max = this.sbVScroller.contentRange.finish;
        const oldValue = this.getVScrollValue();
        const newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.handleVScrollerChange(newValue);
        }
    }

    /**
     * @summary Scroll horizontally by the provided offset.
     * @param offset - Scroll in the x direction this much.
     * @returns true if scrolled
     */
    scrollColumnsBy(offset: number) {
        if (this.renderer.scrollColumnScrollAnchor(offset, this.properties.gridRightAligned)) {
            this.renderer.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.sbHScroller.setViewportStart(viewportStart);
            return true;
        } else {
            return false;
        }
    }

    scrollViewHorizontallyBy(delta: number) {
        if (this.renderer.horizontalScrollableContentOverflowed) {
            this.sbHScroller.scroll(delta);
        }
    }

    scrollToMakeVisible(c: number, r: number) {
        let delta: number;
        const gridRightAligned = this.properties.gridRightAligned
        const dw = this.renderer.dataWindow;
        const fixedColumnCount = this.properties.fixedColumnCount;
        const fixedRowCount = this.properties.fixedRowCount;
        let computeCellsBoundsRequired = false;

        // scroll only if target not in fixed columns unless grid right aligned
        if (c >= fixedColumnCount || gridRightAligned) {
            let anchorUpdated = false;
            if ((delta = c - dw.origin.x) < 0) {
                // target is to left of scrollable columns
                if (gridRightAligned) {
                    const {index, offset} = this.renderer.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.sbHScroller.viewportSize);
                    anchorUpdated = this.renderer.setColumnScrollAnchor(index, offset);
                } else {
                    anchorUpdated = this.renderer.setColumnScrollAnchor(c);
                }
            } else {
                if ((c - dw.corner.x) > 0) {
                    // target is to right of scrollable columns
                    if (gridRightAligned) {
                        anchorUpdated = this.renderer.setColumnScrollAnchor(c);
                    } else {
                        const {index, offset} = this.renderer.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.sbHScroller.viewportSize);
                        anchorUpdated = this.renderer.setColumnScrollAnchor(index, offset);
                    }
                }
            }

            if (anchorUpdated) {
                computeCellsBoundsRequired = true;
            }
        }

        if (
            r >= fixedRowCount && // scroll only if target not in fixed rows
            (
                // target is above scrollable rows; negative delta scrolls up
                (delta = r - dw.origin.y - 1) < 0 ||

                // target is below scrollable rows; positive delta scrolls down
                (delta = r - dw.corner.y) > 0
            )
        ) {
            this.sbVScroller.scrollIndex(delta);
            computeCellsBoundsRequired = true; // Do this until fix up vertical scrolling
        }

        if (computeCellsBoundsRequired) {
            this.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.sbHScroller.setViewportStart(viewportStart);
        }
    }

    /** @internal */
    selectCellAndScrollToMakeVisible(c: number, r: number) {
        this.scrollToMakeVisible(c, r);
        this.mainSubgrid.selectCell(c, r, true);
    }

    /**
     * @desc Set the vertical scroll value.
     * @param newValue - The new scroll value.
     */
    handleVScrollerChange(y: number) {
        y = Math.min(this.sbVScroller.contentRange.finish, Math.max(0, Math.round(y)));
        if (y !== this.vScrollValue) {
            this.behavior.setScrollPositionY(y);
            this.behaviorChanged();
            // const oldY = this.vScrollValue;
            this.vScrollValue = y;
            this.scrollValueChangedNotification(false);
            setTimeout(() => {
                this.fireScrollEvent('rev-scroll-y', y, -1, -1);
            }, 0);
        }
    }

    /**
     * @return The vertical scroll value.
     * @internal
     */
    getVScrollValue(): number {
        return this.vScrollValue;
    }

    /**
     * @desc Set the horizontal scroll value.
     * @param x - The new scroll value.
     * @internal
     */
    handleHScrollerChange(x: number) {
        const updated = this.renderer.updateColumnScrollAnchor(
            this.sbHScroller.viewportStart,
            this.sbHScroller.viewportFinish,
            this.sbHScroller.contentStart,
            this.sbHScroller.contentFinish
        );
        if (updated) {
            this.behaviorChanged();
            this.scrollValueChangedNotification(true);
            setTimeout(() => {
                this.fireScrollEvent('rev-scroll-x', x, this.renderer.columnScrollAnchorIndex, this.renderer.columnScrollAnchorOffset);
            }, 0);
        }
    }

    /**
     * @desc Initialize the scroll bars.
     * @internal
     */
    initScrollbars(loadBuiltinFinbarCssStylesheet: boolean | undefined) {
        if (this.sbHScroller && this.sbVScroller){
            return;
        }

        const horzBar = new FinBar({
            orientation: FinBar.OrientationEnum.horizontal,
            deltaXFactor: this.properties.wheelHFactor,
            onchange: (index) => this.handleHScrollerChange(index),
            loadBuiltinCssStylesheet: loadBuiltinFinbarCssStylesheet,
            cssStylesheetReferenceElement: this.containerHtmlElement
        });

        const vertBar = new FinBar({
            indexMode: true, // remove when vertical scrollbar is updated to use viewport
            orientation: FinBar.OrientationEnum.vertical,
            deltaYFactor: this.properties.wheelVFactor,
            onchange: (index) => this.handleVScrollerChange(index),
            loadBuiltinCssStylesheet: loadBuiltinFinbarCssStylesheet,
            cssStylesheetReferenceElement: this.containerHtmlElement,
            paging: {
                up: () => this.pageUp(),
                down: () => this.pageDown()
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        const hPrefix = this.properties.hScrollbarClassPrefix;
        const vPrefix = this.properties.vScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.containerHtmlElement.appendChild(horzBar.bar);
        this.containerHtmlElement.appendChild(vertBar.bar);
    }

    /** @internal */
    resizeScrollbars() {
        this.sbHScroller.shortenBy(this.sbVScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.sbVScroller.resize();
    }

    /**
     * @desc Scroll values have changed, we've been notified.
     * @internal
     */
    setVScrollbarContentRange(finish: number) {
        this.sbVScroller.contentRange = {
            start: 0,
            finish: finish
        };
    }

    // HScroller only calls when change has occurred so it sets force true
    // Eventually VScroller should also only call when changed
    /** @internal */
    scrollValueChangedNotification(force: boolean) {
        if (
            force ||
            this.vScrollValue !== this.sbPrevVScrollValue
        ) {
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            this.computeCellsBounds();
        }
    }

    /**
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     * @internal
     */
    synchronizeScrollingBoundaries() {
        this.updateHorizontalScroll(false);
        this.updateVerticalScroll(false);

        this.computeCellsBounds();
        const viewportStart = this.calculateColumnScrollAnchorViewportStart();
        this.sbHScroller.setViewportStart(viewportStart);

        // schedule to happen *after* the repaint
        if (this._resizeSetTimeoutId === undefined) {
            this._resizeSetTimeoutId = setTimeout(() => {
                this._resizeSetTimeoutId = undefined;
                this.resizeScrollbars()
            }, 0);
        }
    }

    updateHorizontalScroll(recalculateView: boolean) {
        const bounds = this.getBounds();

        const gridProps = this.properties;
        const gridRightAligned = gridProps.gridRightAligned;
        const columnCount = this.getActiveColumnCount();
        const fixedColumnCount = this.getFixedColumnCount();

        let scrollerContentStart: number;
        if (fixedColumnCount === 0) {
            scrollerContentStart = 0;
        } else {
            const fixedColumnsWidth = this.calculateFixedColumnsWidth();
            const fixedLinesVWidth = gridProps.fixedLinesVWidth ?? gridProps.gridLinesVWidth;
            scrollerContentStart = fixedColumnsWidth + fixedLinesVWidth;
        }
        const scrollableColumnsViewportSize = bounds.width - scrollerContentStart;

        let scrollerContentFinish: number;
        if (scrollableColumnsViewportSize <= 0) {
            const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
            this.renderer.setColumnScrollAnchorLimits(false, anchorLimits);

            scrollerContentFinish = scrollerContentStart - 1;
            this.sbHScroller.contentRange = {
                start: scrollerContentStart,
                finish: scrollerContentFinish // hMax
            };
            this.sbHScroller.viewportSize = -1;
        } else {
            const contentSizeAndAnchorLimits = this.calculateColumnScrollContentSizeAndAnchorLimits(
                scrollerContentStart,
                scrollableColumnsViewportSize,
                gridRightAligned,
                columnCount,
                fixedColumnCount,
            );
            const { contentSize, contentOverflowed, anchorLimits } = contentSizeAndAnchorLimits;
            this.renderer.setColumnScrollAnchorLimits(contentOverflowed, anchorLimits);

            scrollerContentFinish = scrollerContentStart + contentSize - 1;
            this.sbHScroller.contentRange = {
                start: scrollerContentStart,
                finish: scrollerContentFinish // hMax
            };
            this.sbHScroller.viewportSize = scrollableColumnsViewportSize;

            if (this.sbHScroller.hidden) {
                this.renderer.setColumnScrollAnchorToLimit(gridRightAligned)
            }

        }

        if (recalculateView) {
            this.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.sbHScroller.setViewportStart(viewportStart);
        }
    }

    updateVerticalScroll(recalculateView: boolean) {
        const numRows = this.getRowCount();
        const gridProps = this.properties;
        const scrollableHeight = this.renderer.getVisibleScrollHeight();
        const lineGap = gridProps.gridLinesHWidth;
        let rowsHeight = 0;
        let lastPageRowCount = 0;

        while (lastPageRowCount < numRows && rowsHeight < scrollableHeight) {
            rowsHeight += this.getRowHeight(numRows - lastPageRowCount - 1) + lineGap;
            lastPageRowCount++;
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        const vMax = Math.max(0, numRows - gridProps.fixedRowCount - lastPageRowCount);
        this.setVScrollbarContentRange(vMax);
        this.handleVScrollerChange(Math.min(this.getVScrollValue(), vMax));

        if (recalculateView) {
            this.computeCellsBounds();
        }
    }

    /**
     * @desc Scroll up one full page.
     */
    pageUp() {
        const rowNum = this.renderer.getPageUpRow();
        this.handleVScrollerChange(rowNum);
        return rowNum;
    }

    /**
     * @desc Scroll down one full page.
     */
    pageDown() {
        const rowNum = this.renderer.getPageDownRow();
        this.handleVScrollerChange(rowNum);
        return rowNum;
    }

    /**
     * @desc Not yet implemented.
     */
    pageLeft() {
        throw 'page left not yet implemented';
    }

    /**
     * @desc Not yet implemented.
     */
    pageRight() {
        throw 'page right not yet implemented';
    }
    // End Scrolling mixin

    generateNavKey(keyboardEvent: KeyboardEvent) {
        let navKey = this.properties.navKeyMap[keyboardEvent.key];
        if (keyboardEvent.shiftKey) {
            navKey += 'SHIFT';
        }
        return navKey;
    }

    private handleGridEventDispatchEvent<T extends EventName>(name: T, detail: EventName.DetailMap[T]) {
        dispatchGridEvent(this, name, false, detail);
    }

    /** @internal */
    private paintLoopRunning() {
        return !this.properties.repaintImmediately && this.renderer.painting();
    }

    /** @internal */
    private findOrCreateContainer(boundingRect: Revgrid.BoundingRectStyleValues) {
        const div = document.getElementById(Revgrid.gridContainerElementCssIdBase);
        const used = div && !div.firstElementChild;

        if (!used) {
            const div = document.createElement('div');
            this.setStyles(div, boundingRect, Revgrid.boundingRectStyleKeys);
            document.body.appendChild(div);
        }

        return div;
    }

    // /** @internal */
    // private createLocalDataModel(role: Subgrid.Role) {
    //     switch (role) {
    //         case Subgrid.RoleEnum.main: return new LocalMainDataSource();
    //         case Subgrid.RoleEnum.header: return new LocalHeaderDataSource(this);
    //         default:
    //             throw new Error('Unsupported role for local DataModel: ' + role);
    //     }
    // }

    /** @internal */
    private destroySubgrids() {
        const count = this._subgrids.length;
        for (let i = count - 1; i > 0; i--) {
            const subgrid = this._subgrids[i];
            subgrid.destroy();
        }
        this._subgrids.length = 0;
    }

    /** @internal */
    private createModelCallbackRouter() {
        const router = new ModelCallbackRouter(this.properties);

        router.beginSchemaChangeEvent = () => this.beginSchemaChange();
        router.endSchemaChangeEvent = () => this.endSchemaChange();
        router.beginDataChangeEvent = () => this.beginDataChange();
        router.endDataChangeEvent = () => this.endDataChange();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        router.columnsInsertedEvent = (index, count) => {
            this.beginSchemaChange();
            try {
                this.renderer.modelUpdated();
                this._columnsManager.schemaColumnsInserted(index, count);
                // Currently cannot calculate active Column Index of added columns so cannot advise SelectionModel of change
                // or advise Renderer of column index
                this.renderer.renderColumnsInserted(-1, -1);
            } finally {
                this.endSchemaChange();
            }
        }

        router.columnsDeletedEvent = (index, count) => {
            this.beginSchemaChange();
            try {
                this.renderer.modelUpdated();
                this._columnsManager.schemaColumnsDeleted(index, count);
                const nextRange = index + count;
                for (let i = index; i < nextRange; i++) {
                    // In the future, should consolidate into activeIndex ranges instead of doing individually
                    const activeIndex = this._columnsManager.getActiveColumnIndexByAllIndex(i);
                    if (activeIndex >= 0) {
                        this.selectionModel.adjustForColumnsDeleted(activeIndex, 1);
                        this.renderer.renderColumnsDeleted(activeIndex, 1);
                    }
                }
            } finally {
                this.endSchemaChange();
            }
        }

        router.allColumnsDeletedEvent = () => {
            this.beginSchemaChange();
            try {
                this.renderer.modelUpdated();
                this._columnsManager.allSchemaColumnsDeleted();
                this.selectionModel.clear();
                this.renderer.renderAllColumnsDeleted();
            } finally {
                this.endSchemaChange();
            }
        }

        router.schemaChangedEvent = () => {
            this.beginSchemaChange();
            try {
                this.renderer.modelUpdated();
                this._columnsManager.schemaColumnsChanged();
                this.selectionModel.clear();
                this.renderer.renderColumnsChanged();
            } finally {
                this.endSchemaChange();
            }
        };

        router.getActiveSchemaColumnsEvent = () => {
            return this.getActiveColumns().map((column) => column.schemaColumn);
        };

        router.rowsInsertedEvent = (dataModel, index, count) => {
            this.beginDataChange();
            try {
                this.renderer.modelUpdated();
                if (dataModel === this.mainDataModel) {
                    this.selectionModel.adjustForRowsInserted(index, count);
                }
                this.renderer.renderRowsInserted(index, count);
            } finally {
                this.endDataChange();
            }
        }

        router.rowsDeletedEvent = (dataModel, index, count) => {
            this.beginDataChange();
            try {
                this.renderer.modelUpdated();
                if (dataModel === this.mainDataModel) {
                    this.selectionModel.adjustForRowsDeleted(index, count);
                }
                this.renderer.renderRowsDeleted(index, count);
            } finally {
                this.endDataChange();
            }
        }

        router.allRowsDeletedEvent = (dataModel) => {
            this.beginDataChange();
            try {
                this.renderer.modelUpdated();
                if (dataModel === this.mainDataModel) {
                    this.selectionModel.clear();
                }
                this.renderer.renderAllRowsDeleted();
            } finally {
                this.endDataChange();
            }
        }

        router.rowsMovedEvent = (dataModel, oldRowIndex, newRowIndex, rowCount) => {
            this.beginDataChange();
            try {
                this.renderer.modelUpdated();
                if (dataModel === this.mainDataModel) {
                    this.selectionModel.adjustForRowsMoved(oldRowIndex, newRowIndex, rowCount);
                }
                this.renderer.renderRowsMoved(oldRowIndex, newRowIndex, rowCount);
            } finally {
                this.endDataChange();
            }
        }

        router.rowsLoadedEvent = (dataModel) => {
            this.beginDataChange();
            try {
                this.renderer.modelUpdated();
                if (dataModel === this.mainDataModel) {
                    this.selectionModel.clear();
                }
                this.renderer.renderRowsLoaded();
            } finally {
                this.endDataChange();
            }
        };

        router.invalidateAllEvent = () => {
            this.renderer.modelUpdated();
            this.renderer.invalidateAll();
        }

        router.invalidateRowsEvent = (rowIndex: number, count: number) => {
            this.renderer.modelUpdated();
            this.renderer.invalidateRows(rowIndex, count);
        }

        router.invalidateRowEvent = (rowIndex: number) => {
            this.renderer.modelUpdated();
            this.renderer.invalidateRow(rowIndex);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        router.invalidateRowColumnsEvent = (rowIndex: number, allColumnIndex: number, columnCount: number) => {
            this.renderer.modelUpdated();
            this.renderer.invalidateRow(rowIndex); // this should be improved to use this.renderer.invalidateRowColumns()
        }

        router.invalidateRowCellsEvent = (rowIndex: number, allIndexes: number[]) => {
            this.renderer.modelUpdated();
            this.renderer.invalidateRowCells(rowIndex, allIndexes);
        }

        router.invalidateCellEvent = (allIndex: number, rowIndex: number) => {
            this.renderer.modelUpdated();
            this.renderer.invalidateCell(allIndex, rowIndex);
        }

        // router.repaintRequiredEvent = () => {
        //     this.repaint();
        //     return this.renderer.modelUpdated();
        // };
        // router.behaviorShapeChangedEvent = () => {
        //     this.behaviorShapeChanged();
        //     return this.renderer.modelUpdated();
        // };
        router.gridEvent = (eventName, eventDetail) => dispatchGridEvent(this, eventName, false, eventDetail);

        return router;
    }

    private beginSchemaChange() {
        this._columnsManager.beginSchemaChange();
        this.selectionModel.beginChange();
        this.renderer.beginChange();
    }

    private endSchemaChange() {
        this._columnsManager.endSchemaChange();
        this.selectionModel.endChange();
        this.renderer.endChange();
    }

    private beginDataChange() {
        this.selectionModel.beginChange();
        this.renderer.beginChange();
    }

    private endDataChange() {
        this.selectionModel.endChange();
        this.renderer.endChange();
    }

    /** @internal */
    private setStyles<T extends Revgrid.EdgeStyleValues | Revgrid.BoundingRectStyleValues>(el: HTMLElement, style: T | undefined, keys: string[]) {
        if (style !== undefined) {
            const elStyle = el.style;
            keys.forEach((key) => {
                if (style[key] !== undefined) {
                    elStyle[key] = style[key];
                }
            });
        }
    }

    // private stringifyFunctions() {
    //     const self = this;
    //     return Object.keys(this).reduce(function(obj, key) {
    //         if (key !== 'toJSON') {
    //             obj[key] = /^function /.test(key)
    //                 ? null // anon func: no point in saving because key itself is already the stringified function
    //                 : self[key].toString() // stringify the function
    //                     .replace(/^function anonymous\(/, 'function(') // clean up Chromium artifact
    //                     .replace('\n/*``*/)', ')'); // clean up Chromium artifact
    //         }
    //         return obj;
    //     }, {});
    // }

}


/**
 * @name plugins
 * @type {object}
 * @summary Hash of references to shared plug-ins.
 * @desc Dictionary of shared (pre-installed) plug-ins. Used internally, primarily to avoid reinstallations. See examples for how to reference (albeit there is normally no need to reference plugins directly).
 *
 * For the dictionary of _instance_ plugins, see {@link Revgrid#plugins|plugins} (defined in the {@link Revgrid#intialize|Hypergrid constructor}).
 *
 * To force reinstallation of a shared plugin delete it first:
 * ```javascript
 * delete Hypergrid.plugins.mySharedPlugin;
 * ```
 * To force reinstallation of all shared plugins:
 * ```javascript
 * Hypergrid.plugins = {};
 * ```
 * @example
 * var allSharedPlugins = Hypergrid.plugins;
 * var mySharedPlugin = Hypergrid.plugins.mySharedPlugin;
 */
// Hypergrid.plugins = {};


// mix in the mixins

// Hypergrid.mixIn = Hypergrid.prototype.mixIn;
// Hypergrid.mixIn(require('./themes').sharedMixin);

// Hypergrid.prototype.mixIn(require('./themes').mixin);
// Hypergrid.prototype.mixIn(require('./events').mixin);
// Hypergrid.prototype.mixIn(require('./selection').mixin);
// Hypergrid.prototype.mixIn(require('./stash-selections').mixin);
// Hypergrid.prototype.mixIn(require('./scrolling').mixin);


// deprecated module access

// function pleaseUse(requireString, module) {
//     if (!pleaseUse.warned[requireString]) {
//         var key = requireString.match(/\w+$/)[0];
//         console.warn('Reference to ' + key + ' external module using' +
//             ' `Hypergrid.' + key + '.` has been deprecated as of v3.0.0 in favor of' +
//             ' `require(\'' + requireString + '\')` from within a Hypergrid Client Module' +
//             ' (otherwise use `Hypergrid.require(...)`) and will be removed in a future release.' +
//             ' See https://github.com/fin-hypergrid/core/wiki/Client-Modules#internal-modules.');
//         pleaseUse.warned[requireString] = true;
//     }
//     return module;
// }
// pleaseUse.warned = {};


// Object.defineProperties(Hypergrid, {
//     Base: { get: function() { return pleaseUse('rev-hypergrid/src/Base', require('../Base').default); } },
//     images: { get: function() { return pleaseUse('rev-hypergrid/images', require('../../images')); } }
// });


/**
 * @summary List of grid instances.
 * @desc Added in {@link Revgrid constructor}; removed in {@link Revgrid#terminate terminate()}.
 * Used in themes.js.
 * @type {Revgrid[]}
 */


/** @name defaults
 * @type {object}
 * @summary The `defaults` layer of the Hypergrid properties hierarchy.
 * @desc Default values for all Hypergrid properties, including grid-level properties and column property defaults.
 *
 * Synonym: `properties`
 * Properties are divided broadly into two categories:
 * * Style (a.k.a. "lnf" for "look'n'feel") properties
 * * All other properties.
 */
// Hypergrid.defaults = Hypergrid.properties = defaults;


/** @public */
export namespace Revgrid {
	export interface Options {
		// api?: object | string[];
        gridProperties?: Partial<GridProperties>;
		boundingRect?: BoundingRectStyleValues;
		canvasContextAttributes?: CanvasRenderingContext2DSettings;
		container?: string | HTMLElement;
		// dataModel?: DataModel;
		// dataModelConstructorOrArray?: Options.DataModelConstructorOrArray;
		// force?: boolean;
		// inject?: boolean;
		localization?: LocalizationOptions;
		edgeStyleValues?: EdgeStyleValues;
		state?: Record<string, unknown>;
        // /** Use to put data in LocalMainDataModel. Only good for quick prototypes - not recommended - use subgrids and their datamodels */
        // data?: LocalDataRowObject[] | (() => LocalDataRowObject[]);
        /** Use in conjunction with data. Set to true to reindex data when first loaded */
        apply?: boolean;
		// metadata?: DataModel.RowMetadata[];
        /** Pass in DataModel via subgrids. Recommend supply DataModel for main subgrid however ok to use LocalHeaderDataModel for header */
		adapterSet?: GridProperties.AdapterSet;
        /** Specifies whether to load builtin FinBar stylesheet. Default: true */
        loadBuiltinFinbarStylesheet?: boolean;
	}

    export const defaultProperties = defaultGridProperties;

    export abstract class ListenerInfo {
        internal: boolean;
        abstract listener: Canvas.EventListener<never>;
        abstract decorator: Canvas.EventListener<never>;
    }

    export class TypedListenerInfo<T extends EventName> extends ListenerInfo {
        override listener: Canvas.EventListener<T>;
        override decorator: Canvas.EventListener<T>;
    }

    export interface LocalizationOptions {
        locale?: string;
        numberOptions?: NumberFormatter.Options;
        dateOptions?: DateFormatter.Options;
    }

    export const gridElementCssClass = 'revgrid';
    export const gridContainerElementCssIdBase = 'revgrid';
    export const gridContainerElementCssClass = 'revgrid-container';

    /**
     * @name localization
     * @summary Shared localization defaults for all grid instances.
     * @desc These property values are overridden by those supplied in the `Hypergrid` constructor's `options.localization`.
     * @property locale - The default locale to use when an explicit `locale` is omitted from localizer constructor calls. Passed to Intl.NumberFormat` and `Intl.DateFormat`. See {@see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation|Locale identification and negotiation} for more information. Omitting will use the runtime's local language and region.
     * @property numberOptions - Options passed to `Intl.NumberFormat` for creating the basic "number" localizer.
     * @property dateOptions - Options passed to `Intl.DateFormat` for creating the basic "date" localizer.
     */
    export const defaultLocalizationOptions: LocalizationOptions = {
        locale: 'en-US',
        numberOptions: { maximumFractionDigits: 0 }
    };

    export interface EdgeStyleValues {
		top?: string;
		right?: string;
		bottom?: string;
		left?: string;
    }

    export const edgeStyleKeys: Array<keyof EdgeStyleValues> = ['top', 'bottom', 'left', 'right'];

	export interface BoundingRectStyleValues extends EdgeStyleValues
	{
		width?: string;
		height?: string;
		position?: string;
	}

    export const boundingRectStyleKeys: Array<keyof BoundingRectStyleValues> = [ ...edgeStyleKeys, 'width', 'height', 'position'];

    export interface ColumnsDataValuesObject {
        [columnName: string]: DataModel.DataValue[];
    }

    export const grids = Array<Revgrid>();
}

// Begin Selection functions
// End Selection functions

// Begin Themes

// const styles = [
//     'BackgroundColor',
//     'Color',
//     'Font'
// ];

// const stylesWithHalign = styles.concat([
//     'Halign'
// ]);

// const dataCellStyles = stylesWithHalign.concat([
//     'cellPadding',
//     'iconPadding'
// ]);

// const stylers = [
//     { prefix: '',                                props: dataCellStyles },
//     { prefix: 'foregroundSelection',             props: styles },
//     { prefix: 'columnHeader',                    props: stylesWithHalign },
//     { prefix: 'columnHeaderForegroundSelection', props: styles },
//     { prefix: 'rowHeader',                       props: styles },
//     { prefix: 'rowHeaderForegroundSelection',    props: styles }
// ];

// const dynamicCosmetics = {
//     rowHeaderCheckboxes: defaults.rowHeaderCheckboxes,
//     rowHeaderNumbers: defaults.rowHeaderNumbers,
//     gridBorder: defaults.gridBorder,
//     gridBorderTop: defaults.gridBorderTop,
//     gridBorderRight: defaults.gridBorderRight,
//     gridBorderBottom: defaults.gridBorderBottom,
//     gridBorderLeft: defaults.gridBorderLeft,
//     gridRenderer: defaults.gridRenderer
// };

// // Create the `defaultTheme` theme by copying over the theme props,
// // which is a subset of all the props defined in defaults.js, beginning with
// // they dynamic cosmetics and `themeName`...
// const defaultTheme = Object.assign({}, dynamicCosmetics, {
//     themeName: defaults.themeName
// });

// // ...and then adding non-dynamic cosmetics into `defaultTheme`, by combining the above
// // prefixes with their styles to get prop names and then copy those props from `defaults`.
// stylers.reduce((theme, styler) => {
//     return styler.props.reduce(function(theme, prop) {
//         prop = styler.prefix + prop;
//         prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection'); // unfortunate!
//         prop = prop[0].toLowerCase() + prop.substr(1);
//         theme[prop] = defaults[prop];
//         return theme;
//     }, theme);
// }, defaultTheme);

// /**
//  * @summary The Hypergrid theme registry.
//  * @desc The standard registry consists of a single theme, `default`, built from values in defaults.js.
//  */
// const registry = Object.create(null, {
//     default: { value: defaultTheme }
// });

// function applyTheme(theme) {
//     var themeLayer, grids, props, themeObject;

//     if (theme && typeof theme === 'object' && !Object.getOwnPropertyNames(theme).length) {
//         theme = null;
//     }

//     if (this._theme) {
//         grids = [this];
//         themeLayer = this._theme;
//         props = this.properties;

//         // If removing theme, reset props to defaults
//         if (!theme) {
//             // Delete (non-dynamic) grid props named in this theme, revealing defaults
//             Object.keys(themeLayer).forEach(function(key) {
//                 if (!(key in dynamicPropertyDescriptors)) {
//                     delete props[key];
//                 }
//             });

//             // Reset dynamic cosmetic props to defaults
//             Object.keys(dynamicCosmetics).forEach(function(key) {
//                 props.var[key] = defaults[key];
//             });
//         }

//         // Delete all own props from this grid instance's theme layer (defined by an eariler call)
//         Object.keys(themeLayer).forEach(function(key) {
//             delete themeLayer[key];
//         });
//     } else {
//         grids = this.grids;
//         themeLayer = defaults; // global theme layer
//         theme = theme || 'default';
//     }

//     if (typeof theme === 'object') {
//         themeObject = theme;
//     } else if (!registry[theme]) {
//         throw new HypergridError('Unknown theme "' + theme + '"');
//     } else {
//         themeObject = registry[theme];
//     }

//     if (themeObject) {
//         // When no theme name, set it to explicit `undefined` (to mask defaults.themeName).
//         if (!themeObject.themeName) {
//             themeObject.themeName = undefined;
//         }

//         Object.keys(themeObject).forEach(function(key) {
//             if (key in dynamicPropertyDescriptors) {
//                 if (key in dynamicCosmetics) {
//                     grids.forEach(function(grid) {
//                         grid.properties[key] = themeObject[key];
//                     });
//                 } else {
//                     // Dynamic properties are defined on properties layer; defining these
//                     // r-values on the theme layer is ineffective so let's not allow it.
//                     switch (key) {
//                         case 'lineColor':
//                             themeObject.gridLinesHColor = themeObject.gridLinesVColor = themeObject[key];
//                             break;
//                         default:
//                             console.warn('Ignoring unexpected dynamic property ' + key + ' from theme object.');
//                     }
//                     // delete themeObject[key];
//                 }
//             }
//         });

//         // No .assign() because themeName is read-only in defaults layer
//         Object.defineProperties(themeLayer, Object.getOwnPropertyDescriptors(themeObject));
//     }

//     grids.forEach(function(grid) {
//         grid.repaint();
//     });

//     return themeObject;
// }

// End Themes
