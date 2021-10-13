/** @public */
export const enum HalignEnum {
    'left' = 'left',
    'right' = 'right',
    'center' = 'center',
    'start' = 'start',
    'end' = 'end'
}

/** @public */
export type Halign = keyof typeof HalignEnum;

/** @public */
export const enum TextTruncateType {
    WithEllipsis,
    BeforeLastPartiallyVisibleCharacter,
    AfterLastPartiallyVisibleCharacter,
}

/** @public */

export const enum HorizontalWheelScrollingAllowed {
    Never,
    Always,
    CtrlKeyDown,
}

/** @public */
export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};
