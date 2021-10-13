// var automat = require('automat');
import { automat } from './automat';

/**
 * @summary Injects the named stylesheet into `<head>`.
 * @desc Stylesheets are inserted consecutively at end of `<head>` unless `before === true` (or omitted and `injectStylesheetTemplate.before` truthy) in which case they are inserted consecutively before first stylesheet found in `<head>` (if any) at load time.
 *
 * The calling context (`this`) is a stylesheet registry.
 * If `this` is undefined, the global stylesheet registry (css/index.js) is used.
 * @this {object}
 * @param {boolean} [before=injectStylesheetTemplate.before] - Add stylesheet before intially loaded stylesheets.
 *
 * _If omitted:_
 * 1. `id` is promoted to first argument position
 * 2. `injectStylesheetTemplate.before` is `true` by default
 * @param {string} id - The name of the style sheet in `this`, a stylesheet "registry" (hash of stylesheets).
 * @returns {Element|*}
 */
export function injectStylesheetTemplate(callingContext: Record<string, unknown>, before: boolean, id: string, ...replacements: unknown[]): HTMLElement {
    let stylesheet: HTMLElement;
    let head: HTMLHeadElement;
    let refNode: Node;
    let css: string;
    const prefix = injectStylesheetTemplate.prefix;

    stylesheet = document.getElementById(prefix + id);

    if (!stylesheet) {
        head = document.querySelector('head');

        if (before) {
            // note position of first stylesheet

            refNode = Array.prototype.slice.call(head.children).find(
                (child) => {
                    const id = child.getAttribute('id');
                    return child.tagName === 'STYLE' && (!id || id.indexOf(prefix) !== prefix) ||
                        child.tagName === 'LINK' && child.getAttribute('rel') === 'stylesheet';
                }
            );
        }

        css = callingContext[id] as string;

        if (!css) {
            throw 'Expected to find member `' + id + '` in calling context.';
        }

        const template = '<style>\n' + css + '\n</style>\n';

        stylesheet = automat.append(template, head, refNode ?? null, ...replacements)[0] as HTMLElement;
        stylesheet.id = prefix + id;
    }

    return stylesheet;
}

injectStylesheetTemplate.before = true;
injectStylesheetTemplate.prefix = 'injected-stylesheet-';
