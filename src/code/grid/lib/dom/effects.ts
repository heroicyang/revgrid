/** @module effects */

/** effectFunction
 * @desc Element to perform transitions upon is `options.el` if defined or `this.el`.
 * @param {object} [options]
 * @param {HTMLElement} [options.el=this.el]
 * @param {function} [options.callback] Function to call at conclusion of transitions.
 * @param {string} [options.duration='0.065s'] - Duration of each transition.
 * @param {object} [options.styles=defaultGlowerStyles] - Hash of CSS styles and values to transition. (For {@link effects~glower|glower} only.
 */

export abstract class Effect {
    protected readonly _callback: Effect.Options.Callback | undefined;

    constructor(public readonly el: HTMLElement, public readonly options?: Effect.Options) {
        this._callback = options?.callback;
    }

    abstract start(): void;
}

export namespace Effect {
    export interface Options {
        callback?: Options.Callback;
    }

    export namespace Options {
        export type Callback = (this: void) => void;
    }

    export type Constructor = new(el: HTMLElement, options?: Options) => Effect;
}

export class EffectFactory {
    create(name: string, el: HTMLElement, options?: Effect.Options) {
        switch (name) {
            case ShakerEffect.typeName: return new ShakerEffect(el, options as ShakerEffect.Options);
            case GlowerEffect.typeName: return new GlowerEffect(el, options as GlowerEffect.Options);
            default:
                throw new Error(`Unsupport effect: ${name}`);
        }
    }
}

export const effectFactory = new EffectFactory();

/**
 * Shake element back and fourth a few times as if to say, "Nope!"
 */
 export class ShakerEffect extends Effect {
    private duration: string;
    private transitions: string[];
    private position: string;
    private x: number;
    private dx: number;
    private shakes: number;

    private _transitionendListener = (ev: TransitionEvent) => this.shake(ev);

    constructor(el: HTMLElement, options?: ShakerEffect.Options) {
        super(el, options);
        this.duration = options?.duration ?? ShakerEffect.duration;
    }

    start() {
        const computedStyle = window.getComputedStyle(this.el);
        this.transitions = computedStyle.transition.split(',');
        this.position = computedStyle.position;
        this.x = parseInt(computedStyle.left);
        this.dx = -3;
        this.shakes = 6;

        this.transitions.push('left ' + this.duration);
        this.el.style.transition = this.transitions.join(',');
        this.el.addEventListener('transitionend', this._transitionendListener);

        this.shake();
    }

    destroy() {
        const el = this.el;
        el.removeEventListener('transitionend', this._transitionendListener);
        this.transitions.pop();
        el.style.transition = this.transitions.join(',');
        el.style.position = this.position;
        if (this._callback !== undefined) {
            this._callback();
        }
    }

    shake(event?: TransitionEvent) {
        if (!event || event.propertyName === 'left') {
            this.el.style.left = this.x + this.dx + 'px';
            if (this.shakes-- === 0) {
                this.destroy();
            }
            this.dx = this.shakes ? -this.dx : 0;
        }
    }
}

export namespace ShakerEffect {
    export const typeName = 'shaker';
    export const duration = '0.065s';

    export interface Options extends Effect.Options {
        duration: string;
    }
}

/**
 * Transition styles on element for a moment and revert as if to say, "Whoa!."
 */
export class GlowerEffect extends Effect {
    private _duration: string;
    private _glowerStyles: GlowerEffect.Styles;
    private _transitionendListener = (ev: TransitionEvent) => this.glower(ev);
    private _originalTransitionStyle: string;
    private _styleWasMap = new Map<string, GlowerEffect.StyleWas>();
    private _activeCount: number;

    constructor(el: HTMLElement, options?: GlowerEffect.Options) {
        super(el, options);

        this._duration = options?.duration ?? GlowerEffect.duration;
        this._glowerStyles = options.styles ?? GlowerEffect.defaultStyles;
    }

    start() {
        const el = this.el;
        const glowerStyles = this._glowerStyles as Record<keyof CSSStyleDeclaration, string>;
        const computedStyle = window.getComputedStyle(el);
        this._originalTransitionStyle = computedStyle.transition;
        const transitions = this._originalTransitionStyle.split(',');


        for (const styleName in glowerStyles) {
            this._styleWasMap.set(styleName, {
                    style: computedStyle[styleName],
                    undo: true
                }
            );
            transitions.push(styleName + ' ' + this._duration);
        }
        this._activeCount = this._styleWasMap.size;
        el.style.transition = transitions.join(',');
        el.addEventListener('transitionend', this._transitionendListener);

        for (const styleName in glowerStyles) {
            el.style[styleName] = glowerStyles[styleName];
        }
    }

    destroy() {
        const el = this.el;
        el.removeEventListener('transitionend', this._transitionendListener);
        el.style.transition = this._originalTransitionStyle;
        if (this._callback !== undefined) {
            this._callback();
        }
    }

    glower(event: TransitionEvent) {
        const was = this._styleWasMap.get(event.propertyName);
        // const was = this.styleWas[event.propertyName];
        if (was.undo) {
            this.el.style[event.propertyName] = was.style;
            was.undo = false;
        } else {
            if (--this._activeCount === 0) {
                this.destroy();
            }
        }
    }
}

export namespace GlowerEffect {
    export const typeName = 'glower';
    export const duration = '0.25s';

    export interface Options extends Effect.Options {
        duration: string;
        styles: Styles;
    }

    export type Styles = Record<string, string>;

    export const defaultStyles: Styles = {
        'background-color': 'yellow',
        'box-shadow': '0 0 10px red'
    };

    export interface StyleWas {
        style: string;
        undo: boolean;
    }
}
