import { cssInjector } from './css-injector';

// Following is the sole style requirement for bar and thumb elements.
// Maintained in code so not dependent being in stylesheet.
const BAR_STYLE = 'position: absolute;';
const THUMB_STYLE = 'position: absolute;';

export class FinBar {
    /**
     * @name bar
     * @summary The generated scrollbar element.
     * @desc The caller inserts this element into the DOM (typically into the content container) and then calls its {@link FinBar#resize|resize()} method.
     *
     * Thus the node tree is typically:
     * * A **content container** element, which contains:
     *   * The content element(s)
     *   * This **scrollbar element**, which in turn contains:
     *     * The **thumb element**
     */
    bar: HTMLDivElement;
    // Only use index and not viewport - legacy to support vertical scrolling until it uses viewport
    private _indexMode: boolean;
    /**
     * @summary The generated scrollbar thumb element.
     * @desc The thumb element's parent element is always the {@link FinBar#bar|bar} element.
     *
     * This property is typically referenced internally only. The size and position of the thumb element is maintained by `_calcThumb()`.
     */
    private thumb: HTMLDivElement;
    private _orientation: FinBar.Orientation;
    /**
     * @readonly
     * @summary <u>O</u>rientation <u>h</u>ash for this scrollbar.
     * @desc Set by the `orientation` setter to either the vertical or the horizontal orientation hash. The property should always be synchronized with `orientation`; do not update directly!
     *
     * This object is used internally to access scrollbars' DOM element properties in a generalized way without needing to constantly query the scrollbar orientation. For example, instead of explicitly coding `this.bar.top` for a vertical scrollbar and `this.bar.left` for a horizontal scrollbar, simply code `this.bar[this.oh.leading]` instead. See the {@link orientationHashType} definition for details.
     *
     * This object is useful externally for coding generalized {@link finbarOnChange} event handler functions that serve both horizontal and vertical scrollbars.
     */
    private oh: OrientationHash;
    /**
     * @summary The name of the `WheelEvent` property this scrollbar should listen to.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * Useful values are `'deltaX'`, `'deltaY'`, or `'deltaZ'`. A value of `null` means to ignore mouse wheel events entirely.
     *
     * The mouse wheel is one-dimensional and only emits events with `deltaY` data. This property is provided so that you can override the default of `'deltaX'` with a value of `'deltaY'` on your horizontal scrollbar primarily to accommodate certain "panoramic" interface designs where the mouse wheel should control horizontal rather than vertical scrolling. Just give `{ deltaProp: 'deltaY' }` in your horizontal scrollbar instantiation.
     *
     * Caveat: Note that a 2-finger drag on an Apple trackpad emits events with _both_ `deltaX ` and `deltaY` data so you might want to delay making the above adjustment until you can determine that you are getting Y data only with no X data at all (which is a sure bet you on a mouse wheel rather than a trackpad).
     */
    private deltaProp: FinBar.DeltaProp;
    private _contentStart: number;
    private _contentFinish: number;
    private _contentSize: number;
    private _contentNext: number; // _contentStart + _contentSize (or _contentFinish + 1)
    private _viewportStart: number;
    private _viewportFinish: number;
    private _viewportSize: number;


    private _classPrefix: string | undefined
    private _auxStyles: Record<string, string>;
    private testPanelItem: FinBar.TestPanelItem;
    /**
     * @summary Maximum offset of thumb's leading edge.
     * @desc This is the pixel offset within the scrollbar of the thumb when it is at its maximum position at the extreme end of its range.
     *
     * This value takes into account the newly calculated size of the thumb element (including its margins) and the inner size of the scrollbar (the thumb's containing element, including _its_ margins).
     *
     * NOTE: Scrollbar padding is not taken into account and assumed to be 0 in the current implementation and is assumed to be `0`; use thumb margins in place of scrollbar padding.
     */
    private _thumbMax: number;
    private _thumbMarginLeading: number;
    private _thumbScaling: number;
    private _pinOffset: number;
    // private container: HTMLElement;
    // private content: HTMLElement;

    dragging: boolean;
    /**
     * Wheel metric normalization, applied equally to all three axes.
     *
     * This value is overridden with a platform- and browser-specific wheel factor when available in {@link FinBar.normals}.
     *
     * To suppress, delete `FinBar.normals` before instantiation or override this instance variable (with `1.0`) after instantiation.
     */
    normal: number;

    private _bound: FinBar.Bound = {
        shortStop: (event: MouseEvent) => this.shortStop(event),
        onwheel: (event: WheelEvent) => this.onwheel(event),
        onclick: (event: MouseEvent) => this.onclick(event),
        onmouseover: () => this.onmouseover(),
        onmouseout: () => this.onmouseout(),
        onmousedown: (event: MouseEvent) => this.onmousedown(event),
        onmousemove: (event: MouseEvent) => this.onmousemove(event),
        onmouseup: (event: MouseEvent) => this.onmouseup(event),
    }

