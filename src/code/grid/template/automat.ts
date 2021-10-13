/** @module automat */

const ENCODERS = /%\{(\d+)\}/g; // double $$ to encode

const REPLACERS = /\$\{(.*?)\}/g; // single $ to replace


/**
 * @summary String formatter.
 *
 * @desc String substitution is performed on numbered _replacer_ patterns like `${n}` or _encoder_ patterns like `%{n}` where n is the zero-based `arguments` index. So `${0}` would be replaced with the first argument following `text`.
 *
 * Encoders are just like replacers except the argument is HTML-encoded before being used.
 *
 * To change the format patterns, assign new `RegExp` patterns to `automat.encoders` and `automat.replacers`.
 *
 * @param template - A template to be formatted as described above. Overloads:
 * * A string primitive containing the template.
 * * A function to be called with `this` as the calling context. The template is the value returned from this call.
 *
 * @param replacements - Replacement values for numbered format patterns.
 *
 * @return The formatted text.
 */
export function automat(template: string | ((arg0: unknown) => string), ...replacements: unknown[]): string {
    const hasReplacements = replacements.length > 0;

    // if `template` is a function, convert it to text
    if (typeof template === 'function') {
        template = template(null /*this*/); // non-template function: call it with context and use return value
    }

    if (hasReplacements) {
        template = template.replace(automat.replacersRegex, (match, key) => {
            key -= 0; // convert to number
            return replacements.length > key ? (replacements[key] as string): '';
        });

        template = template.replace(automat.encodersRegex, (match, key) => {
            key -= 0; // convert to number
            if (replacements.length > key) {
                const htmlEncoderNode = document.createElement('DIV');
                htmlEncoderNode.textContent = replacements[key] as string;
                return htmlEncoderNode.innerHTML;
            } else {
                return '';
            }
        });
    }

    return template;
}

export namespace automat {
    /**
     * @summary Finds string substitution lexemes that require HTML encoding.
     * @desc Modify to suit.
     * @default %{n}
     * @type {RegExp}
     */
    export const encodersRegex: RegExp = ENCODERS;

    /**
     * @summary Finds string substitution lexemes.
     * @desc Modify to suit.
     * @default ${n}
     * @type {RegExp}
     */
    export const replacersRegex: RegExp = REPLACERS;

    export type TemplateFunction = (arg0: unknown) => string;

    export const format = automat; // if you find using just `automat()` confusing

    /**
     * @summary Replace contents of `el` with `Nodes` generated from formatted template.
     *
     * @param template - See `template` parameter of {@link automat}.
     *
     * @param el - Node in which to return markup generated from template. If omitted, a new `<div>...</div>` element will be created and returned.
     *
     * @param replacements - Replacement values for numbered format patterns.
     *
     * @return The `el` provided or a new `<div>...</div>` element, its `innerHTML` set to the formatted text.
     */
    export function replace(template: string | TemplateFunction, el: HTMLElement | undefined, ...replacements: unknown[]): HTMLElement {
        if (typeof el !== 'object') {
            el = document.createElement('DIV');
        }

        el.innerHTML = automat(template, ...replacements);

        return el;
    }

    /**
     * @summary Append or insert `Node`s generated from formatted template into given `el`.
     *
     * @param template - See `template` parameter of {@link automat}.
     *
     * @param el
     *
     * @param referenceNode Inserts before this element within `el` or at end of `el` if `null`.
     *
     * @param replacements - Replacement values for numbered format patterns.
     *
     * @returns Array of the generated nodes (this is an actual Array instance; not an Array-like object).
     */
    export function append(template: string | TemplateFunction, el: HTMLElement | undefined, referenceNode: Node, ...replacements: unknown[]): Node[] {
        const result = [];
        const div = replace(template, el, ...replacements);

        while (div.childNodes.length) {
            result.push(div.firstChild);
            el.insertBefore(div.firstChild, referenceNode); // removes child from div
        }

        return result;
    }

    /**
     * Use this convenience wrapper to return the first child node described in `template`.
     *
     * @param template - If a function, extract template from comment within.
     *
     * @returns The first `Node` in your template.
     */
    export function firstChild(template: string | TemplateFunction, ...replacements: unknown[]): HTMLElement {
        return replace(template, undefined, ...replacements).firstChild as HTMLElement;
    }

    /**
     * Use this convenience wrapper to return the first child element described in `template`.
     *
     * @param template - If a function, extract template from comment within.
     *
     * @returns The first `HTMLElement` in your template.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function firstElement(template: string | TemplateFunction, ...replacements: unknown[]): HTMLElement {
        return replace(template, undefined, ...replacements).firstElementChild as HTMLElement;
    }
}
