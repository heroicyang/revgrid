import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { GridProperties } from '../grid-properties';
import { Revgrid } from '../revgrid';
import { Feature } from './feature';

export class CellClickFeature extends Feature {

    readonly typeName = CellClickFeature.typeName;

    override handleMouseMove(event: MouseCellEvent | undefined) {
        if (event !== undefined) {
            const link = event.columnProperties.link;
            const isActionableLink = link && typeof link !== 'boolean'; // actionable with truthy other than `true`

            this.cursor = isActionableLink ? 'pointer' : null;
        }

        super.handleMouseMove(event);
    }

    override handleClick(event: MouseCellEvent) {
        const consumed = (event.isDataCell) && (
            this.openLink(this.grid, event) !== undefined ||
            this.grid.cellClicked(event)
        );

        if (!consumed && this.next) {
            this.next.handleClick(event);
        }
    }

    /**
     * @summary Open the cell's URL.
     *
     * @desc The URL is found in the cell's {@link module:defaults.link|link} property, which serves two functions:
     * 1. **Renders as a link.** When truthy causes {@link SimpleCell} cell renderer to render the cell underlined with {@link module:defaults.linkColor|linkColor}. (See also {@link module:defaults.linkOnHover|linkOnHover} and {@link module:defaults.linkColorOnHover|linkColorOnHover}.) Therefore, setting this property to `true` will render as a link, although clicking on it will have no effect. This is useful if you wish to handle the click yourself by attaching a `'rev-click'` listener to your hypergrid.
     * 2. **Fetch the URL.** The value of the link property is interpreted as per {@link module:defaults.link|link}.
     * 3. **Decorate the URL.** The cell name (_i.e.,_ the data column name) and cell value are merged into the URL wherever the respective substrings `'%name'` and `'%value'` are found. For example, if the column name is "age" and the cell value is 6 (or a function returning 25), and the link is `'http://www.abc.com?%name=%value'`, then the actual link (first argument given to `grid.windowOpen`) would be `'http://www.abc.com?age=25'`.
     * 4. **Open the URL.** The link is then opened by {@link Hypergrid#windowOpen|grid.windowOpen}. If `link` is an array, it is "applied" to `grid.windowOpen` in its entirety; otherwise, `grid.windowOpen` is called with the link as the first argument and {@link module:defaults.linkTarget|linkTarget} as the second.
     * 5. **Decorate the link.** On successful return from `windowOpen()`, the text is colored as "visited" as per the cell's {@link module:defaults.linkVisitedColor|linkVisitedColor} property (by setting the cell's `linkColor` property to its `linkVisitedColor` property).

     * @returns One of:
     *
     * | Value | Meaning |
     * | :---- | :------ |
     * | `undefined` | no link to open |
     * | `null` | `grid.windowOpen` failed to open a window |
     * | _otherwise_ | A `window` reference returned by a successful call to `grid.windowOpen`. |
     */
    openLink(grid: Revgrid, cellEvent: CellEvent): boolean | null | undefined | Window {
        let result: boolean | null | undefined | Window;
        let unknownUrl: unknown;
        const dataRow = cellEvent.dataRow;
        const config = Object.create(cellEvent.columnProperties, { dataRow: { value: dataRow } });
        const value = cellEvent.value;
        const linkProp = cellEvent.columnProperties.link;

        let linkPropTuple: GridProperties.LinkProp | undefined;
        let link: boolean | string | GridProperties.LinkFunction;
        if (Array.isArray(linkProp)) {
            link = linkProp[0];
            linkPropTuple = linkProp;
        } else {
            link = linkProp;
        }

        // STEP 2: Fetch the URL
        switch (typeof link) {
            case 'string':
                if (link === '*') {
                    unknownUrl = value;
                } else if (/^\w+$/.test(link)) {
                    unknownUrl = dataRow[link];
                }
                break;

            case 'function':
                unknownUrl = link(cellEvent);
                break;
        }

        if (unknownUrl !== undefined) {
            // STEP 3: Decorate the URL
            const url = unknownUrl.toString().replace(/%name/g, config.name).replace(/%value/g, value as string);

            // STEP 4: Open the URL
            if (linkPropTuple !== undefined) {
                linkProp[0] = url;
                result = grid.windowOpen(...linkPropTuple);
            } else {
                result = grid.windowOpen(url, cellEvent.columnProperties.linkTarget);
            }
        }

        // STEP 5: Decorate the link as "visited"
        if (result) {
            cellEvent.setCellProperty('linkColor', grid.properties.linkVisitedColor);
            grid.renderer.resetCellPropertiesCache(cellEvent);
            grid.repaint();
        }

        return result;
    }
}

export namespace CellClickFeature {
    export const typeName = 'cellclick';
}