    /**
     * @summary Callback for scroll events.
     * @desc Set by the constructor via the similarly named property in the {@link finbarOptions} object. After instantiation, `this.onchange` may be updated directly.
     *
     * This event handler is called whenever the value of the scrollbar is changed through user interaction. The typical use case is when the content is scrolled. It is called with the `FinBar` object as its context and the current value of the scrollbar (its index, rounded) as the only parameter.
     *
     * Set this property to `null` to stop emitting such events.
     */
    onchange: FinBar.OnChange | undefined;

    /**
     * @name increment
     * @summary Number of scrollbar index units representing a pageful. Used exclusively for paging up and down and for setting thumb size relative to content size.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * Can also be given as a parameter to the {@link FinBar#resize|resize} method, which is pertinent because content area size changes affect the definition of a "pageful." However, you only need to do this if this value is being used. It not used when:
     * * you define `paging.up` and `paging.down`
     * * your scrollbar is using `scrollRealContent`
     */
    increment: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaX` (horizontal scrolling delta).
     * Not used
     */
    deltaXFactor: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaY` (vertical scrolling delta).
     * Not used
     */
    deltaYFactor: number;

    /**
     * Default value of multiplier for `WheelEvent#deltaZ` (delpth scrolling delta).
     * Not used
     */
    deltaZFactor: number;

    /**
     * @name barStyles
     * @summary Scrollbar styles to be applied by {@link FinBar#resize|resize()}.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * This is a value to be assigned to {@link FinBar#styles|styles} on each call to {@link FinBar#resize|resize()}. That is, a hash of values to be copied to the scrollbar element's style object on resize; or `null` for none.
     *
     * @see {@link FinBar#style|style}
     */
    barStyles: FinBar.BarStyles | null;

    /**
     * @name paging
     * @summary Enable page up/dn clicks.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * If truthy, listen for clicks in page-up and page-down regions of scrollbar.
     *
     * If an object, call `.paging.up()` on page-up clicks and `.paging.down()` will be called on page-down clicks.
     *
     * Changing the truthiness of this value after instantiation currently has no effect.
     */
    readonly paging: boolean | FinBar.Paging;

    /**
     * @summary Create a scrollbar object.
     * @desc Creating a scrollbar is a three-step process:
     *
     * 1. Instantiate the scrollbar object by calling this constructor function. Upon instantiation, the DOM element for the scrollbar (with a single child element for the scrollbar "thumb") is created but is not insert it into the DOM.
     * 2. After instantiation, it is the caller's responsibility to insert the scrollbar, {@link FinBar#bar|this.bar}, into the DOM.
     * 3. After insertion, the caller must call {@link FinBar#resize|resize()} at least once to size and position the scrollbar and its thumb. After that, `resize()` should also be called repeatedly on resize events (as the content element is being resized).
     *
     * Suggested configurations:
     * * _**Unbound**_<br/>
     * The scrollbar serves merely as a simple range (slider) control. Omit both `options.onchange` and `options.content`.
     * * _**Bound to virtual content element**_<br/>
     * Virtual content is projected into the element using a custom event handler supplied by the programmer in `options.onchange`. A typical use case would be to handle scrolling of the virtual content. Other use cases include data transformations, graphics transformations, _etc._
     * * _**Bound to real content**_<br/>
     * Set `options.content` to the "real" content element but omit `options.onchange`. This will cause the scrollbar to use the built-in event handler (`this.scrollRealContent`) which implements smooth scrolling of the content element within the container.
     *
     * @param options - Options object. See the type definition for member details.
     */
    constructor(options?: FinBar.Options) {
        this._indexMode = options.indexMode === true;
        // make bound versions of all the mouse event handler
        const bound = this._bound;
        this.thumb = document.createElement('div');
        const thumb = this.thumb;
        thumb.classList.add('thumb');
        thumb.setAttribute('style', THUMB_STYLE);
        thumb.onclick = bound.shortStop;
        thumb.onmouseover = bound.onmouseover;
        thumb.onmouseout = this._bound.onmouseout;

        this.bar = document.createElement('div');
        const bar = this.bar;
        bar.classList.add('finbar-vertical');
        bar.setAttribute('style', BAR_STYLE);
        bar.onmousedown = this._bound.onmousedown;
        if (this.paging) { bar.onclick = bound.onclick; }
        bar.appendChild(thumb);
        bar.addEventListener('wheel', this._bound.onwheel);

        options = options || {};

        // presets
        this._viewportStart = options.index ?? 0;
        this.orientation = options.orientation ?? FinBar.OrientationEnum.vertical;
        this._contentStart = options.range?.start ?? 0;
        this._contentFinish = options.range?.finish ?? 100;
        this._contentSize = this._contentFinish - this._contentStart + 1;
        this._contentNext = this._contentFinish + 1;
        this.increment = options.increment ?? 1;
        this.paging = options.paging ?? true;
        this.barStyles = options.barStyles ?? null;
        this.deltaProp = options.deltaProp ?? (this.orientation === FinBar.OrientationEnum.vertical ? FinBar.DeltaPropEnum.deltaY : FinBar.DeltaPropEnum.deltaX);
        this.deltaXFactor = options.deltaXFactor ?? 1;
        this.deltaYFactor = options.deltaYFactor ?? 1;
        this.deltaZFactor = options.deltaZFactor ?? 1;
        this.classPrefix = options.classPrefix;
        // this.container = options.container;
        // this.content = options.content;
        this.onchange = options.onchange;

        this.normal = getNormal();

        if (options.loadBuiltinCssStylesheet !== false) {
            cssInjector(cssFinBars, 'finbar-base', options.cssStylesheetReferenceElement);
        }
    }


