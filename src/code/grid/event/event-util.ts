import { EventName } from './event-name';



export function newEvent<T extends EventName>(eventName: T, detail: EventName.DetailMap[T], cancelable?: boolean) {
    const eventInit: CustomEventInit<EventName.DetailMap[T]> = {
        detail,
        cancelable,
    };

    const event = new CustomEvent<EventName.DetailMap[T]>(eventName, eventInit);

    return event;
}
