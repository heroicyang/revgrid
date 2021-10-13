import { UnreachableCaseError } from '../lib/revgrid-error';
import { TextTruncateType } from '../lib/types';

/** @public */
export class CanvasRenderingContext2DEx {
    private fontMetrics: Record<string, Record<string, number>> = {} // Record of characters and their width - previously was global
    private fontData: Record<string, CanvasRenderingContext2DEx.TextHeight> = {}; // previously was global
    private readonly conditionalsStack: CanvasRenderingContext2DEx.ConditionalsStack = [];

    readonly cache: CanvasRenderingContext2DEx.Cache;

    constructor(private readonly canvasRenderingContext2D: CanvasRenderingContext2D) {
        this.cache = new CanvasRenderingContext2DEx.Cache(canvasRenderingContext2D);
    }

    clearRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.clearRect(x, y, width, height);
    }

    fillRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.fillRect(x, y, width, height);
    }

    measureText(value: string) {
        return this.canvasRenderingContext2D.measureText(value);
    }

    beginPath() {
        this.canvasRenderingContext2D.beginPath();
    }

    rect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.rect(x, y, width, height);
    }

    clip() {
        this.canvasRenderingContext2D.clip();
    }

    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
        return this.canvasRenderingContext2D.createLinearGradient(x0, y0, x1, y1);
    }

    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) {
        this.canvasRenderingContext2D.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }

    stroke() {
        this.canvasRenderingContext2D.stroke();
    }

    strokeRect(x: number, y: number, width: number, height: number) {
        this.canvasRenderingContext2D.strokeRect(x, y, width, height);
    }

    fill() {
        this.canvasRenderingContext2D.fill();
    }

    fillText(text: string, x: number, y: number, maxWidth?: number) {
        this.canvasRenderingContext2D.fillText(text, x, y, maxWidth);
    }

    closePath() {
        this.canvasRenderingContext2D.closePath();
    }

    lineTo(x: number, y: number) {
        this.canvasRenderingContext2D.lineTo(x, y);
    }

    moveTo(x: number, y: number) {
        this.canvasRenderingContext2D.moveTo(x, y);
    }

    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number) {
        this.canvasRenderingContext2D.drawImage(image, dx, dy, dw, dh);
    }

    scale(x: number, y: number) {
        this.canvasRenderingContext2D.scale(x, y);
    }

    getImageData(sx: number, sy: number, sw: number, sh: number) {
        return this.canvasRenderingContext2D.getImageData(sx, sy, sw, sh);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        return this.canvasRenderingContext2D.quadraticCurveTo(cpx, cpy, x, y);
    }

    // clearFill: typeof CanvasRenderingContext2DEx.clearFill;
    // alpha: typeof CanvasRenderingContext2DEx.alpha;
    // getTextWidth: typeof CanvasRenderingContext2DEx.getTextWidth;
    // getTextWidthTruncated: typeof CanvasRenderingContext2DEx.getTextWidthTruncated;
    // getTextHeight: typeof CanvasRenderingContext2DEx.getTextHeight;
    // clipSave: typeof CanvasRenderingContext2DEx.clipSave;
    // clipRestore: typeof CanvasRenderingContext2DEx.clipRestore;

    clearFill(x: number, y: number, width: number, height: number, color: string) {
        const a = this.alpha(color);
        if (a < 1) {
            // If background is translucent, we must clear the rect before the fillRect
            // below to prevent mixing with previous frame's render of this cell.
            this.clearRect(x, y, width, height);
        }
        if (a > 0) {
            this.cache.fillStyle = color;
            this.fillRect(x, y, width, height);
        }
    }

    // Tried using an `alphaCache` here but it didn't make a measurable difference.
    alpha(cssColorSpec: string | undefined) {
        let matches: RegExpMatchArray | null;
        let result: number;

        if (!cssColorSpec) {
            // undefined so not visible; treat as transparent
            result = 0;
        } else if ((matches = cssColorSpec.match(CanvasRenderingContext2DEx.ALPHA_REGEX)) === null) {
            // an opaque color (a color spec with no alpha channel)
            result = 1;
        } else if (matches[4] === undefined) {
            // cssColorSpec must have been 'transparent'
            result = 0;
        } else {
            result = Number(matches[4]);
        }

        return result;
    }

    /**
     * Accumulates width of string in pixels, character by character, by chaching character widths and reusing those values when previously cached.
     *
     * NOTE: There is a minor measuring error when taking the sum of the pixel widths of individual characters that make up a string vs. the pixel width of the string taken as a whole. This is possibly due to kerning or rounding. The error is typically about 0.1%.
     * @param string - Text to measure.
     * @returns Width of string in pixels.
     */
    getTextWidth(string: string) {
        const metrics = this.fontMetrics[this.cache.font] = this.fontMetrics[this.cache.font] || {};
        string += '';
        const len = string.length
        let sum = 0;
        for (let i = 0; i < len; ++i) {
            const c = string[i];
            sum += metrics[c] = metrics[c] || this.measureText(c).width;
        }
        return sum;
    }

    /**
     * Similar to `getTextWidth` except:
     * 1. Aborts accumulating when sum exceeds given `width`.
     * 2. Returns an object containing both the truncated string and the sum (rather than a number primitive containing the sum alone).
     * @param text - Text to measure.
     * @param width - Width of target cell; overflow point.
     * @param truncateType - _Per {@link module:defaults.truncateTextWithEllipsis}._
     * @param abort - Abort measuring upon overflow. Returned `width` sum will reflect truncated string rather than untruncated string. Note that returned `string` is truncated in either case.
     * @param truncateFromStart - by default it will truncate the string from the position 0
     */
    getTextWidthTruncated(this: CanvasRenderingContext2DEx,
        text: string,
        width: number,
        truncateType: TextTruncateType | undefined,
        abort: boolean,
        truncateFromEnd: boolean
    ): CanvasRenderingContext2DEx.TruncatedTextWidth {
        let metrics = this.fontMetrics[this.cache.font];
        const truncating = truncateType !== undefined;
        let truncString: string; //, truncWidth, truncAt;

        if (!metrics) {
            metrics = this.fontMetrics[this.cache.font] = {};
            metrics[CanvasRenderingContext2DEx.ELLIPSIS] = this.measureText(CanvasRenderingContext2DEx.ELLIPSIS).width;
        }

        text += ''; // convert to string
        // width += truncateType === TextTruncateType.BeforeLastPartiallyVisibleCharacter ? 2 : -1; // fudge for inequality
        let sum = 0;
        if (truncateFromEnd) {
            const textLength = text.length;
            for (let i = textLength - 1; i >= 0; --i) {
                const char = text[i];
                const charWidth = metrics[char] = metrics[char] || this.measureText(char).width;
                sum += charWidth;
                if (truncating && sum > width && truncString === undefined) {
                    switch (truncateType) {
                        case TextTruncateType.WithEllipsis: { // truncate sufficient characters to fit ellipsis if possible
                            let truncWidth = sum - charWidth + metrics[CanvasRenderingContext2DEx.ELLIPSIS];
                            let truncAt = i + 1;
                            while (truncAt < textLength && truncWidth > width) {
                                truncWidth -= metrics[text[truncAt++]];
                            }
                            truncString = truncWidth > width
                                ? '' // not enough room even for ellipsis
                                : truncString = CanvasRenderingContext2DEx.ELLIPSIS + text.substr(truncAt);
                            break;
                        }
                        case TextTruncateType.BeforeLastPartiallyVisibleCharacter: { // truncate *before* last partially visible character
                            truncString = text.substr(i + 1);
                            break;
                        }
                        case TextTruncateType.AfterLastPartiallyVisibleCharacter: { // truncate *after* partially visible character
                            truncString = text.substr(i);
                            break;
                        }
                        default:
                            throw new UnreachableCaseError('CRC2EGTWT98832', truncateType);
                    }
                    if (abort) {
                        break;
                    }
                }
            }
        } else {
            for (let i = 0, len = text.length; i < len; ++i) {
                const char = text[i];
                const charWidth = metrics[char] = metrics[char] || this.measureText(char).width;
                sum += charWidth;
                if (truncating && sum > width && truncString === undefined) {
                    switch (truncateType) {
                        case TextTruncateType.WithEllipsis: { // truncate sufficient characters to fit ellipsis if possible
                            let truncWidth = sum - charWidth + metrics[CanvasRenderingContext2DEx.ELLIPSIS];
                            let truncAt = i;
                            while (truncAt && truncWidth > width) {
                                truncWidth -= metrics[text[--truncAt]];
                            }
                            truncString = truncWidth > width
                                ? '' // not enough room even for ellipsis
                                : truncString = text.substr(0, truncAt) + CanvasRenderingContext2DEx.ELLIPSIS;
                            break;
                        }
                        case TextTruncateType.BeforeLastPartiallyVisibleCharacter: { // truncate *before* last partially visible character
                            truncString = text.substr(0, i);
                            break;
                        }
                        case TextTruncateType.AfterLastPartiallyVisibleCharacter: { // truncate *after* partially visible character
                            const truncAt = i + 1;
                            if (truncAt < text.length) {
                                truncString = text.substr(0, truncAt);
                            }
                            break;
                        }
                        default:
                            throw new UnreachableCaseError('CRC2EGTWT98832', truncateType);
                    }
                    if (abort) {
                        break;
                    }
                }
            }
        }

        if (truncString === undefined) {
            truncString = text;
        }

        return {
            text: truncString,
            textWidth: sum
        };
    }

    getTextHeight(font: string) {
        let result: CanvasRenderingContext2DEx.TextHeight = this.fontData[font];

        if (result !== undefined) {
            const text = document.createElement('span');
            text.textContent = 'Hg';
            text.style.font = font;

            const block = document.createElement('div');
            block.style.display = 'inline-block';
            block.style.width = '1px';
            block.style.height = '0px';

            const div = document.createElement('div');
            div.appendChild(text);
            div.appendChild(block);

            div.style.position = 'absolute';
            document.body.appendChild(div);

            let ascent: number;
            let descent: number;
            let height: number;

            try {

                block.style.verticalAlign = 'baseline';

                const blockRect = block.getBoundingClientRect();
                const textRect = text.getBoundingClientRect();

                ascent = blockRect.top - textRect.top;

                block.style.verticalAlign = 'bottom';
                height = blockRect.top - textRect.top;

                descent = result.height - result.ascent;

                result = {
                    ascent,
                    descent,
                    height,
                };

            } finally {
                document.body.removeChild(div);
            }
            if (result.height !== 0) {
                this.fontData[font] = result;
            }
        }

        return result;
    }

    clipSave(conditional: CanvasRenderingContext2DEx.Conditional, x: number, y: number, width: number, height: number) {
        this.conditionalsStack.push(conditional);
        if (conditional) {
            this.cache.save();
            this.beginPath();
            this.rect(x, y, width, height);
            this.clip();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    clipRestore(conditional: CanvasRenderingContext2DEx.Conditional) {
        if (this.conditionalsStack.pop()) {
            this.cache.restore(); // Remove clip region
        }
    }
}

/** @public */
export namespace CanvasRenderingContext2DEx {
    export const ALPHA_REGEX = /^(transparent|((RGB|HSL)A\(.*,\s*([\d\.]+)\)))$/i
    export const ELLIPSIS = '\u2026' // The "…" (dot-dot-dot) character

    export interface TruncatedTextWidth {
        /** `undefined` if it fits; truncated version of provided `string` if it does not. */
        text: string | undefined,
        /** Width of provided `text` if it fits; width of truncated string if it does not. */
        textWidth: number
    }

    export interface TextHeight {
        ascent: number;
        height: number;
        descent: number;
    }

    export type Conditional = boolean | undefined;
    export type ConditionalsStack = Conditional[];

    export class Cache {
        values: Cache.Values = {} as Cache.Values;
        valuesStack = new Array<Cache.Values>();

        constructor(private readonly _canvasRenderingContext2D: CanvasRenderingContext2D) {

        }

        get fillStyle() {
            let value = this.values.fillStyle;
            if (value === undefined) {
                value = this.values.fillStyle = this._canvasRenderingContext2D.fillStyle as string | CanvasGradient;
            }
            return value;
        }
        set fillStyle(value: string | CanvasGradient /* | CanvasPattern*/) {
            if (value !== this.fillStyle) {
                this._canvasRenderingContext2D.fillStyle = value;
                this.values.fillStyle = value;
            }
        }
        get font() {
            let value = this.values.font;
            if (value === undefined) {
                value = this.values.font = this._canvasRenderingContext2D.font;
            }
            return value;
        }
        set font(value: string) {
            if (value !== this.font) {
                this._canvasRenderingContext2D.font = value;
                this.values.font = value;
            }
        }
        get globalAlpha() {
            let value = this.values.globalAlpha;
            if (value === undefined) {
                value = this.values.globalAlpha = this._canvasRenderingContext2D.globalAlpha;
            }
            return value;
        }
        set globalAlpha(value: number) {
            if (value !== this.globalAlpha) {
                this._canvasRenderingContext2D.globalAlpha = value;
                this.values.globalAlpha = value;
            }
        }
        get globalCompositeOperation() {
            let value = this.values.globalCompositeOperation;
            if (value === undefined) {
                value = this.values.globalCompositeOperation = this._canvasRenderingContext2D.globalCompositeOperation;
            }
            return value;
        }
        set globalCompositeOperation(value: string) {
            if (value !== this.globalCompositeOperation) {
                this._canvasRenderingContext2D.globalCompositeOperation = value;
                this.values.globalCompositeOperation = value;
            }
        }
        get imageSmoothingEnabled() {
            let value = this.values.imageSmoothingEnabled;
            if (value === undefined) {
                value = this.values.imageSmoothingEnabled = this._canvasRenderingContext2D.imageSmoothingEnabled;
            }
            return value;
        }
        set imageSmoothingEnabled(value: boolean) {
            if (value !== this.imageSmoothingEnabled) {
                this._canvasRenderingContext2D.imageSmoothingEnabled = value;
                this.values.imageSmoothingEnabled = value;
            }
        }
        // get lineCap() {
        //     let value = this.values.lineCap;
        //     if (value === undefined) {
        //         value = this.values.lineCap = this._canvasRenderingContext2D.lineCap;
        //     }
        //     return value;
        // }
        // set lineCap(value: string) {
        //     if (value !== this.lineCap) {
        //         this._canvasRenderingContext2D.lineCap = value;
        //         this.values.lineCap = value;
        //     }
        // }
        get lineDashOffset() {
            let value = this.values.lineDashOffset;
            if (value === undefined) {
                value = this.values.lineDashOffset = this._canvasRenderingContext2D.lineDashOffset;
            }
            return value;
        }
        set lineDashOffset(value: number) {
            if (value !== this.lineDashOffset) {
                this._canvasRenderingContext2D.lineDashOffset = value;
                this.values.lineDashOffset = value;
            }
        }
        // get lineJoin() {
        //     let value = this.values.lineJoin;
        //     if (value === undefined) {
        //         value = this.values.lineJoin = this._canvasRenderingContext2D.lineJoin;
        //     }
        //     return value;
        // }
        // set lineJoin(value: string) {
        //     if (value !== this.lineJoin) {
        //         this._canvasRenderingContext2D.lineJoin = value;
        //         this.values.lineJoin = value;
        //     }
        // }
        get lineWidth() {
            let value = this.values.lineWidth;
            if (value === undefined) {
                value = this.values.lineWidth = this._canvasRenderingContext2D.lineWidth;
            }
            return value;
        }
        set lineWidth(value: number) {
            if (value !== this.lineWidth) {
                this._canvasRenderingContext2D.lineWidth = value;
                this.values.lineWidth = value;
            }
        }
        get miterLimit() {
            let value = this.values.miterLimit;
            if (value === undefined) {
                value = this.values.miterLimit = this._canvasRenderingContext2D.miterLimit;
            }
            return value;
        }
        set miterLimit(value: number) {
            if (value !== this.miterLimit) {
                this._canvasRenderingContext2D.miterLimit = value;
                this.values.miterLimit = value;
            }
        }
        // get mozImageSmoothingEnabled() {
        //     let value = this.values.mozImageSmoothingEnabled;
        //     if (value === undefined) {
        //         value = this.values.mozImageSmoothingEnabled = this._canvasRenderingContext2D.mozImageSmoothingEnabled;
        //     }
        //     return value;
        // }
        // set mozImageSmoothingEnabled(value: boolean) {
        //     if (value !== this.mozImageSmoothingEnabled) {
        //         this._canvasRenderingContext2D.mozImageSmoothingEnabled = value;
        //         this.values.mozImageSmoothingEnabled = value;
        //     }
        // }
        // get msFillRule() {
        //     let value = this.values.msFillRule;
        //     if (value === undefined) {
        //         value = this.values.msFillRule = this._canvasRenderingContext2D.msFillRule;
        //     }
        //     return value;
        // }
        // set msFillRule(value: CanvasFillRule) {
        //     if (value !== this.msFillRule) {
        //         this._canvasRenderingContext2D.msFillRule = value;
        //         this.values.msFillRule = value;
        //     }
        // }
        // get oImageSmoothingEnabled() {
        //     let value = this.values.oImageSmoothingEnabled;
        //     if (value === undefined) {
        //         value = this.values.oImageSmoothingEnabled = this._canvasRenderingContext2D.oImageSmoothingEnabled;
        //     }
        //     return value;
        // }
        // set oImageSmoothingEnabled(value: boolean) {
        //     if (value !== this.oImageSmoothingEnabled) {
        //         this._canvasRenderingContext2D.oImageSmoothingEnabled = value;
        //         this.values.oImageSmoothingEnabled = value;
        //     }
        // }
        get shadowBlur() {
            let value = this.values.shadowBlur;
            if (value === undefined) {
                value = this.values.shadowBlur = this._canvasRenderingContext2D.shadowBlur;
            }
            return value;
        }
        set shadowBlur(value: number) {
            if (value !== this.shadowBlur) {
                this._canvasRenderingContext2D.shadowBlur = value;
                this.values.shadowBlur = value;
            }
        }
        get shadowColor() {
            let value = this.values.shadowColor;
            if (value === undefined) {
                value = this.values.shadowColor = this._canvasRenderingContext2D.shadowColor;
            }
            return value;
        }
        set shadowColor(value: string) {
            if (value !== this.shadowColor) {
                this._canvasRenderingContext2D.shadowColor = value;
                this.values.shadowColor = value;
            }
        }
        get shadowOffsetX() {
            let value = this.values.shadowOffsetX;
            if (value === undefined) {
                value = this.values.shadowOffsetX = this._canvasRenderingContext2D.shadowOffsetX;
            }
            return value;
        }
        set shadowOffsetX(value: number) {
            if (value !== this.shadowOffsetX) {
                this._canvasRenderingContext2D.shadowOffsetX = value;
                this.values.shadowOffsetX = value;
            }
        }
        get shadowOffsetY() {
            let value = this.values.shadowOffsetY;
            if (value === undefined) {
                value = this.values.shadowOffsetY = this._canvasRenderingContext2D.shadowOffsetY;
            }
            return value;
        }
        set shadowOffsetY(value: number) {
            if (value !== this.shadowOffsetY) {
                this._canvasRenderingContext2D.shadowOffsetY = value;
                this.values.shadowOffsetY = value;
            }
        }
        get strokeStyle() {
            let value = this.values.strokeStyle;
            if (value === undefined) {
                value = this.values.strokeStyle = this._canvasRenderingContext2D.strokeStyle as string;
            }
            return value;
        }
        set strokeStyle(value: string /*| CanvasGradient | CanvasPattern*/) {
            if (value !== this.strokeStyle) {
                this._canvasRenderingContext2D.strokeStyle = value;
                this.values.strokeStyle = value;
            }
        }
        get textAlign() {
            let value = this.values.textAlign;
            if (value === undefined) {
                value = this.values.textAlign = this._canvasRenderingContext2D.textAlign;
            }
            return value;
        }
        set textAlign(value: CanvasTextAlign) {
            if (value !== this.textAlign) {
                this._canvasRenderingContext2D.textAlign = value;
                this.values.textAlign = value;
            }
        }
        get textBaseline() {
            let value = this.values.textBaseline;
            if (value === undefined) {
                value = this.values.textBaseline = this._canvasRenderingContext2D.textBaseline;
            }
            return value;
        }
        set textBaseline(value: CanvasTextBaseline) {
            if (value !== this.textBaseline) {
                this._canvasRenderingContext2D.textBaseline = value;
                this.values.textBaseline = value;
            }
        }


        save() {
            this._canvasRenderingContext2D.save();
            this.valuesStack.push(this.values);
            this.values = {} as Cache.Values;
        }

        restore() {
            this._canvasRenderingContext2D.restore();
            this.values = this.valuesStack.pop();
        }
    }

    export namespace Cache {
        export interface Values {
            fillStyle: string | CanvasGradient /* | CanvasPattern*/;
            font: string;
            globalAlpha: number;
            globalCompositeOperation: string;
            imageSmoothingEnabled: boolean;
            // lineCap: string;
            lineDashOffset: number;
            // lineJoin: string;
            lineWidth: number;
            miterLimit: number;
            // mozImageSmoothingEnabled: boolean;
            // msFillRule: CanvasFillRule;
            // oImageSmoothingEnabled: boolean;
            shadowBlur: number;
            shadowColor: string;
            shadowOffsetX: number;
            shadowOffsetY: number;
            strokeStyle: string /*| CanvasGradient | CanvasPattern*/;
            textAlign: CanvasTextAlign;
            textBaseline: CanvasTextBaseline;
        }
    }
}