    /**
     * @summary The scrollbar orientation.
     * @desc Set by the constructor to either `'vertical'` or `'horizontal'`. See the similarly named property in the {@link finbarOptions} object.
     *
     * Useful values are `'vertical'` (the default) or `'horizontal'`.
     *
     * Setting this property resets `this.oh` and `this.deltaProp` and changes the class names so as to reposition the scrollbar as per the CSS rules for the new orientation.
     */
    set orientation(orientation: FinBar.Orientation) {
        if (orientation === this._orientation) {
            return;
        }

        this._orientation = orientation;

        this.oh = orientationHashes[this._orientation];

        if (!this.oh) {
            error('Invalid value for `options._orientation.');
        }

        this.deltaProp = this.oh.delta;

        this.bar.className = this.bar.className.replace(/(vertical|horizontal)/g, orientation);

        if (this.bar.style.cssText !== BAR_STYLE || this.thumb.style.cssText !== THUMB_STYLE) {
            this.bar.setAttribute('style', BAR_STYLE);
            this.thumb.setAttribute('style', THUMB_STYLE);
            this.resize();
        }
    }

    get orientation() {
        return this._orientation;
    }

    /**
     * @summary Add a CSS class name to the bar element's class list.
     * @desc Set by the constructor. See the similarly named property in the {@link finbarOptions} object.
     *
     * The bar element's class list will always include `finbar-vertical` (or `finbar-horizontal` based on the current orientation). Whenever this property is set to some value, first the old prefix+orientation is removed from the bar element's class list; then the new prefix+orientation is added to the bar element's class list. This property causes _an additional_ class name to be added to the bar element's class list. Therefore, this property will only add at most one additional class name to the list.
     *
     * To remove _classname-orientation_ from the bar element's class list, set this property to a falsy value, such as `null`.
     *
     * > NOTE: You only need to specify an additional class name when you need to have mulltiple different styles of scrollbars on the same page. If this is not a requirement, then you don't need to make a new class; you would just create some additional rules using the same selectors in the built-in stylesheet (../css/finbars.css):
     * *`div.finbar-vertical` (or `div.finbar-horizontal`) for the scrollbar
     * *`div.finbar-vertical > div` (or `div.finbar-horizontal > div`) for the "thumb."
     *
     * Of course, your rules should come after the built-ins.
     */
    set classPrefix(prefix: string | undefined) {
        if (this._classPrefix !== undefined) {
            this.bar.classList.remove(this._classPrefix + this.orientation);
        }

        this._classPrefix = prefix;

        if (prefix !== undefined) {
            this.bar.classList.add(prefix + '-' + this.orientation);
        }
    }
    get classPrefix() {
        return this._classPrefix;
    }

    /**
     * @name style
     * @summary Additional scrollbar styles.
     * @desc See type definition for more details. These styles are applied directly to the scrollbar's `bar` element.
     *
     * Values are adjusted as follows before being applied to the element:
     * 1. Included "pseudo-property" names from the scrollbar's orientation hash, {@link FinBar#oh|oh}, are translated to actual property names before being applied.
     * 2. When there are margins, percentages are translated to absolute pixel values because CSS ignores margins in its percentage calculations.
     * 3. If you give a value without a unit (a raw number), "px" unit is appended.
     *
     * General notes:
     * 1. It is always preferable to specify styles via a stylesheet. Only set this property when you need to specifically override (a) stylesheet value(s).
     * 2. Can be set directly or via calls to the {@link FinBar#resize|resize} method.
     * 3. Should only be set after the scrollbar has been inserted into the DOM.
     * 4. Before applying these new values to the element, _all_ in-line style values are reset (by removing the element's `style` attribute), exposing inherited values (from stylesheets).
     * 5. Empty object has no effect.
     * 6. Falsey value in place of object has no effect.
     *
     * > CAVEAT: Do not attempt to treat the object you assign to this property as if it were `this.bar.style`. Specifically, changing this object after assigning it will have no effect on the scrollbar. You must assign it again if you want it to have an effect.
     *
     * @see {@link FinBar#barStyles|barStyles}
     */
    set style(styles: FinBar.BarStyles) {
        styles = extend({}, styles, this._auxStyles)
        const keys = Object.keys(styles);

        if (keys.length) {
            const bar = this.bar;
            const barRect = bar.getBoundingClientRect();
            const container = /*this.container ||*/ bar.parentElement;
            const containerRect = container.getBoundingClientRect();
            const oh = this.oh;

            // Before applying new styles, revert all styles to values inherited from stylesheets
            bar.setAttribute('style', BAR_STYLE);

            keys.forEach((key) => {
                let val = styles[key];

                if (key in oh) {
                    key = oh[key];
                }

                if (!isNaN(Number(val))) {
                    val = (val || 0) + 'px';
                } else if (/%$/.test(val)) {
                    // When bar size given as percentage of container, if bar has margins, restate size in pixels less margins.
                    // (If left as percentage, CSS's calculation will not exclude margins.)
                    const oriented = axis[key];
                    const margins = barRect[oriented.marginLeading] + barRect[oriented.marginTrailing];
                    if (margins) {
                        val = parseInt(val, 10) / 100 * containerRect[oriented.size] - margins + 'px';
                    }
                }

                bar.style[key] = val;
            });
        }
    }

