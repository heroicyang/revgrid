/**
 * @summary Insert base stylesheet into DOM
 *
 * @desc Creates a new `<style>...</style>` element from the named text string(s) and inserts it but only if it does not already exist in the specified container as per `referenceElement`.
 *
 * > Caveat: If stylesheet is for use in a shadow DOM, you must specify a local `referenceElement`.
 *
 * @returns A reference to the newly created `<style>...</style>` element.
 *
 * @param cssRules
 * @param ID
 * @param referenceElement - Container for insertion. Overloads:
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 */
export function cssInjector(cssRules: string | string[], ID?: string, referenceElement?: null|Element|string) {
    if (typeof referenceElement === 'string') {
        referenceElement = document.querySelector(referenceElement);
        if (!referenceElement) {
            throw 'Cannot find reference element for CSS injection.';
        }
    } else if (referenceElement && !(referenceElement instanceof Element)) {
        throw 'Given value not a reference element.';
    }

    const container = referenceElement && referenceElement.parentNode || document.head || document.getElementsByTagName('head')[0];

    if (ID) {
        ID = idPrefix + ID;

        if (container.querySelector('#' + ID)) {
            return undefined; // stylesheet already in DOM
        }
    }

    const style = document.createElement('style');
    // style.type = 'text/css'; // default
    if (ID) {
        style.id = ID;
    }
    if (cssRules instanceof Array) {
        cssRules = cssRules.join('\n');
    }
    cssRules = '\n' + cssRules + '\n';
    style.appendChild(document.createTextNode(cssRules));

    if (referenceElement === undefined) {
        referenceElement = container.firstChild as Element;
    }

    container.insertBefore(style, referenceElement);

    return style;
}

/**
 * @summary Optional prefix for `<style>` tag IDs.
 * @desc Defaults to `'injected-stylesheet-'`.
 */
const idPrefix = 'injected-stylesheet-';
