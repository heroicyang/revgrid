import { DateFormatter } from '../lib/localization';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

const isChromium: boolean | undefined = undefined; // window.chrome;
const winNav = window.navigator;
const vendorName = winNav.vendor;
const isOpera = winNav.userAgent.indexOf('OPR') > -1;
const isIEedge = winNav.userAgent.indexOf('Edge') > -1;
const isIOSChrome = winNav.userAgent.match('CriOS');
const isChrome = !isIOSChrome &&
        isChromium !== null &&
        isChromium !== undefined &&
        vendorName === 'Google Inc.' &&
        isOpera == false && isIEedge == false; // eslint-disable-line eqeqeq
const  template = isChrome ? '<input type="date">' : '<input type="text" lang="{{locale}}">';

export class Date extends CellEditor {
    /**
     * As of spring 2016:
     * Functions well in Chrome except no localization (day, month names; date format).
     * Unimplemented in Safari, Firefox, Internet Explorer.
     * This is a "snmart" control. It detects Chrome:
     * * If Chrome, uses chromeDate overrides format to that required by the value attribute, yyyy-mm-dd. (Note that this is not the format displayed in the control, which is always mm/dd/yyyy.)
     * * Otherwise uses localized date format _but_ falls back to a regular text box.
     * @constructor
     * @extends CellEditor
     */


    constructor(grid: Revgrid) {
        super(grid, undefined, template);

        if (this.localizer === undefined) {
            let localizerName: string;
            const usesDateInputControl = isChrome;

            if (usesDateInputControl) {
                localizerName = DateFormatter.chromeType;
            } else {
                localizerName = DateFormatter.type;

                this.selectAll = function() {
                    const lastCharPlusOne = this.getEditorValue().length;
                    this.input.setSelectionRange(0, lastCharPlusOne);
                };
            }

            this.localizer = grid.localization.get(localizerName);
        }
    }
}

export namespace Date {
    export const typeName = 'Date';
}