    /**
     * @name range
     * @summary Setter for the minimum and maximum scroll values.
     * @desc Set by the constructor. These values are the limits for {@link FooBar#index|index}.
     *
     * The setter accepts an object with exactly two numeric properties: `.min` which must be less than `.max`. The values are extracted and the object is discarded.
     *
     * The getter returns a new object with `.min` and '.max`.
     */
    set contentRange(range: FinBar.ContentRange) {
        this._contentStart = range.start;
        this._contentFinish = range.finish;
        this._contentSize = range.finish - range.start + 1;
        this._contentNext = this._contentFinish + 1;
        if (this._indexMode) {
            this.index = this.index; // re-clamp
        }
    }
    get contentRange() {
        const result: FinBar.ContentRange = {
            start: this._contentStart,
            finish: this._contentFinish
        };

        return result;
    }

    get contentStart() { return this._contentStart; }
    get contentFinish() { return this._contentFinish; }
    get contentSize() { return this._contentSize; }

    /**
     * @summary Index value of the scrollbar.
     * @desc This is the position of the scroll thumb.
     *
     * Setting this value clamps it to {@link FinBar#min|min}..{@link FinBar#max|max}, scroll the content, and moves thumb.
     *
     * Getting this value returns the current index. The returned value will be in the range `min`..`max`. It is intentionally not rounded.
     *
     * Use this value as an alternative to (or in addition to) using the {@link FinBar#onchange|onchange} callback function.
     *
     * @see {@link FinBar#_setScroll|_setScroll}
     */
    set index(idx: number) {
        idx = Math.min(this._contentFinish, Math.max(this._contentStart, idx)); // clamp it
        this._setScroll(idx, undefined, true);
        // this._setThumbSize();
    }
    get index() {
        return this._viewportStart;
    }

    get viewportStart() {
        return this._viewportStart;
    }

    get viewportFinish() {
        return this._viewportFinish;
    }

    get viewportSize() {
        return this._viewportSize;
    }

    set viewportSize(value: number) {
        // Do not set any of the other viewport fields. These will be set later
        this._viewportSize = value;
        this.setThumbSize();
    }

    get hidden() {
        return this.bar.style.visibility === 'hidden'
    }

    setViewportStart(start: number) {
        this._setScroll(start, undefined, false);
    }

    scroll(delta: number) {
        // make sure does not go beyond end edge
        let newViewportStart = this._viewportStart + delta;
        if (newViewportStart < this._contentStart) {
            newViewportStart = this._contentStart;
        } else {
            const viewportNext = newViewportStart + this._viewportSize;
            if (viewportNext > this._contentNext) {
                newViewportStart = this._contentNext - this._viewportSize;
            }
        }
        this._setScroll(newViewportStart, undefined, true);
    }

    scrollIndex(delta: number) {
        // same as scroll(). Separate call for VScroller. Remove when VScroller uses Viewport
        this.index = this._viewportStart + delta;
    }

    /**
     * @summary Move the thumb.
     * @desc Also displays the index value in the test panel and invokes the callback.
     * @param viewportStart - The new scroll index, a value in the range `min`..`max`.
     * @param barPosition - The new thumb position in pixels and scaled relative to the containing {@link FinBar#bar|bar} element, i.e., a proportional number in the range `0`..`thumbMax`.
     */
    private _setScroll(viewportStart: number, barPosition: number | undefined, fireOnChange: boolean) {
        this._viewportStart = viewportStart;
        this._viewportFinish = this._viewportStart + this._viewportSize - 1;

        // Display the index value in the test panel
        if (this.testPanelItem && this.testPanelItem.index instanceof HTMLElement) {
            this.testPanelItem.index.innerHTML = Math.round(viewportStart).toString();
        }

        // Call the callback
        if (this.onchange && fireOnChange) {
            this.onchange(Math.round(viewportStart));
        }

        // Move the thumb
        if (barPosition === undefined) {
            if (this._indexMode) {
                barPosition = (viewportStart - this._contentStart) / (this._contentFinish - this._contentStart) * this._thumbMax;
            } else {
                barPosition = (viewportStart - this._contentStart) * this._thumbScaling;
            }
        }
        this.thumb.style[this.oh.leading] = barPosition + 'px';
    }

