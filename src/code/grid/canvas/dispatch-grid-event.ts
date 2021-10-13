import { EventName } from '../event/event-name';
import { newEvent } from '../event/event-util';
import { Revgrid } from '../revgrid';

// const wantedDetailFields = [
//     'gridCell',
//     'dataCell',
//     'mousePoint',
//     'gridPoint',
//     'clientPoint',
//     'pagePoint',
//     'keys',
//     'row'
// ];

/**
 * @param cancelable - Event implements `preventDefault()`.
 */
export function dispatchGridEvent<T extends EventName>(
    grid: Revgrid,
    eventName: T,
    cancelable: boolean,
    eventDetail: EventName.DetailMap[T],
): boolean {
    if (grid.destroyed) {
        return false;
    }

    // let eventInitDictOrDetail: DispatchGridEvent.EventInitDictOrDetail;
    // if (eventDetail === undefined) {
    //     eventInitDictOrDetail = {};
    // } else {
    //     if (eventDetail instanceof CustomEvent) {
    //         eventInitDictOrDetail = Object({});
    //         throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [1]');
    //     } else {
    //         eventInitDictOrDetail = eventDetail;
    //     }
    // }

    // if (!("type" in eventInitDictOrDetail)) {
    //     (eventInitDictOrDetail as DispatchGridEvent.ExtraDetail).type = eventName;
    // }

    // let eventInitDict: CustomEventInit<DispatchGridEvent.ExtraDetail>;

    // if (!("detail" in eventInitDictOrDetail)) {
    //     eventInitDict = {
    //         detail: eventInitDictOrDetail as DispatchGridEvent.ExtraDetail,
    //     };
    // } else {
    //     eventInitDict = eventInitDictOrDetail as CustomEventInit<DispatchGridEvent.ExtraDetail>;
    //     throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [2]');
    // }

    // const detail = eventInitDict.detail;

    // if (!detail.grid) {
    //     // CellEvent objects already have a (read-only) `grid` prop
    //     detail.grid = grid;
    // }

    // detail.time = Date.now();

    // if (primitiveEvent !== undefined) {
    //     if (!detail.primitiveEvent) {
    //         detail.primitiveEvent = primitiveEvent;
    //     }
    //     wantedDetailFields.forEach((key) => {
    //         if (key in primitiveEvent && !(key in detail)) {
    //             detail[key] = primitiveEvent[key] as unknown;
    //         }
    //     });
    //     if ("dataRow" in primitiveEvent) {
    //         // reference (without invoking) cellEvent's `dataRow` getter when available
    //         Object.defineProperty(detail, "row", {
    //             get: function () {
    //                 return primitiveEvent.dataRow;
    //             },
    //         });
    //     }
    // }

    // eventInitDict.cancelable = cancelable;

    const event = newEvent(eventName, eventDetail, cancelable);
    return grid.canvas.dispatchEvent(event);
}

export namespace DispatchGridEvent {

    // Extra properties added to Event Detail
    // export interface ExtraDetail {
    //     type: string;
    //     grid: Hypegrid;
    //     time: number;
    //     primitiveEvent: CellEvent | MouseEvent | KeyboardEvent | Point;

    //     gridCell: WritablePoint,
    //     dataCell: WritablePoint,
    //     mousePoint: Point,
    //     gridPoint: Point,
    //     clientPoint: Point,
    //     pagePoint: Point,
    //     keys: string[],
    //     row: unknown,
    // }

    // export type UntypedEventInitDictOrDetail =
    //     | CustomEventInit
    //     | EventDetail.Resize
    //     | EventDetail.Keyboard
    //     | EventDetail.Touch
    //     | CellEditor.EventDetail
    //     | EventDetail.ColumnSortDetail
    //     | SelectionDetail
    //     | EventDetail.GridDetail
    //     | EventDetail.ScrollDetail
    //     | EventDetail.RowDataInvalidatedDetail
    //     | EventDetail.CellDataInvalidatedDetail
    //     | CellEvent;

    // export type EventInitDictOrDetail = UntypedEventInitDictOrDetail | ExtraDetail;
}