    // scrollRealContent(idx: number) {
    //     const containerRect = this.content.parentElement.getBoundingClientRect();
    //     const sizeProp = this.oh.size;
    //     const maxScroll = Math.max(0, this.content[sizeProp] - containerRect[sizeProp]);
    //     //scroll = Math.min(idx, maxScroll);
    //     const scroll = (idx - this._min) / (this._max - this._min) * maxScroll;
    //     //console.log('scroll: ' + scroll);
    //     this.content.style[this.oh.leading] = -scroll + 'px';
    // }

    /**
     * @summary Recalculate thumb position.
     *
     * @desc This method recalculates the thumb size and position. Call it once after inserting your scrollbar into the DOM, and repeatedly while resizing the scrollbar (which typically happens when the scrollbar's parent is resized by user.
     *
     * > This function shifts args if first arg omitted.
     *
     * @param {number} [increment=this.increment] - Resets {@link FooBar#increment|increment} (see).
     *
     * @param {finbarStyles} [barStyles=this.barStyles] - (See type definition for details.) Scrollbar styles to be applied to the bar element.
     *
     * Only specify a `barStyles` object when you need to override stylesheet values. If provided, becomes the new default (`this.barStyles`), for use as a default on subsequent calls.
     *
     * It is generally the case that the scrollbar's new position is sufficiently described by the current styles. Therefore, it is unusual to need to provide a `barStyles` object on every call to `resize`.
     *
     * @returns Self for chaining.
     */
    resize(): FinBar {
        // const bar = this.bar;

        // if (!bar.parentNode) {
        //     return undefined; // not in DOM yet so nothing to do
        // }

        // const container = /* this.container ||*/ bar.parentElement;
        // const containerRect = container.getBoundingClientRect();

        // shift args if if 1st arg omitted
        // let increment: number | undefined;
        // if (typeof incrementOrBarStyles === 'object') {
        //     barStyles = incrementOrBarStyles;
        //     increment = undefined;
        // } else {
        //     increment = incrementOrBarStyles;
        // }

        // this.barStyles = (barStyles ?? this.barStyles);
        // this.style = this.barStyles;
        this.style = {}; // update height/width from any shorten

        // Bound to real content: Content was given but no onchange handler.
        // Set up .onchange, .containerSize, and .increment.
        // Note this only makes sense if your index unit is pixels.
        // if (this.content) {
        //     if (!this.onchange) {
        //         this.onchange = this.scrollRealContent;
        //         this.contentSize = this.content[this.oh.size];
        //         this._min = 0;
        //         this._max = this.contentSize - 1;
        //     }
        // }
        // if (this.onchange === this.scrollRealContent) {
        //     this.containerSize = containerRect[this.oh.size];
        //     this.increment = this.containerSize / (this.contentSize - this.containerSize) * (this._max - this._min);
        // } else {
            // this._viewportSize = 1;
            // this.increment = increment || this.increment;
        // }

        if (this._indexMode) {
            this._viewportSize = 1;
        }

        const index = this.index;
        this.testPanelItem = this.testPanelItem || this._addTestPanelItem();
        this.setThumbSize();
        if (this._indexMode) {
            this.index = index;
        }

        return this;
    }

    /**
     * @summary Shorten trailing end of scrollbar by thickness of some other scrollbar.
     * @desc In the "classical" scenario where vertical scroll bar is on the right and horizontal scrollbar is on the bottom, you want to shorten the "trailing end" (bottom and right ends, respectively) of at least one of them so they don't overlay.
     *
     * This convenience function is an programmatic alternative to hardcoding the correct style with the correct value in your stylesheet; or setting the correct style with the correct value in the {@link FinBar#barStyles|barStyles} object.
     *
     * @see {@link FinBar#foreshortenBy|foreshortenBy}.
     *
     * @param otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns Self for chaining
     */
    shortenBy(otherFinBar: FinBar | null) {
        return this.shortenEndBy('trailing', otherFinBar);
    }

    /**
     * @summary Shorten leading end of scrollbar by thickness of some other scrollbar.
     * @desc Supports non-classical scrollbar scenarios where vertical scroll bar may be on left and horizontal scrollbar may be on top, in which case you want to shorten the "leading end" rather than the trailing end.
     * @see {@link FinBar#shortenBy|shortenBy}.
     * @param otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns Self for chaining
     */
    foreshortenBy(otherFinBar: FinBar | null) {
        return this.shortenEndBy('leading', otherFinBar);
    }

    /**
     * @summary Generalized shortening function.
     * @see {@link FinBar#shortenBy|shortenBy}.
     * @see {@link FinBar#foreshortenBy|foreshortenBy}.
     * @param whichEnd - a CSS style property name or an orientation hash name that translates to a CSS style property name.
     * @param otherFinBar - Other scrollbar to avoid by shortening this one; `null` removes the trailing space
     * @returns Self for chaining
     */
    shortenEndBy(whichEnd: 'trailing' | 'leading', otherFinBar: FinBar | null) {
        if (!otherFinBar) {
            delete this._auxStyles;
        } else if (otherFinBar instanceof FinBar && otherFinBar.orientation !== this.orientation) {
            const otherStyle = window.getComputedStyle(otherFinBar.bar);
            const ooh = orientationHashes[otherFinBar.orientation];
            this._auxStyles = {};
            this._auxStyles[whichEnd] = otherStyle[ooh.thickness];
        }
        return this; // for chaining
    }

    /**
     * @summary Sets the proportional thumb size and hides thumb when 100%.
     * @desc The thumb size has an absolute minimum of 20 (pixels).
     */
    private setThumbSize() {
        const oh = this.oh;
        const thumbComp = window.getComputedStyle(this.thumb);
        const thumbMarginLeading = parseInt(thumbComp[oh.marginLeading]);
        const thumbMarginTrailing = parseInt(thumbComp[oh.marginTrailing]);
        const thumbMargins = thumbMarginLeading + thumbMarginTrailing;
        const barSize = this.bar.getBoundingClientRect()[oh.size];
        this._thumbScaling = barSize / this._contentSize;
        const thumbSize = Math.max(20, barSize * this._viewportSize / this._contentSize);

        if (this._viewportSize > 0 && this._viewportSize < this._contentSize) {
            this.bar.style.visibility = 'visible';
            this.thumb.style[oh.size] = thumbSize + 'px';
        } else {
            this.bar.style.visibility = 'hidden';
        }

        this._thumbMax = barSize - thumbSize - thumbMargins;

        this._thumbMarginLeading = thumbMarginLeading; // used in mousedown
    }

    /**
     * @summary Remove the scrollbar.
     * @desc Unhooks all the event handlers and then removes the element from the DOM. Always call this method prior to disposing of the scrollbar object.
     */
    remove() {
        this.bar.onmousedown = null;
        this._removeEvt('mousemove');
        this._removeEvt('mouseup');

        this.bar.parentElement.removeEventListener('wheel', this._bound.onwheel);

        this.bar.onclick =
            this.thumb.onclick =
                this.thumb.onmouseover =
                    this.thumb.ontransitionend =
                        this.thumb.onmouseout = null;

        this.bar.remove();
    }

    /**
     * @private
     * @function _addTestPanelItem
     * @summary Append a test panel element.
     * @desc If there is a test panel in the DOM (typically an `<ol>...</ol>` element) with class names of both `this.classPrefix` and `'test-panel'` (or, barring that, any element with class name `'test-panel'`), an `<li>...</li>` element will be created and appended to it. This new element will contain a span for each class name given.
     *
     * You should define a CSS selector `.listening` for these spans. This class will be added to the spans to alter their appearance when a listener is added with that class name (prefixed with 'on').
     *
     * (This is an internal function that is called once by the constructor on every instantiation.)
     * @returns The appended `<li>...</li>` element or `undefined` if there is no test panel.
     */
    private _addTestPanelItem() {
        let testPanelItem: FinBar.TestPanelItem;
        const testPanelElement = document.querySelector('.' + this._classPrefix + '.test-panel') || document.querySelector('.test-panel');

        if (testPanelElement) {
            const testPanelItemPartNames = [ 'mousedown', 'mousemove', 'mouseup', 'index' ];
            const item = document.createElement('li');

            testPanelItemPartNames.forEach((partName) => {
                item.innerHTML += '<span class="' + partName + '">' + partName.replace('mouse', '') + '</span>';
            });

            testPanelElement.appendChild(item);

            testPanelItem = {
                mousedown: item.getElementsByClassName('mousedown')[0],
                mousemove: item.getElementsByClassName('mousemove')[0],
                mouseup: item.getElementsByClassName('mouseup')[0],
                index: item.getElementsByClassName('index')[0],
            };
        }

        return testPanelItem;
    }

    private _addEvt(evtName: string) {
        const spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) { spy.classList.add('listening'); }
        window.addEventListener(evtName, this._bound['on' + evtName]);
    }

    private _removeEvt(evtName: string) {
        const spy = this.testPanelItem && this.testPanelItem[evtName];
        if (spy) { spy.classList.remove('listening'); }
        window.removeEventListener(evtName, this._bound['on' + evtName]);
    }

    shortStop(evt: MouseEvent) {
        evt.stopPropagation();
    }

    onwheel(evt: WheelEvent) {
        this.index += evt[this.deltaProp] * this[this.deltaProp + 'Factor'] * this.normal;
        evt.stopPropagation();
        evt.preventDefault();
    }

    onclick(evt: MouseEvent) {
        const thumbBox = this.thumb.getBoundingClientRect(),
            goingUp = evt[this.oh.coordinate] < thumbBox[this.oh.leading];

        if (typeof this.paging === 'object') {
            this.index = this.paging[goingUp ? 'up' : 'down'](Math.round(this.index));
        } else {
            this.index += goingUp ? -this.increment : this.increment;
        }

        // make the thumb glow momentarily
        this.thumb.classList.add('hover');
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        this.thumb.addEventListener('transitionend', function waitForIt() {
            this.removeEventListener('transitionend', waitForIt);
            self._bound.onmouseup(evt);
        });

        evt.stopPropagation();
    }

    onmouseover() {
        this.thumb.classList.add('hover');
    }

    onmouseout() {
        if (!this.dragging) {
            this.thumb.classList.remove('hover');
        }
    }

    onmousedown(evt: MouseEvent) {
        const thumbBox = this.thumb.getBoundingClientRect();
        this._pinOffset = evt[this.oh.axis] - thumbBox[this.oh.leading] + this.bar.getBoundingClientRect()[this.oh.leading] + this._thumbMarginLeading;
        document.documentElement.style.cursor = 'default';

        this.dragging = true;

        this._addEvt('mousemove');
        this._addEvt('mouseup');

        evt.stopPropagation();
        evt.preventDefault();
    }

    onmousemove(evt: MouseEvent) {
        if (!(evt.buttons & 1)) {
            // mouse button may have been released without `onmouseup` triggering (see
            window.dispatchEvent(new MouseEvent('mouseup', evt));
            return;
        }

        let barPosition: number | undefined;
        let viewportStart: number;

        if (this._indexMode) {
            barPosition = Math.min(this._thumbMax, Math.max(0, evt[this.oh.axis] - this._pinOffset));
            viewportStart = barPosition / this._thumbMax * (this._contentFinish - this._contentStart) + this._contentStart;
        } else {
            barPosition = evt[this.oh.axis] - this._pinOffset;
            if (barPosition < 0) {
                // make sure does not go beyond start edge
                barPosition = 0;
            }
            viewportStart = barPosition / this._thumbScaling + this._contentStart;

            // make sure does not go beyond end edge
            const viewportNext = viewportStart + this._viewportSize;
            if (viewportNext > this._contentNext) {
                viewportStart = this._contentNext - this._viewportSize;
                barPosition = undefined;
            }
        }

        this._setScroll(viewportStart, barPosition, true);

        evt.stopPropagation();
        evt.preventDefault();
    }

    onmouseup(evt: MouseEvent) {
        this._removeEvt('mousemove');
        this._removeEvt('mouseup');

        this.dragging = false;

        document.documentElement.style.cursor = 'auto';

        const thumbBox = this.thumb.getBoundingClientRect();
        if (
            thumbBox.left <= evt.clientX && evt.clientX <= thumbBox.right &&
            thumbBox.top <= evt.clientY && evt.clientY <= thumbBox.bottom
        ) {
            this._bound.onmouseover(evt);
        } else {
            this._bound.onmouseout(evt);
        }

        evt.stopPropagation();
        evt.preventDefault();
    }
}

export namespace FinBar {
    export interface Options {
        indexMode?: boolean;
        orientation?: Orientation;
        index?: number;
        range?: ContentRange;
        increment?: number;
        paging?: boolean | Paging;
        barStyles?: BarStyles;
        deltaProp?: DeltaProp;
        deltaXFactor?: number;
        deltaYFactor?: number;
        deltaZFactor?: number;
        classPrefix?: string;
        // container?: HTMLElement;
        // content?: HTMLElement;
        /** Specifies whether to load builtin FinBar stylesheet. Default: true */
        loadBuiltinCssStylesheet?: boolean;
        cssStylesheetReferenceElement?: null | Element | string;
        onchange?: OnChange;
    }

    export const enum OrientationEnum {
        vertical = 'vertical',
        horizontal = 'horizontal',
    }
    export type Orientation = keyof typeof OrientationEnum;

    export const enum DeltaPropEnum {
        deltaX = 'deltaX',
        deltaY = 'deltaY',
        deltaZ = 'deltaZ',
    }
    export type DeltaProp = keyof typeof DeltaPropEnum;

    export interface ContentRange {
        start: number;
        finish: number;
    }

    export const defaultContentRange: ContentRange = {
        start: 0,
        finish: 100
    }

    export interface Paging {
        up: (this: void, index: number) => number;
        down: (this: void, index: number) => number;
    }

    export interface TestPanelItem {
        mousedown: Element;
        mousemove: Element;
        mouseup: Element;
        index: Element;
    }

    export interface Bound {
        shortStop: (this: void, evt: MouseEvent) => void;
        onwheel: (this: void, evt: WheelEvent) => void;
        onclick: (this: void, evt: MouseEvent) => void;
        onmouseover: (this: void, evt: MouseEvent) => void;
        onmouseout: (this: void, evt: MouseEvent) => void;
        onmousedown: (this: void, evt: MouseEvent) => void;
        onmousemove: (this: void, evt: MouseEvent) => void;
        onmouseup: (this: void, evt: MouseEvent) => void;
    }

    export type BarStyles = Record<string, string>;

    export type OnChange = (this: void, index: number) => void;
}

function extend(obj: Record<string, string>, styles: Record<string, string> | undefined, auxStyles: Record<string, string> | undefined) {
    if (styles !== undefined) {
        for (const key in styles) {
            obj[key] = styles[key];
        }
    }
    if (auxStyles !== undefined) {
        for (const key in auxStyles) {
            obj[key] = auxStyles[key];
        }
    }
    return obj;
}

/**
 * Table of wheel normals to webkit.
 *
 * This object is a dictionary of platform dictionaries, keyed by:
 * * `mac` — macOS
 * * `win` — Window
 *
 * Each platform dictionary is keyed by:
 * * `webkit` — Chrome, Opera, Safari
 * * `moz` — Firefox
 * * `ms` — IE 11 _(Windows only)_
 * * `edge` — Edge _(Windows only)_
 *
 * @todo add `linux` platform
 */

interface Browser {
    [browser: string]: number;
    webkit: number;
    moz: number;
    edge?: number;
}
interface Normals {
    [browser: string]: Browser;
    mac: Browser;
    win: Browser;
}

const defaultNormal = 1.0;

const normals: Normals = {
    mac: {
        webkit: 1.0,
        moz: 35
    },
    win: {
        webkit: 2.6,
        moz: 85,
        edge: 2
    }
};

function getNormal() {
    const nav = window.navigator;
    const ua = nav.userAgent;
    const platform = nav.platform.substr(0, 3).toLowerCase();
    const browser: keyof Browser = /Edge/.test(ua) ? 'edge' :
        /Opera|OPR|Chrome|Safari/.test(ua) ? 'webkit' :
            /Firefox/.test(ua) ? 'moz' :
                undefined;
    const platformDictionary = normals[platform];
    if (platformDictionary === undefined) {
        return defaultNormal;
    } else {
        const normalVersion = platformDictionary[browser];
        if (normalVersion === undefined) {
            return defaultNormal;
        } else {
            return normalVersion;
        }
    }
}

interface OrientationHash {
    coordinate: 'clientX' | 'clientY';
    axis: 'pageX' | 'pageY';
    size: 'width' | 'height';
    outside: 'bottom' | 'right';
    inside: 'top' | 'left';
    leading: 'left' | 'top';
    trailing: 'right' | 'bottom';
    marginLeading: 'marginLeft' | 'marginTop';
    marginTrailing: 'marginRight' | 'marginBottom';
    thickness: 'height' | 'width';
    delta: FinBar.DeltaProp;
}

interface OrientationHashes {
    vertical: OrientationHash;
    horizontal: OrientationHash;
}

const orientationHashes: OrientationHashes = {
    vertical: {
        coordinate:     'clientY',
        axis:           'pageY',
        size:           'height',
        outside:        'right',
        inside:         'left',
        leading:        'top',
        trailing:       'bottom',
        marginLeading:  'marginTop',
        marginTrailing: 'marginBottom',
        thickness:      'width',
        delta:          'deltaY'
    },
    horizontal: {
        coordinate:     'clientX',
        axis:           'pageX',
        size:           'width',
        outside:        'bottom',
        inside:         'top',
        leading:        'left',
        trailing:       'right',
        marginLeading:  'marginLeft',
        marginTrailing: 'marginRight',
        thickness:      'height',
        delta:          'deltaX'
    }
};

const axis = {
    top:    'vertical',
    bottom: 'vertical',
    height: 'vertical',
    left:   'horizontal',
    right:  'horizontal',
    width:  'horizontal'
};

// definition inserted by gulpfile between following comments
/* inject:css */
const cssFinBars = 'div.finbar-horizontal,div.finbar-vertical{margin:3px}div.finbar-horizontal>.thumb,div.finbar-vertical>.thumb{background-color:#d3d3d3;-webkit-box-shadow:0 0 1px #000;-moz-box-shadow:0 0 1px #000;box-shadow:0 0 1px #000;border-radius:4px;margin:2px;opacity:.4;transition:opacity .5s}div.finbar-horizontal>.thumb.hover,div.finbar-vertical>.thumb.hover{opacity:1;transition:opacity .5s}div.finbar-vertical{top:0;bottom:0;right:0;width:11px}div.finbar-vertical>.thumb{top:0;right:0;width:7px}div.finbar-horizontal{left:0;right:0;bottom:0;height:11px}div.finbar-horizontal>.thumb{left:0;bottom:0;height:7px}';
/* endinject */

function error(msg: string) {
    throw 'finbars: ' + msg;
}
